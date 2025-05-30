import os
from fastapi import FastAPI, UploadFile, File, HTTPException, status, Request
from pydantic import BaseModel
from typing import List, Optional, Union
from fastapi.middleware.cors import CORSMiddleware
from importlib.util import spec_from_file_location, module_from_spec
from agents import leave_monitor
from tasks import create_today_leave_task
from crewai import Crew, Task, Process
from utils import create_agent
from bson import ObjectId
from bson.errors import InvalidId
import json
from datetime import datetime
from auth import (
    UserRegister, UserLogin, SessionResponse, User,
    connect_to_mongo, close_mongo_connection,
    authenticate_user, create_user, create_session,
    get_current_active_user, invalidate_session, get_session_id_from_request,
    get_database ,AgentCreate, create_agent as create_agent_in_db
)

app = FastAPI(title="GMI Agent Crew API")
AGENT_DIR = "C-Executive"
os.makedirs(AGENT_DIR, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    close_mongo_connection()

class LeaveReportResponse(BaseModel):
    message: str
    result: str

class AgentInput(BaseModel):
    name: str
    level: str
    llm_provider: str
    llm_model: str
    api_key: Optional[str] = None

class TaskInput(BaseModel):
    description: str
    expected_output: str
    assigned_agent_index: int
    output_file: Optional[str] = None
    tool_name: Optional[str] = None  

class RunCrewInput(BaseModel):
    agents: List[AgentInput]
    tasks: List[TaskInput]

class AgentOutput(BaseModel):
    name: str
    role: str
    level: str
    backstory: str

class RunCrewResponse(BaseModel):
    message: str
    result: str
    agents: List[AgentOutput]

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    goal: Optional[str] = None
    backstory: Optional[Union[str, List[str]]] = None
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None
    api_key: Optional[str] = None
    memory: Optional[bool] = None
    allow_delegation: Optional[bool] = None
    verbose: Optional[bool] = None

class UserAgentResponse(BaseModel):
    agent_name: str
    agent_data: dict
    last_updated: str



class CExecutiveResponse(BaseModel):
    ceo_agent: dict
    connected_agents: List[dict]
    total_agents: int
    last_updated: str

class AgentIDPayload(BaseModel):
    agent_id: str


def get_ceo_and_connected_agents() -> dict:
    database = get_database()
    user_agents_collection = database["agents"]

    ceo_agent = user_agents_collection.find_one({"name": "CEO_agent"})
    if not ceo_agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CEO agent not found in database."
        )

    agent_data = ceo_agent.get("agent_data", {})
    connected_agent_ids = agent_data.get("connected_agents", [])

    return {
        "ceo_agent": {
            "id": str(ceo_agent.get("_id", "")),
            "name": ceo_agent.get("name", ""),
            "last_updated": str(ceo_agent.get("last_updated", ""))
        },
        "connected_agents": [{"id": aid} for aid in connected_agent_ids],
        "total_agents": len(connected_agent_ids) + 1,
        "last_updated": str(ceo_agent.get("last_updated", ""))
    }

def get_agent_from_database(agent_name: str) -> Optional[dict]:
    """Get agent from database only - no hardcoded data"""
    database = get_database()
    user_agents_collection = database["user_agents"]
    
    # Only get from database
    agent_doc = user_agents_collection.find_one({"agent_name": agent_name})
    
    if agent_doc:
        return agent_doc["agent_data"]
    
    # Return None if not found - no hardcoded data
    return None


def get_user_agent_from_db(user_id: str, agent_name: str) -> Optional[dict]:
    """Get user's specific agent from database"""
    database = get_database()
    user_agents_collection = database["user_agents"]
    agent_doc = user_agents_collection.find_one({
        "user_id": user_id,
        "agent_name": agent_name
    })
    if agent_doc:
        return agent_doc["agent_data"]
    return None

def save_user_agent_to_db(user_id: str, username: str, agent_name: str, agent_data: dict):
    """Save user's agent to database"""
    from datetime import datetime
    database = get_database()
    user_agents_collection = database["user_agents"]
    user_agents_collection.update_one(
        {"user_id": user_id, "agent_name": agent_name},
        {
            "$set": {
                "user_id": user_id,
                "username": username,
                "agent_name": agent_name,
                "agent_data": agent_data,
                "last_updated": datetime.utcnow(),
                "created_at": datetime.utcnow()
            }
        },
        upsert=True
    )

def get_all_user_agents_from_db(user_id: str) -> List[dict]:
    """Get all agents for a specific user"""
    database = get_database()
    user_agents_collection = database["user_agents"]
    agents = list(user_agents_collection.find({"user_id": user_id}))
    result = []
    for agent in agents:
        result.append({
            "agent_name": agent["agent_name"],
            "agent_data": agent["agent_data"],
            "last_updated": agent["last_updated"]
        })
    return result

def get_default_agent_template(agent_name: str) -> dict:
    """Get default agent template from file system"""
    file_path = os.path.join(AGENT_DIR, f"{agent_name}.json")
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            return json.load(f)
    return {
        "name": agent_name,
        "role": f"AI Assistant - {agent_name}",
        "goal": f"Assist with tasks related to {agent_name}",
        "backstory": f"I am an AI assistant specialized in {agent_name} related tasks.",
        "llm_provider": "openai",
        "llm_model": "gpt-3.5-turbo",
        "memory": True,
        "allow_delegation": False,
        "verbose": True
    }

@app.post("/register", response_model=dict)
async def register(user_data: UserRegister):
    """Register a new user"""
    try:
        user = create_user(user_data)
        return {
            "message": "User registered successfully",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name
            }
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@app.post("/login", response_model=SessionResponse)
async def login(user_credentials: UserLogin):
    """Login user and return session"""
    user = authenticate_user(user_credentials.username, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    session = create_session(user.id, user.username)
    return session

@app.post("/logout")
async def logout(request: Request):
    """Logout user and invalidate session"""
    session_id = get_session_id_from_request(request)
    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No session found"
        )
    success = invalidate_session(session_id)
    if success:
        return {"message": "Successfully logged out"}
    else:
        return {"message": "Session already invalid or not found"}
    


def list_cexecutive_agents() -> List[str]:
    """List all agent names (without .json) from C-Executive folder"""
    agents = []
    for file in os.listdir(AGENT_DIR):
        if file.endswith(".json"):
            agent_name = os.path.splitext(file)[0]
            agents.append(agent_name)
    return agents


def load_tool(tool_class_name: str):
    tools_dir = "src/project/tools"
    for filename in os.listdir(tools_dir):
        if filename.endswith(".py"):
            module_name = filename[:-3]
            file_path = os.path.join(tools_dir, filename)
            spec = spec_from_file_location(module_name, file_path)
            module = module_from_spec(spec)
            spec.loader.exec_module(module)
            if hasattr(module, tool_class_name):
                tool_instance = getattr(module, tool_class_name)
                return tool_instance 
    raise ImportError(f"Tool class '{tool_class_name}' not found in {tools_dir}")

@app.post("/upload-tool/")
async def upload_tool(
    file: UploadFile = File(...)
):
    """Upload a tool (unprotected endpoint)"""
    tool_dir = "src/project/tools"
    os.makedirs(tool_dir, exist_ok=True)
    file_path = os.path.join(tool_dir, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())
    return {
        "message": "Tool uploaded successfully",
        "tool_file": file.filename
    }

@app.post("/run-crew", response_model=RunCrewResponse)
def run_custom_crew(
    data: RunCrewInput
):
    """Run custom crew (unprotected endpoint)"""
    selected_agents = []
    agent_outputs = []
    for input_data in data.agents:
        agent = create_agent(
            agent_name=input_data.name,
            level=input_data.level,
            llm_provider=input_data.llm_provider,
            llm_model=input_data.llm_model,
            api_key=input_data.api_key
        )
        selected_agents.append(agent)
        agent_outputs.append({
            "name": input_data.name,
            "role": agent.role,
            "level": input_data.level,
            "backstory": agent.backstory,
        })

    tasks = []
    for task_data in data.tasks:
        agent = selected_agents[task_data.assigned_agent_index]
        tool_instance = load_tool(task_data.tool_name) if task_data.tool_name else None
        task = Task(
            description=task_data.description,
            expected_output=task_data.expected_output,
            output_file=task_data.output_file,
            tools=[tool_instance] if tool_instance else [],
            agent=agent
        )
        tasks.append(task)

    crew = Crew(
        agents=selected_agents,
        tasks=tasks,
        process=Process.sequential
    )
    result = crew.kickoff()
    return {
        "message": "Crew executed successfully.",
        "result": result.raw,
        "agents": agent_outputs
    }

@app.get("/leave-today", response_model=LeaveReportResponse)
def check_today_leave():
    """Check today's leave (unprotected endpoint)"""
    today_leave_task = create_today_leave_task()
    crew = Crew(
        agents=[leave_monitor],
        tasks=[today_leave_task],
        process=Process.sequential
    )
    print("📅 Checking today's leaves...")
    result = crew.kickoff()
    return {
        "message": "Leave report generated successfully.",
        "result": result.raw
    }

@app.get("/agent/{agent_id}", response_model=UserAgentResponse)
def get_agent_by_id(agent_id: str):
    """Get agent details by ID"""
    try:
        database = get_database()
        user_agents_collection = database["user_agents"]
        agent_doc = user_agents_collection.find_one({"_id": ObjectId(agent_id)})
        if not agent_doc:
            raise HTTPException(status_code=404, detail="Agent not found")
        return UserAgentResponse(
            agent_name=agent_doc["agent_name"],
            agent_data=agent_doc["agent_data"],
            last_updated=str(agent_doc["last_updated"])
        )
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid agent ID format")

@app.post("/agent/{agent_id}/update", response_model=UserAgentResponse)
def update_agent_by_id(agent_id: str, update: AgentUpdate):
    """Update agent by ID"""
    try:
        database = get_database()
        user_agents_collection = database["user_agents"]
        agent_doc = user_agents_collection.find_one({"_id": ObjectId(agent_id)})
        if not agent_doc:
            raise HTTPException(status_code=404, detail="Agent not found")

        updated_agent_data = agent_doc["agent_data"]
        for key, value in update.dict(exclude_unset=True).items():
            updated_agent_data[key] = value

        from datetime import datetime
        user_agents_collection.update_one(
            {"_id": ObjectId(agent_id)},
            {"$set": {
                "agent_data": updated_agent_data,
                "last_updated": datetime.utcnow()
            }}
        )

        return UserAgentResponse(
            agent_name=agent_doc["agent_name"],
            agent_data=updated_agent_data,
            last_updated=str(datetime.utcnow())
        )
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid agent ID format")

# @app.get("/agents/my-agents")
# def get_my_agents():
#     """Get all default agent templates from the file system."""
#     agent_files = [f.replace(".json", "") for f in os.listdir(AGENT_DIR) if f.endswith(".json")]
#     agents = []

#     for agent_name in agent_files:
#         agent_data = get_default_agent_template(agent_name)
#         agents.append({
#             "agent_name": agent_name,
#             "agent_data": agent_data,
#             "source": "default"
#         })

#     return {
#         "message": f"Retrieved {len(agents)} default agent templates",
#         "agents": agents
#     }

@app.get("/agents/my-agents")
def get_my_agents():
    """Get all agents from agents collection"""
    database = get_database()
    agents_collection = database["agents"]  # Changed from "user_agents" to "agents"
    agents = []
    for agent in agents_collection.find():
        # Convert ObjectId to string and handle any other non-serializable fields
        agent_data = dict(agent)
        agent_data["_id"] = str(agent_data["_id"])  # Convert ObjectId to string
        
        agents.append({
            "agent_id": str(agent["_id"]),
            "agent_name": agent.get("name", ""),  # Use get() to handle missing fields
            "agent_data": agent_data,  # Now properly serializable
            "last_updated": str(agent.get("last_updated", "")),
            "source": "database"
        })
    return {
        "message": f"Retrieved {len(agents)} agents from database",
        "agents": agents
    }


@app.delete("/agent/{agent_name}/reset")
def reset_agent_to_default(
    agent_name: str
):
    """Reset agent to default (unprotected endpoint)"""
    return {
        "message": f"Agent '{agent_name}' has been reset to default template."
    }




@app.post("/agents", response_model=dict)
async def create_public_agent(agent_data: AgentCreate):
    """Create a new agent (no authentication required)"""
    try:
        agent = create_agent_in_db(agent_data)
        return {
            "message": "Agent created successfully",
            "agent": {
                "id": agent.id,
                "name": agent.name,
                "role": agent.role,
                "goal": agent.goal,
                "backstory": agent.backstory,
                "verbose": agent.verbose,
                "created_at": str(agent.created_at)
            }
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent creation failed: {str(e)}"
        )
    



@app.get("/cexecutive", response_model=CExecutiveResponse)
def get_c_executive_structure():
    """Get CEO agent and his connected C-level executives"""
    try:
        result = get_ceo_and_connected_agents()
        
        return CExecutiveResponse(
            ceo_agent=result["ceo_agent"],
            connected_agents=result["connected_agents"],
            total_agents=len(result["connected_agents"]) + 1,  
            last_updated=str(result["ceo_agent"]["last_updated"])
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve C-Executive structure: {str(e)}"
        )

@app.post("/cexecutive/add-agent")
def add_agent_to_ceo(payload: AgentIDPayload):
    database = get_database()
    agents_col = database["agents"]

    ceo_agent = agents_col.find_one({"name": "CEO_agent"})
    if not ceo_agent:
        raise HTTPException(status_code=404, detail="CEO agent not found")

    if not ObjectId.is_valid(payload.agent_id):
        raise HTTPException(status_code=400, detail="Invalid agent ID format")

    agent_obj = agents_col.find_one({"_id": ObjectId(payload.agent_id)})
    if not agent_obj:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Ensure agent_data exists
    agent_data = ceo_agent.get("agent_data", {})
    connected = agent_data.get("connected_agents", [])

    # Append new agent if not already connected
    if payload.agent_id not in connected:
        connected.append(payload.agent_id)

    # Update ceo_agent fields
    agent_data["connected_agents"] = connected
    ceo_agent["agent_data"] = agent_data
    ceo_agent["last_updated"] = datetime.utcnow()

    agents_col.update_one(
        {"_id": ceo_agent["_id"]},
        {"$set": {
            "agent_data": ceo_agent["agent_data"],
            "last_updated": ceo_agent["last_updated"]
        }}
    )

    return {
        "message": "Agent linked to CEO",
        "connected_agents": connected
    }


@app.post("/cexecutive/remove-agent")
def remove_agent_from_ceo(payload: AgentIDPayload):
    database = get_database()
    agents_col = database["agents"]

    ceo_agent = agents_col.find_one({"name": "CEO_agent"})
    if not ceo_agent:
        raise HTTPException(status_code=404, detail="CEO agent not found")

    if not ObjectId.is_valid(payload.agent_id):
        raise HTTPException(status_code=400, detail="Invalid agent ID format")

    # Load and ensure defaults
    agent_data = ceo_agent.get("agent_data", {})
    connected = agent_data.get("connected_agents", [])

    if payload.agent_id in connected:
        connected.remove(payload.agent_id)

        # Update data
        agent_data["connected_agents"] = connected
        ceo_agent["agent_data"] = agent_data
        ceo_agent["last_updated"] = datetime.utcnow()

        agents_col.update_one(
            {"_id": ceo_agent["_id"]},
            {"$set": {
                "agent_data": ceo_agent["agent_data"],
                "last_updated": ceo_agent["last_updated"]
            }}
        )

        return {
            "message": "Agent unlinked from CEO",
            "connected_agents": connected
        }

    return {
        "message": "Agent was not linked to CEO",
        "connected_agents": connected
    }




if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)