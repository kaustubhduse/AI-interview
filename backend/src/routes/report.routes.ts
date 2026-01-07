import express from 'express';
import Interview from '../models/Interview';

const router = express.Router();

router.get('/:sessionId', async (req, res) => {
  try {
    const interview = await Interview.findOne({ sessionId: req.params.sessionId });
    if (!interview) {
      return res.status(404).json({ error: 'Interview report not found' });
    }
    res.json(interview);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
