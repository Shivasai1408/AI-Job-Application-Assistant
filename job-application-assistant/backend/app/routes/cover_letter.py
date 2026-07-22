"""Cover letter generation routes."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.application import CoverLetter
from app.routes.auth import get_current_user
from app.services.ai_service import ai_service
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/cover-letters", tags=["Cover Letters"])


class CoverLetterGenerateRequest(BaseModel):
    job_title: str
    company: str
    job_description: str
    tone: str = "professional"
    additional_notes: Optional[str] = None

class CoverLetterResponse(BaseModel):
    id: Optional[int] = None
    content: str
    tone: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.post("/generate", response_model=CoverLetterResponse)
async def generate_cover_letter(
    request: CoverLetterGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a cover letter from provided job details."""
    content = await ai_service.generate_cover_letter(
        user_info={
            "full_name": current_user.full_name or "Candidate",
            "current_role": current_user.headline or "",
            "skills": current_user.skills or "",
            "summary": current_user.summary or "",
        },
        job_info={
            "title": request.job_title,
            "company": request.company,
            "description": request.job_description,
        },
        tone=request.tone,
    )

    return CoverLetterResponse(content=content, tone=request.tone)


@router.post("/save", response_model=CoverLetterResponse)
async def save_cover_letter(
    content: str = Form(...),
    job_id: int = Form(...),
    tone: str = Form("professional"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save a generated cover letter."""
    cover_letter = CoverLetter(
        user_id=current_user.id,
        job_id=job_id,
        content=content,
        tone=tone,
    )
    db.add(cover_letter)
    db.commit()
    db.refresh(cover_letter)
    return cover_letter


@router.get("/", response_model=list[CoverLetterResponse])
async def list_cover_letters(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all cover letters for the current user."""
    return db.query(CoverLetter).filter(CoverLetter.user_id == current_user.id).order_by(CoverLetter.created_at.desc()).all()


@router.delete("/{letter_id}")
async def delete_cover_letter(
    letter_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a cover letter."""
    letter = db.query(CoverLetter).filter(CoverLetter.id == letter_id, CoverLetter.user_id == current_user.id).first()
    if not letter:
        raise HTTPException(status_code=404, detail="Cover letter not found")
    db.delete(letter)
    db.commit()
    return {"message": "Cover letter deleted successfully"}
