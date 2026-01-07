FROM python:3.11-slim

WORKDIR /app

# Install system dependencies if needed (e.g. for audio processing)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY agent.py .

# Command to run the agent
# Using 'dev' for local, but for prod usually you run normally or with 'start'
# For LiveKit Cloud, you typically just run the script
CMD ["python", "agent.py", "start"]
