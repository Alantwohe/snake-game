"""Game session recording and leaderboard endpoints."""
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from ..database import get_db
from .. import models
from ..auth import get_current_user

router = APIRouter(prefix="/api/games", tags=["games"])


class GameSessionCreate(BaseModel):
    """Schema for creating a game session."""
    score: int
    duration_seconds: int


class GameSessionResponse(BaseModel):
    """Schema for game session response."""
    id: int
    score: int
    duration_seconds: int
    played_at: datetime
    username: str

    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    """Schema for leaderboard entry."""
    rank: int
    username: str
    score: int
    played_at: datetime


@router.post("/session", response_model=GameSessionResponse)
async def create_game_session(
    session_data: GameSessionCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record a new game session."""
    new_session = models.GameSession(
        user_id=current_user.id,
        score=session_data.score,
        duration_seconds=session_data.duration_seconds
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    return GameSessionResponse(
        id=new_session.id,
        score=new_session.score,
        duration_seconds=new_session.duration_seconds,
        played_at=new_session.played_at,
        username=current_user.username
    )


@router.get("/history", response_model=List[GameSessionResponse])
async def get_game_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 10
):
    """Get user's game history."""
    sessions = db.query(models.GameSession).filter(
        models.GameSession.user_id == current_user.id
    ).order_by(desc(models.GameSession.played_at)).limit(limit).all()
    
    return [
        GameSessionResponse(
            id=s.id,
            score=s.score,
            duration_seconds=s.duration_seconds,
            played_at=s.played_at,
            username=current_user.username
        )
        for s in sessions
    ]


@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(db: Session = Depends(get_db), limit: int = 10):
    """Get top scores leaderboard."""
    sessions = db.query(models.GameSession).join(models.User).order_by(
        desc(models.GameSession.score)
    ).limit(limit).all()
    
    return [
        LeaderboardEntry(
            rank=idx + 1,
            username=s.user.username,
            score=s.score,
            played_at=s.played_at
        )
        for idx, s in enumerate(sessions)
    ]
