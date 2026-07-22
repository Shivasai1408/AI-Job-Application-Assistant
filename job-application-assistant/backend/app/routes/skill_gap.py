"""Skill Gap Analysis routes."""
from fastapi import APIRouter, Depends, Form
from app.models.user import User
from app.routes.auth import get_current_user
from app.services.skill_gap import skill_gap_service
from pydantic import BaseModel

router = APIRouter(prefix="/api/skills", tags=["Skill Gap Analysis"])


class SkillGapResponse(BaseModel):
    match_score: int
    partial_match_score: int
    missing_score: int
    gap_severity: str
    total_required_skills: int
    matched_skills: list
    partial_match_skills: list
    missing_skills: list
    learning_resources: dict
    learning_path: list
    estimated_study_hours: int
    recommendations: list


@router.post("/analyze-gap", response_model=SkillGapResponse)
async def analyze_skill_gap(
    user_skills: str = Form(...),
    required_skills: str = Form(...),
    current_user: User = Depends(get_current_user),
):
    """Analyze skill gap between user skills and job requirements."""
    return await skill_gap_service.analyze(user_skills, required_skills)


@router.get("/learning-resources/{skill_name}")
async def get_skill_resources(
    skill_name: str,
    current_user: User = Depends(get_current_user),
):
    """Get learning resources for a specific skill."""
    resources = skill_gap_service.get_resources_for_skill(skill_name)
    return {"skill": skill_name, "resources": resources}
