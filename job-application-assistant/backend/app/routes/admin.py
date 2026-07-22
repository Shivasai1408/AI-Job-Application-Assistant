"""Admin routes for system administration and user management."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.job import Job
from app.models.application import Application
from app.models.interview import Interview
from app.routes.auth import get_current_user
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# --- Pydantic Schemas ---

class UserAdminResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    is_active: bool
    skills: Optional[str] = None
    location: Optional[str] = None
    created_at: Optional[datetime] = None
    applications_count: int = 0
    interviews_count: int = 0

    class Config:
        from_attributes = True

class SystemStatsResponse(BaseModel):
    total_users: int
    active_users: int
    total_applications: int
    total_jobs: int
    total_interviews: int
    total_resumes: int
    applications_today: int
    users_joined_today: int
    average_applications_per_user: float
    most_common_status: str
    status_breakdown: dict

class JobAdminResponse(BaseModel):
    id: int
    title: str
    company: str
    location: Optional[str] = None
    job_type: Optional[str] = None
    industry: Optional[str] = None
    is_active: bool
    applications_count: int = 0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Mock Data Helpers ---

def get_mock_users(count: int = 10) -> list[dict]:
    mock_users = []
    for i in range(1, count + 1):
        mock_users.append({
            "id": i,
            "username": f"user{i}",
            "email": f"user{i}@example.com",
            "full_name": f"User {i}",
            "is_active": i % 5 != 0,
            "skills": "Python, JavaScript, React, SQL" if i % 2 == 0 else "Java, Spring, AWS",
            "location": "New York" if i % 3 == 0 else "San Francisco" if i % 3 == 1 else "Remote",
            "created_at": datetime.utcnow(),
            "applications_count": (i * 3) % 20,
            "interviews_count": i % 5,
        })
    return mock_users


def get_mock_jobs(count: int = 15) -> list[dict]:
    mock_jobs = []
    companies = ["Google", "Microsoft", "Amazon", "Apple", "Meta", "Netflix", "Uber", "Airbnb", "Shopify", "Twitter"]
    titles = ["Software Engineer", "Data Scientist", "Product Manager", "DevOps Engineer", "Frontend Developer"]
    for i in range(1, count + 1):
        mock_jobs.append({
            "id": i,
            "title": titles[i % len(titles)],
            "company": companies[i % len(companies)],
            "location": "Remote" if i % 4 == 0 else "San Francisco" if i % 4 == 1 else "New York",
            "job_type": "Full-time" if i % 3 != 0 else "Contract",
            "industry": "Technology",
            "is_active": i % 6 != 0,
            "applications_count": (i * 5) % 30,
            "created_at": datetime.utcnow(),
        })
    return mock_jobs


# --- Routes ---

@router.get("/users", response_model=list[UserAdminResponse])
async def list_all_users(
    search: Optional[str] = Query(None, description="Search by username or email"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all users (admin only)."""
    query = db.query(User)

    if search:
        query = query.filter(
            User.username.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        )

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    results = []
    for u in users:
        apps_count = db.query(Application).filter(Application.user_id == u.id).count()
        interviews_count = db.query(Interview).filter(Interview.user_id == u.id).count()
        results.append(UserAdminResponse(
            id=u.id,
            username=u.username,
            email=u.email,
            full_name=u.full_name,
            is_active=u.is_active,
            skills=u.skills,
            location=u.location,
            created_at=u.created_at,
            applications_count=apps_count,
            interviews_count=interviews_count,
        ))

    return results


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Delete associated records
    db.query(Application).filter(Application.user_id == user_id).delete()
    db.query(Interview).filter(Interview.user_id == user_id).delete()

    db.delete(user)
    db.commit()
    return {"message": f"User {user_id} deleted successfully", "deleted_user": user.username}


@router.get("/stats", response_model=SystemStatsResponse)
async def get_system_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return system-wide statistics."""
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    total_applications = db.query(Application).count()
    total_jobs = db.query(Job).count()
    total_interviews = db.query(Interview).count()

    # Applications today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    apps_today = db.query(Application).filter(Application.created_at >= today_start).count()
    users_today = db.query(User).filter(User.created_at >= today_start).count()

    # Average applications per user
    avg_apps = round(total_applications / total_users, 1) if total_users > 0 else 0

    # Status breakdown
    status_counts = {}
    if total_applications > 0:
        statuses = db.query(Application.status, func.count(Application.id)).group_by(Application.status).all()
        for status, count in statuses:
            status_counts[status] = count

    most_common = max(status_counts, key=status_counts.get) if status_counts else "N/A"

    return SystemStatsResponse(
        total_users=total_users,
        active_users=active_users,
        total_applications=total_applications,
        total_jobs=total_jobs,
        total_interviews=total_interviews,
        total_resumes=0,
        applications_today=apps_today,
        users_joined_today=users_today,
        average_applications_per_user=avg_apps,
        most_common_status=most_common,
        status_breakdown=status_counts,
    )


@router.get("/jobs", response_model=list[JobAdminResponse])
async def list_all_jobs(
    search: Optional[str] = Query(None, description="Search by title or company"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all jobs."""
    query = db.query(Job)

    if search:
        query = query.filter(
            Job.title.ilike(f"%{search}%") | Job.company.ilike(f"%{search}%")
        )

    jobs = query.order_by(Job.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    results = []
    for j in jobs:
        apps_count = db.query(Application).filter(Application.job_id == j.id).count()
        results.append(JobAdminResponse(
            id=j.id,
            title=j.title,
            company=j.company,
            location=j.location,
            job_type=j.job_type,
            industry=j.industry,
            is_active=j.is_active,
            applications_count=apps_count,
            created_at=j.created_at,
        ))

    return results


@router.delete("/jobs/{job_id}")
async def delete_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a job."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Delete associated applications
    db.query(Application).filter(Application.job_id == job_id).delete()

    db.delete(job)
    db.commit()
    return {"message": f"Job '{job.title}' deleted successfully"}
