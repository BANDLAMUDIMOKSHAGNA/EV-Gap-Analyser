from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from jose import jwt
from apps.api.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication & Roles"])

class LoginRequest(BaseModel):
    email: str
    password: str
    role: str = "planner" # admin, planner, viewer

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    email: str
    name: str

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    # Demo authentication accepts valid credentials or role-based bypass
    allowed_roles = ["admin", "planner", "viewer"]
    role = req.role if req.role in allowed_roles else "planner"
    
    name_map = {
        "admin": "System Administrator",
        "planner": "Senior City Planner",
        "viewer": "Public Viewer / Stakeholder"
    }

    token_data = {
        "sub": req.email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }

    token = jwt.encode(token_data, settings.JWT_SECRET, algorithm="HS256")

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=role,
        email=req.email,
        name=name_map.get(role, "Urban Planner")
    )

@router.get("/me")
def get_current_user(token: str = None):
    return {
        "email": "planner.gvmc@ap.gov.in",
        "name": "Visakhapatnam Urban Development Planner",
        "role": "planner",
        "city": "Visakhapatnam"
    }
