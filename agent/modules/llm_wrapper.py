import logging
from livekit.agents import llm
from .code_store import CodeStore

logger = logging.getLogger("voice-agent")

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
