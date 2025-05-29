# import os
# import secrets
# from datetime import datetime, timedelta
# from typing import Optional, Dict
# from fastapi import HTTPException, Depends, status, Request
# from pydantic import BaseModel, EmailStr
# from pymongo import MongoClient
# from passlib.context import CryptContext
# from bson import ObjectId


# SESSION_EXPIRE_HOURS = 24


# MONGO_URL = "mongodb+srv://vinitha:vinitha432001v~@cluster1.ddqueju.mongodb.net/?retryWrites=true&w=majority&ssl=true&ssl_cert_reqs=CERT_NONE"
# DATABASE_NAME = "User"
# USERS_COLLECTION = "users"
# SESSIONS_COLLECTION = "sessions"


# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# active_sessions: Dict[str, dict] = {}


# class UserRegister(BaseModel):
#     username: str
#     email: EmailStr
#     password: str
#     full_name: Optional[str] = None

# class UserLogin(BaseModel):
#     username: str
#     password: str

# class SessionResponse(BaseModel):
#     session_id: str
#     user_id: str
#     username: str
#     expires_at: datetime

# class User(BaseModel):
#     id: Optional[str] = None
#     username: str
#     email: str
#     full_name: Optional[str] = None
#     is_active: bool = True
#     created_at: Optional[datetime] = None

# class UserInDB(User):
#     hashed_password: str


# class Database:
#     client: MongoClient = None

# db = Database()

# def get_database():
#     return db.client[DATABASE_NAME]

# def connect_to_mongo():
#     """Create database connection"""
#     db.client = MongoClient(MONGO_URL)
#     try:
#         db.client.admin.command('ping')
      
#     except Exception as e:
#         print(f"Failed to connect to MongoDB: {e}")
#         raise

# def close_mongo_connection():
#     """Close database connection"""
#     if db.client:
#         db.client.close()


# def verify_password(plain_password: str, hashed_password: str) -> bool:
#     """Verify a plain password against its hash"""
#     return pwd_context.verify(plain_password, hashed_password)

# def get_password_hash(password: str) -> str:
#     """Hash a password"""
#     return pwd_context.hash(password)


# def get_user(username: str) -> Optional[UserInDB]:
#     """Get user from database"""
#     database = get_database()
#     users_collection = database[USERS_COLLECTION]
    
#     user_data = users_collection.find_one({"username": username})
#     if user_data:
#         user_data["id"] = str(user_data["_id"])
#         del user_data["_id"]
#         return UserInDB(**user_data)
#     return None

# def get_user_by_id(user_id: str) -> Optional[UserInDB]:
#     """Get user by ID from database"""
#     database = get_database()
#     users_collection = database[USERS_COLLECTION]
    
#     try:
#         user_data = users_collection.find_one({"_id": ObjectId(user_id)})
#         if user_data:
#             user_data["id"] = str(user_data["_id"])
#             del user_data["_id"]
#             return UserInDB(**user_data)
#     except Exception:
#         pass
#     return None

# def get_user_by_email(email: str) -> Optional[UserInDB]:
#     """Get user by email from database"""
#     database = get_database()
#     users_collection = database[USERS_COLLECTION]
    
#     user_data = users_collection.find_one({"email": email})
#     if user_data:
#         user_data["id"] = str(user_data["_id"])
#         del user_data["_id"]
#         return UserInDB(**user_data)
#     return None

# def authenticate_user(username: str, password: str) -> Optional[UserInDB]:
#     """Authenticate user with username and password"""
#     user = get_user(username)
#     if not user:
#         return None
#     if not verify_password(password, user.hashed_password):
#         return None
#     return user

# def create_user(user_data: UserRegister) -> UserInDB:
#     """Create a new user in database"""
#     database = get_database()
#     users_collection = database[USERS_COLLECTION]
    
    
#     if get_user(user_data.username):
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Username already registered"
#         )
    
    
#     if get_user_by_email(user_data.email):
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Email already registered"
#         )
    
 
#     user_doc = {
#         "username": user_data.username,
#         "email": user_data.email,
#         "full_name": user_data.full_name,
#         "hashed_password": get_password_hash(user_data.password),
#         "is_active": True,
#         "created_at": datetime.utcnow()
#     }
    

#     result = users_collection.insert_one(user_doc)
#     user_doc["id"] = str(result.inserted_id)
#     del user_doc["_id"]
    
#     return UserInDB(**user_doc)


# def create_session(user_id: str, username: str) -> SessionResponse:
#     """Create a new session for user"""
#     session_id = secrets.token_urlsafe(32)
#     expires_at = datetime.utcnow() + timedelta(hours=SESSION_EXPIRE_HOURS)
    
#     session_data = {
#         "user_id": user_id,
#         "username": username,
#         "created_at": datetime.utcnow(),
#         "expires_at": expires_at,
#         "is_active": True
#     }
    

#     active_sessions[session_id] = session_data
    

#     database = get_database()
#     sessions_collection = database[SESSIONS_COLLECTION]
#     session_doc = session_data.copy()
#     session_doc["session_id"] = session_id
#     sessions_collection.insert_one(session_doc)
    
#     return SessionResponse(
#         session_id=session_id,
#         user_id=user_id,
#         username=username,
#         expires_at=expires_at
#     )

# def get_session(session_id: str) -> Optional[dict]:
#     """Get session data"""

#     cleanup_expired_sessions()
    
  
#     if session_id in active_sessions:
#         session_data = active_sessions[session_id]
#         if session_data["expires_at"] > datetime.utcnow() and session_data["is_active"]:
#             return session_data
    

#     database = get_database()
#     sessions_collection = database[SESSIONS_COLLECTION]
    
#     session_data = sessions_collection.find_one({
#         "session_id": session_id,
#         "is_active": True,
#         "expires_at": {"$gt": datetime.utcnow()}
#     })
    
#     if session_data:
 
#         active_sessions[session_id] = {
#             "user_id": session_data["user_id"], 
#             "username": session_data["username"],
#             "created_at": session_data["created_at"],
#             "expires_at": session_data["expires_at"],
#             "is_active": session_data["is_active"]
#         }
#         return active_sessions[session_id]
    
#     return None

# def invalidate_session(session_id: str) -> bool:
#     """Invalidate a session (logout)"""

#     if session_id in active_sessions:
#         del active_sessions[session_id]
    

#     database = get_database()
#     sessions_collection = database[SESSIONS_COLLECTION]
    
#     result = sessions_collection.update_one(
#         {"session_id": session_id},
#         {"$set": {"is_active": False, "logged_out_at": datetime.utcnow()}}
#     )
    
#     return result.modified_count > 0

# def cleanup_expired_sessions():
#     """Clean up expired sessions from memory"""
#     expired_sessions = []
#     current_time = datetime.utcnow()
    
#     for session_id, session_data in active_sessions.items():
#         if session_data["expires_at"] <= current_time:
#             expired_sessions.append(session_id)
    
#     for session_id in expired_sessions:
#         del active_sessions[session_id]

# def get_session_id_from_request(request: Request) -> Optional[str]:
#     """Extract session ID from request headers or cookies"""

#     auth_header = request.headers.get("Authorization")
#     if auth_header and auth_header.startswith("Session "):
#         return auth_header.replace("Session ", "")
    

#     session_header = request.headers.get("X-Session-ID")
#     if session_header:
#         return session_header
    

#     session_cookie = request.cookies.get("session_id")
#     if session_cookie:
#         return session_cookie
    
#     return None

# def get_current_active_user(request: Request) -> User:
#     """Get current active user"""
#     session_id = get_session_id_from_request(request)
    
#     if not session_id:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="No session provided"
#         )
    
#     session_data = get_session(session_id)
#     if not session_data:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Invalid or expired session"
#         )
    
#     user = get_user_by_id(session_data["user_id"])
#     if not user:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="User not found"
#         )
    
#     if not user.is_active:
#         raise HTTPException(status_code=400, detail="Inactive user")
    
#     return User(
#         id=user.id,
#         username=user.username,
#         email=user.email,
#         full_name=user.full_name,
#         is_active=user.is_active,
#         created_at=user.created_at
#     )

# def require_active_auth():
#     """Dependency to require active user authentication"""
#     def _get_current_active_user(request: Request) -> User:
#         return get_current_active_user(request)
#     return Depends(_get_current_active_user)



import os
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from fastapi import HTTPException, Depends, status, Request
from pydantic import BaseModel, EmailStr
from pymongo import MongoClient
from passlib.context import CryptContext
from bson import ObjectId


SESSION_EXPIRE_HOURS = 24


MONGO_URL = "mongodb+srv://vinitha:vinitha432001v~@cluster1.ddqueju.mongodb.net/?retryWrites=true&w=majority&ssl=true&ssl_cert_reqs=CERT_NONE"
DATABASE_NAME = "User"
USERS_COLLECTION = "users"
SESSIONS_COLLECTION = "sessions"
AGENTS_COLLECTION = "agents"  # New collection for agents


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


active_sessions: Dict[str, dict] = {}


class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class SessionResponse(BaseModel):
    session_id: str
    user_id: str
    username: str
    expires_at: datetime

class User(BaseModel):
    id: Optional[str] = None
    username: str
    email: str
    full_name: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None

class UserInDB(User):
    hashed_password: str

# New Agent models
class AgentCreate(BaseModel):
    name: str
    role: str
    goal: str
    backstory: List[str]
    verbose: bool = True

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    goal: Optional[str] = None
    backstory: Optional[List[str]] = None
    verbose: Optional[bool] = None

class Agent(BaseModel):
    id: Optional[str] = None
    name: str
    role: str
    goal: str
    backstory: List[str]
    verbose: bool = True
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class AgentInDB(Agent):
    pass


class Database:
    client: MongoClient = None

db = Database()

def get_database():
    return db.client[DATABASE_NAME]

def connect_to_mongo():
    """Create database connection"""
    db.client = MongoClient(MONGO_URL)
    try:
        db.client.admin.command('ping')
      
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        raise

def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def get_user(username: str) -> Optional[UserInDB]:
    """Get user from database"""
    database = get_database()
    users_collection = database[USERS_COLLECTION]
    
    user_data = users_collection.find_one({"username": username})
    if user_data:
        user_data["id"] = str(user_data["_id"])
        del user_data["_id"]
        return UserInDB(**user_data)
    return None

def get_user_by_id(user_id: str) -> Optional[UserInDB]:
    """Get user by ID from database"""
    database = get_database()
    users_collection = database[USERS_COLLECTION]
    
    try:
        user_data = users_collection.find_one({"_id": ObjectId(user_id)})
        if user_data:
            user_data["id"] = str(user_data["_id"])
            del user_data["_id"]
            return UserInDB(**user_data)
    except Exception:
        pass
    return None

def get_user_by_email(email: str) -> Optional[UserInDB]:
    """Get user by email from database"""
    database = get_database()
    users_collection = database[USERS_COLLECTION]
    
    user_data = users_collection.find_one({"email": email})
    if user_data:
        user_data["id"] = str(user_data["_id"])
        del user_data["_id"]
        return UserInDB(**user_data)
    return None

def authenticate_user(username: str, password: str) -> Optional[UserInDB]:
    """Authenticate user with username and password"""
    user = get_user(username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def create_user(user_data: UserRegister) -> UserInDB:
    """Create a new user in database"""
    database = get_database()
    users_collection = database[USERS_COLLECTION]
    
    
    if get_user(user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    
    if get_user_by_email(user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
 
    user_doc = {
        "username": user_data.username,
        "email": user_data.email,
        "full_name": user_data.full_name,
        "hashed_password": get_password_hash(user_data.password),
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    

    result = users_collection.insert_one(user_doc)
    user_doc["id"] = str(result.inserted_id)
    del user_doc["_id"]
    
    return UserInDB(**user_doc)


def create_session(user_id: str, username: str) -> SessionResponse:
    """Create a new session for user"""
    session_id = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=SESSION_EXPIRE_HOURS)
    
    session_data = {
        "user_id": user_id,
        "username": username,
        "created_at": datetime.utcnow(),
        "expires_at": expires_at,
        "is_active": True
    }
    

    active_sessions[session_id] = session_data
    

    database = get_database()
    sessions_collection = database[SESSIONS_COLLECTION]
    session_doc = session_data.copy()
    session_doc["session_id"] = session_id
    sessions_collection.insert_one(session_doc)
    
    return SessionResponse(
        session_id=session_id,
        user_id=user_id,
        username=username,
        expires_at=expires_at
    )

def get_session(session_id: str) -> Optional[dict]:
    """Get session data"""

    cleanup_expired_sessions()
    
  
    if session_id in active_sessions:
        session_data = active_sessions[session_id]
        if session_data["expires_at"] > datetime.utcnow() and session_data["is_active"]:
            return session_data
    

    database = get_database()
    sessions_collection = database[SESSIONS_COLLECTION]
    
    session_data = sessions_collection.find_one({
        "session_id": session_id,
        "is_active": True,
        "expires_at": {"$gt": datetime.utcnow()}
    })
    
    if session_data:
 
        active_sessions[session_id] = {
            "user_id": session_data["user_id"], 
            "username": session_data["username"],
            "created_at": session_data["created_at"],
            "expires_at": session_data["expires_at"],
            "is_active": session_data["is_active"]
        }
        return active_sessions[session_id]
    
    return None

def invalidate_session(session_id: str) -> bool:
    """Invalidate a session (logout)"""

    if session_id in active_sessions:
        del active_sessions[session_id]
    

    database = get_database()
    sessions_collection = database[SESSIONS_COLLECTION]
    
    result = sessions_collection.update_one(
        {"session_id": session_id},
        {"$set": {"is_active": False, "logged_out_at": datetime.utcnow()}}
    )
    
    return result.modified_count > 0

def cleanup_expired_sessions():
    """Clean up expired sessions from memory"""
    expired_sessions = []
    current_time = datetime.utcnow()
    
    for session_id, session_data in active_sessions.items():
        if session_data["expires_at"] <= current_time:
            expired_sessions.append(session_id)
    
    for session_id in expired_sessions:
        del active_sessions[session_id]

def get_session_id_from_request(request: Request) -> Optional[str]:
    """Extract session ID from request headers or cookies"""

    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Session "):
        return auth_header.replace("Session ", "")
    

    session_header = request.headers.get("X-Session-ID")
    if session_header:
        return session_header
    

    session_cookie = request.cookies.get("session_id")
    if session_cookie:
        return session_cookie
    
    return None

def get_current_active_user(request: Request) -> User:
    """Get current active user"""
    session_id = get_session_id_from_request(request)
    
    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No session provided"
        )
    
    session_data = get_session(session_id)
    if not session_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session"
        )
    
    user = get_user_by_id(session_data["user_id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    return User(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        created_at=user.created_at
    )

def require_active_auth():
    """Dependency to require active user authentication"""
    def _get_current_active_user(request: Request) -> User:
        return get_current_active_user(request)
    return Depends(_get_current_active_user)


# Agent Management Functions

def create_agent(agent_data: AgentCreate) -> Agent:
    """Create a new global agent"""
    database = get_database()
    agents_collection = database[AGENTS_COLLECTION]
    
    # Check if agent name already exists globally
    existing_agent = agents_collection.find_one({
        "name": agent_data.name,
        "is_active": True
    })
    
    if existing_agent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Agent with this name already exists"
        )
    
    agent_doc = {
        "name": agent_data.name,
        "role": agent_data.role,
        "goal": agent_data.goal,
        "backstory": agent_data.backstory,
        "verbose": agent_data.verbose,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = agents_collection.insert_one(agent_doc)
    agent_doc["id"] = str(result.inserted_id)
    del agent_doc["_id"]
    
    return Agent(**agent_doc)

def get_agent_by_id(agent_id: str) -> Optional[Agent]:
    """Get agent by ID (global access)"""
    database = get_database()
    agents_collection = database[AGENTS_COLLECTION]
    
    try:
        agent_data = agents_collection.find_one({
            "_id": ObjectId(agent_id),
            "is_active": True
        })
        if agent_data:
            agent_data["id"] = str(agent_data["_id"])
            del agent_data["_id"]
            return Agent(**agent_data)
    except Exception:
        pass
    return None

def get_all_agents(skip: int = 0, limit: int = 100) -> List[Agent]:
    """Get all global agents"""
    database = get_database()
    agents_collection = database[AGENTS_COLLECTION]
    
    agents_cursor = agents_collection.find({
        "is_active": True
    }).skip(skip).limit(limit).sort("created_at", -1)
    
    agents = []
    for agent_data in agents_cursor:
        agent_data["id"] = str(agent_data["_id"])
        del agent_data["_id"]
        agents.append(Agent(**agent_data))
    
    return agents

def update_agent(agent_id: str, agent_update: AgentUpdate) -> Optional[Agent]:
    """Update a global agent"""
    database = get_database()
    agents_collection = database[AGENTS_COLLECTION]
    
    # Check if agent exists
    existing_agent = agents_collection.find_one({
        "_id": ObjectId(agent_id),
        "is_active": True
    })
    
    if not existing_agent:
        return None
    
    # Prepare update data
    update_data = {}
    if agent_update.name is not None:
        # Check if new name conflicts with existing agent
        name_conflict = agents_collection.find_one({
            "name": agent_update.name,
            "is_active": True,
            "_id": {"$ne": ObjectId(agent_id)}
        })
        if name_conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Agent with this name already exists"
            )
        update_data["name"] = agent_update.name
    
    if agent_update.role is not None:
        update_data["role"] = agent_update.role
    if agent_update.goal is not None:
        update_data["goal"] = agent_update.goal
    if agent_update.backstory is not None:
        update_data["backstory"] = agent_update.backstory
    if agent_update.verbose is not None:
        update_data["verbose"] = agent_update.verbose
    
    update_data["updated_at"] = datetime.utcnow()
    
    # Update the agent
    result = agents_collection.update_one(
        {"_id": ObjectId(agent_id)},
        {"$set": update_data}
    )
    
    if result.modified_count > 0:
        return get_agent_by_id(agent_id)
    
    return None

def delete_agent(agent_id: str) -> bool:
    """Soft delete a global agent"""
    database = get_database()
    agents_collection = database[AGENTS_COLLECTION]
    
    result = agents_collection.update_one(
        {
            "_id": ObjectId(agent_id),
            "is_active": True
        },
        {
            "$set": {
                "is_active": False,
                "deleted_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return result.modified_count > 0

def get_agent_by_name(agent_name: str) -> Optional[Agent]:
    """Get agent by name (global access)"""
    database = get_database()
    agents_collection = database[AGENTS_COLLECTION]
    
    agent_data = agents_collection.find_one({
        "name": agent_name,
        "is_active": True
    })
    
    if agent_data:
        agent_data["id"] = str(agent_data["_id"])
        del agent_data["_id"]
        return Agent(**agent_data)
    
    return None

def search_agents(search_term: str, skip: int = 0, limit: int = 100) -> List[Agent]:
    """Search all agents by name, role, or goal"""
    database = get_database()
    agents_collection = database[AGENTS_COLLECTION]
    
    # Create text search query
    search_query = {
        "is_active": True,
        "$or": [
            {"name": {"$regex": search_term, "$options": "i"}},
            {"role": {"$regex": search_term, "$options": "i"}},
            {"goal": {"$regex": search_term, "$options": "i"}}
        ]
    }
    
    agents_cursor = agents_collection.find(search_query).skip(skip).limit(limit).sort("created_at", -1)
    
    agents = []
    for agent_data in agents_cursor:
        agent_data["id"] = str(agent_data["_id"])
        del agent_data["_id"]
        agents.append(Agent(**agent_data))
    
    return agents

def count_all_agents() -> int:
    """Count total active agents globally"""
    database = get_database()
    agents_collection = database[AGENTS_COLLECTION]
    
    return agents_collection.count_documents({
        "is_active": True
    })

def get_agents_by_role(role_search: str, skip: int = 0, limit: int = 100) -> List[Agent]:
    """Get agents by role pattern"""
    database = get_database()
    agents_collection = database[AGENTS_COLLECTION]
    
    agents_cursor = agents_collection.find({
        "role": {"$regex": role_search, "$options": "i"},
        "is_active": True
    }).skip(skip).limit(limit).sort("created_at", -1)
    
    agents = []
    for agent_data in agents_cursor:
        agent_data["id"] = str(agent_data["_id"])
        del agent_data["_id"]
        agents.append(Agent(**agent_data))
    
    return agents