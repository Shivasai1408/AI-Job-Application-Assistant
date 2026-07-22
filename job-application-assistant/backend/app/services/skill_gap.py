"""Enhanced Skill Gap Analysis Service with learning resources."""
from typing import Dict, Any, List, Optional
from app.services.ai_service import ai_service


# Curated learning resources mapped to skills
LEARNING_RESOURCES = {
    "python": [
        {"name": "Python for Everybody", "url": "https://www.coursera.org/specializations/python", "type": "course", "platform": "Coursera"},
        {"name": "Automate the Boring Stuff", "url": "https://automatetheboringstuff.com/", "type": "book", "platform": "Free"},
        {"name": "Python Official Docs", "url": "https://docs.python.org/3/", "type": "documentation", "platform": "Free"},
    ],
    "javascript": [
        {"name": "JavaScript: The Good Parts", "url": "https://www.oreilly.com/library/view/javascript-the-good/9780596517748/", "type": "book", "platform": "O'Reilly"},
        {"name": "FreeCodeCamp JS", "url": "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/", "type": "course", "platform": "Free"},
    ],
    "typescript": [
        {"name": "TypeScript Handbook", "url": "https://www.typescriptlang.org/docs/", "type": "documentation", "platform": "Free"},
        {"name": "Understanding TypeScript", "url": "https://www.udemy.com/course/understanding-typescript/", "type": "course", "platform": "Udemy"},
    ],
    "react": [
        {"name": "React Official Tutorial", "url": "https://react.dev/learn", "type": "documentation", "platform": "Free"},
        {"name": "Epic React", "url": "https://epicreact.dev/", "type": "course", "platform": "Paid"},
    ],
    "node.js": [
        {"name": "Node.js Official Docs", "url": "https://nodejs.org/en/docs/", "type": "documentation", "platform": "Free"},
        {"name": "The Complete Node.js Course", "url": "https://www.udemy.com/course/the-complete-nodejs-developer-course-2/", "type": "course", "platform": "Udemy"},
    ],
    "docker": [
        {"name": "Docker Curriculum", "url": "https://docker-curriculum.com/", "type": "tutorial", "platform": "Free"},
        {"name": "Docker Mastery", "url": "https://www.udemy.com/course/docker-mastery/", "type": "course", "platform": "Udemy"},
    ],
    "kubernetes": [
        {"name": "Kubernetes Basics", "url": "https://kubernetes.io/docs/tutorials/kubernetes-basics/", "type": "tutorial", "platform": "Free"},
        {"name": "CKAD Certification Course", "url": "https://www.udemy.com/course/certified-kubernetes-application-developer/", "type": "course", "platform": "Udemy"},
    ],
    "aws": [
        {"name": "AWS Free Tier", "url": "https://aws.amazon.com/free/", "type": "practice", "platform": "AWS"},
        {"name": "AWS Certified Solutions Architect", "url": "https://learn.cantrill.io/p/aws-certified-solutions-architect-associate-saa-c03", "type": "course", "platform": "Paid"},
    ],
    "sql": [
        {"name": "SQL for Data Analysis", "url": "https://www.coursera.org/learn/learn-sql-basics-for-data-science", "type": "course", "platform": "Coursera"},
        {"name": "SQL Tutorial (Mode)", "url": "https://mode.com/sql-tutorial/", "type": "tutorial", "platform": "Free"},
    ],
    "machine learning": [
        {"name": "Machine Learning (Andrew Ng)", "url": "https://www.coursera.org/learn/machine-learning", "type": "course", "platform": "Coursera"},
        {"name": "Fast.ai Practical ML", "url": "https://course.fast.ai/", "type": "course", "platform": "Free"},
    ],
    "tensorflow": [
        {"name": "TensorFlow Official Tutorials", "url": "https://www.tensorflow.org/tutorials", "type": "documentation", "platform": "Free"},
        {"name": "DeepLearning.AI TF Course", "url": "https://www.coursera.org/specializations/tensorflow-in-practice", "type": "course", "platform": "Coursera"},
    ],
    "pytorch": [
        {"name": "PyTorch Tutorials", "url": "https://pytorch.org/tutorials/", "type": "documentation", "platform": "Free"},
        {"name": "Deep Learning with PyTorch", "url": "https://www.manning.com/books/deep-learning-with-pytorch", "type": "book", "platform": "Manning"},
    ],
    "git": [
        {"name": "Git Pro Book", "url": "https://git-scm.com/book/en/v2", "type": "book", "platform": "Free"},
        {"name": "Learn Git Branching", "url": "https://learngitbranching.js.org/", "type": "interactive", "platform": "Free"},
    ],
    "ci/cd": [
        {"name": "CI/CD Pipeline Tutorial", "url": "https://www.jenkins.io/doc/tutorials/", "type": "tutorial", "platform": "Free"},
        {"name": "GitHub Actions Docs", "url": "https://docs.github.com/en/actions", "type": "documentation", "platform": "Free"},
    ],
    "agile": [
        {"name": "Agile Fundamentals", "url": "https://www.coursera.org/learn/agile-fundamentals", "type": "course", "platform": "Coursera"},
        {"name": "Scrum Guide", "url": "https://scrumguides.org/", "type": "documentation", "platform": "Free"},
    ],
    "spark": [
        {"name": "Apache Spark Tutorial", "url": "https://spark.apache.org/docs/latest/quick-start.html", "type": "documentation", "platform": "Free"},
        {"name": "Spark with Python", "url": "https://www.udemy.com/course/spark-and-python-for-big-data-with-pyspark/", "type": "course", "platform": "Udemy"},
    ],
    "kafka": [
        {"name": "Kafka Introduction", "url": "https://kafka.apache.org/intro", "type": "documentation", "platform": "Free"},
        {"name": "Apache Kafka Series", "url": "https://www.confluent.io/training/", "type": "course", "platform": "Confluent"},
    ],
    "terraform": [
        {"name": "Terraform Tutorials", "url": "https://learn.hashicorp.com/terraform", "type": "tutorial", "platform": "Free"},
        {"name": "Terraform Up & Running", "url": "https://www.oreilly.com/library/view/terraform-up-and/9781492046899/", "type": "book", "platform": "O'Reilly"},
    ],
    "linux": [
        {"name": "Linux Command Line Basics", "url": "https://ubuntu.com/tutorials/command-line-for-beginners", "type": "tutorial", "platform": "Free"},
        {"name": "Linux Journey", "url": "https://linuxjourney.com/", "type": "course", "platform": "Free"},
    ],
    "communication": [
        {"name": "Effective Communication Course", "url": "https://www.coursera.org/specializations/improve-communication-skills", "type": "course", "platform": "Coursera"},
    ],
    "leadership": [
        {"name": "Leadership Principles", "url": "https://www.coursera.org/learn/leadership-principles", "type": "course", "platform": "Coursera"},
    ],
    "project management": [
        {"name": "PMP Certification Prep", "url": "https://www.pmi.org/certifications/project-management-pmp", "type": "certification", "platform": "PMI"},
        {"name": "Google Project Management", "url": "https://www.coursera.org/professional-certificates/google-project-management", "type": "course", "platform": "Coursera"},
    ],
}


class SkillGapAnalyzerService:
    """Enhanced skill gap analysis with learning recommendations."""

    def __init__(self):
        self.resources = LEARNING_RESOURCES

    async def analyze(self, user_skills: str, required_skills: str) -> Dict[str, Any]:
        """Analyze skill gap with AI-enhanced insights."""
        # Call AI for intelligent analysis
        ai_result = await ai_service.analyze_skill_gap(
            user_skills=user_skills,
            job_skills={"technical_skills": required_skills.split(","), "soft_skills": [], "qualifications": []}
        )

        # Parse skills
        user_skill_list = [s.strip().lower() for s in user_skills.split(",") if s.strip()]
        required_skill_list = [s.strip().lower() for s in required_skills.split(",") if s.strip()]

        # Compute match details
        matched = []
        missing = []
        partial = []

        for req_skill in required_skill_list:
            # Check for exact or partial match
            exact_match = any(req_skill == us for us in user_skill_list)
            partial_match = any(req_skill in us or us in req_skill for us in user_skill_list)

            if exact_match:
                matched.append({"skill": req_skill, "status": "matched", "confidence": "high"})
            elif partial_match:
                partial.append({"skill": req_skill, "status": "partial", "confidence": "medium"})
            else:
                missing.append({"skill": req_skill, "status": "missing", "confidence": "low"})

        # Calculate scores
        total = len(required_skill_list) or 1
        match_score = round((len(matched) / total) * 100)
        partial_score = round((len(partial) / total) * 100)

        # Get learning resources for missing skills
        missing_resources = {}
        for item in missing:
            skill = item["skill"]
            resources = self.get_resources_for_skill(skill)
            if resources:
                missing_resources[skill] = resources

        # Generate learning path
        learning_path = self._generate_learning_path(missing)

        # Determine gap severity
        missing_pct = len(missing) / total
        if missing_pct >= 0.5:
            severity = "high"
        elif missing_pct >= 0.25:
            severity = "medium"
        else:
            severity = "low"

        # Estimated time to fill gaps
        estimated_hours = len(missing) * 15  # Rough estimate: 15h per missing skill

        return {
            "match_score": match_score,
            "partial_match_score": partial_score,
            "missing_score": 100 - match_score - partial_score,
            "gap_severity": severity,
            "total_required_skills": len(required_skill_list),
            "matched_skills": matched,
            "partial_match_skills": partial,
            "missing_skills": missing,
            "learning_resources": missing_resources,
            "learning_path": learning_path,
            "estimated_study_hours": estimated_hours,
            "recommendations": ai_result.get("recommendations", []),
        }

    def get_resources_for_skill(self, skill_name: str) -> List[Dict[str, str]]:
        """Get learning resources for a specific skill."""
        skill_lower = skill_name.lower().strip()
        # Direct match
        if skill_lower in self.resources:
            return self.resources[skill_lower]
        # Partial match
        for key, resources in self.resources.items():
            if key in skill_lower or skill_lower in key:
                return resources
        # Default resources
        return [
            {"name": f"Learn {skill_name.title()}", "url": f"https://www.google.com/search?q=learn+{skill_name.replace(' ', '+')}", "type": "search", "platform": "Various"},
            {"name": f"{skill_name.title()} on Coursera", "url": f"https://www.coursera.org/search?query={skill_name.replace(' ', '+')}", "type": "course", "platform": "Coursera"},
        ]

    def _generate_learning_path(self, missing_skills: List[Dict]) -> List[Dict]:
        """Generate a prioritized learning path."""
        # Categorize skills into foundation vs advanced
        foundations = ["python", "javascript", "git", "sql", "linux", "communication"]
        advanced = ["docker", "kubernetes", "aws", "spark", "kafka", "pytorch", "tensorflow", "terraform"]

        path = []
        for item in missing_skills:
            skill = item["skill"].lower()
            category = "foundation" if skill in foundations else "advanced" if skill in advanced else "general"
            priority = "high" if category == "foundation" else "medium"
            path.append({
                "skill": item["skill"],
                "category": category,
                "priority": priority,
                "estimated_hours": 20 if category == "foundation" else 30 if category == "advanced" else 15,
            })

        # Sort: foundation first, then by priority
        priority_order = {"high": 0, "medium": 1, "low": 2}
        path.sort(key=lambda x: (priority_order.get(x["priority"], 99), x["category"] != "foundation"))

        return path


skill_gap_service = SkillGapAnalyzerService()
