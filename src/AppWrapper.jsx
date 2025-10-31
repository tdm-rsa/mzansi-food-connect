import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import App from "./App.jsx";
import Login from "./Login.jsx";

export default function AppWrapper() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (!user) return <Login onLogin={setUser} />;

  // ✅ Only render dashboard when logged in
  return <App user={user} />;
}
