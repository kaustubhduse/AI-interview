import logging
import os
import asyncio
import json
import time
from dotenv import load_dotenv

from livekit.agents import (AutoSubscribe, JobContext, WorkerOptions, cli, Agent, AgentSession, llm)
from livekit.plugins import groq, deepgram, silero
from livekit.rtc import room as rtc_room, DataPacket

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voice-agent")

def _patch_livekit_room_keyerror() -> None:
    if getattr(rtc_room.Room, "_keyerror_patched", False):
        return

    original = rtc_room.Room._on_room_event

    def _safe_on_room_event(self, room_event):
        try:
            return original(self, room_event)
        except KeyError as e:
            logger.warning(f"LiveKit KeyError suppressed: {e}", exc_info=True)
            return None

    rtc_room.Room._on_room_event = _safe_on_room_event
    rtc_room.Room._keyerror_patched = True

# --------------------------------------------------
# Simple in-memory code store
# --------------------------------------------------
class CodeStore:
    def __init__(self):
        self.latest_code = "// No code written yet"
        self.last_update = time.time()

    def update(self, code: str):
        self.latest_code = code
        self.last_update = time.time()

    def get(self) -> str:
        return self.latest_code

# --------------------------------------------------
# Proactive Monitor
# --------------------------------------------------
async def proactive_monitor_task(code_store: CodeStore, agent: Agent, llm_engine):
    logger.info("Proactive monitor started.")
    last_analyzed_time = 0
    
    while True:
        try:
            await asyncio.sleep(2) 
            
            # Safety: Wait for session to be ready
            if not getattr(agent, "session", None):
                continue
            
            # Debounce: Code must be stable for 4 seconds
            now = time.time()
            if now - code_store.last_update > 4 and code_store.last_update > last_analyzed_time:
                last_analyzed_time = now
                code = code_store.get()
                
                if len(code) < 50: 
                    continue

                # Quick analysis prompt
                prompt = f"""
You are a code monitor. Analyze the user's current code:
-----
{code}
-----
Check for:
1. CRITICAL logical errors (infinite loops, undefined vars).
2. If the solution is COMPLETELY FINISHED and correct.

Output ONLY:
- A SHORT polite sentence if there's a critical error (e.g. "Just a heads up, that loop looks infinite.").
- "It looks like you're done. Want to run tests?" if finished.
- "IGN" if incomplete or minor issues.
"""
                # Use base LLM to analyze silently
                from livekit.agents import llm
                # Use base LLM to analyze silently
                from livekit.agents import llm
                chat_ctx = llm.ChatContext()
                chat_ctx.messages.append(llm.ChatMessage(role="user", content=prompt))
                
                try:
                    stream = await llm_engine.chat(chat_ctx=chat_ctx)
                    response = ""
                    async for chunk in stream:
                        if chunk.choices and chunk.choices[0].delta.content:
                            response += chunk.choices[0].delta.content
                    
                    response = response.strip()
                    logger.info(f"Monitor Analysis: {response}")

                    if response and "IGN" not in response and len(response) > 5:
                        # Interrupt/Speak proactively
                        logger.info(f"Proactive Intervention: {response}")
                        # We use generate_reply to inject this "thought" as a speech action
                        # instructions force the agent to say this specific text
                        await agent.session.generate_reply(instructions=f"Say exactly this to the user: {response}")

                except Exception as e:
                    logger.warning(f"Monitor LLM failed: {e}")

        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Monitor loop error: {e}")
            await asyncio.sleep(5)


class InterviewAgent(Agent):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.code_store = CodeStore()

    def on_job(self, job_ctx: JobContext):
        logger.info(f"InterviewAgent.on_job called with job_ctx: {job_ctx}")
        self.code_store.update(job_ctx.data.get("code", "// No code written yet"))

class ContextAwareLLM(llm.LLM):
    def __init__(self, base_llm: llm.LLM, code_store: CodeStore):
        super().__init__()
        self.base_llm = base_llm
        self.code_store = code_store

    def chat(self, chat_ctx, fnc_ctx=None, **kwargs):
        logger.info(f"ContextAwareLLM.chat called with kwargs: {kwargs.keys()}")
        if chat_ctx:
             logger.info(f"chat_ctx type: {type(chat_ctx)}")
        current_code = self.code_store.get().replace("\r\n", "\n")
        
        messages = getattr(chat_ctx, "messages", getattr(chat_ctx, "_items", []))
        logger.info(f"ChatContext messages count: {len(messages)}")
        if messages:
             logger.info(f"Last message role: {messages[-1].role}")
        
        if hasattr(chat_ctx, "messages"):
            for msg in chat_ctx.messages[:-1]:
                if msg.role == "user" and isinstance(msg.content, str):
                    if "USER'S CURRENT EDITOR STATE:" in msg.content:
                        msg.content = msg.content.split("USER'S CURRENT EDITOR STATE:")[0].strip()
                        logger.info("Cleaned up old code context from history")

        if messages and messages[-1].role == "user":
            last_msg = messages[-1]
            original_content = last_msg.content
            logger.info(f"Last message content type: {type(original_content)}")
            
            max_code_len = 1500
            display_code = current_code
            if len(display_code) > max_code_len:
                display_code = display_code[:max_code_len] + "\n... (truncated)"
            
            context_str = f"""
USER'S CURRENT EDITOR STATE:
----- BEGIN CODE -----
{display_code}
----- END CODE -----
(Treat this code as the *real-time* context of what the user is seeing/typing. Provide hints if buggy.)
"""
            
            if isinstance(original_content, str):
                if "USER'S CURRENT EDITOR STATE:" not in original_content:
                    last_msg.content = original_content + "\n" + context_str
                    logger.info(f"Injected code context ({len(display_code)} chars) into string content.")
            elif isinstance(original_content, list):
                logger.info("Content is list, attempting to append context.")
                try:
                    already_has_code = False
                    for item in last_msg.content:
                        if isinstance(item, str) and "USER'S CURRENT EDITOR STATE:" in item:
                            already_has_code = True
                            break
                    
                    if not already_has_code:
                        last_msg.content.append(context_str) 
                        logger.info("Appended context to content list.")
                except Exception as e:
                     logger.error(f"Failed to modify list content: {e}")
            else:
                logger.warning(f"Unknown content type {type(original_content)}, skipping injection.")
        if fnc_ctx:
             logger.warning("fnc_ctx provided but Groq LLM does not support it. It will be ignored.")

        logger.info("Calling base_llm.chat...")
        try:
            result = self.base_llm.chat(chat_ctx=chat_ctx, **kwargs)
            logger.info(f"base_llm.chat returned: {type(result)}")
            return result
        except Exception as e:
            logger.error(f"Error in base_llm.chat: {e}", exc_info=True)
            raise

class InterviewAgent(Agent):
    def __init__(
        self,
        problem_title: str,
        problem_description: str,
        problem_difficulty: str,
    ):
        super().__init__(
            instructions=f"""
You are a technical interviewer for a coding platform.

You will receive the candidate's current code as RAW TEXT
between BEGIN CODE and END CODE markers in the user's message.

Problem:
Title: {problem_title}
Difficulty: {problem_difficulty}
Description: {problem_description}

INTERVIEW PROCESS:
1. **Approach**: First, ask the candidate to briefly explain their approach.
2. **Coding**: Once satisfied with the approach, ask them to write the code in the editor.
3. **Review**: actively monitor the code provided in the context.

4. **Restraint**: 
   - NEVER suggest implementation details (like "swap", "hash map", "recursion") unless the candidate mentions them first.
   - If their approach is vague (e.g., "I'll use two pointers"), ask: "How exactly will those pointers manipulate the data?"
   - Do NOT finish their sentences or fill in the logic for them. Make THEM say it.

GUIDANCE RULES:
- **Mistakes**: If the code is going wrong (logic errors, bugs), stop them gently. Tell them to "think about [specific aspect]".
- **Hints**: Give *small* hints only if they are stuck. Never provide the full solution or big chunks of code.
- **Completion**: Once the solution is correct and optimal, explicitly say: "This looks great. That is all from my side, you can end the call now."

Be professional, concise, and helpful, but rigorous.
"""
        )

        self.problem_title = problem_title
        self.problem_description = problem_description
        self.problem_difficulty = problem_difficulty

    async def on_enter(self):
        await self.session.generate_reply(
            instructions=f"""
You are starting the interview.

1. Greet the candidate.
2. Present the problem clearly:
   "{self.problem_title}: {self.problem_description}"
3. Ask them: "Could you briefly explain your approach before coding?"
"""
        )



async def entrypoint(ctx: JobContext):
    logger.info("Starting voice agent...")

    _patch_livekit_room_keyerror()

    if not os.getenv("GROQ_API_KEY"):
        raise RuntimeError("Missing GROQ_API_KEY")
    if not os.getenv("DEEPGRAM_API_KEY"):
        raise RuntimeError("Missing DEEPGRAM_API_KEY")

    await ctx.connect()

    code_store = CodeStore()

    def on_data_received(*args, **kwargs):
        try:
            arg_types = [type(a) for a in args]
            logger.info(f"DATA_RECEIVED Triggered. Args: {len(args)} types: {arg_types} kwargs: {kwargs}")
            
            payload_data = None
            topic = None
            
            if len(args) > 0:
                first_arg = args[0]
                if isinstance(first_arg, DataPacket) or (hasattr(first_arg, 'data') and hasattr(first_arg, 'topic')):
                    logger.info("Received DataPacket")
                    payload_data = first_arg.data
                    topic = first_arg.topic
                elif len(args) >= 3:
                    logger.info("Received legacy arguments")
                    payload_data = args[0]
                    if len(args) >= 4:
                        topic = args[3]
            
            logger.info(f"Parsed - Topic: {topic} Payload Size: {len(payload_data) if payload_data else 0}")
            
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
            else:
                logger.info(f"Ignored data. Topic match? {topic == 'code_update'}")

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
    logger.info(f"Initial participants: {[p.identity for p in ctx.room.remote_participants.values()]}")

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
    # Ensure shared code store
    agent.code_store = code_store
    
    # Start proactive monitor
    monitor_task = asyncio.create_task(proactive_monitor_task(code_store, agent, base_llm))
    
    try:
        await session.start(agent=agent, room=ctx.room)
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
