"""Application tracking routes."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.application import Application, CoverLetter
from app.models.job import Job
from app.models.user import User
from app.routes.auth import get_current_user
from app.services.ai_service import ai_service
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/applications", tags=["Applications"])


class ApplicationCreate(BaseModel):
    job_id: int
    tailored_resume_id: Optional[int] = None
    notes: Optional[str] = None

class ApplicationResponse(BaseModel):
    id: int
    job_id: int
    tailored_resume_id: Optional[int] = None
    cover_letter_id: Optional[int] = None
    status: str
    notes: Optional[str] = None
    applied_date: Optional[datetime] = None
    interview_date: Optional[datetime] = None
    follow_up_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    job: Optional[dict] = None

    class Config:
        from_attributes = True

class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    applied_date: Optional[datetime] = None
    interview_date: Optional[datetime] = None
    follow_up_date: Optional[datetime] = None

class CoverLetterRequest(BaseModel):
    job_id: int
    tone: str = "professional"
    additional_notes: Optional[str] = None

class CoverLetterResponse(BaseModel):
    id: int
    content: str
    tone: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.post("/", response_model=ApplicationResponse, status_code=201)
async def create_application(
    app_data: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new job application record."""
    # Verify job exists
    job_data = None
    job = db.query(Job).filter(Job.id == app_data.job_id).first()
    if not job:
        from app.services.job_search import job_search_service
        job_data = await job_search_service.get_job_details(app_data.job_id)
        if not job_data:
            raise HTTPException(status_code=404, detail="Job not found")

    application = Application(
        user_id=current_user.id,
        job_id=app_data.job_id,
        tailored_resume_id=app_data.tailored_resume_id,
        notes=app_data.notes,
        status="draft",
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    result = ApplicationResponse.model_validate(application)
    if job_data:
        result.job = job_data
    elif job:
        result.job = {
            "id": job.id,
            "title": job.title,
            "company": job.company,
            "location": job.location,
        }
    return result


@router.get("/", response_model=list[ApplicationResponse])
async def list_applications(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all applications for the current user."""
    query = db.query(Application).filter(Application.user_id == current_user.id)
    if status:
        query = query.filter(Application.status == status)
    applications = query.order_by(Application.created_at.desc()).all()

    results = []
    for app in applications:
        app_resp = ApplicationResponse.model_validate(app)
        job = db.query(Job).filter(Job.id == app.job_id).first()
        if job:
            app_resp.job = {
                "id": job.id,
                "title": job.title,
                "company": job.company,
                "location": job.location,
            }
        else:
            from app.services.job_search import job_search_service
            job_data = await job_search_service.get_job_details(app.job_id)
            app_resp.job = job_data
        results.append(app_resp)
    return results


@router.get("/stats")
async def get_application_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get application statistics."""
    apps = db.query(Application).filter(Application.user_id == current_user.id).all()
    total = len(apps)
    status_counts = {}
    for app in apps:
        status_counts[app.status] = status_counts.get(app.status, 0) + 1

    return {
        "total_applications": total,
        "status_breakdown": status_counts,
        "draft": status_counts.get("draft", 0),
        "submitted": status_counts.get("submitted", 0),
        "reviewing": status_counts.get("reviewing", 0),
        "interview": status_counts.get("interview", 0),
        "offer": status_counts.get("offer", 0),
        "rejected": status_counts.get("rejected", 0),
        "withdrawn": status_counts.get("withdrawn", 0),
    }


@router.get("/{app_id}", response_model=ApplicationResponse)
async def get_application(
    app_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific application."""
    app = db.query(Application).filter(Application.id == app_id, Application.user_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    app_resp = ApplicationResponse.model_validate(app)
    job = db.query(Job).filter(Job.id == app.job_id).first()
    if job:
        app_resp.job = {
            "id": job.id,
            "title": job.title,
            "company": job.company,
            "location": job.location,
        }
    return app_resp


@router.put("/{app_id}", response_model=ApplicationResponse)
async def update_application(
    app_id: int,
    update_data: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an application."""
    app = db.query(Application).filter(Application.id == app_id, Application.user_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(app, key, value)
    app.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(app)

    app_resp = ApplicationResponse.model_validate(app)
    job = db.query(Job).filter(Job.id == app.job_id).first()
    if job:
        app_resp.job = {
            "id": job.id,
            "title": job.title,
            "company": job.company,
            "location": job.location,
        }
    return app_resp


@router.delete("/{app_id}")
async def delete_application(
    app_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an application."""
    app = db.query(Application).filter(Application.id == app_id, Application.user_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    db.delete(app)
    db.commit()
    return {"message": "Application deleted successfully"}


# --- Cover Letter Routes ---
@router.post("/cover-letter", response_model=CoverLetterResponse)
async def generate_cover_letter(
    request: CoverLetterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a cover letter for a job application."""
    from app.services.job_search import job_search_service
    job_data = await job_search_service.get_job_details(request.job_id)
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")

    content = await ai_service.generate_cover_letter(
        user_info={
            "full_name": current_user.full_name or "Candidate",
            "current_role": current_user.headline or "",
            "skills": current_user.skills or "",
            "summary": current_user.summary or "",
        },
        job_info=job_data,
        tone=request.tone,
    )

    cover_letter = CoverLetter(
        user_id=current_user.id,
        job_id=request.job_id,
        content=content,
        tone=request.tone,
    )
    db.add(cover_letter)
    db.commit()
    db.refresh(cover_letter)

    return cover_letter


@router.get("/cover-letters/list", response_model=list[CoverLetterResponse])
async def list_cover_letters(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all cover letters for the current user."""
    return db.query(CoverLetter).filter(CoverLetter.user_id == current_user.id).order_by(CoverLetter.created_at.desc()).all()
