import dotenv from 'dotenv';
dotenv.config();
console.log("Environment Variables Loaded.");
console.log("VAPI_API_KEY exists:", !!process.env.VAPI_API_KEY);
console.log("GROQ_API_KEY exists:", !!process.env.GROQ_API_KEY);


import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import connectDB from './config/db';
import interviewRoutes from './routes/interview.routes';
import reportRoutes from './routes/report.routes';


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

connectDB();

app.use('/api/interview', interviewRoutes);
app.use('/api/report', reportRoutes);

app.get('/', (req, res) => {
  res.send('Interview Platform API is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
