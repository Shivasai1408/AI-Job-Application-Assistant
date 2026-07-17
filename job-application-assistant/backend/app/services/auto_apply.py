"""Auto-Apply service for simulating job applications on portals."""
from typing import Dict, Any, List, Optional
from datetime import datetime


class AutoApplyService:
    """Service for simulating auto-apply functionality for job portals."""

    SUPPORTED_PORTALS = [
        {"id": "linkedin", "name": "LinkedIn", "icon": "💼", "color": "#0A66C2"},
        {"id": "indeed", "name": "Indeed", "icon": "🔍", "color": "#2164F3"},
        {"id": "glassdoor", "name": "Glassdoor", "icon": "🏢", "color": "#0CAA41"},
        {"id": "monster", "name": "Monster", "icon": "👹", "color": "#6D2E46"},
        {"id": "ziprecruiter", "name": "ZipRecruiter", "icon": "⚡", "color": "#1CD1A1"},
    ]

    # Pre-filled application templates for different portals
    PORTAL_FIELDS = {
        "linkedin": [
            {"name": "Full Name", "type": "text", "auto_fill": True},
            {"name": "Email", "type": "email", "auto_fill": True},
            {"name": "Phone", "type": "tel", "auto_fill": True},
            {"name": "Resume/CV", "type": "file", "auto_fill": True},
            {"name": "Cover Letter", "type": "textarea", "auto_fill": True},
            {"name": "LinkedIn Profile URL", "type": "url", "auto_fill": True},
            {"name": "Portfolio URL", "type": "url", "auto_fill": False},
            {"name": "How did you hear about this job?", "type": "select", "auto_fill": False, "options": ["LinkedIn", "Company Website", "Referral", "Other"]},
        ],
        "indeed": [
            {"name": "Full Name", "type": "text", "auto_fill": True},
            {"name": "Email", "type": "email", "auto_fill": True},
            {"name": "Phone", "type": "tel", "auto_fill": True},
            {"name": "Resume", "type": "file", "auto_fill": True},
            {"name": "Cover Letter", "type": "textarea", "auto_fill": False},
            {"name": "Current Company", "type": "text", "auto_fill": True},
            {"name": "Highest Education", "type": "select", "auto_fill": False, "options": ["High School", "Associate", "Bachelor's", "Master's", "PhD"]},
            {"name": "Work Authorization", "type": "select", "auto_fill": False, "options": ["US Citizen", "Green Card", "H1-B", "TN Visa", "Other"]},
        ],
        "glassdoor": [
            {"name": "Full Name", "type": "text", "auto_fill": True},
            {"name": "Email", "type": "email", "auto_fill": True},
            {"name": "Phone", "type": "tel", "auto_fill": True},
            {"name": "Resume", "type": "file", "auto_fill": True},
            {"name": "Cover Letter", "type": "textarea", "auto_fill": True},
            {"name": "Current Salary", "type": "text", "auto_fill": False},
            {"name": "Desired Salary", "type": "text", "auto_fill": False},
            {"name": "Start Date", "type": "date", "auto_fill": False},
        ],
    }

    async def get_supported_portals(self) -> List[Dict[str, Any]]:
        """Get list of supported job portals for auto-apply."""
        return self.SUPPORTED_PORTALS

    async def get_portal_fields(self, portal_id: str) -> List[Dict[str, Any]]:
        """Get the application fields required for a specific portal."""
        return self.PORTAL_FIELDS.get(portal_id, [])

    async def prepare_application(
        self,
        portal_id: str,
        user_profile: Dict[str, Any],
        resume_content: str,
        cover_letter: str = "",
    ) -> Dict[str, Any]:
        """Prepare application data by auto-filling fields from user profile."""
        fields = self.PORTAL_FIELDS.get(portal_id, [])
        filled_data = []

        for field in fields:
            value = ""
            if field["auto_fill"]:
                # Map common fields to user profile data
                field_name_lower = field["name"].lower()
                if "name" in field_name_lower:
                    value = user_profile.get("full_name", "")
                elif "email" in field_name_lower:
                    value = user_profile.get("email", "")
                elif "phone" in field_name_lower:
                    value = user_profile.get("phone", "")
                elif "resume" in field_name_lower:
                    value = resume_content[:200] + "..."  # Preview
                elif "cover" in field_name_lower:
                    value = cover_letter[:200] + "..." if cover_letter else ""
                elif "company" in field_name_lower and "current" in field_name_lower:
                    value = user_profile.get("headline", "").split("|")[0].strip() if user_profile.get("headline") else ""
                elif "linkedin" in field_name_lower or "portfolio" in field_name_lower:
                    value = ""
                elif "salary" in field_name_lower:
                    value = "Negotiable"

            filled_data.append({
                "field": field["name"],
                "type": field["type"],
                "value": value,
                "auto_filled": field["auto_fill"] and bool(value),
                "required": True,
            })

        return {
            "portal_id": portal_id,
            "portal_name": next((p["name"] for p in self.SUPPORTED_PORTALS if p["id"] == portal_id), portal_id),
            "fields": filled_data,
            "auto_fill_percentage": round(
                sum(1 for f in filled_data if f["auto_filled"]) / len(filled_data) * 100
            ) if filled_data else 0,
            "prepared_at": datetime.utcnow().isoformat(),
        }

    async def simulate_submit(
        self,
        portal_id: str,
        job_title: str,
        company: str,
        application_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Simulate submitting an application to a portal."""
        portal = next((p for p in self.SUPPORTED_PORTALS if p["id"] == portal_id), None)

        return {
            "success": True,
            "message": f"Application for {job_title} at {company} prepared for {portal['name'] if portal else portal_id}",
            "portal": portal_id,
            "job_title": job_title,
            "company": company,
            "submitted_at": datetime.utcnow().isoformat(),
            "tracking_id": f"APP-{portal_id.upper()}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            "next_steps": [
                "Review application details before final submission",
                "Prepare for potential screening call",
                "Research company culture and values",
                "Set up interview preparation reminders",
            ],
        }


auto_apply_service = AutoApplyService()
