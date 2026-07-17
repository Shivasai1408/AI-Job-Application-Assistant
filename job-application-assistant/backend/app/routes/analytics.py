"""Analytics routes for application statistics, trends, and insights."""
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.application import Application
from app.models.job import Job
from app.models.interview import Interview
from app.models.analytics import AnalyticsSnapshot
from app.routes.auth import get_current_user
from pydantic import BaseModel
from datetime import datetime, timedelta
import json
import math

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


# --- Pydantic Schemas ---

class OverviewResponse(BaseModel):
    total_applications: int
    active_applications: int
    interviews_scheduled: int
    offers_received: int
    rejections: int
    success_rate: float
    profile_completion: int
    resume_score: int
    applications_this_week: int
    response_rate: float

class MonthlyDataPoint(BaseModel):
    month: str
    year: int
    applications: int
    interviews: int
    offers: int
    rejections: int

class MonthlyResponse(BaseModel):
    data: list[MonthlyDataPoint]
    total_applications_last_year: int
    average_per_month: float
    best_month: str
    growth_rate: float

class SkillDataPoint(BaseModel):
    date: str
    skills_added: int
    total_skills: int

class SkillsGrowthResponse(BaseModel):
    data: list[SkillDataPoint]
    current_skills_count: int
    skills_added_total: int
    most_recent_skills: list[str]

class ATSTrendPoint(BaseModel):
    date: str
    score: int
    resume_title: str

class ATSTrendResponse(BaseModel):
    data: list[ATSTrendPoint]
    average_score: float
    highest_score: int
    trend_direction: str

class SuccessRateBySource(BaseModel):
    source: str
    applications: int
    interviews: int
    offers: int
    success_rate: float

class SuccessRateResponse(BaseModel):
    data: list[SuccessRateBySource]
    overall_success_rate: float
    best_source: str
    recommendation: str


# --- Mock Data Helpers ---

def get_mock_monthly_data() -> list[dict]:
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    current_year = datetime.utcnow().year
    current_month = datetime.utcnow().month

    data = []
    for i in range(12):
        month_idx = (current_month - 1 - i) % 12
        year = current_year - (1 if month_idx > current_month - 1 else 0)
        month_name = months[month_idx]

        import random
        random.seed(hash(f"{year}-{month_name}"))
        data.append({
            "month": month_name,
            "year": year,
            "applications": random.randint(5, 30),
            "interviews": random.randint(0, 8),
            "offers": random.randint(0, 4),
            "rejections": random.randint(1, 10),
        })

    return list(reversed(data))


def get_mock_skills_growth(user: User) -> list[dict]:
    skills = [s.strip() for s in (user.skills or "").split(",") if s.strip()]
    current_skills_count = len(skills)

    import random
    random.seed(hash(str(user.id)))

    data = []
    total = 0
    for i in range(12):
        added = random.randint(0, 3)
        total += added
        month = (datetime.utcnow() - timedelta(days=30 * (11 - i)))
        data.append({
            "date": month.strftime("%Y-%m"),
            "skills_added": added,
            "total_skills": total,
        })

    return data


def get_mock_ats_trend() -> list[dict]:
    import random
    random.seed(42)

    data = []
    score = 55
    resume_titles = [
        "Original Resume",
        "Tailored for Google",
        "Tailored for Microsoft",
        "Tailored for Amazon",
        "Updated V2",
        "Professional Template",
        "ATS Optimized V1",
        "ATS Optimized V2",
    ]

    for i, title in enumerate(resume_titles):
        score = min(95, score + random.randint(-5, 12))
        score = max(30, score)
        date = (datetime.utcnow() - timedelta(days=15 * (len(resume_titles) - 1 - i)))
        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "score": score,
            "resume_title": title,
        })

    return data


def get_mock_success_rate() -> list[dict]:
    sources = [
        {"source": "LinkedIn", "applications": 45, "interviews": 12, "offers": 5},
        {"source": "Indeed", "applications": 60, "interviews": 10, "offers": 3},
        {"source": "Company Website", "applications": 25, "interviews": 8, "offers": 4},
        {"source": "Glassdoor", "applications": 15, "interviews": 3, "offers": 1},
        {"source": "Referral", "applications": 10, "interviews": 7, "offers": 5},
        {"source": "AngelList", "applications": 8, "interviews": 2, "offers": 1},
        {"source": "ZipRecruiter", "applications": 20, "interviews": 4, "offers": 1},
    ]

    data = []
    for s in sources:
        interview_rate = (s["interviews"] / s["applications"] * 100) if s["applications"] > 0 else 0
        offer_rate = (s["offers"] / s["applications"] * 100) if s["applications"] > 0 else 0
        data.append({
            "source": s["source"],
            "applications": s["applications"],
            "interviews": s["interviews"],
            "offers": s["offers"],
            "success_rate": round(offer_rate, 1),
        })

    return data


# --- Routes ---

@router.get("/overview", response_model=OverviewResponse)
async def get_analytics_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return overview stats: total applications, interviews, offers, rejections, etc."""
    apps = db.query(Application).filter(Application.user_id == current_user.id).all()
    interviews = db.query(Interview).filter(Interview.user_id == current_user.id).all()

    total_apps = len(apps)
    active_apps = sum(1 for a in apps if a.status in ("submitted", "reviewing", "interview"))
    interviews_count = sum(1 for a in apps if a.status == "interview" or a.interview_date is not None)
    offers = sum(1 for a in apps if a.status == "offer")
    rejections = sum(1 for a in apps if a.status == "rejected")

    # Calculate profile completion
    completion_fields = [
        current_user.full_name, current_user.headline, current_user.summary,
        current_user.skills, current_user.location, current_user.phone,
    ]
    filled = sum(1 for f in completion_fields if f)
    profile_completion = int((filled / len(completion_fields)) * 100)

    # Weekly applications
    week_ago = datetime.utcnow() - timedelta(days=7)
    weekly_apps = sum(1 for a in apps if a.created_at and a.created_at >= week_ago)

    # Success rate
    total_decided = offers + rejections
    success_rate = round((offers / total_decided * 100), 1) if total_decided > 0 else 0

    # Response rate
    responded = sum(1 for a in apps if a.status in ("interview", "offer", "rejected"))
    response_rate = round((responded / total_apps * 100), 1) if total_apps > 0 else 0

    return OverviewResponse(
        total_applications=total_apps,
        active_applications=active_apps,
        interviews_scheduled=interviews_count,
        offers_received=offers,
        rejections=rejections,
        success_rate=success_rate,
        profile_completion=profile_completion,
        resume_score=75,  # Mock score
        applications_this_week=weekly_apps,
        response_rate=response_rate,
    )


@router.get("/monthly", response_model=MonthlyResponse)
async def get_monthly_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return monthly application data for charts (last 12 months)."""
    data = get_mock_monthly_data()

    total = sum(d["applications"] for d in data)
    avg = round(total / len(data), 1) if data else 0
    best_month = max(data, key=lambda d: d["applications"]) if data else {}

    # Calculate growth (comparing last 3 months to previous 3 months)
    if len(data) >= 6:
        recent = sum(d["applications"] for d in data[-3:])
        previous = sum(d["applications"] for d in data[-6:-3])
        growth = round(((recent - previous) / previous * 100), 1) if previous > 0 else 0
    else:
        growth = 0

    return MonthlyResponse(
        data=[MonthlyDataPoint(**d) for d in data],
        total_applications_last_year=total,
        average_per_month=avg,
        best_month=f"{best_month.get('month', '')} {best_month.get('year', '')}",
        growth_rate=growth,
    )


@router.get("/skills-growth", response_model=SkillsGrowthResponse)
async def get_skills_growth(
    current_user: User = Depends(get_current_user),
):
    """Return skills added over time."""
    data = get_mock_skills_growth(current_user)
    skills = [s.strip() for s in (current_user.skills or "").split(",") if s.strip()]

    total_added = sum(d["skills_added"] for d in data)
    recent_skills = skills[-5:] if skills else []

    return SkillsGrowthResponse(
        data=[SkillDataPoint(**d) for d in data],
        current_skills_count=len(skills),
        skills_added_total=total_added,
        most_recent_skills=recent_skills,
    )


@router.get("/ats-trend", response_model=ATSTrendResponse)
async def get_ats_trend(
    current_user: User = Depends(get_current_user),
):
    """Return ATS score trend data."""
    data = get_mock_ats_trend()
    scores = [d["score"] for d in data]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0
    highest = max(scores) if scores else 0

    # Determine trend direction
    if len(scores) >= 2:
        first_half = sum(scores[:len(scores)//2]) / (len(scores)//2)
        second_half = sum(scores[len(scores)//2:]) / (len(scores) - len(scores)//2)
        if second_half > first_half + 5:
            trend = "improving"
        elif second_half < first_half - 5:
            trend = "declining"
        else:
            trend = "stable"
    else:
        trend = "stable"

    return ATSTrendResponse(
        data=[ATSTrendPoint(**d) for d in data],
        average_score=avg_score,
        highest_score=highest,
        trend_direction=trend,
    )


@router.get("/success-rate", response_model=SuccessRateResponse)
async def get_success_rate(
    current_user: User = Depends(get_current_user),
):
    """Return application success rate by source."""
    data = get_mock_success_rate()
    overall = round(sum(d["success_rate"] for d in data) / len(data), 1) if data else 0
    best = max(data, key=lambda d: d["success_rate"]) if data else {}

    return SuccessRateResponse(
        data=[SuccessRateBySource(**d) for d in data],
        overall_success_rate=overall,
        best_source=best.get("source", ""),
        recommendation=f"Apply through referrals and company websites for the highest success rate. {best.get('source', '')} shows the strongest conversion.",
    )
