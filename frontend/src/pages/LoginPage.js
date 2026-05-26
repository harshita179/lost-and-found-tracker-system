import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./LoginPage.css";
import API_BASE_URL from "../api";
import logo from "../assets/medilogo.jpg";
import ForgotPasswordModal from "../components/ForgotPasswordModal";

const LoginPage = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.username || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        if (onLoginSuccess) {
          onLoginSuccess(data);
        }
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left branded hero panel */}
      <div className="auth-hero">
        <div className="auth-hero-overlay"></div>
        <div className="auth-hero-content">
          <div className="auth-hero-badge">🎓 Campus Portal</div>
          <h1>Lost & Found</h1>
          <p>Helping Medicaps University students and staff recover lost belongings quickly and securely.</p>
          <div className="auth-hero-features">
            <div className="hero-feature">
              <span className="hero-feature-icon">📋</span>
              <span>Report lost or found items instantly</span>
            </div>
            <div className="hero-feature">
              <span className="hero-feature-icon">🔍</span>
              <span>Search & filter through reports</span>
            </div>
            <div className="hero-feature">
              <span className="hero-feature-icon">✅</span>
              <span>Match and resolve items seamlessly</span>
            </div>
          </div>
        </div>
        <div className="auth-hero-decoration">
          <div className="deco-circle deco-1"></div>
          <div className="deco-circle deco-2"></div>
          <div className="deco-circle deco-3"></div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-wrapper">
          <div className="auth-form-header">
            <img src={logo} alt="Medicaps University" className="auth-logo" />
            <h2>Welcome back</h2>
            <p>Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="auth-error">
              <span className="auth-error-icon">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" id="login-form">
            <div className="form-field">
              <label htmlFor="login-username">Username</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input
                  id="login-username"
                  type="text"
                  name="username"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="login-password">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="auth-inline-actions">
              <button
                type="button"
                className="auth-text-button"
                onClick={() => setIsForgotPasswordOpen(true)}
              >
                Forgot password?
              </button>
            </div>

            <button type="submit" className="auth-submit-btn" id="login-submit" disabled={loading}>
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner"></span>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don't have an account?{" "}
              <Link to="/signup">Create one</Link>
            </p>
          </div>
        </div>
      </div>
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </div>
  );
};

export default LoginPage;
