from livekit.agents import Agent

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
        self.code_store = None

    async def on_enter(self, job_ctx=None):
        # Kept for compatibility if base class calls it, but primarily we use say_greeting
        pass

    async def say_greeting(self):
        if self.session:
             await self.session.generate_reply(
                instructions=f"""
You are starting the interview.

1. Greet the candidate.
2. Present the problem clearly:
   "{self.problem_title}: {self.problem_description}"
3. Ask them: "Could you briefly explain your approach before coding?"
"""
            )
