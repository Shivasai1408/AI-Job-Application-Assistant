"""Job search and management routes."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.job import Job
from app.models.user import User
from app.routes.auth import get_current_user
from app.services.job_search import job_search_service
from app.services.ai_service import ai_service
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


class JobResponse(BaseModel):
    id: int
    title: str
    company: str
    location: Optional[str] = None
    description: str
    requirements: Optional[str] = None
    salary_range: Optional[str] = None
    job_type: Optional[str] = None
    experience_level: Optional[str] = None
    industry: Optional[str] = None
    source: Optional[str] = None
    source_url: Optional[str] = None
    skills_required: Optional[str] = None
    posted_date: Optional[datetime] = None
    is_active: bool = True

    class Config:
        from_attributes = True

class JobSearchResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    results: list[JobResponse]

class SkillExtractResponse(BaseModel):
    technical_skills: list[str] = []
    soft_skills: list[str] = []
    qualifications: list[str] = []
    responsibilities: list[str] = []


@router.get("/search", response_model=JobSearchResponse)
async def search_jobs(
    query: str = Query("", description="Search query"),
    location: str = Query("", description="Location filter"),
    job_type: str = Query("", description="Job type filter (full-time, part-time, contract)"),
    experience_level: str = Query("", description="Experience level filter"),
    industry: str = Query("", description="Industry filter"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
):
    """Search for jobs with various filters."""
    return await job_search_service.search_jobs(
        query=query,
        location=location,
        job_type=job_type,
        experience_level=experience_level,
        industry=industry,
        page=page,
        page_size=page_size,
    )


@router.get("/recommended", response_model=list[JobResponse])
async def get_recommended_jobs(
    limit: int = Query(5, ge=1, le=20),
    current_user: User = Depends(get_current_user),
):
    """Get job recommendations based on user's skills."""
    return await job_search_service.get_recommended_jobs(
        user_skills=current_user.skills or "",
        user_experience=current_user.headline or "",
        limit=limit,
    )


@router.get("/{job_id}", response_model=JobResponse)
async def get_job_details(
    job_id: int,
    current_user: User = Depends(get_current_user),
):
    """Get details for a specific job."""
    job = await job_search_service.get_job_details(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("/{job_id}/extract-skills", response_model=SkillExtractResponse)
async def extract_job_skills(
    job_id: int,
    current_user: User = Depends(get_current_user),
):
    """Extract skills from a job description using AI."""
    job = await job_search_service.get_job_details(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    skills = await ai_service.extract_skills_from_job(job["description"])
    return SkillExtractResponse(**skills)


@router.post("/save/{job_id}")
async def save_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save a job to the user's saved jobs list."""
    # Check if job exists in our DB
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        # Create from sample data
        job_data = await job_search_service.get_job_details(job_id)
        if not job_data:
            raise HTTPException(status_code=404, detail="Job not found")
        job = Job(**{k: v for k, v in job_data.items() if k != "id"})
        db.add(job)
        db.commit()
        db.refresh(job)

    if job not in current_user.saved_jobs:
        current_user.saved_jobs.append(job)
        db.commit()

    return {"message": "Job saved successfully"}


@router.get("/saved/list", response_model=list[JobResponse])
async def get_saved_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all saved jobs for the current user."""
    return current_user.saved_jobs


@router.delete("/saved/{job_id}")
async def unsave_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a job from saved jobs."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if job and job in current_user.saved_jobs:
        current_user.saved_jobs.remove(job)
        db.commit()
    return {"message": "Job removed from saved jobs"}
