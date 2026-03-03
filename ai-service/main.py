import os
import asyncio
from typing import Annotated, TypedDict, List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END

load_dotenv()

app = FastAPI(title="Stock Arena AI Service")

# --- LangGraph Setup ---

class AgentState(TypedDict):
    ticker: str
    metadata: str
    messages: List[BaseMessage]
    bull_analysis: str
    bear_analysis: str
    verdict: str

# Initialize Model
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    # We'll raise a clear error later if used, but for now we initialize
    model = None
else:
    model = ChatOpenAI(model="gpt-4o", streaming=True, api_key=api_key)

async def check_model():
    if model is None:
        raise HTTPException(
            status_code=400, 
            detail="OPENAI_API_KEY is missing in the AI service environment. Please set it and restart the service."
        )

async def bull_node(state: AgentState):
    await check_model()
    ticker = state["ticker"]
    metadata = state["metadata"]
    
    prompt = f"""
    You are a Senior Bull Analyst researching {ticker}. 
    Stock Metadata: {metadata}
    
    Task: Build a strong, research-backed Bullish thesis. 
    Focus on valuation, operational efficiency, and growth catalysts.
    Format your response with clear headers and bullet points.
    End with [BUY].
    """
    
    response = await model.ainvoke([SystemMessage(content=prompt)])
    return {"bull_analysis": response.content, "messages": state["messages"] + [response]}

async def bear_node(state: AgentState):
    ticker = state["ticker"]
    metadata = state["metadata"]
    bull_thesis = state.get("bull_analysis", "")
    
    prompt = f"""
    You are a Senior Bear Analyst researching {ticker}.
    Stock Metadata: {metadata}
    
    The Bull Analyst argued:
    {bull_thesis}
    
    Task: Independently build a Bearish thesis. Challenge the bull's assumptions if possible.
    Focus on risks, macro headwinds, and valuation concerns.
    Format your response with clear headers and bullet points.
    End with [AVOID].
    """
    
    response = await model.ainvoke([SystemMessage(content=prompt)])
    return {"bear_analysis": response.content, "messages": state["messages"] + [response]}

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
    Which side has the stronger technical and fundamental logic right now?
    Deliver a professional verdict.
    Format your response with clear headers.
    End with [BUY], [AVOID], or [NEUTRAL].
    """
    
    response = await model.ainvoke([SystemMessage(content=prompt)])
    return {"verdict": response.content, "messages": state["messages"] + [response]}

# Compile Graph
workflow = StateGraph(AgentState)

workflow.add_node("bull", bull_node)
workflow.add_node("bear", bear_node)
workflow.add_node("judge", judge_node)

workflow.set_entry_point("bull")
workflow.add_edge("bull", "bear")
workflow.add_edge("bear", "judge")
workflow.add_edge("judge", END)

graph = workflow.compile()

# --- FastAPI Implementation ---

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
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
