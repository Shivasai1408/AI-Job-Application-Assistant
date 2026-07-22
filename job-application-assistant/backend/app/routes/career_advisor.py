"""Career advisor routes for career path suggestions, salary predictions, and market insights."""
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.career_advice import CareerAdvice, SalaryPrediction
from app.routes.auth import get_current_user
from pydantic import BaseModel
from datetime import datetime
import json

router = APIRouter(prefix="/api/career", tags=["Career Advisor"])


# --- Pydantic Schemas ---

class CareerAdviceRequest(BaseModel):
    skills: str
    experience: str
    education: Optional[str] = None
    interests: Optional[str] = None
    current_role: Optional[str] = None

class CareerPathSuggestion(BaseModel):
    title: str
    description: str
    avg_salary_range: str
    growth_outlook: str
    time_to_transition: str

class Certification(BaseModel):
    name: str
    provider: str
    difficulty: str
    estimated_cost: str
    duration: str
    description: str

class CareerAdviceResponse(BaseModel):
    suggested_paths: list[CareerPathSuggestion]
    salary_ranges: dict
    trending_skills: list[str]
    certifications: list[Certification]
    promotion_roadmap: list[dict]
    market_demand: str

class SalaryPredictionRequest(BaseModel):
    job_title: str
    location: Optional[str] = None
    experience_years: int

class SalaryPredictionResponse(BaseModel):
    job_title: str
    location: Optional[str] = None
    experience_years: int
    predicted_min_salary: float
    predicted_max_salary: float
    predicted_avg_salary: float
    currency: str
    percentile_25: float
    percentile_75: float
    confidence_score: str

class TrendingSkillsResponse(BaseModel):
    trending_skills: list[dict]

class CertificationsResponse(BaseModel):
    certifications: list[Certification]


# --- Mock Data Helpers ---

def get_mock_career_advice(skills: str, experience: str, education: Optional[str] = None) -> dict:
    skill_list = [s.strip() for s in skills.split(",") if s.strip()]
    primary_skill = skill_list[0] if skill_list else "General"

    paths = [
        CareerPathSuggestion(
            title=f"Senior {primary_skill} Engineer",
            description=f"Lead complex projects and mentor junior engineers specializing in {primary_skill}. Drive architectural decisions and cross-team collaboration.",
            avg_salary_range="$120,000 - $180,000",
            growth_outlook="Strong (22% growth projected over next 5 years)",
            time_to_transition="3-5 years",
        ),
        CareerPathSuggestion(
            title=f"{primary_skill} Architect",
            description=f"Design high-level system architecture and define technical strategy for organization-wide {primary_skill} initiatives.",
            avg_salary_range="$150,000 - $220,000",
            growth_outlook="Excellent (28% growth projected)",
            time_to_transition="5-8 years",
        ),
        CareerPathSuggestion(
            title="Engineering Manager",
            description="Lead engineering teams, manage project delivery, and drive technical strategy while developing team members.",
            avg_salary_range="$140,000 - $200,000",
            growth_outlook="Strong (20% growth projected)",
            time_to_transition="4-7 years",
        ),
        CareerPathSuggestion(
            title="Technical Product Manager",
            description=f"Bridge the gap between business needs and technical implementation with expertise in {primary_skill}.",
            avg_salary_range="$130,000 - $190,000",
            growth_outlook="Very Strong (25% growth projected)",
            time_to_transition="2-4 years",
        ),
    ]

    salary_ranges = {
        "entry_level": "$60,000 - $85,000",
        "mid_level": "$85,000 - $120,000",
        "senior_level": "$120,000 - $160,000",
        "lead_level": "$160,000 - $200,000+",
    }

    trending_skills = [
        "Artificial Intelligence & Machine Learning",
        "Cloud Computing (AWS, Azure, GCP)",
        "Cybersecurity",
        "Data Science & Analytics",
        "DevOps & CI/CD",
        "Blockchain Development",
        "Internet of Things (IoT)",
        "Edge Computing",
        "Kubernetes & Containerization",
        "Python & JavaScript Ecosystems",
    ]

    certifications = [
        Certification(
            name="AWS Solutions Architect",
            provider="Amazon Web Services",
            difficulty="Advanced",
            estimated_cost="$150 - $300",
            duration="3-6 months",
            description="Validate expertise in designing distributed systems on AWS.",
        ),
        Certification(
            name="Google Professional Cloud Architect",
            provider="Google Cloud",
            difficulty="Advanced",
            estimated_cost="$200 - $400",
            duration="3-6 months",
            description="Demonstrate ability to design and plan cloud solutions architecture.",
        ),
        Certification(
            name="Microsoft Certified: Azure Solutions Architect",
            provider="Microsoft",
            difficulty="Advanced",
            estimated_cost="$165 - $330",
            duration="3-6 months",
            description="Show expertise in Azure architecture and implementation.",
        ),
        Certification(
            name="Certified Kubernetes Administrator (CKA)",
            provider="CNCF",
            difficulty="Intermediate",
            estimated_cost="$375",
            duration="2-4 months",
            description="Prove proficiency in Kubernetes administration and management.",
        ),
        Certification(
            name="Project Management Professional (PMP)",
            provider="PMI",
            difficulty="Intermediate",
            estimated_cost="$405 - $555",
            duration="3-6 months",
            description="Globally recognized project management certification.",
        ),
    ]

    roadmap = [
        {"step": 1, "title": "Master Core Skills", "description": f"Deepen expertise in {primary_skill} and related technologies. Build 2-3 substantial projects.", "timeline": "6-12 months"},
        {"step": 2, "title": "Earn Relevant Certifications", "description": "Obtain industry-recognized certifications to validate your expertise.", "timeline": "3-6 months"},
        {"step": 3, "title": "Take on Leadership Roles", "description": "Lead projects, mentor juniors, and participate in architectural decisions.", "timeline": "12-18 months"},
        {"step": 4, "title": "Build Your Network", "description": "Speak at conferences, write technical articles, contribute to open source.", "timeline": "6-12 months"},
        {"step": 5, "title": "Target Senior Roles", "description": "Apply for senior positions leveraging your enhanced skills and network.", "timeline": "3-6 months"},
    ]

    return {
        "suggested_paths": [p.model_dump() for p in paths],
        "salary_ranges": salary_ranges,
        "trending_skills": trending_skills,
        "certifications": [c.model_dump() for c in certifications],
        "promotion_roadmap": roadmap,
        "market_demand": f"Demand for professionals with {primary_skill} expertise is very high across all industries, with particular strength in technology, finance, and healthcare sectors.",
    }


def get_mock_salary_prediction(job_title: str, location: str, experience_years: int) -> dict:
    base_salaries = {
        "software engineer": {"min": 70000, "max": 150000},
        "senior software engineer": {"min": 120000, "max": 200000},
        "data scientist": {"min": 90000, "max": 170000},
        "product manager": {"min": 100000, "max": 180000},
        "devops engineer": {"min": 85000, "max": 160000},
        "frontend developer": {"min": 65000, "max": 140000},
        "backend developer": {"min": 75000, "max": 155000},
        "full stack developer": {"min": 70000, "max": 150000},
        "machine learning engineer": {"min": 110000, "max": 200000},
        "cloud architect": {"min": 130000, "max": 220000},
    }

    location_factors = {
        "san francisco": 1.4, "new york": 1.3, "seattle": 1.25,
        "los angeles": 1.2, "chicago": 1.15, "boston": 1.2,
        "austin": 1.1, "denver": 1.05, "remote": 1.0,
    }

    job_key = job_title.lower().strip()
    base = base_salaries.get(job_key, {"min": 60000, "max": 120000})
    location_factor = 1.0
    for key, factor in location_factors.items():
        if location and key in location.lower():
            location_factor = factor
            break

    exp_multiplier = 1.0 + (experience_years * 0.03)
    exp_multiplier = min(exp_multiplier, 2.0)

    avg_salary = ((base["min"] + base["max"]) / 2) * location_factor * exp_multiplier
    min_salary = base["min"] * location_factor * exp_multiplier * 0.85
    max_salary = base["max"] * location_factor * exp_multiplier * 1.1

    return {
        "job_title": job_title,
        "location": location,
        "experience_years": experience_years,
        "predicted_min_salary": round(min_salary, -2),
        "predicted_max_salary": round(max_salary, -2),
        "predicted_avg_salary": round(avg_salary, -2),
        "currency": "USD",
        "percentile_25": round(min_salary * 0.9, -2),
        "percentile_75": round(max_salary * 0.9, -2),
        "confidence_score": "High" if experience_years >= 5 else "Medium",
    }


def get_mock_trending_skills() -> list[dict]:
    return [
        {"name": "Artificial Intelligence", "growth": "+245%", "category": "AI/ML", "demand": "Critical"},
        {"name": "Machine Learning", "growth": "+210%", "category": "AI/ML", "demand": "Critical"},
        {"name": "Cloud Computing (AWS/Azure/GCP)", "growth": "+180%", "category": "Cloud", "demand": "High"},
        {"name": "Cybersecurity", "growth": "+165%", "category": "Security", "demand": "Critical"},
        {"name": "Data Science", "growth": "+150%", "category": "Data", "demand": "High"},
        {"name": "Python", "growth": "+140%", "category": "Programming", "demand": "High"},
        {"name": "Kubernetes", "growth": "+130%", "category": "DevOps", "demand": "High"},
        {"name": "TypeScript", "growth": "+120%", "category": "Programming", "demand": "High"},
        {"name": "React", "growth": "+110%", "category": "Frontend", "demand": "High"},
        {"name": "DevOps", "growth": "+105%", "category": "DevOps", "demand": "High"},
        {"name": "Blockchain", "growth": "+95%", "category": "Emerging Tech", "demand": "Growing"},
        {"name": "IoT", "growth": "+85%", "category": "Emerging Tech", "demand": "Growing"},
    ]


def get_mock_certifications() -> list[dict]:
    return [
        {"name": "AWS Certified Solutions Architect", "provider": "Amazon", "field": "Cloud Computing", "cost": "$300", "duration": "4-6 months", "popularity": 95},
        {"name": "Certified Kubernetes Administrator", "provider": "CNCF", "field": "DevOps", "cost": "$375", "duration": "3-5 months", "popularity": 88},
        {"name": "Google Professional Data Engineer", "provider": "Google", "field": "Data Engineering", "cost": "$200", "duration": "3-6 months", "popularity": 82},
        {"name": "Microsoft Azure Solutions Architect", "provider": "Microsoft", "field": "Cloud Computing", "cost": "$165", "duration": "4-6 months", "popularity": 85},
        {"name": "Certified Information Systems Security Professional (CISSP)", "provider": "ISC²", "field": "Cybersecurity", "cost": "$749", "duration": "6-12 months", "popularity": 90},
        {"name": "Project Management Professional (PMP)", "provider": "PMI", "field": "Project Management", "cost": "$555", "duration": "3-6 months", "popularity": 92},
        {"name": "Certified ScrumMaster", "provider": "Scrum Alliance", "field": "Agile", "cost": "$995", "duration": "2-4 weeks", "popularity": 87},
        {"name": "Google Cloud Professional Cloud Architect", "provider": "Google", "field": "Cloud Computing", "cost": "$200", "duration": "3-6 months", "popularity": 80},
    ]


# --- Routes ---

@router.post("/advice", response_model=CareerAdviceResponse)
async def get_career_advice(
    request: CareerAdviceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get career path suggestions, salary ranges, trending skills, certifications, and promotion roadmap."""
    result = get_mock_career_advice(request.skills, request.experience, request.education)

    # Save to history
    advice = CareerAdvice(
        user_id=current_user.id,
        advice_type="career_path",
        input_data=json.dumps(request.model_dump()),
        result_data=json.dumps(result),
    )
    db.add(advice)
    db.commit()

    return CareerAdviceResponse(**result)


@router.post("/salary-prediction", response_model=SalaryPredictionResponse)
async def predict_salary(
    request: SalaryPredictionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get predicted salary range based on job title, location, and experience."""
    result = get_mock_salary_prediction(request.job_title, request.location or "", request.experience_years)

    # Save to history
    prediction = SalaryPrediction(
        user_id=current_user.id,
        job_title=request.job_title,
        location=request.location,
        experience_years=request.experience_years,
        predicted_min_salary=result["predicted_min_salary"],
        predicted_max_salary=result["predicted_max_salary"],
        predicted_avg_salary=result["predicted_avg_salary"],
    )
    db.add(prediction)
    db.commit()

    return SalaryPredictionResponse(**result)


@router.get("/trending-skills", response_model=TrendingSkillsResponse)
async def get_trending_skills(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get list of trending skills in the market."""
    skills = get_mock_trending_skills()
    return TrendingSkillsResponse(trending_skills=skills)


@router.get("/certifications", response_model=CertificationsResponse)
async def get_certifications(
    field: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get recommended certifications by field."""
    certs = get_mock_certifications()
    if field:
        certs = [c for c in certs if field.lower() in c["field"].lower()]
    return CertificationsResponse(certifications=certs)
