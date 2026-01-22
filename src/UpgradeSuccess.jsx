import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

function formatPlanName(plan) {
  if (!plan || typeof plan !== "string") return "";
  const trimmed = plan.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export default function UpgradeSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying");
  const [planData, setPlanData] = useState(null);
  const [mode, setMode] = useState("upgrade"); // "upgrade" | "signup"
  const [errorMessage, setErrorMessage] = useState("");
  const [signupInfo, setSignupInfo] = useState(null);

  const storeId = searchParams.get("storeId");
  const targetPlanParam = searchParams.get("plan");
  const targetPlan = targetPlanParam ? targetPlanParam.toLowerCase() : targetPlanParam;
  const isSignup = searchParams.get("signup") === "true";
  const urlEmail = searchParams.get("email");
  const urlStoreName = searchParams.get("store");

  useEffect(() => {
    let cancelled = false;
    let pollIntervalId;

    async function handlePaidSignup() {
      // First try URL params (for new flow)
      if (urlEmail && urlStoreName && targetPlan) {

        // Check localStorage for password and referral code
        const pendingSignupRaw = localStorage.getItem("pendingSignup");
        let password = null;
        let referralCode = null;

        if (pendingSignupRaw) {
          try {
            const parsed = JSON.parse(pendingSignupRaw);
            password = parsed.password;
            referralCode = parsed.referralCode; // Get referral code from localStorage
          } catch (err) {
            console.error("⚠️ Could not parse localStorage, will prompt for password");
          }
        }

        if (!password) {
          // Prompt user for password since localStorage was cleared
          password = prompt("Please re-enter your password to complete signup:");
          if (!password) {
            setErrorMessage("Password is required to complete signup. Please try again.");
            setStatus("error");
            return true;
          }
        }

        setMode("signup");
        setSignupInfo({ email: urlEmail, storeName: urlStoreName, plan: targetPlan });
        setStatus("creating");


        const { data, error } = await supabase.functions.invoke("complete-signup", {
          body: {
            email: urlEmail,
            password: password,
            storeName: urlStoreName,
            plan: targetPlan,
            referralCode: referralCode, // Pass referral code if exists
          },
        });


        if (cancelled) return true;

        if (error || data?.error) {
          console.error("❌ complete-signup failed:", error || data?.error);
          setErrorMessage(
            data?.error ||
            error?.message ||
            "We could not finish creating your account. Please contact support if you were charged."
          );
          setStatus("error");
          return true;
        }

        localStorage.removeItem("pendingSignup");

        const now = new Date();
        const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        setPlanData({
          plan: targetPlan,
          plan_started_at: data?.plan_started_at || now.toISOString(),
          plan_expires_at: data?.plan_expires_at || expires.toISOString(),
        });

        setStatus("success");
        return true;
      }

      // Fallback to localStorage (legacy flow)
      const pendingSignupRaw = localStorage.getItem("pendingSignup");


      if (!pendingSignupRaw) {
        return false;
      }

      setMode("signup");

      let pendingSignup;
      try {
        pendingSignup = JSON.parse(pendingSignupRaw);
      } catch (err) {
        console.error("❌ Failed to parse pendingSignup:", err);
        localStorage.removeItem("pendingSignup");
        setErrorMessage("We could not read your signup details. Please start again and contact support if this persists.");
        setStatus("error");
        return true;
      }

      const { email, password, storeName, plan, referralCode, timestamp } = pendingSignup || {};

      if (!email || !password || !storeName || !plan) {
        console.error("❌ Missing required fields:", { email: !!email, password: !!password, storeName: !!storeName, plan: !!plan });
        localStorage.removeItem("pendingSignup");
        setErrorMessage("Signup details were incomplete. Please start again and contact support if this persists.");
        setStatus("error");
        return true;
      }

      // Prevent very old pending signups from being auto-completed
      if (timestamp && Date.now() - timestamp > 1000 * 60 * 60) {
        localStorage.removeItem("pendingSignup");
        setErrorMessage("Your payment session expired. Please sign up again.");
        setStatus("error");
        return true;
      }

      setSignupInfo({ email, storeName, plan });
      setStatus("creating");


      const { data, error } = await supabase.functions.invoke("complete-signup", {
        body: {
          email,
          password,
          storeName,
          plan,
          referralCode, // Pass referral code if exists
        },
      });


      if (cancelled) return true;

      if (error || data?.error) {
        console.error("❌ complete-signup failed:", error || data?.error);
        setErrorMessage(
          data?.error ||
          error?.message ||
          "We could not finish creating your account. Please contact support if you were charged. Save this info: " + JSON.stringify({ email, storeName, plan })
        );
        setStatus("error");
        return true;
      }

      localStorage.removeItem("pendingSignup");

      const now = new Date();
      const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      setPlanData({
        plan,
        plan_started_at: data?.plan_started_at || now.toISOString(),
        plan_expires_at: data?.plan_expires_at || expires.toISOString(),
      });

      setStatus("success");
      return true;
    }

    async function verifyUpgrade() {
      setMode("upgrade");
      setStatus("verifying");

      if (!storeId || !targetPlan) {
        setErrorMessage("Missing upgrade details from payment redirect. Please go back to your dashboard and try again.");
        setStatus("error");
        return;
      }

      let attempts = 0;
      const maxAttempts = 30;

      const checkUpgrade = async () => {
        const { data: store, error } = await supabase
          .from("tenants")
          .select("plan, plan_started_at, plan_expires_at")
          .eq("id", storeId)
          .single();

        if (error) {
          
          return null;
        }

        if (store && store.plan?.trim().toLowerCase() === targetPlan) {
          return store;
        }

        return null;
      };

      const upgradedStore = await checkUpgrade();
      if (upgradedStore) {
        setPlanData(upgradedStore);
        setStatus("success");
        return;
      }

      pollIntervalId = setInterval(async () => {
        attempts++;
        const store = await checkUpgrade();

        if (cancelled) {
          clearInterval(pollIntervalId);
          return;
        }

        if (store) {
          setPlanData(store);
          setStatus("success");
          clearInterval(pollIntervalId);
          return;
        }

        if (attempts >= maxAttempts) {
          setStatus("pending");
          clearInterval(pollIntervalId);
        }
      }, 1000);
    }

    handlePaidSignup().then((handled) => {
      if (!handled && !isSignup) {
        // Only verify upgrade if this is NOT a new signup
        verifyUpgrade();
      } else if (!handled && isSignup) {
        // New signup but no localStorage data - something went wrong
        console.error("❌ New signup detected but no localStorage data found");
        setErrorMessage("Payment received but signup data was lost. Please contact support with your payment confirmation.");
        setStatus("error");
      }
    });

    return () => {
      cancelled = true;
      if (pollIntervalId) {
        clearInterval(pollIntervalId);
      }
    };
  }, [storeId, targetPlan, isSignup]);

  const planName = formatPlanName(signupInfo?.plan || planData?.plan || targetPlan);
  const resolvedPlanName = planName || "Pro";

  if (status === "creating") {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.spinner}></div>
          <h1 style={styles.title}>Finalizing your signup...</h1>
          <p style={styles.text}>
            We're confirming your payment and creating your {resolvedPlanName} account. You'll get a confirmation email shortly.
          </p>
        </div>
      </div>
    );
  }

  if (status === "verifying") {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.spinner}></div>
          <h1 style={styles.title}>Verifying Payment...</h1>
          <p style={styles.text}>Please wait while we confirm your upgrade.</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    const startedAt = planData?.plan_started_at ? new Date(planData.plan_started_at).toLocaleDateString() : null;
    const expiresAt = planData?.plan_expires_at ? new Date(planData.plan_expires_at).toLocaleDateString() : null;
    const isPremium = resolvedPlanName?.toLowerCase() === "premium";

    return (
      <div style={{
        minHeight: "100vh",
        background: isPremium
          ? "linear-gradient(135deg, #9333ea 0%, #7c3aed 50%, #6d28d9 100%)"
          : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem"
      }}>
        <div style={{
          background: "white",
          borderRadius: "24px",
          maxWidth: "500px",
          width: "100%",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
        }}>
          {/* Success Header */}
          <div style={{
            background: isPremium
              ? "linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)"
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: "2.5rem 2rem",
            textAlign: "center"
          }}>
            <div style={{
              width: "80px",
              height: "80px",
              background: "white",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              fontSize: "2.5rem",
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
              color: "#10b981"
            }}>
              ✓
            </div>
            <h1 style={{
              color: "white",
              margin: "0 0 0.5rem 0",
              fontSize: "1.75rem",
              fontWeight: "700"
            }}>
              {mode === "signup" ? "Welcome Aboard!" : "Upgrade Complete!"}
            </h1>
            <p style={{
              color: "rgba(255,255,255,0.9)",
              margin: 0,
              fontSize: "1rem"
            }}>
              {mode === "signup"
                ? `Your ${resolvedPlanName} account is ready`
                : `You're now on ${resolvedPlanName}`}
            </p>
          </div>

          {/* Content */}
          <div style={{ padding: "2rem" }}>
            {/* Email Notice for Signup */}
            {mode === "signup" && (
              <div style={{
                background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
                border: "2px solid #3b82f6",
                borderRadius: "16px",
                padding: "1.5rem",
                marginBottom: "1.5rem",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📧</div>
                <h3 style={{
                  margin: "0 0 0.5rem 0",
                  color: "#1e40af",
                  fontSize: "1rem",
                  fontWeight: "700"
                }}>
                  Check Your Email
                </h3>
                <p style={{
                  margin: 0,
                  color: "#1e40af",
                  fontSize: "0.9rem"
                }}>
                  We sent a welcome email to<br />
                  <strong>{signupInfo?.email || "your email"}</strong>
                </p>
              </div>
            )}

            {/* Plan Details */}
            <div style={{
              background: "#f8fafc",
              borderRadius: "16px",
              padding: "1.5rem",
              marginBottom: "1.5rem"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                marginBottom: "1rem"
              }}>
                <div style={{
                  width: "50px",
                  height: "50px",
                  background: isPremium ? "#9333ea" : "#667eea",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem"
                }}>
                  {isPremium ? "👑" : "⭐"}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: "700", color: "#1e293b", fontSize: "1.1rem" }}>
                    {resolvedPlanName} Plan
                  </p>
                  {signupInfo?.storeName && (
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem" }}>
                      {signupInfo.storeName}
                    </p>
                  )}
                </div>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem"
              }}>
                {startedAt && (
                  <div style={{
                    background: "white",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0"
                  }}>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b" }}>Started</p>
                    <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: "600", color: "#1e293b" }}>{startedAt}</p>
                  </div>
                )}
                {expiresAt && (
                  <div style={{
                    background: "white",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0"
                  }}>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b" }}>Renews</p>
                    <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: "600", color: "#1e293b" }}>{expiresAt}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Features Unlocked */}
            <div style={{
              background: "#f0fdf4",
              borderRadius: "12px",
              padding: "1.25rem",
              marginBottom: "1.5rem"
            }}>
              <h4 style={{ margin: "0 0 0.75rem 0", color: "#166534", fontSize: "0.95rem" }}>
                {mode === "signup" ? "What's Included" : "Features Unlocked"}
              </h4>
              <ul style={{
                margin: 0,
                paddingLeft: "1.25rem",
                color: "#15803d",
                fontSize: "0.9rem",
                lineHeight: "1.8"
              }}>
                <li>Unlimited products</li>
                <li>WhatsApp notifications</li>
                <li>Remove branding</li>
                {isPremium && <li>Custom domain included</li>}
                {isPremium && <li>Advanced analytics</li>}
              </ul>
            </div>

            {/* Action Button */}
            <button
              onClick={() => navigate('/app')}
              style={{
                width: "100%",
                padding: "1rem",
                background: isPremium
                  ? "linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)"
                  : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "1rem",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem"
              }}
            >
              {mode === "signup" ? "Go to Login →" : "Go to Dashboard →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.warningIcon}>�s��,?</div>
          <h1 style={styles.title}>Payment Processing</h1>
          <p style={styles.text}>
            Your payment was received but the upgrade is still being processed.
          </p>
          <p style={styles.notification}>
            Your plan will be upgraded shortly. Please check back in a moment or refresh your dashboard.
          </p>
          <button
            onClick={() => navigate('/app')}
            style={styles.button}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.errorIcon}>�o</div>
        <h1 style={styles.title}>Something went wrong</h1>
        <p style={styles.text}>
          {errorMessage || "We couldn't verify your upgrade. Please contact support if you were charged."}
        </p>
        <button
          onClick={() => navigate('/app')}
          style={styles.button}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '3rem',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  successIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: '#10b981',
    color: 'white',
    fontSize: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem',
    fontWeight: 'bold',
  },
  errorIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: '#ef4444',
    color: 'white',
    fontSize: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem',
    fontWeight: 'bold',
  },
  warningIcon: {
    fontSize: '64px',
    margin: '0 auto 1.5rem',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 1.5rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: '#1f2937',
  },
  text: {
    fontSize: '1.1rem',
    color: '#6b7280',
    marginBottom: '1rem',
    lineHeight: '1.6',
  },
  upgradeDetails: {
    background: '#f3f4f6',
    borderRadius: '8px',
    padding: '1.5rem',
    margin: '1.5rem 0',
    textAlign: 'left',
  },
  notification: {
    background: '#dbeafe',
    borderRadius: '8px',
    padding: '1rem',
    marginTop: '1.5rem',
    color: '#1e40af',
  },
  button: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '1rem 2rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '1.5rem',
    width: '100%',
  },
};
