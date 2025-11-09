import { useState } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";
import logo from "./images/logo.png";

export default function Login({ onLogin, onSwitchToSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) setError(error.message);
    else onLogin(data.user);
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setResetError("");
    setResetLoading(true);

    try {
      // Use production URL for password reset links (even when testing locally)
      const productionUrl = import.meta.env.VITE_PRODUCTION_URL || window.location.origin;

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${productionUrl}/reset-password`,
      });

      if (error) throw error;

      setResetSent(true);
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetLoading(false);
    }
  }

  function closeForgotPassword() {
    setShowForgotPassword(false);
    setResetEmail("");
    setResetSent(false);
    setResetError("");
  }


  return (
    <div className="modern-login-page">
      {/* Left Side - Branding */}
      <div className="login-left">
        <div className="login-brand">
          <img src={logo} alt="Mzansi Food Connect" className="brand-logo" />
          <h1>Mzansi Food Connect</h1>
          <p className="brand-tagline">Empowering South African Food Businesses</p>
        </div>

        <div className="login-features">
          <div className="feature-item">
            <span className="feature-icon">🏪</span>
            <div>
              <h3>Online Store</h3>
              <p>Create your own branded storefront in minutes</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📊</span>
            <div>
              <h3>Real-time Analytics</h3>
              <p>Track sales and customer behavior instantly</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">💳</span>
            <div>
              <h3>Secure Payments</h3>
              <p>Accept payments with Paystack integration</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📱</span>
            <div>
              <h3>WhatsApp Alerts</h3>
              <p>Get notified instantly for every order</p>
            </div>
          </div>
        </div>

        <div className="login-pricing-preview">
          <h4>🚀 Start Free, Upgrade Anytime</h4>
          <div className="price-tags">
            <span className="price-tag free">7-Day Free Trial</span>
            <span className="price-tag pro">Pro R150/mo</span>
            <span className="price-tag premium">Premium R300/mo</span>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="login-right">
        <div className="login-form-container">
          <div className="form-header">
            <h2>Welcome Back</h2>
            <p>Login to your dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="modern-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
                minLength={6}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="forgot-link"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner"></span>
                  Signing in...
                </span>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="form-divider">
            <span>or</span>
          </div>

          <button
            type="button"
            className="toggle-mode-btn"
            onClick={onSwitchToSignup}
          >
            Don't have an account? Create one
          </button>

          <div className="form-footer">
            <p>
              By continuing, you agree to our{" "}
              <a href="#terms">Terms of Service</a> and{" "}
              <a href="#privacy">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="modal-overlay" onClick={closeForgotPassword}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reset Your Password</h2>
              <button
                onClick={closeForgotPassword}
                className="modal-close"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {resetSent ? (
              <div className="modal-body">
                <div className="success-message" style={{
                  background: '#d4edda',
                  border: '1px solid #c3e6cb',
                  color: '#155724',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}>
                  <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>✅</span>
                  <strong>Check your email!</strong>
                  <p style={{ margin: '0.5rem 0 0 0' }}>
                    We've sent a password reset link to <strong>{resetEmail}</strong>
                  </p>
                </div>
                <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                  Click the link in the email to reset your password. The link will expire in 1 hour.
                </p>
                <button
                  onClick={closeForgotPassword}
                  className="login-btn"
                  style={{ width: '100%' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <div className="modal-body">
                  <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                    Enter your email address and we'll send you a link to reset your password.
                  </p>

                  <div className="form-group">
                    <label htmlFor="reset-email">Email Address</label>
                    <input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      className="form-input"
                    />
                  </div>

                  {resetError && (
                    <div className="error-message">
                      <span className="error-icon">⚠️</span>
                      {resetError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="login-btn"
                    disabled={resetLoading}
                    style={{ width: '100%', marginTop: '1rem' }}
                  >
                    {resetLoading ? (
                      <span className="btn-loading">
                        <span className="spinner"></span>
                        Sending...
                      </span>
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={closeForgotPassword}
                    className="toggle-mode-btn"
                    style={{ width: '100%', marginTop: '0.5rem' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
