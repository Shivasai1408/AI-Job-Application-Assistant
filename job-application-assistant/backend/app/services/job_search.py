"""
Job search service for fetching and managing job listings.
Supports manual entry and simulated job board integration.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import random


class JobSearchService:
    """Service for searching and managing job listings."""

    # Sample jobs for demo/simulation
    SAMPLE_JOBS = [
        {
            "id": 1,
            "title": "Senior Software Engineer",
            "company": "Google",
            "location": "Mountain View, CA (Remote)",
            "description": "We are looking for a Senior Software Engineer to join our Cloud team. You will design and build distributed systems that power Google Cloud Platform services used by millions of developers worldwide.",
            "requirements": "5+ years of software engineering experience. Strong background in distributed systems, algorithms, and data structures. Experience with C++, Java, or Python. BS/MS in Computer Science or related field.",
            "salary_range": "$180,000 - $250,000",
            "job_type": "Full-time",
            "experience_level": "Senior",
            "industry": "Technology",
            "source": "LinkedIn",
            "source_url": "https://linkedin.com/jobs/view/1",
            "skills_required": "Python, Java, C++, Distributed Systems, Cloud Computing, Kubernetes, Docker, Algorithms, System Design",
            "posted_date": (datetime.utcnow() - timedelta(days=2)).isoformat(),
            "is_active": True,
        },
        {
            "id": 2,
            "title": "Full Stack Developer",
            "company": "Microsoft",
            "location": "Redmond, WA",
            "description": "Join Microsoft Azure团队 to build next-generation cloud management tools. Work with cutting-edge technologies to create intuitive user experiences for cloud infrastructure management.",
            "requirements": "3+ years experience with React, Node.js, and cloud services. Experience with TypeScript, REST APIs, and database design. Strong problem-solving skills and ability to work in agile environment.",
            "salary_range": "$140,000 - $190,000",
            "job_type": "Full-time",
            "experience_level": "Mid-Senior",
            "industry": "Technology",
            "source": "Indeed",
            "source_url": "https://indeed.com/jobs/view/2",
            "skills_required": "React, Node.js, TypeScript, Azure, REST APIs, SQL, NoSQL, Git, CI/CD",
            "posted_date": (datetime.utcnow() - timedelta(days=5)).isoformat(),
            "is_active": True,
        },
        {
            "id": 3,
            "title": "Machine Learning Engineer",
            "company": "Amazon",
            "location": "Seattle, WA",
            "description": "Amazon's AI team is seeking a Machine Learning Engineer to develop and deploy ML models at scale. You will work on recommendation systems, natural language processing, and computer vision problems.",
            "requirements": "MS or PhD in Computer Science, Machine Learning, or related field. Strong Python skills. Experience with TensorFlow, PyTorch, or similar frameworks. Published research papers a plus.",
            "salary_range": "$200,000 - $300,000",
            "job_type": "Full-time",
            "experience_level": "Senior",
            "industry": "Technology / AI",
            "source": "LinkedIn",
            "source_url": "https://linkedin.com/jobs/view/3",
            "skills_required": "Python, TensorFlow, PyTorch, ML, NLP, Computer Vision, AWS, SQL, Statistics",
            "posted_date": (datetime.utcnow() - timedelta(days=1)).isoformat(),
            "is_active": True,
        },
        {
            "id": 4,
            "title": "Frontend Developer",
            "company": "Apple",
            "location": "Cupertino, CA",
            "description": "Apple's Services team is looking for a Frontend Developer to build beautiful, responsive interfaces for Apple Music and Apple TV+. You will work with a world-class design team to create seamless user experiences.",
            "requirements": "3+ years of frontend development experience. Expert knowledge of JavaScript, HTML5, CSS3. Experience with React or Vue.js. Understanding of performance optimization and accessibility standards.",
            "salary_range": "$150,000 - $200,000",
            "job_type": "Full-time",
            "experience_level": "Mid-Senior",
            "industry": "Technology / Media",
            "source": "Glassdoor",
            "source_url": "https://glassdoor.com/jobs/view/4",
            "skills_required": "JavaScript, TypeScript, React, Vue.js, HTML5, CSS3, Webpack, Performance Optimization, Accessibility",
            "posted_date": (datetime.utcnow() - timedelta(days=3)).isoformat(),
            "is_active": True,
        },
        {
            "id": 5,
            "title": "Data Engineer",
            "company": "Netflix",
            "location": "Los Gatos, CA (Remote)",
            "description": "Netflix's Data Platform team builds and maintains the infrastructure that processes billions of streaming events daily. We need a Data Engineer to help us scale our data pipelines and analytics platform.",
            "requirements": "4+ years in data engineering. Strong SQL skills. Experience with Spark, Kafka, and data warehouse technologies. Knowledge of Python or Scala. Experience with cloud platforms (AWS preferred).",
            "salary_range": "$170,000 - $240,000",
            "job_type": "Full-time",
            "experience_level": "Senior",
            "industry": "Technology / Entertainment",
            "source": "LinkedIn",
            "source_url": "https://linkedin.com/jobs/view/5",
            "skills_required": "SQL, Python, Spark, Kafka, AWS, ETL, Data Warehousing, Scala, Airflow",
            "posted_date": (datetime.utcnow() - timedelta(days=7)).isoformat(),
            "is_active": True,
        },
        {
            "id": 6,
            "title": "DevOps Engineer",
            "company": "Meta",
            "location": "Menlo Park, CA",
            "description": "Meta's Infrastructure team is hiring a DevOps Engineer to build and maintain the systems that keep Facebook, Instagram, and WhatsApp running smoothly for billions of users.",
            "requirements": "5+ years in DevOps/SRE roles. Deep knowledge of Linux, containers (Docker, Kubernetes), and cloud infrastructure (AWS/GCP). Experience with Terraform, Ansible, and monitoring tools.",
            "salary_range": "$175,000 - $235,000",
            "job_type": "Full-time",
            "experience_level": "Senior",
            "industry": "Technology / Social Media",
            "source": "Indeed",
            "source_url": "https://indeed.com/jobs/view/6",
            "skills_required": "Docker, Kubernetes, Terraform, Ansible, AWS, GCP, Linux, CI/CD, Monitoring, Python",
            "posted_date": (datetime.utcnow() - timedelta(days=4)).isoformat(),
            "is_active": True,
        },
        {
            "id": 7,
            "title": "Product Manager",
            "company": "Spotify",
            "location": "New York, NY",
            "description": "Spotify is looking for a Product Manager to lead our Personalization team. You will define and execute the strategy for features that help millions of users discover new music and podcasts they love.",
            "requirements": "5+ years of product management experience. Technical background preferred. Strong analytical skills and experience with A/B testing. Excellent communication and stakeholder management.",
            "salary_range": "$160,000 - $220,000",
            "job_type": "Full-time",
            "experience_level": "Senior",
            "industry": "Technology / Music",
            "source": "LinkedIn",
            "source_url": "https://linkedin.com/jobs/view/7",
            "skills_required": "Product Strategy, A/B Testing, Data Analysis, Agile, SQL, User Research, Roadmapping",
            "posted_date": (datetime.utcnow() - timedelta(days=6)).isoformat(),
            "is_active": True,
        },
        {
            "id": 8,
            "title": "Cybersecurity Analyst",
            "company": "CrowdStrike",
            "location": "Austin, TX (Remote)",
            "description": "Join CrowdStrike's security operations team to protect organizations from cyber threats. You will analyze security incidents, develop detection rules, and respond to advanced persistent threats.",
            "requirements": "3+ years in cybersecurity. Knowledge of network security, endpoint protection, and threat intelligence. Experience with SIEM tools. Security certifications (CISSP, CEH) preferred.",
            "salary_range": "$120,000 - $170,000",
            "job_type": "Full-time",
            "experience_level": "Mid-Senior",
            "industry": "Cybersecurity",
            "source": "Glassdoor",
            "source_url": "https://glassdoor.com/jobs/view/8",
            "skills_required": "Network Security, SIEM, Threat Intelligence, Endpoint Protection, Python, Incident Response, CISSP",
            "posted_date": (datetime.utcnow() - timedelta(days=8)).isoformat(),
            "is_active": True,
        },
    ]

    async def search_jobs(
        self,
        query: str = "",
        location: str = "",
        job_type: str = "",
        experience_level: str = "",
        industry: str = "",
        page: int = 1,
        page_size: int = 20,
    ) -> Dict[str, Any]:
        """Search for jobs with filters."""
        results = self.SAMPLE_JOBS.copy()

        if query:
            query_lower = query.lower()
            results = [
                j for j in results
                if query_lower in j["title"].lower()
                or query_lower in j["company"].lower()
                or query_lower in j["description"].lower()
                or query_lower in j["skills_required"].lower()
            ]

        if location:
            location_lower = location.lower()
            results = [j for j in results if location_lower in j["location"].lower()]

        if job_type:
            results = [j for j in results if job_type.lower() in j["job_type"].lower()]

        if experience_level:
            results = [j for j in results if experience_level.lower() in j["experience_level"].lower()]

        if industry:
            results = [j for j in results if industry.lower() in j["industry"].lower()]

        # Pagination
        total = len(results)
        start = (page - 1) * page_size
        end = start + page_size
        paginated = results[start:end]

        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size,
            "results": paginated,
        }

    async def get_job_details(self, job_id: int) -> Optional[Dict[str, Any]]:
        """Get details for a specific job."""
        for job in self.SAMPLE_JOBS:
            if job["id"] == job_id:
                return job
        return None

    async def get_recommended_jobs(self, user_skills: str, user_experience: str = "",
                                   limit: int = 5) -> List[Dict[str, Any]]:
        """Get job recommendations based on user's skills and experience."""
        user_skills_lower = user_skills.lower()
        scored_jobs = []

        for job in self.SAMPLE_JOBS:
            score = 0
            job_skills = job.get("skills_required", "").lower()

            # Score based on skill overlap
            user_skill_list = [s.strip() for s in user_skills.split(",")]
            for skill in user_skill_list:
                if skill.lower().strip() in job_skills:
                    score += 10

            # Bonus for title/industry match
            if user_experience and user_experience.lower() in job["title"].lower():
                score += 5
            if user_experience and user_experience.lower() in job["experience_level"].lower():
                score += 3

            scored_jobs.append((score, job))

        # Sort by score descending, return top results
        scored_jobs.sort(key=lambda x: x[0], reverse=True)
        return [job for _, job in scored_jobs[:limit]]


job_search_service = JobSearchService()
