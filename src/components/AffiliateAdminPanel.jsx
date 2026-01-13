import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

/**
 * Affiliate Admin Panel
 * Manage affiliates, view referrals, and process payouts
 */
export default function AffiliateAdminPanel() {
  const [affiliates, setAffiliates] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [pendingPayouts, setPendingPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // overview, affiliates, referrals, payouts

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Load all affiliates
      const { data: affiliatesData } = await supabase
        .from("affiliates")
        .select("*")
        .order("created_at", { ascending: false });

      setAffiliates(affiliatesData || []);

      // Load all referrals with store data
      const { data: referralsData } = await supabase
        .from("referrals")
        .select(`
          *,
          affiliate:affiliates(full_name, email, referral_code),
          store:tenants(name, slug, plan)
        `)
        .order("created_at", { ascending: false });

      setReferrals(referralsData || []);

      // Load pending payouts
      const { data: payoutsData } = await supabase
        .from("commission_payouts")
        .select(`
          *,
          affiliate:affiliates(full_name, email)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      setPendingPayouts(payoutsData || []);

    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function markPayoutAsPaid(payoutId, reference) {
    try {
      const { error } = await supabase
        .from("commission_payouts")
        .update({
          status: "paid",
          payment_date: new Date().toISOString(),
          payment_reference: reference
        })
        .eq("id", payoutId);

      if (error) throw error;

      alert("✅ Payout marked as paid!");
      loadData();
    } catch (err) {
      alert("❌ Error: " + err.message);
    }
  }

  async function generateMonthlyPayouts() {
    try {
      // Get all active referrals that haven't reached 12 months yet
      const { data: activeReferrals } = await supabase
        .from("referrals")
        .select("*")
        .eq("status", "active")
        .lt("commission_months_paid", 12);

      if (!activeReferrals || activeReferrals.length === 0) {
        alert("No active referrals to process");
        return;
      }

      const currentMonth = new Date().toISOString().substring(0, 7) + "-01"; // YYYY-MM-01

      // Calculate commissions
      const payouts = [];
      for (const referral of activeReferrals) {
        const planPrices = { pro: 159, premium: 215 };
        const monthlyPrice = planPrices[referral.plan] || 0;
        const commission = monthlyPrice * (referral.commission_rate / 100);

        payouts.push({
          affiliate_id: referral.affiliate_id,
          referral_id: referral.id,
          amount: commission,
          month_for: currentMonth,
          status: "pending"
        });
      }

      // Insert payouts
      const { error } = await supabase
        .from("commission_payouts")
        .insert(payouts);

      if (error) throw error;

      alert(`✅ Generated ${payouts.length} payouts for this month!`);
      loadData();
    } catch (err) {
      alert("❌ Error: " + err.message);
    }
  }

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>;
  }

  const totalAffiliates = affiliates.length;
  const activeAffiliates = affiliates.filter(a => a.status === "active").length;
  const totalReferrals = referrals.length;
  const activeReferrals = referrals.filter(r => r.status === "active").length;
  const totalEarned = affiliates.reduce((sum, a) => sum + parseFloat(a.total_earned || 0), 0);
  const totalPaid = affiliates.reduce((sum, a) => sum + parseFloat(a.total_paid || 0), 0);
  const totalPending = affiliates.reduce((sum, a) => sum + parseFloat(a.pending_payout || 0), 0);

  return (
    <div style={{ padding: "2rem", background: "#f9fafb", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <h1 style={{ marginBottom: "2rem" }}>Affiliate Program Admin</h1>

        {/* Tabs */}
        <div style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "2rem",
          borderBottom: "2px solid #e5e7eb"
        }}>
          {["overview", "affiliates", "referrals", "payouts"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "0.75rem 1.5rem",
                background: activeTab === tab ? "#667eea" : "transparent",
                color: activeTab === tab ? "white" : "#4b5563",
                border: "none",
                borderBottom: activeTab === tab ? "3px solid #667eea" : "none",
                cursor: "pointer",
                fontWeight: "600",
                textTransform: "capitalize"
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div>
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
                <div style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "0.5rem" }}>
                  Total Affiliates
                </div>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#667eea" }}>
                  {totalAffiliates}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#10b981", marginTop: "0.5rem" }}>
                  {activeAffiliates} active
                </div>
              </div>

              <div style={{
                background: "white",
                padding: "1.5rem",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
              }}>
                <div style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "0.5rem" }}>
                  Total Referrals
                </div>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#10b981" }}>
                  {totalReferrals}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#10b981", marginTop: "0.5rem" }}>
                  {activeReferrals} active
                </div>
              </div>

              <div style={{
                background: "white",
                padding: "1.5rem",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
              }}>
                <div style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "0.5rem" }}>
                  Total Earned
                </div>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#f59e0b" }}>
                  R{totalEarned.toFixed(2)}
                </div>
              </div>

              <div style={{
                background: "white",
                padding: "1.5rem",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
              }}>
                <div style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "0.5rem" }}>
                  Total Paid Out
                </div>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#059669" }}>
                  R{totalPaid.toFixed(2)}
                </div>
              </div>

              <div style={{
                background: "white",
                padding: "1.5rem",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
              }}>
                <div style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "0.5rem" }}>
                  Pending Payouts
                </div>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#ef4444" }}>
                  R{totalPending.toFixed(2)}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.5rem" }}>
                  {pendingPayouts.length} pending
                </div>
              </div>
            </div>

            <div style={{
              background: "white",
              padding: "2rem",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>
              <h2 style={{ marginBottom: "1rem" }}>Actions</h2>
              <button
                onClick={generateMonthlyPayouts}
                style={{
                  padding: "1rem 2rem",
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Generate Monthly Payouts
              </button>
              <p style={{ marginTop: "1rem", color: "#6b7280", fontSize: "0.9rem" }}>
                This will create payout records for all active referrals for the current month.
              </p>
            </div>
          </div>
        )}

        {/* Affiliates Tab */}
        {activeTab === "affiliates" && (
          <div style={{
            background: "white",
            padding: "2rem",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}>
            <h2 style={{ marginBottom: "1.5rem" }}>All Affiliates</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                    <th style={{ padding: "1rem", textAlign: "left" }}>Name</th>
                    <th style={{ padding: "1rem", textAlign: "left" }}>Email</th>
                    <th style={{ padding: "1rem", textAlign: "left" }}>Code</th>
                    <th style={{ padding: "1rem", textAlign: "left" }}>Referrals</th>
                    <th style={{ padding: "1rem", textAlign: "left" }}>Earned</th>
                    <th style={{ padding: "1rem", textAlign: "left" }}>Paid</th>
                    <th style={{ padding: "1rem", textAlign: "left" }}>Bank</th>
                  </tr>
                </thead>
                <tbody>
                  {affiliates.map((affiliate) => (
                    <tr key={affiliate.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "1rem" }}>{affiliate.full_name}</td>
                      <td style={{ padding: "1rem", fontSize: "0.9rem" }}>{affiliate.email}</td>
                      <td style={{ padding: "1rem", fontFamily: "monospace", fontWeight: "bold" }}>
                        {affiliate.referral_code}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        {affiliate.active_referrals} / {affiliate.total_referrals}
                      </td>
                      <td style={{ padding: "1rem", color: "#10b981", fontWeight: "600" }}>
                        R{affiliate.total_earned.toFixed(2)}
                      </td>
                      <td style={{ padding: "1rem" }}>R{affiliate.total_paid.toFixed(2)}</td>
                      <td style={{ padding: "1rem", fontSize: "0.85rem" }}>
                        {affiliate.bank_name}<br />
                        {affiliate.account_number}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Referrals Tab */}
        {activeTab === "referrals" && (
          <div style={{
            background: "white",
            padding: "2rem",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}>
            <h2 style={{ marginBottom: "1.5rem" }}>All Referrals</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                    <th style={{ padding: "1rem", textAlign: "left" }}>Affiliate</th>
                    <th style={{ padding: "1rem", textAlign: "left" }}>Store</th>
                    <th style={{ padding: "1rem", textAlign: "left" }}>Plan</th>
                    <th style={{ padding: "1rem", textAlign: "left" }}>Status</th>
                    <th style={{ padding: "1rem", textAlign: "left" }}>Months Paid</th>
                    <th style={{ padding: "1rem", textAlign: "left" }}>Total Earned</th>
                    <th style={{ padding: "1rem", textAlign: "left" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((ref) => (
                    <tr key={ref.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "1rem", fontSize: "0.9rem" }}>
                        {ref.affiliate?.full_name}<br />
                        <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                          {ref.affiliate?.referral_code}
                        </span>
                      </td>
                      <td style={{ padding: "1rem" }}>{ref.store?.name || "Unknown"}</td>
                      <td style={{ padding: "1rem", textTransform: "capitalize" }}>
                        {ref.plan}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span style={{
                          padding: "0.25rem 0.75rem",
                          borderRadius: "999px",
                          fontSize: "0.85rem",
                          background: ref.status === "active" ? "#d1fae5" : "#fef3c7",
                          color: ref.status === "active" ? "#065f46" : "#92400e"
                        }}>
                          {ref.status}
                        </span>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        {ref.commission_months_paid} / 12
                      </td>
                      <td style={{ padding: "1rem", color: "#10b981", fontWeight: "600" }}>
                        R{ref.total_commission_earned.toFixed(2)}
                      </td>
                      <td style={{ padding: "1rem", fontSize: "0.85rem", color: "#6b7280" }}>
                        {new Date(ref.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payouts Tab */}
        {activeTab === "payouts" && (
          <div style={{
            background: "white",
            padding: "2rem",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}>
            <h2 style={{ marginBottom: "1.5rem" }}>Pending Payouts</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                    <th style={{ padding: "1rem", textAlign: "left" }}>Affiliate</th>
                    <th style={{ padding: "1rem", textAlign: "left" }}>Amount</th>
                    <th style={{ padding: "1rem", textAlign: "left" }}>Month For</th>
                    <th style={{ padding: "1rem", textAlign: "left" }}>Status</th>
                    <th style={{ padding: "1rem", textAlign: "left" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPayouts.map((payout) => (
                    <tr key={payout.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "1rem" }}>
                        {payout.affiliate?.full_name}<br />
                        <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                          {payout.affiliate?.email}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", fontWeight: "bold", color: "#10b981" }}>
                        R{payout.amount.toFixed(2)}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        {new Date(payout.month_for).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long' })}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span style={{
                          padding: "0.25rem 0.75rem",
                          borderRadius: "999px",
                          fontSize: "0.85rem",
                          background: "#fef3c7",
                          color: "#92400e"
                        }}>
                          {payout.status}
                        </span>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <button
                          onClick={() => {
                            const ref = prompt("Enter payment reference/transaction ID:");
                            if (ref) markPayoutAsPaid(payout.id, ref);
                          }}
                          style={{
                            padding: "0.5rem 1rem",
                            background: "#10b981",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.9rem"
                          }}
                        >
                          Mark as Paid
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
