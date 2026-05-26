import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API_BASE_URL from '../api';
import './SignupPage.css';
import logo from '../assets/medilogo.jpg';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

function SignupPage({ onSignupSuccess }) {
  const [signupStep, setSignupStep] = useState('details');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageType, setMessageType] = useState('');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!username || !email || !password || !confirmPassword) {
      setMessage('Please fill in all fields');
      setMessageType('error');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      setMessageType('error');
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters');
      setMessageType('error');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, phone }),
      });
      const data = await res.json();

      if (data.requiresVerification) {
        setSignupStep('otp');
        setOtp('');
        setMessage(data.message || 'OTP sent to your email');
        setMessageType('success');
      } else if (data.success) {
        setMessage('Account created successfully! Redirecting...');
        setMessageType('success');
        onSignupSuccess(data);
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        setMessage(data.message || 'Signup failed');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Connection error. Please try again.');
      setMessageType('error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!otp) {
      setMessage('Please enter the OTP sent to your email');
      setMessageType('error');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-signup-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage('Email verified successfully! Redirecting...');
        setMessageType('success');
        onSignupSuccess(data);
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        setMessage(data.message || 'OTP verification failed');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Connection error. Please try again.');
      setMessageType('error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setMessage('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/resend-signup-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage(data.message || 'OTP sent again');
        setMessageType('success');
      } else {
        setMessage(data.message || 'Could not resend OTP');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Connection error. Please try again.');
      setMessageType('error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div className="auth-hero-overlay"></div>
        <div className="auth-hero-content">
          <div className="auth-hero-badge">Campus Portal</div>
          <h1>Join the Community</h1>
          <p>Create your account to start reporting and recovering lost items across Medicaps University campus.</p>
          <div className="auth-hero-features">
            <div className="hero-feature">
              <span className="hero-feature-icon">Fast</span>
              <span>Quick registration with email verification</span>
            </div>
            <div className="hero-feature">
              <span className="hero-feature-icon">Alert</span>
              <span>Get notified when items match</span>
            </div>
            <div className="hero-feature">
              <span className="hero-feature-icon">Help</span>
              <span>Help fellow students recover belongings</span>
            </div>
          </div>
        </div>
        <div className="auth-hero-decoration">
          <div className="deco-circle deco-1"></div>
          <div className="deco-circle deco-2"></div>
          <div className="deco-circle deco-3"></div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-wrapper">
          <div className="auth-form-header">
            <img src={logo} alt="Medicaps University" className="auth-logo" />
            <h2>{signupStep === 'details' ? 'Create Account' : 'Verify Email'}</h2>
            <p>
              {signupStep === 'details'
                ? 'Fill in your details to get started'
                : 'Enter the OTP sent to your email to complete signup'}
            </p>
          </div>

          {message && (
            <div className={`auth-message ${messageType}`}>
              <span className="auth-message-icon">
                {messageType === 'success' ? 'OK' : messageType === 'error' ? '!' : 'i'}
              </span>
              {message}
            </div>
          )}

          {signupStep === 'details' ? (
            <form onSubmit={handleSignup} className="auth-form" id="signup-form">
              <div className="form-field">
                <label htmlFor="signup-username">Username</label>
                <div className="input-wrapper">
                  <span className="input-icon">User</span>
                  <input
                    id="signup-username"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="signup-email">Email</label>
                <div className="input-wrapper">
                  <span className="input-icon">Mail</span>
                  <input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="signup-phone">Phone Number (for SMS alerts)</label>
                <div className="input-wrapper">
                  <span className="input-icon">Call</span>
                  <input
                    id="signup-phone"
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="signup-password">Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon">Key</span>
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="signup-confirm-password">Confirm</label>
                  <div className="input-wrapper">
                    <span className="input-icon">Key</span>
                    <input
                      id="signup-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>
              </div>

              <label className="show-password-check">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                />
                <span>Show passwords</span>
              </label>

              <div className="auth-inline-actions">
                <button
                  type="button"
                  className="auth-text-button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                >
                  Forgot password?
                </button>
              </div>

              <button type="submit" className="auth-submit-btn" id="signup-submit" disabled={isLoading}>
                {isLoading ? (
                  <span className="btn-loading">
                    <span className="spinner"></span>
                    Sending OTP...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="auth-form" id="signup-otp-form">
              <div className="form-field">
                <label htmlFor="signup-otp">Email OTP</label>
                <div className="input-wrapper">
                  <span className="input-icon">OTP</span>
                  <input
                    id="signup-otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                  />
                </div>
              </div>

              <p className="auth-step-note">
                Signup will complete only after OTP verification for <strong>{email}</strong>.
              </p>

              <div className="auth-inline-actions">
                <button
                  type="button"
                  className="auth-text-button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                >
                  Resend OTP
                </button>
                <button
                  type="button"
                  className="auth-text-button"
                  onClick={() => {
                    setSignupStep('details');
                    setOtp('');
                    setMessage('');
                  }}
                  disabled={isLoading}
                >
                  Edit details
                </button>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <span className="btn-loading">
                    <span className="spinner"></span>
                    Verifying OTP...
                  </span>
                ) : (
                  'Verify OTP'
                )}
              </button>
            </form>
          )}

          <div className="auth-footer">
            <p>
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        defaultEmail={email}
      />
    </div>
  );
}

export default SignupPage;
