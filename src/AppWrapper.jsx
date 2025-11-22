import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import App from "./App.jsx";
import Login from "./Login.jsx";
import Signup from "./Signup.jsx";

const SIGNUPS_ENABLED = false;

export default function AppWrapper() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSignup, setShowSignup] = useState(false);

  // ✅ Check session and watch for auth changes
  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    }

    checkUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading)
    return <p style={{ color: "#fff", textAlign: "center" }}>Checking session...</p>;

  // Show signup or login page when not authenticated
  if (!user) {
    if (SIGNUPS_ENABLED && showSignup) {
      return <Signup onBack={() => setShowSignup(false)} />;
    }
    return (
      <Login
        onLogin={setUser}
        onSwitchToSignup={SIGNUPS_ENABLED ? () => setShowSignup(true) : undefined}
        signupsEnabled={SIGNUPS_ENABLED}
      />
    );
  }

  // ✅ Only render dashboard when logged in
  return <App user={user} />;
}
