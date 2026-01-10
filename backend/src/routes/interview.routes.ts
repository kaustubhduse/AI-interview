import express from 'express';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
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
    
    const newInterview = new Interview({
      sessionId: "pending",
      problemId: problem ? problem.id : "random"
    });
    await newInterview.save();

    const roomName = `interview-${newInterview._id}`;
    const participantName = "Candidate";

    const roomService = new RoomServiceClient(
      process.env.LIVEKIT_URL!,
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!
    );

    const roomMetadata = JSON.stringify({
      problemId: problem?.id,
      problemTitle: problem?.title,
      problemDescription: problem?.description,
      problemDifficulty: problem?.difficulty
    });

    await roomService.createRoom({
      name: roomName,
      metadata: roomMetadata
    });

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: participantName,
      }
    );

    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canPublishData: true, canSubscribe: true });
    const token = await at.toJwt();

    newInterview.sessionId = roomName;
    await newInterview.save();

    res.json({ 
      sessionId: roomName, 
      token,
      roomName,
      livekitUrl: process.env.LIVEKIT_URL
    });
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
