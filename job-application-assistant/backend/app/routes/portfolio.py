"""Portfolio generation and management routes."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.portfolio import Portfolio
from app.routes.auth import get_current_user
from pydantic import BaseModel
from datetime import datetime
import json

router = APIRouter(prefix="/api/portfolio", tags=["Portfolio"])


# --- Pydantic Schemas ---

class PortfolioCustomization(BaseModel):
    theme: Optional[str] = "modern"
    custom_css: Optional[str] = None
    sections: Optional[list[str]] = None
    section_order: Optional[list[str]] = None

class PortfolioResponse(BaseModel):
    id: int
    theme: str
    custom_css: Optional[str] = None
    sections: Optional[str] = None
    section_order: Optional[str] = None
    generated_html: Optional[str] = None
    is_published: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PortfolioGenerateResponse(BaseModel):
    html: str
    css: str
    preview_url: str
    portfolio_id: int


# --- Mock Portfolio Generation ---

def generate_portfolio_html(user: User, theme: str = "modern") -> str:
    skills_list = [s.strip() for s in (user.skills or "").split(",") if s.strip()]
    skills_html = "".join(f'<span class="skill-tag">{skill}</span>' for skill in skills_list[:10])

    theme_colors = {
        "modern": {"primary": "#2563eb", "secondary": "#1e40af", "bg": "#ffffff", "text": "#1f2937", "accent": "#f59e0b"},
        "classic": {"primary": "#1a365d", "secondary": "#2d3748", "bg": "#f7fafc", "text": "#2d3748", "accent": "#c53030"},
        "minimalist": {"primary": "#000000", "secondary": "#4a5568", "bg": "#ffffff", "text": "#1a202c", "accent": "#718096"},
        "creative": {"primary": "#6b46c1", "secondary": "#d53f8c", "bg": "#faf5ff", "text": "#1a202c", "accent": "#38a169"},
    }
    colors = theme_colors.get(theme, theme_colors["modern"])

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{user.full_name or user.username} - Portfolio</title>
    <style>
        :root {{
            --primary: {colors["primary"]};
            --secondary: {colors["secondary"]};
            --bg: {colors["bg"]};
            --text: {colors["text"]};
            --accent: {colors["accent"]};
        }}
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.6;
        }}
        .container {{ max-width: 1100px; margin: 0 auto; padding: 0 20px; }}
        header {{
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            padding: 60px 0;
            text-align: center;
        }}
        header h1 {{ font-size: 2.5em; margin-bottom: 10px; }}
        header p {{ font-size: 1.2em; opacity: 0.9; }}
        .section {{ padding: 50px 0; border-bottom: 1px solid #e2e8f0; }}
        .section h2 {{ font-size: 1.8em; color: var(--primary); margin-bottom: 25px; }}
        .skills {{ display: flex; flex-wrap: wrap; gap: 10px; }}
        .skill-tag {{
            background: var(--primary);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9em;
        }}
        .about-text {{ font-size: 1.1em; color: #4a5568; }}
        .contact-info {{ display: flex; flex-wrap: wrap; gap: 20px; margin-top: 20px; }}
        .contact-info p {{ color: #4a5568; }}
        footer {{
            background: var(--secondary);
            color: white;
            text-align: center;
            padding: 30px 0;
        }}
        @media (max-width: 768px) {{
            header h1 {{ font-size: 1.8em; }}
            .section {{ padding: 30px 0; }}
        }}
    </style>
</head>
<body>
    <header>
        <div class="container">
            <h1>{user.full_name or user.username}</h1>
            <p>{user.headline or f"Professional with expertise in {user.skills or 'various domains'}"}</p>
            <div class="contact-info">
                {f'<p>📍 {user.location}</p>' if user.location else ''}
                <p>📧 {user.email}</p>
            </div>
        </div>
    </header>

    <section class="section">
        <div class="container">
            <h2>About Me</h2>
            <p class="about-text">{user.summary or f"I am a passionate professional with {user.experience_years or 'several'} years of experience. I specialize in {user.skills or 'my field'} and am dedicated to delivering high-quality results."}</p>
        </div>
    </section>

    <section class="section">
        <div class="container">
            <h2>Skills</h2>
            <div class="skills">
                {skills_html or '<span class="skill-tag">No skills listed</span>'}
            </div>
        </div>
    </section>

    <section class="section">
        <div class="container">
            <h2>Experience</h2>
            <p><strong>Experience Level:</strong> {user.experience_years or 0} years</p>
            <p style="margin-top: 15px; color: #4a5568;">{user.headline or "Professional with diverse experience"}</p>
        </div>
    </section>

    <footer>
        <div class="container">
            <p>&copy; {datetime.utcnow().year} {user.full_name or user.username}. All rights reserved.</p>
            <p style="margin-top: 10px; opacity: 0.8;">Built with AI Job Application Assistant</p>
        </div>
    </footer>
</body>
</html>"""
    return html


# --- Routes ---

@router.get("/generate", response_model=PortfolioGenerateResponse)
async def generate_portfolio(
    theme: Optional[str] = "modern",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a portfolio HTML/CSS for the user based on their profile data."""
    html = generate_portfolio_html(current_user, theme)

    # Save or update portfolio
    portfolio = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).first()
    if portfolio:
        portfolio.generated_html = html
        portfolio.theme = theme
        portfolio.updated_at = datetime.utcnow()
    else:
        portfolio = Portfolio(
            user_id=current_user.id,
            theme=theme,
            generated_html=html,
        )
        db.add(portfolio)
    db.commit()
    db.refresh(portfolio)

    return PortfolioGenerateResponse(
        html=html,
        css="",  # CSS is embedded in HTML
        preview_url=f"/api/portfolio/preview?id={portfolio.id}",
        portfolio_id=portfolio.id,
    )


@router.put("/", response_model=PortfolioResponse)
async def update_portfolio(
    customization: PortfolioCustomization,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save/update portfolio customization (theme, sections, order)."""
    portfolio = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).first()
    if not portfolio:
        portfolio = Portfolio(user_id=current_user.id)
        db.add(portfolio)

    if customization.theme is not None:
        portfolio.theme = customization.theme
    if customization.custom_css is not None:
        portfolio.custom_css = customization.custom_css
    if customization.sections is not None:
        portfolio.sections = json.dumps(customization.sections)
    if customization.section_order is not None:
        portfolio.section_order = json.dumps(customization.section_order)

    portfolio.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(portfolio)
    return portfolio


@router.get("/", response_model=PortfolioResponse)
async def get_portfolio(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get user's saved portfolio."""
    portfolio = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found. Generate one first.")
    return portfolio


@router.get("/preview")
async def preview_portfolio(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the generated portfolio HTML."""
    portfolio = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).first()
    if not portfolio or not portfolio.generated_html:
        raise HTTPException(status_code=404, detail="Portfolio not found. Generate one first.")

    from fastapi.responses import HTMLResponse
    return HTMLResponse(content=portfolio.generated_html)
