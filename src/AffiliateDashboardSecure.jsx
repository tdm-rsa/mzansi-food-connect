import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";

export default function AffiliateDashboard() {
  const [loading, setLoading] = useState(true);
  const [affiliateData, setAffiliateData] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [email, setEmail] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showLogin, setShowLogin] = useState(true);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [session, setSession] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);

      if (event === 'SIGNED_IN' && session) {
        setShowLogin(false);
        await loadDashboard(session.user.email);

        // Log successful login
        await logAudit('login', 'Affiliate logged in successfully');
      }

      if (event === 'SIGNED_OUT') {
        setShowLogin(true);
        setAffiliateData(null);
        setReferrals([]);
        setPayouts([]);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  async function checkSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setSession(session);
        setShowLogin(false);
        await loadDashboard(session.user.email);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError("");
    setLoading(true);

    try {
      // Check if affiliate exists first
      const { data: affiliate, error: checkError } = await supabase
        .from("affiliates")
        .select("email, auth_user_id")
        .eq("email", email.toLowerCase())
        .single();

      if (checkError || !affiliate) {
        throw new Error("No affiliate account found with this email. Please sign up first.");
      }

      // Send magic link
      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/affiliate-dashboard`
        }
      });

      if (error) throw error;

      setMagicLinkSent(true);
      await logAudit('magic_link_sent', `Magic link sent to ${email}`);

    } catch (err) {
      setLoginError(err.message);
      setLoading(false);
    }
  }

  async function loadDashboard(userEmail) {
    try {
      const { data: affiliate, error: affiliateError } = await supabase
        .from("affiliates")
        .select("*")
        .eq("email", userEmail)
        .single();

      if (affiliateError) throw affiliateError;

      setAffiliateData(affiliate);

      // Update last login
      await supabase
        .from("affiliates")
        .update({
          last_login_at: new Date().toISOString()
        })
        .eq("id", affiliate.id);

      const { data: referralData, error: referralError } = await supabase
        .from("referrals")
        .select(`
          *,
          store:tenants(name, email, plan, slug, created_at, owner_id)
        `)
        .eq("affiliate_id", affiliate.id)
        .order("created_at", { ascending: false });

      if (referralError) throw referralError;

      setReferrals(referralData || []);

      const { data: payoutData, error: payoutError } = await supabase
        .from("commission_payouts")
        .select("*")
        .eq("affiliate_id", affiliate.id)
        .order("created_at", { ascending: false });

      if (payoutError) throw payoutError;

      setPayouts(payoutData || []);

    } catch (err) {
      console.error("Error loading dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestPayout() {
    if (!affiliateData || affiliateData.available_balance <= 0) {
      alert("❌ No balance available to withdraw");
      return;
    }

    const amount = parseFloat(prompt(`Enter amount to withdraw (Available: R${affiliateData.available_balance.toFixed(2)}):`));

    if (isNaN(amount) || amount <= 0) {
      return;
    }

    if (amount < 50) {
      alert("❌ Minimum payout amount is R50");
      return;
    }

    if (amount > affiliateData.available_balance) {
      alert("❌ Amount exceeds available balance");
      return;
    }

    setRequestingPayout(true);

    try {
      const { data, error } = await supabase.functions.invoke('request-affiliate-payout', {
        body: {
          affiliateEmail: affiliateData.email,
          amount: amount
        }
      });

      if (error) throw error;

      alert(`✅ Payout request submitted!\n\nAmount: R${amount.toFixed(2)}\n\nAn email has been sent to the admin (nqubeko377@gmail.com). You'll receive payment within 1-3 business days.`);

      // Log payout request
      await logAudit('payout_request', `Requested payout of R${amount.toFixed(2)}`);

      await loadDashboard(affiliateData.email);
    } catch (err) {
      alert("❌ Error: " + err.message);
    } finally {
      setRequestingPayout(false);
    }
  }

  async function logAudit(action, details) {
    try {
      if (affiliateData) {
        await supabase.rpc('log_affiliate_audit', {
          p_affiliate_id: affiliateData.id,
          p_user_email: affiliateData.email,
          p_action: action,
          p_details: { message: details }
        });
      }
    } catch (error) {
      console.error('Audit log error:', error);
    }
  }

  async function handleLogout() {
    await logAudit('logout', 'Affiliate logged out');
    await supabase.auth.signOut();
  }

  // Rest of the component UI code stays the same - just update the login section
  // I'll show the key login UI changes:

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f9fafb"
      }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // Login Screen with Magic Link
  if (showLogin) {
    return (
      <div className="modern-login-page">
        <div className="login-left" style={{
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)"
        }}>
          <div className="login-brand">
            <div className="brand-icon" style={{ fontSize: "4rem" }}>💰</div>
            <h1 style={{ color: "white" }}>Affiliate Dashboard</h1>
            <p className="brand-tagline" style={{ color: "rgba(255,255,255,0.9)" }}>
              Secure login with email verification
            </p>
          </div>

          <div style={{
            background: "rgba(255,255,255,0.1)",
            padding: "2rem",
            borderRadius: "15px",
            marginTop: "2rem",
            backdropFilter: "blur(10px)"
          }}>
            <h3 style={{ color: "white", marginBottom: "1rem" }}>🔒 Secure Authentication</h3>
            <div style={{ color: "white", fontSize: "0.95rem", lineHeight: "1.8" }}>
              <p>✅ No passwords to remember</p>
              <p>✅ Email verification every time</p>
              <p>✅ Your data is protected</p>
              <p>✅ POPIA compliant security</p>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-form-container">
            {!magicLinkSent ? (
              <>
                <div className="form-header">
                  <h2>Sign in to view your earnings</h2>
                  <p>We'll send you a secure login link</p>
                </div>

                <form onSubmit={handleLogin} className="modern-form">
                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="form-input"
                      autoFocus
                    />
                  </div>

                  {loginError && (
                    <div className="error-message">
                      <span className="error-icon">⚠️</span>
                      {loginError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="login-btn"
                    disabled={loading}
                    style={{ width: "100%", marginTop: "1rem" }}
                  >
                    {loading ? (
                      <span className="btn-loading">
                        <span className="spinner"></span>
                        Sending magic link...
                      </span>
                    ) : (
                      "🔐 Send Magic Link"
                    )}
                  </button>

                  <div style={{
                    marginTop: "1.5rem",
                    padding: "1rem",
                    background: "#f0f9ff",
                    border: "1px solid #bae6fd",
                    borderRadius: "8px",
                    fontSize: "0.9rem",
                    color: "#0c4a6e"
                  }}>
                    🔒 We'll send a secure login link to your email. Click the link to access your dashboard.
                  </div>
                </form>

                <div className="form-footer" style={{ marginTop: "2rem" }}>
                  <p>
                    Don't have an account?{" "}
                    <a href="/become-affiliate" style={{ color: "#10b981", fontWeight: "600" }}>
                      Sign up here
                    </a>
                  </p>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📧</div>
                <h2 style={{ marginBottom: "1rem", color: "#10b981" }}>Check Your Email!</h2>
                <p style={{ color: "#6b7280", marginBottom: "2rem", lineHeight: "1.6" }}>
                  We've sent a magic link to <strong>{email}</strong>
                </p>
                <div style={{
                  background: "#f0fdf4",
                  border: "2px solid #10b981",
                  borderRadius: "8px",
                  padding: "1.5rem",
                  marginBottom: "2rem"
                }}>
                  <p style={{ margin: 0, color: "#065f46", lineHeight: "1.6" }}>
                    <strong>📱 Next Steps:</strong><br />
                    1. Open your email inbox<br />
                    2. Click the magic link we sent<br />
                    3. You'll be logged in automatically
                  </p>
                </div>
                <button
                  onClick={() => {
                    setMagicLinkSent(false);
                    setLoginError("");
                  }}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer"
                  }}
                >
                  ← Back to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full Dashboard UI
  const referralLink = `${window.location.origin}/signup?ref=${affiliateData?.referral_code}`;
  const activeReferrals = referrals.filter(r => r.status === 'active');
  const churnedReferrals = referrals.filter(r => r.status === 'churned' || r.status === 'cancelled');

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f3f4f6",
      paddingBottom: "4rem"
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "2rem",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem"
          }}>
            <div>
              <h1 style={{ color: "white", margin: 0, fontSize: "2rem" }}>
                👋 Welcome back, {affiliateData.full_name}!
              </h1>
              <p style={{ color: "rgba(255,255,255,0.9)", margin: "0.5rem 0 0 0", fontSize: "1.1rem" }}>
                Track your earnings and manage payouts
              </p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: "0.75rem 1.5rem",
                background: "rgba(255,255,255,0.2)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                backdropFilter: "blur(10px)"
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
        {/* Main Balance Card */}
        <div style={{
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          padding: "3rem",
          borderRadius: "20px",
          boxShadow: "0 20px 60px rgba(16, 185, 129, 0.4)",
          marginBottom: "2rem",
          color: "white",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{
            position: "absolute",
            top: "-50px",
            right: "-50px",
            width: "200px",
            height: "200px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "50%"
          }}></div>
          <div style={{
            position: "absolute",
            bottom: "-30px",
            left: "-30px",
            width: "150px",
            height: "150px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "50%"
          }}></div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "3rem"
            }}>
              <div>
                <div style={{ fontSize: "0.95rem", opacity: 0.9, marginBottom: "0.5rem" }}>
                  💵 Available Balance
                </div>
                <div style={{ fontSize: "4rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
                  R{(affiliateData.available_balance || 0).toFixed(2)}
                </div>
                <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                  Ready to withdraw anytime
                </div>
              </div>

              <div style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "1rem"
              }}>
                <button
                  onClick={handleRequestPayout}
                  disabled={requestingPayout || (affiliateData.available_balance || 0) < 50}
                  style={{
                    padding: "1.25rem 2rem",
                    background: "white",
                    color: "#10b981",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "1.1rem",
                    fontWeight: "700",
                    cursor: (requestingPayout || (affiliateData.available_balance || 0) < 50) ? "not-allowed" : "pointer",
                    opacity: (requestingPayout || (affiliateData.available_balance || 0) < 50) ? 0.6 : 1,
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    transition: "all 0.2s"
                  }}
                >
                  {requestingPayout ? "Processing..." : "💸 Request Payout"}
                </button>
                {(affiliateData.available_balance || 0) < 50 && (
                  <div style={{ fontSize: "0.85rem", opacity: 0.9, textAlign: "center" }}>
                    Minimum payout: R50
                  </div>
                )}
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "2rem",
              marginTop: "2rem",
              paddingTop: "2rem",
              borderTop: "1px solid rgba(255,255,255,0.2)"
            }}>
              <div>
                <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>Total Earned</div>
                <div style={{ fontSize: "1.75rem", fontWeight: "bold" }}>
                  R{(affiliateData.total_earned || 0).toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>Already Paid</div>
                <div style={{ fontSize: "1.75rem", fontWeight: "bold" }}>
                  R{(affiliateData.total_paid || 0).toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>Pending Request</div>
                <div style={{ fontSize: "1.75rem", fontWeight: "bold" }}>
                  R{(affiliateData.requested_payout || 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem"
        }}>
          <div style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>👥</div>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#667eea" }}>
              {referrals.length}
            </div>
            <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>Total Referrals</div>
            <div style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
              <span style={{ color: "#10b981" }}>✅ {activeReferrals.length} active</span>
              {churnedReferrals.length > 0 && (
                <span style={{ color: "#ef4444", marginLeft: "0.5rem" }}>
                  ⚠️ {churnedReferrals.length} churned
                </span>
              )}
            </div>
          </div>

          <div style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📈</div>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#10b981" }}>
              R{(activeReferrals.reduce((sum, r) => sum + parseFloat(r.total_commission_earned || 0), 0)).toFixed(2)}
            </div>
            <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>From Active Clients</div>
          </div>

          <div style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔗</div>
            <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#667eea", fontFamily: "monospace" }}>
              {affiliateData.referral_code}
            </div>
            <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>Your Referral Code</div>
          </div>
        </div>

        {/* Referral Link Card */}
        <div style={{
          background: "white",
          padding: "2rem",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          marginBottom: "2rem"
        }}>
          <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.25rem" }}>🔗 Your Referral Link</h2>
          <div style={{
            display: "flex",
            gap: "1rem",
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: "1.5rem"
          }}>
            <div style={{
              flex: 1,
              background: "#f9fafb",
              padding: "1rem",
              borderRadius: "8px",
              fontSize: "0.95rem",
              wordBreak: "break-all",
              border: "2px solid #e5e7eb",
              minWidth: "250px"
            }}>
              {referralLink}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(referralLink);
                alert("✅ Link copied to clipboard!");
              }}
              style={{
                padding: "1rem 2rem",
                background: "#667eea",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              📋 Copy Link
            </button>
          </div>

          {/* Share Buttons */}
          <div style={{ marginTop: "1rem", borderTop: "1px solid #e5e7eb", paddingTop: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#6b7280" }}>📢 Share your link:</h3>
            <div style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap"
            }}>
              <button
                onClick={() => {
                  const message = `🍽️ Start your food business online with Mzansi Food Connect!\n\n✅ Free Trial • Online Orders • Payments • Analytics\n\nSign up now: ${referralLink}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                }}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "#25D366",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                <span>💬</span> WhatsApp
              </button>

              <button
                onClick={() => {
                  const message = `🍽️ Start your food business online! ${referralLink}`;
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${encodeURIComponent(message)}`, '_blank');
                }}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "#1877F2",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                <span>📘</span> Facebook
              </button>

              <button
                onClick={() => {
                  const message = `🍽️ Start your food business online with Mzansi Food Connect! ${referralLink}`;
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`, '_blank');
                }}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "#000000",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                <span>𝕏</span> Twitter
              </button>

              <button
                onClick={() => {
                  const message = `🍽️ Start your food business online with Mzansi Food Connect!\n\nFree Trial • Online Orders • Payments • Analytics\n\nSign up: ${referralLink}`;
                  navigator.clipboard.writeText(message);
                  alert("✅ Message copied! Paste it anywhere (Instagram, TikTok, SMS, etc.)");
                }}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                <span>📱</span> More...
              </button>
            </div>
          </div>
        </div>

        {/* Resources & Downloads */}
        <div style={{
          background: "white",
          padding: "2rem",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          marginBottom: "2rem"
        }}>
          <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.25rem" }}>📚 Resources & Guides</h2>
          <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
            Download these guides to help you understand the platform and grow your affiliate business
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1rem"
          }}>
            {/* How Mzansi Works Guide */}
            <div style={{
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem"
            }}>
              <div style={{ fontSize: "2.5rem" }}>🍽️</div>
              <div>
                <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>
                  How Mzansi Food Connect Works
                </h3>
                <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>
                  Complete guide explaining our platform for food vendors. Perfect for sharing with prospects!
                </p>
              </div>
              <a
                href="/how-mzansi-works.md"
                download="How-Mzansi-Food-Connect-Works.md"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  background: "#667eea",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  textDecoration: "none",
                  cursor: "pointer"
                }}
              >
                <span>⬇️</span> Download Guide
              </a>
            </div>

            {/* Affiliate Program Guide */}
            <div style={{
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem"
            }}>
              <div style={{ fontSize: "2.5rem" }}>💰</div>
              <div>
                <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>
                  Affiliate Program Guide
                </h3>
                <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>
                  Everything you need to know about earning with our affiliate program. Tips, strategies & FAQs.
                </p>
              </div>
              <a
                href="/affiliate-program-guide.md"
                download="Mzansi-Affiliate-Program-Guide.md"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  textDecoration: "none",
                  cursor: "pointer"
                }}
              >
                <span>⬇️</span> Download Guide
              </a>
            </div>
          </div>

          <div style={{
            marginTop: "1.5rem",
            padding: "1rem",
            background: "#f0f9ff",
            border: "1px solid #bae6fd",
            borderRadius: "8px",
            fontSize: "0.9rem",
            color: "#0c4a6e"
          }}>
            💡 <strong>Tip:</strong> Share the "How Mzansi Works" guide with food vendors to help them understand the platform better. It makes your job easier!
          </div>
        </div>

        {/* Referrals List */}
        <div style={{
          background: "white",
          padding: "2rem",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          marginBottom: "2rem"
        }}>
          <h2 style={{ margin: "0 0 1.5rem 0", fontSize: "1.5rem" }}>
            💼 Your Clients ({referrals.length})
          </h2>

          {referrals.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "3rem 1rem",
              color: "#9ca3af"
            }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎯</div>
              <p style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                No referrals yet
              </p>
              <p>Start sharing your referral link to earn commissions!</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                    <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600" }}>Client</th>
                    <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600" }}>Plan</th>
                    <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600" }}>Status</th>
                    <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600" }}>Progress</th>
                    <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600" }}>Earned</th>
                    <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600" }}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((ref) => {
                    const statusConfig = {
                      active: { emoji: "✅", text: "Active", bg: "#d1fae5", color: "#065f46" },
                      pending: { emoji: "⏳", text: "Pending", bg: "#fef3c7", color: "#92400e" },
                      churned: { emoji: "⚠️", text: "Churned", bg: "#fee2e2", color: "#991b1b" },
                      cancelled: { emoji: "❌", text: "Cancelled", bg: "#f3f4f6", color: "#4b5563" }
                    };
                    const status = statusConfig[ref.status] || statusConfig.pending;

                    return (
                      <tr key={ref.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={{ padding: "1rem" }}>
                          <div style={{ fontWeight: "600" }}>{ref.store?.name || "Unknown"}</div>
                          <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                            {ref.store?.slug}.mzansifoodconnect.app
                          </div>
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <span style={{
                            padding: "0.25rem 0.75rem",
                            borderRadius: "999px",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            background: ref.plan === 'premium' ? "#ddd6fe" : "#dbeafe",
                            color: ref.plan === 'premium' ? "#5b21b6" : "#1e40af"
                          }}>
                            {ref.plan.charAt(0).toUpperCase() + ref.plan.slice(1)}
                          </span>
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <span style={{
                            padding: "0.35rem 0.85rem",
                            borderRadius: "999px",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            background: status.bg,
                            color: status.color
                          }}>
                            {status.emoji} {status.text}
                          </span>
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <div style={{ fontWeight: "600" }}>
                            {ref.commission_months_paid} / 12 months
                          </div>
                          <div style={{
                            width: "100px",
                            height: "8px",
                            background: "#e5e7eb",
                            borderRadius: "4px",
                            overflow: "hidden",
                            marginTop: "0.25rem"
                          }}>
                            <div style={{
                              width: `${(ref.commission_months_paid / 12) * 100}%`,
                              height: "100%",
                              background: "#10b981",
                              borderRadius: "4px"
                            }}></div>
                          </div>
                        </td>
                        <td style={{ padding: "1rem", fontWeight: "700", color: "#10b981", fontSize: "1.1rem" }}>
                          R{(ref.total_commission_earned || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: "1rem", fontSize: "0.9rem", color: "#6b7280" }}>
                          {new Date(ref.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payout History */}
        <div style={{
          background: "white",
          padding: "2rem",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <h2 style={{ margin: "0 0 1.5rem 0", fontSize: "1.5rem" }}>
            💳 Payout History
          </h2>

          {payouts.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "2rem 1rem",
              color: "#9ca3af"
            }}>
              <p>No payouts yet. Request your first payout when ready!</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                    <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600" }}>Date</th>
                    <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600" }}>Amount</th>
                    <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600" }}>Status</th>
                    <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600" }}>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout) => {
                    const statusConfig = {
                      requested: { bg: "#fef3c7", color: "#92400e", emoji: "⏳" },
                      processing: { bg: "#dbeafe", color: "#1e40af", emoji: "⚙️" },
                      paid: { bg: "#d1fae5", color: "#065f46", emoji: "✅" },
                      failed: { bg: "#fee2e2", color: "#991b1b", emoji: "❌" }
                    };
                    const config = statusConfig[payout.status] || statusConfig.requested;

                    return (
                      <tr key={payout.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={{ padding: "1rem" }}>
                          {new Date(payout.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "1rem", fontWeight: "700", color: "#10b981", fontSize: "1.1rem" }}>
                          R{payout.amount.toFixed(2)}
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <span style={{
                            padding: "0.35rem 0.85rem",
                            borderRadius: "999px",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            background: config.bg,
                            color: config.color
                          }}>
                            {config.emoji} {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                          </span>
                        </td>
                        <td style={{ padding: "1rem", fontSize: "0.9rem", color: "#6b7280", fontFamily: "monospace" }}>
                          {payout.payment_reference || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
