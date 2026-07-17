"""Interview scheduling and management routes."""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.interview import Interview, InterviewFeedback
from app.models.user import User
from app.models.application import Application
from app.routes.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/interviews", tags=["Interviews"])


class InterviewCreate(BaseModel):
    application_id: int
    company: str
    position: str
    interview_date: datetime
    duration_minutes: int = 60
    interview_type: str = "video"
    location: Optional[str] = None
    notes: Optional[str] = None

class InterviewUpdate(BaseModel):
    interview_date: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    interview_type: Optional[str] = None
    status: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    prep_notes: Optional[str] = None

class InterviewResponse(BaseModel):
    id: int
    application_id: int
    company: str
    position: str
    interview_date: datetime
    duration_minutes: int
    interview_type: str
    status: str
    location: Optional[str] = None
    notes: Optional[str] = None
    prep_notes: Optional[str] = None
    follow_up_sent: bool
    created_at: datetime
    job_title: Optional[str] = None

    class Config:
        from_attributes = True

class FeedbackCreate(BaseModel):
    rating: Optional[int] = None
    feedback_notes: Optional[str] = None
    questions_asked: Optional[str] = None
    next_steps: Optional[str] = None


@router.post("/", response_model=InterviewResponse, status_code=201)
async def create_interview(
    data: InterviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Schedule a new interview."""
    # Verify application exists
    app = db.query(Application).filter(
        Application.id == data.application_id,
        Application.user_id == current_user.id,
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    interview = Interview(
        application_id=data.application_id,
        user_id=current_user.id,
        company=data.company,
        position=data.position,
        interview_date=data.interview_date,
        duration_minutes=data.duration_minutes,
        interview_type=data.interview_type,
        location=data.location,
        notes=data.notes,
    )
    db.add(interview)

    # Auto-update application status
    if app.status == "submitted" or app.status == "reviewing":
        app.status = "interview"
        app.interview_date = data.interview_date

    db.commit()
    db.refresh(interview)

    resp = InterviewResponse.model_validate(interview)
    if app.job:
        resp.job_title = app.job.title
    return resp


@router.get("/", response_model=list[InterviewResponse])
async def list_interviews(
    status: Optional[str] = None,
    upcoming: bool = Query(False, description="Show only upcoming interviews"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all interviews for the current user."""
    query = db.query(Interview).filter(Interview.user_id == current_user.id)

    if status:
        query = query.filter(Interview.status == status)
    if upcoming:
        query = query.filter(
            Interview.status == "scheduled",
            Interview.interview_date >= datetime.utcnow(),
        )

    interviews = query.order_by(Interview.interview_date.asc()).all()
    results = []
    for inv in interviews:
        resp = InterviewResponse.model_validate(inv)
        app = db.query(Application).filter(Application.id == inv.application_id).first()
        if app and app.job:
            resp.job_title = app.job.title
        results.append(resp)
    return results


@router.get("/upcoming", response_model=list[InterviewResponse])
async def get_upcoming_interviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get upcoming interviews (next 30 days)."""
    from datetime import timedelta
    now = datetime.utcnow()
    thirty_days = now + timedelta(days=30)

    interviews = db.query(Interview).filter(
        Interview.user_id == current_user.id,
        Interview.status == "scheduled",
        Interview.interview_date >= now,
        Interview.interview_date <= thirty_days,
    ).order_by(Interview.interview_date.asc()).all()

    results = []
    for inv in interviews:
        resp = InterviewResponse.model_validate(inv)
        app = db.query(Application).filter(Application.id == inv.application_id).first()
        if app and app.job:
            resp.job_title = app.job.title
        results.append(resp)
    return results


@router.get("/{interview_id}", response_model=InterviewResponse)
async def get_interview(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get interview details."""
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id,
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    resp = InterviewResponse.model_validate(interview)
    app = db.query(Application).filter(Application.id == interview.application_id).first()
    if app and app.job:
        resp.job_title = app.job.title
    return resp


@router.put("/{interview_id}", response_model=InterviewResponse)
async def update_interview(
    interview_id: int,
    data: InterviewUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an interview."""
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id,
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(interview, key, value)
    interview.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(interview)

    resp = InterviewResponse.model_validate(interview)
    app = db.query(Application).filter(Application.id == interview.application_id).first()
    if app and app.job:
        resp.job_title = app.job.title
    return resp


@router.post("/{interview_id}/complete")
async def complete_interview(
    interview_id: int,
    feedback: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark interview as completed with feedback."""
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id,
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    interview.status = "completed"
    interview.updated_at = datetime.utcnow()

    fb = InterviewFeedback(
        interview_id=interview_id,
        user_id=current_user.id,
        rating=feedback.rating,
        feedback_notes=feedback.feedback_notes,
        questions_asked=feedback.questions_asked,
        next_steps=feedback.next_steps,
    )
    db.add(fb)
    db.commit()

    return {"message": "Interview completed and feedback saved"}


@router.delete("/{interview_id}")
async def delete_interview(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cancel/delete an interview."""
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id,
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    interview.status = "cancelled"
    interview.updated_at = datetime.utcnow()
    db.commit()

    return {"message": "Interview cancelled"}
