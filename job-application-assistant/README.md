# AI-Powered Intelligent Job Application Assistant

An intelligent system that helps job seekers streamline their application process using AI. The system tailors resumes, generates cover letters, analyzes ATS compatibility, searches for jobs, and tracks applications — all in one place.

## ✨ Features

### 📄 **Resume Management**
- Create and manage multiple resumes
- Upload existing resumes (TXT, PDF, DOCX)
- **AI-Powered Tailoring**: Automatically customize your resume for any job description
- Side-by-side comparison of original vs. tailored versions

### 🎨 **Resume Builder with Templates**
- Choose from 6 professionally designed templates (Modern, Professional, Creative, Minimal, Executive, Technical)
- Pre-filled section templates for each style
- Real-time preview with styled rendering
- Customize every section with inline editing
- Save completed resumes directly to your collection

### ✉️ **Cover Letter Generation**
- Generate personalized cover letters using AI
- Multiple tone options (Professional, Enthusiastic, Formal)
- Save and manage your cover letters
- Copy to clipboard with one click

### 🎯 **ATS Score Analysis**
- Analyze how well your resume matches a job description
- Get a comprehensive ATS compatibility score (0-100)
- Keyword match analysis with missing keywords identified
- Formatting and section completeness evaluation
- Actionable improvement suggestions

### 🔍 **Job Search**
- Browse curated job listings from top companies
- Filter by location, job type, and experience level
- View detailed job descriptions and requirements
- Get personalized job recommendations based on your skills
- Save jobs for later review

### 📋 **Application Tracking**
- Track applications from draft to offer
- Update application status as you progress
- Visual pipeline with status breakdown
- Interview date tracking

### 📅 **Interview Scheduler**
- Schedule interviews linked to your applications
- Support for video, phone, and in-person interview types
- Calendar grouping by date for easy viewing
- Status tracking (scheduled, completed, cancelled, rescheduled)
- Post-interview feedback with star ratings (1-5)
- Track questions asked and next steps

### 🔔 **Job Alerts & Notifications**
- Create custom job alerts with keywords, location, job type, and salary filters
- Choose alert frequency (real-time, daily digest, weekly)
- Toggle alerts active/paused
- View notification history with read/unread tracking
- Mark individual or all notifications as read
- Unread count badges

### 🧠 **Skill Gap Analyzer**
- Compare your skills against job requirements
- Visual score breakdown (match, partial match, missing)
- Gap severity assessment
- Estimated study hours calculation
- Personalized learning path with categorized recommendations
- Curated learning resources from Coursera, Udemy, and free platforms
- Quick-fill with preset skill sets (Senior Engineer, Frontend Dev, Data Scientist)

### ⚡ **Auto-Apply Assistant**
- Multi-step wizard: Select Portal → Prepare → Review → Done
- Support for 5 portals (LinkedIn, Indeed, Glassdoor, Monster, ZipRecruiter)
- Auto-fill progress indicator with percentage
- Field-by-field review with auto-filled indicators
- Generate tracking ID for each application
- Next steps checklist after submission

### 👤 **User Profile**
- Manage your professional information
- Add skills, experience, and professional summary
- Skills-based job recommendations

## 🏗️ Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: SQLite with SQLAlchemy ORM
- **AI Integration**: Ollama (local LLM) with simulated fallback
- **Authentication**: JWT-based with bcrypt password hashing
- **API Documentation**: Automatic Swagger/OpenAPI at `/docs`

### Frontend
- **Framework**: React 18
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: Custom CSS with responsive design
- **Authentication**: JWT token management

## 🚀 Getting Started

### Prerequisites

- **Python 3.9+** for the backend
- **Node.js 16+** for the frontend
- **Ollama** (optional, for local AI) — Download from [ollama.ai](https://ollama.ai)

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd job-application-assistant/backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables** (optional):
   Edit `.env` file to customize settings:
   ```
   DATABASE_URL=sqlite:///./job_assistant.db
   SECRET_KEY=your-secret-key-change-in-production
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=llama3.2
   ```

5. **Run the backend server:**
   ```bash
   python run.py
   ```
   The API will be available at `http://localhost:8000`
   Access the interactive API docs at `http://localhost:8000/docs`

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd job-application-assistant/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```
   The app will be available at `http://localhost:3000`

### Setting Up Ollama (Optional)

For local AI processing (privacy-focused):

1. **Install Ollama** from [ollama.ai](https://ollama.ai)
2. **Pull a model:**
   ```bash
   ollama pull llama3.2
   ```
3. **Ensure Ollama is running** before starting the backend.

The system works without Ollama by using simulated AI responses for development and testing.

## 📁 Project Structure

```
job-application-assistant/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application entry point
│   │   ├── config.py            # Configuration settings
│   │   ├── database.py          # Database setup (SQLite + SQLAlchemy)
│   │   ├── models/
│   │   │   ├── user.py          # User model
│   │   │   ├── resume.py        # Resume & TailoredResume models
│   │   │   ├── job.py           # Job model
│   │   │   ├── application.py   # Application & CoverLetter models
│   │   │   ├── interview.py     # Interview & InterviewFeedback models
│   │   │   └── alert.py         # JobAlert & Notification models
│   │   ├── routes/
│   │   │   ├── auth.py          # Authentication endpoints
│   │   │   ├── resume_routes.py # Resume management & tailoring
│   │   │   ├── jobs.py          # Job search & management
│   │   │   ├── applications.py  # Application tracking
│   │   │   ├── cover_letter.py  # Cover letter generation
│   │   │   ├── interviews.py    # Interview scheduling & feedback
│   │   │   ├── alerts.py        # Job alerts & notifications
│   │   │   ├── skill_gap.py     # Skill gap analysis
│   │   │   └── auto_apply.py    # Auto-apply assistant
│   │   └── services/
│   │       ├── ai_service.py    # AI/Ollama integration
│   │       ├── resume_tailor.py # Resume tailoring service
│   │       ├── ats_scorer.py    # ATS scoring service
│   │       ├── job_search.py    # Job search service
│   │       ├── skill_gap.py     # Skill gap analysis service
│   │       └── auto_apply.py    # Auto-apply service
│   ├── requirements.txt
│   ├── .env
│   └── run.py
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.js        # Main layout with sidebar
│   │   ├── pages/
│   │   │   ├── Login.js              # Login page
│   │   │   ├── Register.js           # Registration page
│   │   │   ├── Dashboard.js          # Main dashboard
│   │   │   ├── Resumes.js            # Resume list
│   │   │   ├── ResumeBuilder.js      # Create/edit/tailor resumes
│   │   │   ├── ResumeTemplates.js    # Resume builder with 6 templates
│   │   │   ├── JobSearch.js          # Job search & filters
│   │   │   ├── JobDetails.js         # Job detail & apply
│   │   │   ├── Applications.js       # Application tracker
│   │   │   ├── CoverLetters.js       # Cover letter manager
│   │   │   ├── ATSScore.js           # ATS analysis tool
│   │   │   ├── InterviewScheduler.js # Interview scheduling & feedback
│   │   │   ├── JobAlerts.js          # Job alerts & notifications
│   │   │   ├── SkillGapAnalyzer.js   # Skill gap analysis with resources
│   │   │   ├── AutoApply.js          # Auto-apply wizard
│   │   │   └── Profile.js            # User profile
│   │   ├── services/
│   │   │   ├── api.js           # Axios API client
│   │   │   └── auth.js          # Auth helper functions
│   │   ├── styles/
│   │   │   └── index.css        # Global styles
│   │   ├── App.js               # App with routing
│   │   └── index.js             # Entry point
│   ├── package.json
│   └── .env
└── README.md
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/me` | Update user profile |

### Resumes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resumes/upload` | Upload a resume file |
| POST | `/api/resumes/create` | Create resume from text |
| GET | `/api/resumes/` | List all user resumes |
| GET | `/api/resumes/{id}` | Get resume details |
| DELETE | `/api/resumes/{id}` | Delete a resume |
| POST | `/api/resumes/{id}/tailor` | Tailor resume for a job |
| POST | `/api/resumes/{id}/ats-score` | Get ATS score |
| POST | `/api/resumes/tailor-text` | Tailor resume text directly |
| POST | `/api/resumes/ats-analyze` | Analyze ATS directly |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs/search` | Search jobs with filters |
| GET | `/api/jobs/recommended` | Get recommended jobs |
| GET | `/api/jobs/{id}` | Get job details |
| POST | `/api/jobs/{id}/extract-skills` | Extract skills from job |
| POST | `/api/jobs/save/{id}` | Save a job |
| GET | `/api/jobs/saved/list` | List saved jobs |
| DELETE | `/api/jobs/saved/{id}` | Unsave a job |

### Applications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/applications/` | Create application |
| GET | `/api/applications/` | List applications |
| GET | `/api/applications/stats` | Get application stats |
| GET | `/api/applications/{id}` | Get application details |
| PUT | `/api/applications/{id}` | Update application |
| DELETE | `/api/applications/{id}` | Delete application |
| POST | `/api/applications/cover-letter` | Generate cover letter |
| GET | `/api/applications/cover-letters/list` | List cover letters |

### Cover Letters
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cover-letters/generate` | Generate cover letter |
| POST | `/api/cover-letters/save` | Save cover letter |
| GET | `/api/cover-letters/` | List cover letters |
| DELETE | `/api/cover-letters/{id}` | Delete cover letter |

### Interviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/interviews/` | Schedule an interview |
| GET | `/api/interviews/` | List interviews (filter by status/upcoming) |
| GET | `/api/interviews/upcoming` | Get upcoming interviews (30 days) |
| GET | `/api/interviews/{id}` | Get interview details |
| PUT | `/api/interviews/{id}` | Update interview |
| POST | `/api/interviews/{id}/complete` | Complete interview with feedback |
| DELETE | `/api/interviews/{id}` | Cancel/delete interview |

### Job Alerts & Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/alerts/` | Create job alert |
| GET | `/api/alerts/` | List job alerts |
| PUT | `/api/alerts/{id}` | Update job alert |
| DELETE | `/api/alerts/{id}` | Delete job alert |
| POST | `/api/alerts/{id}/trigger` | Manually trigger alert |
| GET | `/api/alerts/notifications` | List notifications |
| POST | `/api/alerts/notifications/{id}/read` | Mark notification as read |
| POST | `/api/alerts/notifications/read-all` | Mark all as read |
| GET | `/api/alerts/notifications/unread-count` | Get unread count |

### Skill Gap Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/skills/analyze-gap` | Analyze skill gap |
| GET | `/api/skills/learning-resources/{skill}` | Get learning resources |

### Auto-Apply
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auto-apply/portals` | List supported portals |
| GET | `/api/auto-apply/portals/{portal_id}/fields` | Get portal form fields |
| POST | `/api/auto-apply/prepare` | Prepare application with auto-fill |
| POST | `/api/auto-apply/submit` | Submit application |

## 💡 Usage Guide

### 1. Create an Account
Register with your name, email, and password to get started.

### 2. Build Your Profile
Add your skills, experience, and professional summary to enable personalized job recommendations.

### 3. Create a Resume
Paste your existing resume or upload a file. Create different versions for different roles.
Use the **Resume Builder** (`/resumes/templates`) to choose from 6 professionally designed templates
and build a polished resume with guided section templates.

### 4. Tailor for Jobs
When you find a job you're interested in, paste the job description and let AI tailor your resume automatically.

### 5. Generate Cover Letters
Create personalized cover letters with your desired tone for any position.

### 6. Check ATS Score
Before applying, analyze how well your resume matches the job description and get improvement suggestions.

### 7. Analyze Skill Gaps
Use **Skill Gap Analyzer** (`/skill-gap`) to compare your skills against job requirements.
Get a personalized learning path with curated courses, books, and tutorials to bridge your gaps.

### 8. Set Up Job Alerts
Create **Job Alerts** (`/alerts`) with keywords, location, salary, and frequency preferences.
Get notified when matching jobs become available.

### 9. Auto-Apply
Use **Auto-Apply Assistant** (`/auto-apply`) to quickly prepare applications for LinkedIn, Indeed,
Glassdoor, Monster, and ZipRecruiter with auto-filled information from your profile.

### 10. Track Applications
Keep track of all your applications, update statuses, and manage your job search pipeline.

### 11. Schedule Interviews
Use **Interview Scheduler** (`/interviews`) to schedule interviews, track status,
and log post-interview feedback with ratings, questions, and next steps.

## 🔒 Privacy & Security

- **Local AI Processing**: When using Ollama, all AI processing happens locally on your machine.
- **JWT Authentication**: Secure token-based authentication.
- **Password Hashing**: Passwords are hashed using bcrypt.
- **Your Data**: Stored locally in SQLite database.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.
