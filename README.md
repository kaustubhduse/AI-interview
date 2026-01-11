# AI Technical Interview Platform

Thinking about **automating technical interviews**? This project is a **real-time, voice-enabled coding platform** where an AI Agent acts as the interviewer. It presents algorithmic problems, watches you code in real-time, provides verbal feedback, and generates a detailed report of your performance.

---

## Tech Stack

| Component | Technologies |
|-----------|--------------|
| **Frontend** | React 19, Vite, TailwindCSS, **LiveKit (WebRTC)**, Monaco Editor, Framer Motion |
| **Backend** | Node.js, Express, **Mongoose (MongoDB)**, Groq SDK |
| **Agent** | Python 3.9+, **LiveKit Agents**, **Groq (Llama 3)**, Deepgram (STT/TTS), Silero VAD |

---

## Key Features

*   **Interactive Voice Agent**: An AI that speaks to you, asks follow-up questions, and understands your spoken responses (powered by Deepgram & Groq).
*   **Real-time Code Vision**: The agent sees every character you type in the Monaco Editor instantly via LiveKit Data Channels.
*   **Proactive Monitoring**: A background watcher that detects if you are stuck or writing critical bugs (e.g., infinite loops) and verbally intervenes without being prompted.
*   **Comprehensive Reporting**: After the interview, the backend aggregates your code snapshots and transcript to generate a detailed feedback report using LLMs.

---

## Setup & Installation

### 1. Prerequisites
*   Node.js v18+
*   Python 3.9+
*   MongoDB (Local or Atlas)
*   API Keys: **LiveKit**, **Groq**, **Deepgram**

### 2. Frontend (`/frontend`)
The UI interface where the interview happens.
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```
*Create a `.env` file:*
```env
VITE_LIVEKIT_URL=<your-livekit-url>
VITE_BACKEND_URL=http://localhost:5000
```

### 3. Backend (`/backend`)
Handles authentication, session management, and report generation.
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:5000
```
*Create a `.env` file:*
```env
PORT=5000
MONGO_URI=<your-mongo-uri>
GROQ_API_KEY=<your-groq-key>
LIVEKIT_API_KEY=<your-livekit-key>
LIVEKIT_API_SECRET=<your-livekit-secret>
LIVEKIT_URL=<your-livekit-url>
```

### 4. AI Agent (`/agent`)
The brain of the operation. Connects to the room as a participant.
```bash
cd agent
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

pip install -r requirements.txt
python agent.py dev
```
*Create a `.env` file:*
```env
LIVEKIT_URL=<your-livekit-url>
LIVEKIT_API_KEY=<your-livekit-key>
LIVEKIT_API_SECRET=<your-livekit-secret>
GROQ_API_KEY=<your-groq-key>
DEEPGRAM_API_KEY=<your-deepgram-key>
```

---

## How it Works
1.  **User** starts an interview on the frontend.
2.  **Backend** creates a secure Room token and initializes the session.
3.  **Agent** joins the room, introduces the problem (e.g., "Two Sum").
4.  **User** codes in the editor. Every keystroke is synced to the Agent.
5.  **Agent** observes logic, gives hints, and concludes the interview.
6.  **Backend** processes the session data and generates a performance report.
