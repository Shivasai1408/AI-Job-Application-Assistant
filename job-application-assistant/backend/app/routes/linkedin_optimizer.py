"""LinkedIn profile optimization routes for improving profile visibility and reach."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.linkedin_optimizer import LinkedInOptimization, LinkedInKeyword
from app.routes.auth import get_current_user
from pydantic import BaseModel
from datetime import datetime
import json

router = APIRouter(prefix="/api/linkedin", tags=["LinkedIn Optimizer"])


# --- Pydantic Schemas ---

class ProfileSection(BaseModel):
    section_type: str  # headline, about, skills, experience
    content: str

class OptimizeRequest(BaseModel):
    sections: list[ProfileSection]

class OptimizationSuggestion(BaseModel):
    section_type: str
    original: str
    optimized: str
    changes: list[str]
    reasoning: str
    seo_score_improvement: str

class OptimizeResponse(BaseModel):
    suggestions: list[OptimizationSuggestion]
    overall_score: int
    tips: list[str]

class KeywordRequest(BaseModel):
    job_title: str
    industry: Optional[str] = None

class KeywordResponse(BaseModel):
    job_title: str
    industry: Optional[str] = None
    recommended_keywords: list[dict]
    keyword_categories: dict
    optimization_tips: list[str]

class LinkedInAnalyticsResponse(BaseModel):
    profile_strength: int
    sections_complete: int
    total_sections: int
    recommendations: list[str]
    profile_views_trend: str
    search_appearance: str


# --- Mock Optimization ---

def optimize_section(section_type: str, content: str) -> dict:
    optimizations = {
        "headline": {
            "optimized": f"{content} | Specializing in Innovation & Results-Driven Solutions" if len(content) > 10 else f"Experienced {content} Professional | Driving Business Growth Through Technology",
            "changes": [
                "Added industry-specific keywords for better search visibility",
                "Included value proposition to attract recruiters",
                "Optimized character count for full display",
            ],
            "reasoning": "LinkedIn headlines with specific keywords and value propositions get 3x more profile views. Adding a pipe separator helps pack more information.",
            "seo_score_improvement": "+40%",
        },
        "about": {
            "optimized": f"{content}\n\nI am passionate about driving innovation and delivering measurable results. With a proven track record of success, I bring expertise in strategic planning, team leadership, and operational excellence. Let's connect to explore how I can contribute to your organization's success.\n\n#OpenToWork #Professional #IndustryExpert",
            "changes": [
                "Added call-to-action to encourage connections",
                "Included relevant hashtags for discoverability",
                "Added measurable impact language",
                "Improved first-person narrative flow",
            ],
            "reasoning": "LinkedIn About sections with a clear narrative, CTAs, and hashtags receive 2x more connection requests and message inquiries.",
            "seo_score_improvement": "+35%",
        },
        "skills": {
            "optimized": content,  # Would normally reorganize and add missing skills
            "changes": [
                "Reorder skills by relevance and demand",
                "Added industry-standard terminology",
                "Grouped skills by category for clarity",
            ],
            "reasoning": "A well-organized skills section with relevant keywords improves search ranking by up to 50% and helps recruiters find you faster.",
            "seo_score_improvement": "+45%",
        },
        "experience": {
            "optimized": content.replace(".", ".\n\n• Key achievement: Delivered measurable results that improved efficiency by 25% and reduced costs by 15%.\n• Technologies used: [List relevant tools and technologies]\n• Team collaboration: Worked cross-functionally with stakeholders to drive project success.") if "." in content else f"{content}\n\n• Spearheaded initiatives that resulted in significant improvements\n• Collaborated with cross-functional teams to achieve business objectives\n• Implemented best practices that enhanced team productivity",
            "changes": [
                "Added quantified achievements with percentages",
                "Included action verbs for stronger impact",
                "Added technology/tool mentions for keyword optimization",
                "Restructured for better scannability with bullet points",
            ],
            "reasoning": "Experience descriptions with quantified achievements receive 40% more engagement from recruiters and hiring managers.",
            "seo_score_improvement": "+50%",
        },
    }

    result = optimizations.get(section_type, optimizations["headline"])
    return {
        "section_type": section_type,
        "original": content,
        "optimized": result["optimized"],
        "changes": result["changes"],
        "reasoning": result["reasoning"],
        "seo_score_improvement": result["seo_score_improvement"],
    }


def generate_keywords(job_title: str, industry: Optional[str] = None) -> dict:
    keyword_sets = {
        "software engineer": {
            "technical": ["Python", "Java", "JavaScript", "TypeScript", "React", "Node.js", "AWS", "Docker", "Kubernetes", "REST APIs", "Microservices", "CI/CD", "Git", "SQL", "MongoDB"],
            "soft_skills": ["Problem Solving", "Team Collaboration", "Agile Methodology", "Communication", "Leadership", "Critical Thinking"],
            "industry": ["SaaS", "Cloud Computing", "FinTech", "HealthTech", "E-commerce"],
            "certifications": ["AWS Certified", "Google Cloud Certified", "Scrum Master"],
        },
        "data scientist": {
            "technical": ["Machine Learning", "Deep Learning", "Python", "R", "TensorFlow", "PyTorch", "SQL", "Statistics", "NLP", "Computer Vision", "Data Visualization", "Apache Spark"],
            "soft_skills": ["Analytical Thinking", "Problem Solving", "Communication", "Business Acumen", "Storytelling"],
            "industry": ["AI/ML", "Finance", "Healthcare", "Technology", "Research"],
            "certifications": ["TensorFlow Developer", "AWS ML Specialty", "Google Data Engineer"],
        },
        "product manager": {
            "technical": ["Product Strategy", "Roadmapping", "A/B Testing", "Analytics", "JIRA", "Confluence", "SQL", "Agile", "Scrum", "User Research"],
            "soft_skills": ["Leadership", "Cross-functional Collaboration", "Communication", "Stakeholder Management", "Strategic Thinking"],
            "industry": ["SaaS", "B2B", "B2C", "Enterprise", "Consumer Tech"],
            "certifications": ["CSPO", "PMP", "SAFe Agilist"],
        },
    }

    default_set = {
        "technical": ["Python", "Project Management", "Data Analysis", "Communication", "Microsoft Office", "Team Leadership", "Problem Solving"],
        "soft_skills": ["Leadership", "Communication", "Teamwork", "Adaptability", "Time Management"],
        "industry": ["Technology", "Professional Services"],
        "certifications": ["Relevant Professional Certifications"],
    }

    job_key = job_title.lower().strip()
    keywords = keyword_sets.get(job_key, keyword_sets.get(job_key.replace("senior ", "").replace("junior ", ""), default_set))

    # Filter by industry if specified
    if industry:
        for category in keywords:
            keywords[category] = [k for k in keywords[category] if industry.lower() in k.lower() or len(keywords[category]) > 3]
        if not any(keywords.values()):
            keywords = default_set

    return {
        "job_title": job_title,
        "industry": industry,
        "recommended_keywords": [
            {"keyword": kw, "category": cat, "importance": "high" if i < len(kws) // 2 else "medium"}
            for cat, kws in keywords.items()
            for i, kw in enumerate(kws)
        ],
        "keyword_categories": {cat: kws for cat, kws in keywords.items()},
        "optimization_tips": [
            "Include keywords naturally in your headline, about, and experience sections",
            "Add relevant skills to the Skills section for endorsements",
            "Use industry-specific terms that recruiters search for",
            "Keep your profile 100% complete for better search ranking",
            "Update your profile regularly to stay relevant in search results",
        ],
    }


def get_profile_analytics(user: User) -> dict:
    # Calculate profile strength based on completeness
    total_sections = 7
    complete_sections = 0

    if user.full_name: complete_sections += 1
    if user.headline: complete_sections += 1
    if user.summary: complete_sections += 1
    if user.skills: complete_sections += 1
    if user.location: complete_sections += 1
    if user.phone: complete_sections += 1
    if user.experience_years: complete_sections += 1

    profile_strength = int((complete_sections / total_sections) * 100)

    recommendations = []
    if not user.headline:
        recommendations.append("Add a professional headline with keywords")
    if not user.summary:
        recommendations.append("Write an engaging About section")
    if not user.skills:
        recommendations.append("Add skills to improve discoverability")
    if not user.location:
        recommendations.append("Add your location for local search visibility")
    if not user.phone:
        recommendations.append("Add contact information for opportunities")
    if user.experience_years is None or user.experience_years == 0:
        recommendations.append("Add your years of experience")

    return {
        "profile_strength": profile_strength,
        "sections_complete": complete_sections,
        "total_sections": total_sections,
        "recommendations": recommendations,
        "profile_views_trend": "Stable" if profile_strength > 50 else "Below Average",
        "search_appearance": "All Star" if profile_strength >= 80 else "Intermediate" if profile_strength >= 50 else "Beginner",
    }


# --- Routes ---

@router.post("/optimize", response_model=OptimizeResponse)
async def optimize_linkedin_profile(
    request: OptimizeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Accept LinkedIn profile sections and return optimization suggestions."""
    suggestions = []
    for section in request.sections:
        result = optimize_section(section.section_type, section.content)
        suggestion = OptimizationSuggestion(**result)
        suggestions.append(suggestion)

        # Save optimization to database
        opt = LinkedInOptimization(
            user_id=current_user.id,
            section_name=section.section_type,
            original_content=section.content,
            optimized_content=result["optimized"],
            suggestions=json.dumps(result),
        )
        db.add(opt)
    db.commit()

    # Calculate overall score
    scores = {"headline": 65, "about": 55, "skills": 70, "experience": 60}
    overall_score = sum(scores.get(s.section_type, 50) for s in request.sections) // max(len(request.sections), 1)

    tips = [
        "Use a professional photo - profiles with photos get 14x more views",
        "Customize your LinkedIn URL to include your name",
        "Post regular updates to stay visible in your network",
        "Get recommendations from colleagues and managers",
        "Join relevant LinkedIn groups in your industry",
        "Enable #OpenToWork to signal you're available for opportunities",
    ]

    return OptimizeResponse(
        suggestions=suggestions,
        overall_score=overall_score,
        tips=tips,
    )


@router.post("/keywords", response_model=KeywordResponse)
async def get_linkedin_keywords(
    request: KeywordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return recommended keywords for LinkedIn profile based on job title/industry."""
    result = generate_keywords(request.job_title, request.industry)

    # Save keywords to history
    kw_record = LinkedInKeyword(
        user_id=current_user.id,
        job_title=request.job_title,
        industry=request.industry,
        keywords=json.dumps(result["recommended_keywords"]),
    )
    db.add(kw_record)
    db.commit()

    return KeywordResponse(**result)


@router.get("/analytics", response_model=LinkedInAnalyticsResponse)
async def get_linkedin_analytics(
    current_user: User = Depends(get_current_user),
):
    """Return profile strength score and recommendations."""
    result = get_profile_analytics(current_user)
    return LinkedInAnalyticsResponse(**result)
