import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";
import logo from "./images/logo.png";

export default function ResetPassword({ onBackToLogin }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Check if this is a valid password reset session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setError("Invalid or expired reset link. Please request a new one.");
      }
    });
  }, []);

  async function handleResetPassword(e) {
    e.preventDefault();
    setError("");

    // Validation
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        if (onBackToLogin) {
          onBackToLogin();
        } else {
          window.location.href = "/app";
        }
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modern-login-page">
      {/* Left Side - Branding */}
      <div className="login-left">
        <div className="login-brand">
          <img src={logo} alt="Mzansi Food Connect" className="brand-logo" />
          <h1>Mzansi Food Connect</h1>
          <p className="brand-tagline">Reset Your Password</p>
        </div>

        <div className="login-features">
          <div className="feature-item">
            <span className="feature-icon">🔒</span>
            <div>
              <h3>Secure Account</h3>
              <p>Choose a strong password to protect your store</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✅</span>
            <div>
              <h3>Quick & Easy</h3>
              <p>Just enter your new password and you're done</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Reset Form */}
      <div className="login-right">
        <div className="login-form-container">
          {success ? (
            <div>
              <div className="form-header">
                <h2>Password Reset Successful!</h2>
                <p>Your password has been updated</p>
              </div>
              <div className="success-message" style={{
                background: '#d4edda',
                border: '1px solid #c3e6cb',
                color: '#155724',
                padding: '1.5rem',
                borderRadius: '12px',
                marginTop: '2rem',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>✅</span>
                <strong style={{ fontSize: '1.1rem' }}>All set!</strong>
                <p style={{ margin: '0.5rem 0 0 0' }}>
                  Redirecting you to login...
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="form-header">
                <h2>Create New Password</h2>
                <p>Enter your new password below</p>
              </div>

              <form onSubmit={handleResetPassword} className="modern-form">
                <div className="form-group">
                  <label htmlFor="new-password">New Password</label>
                  <input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="form-input"
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <small style={{ color: '#666', fontSize: '0.85rem' }}>
                    At least 6 characters
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="confirm-password">Confirm Password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="form-input"
                    minLength={6}
                    autoComplete="new-password"
                  />
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
                      Resetting...
                    </span>
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>
              </form>

              <div className="form-divider">
                <span>or</span>
              </div>

              <button
                type="button"
                className="toggle-mode-btn"
                onClick={() => window.location.href = "/app"}
              >
                ← Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
