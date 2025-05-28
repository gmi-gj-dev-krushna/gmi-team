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


from auth import (
    UserRegister, UserLogin, SessionResponse, User,
    connect_to_mongo, close_mongo_connection,
    authenticate_user, create_user, create_session,
    get_current_active_user, require_active_auth,
    invalidate_session, get_session_id_from_request,
    get_database 
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
    user_id: str
    username: str
    last_updated: str


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
    file: UploadFile = File(...),
    current_user: User = require_active_auth()
):
    """Upload a tool (protected endpoint)"""
    tool_dir = "src/project/tools"
    os.makedirs(tool_dir, exist_ok=True)

    file_path = os.path.join(tool_dir, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())

    return {
        "message": "Tool uploaded successfully",
        "tool_file": file.filename,
        "uploaded_by": current_user.username
    }

@app.post("/run-crew", response_model=RunCrewResponse)
def run_custom_crew(
    data: RunCrewInput,
    current_user: User = require_active_auth()
):
    """Run custom crew (protected endpoint)"""
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
        "message": f"Crew executed successfully by {current_user.username}.",
        "result": result.raw,
        "agents": agent_outputs
    }

@app.get("/leave-today", response_model=LeaveReportResponse)
def check_today_leave(current_user: User = require_active_auth()):
    """Check today's leave (protected endpoint)"""
    today_leave_task = create_today_leave_task()

    crew = Crew(
        agents=[leave_monitor],
        tasks=[today_leave_task],
        process=Process.sequential
    )

    print(f"📅 {current_user.username} is checking today's leaves...")
    result = crew.kickoff()

    return {
        "message": "Leave report generated successfully.",
        "result": result.raw
    }

@app.get("/agent/{agent_name}", response_model=UserAgentResponse)
def get_agent(
    agent_name: str,
    current_user: User = require_active_auth()
):
    """Get user-specific agent details (protected endpoint)"""
   
    user_agent_data = get_user_agent_from_db(current_user.id, agent_name)
    
    if user_agent_data:
        return UserAgentResponse(
            agent_name=agent_name,
            agent_data=user_agent_data,
            user_id=current_user.id,
            username=current_user.username,
            last_updated=str(user_agent_data.get("last_updated", ""))
        )
    
  
    default_agent_data = get_default_agent_template(agent_name)
    
    return UserAgentResponse(
        agent_name=agent_name,
        agent_data=default_agent_data,
        user_id=current_user.id,
        username=current_user.username,
        last_updated="Never updated - using default template"
    )

@app.post("/agent/{agent_name}/update", response_model=UserAgentResponse)
def update_agent(
    agent_name: str,
    update: AgentUpdate,
    current_user: User = require_active_auth()
):
    """Update user-specific agent (protected endpoint)"""
    
    existing_agent_data = get_user_agent_from_db(current_user.id, agent_name)
    
    if not existing_agent_data:
      
        existing_agent_data = get_default_agent_template(agent_name)
    
  
    for key, value in update.dict(exclude_unset=True).items():
        existing_agent_data[key] = value
    
  
    from datetime import datetime
    existing_agent_data["last_updated"] = datetime.utcnow()
    existing_agent_data["updated_by"] = current_user.username
    
  
    save_user_agent_to_db(current_user.id, current_user.username, agent_name, existing_agent_data)
    
    return UserAgentResponse(
        agent_name=agent_name,
        agent_data=existing_agent_data,
        user_id=current_user.id,
        username=current_user.username,
        last_updated=str(existing_agent_data["last_updated"])
    )

# @app.get("/agents/my-agents")
# def get_my_agents(current_user: User = require_active_auth()):
#     """Get all agents customized by current user"""
#     user_agents = get_all_user_agents_from_db(current_user.id)
    
#     return {
#         "message": f"Retrieved {len(user_agents)} customized agents for {current_user.username}",
#         "user_id": current_user.id,
#         "username": current_user.username,
#         "agents": user_agents
#     }

# @app.get("/agents/my-agents/{agent_name}")
# def get_my_specific_agent(
#     agent_name: str,
#     current_user: User = require_active_auth()
# ):
#     """Get a specific customized agent by name for the current user"""
    
  
#     user_agent_data = get_user_agent_from_db(current_user.id, agent_name)
    
#     if not user_agent_data:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail=f"Customized agent '{agent_name}' not found for user {current_user.username}. Use /agent/{agent_name} to get default template."
#         )
    
#     return {
#         "message": f"Retrieved customized agent '{agent_name}' for user {current_user.username}",
#         "user_id": current_user.id,
#         "username": current_user.username,
#         "agent_name": agent_name,
#         "agent_data": user_agent_data,
#         "last_updated": str(user_agent_data.get("last_updated", "")),
#         "is_customized": True
#     }






def get_user_agent_by_id(user_id: str, agent_object_id: str) -> Optional[dict]:
    """Get user's specific agent from database using MongoDB ObjectId"""
    database = get_database()
    user_agents_collection = database["user_agents"]
    
    try:
    
        object_id = ObjectId(agent_object_id)
        
        agent_doc = user_agents_collection.find_one({
            "_id": object_id,
            "user_id": user_id  
        })
        
        if agent_doc:
            return {
                "id": str(agent_doc["_id"]),
                "agent_name": agent_doc["agent_name"],
                "agent_data": agent_doc["agent_data"],
                "user_id": agent_doc["user_id"],
                "username": agent_doc["username"],
                "last_updated": agent_doc.get("last_updated", ""),
                "created_at": agent_doc.get("created_at", "")
            }
        return None
        
    except InvalidId:
        # Handle invalid ObjectId format
        return None

# Replace your existing endpoint with this updated version
@app.get("/agents/my-agents/{agent_id}")
def get_my_specific_agent_by_id(
    agent_id: str,
    current_user: User = require_active_auth()
):
    """Get a specific customized agent by MongoDB ObjectId for the current user"""
    
    # Validate ObjectId format
    try:
        ObjectId(agent_id)
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid ObjectId format: {agent_id}"
        )
    
    # Get agent by ObjectId
    user_agent_data = get_user_agent_by_id(current_user.id, agent_id)
    
    if not user_agent_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customized agent with ID '{agent_id}' not found for user {current_user.username}"
        )
    
    return {
        "message": f"Retrieved customized agent with ID '{agent_id}' for user {current_user.username}",
        "agent_id": agent_id,
        "user_id": current_user.id,
        "username": current_user.username,
        "agent_name": user_agent_data["agent_name"],
        "agent_data": user_agent_data["agent_data"],
        "last_updated": str(user_agent_data.get("last_updated", "")),
        "created_at": str(user_agent_data.get("created_at", "")),
        "is_customized": True
    }


@app.get("/agents/my-agents")
def get_my_agents(current_user: User = require_active_auth()):
    """Get all agents customized by current user with ObjectIds"""
    database = get_database()
    user_agents_collection = database["user_agents"]
    
    agents = list(user_agents_collection.find({"user_id": current_user.id}))
    
    result = []
    for agent in agents:
        result.append({
            "id": str(agent["_id"]),  # Include ObjectId
            "agent_name": agent["agent_name"],
            "agent_data": agent["agent_data"],
            "last_updated": agent.get("last_updated", ""),
            "created_at": agent.get("created_at", "")
        })
    
    return {
        "message": f"Retrieved {len(result)} customized agents for {current_user.username}",
        "user_id": current_user.id,
        "username": current_user.username,
        "agents": result
    }


@app.delete("/agent/{agent_name}/reset")
def reset_agent_to_default(
    agent_name: str,
    current_user: User = require_active_auth()
):
    """Reset user's agent to default template"""
    database = get_database()
    user_agents_collection = database["user_agents"]
    

    result = user_agents_collection.delete_one({
        "user_id": current_user.id,
        "agent_name": agent_name
    })
    
    if result.deleted_count > 0:
        return {
            "message": f"Agent '{agent_name}' has been reset to default template for user {current_user.username}",
            "agent_name": agent_name,
            "user_id": current_user.id
        }
    else:
        return {
            "message": f"No customized version of agent '{agent_name}' found for user {current_user.username}",
            "agent_name": agent_name,
            "user_id": current_user.id
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)