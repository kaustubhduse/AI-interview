import logging
import os
import asyncio
import json
from dotenv import load_dotenv
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, Agent, AgentSession, inference
from livekit.plugins import groq, deepgram, elevenlabs, silero

load_dotenv()

logger = logging.getLogger("voice-agent")

class InterviewAgent(Agent):
    """Technical Interview Agent that asks coding questions and provides feedback"""
    
    def __init__(self, problem_title: str, problem_description: str, problem_difficulty: str) -> None:
        super().__init__(
            instructions=f"""
You are a technical interviewer for a coding platform.
You are patient, professional, and rigorous.

The problem for this interview is:
Title: {problem_title}
Difficulty: {problem_difficulty}
Description: {problem_description}

Your role:
1. Present this exact problem to the candidate clearly
2. Listen to their approach and ask clarifying questions
3. Challenge edge cases and complexity
4. Ask follow-up questions about their solution
5. Continue the conversation until the candidate says "End the interview" or "I'm done"

Important: Be conversational and engaging. Don't give away answers directly - provide hints instead.
"""
        )
        self.problem_title = problem_title
        self.problem_description = problem_description
        self.problem_difficulty = problem_difficulty
    
    async def on_enter(self):
        """Called when agent enters the room - triggers initial greeting"""
        logger.info(f"🎤 Agent presenting problem: {self.problem_title}")
        
        # Generate greeting with the specific problem
        greeting_instructions = f"""
You are starting a technical interview.

1. Greet the candidate warmly and professionally
2. Present this EXACT problem clearly:
   
   Title: {self.problem_title}
   Difficulty: {self.problem_difficulty}
   Description: {self.problem_description}

3. After presenting the problem, ask the candidate to explain their initial approach before coding

Be encouraging and supportive. Speak clearly and wait for their response.
"""
        
        await self.session.generate_reply(instructions=greeting_instructions)

async def entrypoint(ctx: JobContext):
    logger.info("Starting voice agent...")
    
    # Validate env vars
    keys = {
        "ELEVENLABS_API_KEY": os.getenv("ELEVENLABS_API_KEY"),
        "GROQ_API_KEY": os.getenv("GROQ_API_KEY"),
        "DEEPGRAM_API_KEY": os.getenv("DEEPGRAM_API_KEY"),
    }
    
    missing = [k for k, v in keys.items() if not v]
    if missing:
        logger.error(f"MISSING ENVIRONMENT VARIABLES: {', '.join(missing)}")
        raise ValueError(f"Missing keys: {', '.join(missing)}")
    
    logger.info("All environment variables present")
    
    # 1. Connect to room FIRST to get metadata
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    logger.info("Connected to room, waiting for metadata sync...")
    
    # 2. Wait for room metadata to be available (CRITICAL for problem sync)
    await asyncio.sleep(1.0) 
    
    # 3. Read problem from room metadata
    problem_title = "Two Sum"  # Default
    problem_description = "Given an array of integers, return indices of two numbers that add up to a target"
    problem_difficulty = "Easy"
    
    try:
        room_metadata = ctx.room.metadata
        logger.info(f"📋 Room metadata: {room_metadata}")
        
        if room_metadata:
            metadata = json.loads(room_metadata)
            problem_title = metadata.get("problemTitle", problem_title)
            problem_description = metadata.get("problemDescription", problem_description)
            problem_difficulty = metadata.get("problemDifficulty", problem_difficulty)
            
            logger.info(f"✓ Loaded problem: {problem_title} ({problem_difficulty})")
        else:
            logger.warning("⚠️ Room metadata is empty! Using default problem.")
    except Exception as e:
        logger.error(f"Failed to parse room metadata: {e}")
        logger.info("Using default problem")
    
    # Initialize AgentSession with all components
    session = AgentSession(
        stt=deepgram.STT(
            api_key=os.getenv("DEEPGRAM_API_KEY"),
            model="nova-2-general"
        ),
        llm=groq.LLM(
            api_key=os.getenv("GROQ_API_KEY"),
            model="llama-3.3-70b-versatile" 
        ),
        # Using Deepgram TTS to avoid ElevenLabs quota issues
        tts=deepgram.TTS(),
        vad=silero.VAD.load()
    )
    
    # Create agent with problem data
    agent = InterviewAgent(
        problem_title=problem_title,
        problem_description=problem_description,
        problem_difficulty=problem_difficulty
    )
    
    # Start session with agent AND room
    await session.start(agent=agent, room=ctx.room)
    
    logger.info("Voice agent session started successfully")

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
