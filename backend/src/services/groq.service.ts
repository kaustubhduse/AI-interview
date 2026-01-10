import axios from 'axios';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const evaluateInterview = async (
  code: string, 
  transcript: string, 
  problemTitle: string, 
  problemDescription: string, 
  problemSolution: string,
  timeline: any[] = [] 
) => {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  // Format timeline for prompt
  const timelineStr = timeline.map((t: any, i: number) => 
    `Bucket ${i+1} (${new Date(t.timestamp).toISOString().substr(14, 5)}):
     Code Snapshot: ${t.code.slice(0, 200)}...
     Transcript: "${t.transcriptSegment}"
    `
  ).join("\n");

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

    Timeline Analysis (buckets of code state and speech every 15s):
    ${timelineStr}

    CRITICAL INSTRUCTIONS:
    1. Compare the Candidate's Code against the Problem Description and Target Solution.
    2. If the code solves a DIFFERENT problem (e.g. Two Sum instead of Palindrome), the score MUST be very low (e.g., < 20) and "problemSolving" must be 0.
    3. Evaluate if the logic is correct for *this specific problem*.
    4. **Communication Score Rule**: Analyze the "Transcript" carefully. If the candidate (USER) speaks very little, gives one-word answers, or fails to explain their thought process, the "communication" score MUST be low (below 40). If they say nothing, it should be 0. Do not give free points.
    5. **Deep Analysis**: For "whatWentWell", "improvements", and "edgeCases", provide **detailed, comprehensive explanations**. 
       - Do NOT give one-liners. 
       - Explain WHY something was good or bad.
       - Include **code snippets** or specific logic references in your explanation where possible.
       - Use "point" for a short summary title, and "explanation" for the deep dive.
    
    IMPORTANT: You must output ONLY valid JSON. No other text. Use the following structure:
    {
      "score": 0, // Overall score out of 100
      "breakdown": {
        "codeQuality": 0, // 0-100
        "problemSolving": 0, // 0-100
        "communication": 0 // 0-100
      },
      "whatWentWell": [
        { "point": "Strong Logic", "explanation": "The candidate correctly implemented... (Detailed explanation)" }
      ],
      "improvements": [
        { "point": "Variable Naming", "explanation": "Variables like 'x' and 'y' should be... (Detailed explanation)" }
      ],
      "edgeCases": [
        { "point": "Empty Input", "explanation": "Candidate failed to check for empty array... (Detailed explanation)" }
      ],
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
