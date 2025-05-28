import os
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict
from fastapi import HTTPException, Depends, status, Request
from pydantic import BaseModel, EmailStr
from pymongo import MongoClient
from passlib.context import CryptContext
from bson import ObjectId


SESSION_EXPIRE_HOURS = 24


MONGO_URL = "mongodb+srv://vinitha:vinitha432001v~@cluster1.ddqueju.mongodb.net/"
DATABASE_NAME = "User"
USERS_COLLECTION = "users"
SESSIONS_COLLECTION = "sessions"


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