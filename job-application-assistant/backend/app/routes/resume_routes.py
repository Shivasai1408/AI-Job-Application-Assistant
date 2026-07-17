"""Resume management routes - upload, parse, tailor, and analyze resumes."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.resume import Resume, TailoredResume
from app.models.user import User
from app.routes.auth import get_current_user
from app.services.ai_service import ai_service
from app.services.resume_tailor import resume_tailor_service
from app.services.ats_scorer import ats_scorer_service
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/resumes", tags=["Resumes"])


# --- Pydantic Schemas ---
class ResumeResponse(BaseModel):
    id: int
    title: str
    original_filename: Optional[str] = None
    parsed_content: Optional[str] = None
    ats_score: Optional[int] = None
    is_base: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TailorRequest(BaseModel):
    job_title: str = ""
    company: str = ""
    job_description: str

class TailorResponse(BaseModel):
    id: Optional[int] = None
    tailored_content: str
    changes_summary: Optional[str] = None
    ats_score: Optional[int] = None

class ATSAnalysisResponse(BaseModel):
    ats_score: int
    keyword_match: int
    formatting_score: int
    section_completeness: int
    missing_keywords: list
    strengths: list
    improvements: list
    recommended_actions: list


@router.post("/upload", response_model=ResumeResponse)
async def upload_resume(
    title: str = Form(...),
    file: UploadFile = File(...),
    is_base: bool = Form(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a resume file and parse its content."""
    content = await file.read()
    text_content = content.decode("utf-8", errors="ignore")

    resume = Resume(
        user_id=current_user.id,
        title=title,
        original_filename=file.filename,
        parsed_content=text_content,
        is_base=is_base,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


@router.post("/create", response_model=ResumeResponse)
async def create_resume_text(
    title: str = Form(...),
    content: str = Form(...),
    is_base: bool = Form(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a resume from text content."""
    resume = Resume(
        user_id=current_user.id,
        title=title,
        parsed_content=content,
        is_base=is_base,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


@router.get("/", response_model=list[ResumeResponse])
async def list_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all resumes for the current user."""
    return db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.created_at.desc()).all()


@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific resume."""
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume


@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a resume."""
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    db.delete(resume)
    db.commit()
    return {"message": "Resume deleted successfully"}


@router.post("/{resume_id}/tailor", response_model=TailorResponse)
async def tailor_resume(
    resume_id: int,
    request: TailorRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Tailor a resume for a specific job description."""
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    result = await ai_service.tailor_resume(
        resume_content=resume.parsed_content or "",
        job_description=request.job_description,
        job_title=request.job_title,
        company=request.company,
    )

    # Save the tailored version
    tailored = TailoredResume(
        resume_id=resume.id,
        tailored_content=result["tailored_content"],
        changes_summary=result["changes_summary"],
    )
    db.add(tailored)
    db.commit()
    db.refresh(tailored)

    return TailorResponse(
        id=tailored.id,
        tailored_content=result["tailored_content"],
        changes_summary=result["changes_summary"],
    )


@router.post("/{resume_id}/ats-score", response_model=ATSAnalysisResponse)
async def analyze_ats(
    resume_id: int,
    job_description: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Analyze ATS compatibility of a resume for a specific job."""
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    analysis = await ai_service.analyze_ats_compatibility(
        resume_content=resume.parsed_content or "",
        job_description=job_description,
    )

    # Update ATS score on resume
    if "ats_score" in analysis:
        resume.ats_score = analysis["ats_score"]
        db.commit()

    return ATSAnalysisResponse(**{
        "ats_score": analysis.get("ats_score", 0),
        "keyword_match": analysis.get("keyword_match", 0),
        "formatting_score": analysis.get("formatting_score", 0),
        "section_completeness": analysis.get("section_completeness", 0),
        "missing_keywords": analysis.get("missing_keywords", []),
        "strengths": analysis.get("strengths", []),
        "improvements": analysis.get("improvements", []),
        "recommended_actions": analysis.get("recommended_actions", []),
    })


@router.post("/tailor-text", response_model=TailorResponse)
async def tailor_resume_text(
    resume_content: str = Form(...),
    job_title: str = Form(""),
    company: str = Form(""),
    job_description: str = Form(...),
    current_user: User = Depends(get_current_user),
):
    """Tailor resume text directly without saving."""
    result = await ai_service.tailor_resume(
        resume_content=resume_content,
        job_description=job_description,
        job_title=job_title,
        company=company,
    )
    return TailorResponse(
        tailored_content=result["tailored_content"],
        changes_summary=result["changes_summary"],
    )


@router.post("/ats-analyze", response_model=ATSAnalysisResponse)
async def analyze_ats_text(
    resume_content: str = Form(...),
    job_description: str = Form(...),
    current_user: User = Depends(get_current_user),
):
    """Analyze ATS compatibility without saving."""
    analysis = await ai_service.analyze_ats_compatibility(
        resume_content=resume_content,
        job_description=job_description,
    )
    return ATSAnalysisResponse(**{
        "ats_score": analysis.get("ats_score", 0),
        "keyword_match": analysis.get("keyword_match", 0),
        "formatting_score": analysis.get("formatting_score", 0),
        "section_completeness": analysis.get("section_completeness", 0),
        "missing_keywords": analysis.get("missing_keywords", []),
        "strengths": analysis.get("strengths", []),
        "improvements": analysis.get("improvements", []),
        "recommended_actions": analysis.get("recommended_actions", []),
    })
