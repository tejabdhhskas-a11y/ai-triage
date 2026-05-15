from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
    expose_headers=["*"],
)

class TriageRequest(BaseModel):
    messages: list

SYSTEM_PROMPT = """You are an AI medical triage assistant.
Collect symptoms through conversation, ask follow-up questions about duration, severity, and medical history.

At the end of EVERY response, add this exact JSON block:
{"risk_score": 45, "level": "clinic", "reason": "brief reason here"}

Risk levels:
- "home" = score 0-40 (minor, self care at home)
- "clinic" = score 41-70 (needs doctor soon)
- "emergency" = score 71-100 (go to ER immediately)

Always end with: DISCLAIMER: This is not a substitute for professional medical advice.
"""

@app.post("/triage")
async def triage(request: TriageRequest):
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "system", "content": SYSTEM_PROMPT}] + request.messages,
        max_tokens=1000,
    )
    return {"reply": response.choices[0].message.content}

@app.get("/")
async def root():
    return {"status": "AI Triage Backend Running"}