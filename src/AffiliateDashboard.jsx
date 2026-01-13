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
  const [requestingPayout, setRequestingPayout] = useState(false);

  useEffect(() => {
    const storedEmail = localStorage.getItem('affiliateEmail');
    if (storedEmail) {
      setEmail(storedEmail);
      loadDashboard(storedEmail);
    } else {
      setLoading(false);
    }
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError("");
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("affiliates")
        .select("*")
        .eq("email", email.toLowerCase())
        .single();

      if (error || !data) {
        throw new Error("No affiliate account found with this email");
      }

      localStorage.setItem('affiliateEmail', email.toLowerCase());
      setShowLogin(false);
      await loadDashboard(email.toLowerCase());

    } catch (err) {
      setLoginError(err.message);
      setLoading(false);
    }
  }

  async function loadDashboard(affiliateEmail) {
    try {
      const { data: affiliate, error: affiliateError } = await supabase
        .from("affiliates")
        .select("*")
        .eq("email", affiliateEmail)
        .single();

      if (affiliateError) throw affiliateError;

      setAffiliateData(affiliate);

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

    if (!amount || isNaN(amount)) {
      return;
    }

    if (amount > affiliateData.available_balance) {
      alert("❌ Amount exceeds available balance");
      return;
    }

    if (amount < 50) {
      alert("❌ Minimum payout amount is R50");
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

      // Reload dashboard
      await loadDashboard(affiliateData.email);

    } catch (err) {
      alert("❌ Error: " + err.message);
    } finally {
      setRequestingPayout(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('affiliateEmail');
    setShowLogin(true);
    setAffiliateData(null);
    setReferrals([]);
    setPayouts([]);
  }

  // Login screen
  if (showLogin && !affiliateData) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem"
      }}>
        <div style={{
          background: "white",
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          maxWidth: "450px",
          width: "100%",
          padding: "3rem"
        }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>💰</div>
            <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "2rem", color: "#1f2937" }}>
              Affiliate Dashboard
            </h1>
            <p style={{ color: "#6b7280", margin: 0 }}>
              Sign in to view your earnings
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "600",
                color: "#374151"
              }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.875rem",
                  border: "2px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  transition: "all 0.2s"
                }}
              />
            </div>

            {loginError && (
              <div style={{
                background: "#fef2f2",
                border: "1px solid #ef4444",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1rem",
                color: "#991b1b"
              }}>
                ⚠️ {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "1rem",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? "Loading..." : "Sign In"}
            </button>
          </form>

          <div style={{
            marginTop: "2rem",
            paddingTop: "2rem",
            borderTop: "1px solid #e5e7eb",
            textAlign: "center"
          }}>
            <p style={{ color: "#6b7280", fontSize: "0.9rem", margin: 0 }}>
              Not an affiliate yet?{" "}
              <a href="/become-affiliate" style={{ color: "#667eea", fontWeight: "600" }}>
                Sign Up Here
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{ textAlign: "center", color: "white" }}>
          <div className="spinner" style={{ borderColor: "white", borderTopColor: "transparent" }}></div>
          <p style={{ marginTop: "1rem" }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!affiliateData) {
    return null;
  }

  const referralLink = `${window.location.origin}/signup?ref=${affiliateData.referral_code}`;
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
        {/* Main Balance Card - Super Prominent */}
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
            flexWrap: "wrap"
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
