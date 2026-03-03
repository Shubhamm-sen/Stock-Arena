import os
import asyncio
from typing import TypedDict, List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

from google import genai                          # NEW package
from google.genai import types
from langchain_core.messages import BaseMessage
from langgraph.graph import StateGraph, END

# 1. Load Environment Variables
load_dotenv(override=True)

app = FastAPI(title="Stock Arena AI Service")

# --- LangGraph State Definition ---

class AgentState(TypedDict):
    ticker: str
    metadata: str
    messages: List[BaseMessage]
    bull_analysis: str
    bear_analysis: str
    verdict: str

# --- 2. Model Initialization ---

api_key = os.getenv("GOOGLE_API_KEY")
MODEL_ID = "gemini-2.0-flash"   # or "gemini-1.5-flash" — both work with new SDK

if not api_key:
    client = None
    print("WARNING: GOOGLE_API_KEY NOT FOUND in environment!")
else:
    print(f"INITIALIZING Gemini with model: {MODEL_ID}")
    client = genai.Client(api_key=api_key)

async def call_gemini(prompt: str) -> str:
    """Async wrapper around the new google-genai SDK."""
    if client is None:
        raise HTTPException(
            status_code=500,
            detail="AI Model not initialized. Check your GOOGLE_API_KEY."
        )
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.models.generate_content(
            model=MODEL_ID,
            contents=prompt
        )
    )
    return response.text

# --- 3. Graph Nodes ---

async def bull_node(state: AgentState):
    ticker = state["ticker"]
    metadata = state["metadata"]
    prompt = f"""
    You are a Senior Bull Analyst researching {ticker}. 
    Stock Metadata: {metadata}
    
    Task: Build a strong, research-backed Bullish thesis. 
    Focus on valuation, operational efficiency, and growth catalysts.
    Format with clear headers and bullet points.
    End with [BUY].
    """
    try:
        text = await call_gemini(prompt)
        return {"bull_analysis": text}
    except Exception as e:
        print(f"Error in bull_node: {e}")
        raise e

async def bear_node(state: AgentState):
    ticker = state["ticker"]
    metadata = state["metadata"]
    bull_thesis = state.get("bull_analysis", "")
    prompt = f"""
    You are a Senior Bear Analyst researching {ticker}.
    Stock Metadata: {metadata}
    
    The Bull Analyst argued:
    {bull_thesis}
    
    Task: Independently build a Bearish thesis. Challenge the bull's assumptions.
    Focus on risks, macro headwinds, and valuation concerns.
    Format with clear headers and bullet points.
    End with [AVOID].
    """
    try:
        text = await call_gemini(prompt)
        return {"bear_analysis": text}
    except Exception as e:
        print(f"Error in bear_node: {e}")
        raise e

async def judge_node(state: AgentState):
    ticker = state["ticker"]
    bull_thesis = state["bull_analysis"]
    bear_thesis = state["bear_analysis"]
    prompt = f"""
    You are the Final Judge for the {ticker} debate.
    
    BULL CASE:
    {bull_thesis}
    
    BEAR CASE:
    {bear_thesis}
    
    Task: Synthesize both arguments into a balanced verdict. 
    Who has the stronger technical/fundamental logic right now?
    Deliver a professional verdict.
    End with [BUY], [AVOID], or [NEUTRAL].
    """
    try:
        text = await call_gemini(prompt)
        return {"verdict": text}
    except Exception as e:
        print(f"Error in judge_node: {e}")
        raise e

# --- 4. Compile Graph ---

workflow = StateGraph(AgentState)
workflow.add_node("bull", bull_node)
workflow.add_node("bear", bear_node)
workflow.add_node("judge", judge_node)
workflow.set_entry_point("bull")
workflow.add_edge("bull", "bear")
workflow.add_edge("bear", "judge")
workflow.add_edge("judge", END)
graph = workflow.compile()

# --- 5. FastAPI Implementation ---

class DebateRequest(BaseModel):
    ticker: str
    metadata: str

class DebateResponse(BaseModel):
    bull: str
    bear: str
    verdict: str

@app.post("/debate", response_model=DebateResponse)
async def run_debate(request: DebateRequest):
    initial_state = {
        "ticker": request.ticker,
        "metadata": request.metadata,
        "messages": [],
        "bull_analysis": "",
        "bear_analysis": "",
        "verdict": ""
    }
    try:
        final_state = await graph.ainvoke(initial_state)
        return DebateResponse(
            bull=final_state["bull_analysis"],
            bear=final_state["bear_analysis"],
            verdict=final_state["verdict"]
        )
    except Exception as e:
        print(f"CRITICAL ERROR during debate: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI Service Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print(f"Starting Stock Arena AI Service on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)