import express from 'express';
import { createVapiSession } from '../services/vapi.service';
import Interview from '../models/Interview';
import { evaluateInterview } from '../services/groq.service';
import { problems } from '../data/problems';

const router = express.Router();

router.get('/random-problem', (req, res) => {
  const randomIndex = Math.floor(Math.random() * problems.length);
  const problem = problems[randomIndex];
  const { solution, ...problemData } = problem;
  res.json(problemData);
});

router.post('/start', async (req, res) => {
  const { problemId } = req.body;
  try {
    const problem = problems.find(p => p.id === problemId);
    // Pass problem context to Vapi
    const systemPromptContext = problem 
      ? `The candidate is solving the problem: ${problem.title}. Description: ${problem.description}. Solution: ${problem.solution}` 
      : "The candidate is solving a general coding problem.";

    const assistant = await createVapiSession(systemPromptContext);
    
    const newInterview = new Interview({
      sessionId: assistant.id,
      problemId: problem ? problem.id : "random"
    });
    await newInterview.save();
    
    res.json(assistant);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/end', async (req, res) => {
  const { sessionId, code, transcript } = req.body;

  try {
    let interview = await Interview.findOne({ sessionId });
    
    if (!interview) {
        const randomProblem = problems[0];
        interview = new Interview({ 
            sessionId, 
            code, 
            transcript,
            problemId: randomProblem.id 
        });
    } else {
        interview.code = code;
        interview.transcript = transcript;
    }
    
    const problem = problems.find(p => p.id === interview?.problemId) || problems[0];
    
    const feedback = await evaluateInterview(
        code, 
        transcript,
        problem.title,
        problem.description,
        problem.solution
    );
    
    interview.feedback = feedback; 
    
    await interview.save();

    res.json(interview);
  } 
  catch (error) {
    console.error("End interview error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
