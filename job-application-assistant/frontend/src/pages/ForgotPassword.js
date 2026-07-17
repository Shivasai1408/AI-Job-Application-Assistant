import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { forgotPasswordAPI } from '../services/api';

function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getErrorMessage = (err) => {
    const detail = err.response?.data?.detail;
    if (Array.isArray(detail)) {
      return detail.map((d) => d.msg).join('. ');
    }
    if (typeof detail === 'string') {
      return detail;
    }
    if (err.response?.data?.message) {
      return err.response.data.message;
    }
    return 'Something went wrong. Please try again.';
  };

  // Step 1: Request OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await forgotPasswordAPI.requestOTP(email);
      setSuccess(res.data.message || 'OTP sent to email');
      setStep(2);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await forgotPasswordAPI.verifyOTP(email, otp);
      if (res.data.verified && res.data.reset_token) {
        setResetToken(res.data.reset_token);
        setSuccess(res.data.message || 'OTP verified successfully');
        setStep(3);
      } else {
        setError('Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await forgotPasswordAPI.resetPassword(resetToken, newPassword);
      setSuccess(res.data.message || 'Password reset successfully!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setError('');
    setSuccess('');
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setOtp('');
      setStep(2);
    }
  };

  const resetForm = () => {
    setStep(1);
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setResetToken('');
    setError('');
    setSuccess('');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">AI</div>
          </div>
          <h1 className="auth-title">
            {step === 1 && 'Forgot Password'}
            {step === 2 && 'Verify OTP'}
            {step === 3 && 'Reset Password'}
          </h1>
          <p className="auth-subtitle">
            {step === 1 && 'Enter your email to receive a verification code'}
            {step === 2 && `Enter the 6-digit code sent to ${email}`}
            {step === 3 && 'Create a new password for your account'}
          </p>

          {/* Step Indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: s === step
                    ? 'var(--primary)'
                    : s < step
                      ? 'var(--success)'
                      : 'var(--border-color)',
                  transition: 'background 0.3s ease',
                }}
              />
            ))}
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
              <span className="alert-icon">&#9888;</span>
              <div className="alert-content">{error}</div>
            </div>
          )}

          {success && (
            <div className="alert alert-success" style={{ marginBottom: '16px' }}>
              <span className="alert-icon">&#10003;</span>
              <div className="alert-content">{success}</div>
            </div>
          )}

          {/* Step 1: Email Form */}
          {step === 1 && (
            <form onSubmit={handleRequestOTP}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={loading}
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP}>
              <div className="form-group">
                <label className="form-label">OTP Code</label>
                <input
                  type="text"
                  className="form-input"
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(val);
                  }}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '8px' }}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={loading || otp.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
          )}

          {/* Step 3: Reset Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {/* Navigation buttons */}
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {step > 1 && step < 4 ? (
              <button
                type="button"
                className="btn btn-glass btn-sm"
                onClick={handleBack}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                &#8592; Back
              </button>
            ) : (
              <div />
            )}

            {/* After successful reset, show link to login */}
            {success && step === 3 && (
              <Link to="/login" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                Go to Login
              </Link>
            )}
            {success && step === 3 && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Redirecting to login...
              </span>
            )}
          </div>

          {/* Footer links */}
          <div className="auth-footer">
            {step === 1 && (
              <>
                Remember your password? <Link to="/login">Sign in</Link>
              </>
            )}
            {step === 2 && (
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError('');
                  setSuccess('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-light)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 'inherit',
                  fontFamily: 'inherit',
                }}
              >
                Change email address
              </button>
            )}
            {step === 3 && !success && (
              <span style={{ color: 'var(--text-muted)' }}>
                Remember your password? <Link to="/login">Sign in</Link>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
