"""Interview preparation routes for generating questions, evaluating answers, and tracking practice."""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.interview_prep import InterviewQuestion, InterviewSession
from app.routes.auth import get_current_user
from pydantic import BaseModel
from datetime import datetime
import json

router = APIRouter(prefix="/api/interview-prep", tags=["Interview Preparation"])


# --- Pydantic Schemas ---

class InterviewPrepRequest(BaseModel):
    job_title: str
    company: Optional[str] = None
    skills: Optional[str] = None
    difficulty: Optional[str] = "medium"

class InterviewQuestionResponse(BaseModel):
    id: Optional[int] = None
    category: str
    question: str
    sample_answer: Optional[str] = None
    difficulty: str
    tips: Optional[list[str]] = None

class InterviewPrepResponse(BaseModel):
    questions: list[InterviewQuestionResponse]
    total_questions: int
    categories_covered: list[str]
    prep_tips: list[str]

class EvaluateRequest(BaseModel):
    question: str
    answer: str
    category: Optional[str] = None
    job_title: Optional[str] = None

class EvaluateResponse(BaseModel):
    score: int
    feedback: str
    strengths: list[str]
    areas_for_improvement: list[str]
    suggestions: list[str]
    confidence_assessment: str
    sample_answer: Optional[str] = None
    key_points_missed: list[str]

class QuestionHistoryResponse(BaseModel):
    id: int
    job_title: Optional[str] = None
    company: Optional[str] = None
    question: str
    category: str
    user_answer: Optional[str] = None
    score: Optional[int] = None
    feedback: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Mock Data ---

def get_mock_questions(job_title: str, company: Optional[str] = None, skills: Optional[str] = None, difficulty: str = "medium") -> list[dict]:
    questions_by_category = {
        "technical": [
            {
                "question": f"Explain the architecture of a scalable {job_title} system you've designed. What trade-offs did you consider?",
                "sample_answer": f"A well-designed {job_title} system typically follows a microservices architecture with clear separation of concerns. Key considerations include horizontal scaling, database sharding, caching strategies, and asynchronous processing using message queues.",
                "difficulty": "hard",
                "tips": ["Use specific examples from past projects", "Discuss trade-offs explicitly", "Mention scalability metrics"],
            },
            {
                "question": f"How do you stay current with the latest developments in {skills or 'your field'}?",
                "sample_answer": "I follow industry blogs, participate in open-source projects, attend conferences, and complete online courses. I allocate time each week for learning and experimentation.",
                "difficulty": "easy",
                "tips": ["Mention specific resources", "Show passion for learning", "Discuss practical application"],
            },
            {
                "question": f"Describe your experience with testing and quality assurance in {job_title} projects.",
                "sample_answer": "I follow a comprehensive testing strategy including unit tests, integration tests, end-to-end tests, and performance testing. I aim for at least 80% code coverage and use CI/CD pipelines to automate testing.",
                "difficulty": "medium",
                "tips": ["Mention specific testing frameworks", "Discuss test-driven development", "Talk about automation"],
            },
            {
                "question": "How would you optimize a slow-performing application? Walk us through your debugging process.",
                "sample_answer": "First, I would profile the application to identify bottlenecks using tools like Chrome DevTools or Py-Spy. Then I'd analyze database queries, optimize algorithms, implement caching, and consider architectural changes if needed.",
                "difficulty": "hard",
                "tips": ["Be systematic in your approach", "Mention specific profiling tools", "Discuss both quick wins and long-term solutions"],
            },
            {
                "question": f"What's your experience with cloud services and deployment in {company or 'your previous roles'}?",
                "sample_answer": "I have extensive experience with AWS/GCP/Azure including EC2, S3, Lambda, CloudFormation, and Kubernetes. I've set up CI/CD pipelines using GitHub Actions and Jenkins.",
                "difficulty": "medium",
                "tips": ["Be specific about services used", "Mention infrastructure as code", "Discuss deployment strategies"],
            },
        ],
        "behavioral": [
            {
                "question": "Tell me about a time you had to deal with a difficult team member. How did you handle it?",
                "sample_answer": "I believe in addressing conflicts directly but respectfully. I scheduled a one-on-one meeting to understand their perspective, found common ground, and we established clearer communication protocols. The relationship improved significantly.",
                "difficulty": "medium",
                "tips": ["Use the STAR method", "Focus on resolution", "Show emotional intelligence"],
            },
            {
                "question": "Describe a project that failed. What did you learn from it?",
                "sample_answer": "A project I led missed its deadline due to poor initial requirements gathering. I learned to invest more time in understanding stakeholder needs, breaking down work into smaller deliverables, and maintaining transparent communication about progress.",
                "difficulty": "medium",
                "tips": ["Be honest about failure", "Focus on lessons learned", "Show growth mindset"],
            },
            {
                "question": "Tell me about a time you went above and beyond for a project or team.",
                "sample_answer": "When our team was short-staffed during a critical release, I took on additional responsibilities, worked extra hours, and mentored two junior developers. The project shipped on time and I gained valuable leadership experience.",
                "difficulty": "easy",
                "tips": ["Highlight initiative", "Show team orientation", "Quantify impact when possible"],
            },
            {
                "question": "How do you handle feedback and criticism?",
                "sample_answer": "I view feedback as a gift for growth. I listen actively without becoming defensive, ask clarifying questions, and create an action plan to address the feedback. I follow up after implementing changes to ensure the issue is resolved.",
                "difficulty": "easy",
                "tips": ["Show receptiveness", "Discuss specific examples", "Mention follow-up actions"],
            },
            {
                "question": "Describe a situation where you had to lead a team through a significant change.",
                "sample_answer": "When our team adopted a new technology stack, I organized training sessions, created documentation, and set up pair programming sessions. I maintained open communication about challenges and celebrated small wins to keep morale high.",
                "difficulty": "hard",
                "tips": ["Show leadership skills", "Discuss change management", "Mention team support"],
            },
        ],
        "situational": [
            {
                "question": f"If you were given a project with a tight deadline and limited resources as a {job_title}, how would you prioritize?",
                "sample_answer": "I would first clarify the minimum viable product with stakeholders, identify critical path items, delegate effectively, and communicate early about any risks. I'd also identify what can be simplified or postponed.",
                "difficulty": "medium",
                "tips": ["Show prioritization skills", "Discuss stakeholder management", "Mention risk assessment"],
            },
            {
                "question": "How would you handle a situation where your technical approach conflicts with a senior developer's opinion?",
                "sample_answer": "I would present data-driven evidence for my approach, including benchmarks and prototypes. I'd seek to understand their concerns and find a compromise that incorporates the best of both approaches. The goal is the best outcome, not winning an argument.",
                "difficulty": "medium",
                "tips": ["Show respect for experience", "Use data to support arguments", "Focus on collaboration"],
            },
            {
                "question": f"If you noticed a security vulnerability in production code at {company or 'your company'}, what would you do?",
                "sample_answer": "I would immediately report it to the security team and my manager, document the vulnerability, and if critical, work on a hotfix. I'd also help investigate how it was introduced and suggest process improvements to prevent recurrence.",
                "difficulty": "hard",
                "tips": ["Show urgency and responsibility", "Follow proper channels", "Discuss preventive measures"],
            },
            {
                "question": "How would you explain a complex technical concept to a non-technical stakeholder?",
                "sample_answer": "I would use analogies related to their domain, avoid jargon, use visual aids, and check for understanding frequently. I'd focus on the business impact rather than technical details.",
                "difficulty": "easy",
                "tips": ["Use analogies", "Focus on business value", "Check understanding"],
            },
            {
                "question": "What would you do if you realized your project estimate was significantly off and you would miss the deadline?",
                "sample_answer": "I would communicate the situation to stakeholders as early as possible, explain the reasons, present revised estimates, and offer options. I'd also analyze what caused the misestimation to improve future planning.",
                "difficulty": "medium",
                "tips": ["Communicate early", "Be transparent", "Offer solutions, not just problems"],
            },
        ],
    }

    questions = []
    for category, cat_questions in questions_by_category.items():
        for q in cat_questions:
            questions.append({
                "category": category,
                "question": q["question"],
                "sample_answer": q["sample_answer"],
                "difficulty": q["difficulty"],
                "tips": q["tips"],
            })

    return questions


def evaluate_answer(question: str, answer: str, category: Optional[str] = None) -> dict:
    answer_length = len(answer.split())
    has_structure = any(marker in answer.lower() for marker in ["first", "second", "finally", "firstly", "secondly", "in conclusion"])
    has_example = any(marker in answer.lower() for marker in ["for example", "for instance", "specifically", "in my experience", "at my previous"])
    has_metrics = any(marker in answer.lower() for marker in ["percent", "%", "achieved", "improved", "increased", "reduced", "delivered"])
    has_star = any(marker in answer.lower() for marker in ["situation", "task", "action", "result"])

    # Calculate score
    score = 40  # Base score
    if answer_length > 30:
        score += 10
    if answer_length > 50:
        score += 5
    if has_structure:
        score += 10
    if has_example:
        score += 15
    if has_metrics:
        score += 10
    if has_star:
        score += 10
    if answer_length < 15:
        score -= 15

    score = max(min(score, 100), 10)

    # Generate feedback
    if score >= 85:
        feedback = "Excellent answer! You provided a well-structured response with specific examples and measurable outcomes."
        confidence = "high"
    elif score >= 65:
        feedback = "Good answer with solid content. Adding more specific examples and quantifiable results would make it even stronger."
        confidence = "medium"
    elif score >= 45:
        feedback = "Your answer covers the basics but could benefit from more structure and specific examples. Try using the STAR method to organize your thoughts."
        confidence = "medium"
    else:
        feedback = "Your answer needs more development. Focus on providing specific examples and structuring your response clearly. Consider practicing with common interview questions."
        confidence = "low"

    strengths = []
    areas_for_improvement = []

    if has_structure:
        strengths.append("Good use of structured response")
    else:
        areas_for_improvement.append("Use a clearer structure (e.g., STAR method)")

    if has_example:
        strengths.append("Provided specific examples")
    else:
        areas_for_improvement.append("Include specific examples from your experience")

    if has_metrics:
        strengths.append("Used quantifiable results")
    else:
        areas_for_improvement.append("Add measurable outcomes to strengthen your answer")

    if answer_length > 40:
        strengths.append("Comprehensive response length")
    else:
        areas_for_improvement.append("Expand your answer with more details")

    suggestions = [
        "Practice your answer in front of a mirror or record yourself",
        "Prepare 2-3 specific stories that demonstrate your key skills",
        "Research the company's values and culture beforehand",
        "Prepare questions to ask the interviewer",
        "Follow up with a thank-you email after the interview",
    ]

    key_points_missed = []
    if not has_example:
        key_points_missed.append("Could include a specific example from past experience")
    if not has_metrics:
        key_points_missed.append("Could quantify the impact of your actions")
    if not has_structure:
        key_points_missed.append("Could use STAR method for better organization")

    return {
        "score": score,
        "feedback": feedback,
        "strengths": strengths,
        "areas_for_improvement": areas_for_improvement,
        "suggestions": suggestions,
        "confidence_assessment": confidence,
        "sample_answer": f"A strong answer would: 1) Directly address the question, 2) Provide a specific example using STAR method, 3) Quantify results where possible, 4) Relate back to the role/company you're applying for.",
        "key_points_missed": key_points_missed,
    }


# --- Routes ---

@router.post("/generate", response_model=InterviewPrepResponse)
async def generate_interview_questions(
    request: InterviewPrepRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate AI-powered interview questions based on job title, company, and skills."""
    questions = get_mock_questions(request.job_title, request.company, request.skills, request.difficulty)

    # Save questions to database
    for q in questions[:10]:  # Save first 10 questions
        question_record = InterviewQuestion(
            user_id=current_user.id,
            job_title=request.job_title,
            company=request.company,
            category=q["category"],
            question=q["question"],
            sample_answer=q.get("sample_answer"),
            difficulty=q.get("difficulty", "medium"),
        )
        db.add(question_record)
    db.commit()

    categories = list(set(q["category"] for q in questions))
    prep_tips = [
        "Research the company's products, culture, and recent news",
        "Prepare 3-5 stories using the STAR method",
        "Review technical fundamentals relevant to the role",
        "Prepare thoughtful questions to ask the interviewer",
        "Practice with a friend or use mock interview platforms",
        "Record yourself answering questions to review body language",
        "Prepare examples of leadership, teamwork, and conflict resolution",
    ]

    return InterviewPrepResponse(
        questions=[InterviewQuestionResponse(**q) for q in questions],
        total_questions=len(questions),
        categories_covered=categories,
        prep_tips=prep_tips,
    )


@router.post("/evaluate", response_model=EvaluateResponse)
async def evaluate_answer_endpoint(
    request: EvaluateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Evaluate an interview answer with score, feedback, and suggestions."""
    result = evaluate_answer(request.question, request.answer, request.category)

    # Save to practice history
    session = InterviewSession(
        user_id=current_user.id,
        question=request.question,
        category=request.category or "general",
        user_answer=request.answer,
        score=result["score"],
        feedback=result["feedback"],
        suggestions=json.dumps(result["suggestions"]),
        confidence_assessment=result["confidence_assessment"],
    )
    db.add(session)
    db.commit()

    return EvaluateResponse(**result)


@router.get("/questions", response_model=list[InterviewQuestionResponse])
async def get_sample_questions(
    category: Optional[str] = Query(None, description="Filter by category: technical, behavioral, situational"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty: easy, medium, hard"),
    current_user: User = Depends(get_current_user),
):
    """Get sample interview questions by category and difficulty."""
    all_questions = get_mock_questions("Software Engineer", None, None)

    filtered = all_questions
    if category:
        filtered = [q for q in filtered if q["category"] == category]
    if difficulty:
        filtered = [q for q in filtered if q["difficulty"] == difficulty]

    return [InterviewQuestionResponse(**q) for q in filtered]


@router.get("/history", response_model=list[QuestionHistoryResponse])
async def get_practice_history(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get user's interview practice history."""
    sessions = (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == current_user.id)
        .order_by(InterviewSession.created_at.desc())
        .limit(limit)
        .all()
    )
    return sessions
