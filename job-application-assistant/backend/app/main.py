"""
AI-Powered Intelligent Job Application Assistant - Backend API
FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routes.auth import router as auth_router
from app.routes.resume_routes import router as resume_router
from app.routes.jobs import router as jobs_router
from app.routes.applications import router as applications_router
from app.routes.cover_letter import router as cover_letter_router
from app.routes.interviews import router as interviews_router
from app.routes.alerts import router as alerts_router
from app.routes.skill_gap import router as skill_gap_router
from app.routes.auto_apply import router as auto_apply_router
from app.routes.career_advisor import router as career_advisor_router
from app.routes.interview_prep import router as interview_prep_router
from app.routes.email_generator import router as email_generator_router
from app.routes.portfolio import router as portfolio_router
from app.routes.linkedin_optimizer import router as linkedin_optimizer_router
from app.routes.analytics import router as analytics_router
from app.routes.admin import router as admin_router
from app.routes.forgot_password import router as forgot_password_router
from app.routes.job_analyzer import router as job_analyzer_router
from app.routes.downloads import router as downloads_router

app = FastAPI(
    title="AI Job Application Assistant API",
    description="Intelligent system for tailoring resumes, generating cover letters, analyzing ATS compatibility, tracking applications, scheduling interviews, and more.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration - allow frontend to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(resume_router)
app.include_router(jobs_router)
app.include_router(applications_router)
app.include_router(cover_letter_router)
app.include_router(interviews_router)
app.include_router(alerts_router)
app.include_router(skill_gap_router)
app.include_router(auto_apply_router)
app.include_router(career_advisor_router)
app.include_router(interview_prep_router)
app.include_router(email_generator_router)
app.include_router(portfolio_router)
app.include_router(linkedin_optimizer_router)
app.include_router(analytics_router)
app.include_router(admin_router)
app.include_router(forgot_password_router)
app.include_router(job_analyzer_router)
app.include_router(downloads_router)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    init_db()


@app.get("/")
async def root():
    return {
        "message": "Welcome to AI Job Application Assistant API",
        "version": "2.0.0",
        "docs": "/docs",
        "endpoints": {
            "auth": "/api/auth",
            "resumes": "/api/resumes",
            "jobs": "/api/jobs",
            "applications": "/api/applications",
            "cover_letters": "/api/cover-letters",
            "interviews": "/api/interviews",
            "alerts": "/api/alerts",
            "skills": "/api/skills",
            "auto_apply": "/api/auto-apply",
            "career_advisor": "/api/career",
            "interview_prep": "/api/interview-prep",
            "email_generator": "/api/email",
            "portfolio": "/api/portfolio",
            "linkedin_optimizer": "/api/linkedin",
            "analytics": "/api/analytics",
            "admin": "/api/admin",
            "job_analyzer": "/api/jobs",
            "downloads": "/api/downloads",
        },
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "job-application-assistant"}
