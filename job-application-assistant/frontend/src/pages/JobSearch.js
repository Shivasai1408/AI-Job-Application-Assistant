import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsAPI } from '../services/api';

function JobSearch() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    job_type: '',
    experience_level: '',
  });
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1 });
  const navigate = useNavigate();

  const fetchJobs = async (page = 1) => {
    setLoading(true);
    try {
      const res = await jobsAPI.search({
        query: searchQuery,
        ...filters,
        page,
        page_size: 12,
      });
      setJobs(res.data.results || []);
      setPagination({
        page: res.data.page,
        total_pages: res.data.total_pages,
        total: res.data.total,
      });
    } catch (err) {
      console.error('Error searching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs(1);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>🔍 Job Search</h2>
        <p className="text-muted mt-1">Find your next opportunity and apply with tailored resumes</p>
      </div>

      {/* Search & Filters */}
      <div className="card mb-6">
        <form onSubmit={handleSearch}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search by title, company, skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              🔍 Search
            </button>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1, minWidth: 150 }}
              placeholder="Location"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            />
            <select
              className="form-select"
              style={{ flex: 1, minWidth: 150 }}
              value={filters.job_type}
              onChange={(e) => setFilters({ ...filters, job_type: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
            </select>
            <select
              className="form-select"
              style={{ flex: 1, minWidth: 150 }}
              value={filters.experience_level}
              onChange={(e) => setFilters({ ...filters, experience_level: e.target.value })}
            >
              <option value="">All Levels</option>
              <option value="Entry">Entry</option>
              <option value="Mid">Mid-Level</option>
              <option value="Mid-Senior">Mid-Senior</option>
              <option value="Senior">Senior</option>
            </select>
          </div>
        </form>
      </div>

      {/* Results */}
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3 className="empty-state-title">No jobs found</h3>
            <p className="empty-state-text">
              Try adjusting your search filters or query.
            </p>
          </div>
        </div>
      ) : (
        <>
          <p className="text-muted text-sm mb-4">
            Found {pagination.total} jobs • Page {pagination.page} of {pagination.total_pages}
          </p>
          <div className="grid-2">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="job-card"
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                <div className="job-card-title">{job.title}</div>
                <div className="job-card-company">{job.company}</div>
                <div className="job-card-details">
                  <span className="job-card-detail">📍 {job.location || 'Remote'}</span>
                  <span className="job-card-detail">💰 {job.salary_range || 'Not specified'}</span>
                  <span className="job-card-detail">⏰ {job.job_type}</span>
                  <span className="job-card-detail">📊 {job.experience_level}</span>
                </div>
                <p className="text-sm text-muted mt-2" style={{ lineHeight: 1.5 }}>
                  {job.description?.substring(0, 200)}...
                </p>
                <div className="job-card-footer">
                  <div className="job-card-tags">
                    {job.skills_required?.split(',').slice(0, 3).map((skill, i) => (
                      <span key={i} className="tag tag-primary">{skill.trim()}</span>
                    ))}
                    {(job.skills_required?.split(',').length || 0) > 3 && (
                      <span className="tag">+{job.skills_required.split(',').length - 3} more</span>
                    )}
                  </div>
                  <span className="text-sm text-muted">{job.source}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
              {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`btn btn-sm ${page === pagination.page ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => fetchJobs(page)}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default JobSearch;
