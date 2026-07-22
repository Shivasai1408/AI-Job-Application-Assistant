"""
ATS (Applicant Tracking System) scoring service.
Analyzes resume compatibility with job descriptions.
"""
from typing import Dict, Any, Optional, List
from app.services.ai_service import ai_service


class ATSScorerService:
    """Service for analyzing resume ATS compatibility."""

    async def score_resume_for_job(self, resume_content: str, job_description: str) -> Dict[str, Any]:
        """Get ATS compatibility score and analysis for a resume against a job."""
        return await ai_service.analyze_ats_compatibility(resume_content, job_description)

    async def get_improvement_suggestions(self, resume_content: str, job_description: str) -> List[str]:
        """Get specific suggestions to improve ATS compatibility."""
        analysis = await ai_service.analyze_ats_compatibility(resume_content, job_description)
        return analysis.get("recommended_actions", analysis.get("improvements", []))

    async def compare_resumes_for_job(
        self,
        resumes: List[Dict[str, str]],
        job_description: str,
    ) -> List[Dict[str, Any]]:
        """Compare multiple resumes against a single job description."""
        results = []
        for resume in resumes:
            score = await ai_service.analyze_ats_compatibility(
                resume.get("content", ""),
                job_description,
            )
            results.append({
                "resume_id": resume.get("id"),
                "resume_title": resume.get("title", "Untitled"),
                **score,
            })
        # Sort by ATS score descending
        results.sort(key=lambda x: x.get("ats_score", 0), reverse=True)
        return results

    def analyze_keyword_density(self, text: str, keywords: List[str]) -> Dict[str, int]:
        """Analyze how frequently keywords appear in a resume."""
        text_lower = text.lower()
        keyword_counts = {}
        for keyword in keywords:
            keyword_counts[keyword] = text_lower.count(keyword.lower())
        return keyword_counts


ats_scorer_service = ATSScorerService()
