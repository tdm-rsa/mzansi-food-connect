import { useState } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";
import logo from "./images/logo.png";

export default function Login({ onLogin, onSwitchToSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
              <a href="#forgot" className="forgot-link">Forgot password?</a>
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
    </div>
  );
}
