"""
Resume tailoring service that uses AI to customize resumes for specific jobs.
"""
from typing import Optional, Dict, Any, List
from app.services.ai_service import ai_service
from app.models.resume import Resume, TailoredResume
from app.database import SessionLocal


class ResumeTailorService:
    """Service for tailoring resumes to job descriptions."""

    async def tailor_resume_for_job(
        self,
        resume_id: int,
        job_description: str,
        job_title: str = "",
        company: str = "",
        user_id: int = None,
    ) -> Dict[str, Any]:
        """Tailor an existing resume for a specific job."""
        # Get the base resume
        db = SessionLocal()
        try:
            resume = db.query(Resume).filter(Resume.id == resume_id).first()
            if not resume:
                raise ValueError(f"Resume with id {resume_id} not found")

            # Call AI service to tailor the resume
            result = await ai_service.tailor_resume(
                resume_content=resume.parsed_content or "",
                job_description=job_description,
                job_title=job_title,
                company=company,
            )

            return {
                "base_resume_id": resume_id,
                "tailored_content": result["tailored_content"],
                "changes_summary": result["changes_summary"],
                "ats_score": None,  # Will be computed later
            }
        finally:
            db.close()

    async def bulk_tailor_for_jobs(
        self,
        resume_content: str,
        jobs: List[Dict[str, str]],
    ) -> List[Dict[str, Any]]:
        """Tailor a resume for multiple jobs at once."""
        results = []
        for job in jobs:
            result = await ai_service.tailor_resume(
                resume_content=resume_content,
                job_description=job.get("description", ""),
                job_title=job.get("title", ""),
                company=job.get("company", ""),
            )
            results.append({
                "job_title": job.get("title"),
                "company": job.get("company"),
                **result,
            })
        return results


resume_tailor_service = ResumeTailorService()
