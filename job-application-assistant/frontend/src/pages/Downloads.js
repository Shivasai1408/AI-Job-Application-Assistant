import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  downloadsAPI,
  resumeAPI,
  coverLettersAPI,
  portfolioAPI,
} from '../services/api';

function Downloads() {
  const [resumes, setResumes] = useState([]);
  const [coverLetters, setCoverLetters] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const downloadBlob = async (blobPromise, filename) => {
    setDownloading(filename);
    try {
      const response = await blobPromise;
      const blob = response instanceof Blob ? response : await response.data;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      setError(`Failed to download ${filename}`);
    } finally {
      setDownloading(null);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [resumesRes, coverLettersRes, portfolioRes] = await Promise.allSettled([
        resumeAPI.list(),
        coverLettersAPI.list(),
        portfolioAPI.get(),
      ]);

      if (resumesRes.status === 'fulfilled') {
        setResumes(resumesRes.value.data || []);
      } else {
        console.error('Error fetching resumes:', resumesRes.reason);
      }

      if (coverLettersRes.status === 'fulfilled') {
        setCoverLetters(coverLettersRes.value.data || []);
      } else {
        console.error('Error fetching cover letters:', coverLettersRes.reason);
      }

      if (portfolioRes.status === 'fulfilled') {
        setPortfolio(portfolioRes.value.data || null);
      } else {
        console.error('Error fetching portfolio:', portfolioRes.reason);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load download data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownloadResume = (resume) => {
    const ext = resume.file_type === 'pdf' ? 'pdf' : 'html';
    const filename = `${resume.title || 'resume'}.${ext}`;
    downloadBlob(downloadsAPI.downloadResume(resume.id), filename);
  };

  const handleDownloadCoverLetter = (letter) => {
    const filename = `cover-letter-${letter.id || 'letter'}.html`;
    downloadBlob(downloadsAPI.downloadCoverLetter(letter.id), filename);
  };

  const handleDownloadPortfolio = () => {
    if (!portfolio) return;
    const filename = 'portfolio.html';
    downloadBlob(downloadsAPI.downloadPortfolio(portfolio.id || ''), filename);
  };

  const handleDownloadHistory = () => {
    const filename = 'application-history.html';
    downloadBlob(downloadsAPI.downloadApplicationHistory(), filename);
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-container">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>⬇️ Downloads</h2>
          <p className="text-muted mt-1">Download your resumes, cover letters, portfolio, and application history</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <div className="alert-content">
            <div className="alert-title">Error</div>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Resumes Section */}
      <div className="card mb-6">
        <div className="card-header-gradient">
          <h3>📄 Resumes</h3>
        </div>
        <div className="card-body">
          {resumes.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <div className="empty-state-icon">📄</div>
              <h3 className="empty-state-title">No resumes yet</h3>
              <p className="empty-state-text">Create a resume first to download it.</p>
              <button className="btn btn-primary" onClick={() => navigate('/resumes')}>
                Go to Resumes
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className="card-glass fade-in"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20 }}>📄</span>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
                        {resume.title || 'Untitled Resume'}
                      </h4>
                      <p className="text-muted" style={{ fontSize: 13, margin: '2px 0 0' }}>
                        {resume.file_type?.toUpperCase() || 'HTML'} resume
                        {resume.is_base ? ' • Base Resume' : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleDownloadResume(resume)}
                    disabled={downloading === `${resume.title || 'resume'}.${resume.file_type === 'pdf' ? 'pdf' : 'html'}`}
                  >
                    {downloading === `${resume.title || 'resume'}.${resume.file_type === 'pdf' ? 'pdf' : 'html'}` ? (
                      <span className="spinner-sm" style={{ display: 'inline-block', marginRight: 6 }} />
                    ) : null}
                    ⬇️ Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cover Letters Section */}
      <div className="card mb-6">
        <div className="card-header-gradient">
          <h3>✉️ Cover Letters</h3>
        </div>
        <div className="card-body">
          {coverLetters.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <div className="empty-state-icon">✉️</div>
              <h3 className="empty-state-title">No cover letters yet</h3>
              <p className="empty-state-text">Generate a cover letter first to download it.</p>
              <button className="btn btn-primary" onClick={() => navigate('/cover-letters')}>
                Go to Cover Letters
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {coverLetters.map((letter) => (
                <div
                  key={letter.id}
                  className="card-glass fade-in"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20 }}>✉️</span>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
                        {letter.job_title
                          ? `Cover Letter for ${letter.job_title}`
                          : `Cover Letter #${letter.id}`}
                      </h4>
                      <p className="text-muted" style={{ fontSize: 13, margin: '2px 0 0' }}>
                        {letter.company ? `at ${letter.company}` : ''}
                        {letter.tone ? ` • ${letter.tone} tone` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleDownloadCoverLetter(letter)}
                    disabled={downloading === `cover-letter-${letter.id || 'letter'}.html`}
                  >
                    {downloading === `cover-letter-${letter.id || 'letter'}.html` ? (
                      <span className="spinner-sm" style={{ display: 'inline-block', marginRight: 6 }} />
                    ) : null}
                    ⬇️ Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Portfolio Section */}
      <div className="card mb-6">
        <div className="card-header-gradient">
          <h3>🎨 Portfolio</h3>
        </div>
        <div className="card-body">
          {!portfolio ? (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <div className="empty-state-icon">🎨</div>
              <h3 className="empty-state-title">No portfolio yet</h3>
              <p className="empty-state-text">Build your portfolio first to download it.</p>
              <button className="btn btn-primary" onClick={() => navigate('/portfolio')}>
                Go to Portfolio
              </button>
            </div>
          ) : (
            <div className="card-glass fade-in" style={{ padding: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 24 }}>🎨</span>
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                      {portfolio.title || 'My Portfolio'}
                    </h4>
                    <p className="text-muted" style={{ fontSize: 13, margin: '2px 0 0' }}>
                      {portfolio.skills?.length || 0} skills
                      {portfolio.projects?.length ? ` • ${portfolio.projects.length} projects` : ''}
                      {portfolio.is_published ? ' • 🌐 Published' : ''}
                    </p>
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleDownloadPortfolio}
                  disabled={downloading === 'portfolio.html'}
                >
                  {downloading === 'portfolio.html' ? (
                    <span className="spinner-sm" style={{ display: 'inline-block', marginRight: 6 }} />
                  ) : null}
                  ⬇️ Download Portfolio
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Application History Section */}
      <div className="card mb-6">
        <div className="card-header-gradient">
          <h3>📊 Application History</h3>
        </div>
        <div className="card-body">
          <div
            className="card-glass fade-in"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>📊</span>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Application History</h4>
                <p className="text-muted" style={{ fontSize: 13, margin: '2px 0 0' }}>
                  Download a complete record of all your job applications
                </p>
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleDownloadHistory}
              disabled={downloading === 'application-history.html'}
            >
              {downloading === 'application-history.html' ? (
                <span className="spinner-sm" style={{ display: 'inline-block', marginRight: 6 }} />
              ) : null}
              ⬇️ Download History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Downloads;
