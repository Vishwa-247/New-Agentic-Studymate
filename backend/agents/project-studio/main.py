#!/usr/bin/env python3
"""
Project Studio - Agent Orchestration Service (Mock for Demo)
===========================================================

This service simulates the multi-agent swarm for the Project Studio demo.
It provides endpoints that return "thought processes" and "actions" for different agents.
"""

import os
import time
import logging
from typing import Dict, List, Optional
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Project Studio Service",
    description="Multi-Agent Swarm Orchestration",
    version="0.1.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProjectRequest(BaseModel):
    user_id: str
    description: str

@app.get("/")
async def root():
    return {"service": "Project Studio", "status": "running", "mode": "demo_mock"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/agent/idea-analyst")
async def analyze_idea(request: ProjectRequest):
    """Simulates the Idea Analyst agent breakdown."""
    time.sleep(1) # Simulate thinking
    return {
        "agent": "Idea Analyst",
        "status": "completed",
        "output": {
            "summary": "User wants a specialized learning platform.",
            "target_audience": "Students and developers",
            "core_value": "AI-driven personalization",
            "feasibility_score": 0.85
        }
    }

@app.post("/agent/researcher")
async def research_market(request: ProjectRequest):
    """Simulates the Researcher agent finding competitors."""
    time.sleep(1.5)
    return {
        "agent": "Researcher",
        "status": "completed",
        "output": {
            "competitors": ["Udemy", "Coursera", "Pluralsight"],
            "gap_analysis": "Most platforms lack real-time AI mentoring.",
            "technologies": ["React", "FastAPI", "PostgreSQL", "Vector DB"]
        }
    }

@app.post("/agent/planner")
async def create_plan(request: ProjectRequest):
    """Simulates the Planner agent creating tasks."""
    time.sleep(1)
    return {
        "agent": "Planner",
        "status": "completed",
        "output": {
            "milestones": [
                {"week": 1, "task": "Setup Auth & Database Schema"},
                {"week": 2, "task": "Implement Course Generation AI"},
                {"week": 3, "task": "Build Real-time Interview Coach"},
                {"week": 4, "task": "Develop Frontend Dashboard"}
            ]
        }
    }

if __name__ == "__main__":
    host = os.getenv("SERVICE_HOST", "0.0.0.0")
    port = int(os.getenv("SERVICE_PORT", "8012")) # Port 8012 for Project Studio
    uvicorn.run("main:app", host=host, port=port, reload=True)
