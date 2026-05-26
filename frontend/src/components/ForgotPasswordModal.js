import React, { useEffect, useState } from 'react';
import API_BASE_URL from '../api';
import './ForgotPasswordModal.css';

const initialMessage = { text: '', type: '' };

function ForgotPasswordModal({ isOpen, onClose, defaultEmail = '' }) {
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState(defaultEmail);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(initialMessage);

  useEffect(() => {
    if (isOpen) {
      setEmail(defaultEmail);
      return;
    }

    setStep('request');
    setEmail(defaultEmail);
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswords(false);
    setLoading(false);
    setMessage(initialMessage);
  }, [isOpen, defaultEmail]);

  if (!isOpen) {
    return null;
  }

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setMessage(initialMessage);

    if (!email) {
      setMessage({ text: 'Enter your email address', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        setStep('reset');
        setMessage({ text: data.message || 'Reset code sent', type: 'success' });
      } else {
        setMessage({ text: data.message || 'Unable to send reset code', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Connection error. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage(initialMessage);

    if (!email || !code || !newPassword || !confirmPassword) {
      setMessage({ text: 'Please fill in all fields', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ text: 'Passwords do not match', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ text: 'Password must be at least 6 characters', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ text: data.message || 'Password reset successful', type: 'success' });
        setTimeout(() => onClose(), 1200);
      } else {
        setMessage({ text: data.message || 'Unable to reset password', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Connection error. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-modal" role="dialog" aria-modal="true" aria-labelledby="forgot-password-title">
      <div className="forgot-password-backdrop" onClick={onClose} />
      <div className="forgot-password-panel">
        <button type="button" className="forgot-password-close" onClick={onClose} aria-label="Close forgot password">
          ×
        </button>

        <div className="forgot-password-header">
          <p className="forgot-password-eyebrow">Account recovery</p>
          <h3 id="forgot-password-title">Forgot password</h3>
          <p>
            {step === 'request'
              ? 'Enter your email address to receive a reset code.'
              : 'Enter the reset code and choose a new password.'}
          </p>
        </div>

        {message.text && (
          <div className={`forgot-password-message ${message.type}`}>
            {message.text}
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={handleRequestCode} className="forgot-password-form">
            <div className="form-field">
              <label htmlFor="forgot-password-email">Email</label>
              <div className="input-wrapper">
                <span className="input-icon">@</span>
                <input
                  id="forgot-password-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Sending code...' : 'Send reset code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="forgot-password-form">
            <div className="form-field">
              <label htmlFor="forgot-reset-email">Email</label>
              <div className="input-wrapper">
                <span className="input-icon">@</span>
                <input
                  id="forgot-reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="forgot-reset-code">Reset code</label>
              <div className="input-wrapper">
                <span className="input-icon">#</span>
                <input
                  id="forgot-reset-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter the 6-digit code"
                  autoComplete="one-time-code"
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="forgot-reset-password">New password</label>
              <div className="input-wrapper">
                <span className="input-icon">*</span>
                <input
                  id="forgot-reset-password"
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter a new password"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="forgot-reset-confirm-password">Confirm new password</label>
              <div className="input-wrapper">
                <span className="input-icon">*</span>
                <input
                  id="forgot-reset-confirm-password"
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <label className="show-password-check">
              <input
                type="checkbox"
                checked={showPasswords}
                onChange={() => setShowPasswords(!showPasswords)}
              />
              <span>Show passwords</span>
            </label>

            <div className="forgot-password-actions">
              <button type="button" className="forgot-password-link" onClick={() => setStep('request')}>
                Back
              </button>
              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordModal;
