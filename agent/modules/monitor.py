import logging
import asyncio
import time
from livekit.agents import llm
from .code_store import CodeStore
from livekit.agents import Agent

logger = logging.getLogger("voice-agent")

# --- Mock Classes to bypass ChatContext strictness ---
class _MockMsg:
    def __init__(self, role, content):
        self.role = role
        self.content = content
        # 'type' is required by some plugins (e.g. Groq) which iterate items
        self.type = "chat_message" 

class _MockCtx:
    def __init__(self):
        self._messages = []
    
    @property
    def messages(self):
        return self._messages
        
    @property
    def items(self):
        return self._messages

    def append(self, text, role):
        self._messages.append(_MockMsg(role, text))
# -----------------------------------------------------

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
                # Use Mock Context to avoid AttributeError on strict ChatContext
                chat_ctx = _MockCtx()
                chat_ctx.append(text=prompt, role="user")
                
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
                        await agent.session.generate_reply(instructions=f"Say exactly this to the user: {response}")

                except Exception as e:
                    logger.warning(f"Monitor LLM failed: {e}")

        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Monitor loop error: {e}")
            await asyncio.sleep(5)
