from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional
import os
import json
from groq import Groq
from firecrawl import FirecrawlApp
from dotenv import load_dotenv

# Load env variables
load_dotenv()

app = FastAPI(title="Job Search Agent", description="Intelligent Job Search & Matching")

# Initialize Clients
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY")

groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
firecrawl = FirecrawlApp(api_key=FIRECRAWL_API_KEY) if FIRECRAWL_API_KEY else None

class JobSearchRequest(BaseModel):
    query: str
    resume_text: Optional[str] = None
    limit: int = 5

class JobMatch(BaseModel):
    title: str
    company: str
    url: str
    match_score: int
    reasoning: str

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "job-search"}

@app.post("/search-and-match")
async def search_and_match(request: JobSearchRequest):
    if not firecrawl:
        raise HTTPException(status_code=500, detail="Firecrawl API Key not configured")
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API Key not configured")

    print(f"🔍 Searching for: {request.query}")
    
    try:
        # 1. Search Web for Jobs
        search_results = firecrawl.search(
            request.query,
            params={
                "pageOptions": {"fetchPageContent": False}, # Just get snippets first for speed
                "searchOptions": {"limit": request.limit}
            }
        )
        
        if not search_results or 'data' not in search_results:
            return {"matches": []}

        raw_jobs = search_results['data']
        print(f"✅ Found {len(raw_jobs)} raw results")

        # 2. Match against Resume (RAG-lite)
        if not request.resume_text:
            # If no resume, just return formatted results
            return {
                "matches": [
                    {
                        "title": job.get('title', 'Unknown Role'),
                        "company": "Unknown", # URL parsing might be needed
                        "url": job.get('url', '#'),
                        "match_score": 0,
                        "reasoning": "No resume provided for matching."
                    } for job in raw_jobs
                ]
            }

        # AI Matching Logic
        matches = []
        for job in raw_jobs:
            job_summary = f"{job.get('title')} - {job.get('description', '')[:300]}"
            
            # Simple LLM scoring
            prompt = f"""
            Compare this Job to the Candidate Resume.
            
            Job: {job_summary}
            Resume Summary: {request.resume_text[:1000]}... (truncated)

            Rate match 0-100 and give 1 sentence reasoning.
            Format: JSON {{ "score": int, "reason": str, "company": str_inferred }}
            """
            
            try:
                completion = groq_client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "You are a recruiter AI. responding in JSON only."},
                        {"role": "user", "content": prompt}
                    ],
                    model="llama-3.3-70b-versatile",
                    temperature=0.1,
                    response_format={"type": "json_object"}
                )
                
                analysis = json.loads(completion.choices[0].message.content)
                
                matches.append({
                    "title": job.get('title', 'Unknown Role'),
                    "company": analysis.get('company', 'Unknown'),
                    "url": job.get('url'),
                    "match_score": analysis.get('score', 0),
                    "reasoning": analysis.get('reason', 'Analyzed by AI')
                })
            except Exception as e:
                print(f"Error matching job {job.get('url')}: {e}")
                continue

        # Sort by score
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        return {"matches": matches}

    except Exception as e:
        print(f"Job Search Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
