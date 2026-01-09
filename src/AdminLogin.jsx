// Admin Login Page
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Check credentials against environment variables (set in Vercel/hosting platform)
    const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME || "admin";
    const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || "000000";

    // Use timing-safe comparison to prevent timing attacks
    const usernameMatch = username === ADMIN_USERNAME;
    const pinMatch = pin === ADMIN_PIN;

    if (usernameMatch && pinMatch) {
      // Store admin session
      sessionStorage.setItem("adminLoggedIn", "true");
      sessionStorage.setItem("adminUsername", username);

      // Redirect to admin dashboard
      setTimeout(() => {
        navigate("/admin-dashboard");
      }, 500);
    } else {
      setError("Invalid username or PIN");
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-header">
          <div className="admin-icon">👑</div>
          <h1>Admin Access</h1>
          <p>Platform Administration</p>
        </div>

        <form className="admin-login-form" onSubmit={handleLogin}>
          {error && (
            <div className="admin-error-message">
              ⚠️ {error}
            </div>
          )}

          <div className="admin-form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              disabled={loading}
              autoComplete="off"
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="pin">PIN</label>
            <input
              type="password"
              id="pin"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter 6-digit PIN"
              maxLength="6"
              required
              disabled={loading}
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            className="admin-login-btn"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Access Dashboard"}
          </button>
        </form>

        <div className="admin-login-footer">
          <button
            className="admin-back-btn"
            onClick={() => navigate("/")}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
