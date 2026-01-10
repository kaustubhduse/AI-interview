import logging
import os
import asyncio
import json
from dotenv import load_dotenv

from livekit.agents import (AutoSubscribe, JobContext, WorkerOptions, cli, AgentSession)
from livekit.plugins import groq, deepgram, silero
from livekit.rtc import DataPacket

from modules.utils import patch_livekit_room_keyerror
from modules.code_store import CodeStore
from modules.llm_wrapper import ContextAwareLLM
from modules.interview_agent import InterviewAgent
from modules.monitor import proactive_monitor_task

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voice-agent")

async def entrypoint(ctx: JobContext):
    logger.info("Starting voice agent...")

    patch_livekit_room_keyerror()

    if not os.getenv("GROQ_API_KEY"):
        raise RuntimeError("Missing GROQ_API_KEY")
    if not os.getenv("DEEPGRAM_API_KEY"):
        raise RuntimeError("Missing DEEPGRAM_API_KEY")

    await ctx.connect()

    code_store = CodeStore()

    def on_data_received(*args, **kwargs):
        try:
            payload_data = None
            topic = None
            
            if len(args) > 0:
                first_arg = args[0]
                if isinstance(first_arg, DataPacket) or (hasattr(first_arg, 'data') and hasattr(first_arg, 'topic')):
                    payload_data = first_arg.data
                    topic = first_arg.topic
                elif len(args) >= 3:
                     payload_data = args[0]
                     if len(args) >= 4:
                        topic = args[3]
            
            
            if topic == "code_update" and payload_data:
                decoded = payload_data.decode("utf-8") if isinstance(payload_data, bytes) else payload_data
                try:
                    payload = json.loads(decoded)
                    code = payload.get("code")
                    if code is not None:
                        code_store.update(code)
                        logger.info(f"Code synced successfully. Length: {len(code)} chars")
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to decode JSON payload: {e}")

        except Exception as e:
            logger.error(f"CRITICAL Error in on_data_received: {e}", exc_info=True)

    ctx.room.on("data_received", on_data_received)

    @ctx.room.on("participant_connected")
    def on_participant_connected(participant):
        logger.info(f"Participant Connected: {participant.identity} (sid: {participant.sid})")

    @ctx.room.on("participant_disconnected")
    def on_participant_disconnected(participant):
        logger.info(f"Participant Disconnected: {participant.identity} (sid: {participant.sid})")

    logger.info(f"Agent connected to room: {ctx.room.name} (sid: {ctx.room.sid})")
    
    await asyncio.sleep(1)

    problem_title = "Two Sum"
    problem_description = (
        "Given an array of integers, return indices of two numbers that add up to a target."
    )
    problem_difficulty = "Easy"

    try:
        if ctx.room.metadata:
            metadata = json.loads(ctx.room.metadata)
            problem_title = metadata.get("problemTitle", problem_title)
            problem_description = metadata.get("problemDescription", problem_description)
            problem_difficulty = metadata.get("problemDifficulty", problem_difficulty)
    except Exception as e:
        logger.warning(f"Failed to parse room metadata: {e}")

    base_llm = groq.LLM(
        api_key=os.getenv("GROQ_API_KEY"),
        model="llama-3.1-8b-instant",
    )
    wrapped_llm = ContextAwareLLM(base_llm, code_store)

    session = AgentSession(
        stt=deepgram.STT(
            api_key=os.getenv("DEEPGRAM_API_KEY"),
            model="nova-2-general",
        ),
        llm=wrapped_llm,
        tts=deepgram.TTS(),
        vad=silero.VAD.load(),
    )
    
    agent = InterviewAgent(
        problem_title,
        problem_description,
        problem_difficulty,
    )
    agent.code_store = code_store
    
    monitor_task = asyncio.create_task(proactive_monitor_task(code_store, agent, base_llm))
    
    try:
        await session.start(agent=agent, room=ctx.room)
        await agent.say_greeting()
    finally:
        monitor_task.cancel()
        try:
            await monitor_task
        except asyncio.CancelledError:
            pass

    logger.info("Voice agent session ended")


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint
        )
    )
