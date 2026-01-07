import mongoose, { Document, Schema } from 'mongoose';

export interface IInterview extends Document {
  sessionId: string;
  problemId: string;
  code: string;
  transcript: string;
  feedback: string;
  createdAt: Date;
}

const InterviewSchema: Schema = new Schema({
  sessionId: { type: String, required: true, unique: true },
  problemId: { type: String, required: true },
  code: { type: String, default: '' },
  transcript: { type: String, default: '' },
  feedback: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IInterview>('Interview', InterviewSchema);
