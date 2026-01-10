import axios from 'axios';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const evaluateInterview = async (
  code: string, 
  transcript: string, 
  problemTitle: string, 
  problemDescription: string, 
  problemSolution: string
) => {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  const prompt = `
    You are a technical interviewer evaluator.
    The candidate was asked to solve the following problem:
    
    Title: ${problemTitle}
    Description: ${problemDescription}
    
    Target Solution (Reference):
    ${problemSolution}

    Based on the following code submitted by the candidate and the interview transcript, provide a structured evaluation.
    
    Candidate's Code:
    ${code}

    Interview Transcript:
    ${transcript}

    CRITICAL INSTRUCTIONS:
    1. Compare the Candidate's Code against the Problem Description and Target Solution.
    2. If the code solves a DIFFERENT problem (e.g. Two Sum instead of Palindrome), the score MUST be very low (e.g., < 20) and "problemSolving" must be 0.
    3. Evaluate if the logic is correct for *this specific problem*.
    4. **Communication Score Rule**: Analyze the "Transcript" carefully. If the candidate (USER) speaks very little, gives one-word answers, or fails to explain their thought process, the "communication" score MUST be low (below 40). If they say nothing, it should be 0. Do not give free points.
    
    IMPORTANT: You must output ONLY valid JSON. No other text. Use the following structure:
    {
      "score": 0, // Overall score out of 100
      "breakdown": {
        "codeQuality": 0, // 0-100
        "problemSolving": 0, // 0-100
        "communication": 0 // 0-100
      },

    IMPORTANT: You must output ONLY valid JSON. No other text. Use the following structure:
    {
      "score": 0, // Overall score out of 100
      "breakdown": {
        "codeQuality": 0, // 0-100
        "problemSolving": 0, // 0-100
        "communication": 0 // 0-100
      },
      "whatWentWell": "string",
      "improvements": "string",
      "edgeCases": "string",
      "nextSteps": "string"
    }
  `;

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content;
  } 
  catch (error: any) {
    if(axios.isAxiosError(error)){
        console.error('Groq API Error Status:', error.response?.status);
        console.error('Groq API Error Data:', JSON.stringify(error.response?.data, null, 2));
    } 
    else{
        console.error('Error generating feedback:', error);
    }
    throw new Error('Failed to generate feedback');
  }
};
