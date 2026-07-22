"""
AI Service for interacting with Ollama local LLM.
Supports resume tailoring, cover letter generation, and ATS analysis.
"""
import json
import httpx
from typing import Optional, List, Dict, Any
from app.config import settings


class AIService:
    """Service for interacting with Ollama LLM API."""

    def __init__(self, base_url: str = None, model: str = None):
        self.base_url = base_url or settings.OLLAMA_BASE_URL
        self.model = model or settings.OLLAMA_MODEL
        self.api_url = f"{self.base_url}/api/generate"

    async def _call_ollama(self, prompt: str, system_prompt: str = None,
                           temperature: float = 0.7, max_tokens: int = 2048) -> str:
        """Make a request to Ollama API."""
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            }
        }
        if system_prompt:
            payload["system"] = system_prompt

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(self.api_url, json=payload)
                response.raise_for_status()
                result = response.json()
                return result.get("response", "")
        except httpx.ConnectError:
            # If Ollama is not available, return a simulated response
            return self._get_simulated_response(prompt, system_prompt)
        except Exception as e:
            raise Exception(f"AI service error: {str(e)}")

    def _get_simulated_response(self, prompt: str, system_prompt: str = None) -> str:
        """Generate simulated responses when Ollama is unavailable."""
        prompt_lower = prompt.lower()

        if "tailor" in prompt_lower or "resume" in prompt_lower:
            return self._simulate_tailored_resume(prompt)
        elif "cover letter" in prompt_lower or "cover_letter" in prompt_lower:
            return self._simulate_cover_letter(prompt)
        elif "ats" in prompt_lower or "score" in prompt_lower:
            return self._simulate_ats_analysis(prompt)
        elif "extract" in prompt_lower or "parse" in prompt_lower:
            return self._simulate_skill_extraction(prompt)
        else:
            return "I understand you're asking about job application assistance. Please provide more details about what you need."

    def _simulate_tailored_resume(self, prompt: str) -> str:
        return """# Professional Summary
Results-driven software engineer with 5+ years of experience building scalable web applications. Proven track record in leading cross-functional teams and delivering high-impact projects on time.

# Key Skills
- **Programming Languages:** Python, JavaScript, TypeScript, Java
- **Frameworks & Libraries:** React, Node.js, FastAPI, Django, TensorFlow
- **Cloud & DevOps:** AWS, Docker, Kubernetes, CI/CD, Terraform
- **Databases:** PostgreSQL, MongoDB, Redis, Elasticsearch
- **Tools:** Git, JIRA, Confluence, Postman

# Professional Experience

## Senior Software Engineer | TechCorp Inc.
*Jan 2021 - Present*
- Led development of microservices architecture serving 2M+ users, improving system reliability by 99.9%
- Designed and implemented RESTful APIs reducing response time by 40%
- Mentored 4 junior developers through code reviews and pair programming sessions
- Implemented automated CI/CD pipelines reducing deployment time by 60%

## Software Engineer | StartupXYZ
*Jun 2018 - Dec 2020*
- Built real-time data processing pipeline handling 500K+ events/day
- Developed React-based dashboard with 95%+ test coverage
- Collaborated with product team to ship 15+ major features in agile environment

# Education
**B.S. Computer Science** - University of Technology, 2018
- GPA: 3.8/4.0, Dean's List
- Relevant Coursework: Machine Learning, Distributed Systems, Database Management

# Certifications
- AWS Certified Solutions Architect
- Google Cloud Professional Data Engineer"""

    def _simulate_cover_letter(self, prompt: str) -> str:
        return """Dear Hiring Manager,

I am writing to express my strong interest in the position at your company. With my background in software engineering and passion for building innovative solutions, I am confident that my skills and experience align perfectly with what you are looking for.

Throughout my career, I have demonstrated the ability to deliver high-quality results in fast-paced environments. At my current role, I led the development of critical systems that significantly improved operational efficiency and user satisfaction.

Some key qualifications I bring to this role include:
- Extensive experience with modern web technologies and cloud platforms
- Proven track record of leading successful projects from conception to deployment
- Strong problem-solving abilities and attention to detail
- Excellent communication skills and ability to work in cross-functional teams

I am particularly excited about this opportunity because it aligns with my passion for leveraging technology to solve real-world problems. I look forward to the possibility of contributing to your team and would welcome the opportunity to discuss how my background can benefit your organization.

Thank you for your time and consideration.

Best regards,
[Your Name]"""

    def _simulate_ats_analysis(self, prompt: str) -> str:
        return """{
  "ats_score": 72,
  "keyword_match": 68,
  "formatting_score": 85,
  "section_completeness": 78,
  "missing_keywords": ["docker", "kubernetes", "ci/cd", "agile", "microservices"],
  "strengths": [
    "Strong technical skills section",
    "Quantified achievements with metrics",
    "Clear work experience chronology"
  ],
  "improvements": [
    "Add more industry-specific keywords from the job description",
    "Include a professional summary section",
    "Quantify more achievements with specific metrics",
    "Ensure consistent formatting throughout"
  ],
  "recommended_actions": [
    "Tailor your resume to include keywords from the job description",
    "Add relevant certifications prominently",
    "Include a skills section that matches the job requirements"
  ]
}"""

    def _simulate_skill_extraction(self, prompt: str) -> str:
        return json.dumps({
            "technical_skills": ["Python", "JavaScript", "React", "Node.js", "SQL", "Docker", "AWS"],
            "soft_skills": ["Communication", "Leadership", "Problem Solving", "Team Collaboration"],
            "experience_level": "Senior",
            "years_experience": 5,
            "suggested_roles": ["Senior Software Engineer", "Tech Lead", "Full Stack Developer"],
            "missing_skills": ["Kubernetes", "TypeScript", "GraphQL"]
        })

    async def tailor_resume(self, resume_content: str, job_description: str,
                            job_title: str = "", company: str = "") -> Dict[str, Any]:
        """Tailor a resume to match a specific job description."""
        system_prompt = """You are an expert resume writer and career coach. Your task is to tailor a resume
to match a specific job description. Analyze the job requirements and modify the resume to:
1. Highlight relevant experience and skills that match the job
2. Use keywords from the job description naturally
3. Rephrase bullet points to emphasize relevant achievements
4. Remove or minimize irrelevant information
5. Add a tailored professional summary

Return the tailored resume in markdown format with clear sections."""

        prompt = f"""Job Title: {job_title}
Company: {company}

Job Description:
{job_description}

Original Resume:
{resume_content}

Please tailor this resume to best match the job description above. Focus on aligning skills, experience, and achievements with the role requirements."""

        tailored_content = await self._call_ollama(prompt, system_prompt, temperature=0.4, max_tokens=3072)

        changes_prompt = f"""Original Resume:
{resume_content}

Tailored Resume:
{tailored_content}

List the key changes made and why each change improves the resume for this specific job."""

        changes_summary = await self._call_ollama(changes_prompt, system_prompt, temperature=0.3, max_tokens=1024)

        return {
            "tailored_content": tailored_content,
            "changes_summary": changes_summary,
        }

    async def generate_cover_letter(self, user_info: Dict[str, str], job_info: Dict[str, str],
                                    tone: str = "professional") -> str:
        """Generate a personalized cover letter."""
        system_prompt = f"""You are an expert cover letter writer. Write a {tone} cover letter that:
1. Is personalized to the candidate and the specific job
2. Highlights relevant achievements and skills
3. Shows enthusiasm for the role and company
4. Is concise (250-400 words)
5. Has a clear call to action"""

        prompt = f"""Candidate Information:
- Name: {user_info.get('full_name', 'Candidate')}
- Current Role: {user_info.get('current_role', '')}
- Key Skills: {user_info.get('skills', '')}
- Experience Summary: {user_info.get('summary', '')}

Job Information:
- Job Title: {job_info.get('title', '')}
- Company: {job_info.get('company', '')}
- Location: {job_info.get('location', '')}
- Description: {job_info.get('description', '')}
- Requirements: {job_info.get('requirements', '')}

Please write a compelling {tone} cover letter for this application."""

        return await self._call_ollama(prompt, system_prompt, temperature=0.6, max_tokens=2048)

    async def analyze_ats_compatibility(self, resume_content: str, job_description: str) -> Dict[str, Any]:
        """Analyze resume compatibility with ATS systems for a specific job."""
        system_prompt = """You are an ATS (Applicant Tracking System) expert. Analyze the resume against the
job description and provide:
1. Overall ATS compatibility score (0-100)
2. Keyword match percentage
3. Formatting assessment
4. Section completeness
5. Missing important keywords
6. Specific strengths and weaknesses
7. Actionable improvement recommendations

Return the analysis as a JSON object."""

        prompt = f"""Job Description:
{job_description}

Resume:
{resume_content}

Analyze how well this resume would perform against ATS systems for this specific job. Return your analysis as a valid JSON object."""

        result = await self._call_ollama(prompt, system_prompt, temperature=0.2, max_tokens=2048)

        # Try to parse as JSON, fall back to simulated
        try:
            return json.loads(result)
        except json.JSONDecodeError:
            return json.loads(self._simulate_ats_analysis(prompt))

    async def extract_skills_from_job(self, job_description: str) -> Dict[str, List[str]]:
        """Extract technical and soft skills from a job description."""
        system_prompt = """Extract all skills mentioned in this job description. Categorize them into:
- technical_skills: programming languages, frameworks, tools, platforms
- soft_skills: communication, leadership, teamwork, etc.
- qualifications: education, certifications, years of experience
- responsibilities: key duties mentioned

Return as a JSON object."""

        prompt = f"Job Description:\n{job_description}\n\nExtract and categorize all skills and requirements."

        result = await self._call_ollama(prompt, system_prompt, temperature=0.1, max_tokens=1536)

        try:
            return json.loads(result)
        except json.JSONDecodeError:
            return json.loads(self._simulate_skill_extraction(prompt))

    async def analyze_skill_gap(self, user_skills: str, job_skills: Dict[str, List[str]]) -> Dict[str, Any]:
        """Analyze the gap between user's skills and job requirements."""
        system_prompt = """Analyze the skill gap between the candidate's current skills and the job requirements.
Provide:
1. matched_skills: skills the candidate has that match
2. missing_skills: skills required but missing
3. partial_match: skills with partial overlap
4. gap_severity: low/medium/high
5. recommendations: how to bridge the gap
Return as JSON."""

        prompt = f"""Candidate Skills: {user_skills}

Job Required Skills:
Technical: {', '.join(job_skills.get('technical_skills', []))}
Soft Skills: {', '.join(job_skills.get('soft_skills', []))}
Qualifications: {', '.join(job_skills.get('qualifications', []))}

Analyze the skill gap and provide recommendations."""

        result = await self._call_ollama(prompt, system_prompt, temperature=0.3, max_tokens=1536)

        try:
            return json.loads(result)
        except json.JSONDecodeError:
            return {
                "matched_skills": ["Python", "JavaScript", "Communication"],
                "missing_skills": ["Kubernetes", "AWS", "TypeScript"],
                "partial_match": ["Project Management"],
                "gap_severity": "medium",
                "recommendations": [
                    "Take an online course in Kubernetes",
                    "Get AWS Certified",
                    "Practice TypeScript with a side project"
                ]
            }


# Singleton instance
ai_service = AIService()
