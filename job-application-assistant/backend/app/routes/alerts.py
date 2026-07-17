"""Job alerts and notifications routes."""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.alert import JobAlert, Notification
from app.models.user import User
from app.routes.auth import get_current_user
from app.services.job_search import job_search_service
from pydantic import BaseModel

router = APIRouter(prefix="/api/alerts", tags=["Alerts & Notifications"])


class JobAlertCreate(BaseModel):
    name: str
    keywords: Optional[str] = ""
    location: Optional[str] = ""
    job_type: Optional[str] = ""
    experience_level: Optional[str] = ""
    salary_min: Optional[int] = None
    industry: Optional[str] = ""
    frequency: str = "daily"

class JobAlertUpdate(BaseModel):
    name: Optional[str] = None
    keywords: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    experience_level: Optional[str] = None
    salary_min: Optional[int] = None
    industry: Optional[str] = None
    frequency: Optional[str] = None
    is_active: Optional[bool] = None

class JobAlertResponse(BaseModel):
    id: int
    name: str
    keywords: Optional[str] = ""
    location: Optional[str] = ""
    job_type: Optional[str] = ""
    experience_level: Optional[str] = ""
    salary_min: Optional[int] = None
    industry: Optional[str] = ""
    frequency: str
    is_active: bool
    last_triggered: Optional[datetime] = None
    created_at: datetime
    matching_jobs_count: Optional[int] = 0

    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("/", response_model=JobAlertResponse, status_code=201)
async def create_alert(
    data: JobAlertCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new job alert."""
    alert = JobAlert(
        user_id=current_user.id,
        name=data.name,
        keywords=data.keywords,
        location=data.location,
        job_type=data.job_type,
        experience_level=data.experience_level,
        salary_min=data.salary_min,
        industry=data.industry,
        frequency=data.frequency,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.get("/", response_model=list[JobAlertResponse])
async def list_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all job alerts."""
    alerts = db.query(JobAlert).filter(
        JobAlert.user_id == current_user.id
    ).order_by(JobAlert.created_at.desc()).all()

    results = []
    for alert in alerts:
        resp = JobAlertResponse.model_validate(alert)
        # Count matching jobs
        search_result = await job_search_service.search_jobs(
            query=alert.keywords or "",
            location=alert.location or "",
            job_type=alert.job_type or "",
            experience_level=alert.experience_level or "",
            industry=alert.industry or "",
            page=1,
            page_size=1,
        )
        resp.matching_jobs_count = search_result.get("total", 0)
        results.append(resp)
    return results


@router.put("/{alert_id}", response_model=JobAlertResponse)
async def update_alert(
    alert_id: int,
    data: JobAlertUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a job alert."""
    alert = db.query(JobAlert).filter(
        JobAlert.id == alert_id,
        JobAlert.user_id == current_user.id,
    ).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(alert, key, value)
    alert.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(alert)
    return alert


@router.delete("/{alert_id}")
async def delete_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a job alert."""
    alert = db.query(JobAlert).filter(
        JobAlert.id == alert_id,
        JobAlert.user_id == current_user.id,
    ).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    db.delete(alert)
    db.commit()
    return {"message": "Alert deleted successfully"}


@router.post("/{alert_id}/trigger")
async def trigger_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Manually trigger a job alert to find matching jobs."""
    alert = db.query(JobAlert).filter(
        JobAlert.id == alert_id,
        JobAlert.user_id == current_user.id,
    ).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    search_result = await job_search_service.search_jobs(
        query=alert.keywords or "",
        location=alert.location or "",
        job_type=alert.job_type or "",
        experience_level=alert.experience_level or "",
        industry=alert.industry or "",
    )

    alert.last_triggered = datetime.utcnow()
    db.commit()

    return {
        "message": "Alert triggered",
        "matching_jobs": search_result.get("total", 0),
        "jobs": search_result.get("results", []),
    }


# --- Notifications ---
@router.get("/notifications", response_model=list[NotificationResponse])
async def list_notifications(
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List notifications for the current user."""
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.is_read == False)
    return query.order_by(Notification.created_at.desc()).limit(50).all()


@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a notification as read."""
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id,
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}


@router.post("/notifications/read-all")
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark all notifications as read."""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}


@router.get("/notifications/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get count of unread notifications."""
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).count()
    return {"unread_count": count}
