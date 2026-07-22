"""Job analyzer routes for extracting insights, matching skills, and recommending improvements."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.job import Job
from app.routes.auth import get_current_user
from pydantic import BaseModel
import json

router = APIRouter(prefix="/api/jobs", tags=["Job Analyzer"])


# --- Pydantic Schemas ---

class JobAnalysisRequest(BaseModel):
    job_description: str
    job_title: Optional[str] = None
    company: Optional[str] = None

class JobAnalysisResponse(BaseModel):
    required_skills: list[str]
    preferred_skills: list[str]
    responsibilities: list[str]
    experience_needed: dict
    education: list[str]
    keywords: list[str]
    estimated_interview_difficulty: int
    industry: Optional[str] = None
    role_focus: list[str]
    soft_skills: list[str]
    certifications_preferred: list[str]

class JobMatchRequest(BaseModel):
    job_id: Optional[int] = None
    job_description: Optional[str] = None
    user_skills: Optional[str] = None

class MatchBreakdown(BaseModel):
    category: str
    score: int
    matched: list[str]
    missing: list[str]
    weight: float

class JobMatchResponse(BaseModel):
    match_percentage: int
    overall_assessment: str
    breakdown: list[MatchBreakdown]
    strengths: list[str]
    gaps: list[str]
    recommendations: list[str]

class JobImproveRequest(BaseModel):
    job_description: str
    current_skills: str

class JobImproveResponse(BaseModel):
    missing_skills: list[str]
    learning_resources: list[dict]
    estimated_time_to_acquire: str
    priority_skills: list[str]
    recommended_courses: list[dict]


# --- Mock Analysis ---

def analyze_job_description(description: str, job_title: Optional[str] = None) -> dict:
    desc_lower = description.lower()

    # Extract skills based on keywords
    tech_skills_map = {
        "python": {"category": "Programming", "level": "required"},
        "javascript": {"category": "Programming", "level": "required"},
        "typescript": {"category": "Programming", "level": "required"},
        "java": {"category": "Programming", "level": "required"},
        "react": {"category": "Frontend", "level": "required"},
        "angular": {"category": "Frontend", "level": "preferred"},
        "vue": {"category": "Frontend", "level": "preferred"},
        "node.js": {"category": "Backend", "level": "required"},
        "node": {"category": "Backend", "level": "required"},
        "sql": {"category": "Database", "level": "required"},
        "nosql": {"category": "Database", "level": "preferred"},
        "mongodb": {"category": "Database", "level": "preferred"},
        "aws": {"category": "Cloud", "level": "preferred"},
        "azure": {"category": "Cloud", "level": "preferred"},
        "gcp": {"category": "Cloud", "level": "preferred"},
        "docker": {"category": "DevOps", "level": "preferred"},
        "kubernetes": {"category": "DevOps", "level": "preferred"},
        "ci/cd": {"category": "DevOps", "level": "preferred"},
        "git": {"category": "Tools", "level": "required"},
        "rest api": {"category": "Backend", "level": "required"},
        "graphql": {"category": "Backend", "level": "preferred"},
        "machine learning": {"category": "AI/ML", "level": "preferred"},
        "deep learning": {"category": "AI/ML", "level": "preferred"},
        "agile": {"category": "Methodology", "level": "preferred"},
        "scrum": {"category": "Methodology", "level": "preferred"},
    }

    required_skills = []
    preferred_skills = []
    for skill, info in tech_skills_map.items():
        if skill in desc_lower:
            if info["level"] == "required":
                required_skills.append(skill.title())
            else:
                preferred_skills.append(skill.title())

    # If no skills found, add defaults
    if not required_skills:
        required_skills = ["Python", "JavaScript", "SQL", "Git"]
        preferred_skills = ["React", "AWS", "Docker"]

    # Extract responsibilities
    responsibilities = []
    lines = description.replace("\n\n", "\n").split("\n")
    for line in lines:
        line = line.strip()
        if line.startswith("-") or line.startswith("•") or line.startswith("*"):
            cleaned = line.lstrip("- •*").strip()
            if cleaned and len(cleaned) > 20:
                responsibilities.append(cleaned)

    if not responsibilities:
        responsibilities = [
            "Develop and maintain software applications",
            "Collaborate with cross-functional teams",
            "Write clean, scalable, and efficient code",
            "Participate in code reviews",
            "Troubleshoot and debug issues",
        ]

    # Experience needed
    experience = {"minimum_years": 0, "preferred_years": 0, "description": ""}
    import re
    exp_patterns = re.findall(r'(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+experience', desc_lower)
    if exp_patterns:
        experience["minimum_years"] = int(exp_patterns[0])
        experience["preferred_years"] = int(exp_patterns[-1]) if len(exp_patterns) > 1 else int(exp_patterns[0])
    else:
        experience["minimum_years"] = 2
        experience["preferred_years"] = 4
    experience["description"] = f"{experience['minimum_years']}+ years of relevant experience"

    # Education
    education = []
    edu_keywords = ["bachelor", "master", "phd", "b.s.", "m.s.", "mba", "associate", "degree"]
    for edu in edu_keywords:
        if edu in desc_lower:
            if edu == "bachelor" or edu == "b.s.":
                education.append("Bachelor's Degree in Computer Science or related field")
            elif edu == "master" or edu == "m.s.":
                education.append("Master's Degree preferred")
            elif edu == "phd":
                education.append("PhD in Computer Science or related field")
            elif edu == "mba":
                education.append("MBA preferred")
    if not education:
        education = ["Bachelor's Degree in Computer Science or related field"]

    # Keywords
    keywords = required_skills + preferred_skills + education + ["Agile", "Team Collaboration", "Problem Solving"]
    keywords = list(set(keywords))

    # Interview difficulty
    skill_count = len(required_skills) + len(preferred_skills)
    difficulty = min(10, max(1, skill_count // 2 + 2))

    # Industry detection
    industries = {
        "fintech": "Financial Technology",
        "health": "Healthcare Technology",
        "e-commerce": "E-commerce",
        "saas": "SaaS",
        "ai": "Artificial Intelligence",
        "machine learning": "Artificial Intelligence",
        "blockchain": "Blockchain",
        "cyber": "Cybersecurity",
        "cloud": "Cloud Computing",
        "data": "Data & Analytics",
    }
    detected_industry = None
    for keyword, industry in industries.items():
        if keyword in desc_lower:
            detected_industry = industry
            break
    if not detected_industry:
        detected_industry = "Technology"

    return {
        "required_skills": required_skills,
        "preferred_skills": preferred_skills,
        "responsibilities": responsibilities,
        "experience_needed": experience,
        "education": education,
        "keywords": keywords[:15],
        "estimated_interview_difficulty": difficulty,
        "industry": detected_industry,
        "role_focus": ["Software Development", "System Design", "Team Collaboration"],
        "soft_skills": ["Communication", "Problem Solving", "Teamwork", "Adaptability", "Time Management"],
        "certifications_preferred": ["AWS Certified Developer", "Google Cloud Certification", "Scrum Master"],
    }


def calculate_match(description: str, user_skills: str) -> dict:
    analysis = analyze_job_description(description)
    required = [s.lower() for s in analysis["required_skills"]]
    preferred = [s.lower() for s in analysis["preferred_skills"]]
    user_skill_list = [s.strip().lower() for s in user_skills.split(",") if s.strip()]

    # Skills matching
    matched_required = [s for s in required if any(us in s or s in us for us in user_skill_list)]
    missing_required = [s for s in required if not any(us in s or s in us for us in user_skill_list)]
    matched_preferred = [s for s in preferred if any(us in s or s in us for us in user_skill_list)]
    missing_preferred = [s for s in preferred if not any(us in s or s in us for us in user_skill_list)]

    skills_score = 0
    if required:
        skills_score = int((len(matched_required) / len(required)) * 100)

    # Experience matching (mock)
    exp_score = 70
    education_score = 80
    keyword_score = 65

    # Overall score
    overall = int(
        skills_score * 0.40 +
        exp_score * 0.25 +
        education_score * 0.20 +
        keyword_score * 0.15
    )

    breakdown = [
        MatchBreakdown(
            category="Skills",
            score=skills_score,
            matched=[s.title() for s in matched_required + matched_preferred],
            missing=[s.title() for s in missing_required + missing_preferred],
            weight=0.40,
        ),
        MatchBreakdown(
            category="Experience",
            score=exp_score,
            matched=[f"{analysis['experience_needed']['minimum_years']}+ years in relevant roles"],
            missing=[],
            weight=0.25,
        ),
        MatchBreakdown(
            category="Education",
            score=education_score,
            matched=analysis["education"],
            missing=[],
            weight=0.20,
        ),
        MatchBreakdown(
            category="Keywords & Fit",
            score=keyword_score,
            matched=analysis["keywords"][:5],
            missing=analysis["keywords"][5:10],
            weight=0.15,
        ),
    ]

    if overall >= 80:
        assessment = "Strong match! Your profile aligns well with this position."
    elif overall >= 60:
        assessment = "Good match. Consider addressing the gaps to strengthen your application."
    elif overall >= 40:
        assessment = "Moderate match. You may want to upskill in key areas before applying."
    else:
        assessment = "Low match. Consider focusing on roles that better align with your current skills."

    return {
        "match_percentage": overall,
        "overall_assessment": assessment,
        "breakdown": [b.model_dump() for b in breakdown],
        "strengths": [f"Strong {s.title()} skills" for s in matched_required[:3]] if matched_required else ["Strong foundational skills"],
        "gaps": [f"Missing {s}" for s in missing_required[:3]] if missing_required else ["No significant gaps found"],
        "recommendations": [
            f"Add {', '.join(missing_required[:3])} to your skills" if missing_required else "Your skills align well with this role",
            "Tailor your resume to highlight relevant experience",
            "Research the company and prepare for behavioral questions",
        ],
    }


def get_improvement_suggestions(description: str, current_skills: str) -> dict:
    analysis = analyze_job_description(description)
    required = [s.lower() for s in analysis["required_skills"]]
    preferred = [s.lower() for s in analysis["preferred_skills"]]
    user_skill_list = [s.strip().lower() for s in current_skills.split(",") if s.strip()]

    missing = []
    for skill in required + preferred:
        if not any(us in skill or skill in us for us in user_skill_list):
            missing.append(skill.title())

    missing = list(set(missing))

    resources = [
        {"skill": s, "type": "course", "name": f"Learn {s} - Comprehensive Course", "platform": "Coursera/Udemy", "duration": f"{len(s) * 2} hours", "cost": "Free - $49.99"}
        for s in missing[:5]
    ]

    return {
        "missing_skills": missing,
        "learning_resources": resources,
        "estimated_time_to_acquire": f"{len(missing) * 20}-{len(missing) * 40} hours",
        "priority_skills": missing[:3] if missing else ["No skills to add"],
        "recommended_courses": [
            {"name": f"Complete Guide to {s}", "platform": "Udemy", "rating": 4.5, "url": f"https://example.com/courses/{s.lower().replace(' ', '-')}"}
            for s in missing[:3]
        ] if missing else [
            {"name": "Advanced Skills Development", "platform": "Coursera", "rating": 4.5, "url": "https://example.com/courses/advanced"}
        ],
    }


# --- Routes ---

@router.post("/analyze", response_model=JobAnalysisResponse)
async def analyze_job(
    request: JobAnalysisRequest,
    current_user: User = Depends(get_current_user),
):
    """Extract and return skills, responsibilities, experience, education, and difficulty from a job description."""
    result = analyze_job_description(request.job_description, request.job_title)
    return JobAnalysisResponse(**result)


@router.post("/match", response_model=JobMatchResponse)
async def match_job(
    request: JobMatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Calculate match percentage between user skills and a job."""
    description = request.job_description
    if request.job_id:
        job = db.query(Job).filter(Job.id == request.job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        description = job.description

    if not description:
        raise HTTPException(status_code=400, detail="Job description or job_id is required")

    user_skills = request.user_skills or current_user.skills or ""
    result = calculate_match(description, user_skills)

    return JobMatchResponse(**result)


@router.post("/improve", response_model=JobImproveResponse)
async def improve_job_skills(
    request: JobImproveRequest,
    current_user: User = Depends(get_current_user),
):
    """Accept job description and current skills, return list of missing skills to add."""
    result = get_improvement_suggestions(request.job_description, request.current_skills)
    return JobImproveResponse(**result)
