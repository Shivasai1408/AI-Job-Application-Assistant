"""Auto-Apply routes for simulating job portal applications."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from app.models.user import User
from app.routes.auth import get_current_user
from app.services.auto_apply import auto_apply_service
from pydantic import BaseModel

router = APIRouter(prefix="/api/auto-apply", tags=["Auto-Apply"])


class PrepareRequest(BaseModel):
    portal_id: str
    cover_letter: str = ""

class SubmitRequest(BaseModel):
    portal_id: str
    job_title: str
    company: str
    application_data: dict = {}


@router.get("/portals")
async def get_supported_portals(
    current_user: User = Depends(get_current_user),
):
    """Get list of supported job portals for auto-apply."""
    return await auto_apply_service.get_supported_portals()


@router.get("/portals/{portal_id}/fields")
async def get_portal_fields(
    portal_id: str,
    current_user: User = Depends(get_current_user),
):
    """Get application fields required for a specific portal."""
    fields = await auto_apply_service.get_portal_fields(portal_id)
    if not fields:
        raise HTTPException(status_code=404, detail=f"Portal '{portal_id}' not supported")
    return {"portal_id": portal_id, "fields": fields}


@router.post("/prepare")
async def prepare_application(
    request: PrepareRequest,
    current_user: User = Depends(get_current_user),
):
    """Prepare application data by auto-filling fields from user profile."""
    # Get the user's primary resume content
    resume_content = current_user.resumes[0].parsed_content if current_user.resumes else ""

    return await auto_apply_service.prepare_application(
        portal_id=request.portal_id,
        user_profile={
            "full_name": current_user.full_name or current_user.username,
            "email": current_user.email,
            "phone": current_user.phone or "",
            "headline": current_user.headline or "",
            "skills": current_user.skills or "",
            "summary": current_user.summary or "",
        },
        resume_content=resume_content,
        cover_letter=request.cover_letter,
    )


@router.post("/submit")
async def submit_application(
    request: SubmitRequest,
    current_user: User = Depends(get_current_user),
):
    """Simulate submitting an application to a portal."""
    return await auto_apply_service.simulate_submit(
        portal_id=request.portal_id,
        job_title=request.job_title,
        company=request.company,
        application_data=request.application_data,
    )
