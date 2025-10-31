import { useState } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    else onLogin(data.user);
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) setError(error.message);
    else alert("✅ Account created — please check your email for verification.");
  }

  return (
    <div className="login-page">
      <h2>🔐 Store Owner Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
        <button type="button" onClick={handleSignup}>
          Sign Up
        </button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
