import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';

function Analytics() {
  const [overview, setOverview] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [skillsGrowth, setSkillsGrowth] = useState(null);
  const [atsTrend, setAtsTrend] = useState(null);
  const [successRate, setSuccessRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [overviewRes, monthlyRes, skillsRes, atsRes, successRes] = await Promise.all([
          analyticsAPI.getOverview(),
          analyticsAPI.getMonthly(12),
          analyticsAPI.getSkillsGrowth(),
          analyticsAPI.getATSTrend(),
          analyticsAPI.getSuccessRate(),
        ]);
        setOverview(overviewRes.data);
        setMonthly(monthlyRes.data);
        setSkillsGrowth(skillsRes.data);
        setAtsTrend(atsRes.data);
        setSuccessRate(successRes.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  const statCards = [
    { icon: '📄', label: 'Total Applications', value: overview?.total_applications || 0, color: 'primary' },
    { icon: '🔄', label: 'Active Applications', value: overview?.active_applications || 0, color: 'accent' },
    { icon: '📅', label: 'Interviews Scheduled', value: overview?.interviews_scheduled || 0, color: 'success' },
    { icon: '🎯', label: 'Offers Received', value: overview?.offers_received || 0, color: 'success' },
    { icon: '❌', label: 'Rejections', value: overview?.rejections || 0, color: 'danger' },
    { icon: '📊', label: 'Success Rate', value: overview?.success_rate ? `${overview.success_rate}%` : '0%', color: 'warning' },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="flex-between mb-6">
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>📊 Analytics Dashboard</h2>
          <p className="text-muted mt-1">Track your job application performance and trends</p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Overview Section */}
      <div className="mb-8">
        <h3 className="font-semibold mb-4" style={{ fontSize: 18 }}>📈 Overview</h3>
        <div className="grid-3">
          {statCards.map((stat, idx) => (
            <div key={idx} className={`stat-card stat-${stat.color}`}>
              <div className={`stat-card-icon ${stat.color}`}>{stat.icon}</div>
              <div className="stat-card-content">
                <div className="stat-card-value">{stat.value}</div>
                <div className="stat-card-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trends Section */}
      <div className="card mb-8">
        <div className="card-header">
          <h3 className="card-title">📆 Monthly Trends</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {monthly && (
              <span className="badge badge-info">
                Growth: {monthly.growth_rate || 0}%
              </span>
            )}
          </div>
        </div>
        {monthly?.data?.length > 0 ? (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Applications</th>
                    <th>Interviews</th>
                    <th>Offers</th>
                    <th>Rejections</th>
                  </tr>
                </thead>
                <tbody>
                  {monthly.data.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>
                        {new Date(row.year, row.month - 1).toLocaleString('default', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </td>
                      <td>{row.applications}</td>
                      <td>{row.interviews}</td>
                      <td>{row.offers}</td>
                      <td>{row.rejections}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card-footer">
              <span className="text-sm text-muted">
                Total (Last Year): {monthly.total_applications_last_year || 0}
              </span>
              <span className="text-sm text-muted">
                Avg/Month: {monthly.average_per_month || 0}
              </span>
              <span className="text-sm text-muted">
                Best Month: {monthly.best_month || 'N/A'}
              </span>
            </div>
          </>
        ) : (
          <div className="empty-state" style={{ padding: 30 }}>
            <div className="empty-state-icon">📆</div>
            <h3 className="empty-state-title">No monthly data yet</h3>
            <p className="empty-state-text">Start tracking applications to see monthly trends.</p>
          </div>
        )}
      </div>

      {/* Skills Growth & ATS Score Trend - side by side */}
      <div className="grid-2 mb-8">
        {/* Skills Growth */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🧠 Skills Growth</h3>
            {skillsGrowth && (
              <span className="badge badge-success">
                +{skillsGrowth.skills_added_total || 0} total
              </span>
            )}
          </div>
          {skillsGrowth?.data?.length > 0 ? (
            <>
              <div className="table-container" style={{ border: 'none' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Skills Added</th>
                      <th>Total Skills</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skillsGrowth.data.map((row, idx) => (
                      <tr key={idx}>
                        <td>{new Date(row.date).toLocaleDateString()}</td>
                        <td>
                          <span className="badge badge-success">+{row.skills_added}</span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{row.total_skills}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {skillsGrowth?.most_recent_skills?.length > 0 && (
                <div className="card-footer">
                  <span className="text-sm text-muted">
                    Recent: {skillsGrowth.most_recent_skills.join(', ')}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state" style={{ padding: 30 }}>
              <div className="empty-state-icon">🧠</div>
              <h3 className="empty-state-title">No skills data yet</h3>
              <p className="empty-state-text">Add skills to your profile to track growth.</p>
            </div>
          )}
        </div>

        {/* ATS Score Trend */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📊 ATS Score Trend</h3>
            {atsTrend && (
              <span className="badge badge-primary">Avg: {atsTrend.average_score || 0}</span>
            )}
          </div>
          {atsTrend?.data?.length > 0 ? (
            <>
              <div className="table-container" style={{ border: 'none' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Score</th>
                      <th>Resume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {atsTrend.data.map((row, idx) => (
                      <tr key={idx}>
                        <td>{new Date(row.date).toLocaleDateString()}</td>
                        <td>
                          <span
                            className={`badge ${
                              row.score >= 80
                                ? 'badge-success'
                                : row.score >= 60
                                ? 'badge-warning'
                                : 'badge-danger'
                            }`}
                          >
                            {row.score}
                          </span>
                        </td>
                        <td className="truncate" style={{ maxWidth: 150 }}>
                          {row.resume_title}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {atsTrend && (
                <div className="card-footer">
                  <span className="text-sm text-muted">
                    Highest: {atsTrend.highest_score || 0}
                  </span>
                  <span
                    className={`text-sm ${
                      atsTrend.trend_direction === 'up'
                        ? 'text-success'
                        : atsTrend.trend_direction === 'down'
                        ? 'text-danger'
                        : 'text-muted'
                    }`}
                  >
                    Trend: {atsTrend.trend_direction || 'stable'}{' '}
                    {atsTrend.trend_direction === 'up'
                      ? '📈'
                      : atsTrend.trend_direction === 'down'
                      ? '📉'
                      : '➡️'}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state" style={{ padding: 30 }}>
              <div className="empty-state-icon">📊</div>
              <h3 className="empty-state-title">No ATS scores yet</h3>
              <p className="empty-state-text">Analyze your resumes to see ATS score trends.</p>
            </div>
          )}
        </div>
      </div>

      {/* Success Rate by Source */}
      <div className="card mb-8">
        <div className="card-header">
          <h3 className="card-title">🎯 Success Rate by Source</h3>
          {successRate && (
            <span className="badge badge-gradient-success">
              Overall: {successRate.overall_success_rate || 0}%
            </span>
          )}
        </div>
        {successRate?.data?.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Applications</th>
                  <th>Interviews</th>
                  <th>Offers</th>
                  <th>Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {successRate.data.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{row.source}</td>
                    <td>{row.applications}</td>
                    <td>{row.interviews}</td>
                    <td>{row.offers}</td>
                    <td>
                      <span
                        className={`badge ${
                          row.success_rate >= 50
                            ? 'badge-success'
                            : row.success_rate >= 25
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}
                      >
                        {row.success_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: 30 }}>
            <div className="empty-state-icon">🎯</div>
            <h3 className="empty-state-title">No source data yet</h3>
            <p className="empty-state-text">Track where your applications come from to see success by source.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Analytics;
