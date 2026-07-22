"""Email generation routes for creating professional job-related emails."""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.email_template import EmailTemplate, EmailHistory
from app.routes.auth import get_current_user
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/email", tags=["Email Generator"])


# --- Pydantic Schemas ---

class EmailGenerateRequest(BaseModel):
    email_type: str  # application, follow-up, thank-you, acceptance, rejection
    recipient_name: str
    company_name: str
    job_title: str
    your_name: str
    recipient_email: Optional[str] = None
    additional_details: Optional[str] = None
    tone: Optional[str] = "professional"  # professional, warm, formal, enthusiastic

class EmailResponse(BaseModel):
    subject: str
    body: str
    email_type: str
    generated_at: str

class EmailTemplateResponse(BaseModel):
    id: int
    email_type: str
    name: str
    subject_template: str
    body_template: str

    class Config:
        from_attributes = True

class EmailHistoryResponse(BaseModel):
    id: int
    email_type: str
    recipient_name: Optional[str] = None
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    subject: str
    body: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Mock Email Generation ---

def generate_email_content(
    email_type: str,
    recipient_name: str,
    company_name: str,
    job_title: str,
    your_name: str,
    additional_details: Optional[str] = None,
    tone: str = "professional",
) -> dict:
    templates = {
        "application": {
            "subject": f"Application for {job_title} position at {company_name}",
            "body": f"""Dear {recipient_name},

I am writing to express my strong interest in the {job_title} position at {company_name}. With my background in {additional_details or 'relevant experience and skills'}, I am confident that I would be a valuable addition to your team.

I have always admired {company_name}'s innovative approach to {'technology and product development'}. My experience aligns well with the requirements of this role, and I am excited about the opportunity to contribute to your continued success.

I have attached my resume and cover letter for your review. I would welcome the opportunity to discuss how my skills and experience can benefit {company_name}.

Thank you for considering my application. I look forward to hearing from you.

Best regards,
{your_name}""",
        },
        "follow-up": {
            "subject": f"Follow-up on {job_title} application at {company_name}",
            "body": f"""Dear {recipient_name},

I hope this message finds you well. I am writing to follow up on my application for the {job_title} position at {company_name}, which I submitted on {'recently'}.

I remain very enthusiastic about this opportunity and wanted to reiterate my interest in joining the {company_name} team. I am confident that my skills and experience would make me a strong contributor to your organization.

Please let me know if there are any additional materials or information I can provide to support my application.

Thank you for your time and consideration.

Best regards,
{your_name}""",
        },
        "thank-you": {
            "subject": f"Thank you - {job_title} interview at {company_name}",
            "body": f"""Dear {recipient_name},

Thank you so much for taking the time to meet with me today to discuss the {job_title} position at {company_name}. I truly enjoyed learning more about the team and the exciting work being done at {company_name}.

Our conversation reinforced my enthusiasm for this role and my belief that my skills and experience align well with what your team is looking for. I was particularly inspired by {'the projects and initiatives we discussed'}.

Please feel free to reach out if you need any additional information from me. I look forward to hearing about the next steps in the process.

Thank you again for this opportunity.

Best regards,
{your_name}""",
        },
        "acceptance": {
            "subject": f"Offer Acceptance - {job_title} at {company_name}",
            "body": f"""Dear {recipient_name},

I am delighted to accept the offer for the {job_title} position at {company_name}. Thank you for this wonderful opportunity.

I am very excited to join the team and contribute to the innovative work being done at {company_name}. I am confident that my skills and experience will allow me to make meaningful contributions from the start.

I have reviewed and accepted the terms outlined in the offer letter. Please let me know the next steps regarding onboarding and start date arrangements.

Thank you once again for this opportunity. I look forward to starting this journey with {company_name}.

Warm regards,
{your_name}""",
        },
        "rejection": {
            "subject": f"Regarding {job_title} position at {company_name}",
            "body": f"""Dear {recipient_name},

Thank you for considering my application for the {job_title} position at {company_name}. I appreciate the time and effort your team invested in the interview process.

While I am disappointed not to be moving forward, I respect your decision and wish you the best in finding the right candidate for this role.

I would welcome the opportunity to be considered for future roles at {company_name} that align with my skills and experience. Please keep me in mind for suitable positions.

Thank you again for your time and consideration.

Best regards,
{your_name}""",
        },
    }

    template = templates.get(email_type, templates["application"])
    subject = template["subject"].format(
        recipient_name=recipient_name,
        company_name=company_name,
        job_title=job_title,
        your_name=your_name,
        additional_details=additional_details or "",
    )
    body = template["body"].format(
        recipient_name=recipient_name,
        company_name=company_name,
        job_title=job_title,
        your_name=your_name,
        additional_details=additional_details or "",
    )

    return {
        "subject": subject,
        "body": body,
        "email_type": email_type,
        "generated_at": datetime.utcnow().isoformat(),
    }


def get_email_templates() -> list[dict]:
    return [
        {
            "id": 1,
            "email_type": "application",
            "name": "Job Application",
            "subject_template": "Application for {job_title} position at {company_name}",
            "body_template": "Dear {recipient_name},\n\nI am writing to express my strong interest...",
        },
        {
            "id": 2,
            "email_type": "follow-up",
            "name": "Follow-up Email",
            "subject_template": "Follow-up on {job_title} application at {company_name}",
            "body_template": "Dear {recipient_name},\n\nI hope this message finds you well...",
        },
        {
            "id": 3,
            "email_type": "thank-you",
            "name": "Thank You Email",
            "subject_template": "Thank you - {job_title} interview at {company_name}",
            "body_template": "Dear {recipient_name},\n\nThank you so much for taking the time...",
        },
        {
            "id": 4,
            "email_type": "acceptance",
            "name": "Offer Acceptance",
            "subject_template": "Offer Acceptance - {job_title} at {company_name}",
            "body_template": "Dear {recipient_name},\n\nI am delighted to accept the offer...",
        },
        {
            "id": 5,
            "email_type": "rejection",
            "name": "Polite Rejection",
            "subject_template": "Regarding {job_title} position at {company_name}",
            "body_template": "Dear {recipient_name},\n\nThank you for considering my application...",
        },
    ]


# --- Routes ---

@router.post("/generate", response_model=EmailResponse)
async def generate_email(
    request: EmailGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a professional email based on type and details provided."""
    result = generate_email_content(
        email_type=request.email_type,
        recipient_name=request.recipient_name,
        company_name=request.company_name,
        job_title=request.job_title,
        your_name=request.your_name,
        additional_details=request.additional_details,
        tone=request.tone,
    )

    # Save to history
    history = EmailHistory(
        user_id=current_user.id,
        email_type=request.email_type,
        recipient_name=request.recipient_name,
        company_name=request.company_name,
        job_title=request.job_title,
        subject=result["subject"],
        body=result["body"],
    )
    db.add(history)
    db.commit()

    return EmailResponse(**result)


@router.get("/templates", response_model=list[EmailTemplateResponse])
async def get_email_templates_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get available email templates."""
    templates = db.query(EmailTemplate).all()
    if not templates:
        # Return mock templates
        mock_templates = get_email_templates()
        return [EmailTemplateResponse(**t) for t in mock_templates]
    return templates


@router.get("/history", response_model=list[EmailHistoryResponse])
async def get_email_history(
    limit: int = Query(20, ge=1, le=100),
    email_type: Optional[str] = Query(None, description="Filter by email type"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get user's generated email history."""
    query = db.query(EmailHistory).filter(EmailHistory.user_id == current_user.id)
    if email_type:
        query = query.filter(EmailHistory.email_type == email_type)
    history = query.order_by(EmailHistory.created_at.desc()).limit(limit).all()
    return history
