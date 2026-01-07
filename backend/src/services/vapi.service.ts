import axios from 'axios';

const VAPI_BASE_URL = 'https://api.vapi.ai';
export const createVapiSession = async (promptContext: string = "") => {
  const VAPI_API_KEY = process.env.VAPI_API_KEY;

  try {
    const response = await axios.post(
      `${VAPI_BASE_URL}/assistant`,
      {
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: "en-US",
        },
        model: {
          provider: "groq", 
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: `You are a technical interviewer. ${promptContext} 
              
              INSTRUCTIONS:
              1. FIRST, read the problem title and description clearly to the candidate.
              2. Then, ask them to explain their approach before coding.
              3. CONTINUOUS LOOP: Keep the interview going. After they solve one part, ask about time complexity, edge cases, or potential optimizations. 
              4. Do NOT stop unless the user explicitly says "End interview" or "I am done". 
              5. If they finish the current problem, offer to give them a harder variation or a new problem (simulate this by asking a new related question).
              
              Conduct the interview professionally. Be encouraging but rigorous.`
            },
          ],
        },
        voice: {
          provider: "11labs",
          voiceId: "burt",
        },
        firstMessage: "Hello! Let's get started. I will read the problem for you.",
      },
      {
        headers: {
          Authorization: `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error creating Vapi assistant:', error);
    throw new Error('Failed to create Vapi session');
  }
};
