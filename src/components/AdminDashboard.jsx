// Admin Dashboard - Platform Analytics
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import "./AdminDashboard.css";

export default function AdminDashboard({ onLogout }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClients: 0,
    trialClients: 0,
    proClients: 0,
    premiumClients: 0,
    activeClients: 0,
    inactiveClients: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    revenueByPlan: {
      trial: 0,
      pro: 0,
      premium: 0
    },
    recentSignups: [],
    // Affiliate stats
    totalAffiliates: 0,
    activeAffiliates: 0,
    totalReferrals: 0,
    affiliatesTotalEarned: 0,
    affiliatesTotalPaid: 0,
    affiliatesPendingPayout: 0,
    recentAffiliates: [],
    pendingPayoutRequests: []
  });

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);

      // Get all tenants/clients
      const { data: tenants, error: tenantsError } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });

      if (tenantsError) throw tenantsError;

      // Calculate stats
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const totalClients = tenants.length;
      const trialClients = tenants.filter(t => t.plan === "trial" || !t.plan).length;
      const proClients = tenants.filter(t => t.plan === "pro").length;
      const premiumClients = tenants.filter(t => t.plan === "premium").length;

      // Active = plan is active (not expired)
      const activeClients = tenants.filter(t => {
        if (!t.plan_expires_at) return t.plan === "trial" || !t.plan; // Trial never expires
        return new Date(t.plan_expires_at) > now;
      }).length;
      const inactiveClients = totalClients - activeClients;

      // Calculate revenue
      // Pro = R159/month, Premium = R215/month
      // Count only active paid clients
      const activePro = tenants.filter(t =>
        t.plan === "pro" &&
        t.plan_expires_at &&
        new Date(t.plan_expires_at) > now
      ).length;

      const activePremium = tenants.filter(t =>
        t.plan === "premium" &&
        t.plan_expires_at &&
        new Date(t.plan_expires_at) > now
      ).length;

      const proRevenue = activePro * 159; // R159 per pro client
      const premiumRevenue = activePremium * 215; // R215 per premium client
      const totalRevenue = proRevenue + premiumRevenue;

      // Monthly revenue (clients who signed up this month)
      const monthlySignups = tenants.filter(t => {
        const signupDate = new Date(t.created_at);
        return signupDate.getMonth() === currentMonth &&
               signupDate.getFullYear() === currentYear;
      });

      const monthlyPro = monthlySignups.filter(t =>
        t.plan === "pro" &&
        t.plan_expires_at &&
        new Date(t.plan_expires_at) > now
      ).length;

      const monthlyPremium = monthlySignups.filter(t =>
        t.plan === "premium" &&
        t.plan_expires_at &&
        new Date(t.plan_expires_at) > now
      ).length;

      const monthlyRevenue = (monthlyPro * 159) + (monthlyPremium * 215);

      // Get recent signups (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentSignups = tenants
        .filter(t => new Date(t.created_at) >= thirtyDaysAgo)
        .map(t => ({
          date: new Date(t.created_at).toLocaleDateString("en-ZA"),
          storeName: t.name,
          plan: t.plan || "trial",
          email: t.owner_email || "N/A"
        }));

      // Fetch affiliate stats
      let affiliateStats = {
        totalAffiliates: 0,
        activeAffiliates: 0,
        totalReferrals: 0,
        affiliatesTotalEarned: 0,
        affiliatesTotalPaid: 0,
        affiliatesPendingPayout: 0,
        recentAffiliates: [],
        pendingPayoutRequests: []
      };

      try {
        // Get all affiliates
        const { data: affiliates, error: affiliatesError } = await supabase
          .from("affiliates")
          .select("*")
          .order("created_at", { ascending: false });

        if (!affiliatesError && affiliates) {
          affiliateStats.totalAffiliates = affiliates.length;
          affiliateStats.activeAffiliates = affiliates.filter(a => a.status === 'active').length;
          affiliateStats.affiliatesTotalEarned = affiliates.reduce((sum, a) => sum + parseFloat(a.total_earned || 0), 0);
          affiliateStats.affiliatesTotalPaid = affiliates.reduce((sum, a) => sum + parseFloat(a.total_paid || 0), 0);
          affiliateStats.affiliatesPendingPayout = affiliates.reduce((sum, a) => sum + parseFloat(a.available_balance || 0), 0);

          // Recent affiliates (last 30 days)
          affiliateStats.recentAffiliates = affiliates
            .filter(a => new Date(a.created_at) >= thirtyDaysAgo)
            .slice(0, 10)
            .map(a => ({
              date: new Date(a.created_at).toLocaleDateString("en-ZA"),
              name: a.full_name,
              email: a.email,
              referralCode: a.referral_code,
              totalReferrals: a.total_referrals
            }));
        }

        // Get all referrals
        const { data: referrals, error: referralsError } = await supabase
          .from("referrals")
          .select("*");

        if (!referralsError && referrals) {
          affiliateStats.totalReferrals = referrals.length;
        }

        // Get pending payout requests
        const { data: payouts, error: payoutsError } = await supabase
          .from("commission_payouts")
          .select(`
            *,
            affiliate:affiliates(full_name, email, bank_name, account_number)
          `)
          .eq("status", "requested")
          .order("created_at", { ascending: false })
          .limit(10);

        if (!payoutsError && payouts) {
          affiliateStats.pendingPayoutRequests = payouts.map(p => ({
            id: p.id,
            affiliateName: p.affiliate?.full_name || "Unknown",
            affiliateEmail: p.affiliate?.email || "N/A",
            amount: p.amount,
            date: new Date(p.created_at).toLocaleDateString("en-ZA"),
            bankName: p.affiliate?.bank_name,
            accountNumber: p.affiliate?.account_number
          }));
        }
      } catch (error) {
        console.error("Error fetching affiliate stats:", error);
        // Continue with empty affiliate stats
      }

      setStats({
        totalClients,
        trialClients,
        proClients,
        premiumClients,
        activeClients,
        inactiveClients,
        totalRevenue,
        monthlyRevenue,
        revenueByPlan: {
          trial: 0, // Trial is free
          pro: proRevenue,
          premium: premiumRevenue
        },
        recentSignups,
        ...affiliateStats
      });

    } catch (error) {
      console.error("Error fetching admin stats:", error);
      alert("Failed to load admin stats");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-loading">
          <div className="spinner"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1>👑 Platform Admin Dashboard</h1>
          <p>Mzansi Food Connect - Platform Analytics</p>
        </div>
        <button className="admin-logout-btn" onClick={onLogout}>
          🚪 Logout
        </button>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats-grid">
        {/* Total Clients */}
        <div className="admin-stat-card total-clients">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Clients</h3>
            <p className="stat-number">{stats.totalClients}</p>
            <span className="stat-label">All registered stores</span>
          </div>
        </div>

        {/* Active Clients */}
        <div className="admin-stat-card active-clients">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Active Clients</h3>
            <p className="stat-number">{stats.activeClients}</p>
            <span className="stat-label">With active subscriptions</span>
          </div>
        </div>

        {/* Inactive Clients */}
        <div className="admin-stat-card inactive-clients">
          <div className="stat-icon">💤</div>
          <div className="stat-content">
            <h3>Inactive Clients</h3>
            <p className="stat-number">{stats.inactiveClients}</p>
            <span className="stat-label">Expired or trial</span>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="admin-stat-card monthly-revenue">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Monthly Revenue</h3>
            <p className="stat-number">R{stats.monthlyRevenue}</p>
            <span className="stat-label">This month's earnings</span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="admin-stat-card total-revenue">
          <div className="stat-icon">💎</div>
          <div className="stat-content">
            <h3>Total Revenue</h3>
            <p className="stat-number">R{stats.totalRevenue}</p>
            <span className="stat-label">All active subscriptions</span>
          </div>
        </div>

        {/* Total Affiliates */}
        <div className="admin-stat-card affiliates-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Total Affiliates</h3>
            <p className="stat-number">{stats.totalAffiliates}</p>
            <span className="stat-label">{stats.activeAffiliates} active</span>
          </div>
        </div>

        {/* Total Referrals */}
        <div className="admin-stat-card referrals-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>Total Referrals</h3>
            <p className="stat-number">{stats.totalReferrals}</p>
            <span className="stat-label">From affiliates</span>
          </div>
        </div>

        {/* Affiliate Payouts Pending */}
        <div className="admin-stat-card pending-payouts-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Pending Payouts</h3>
            <p className="stat-number">R{stats.affiliatesPendingPayout.toFixed(2)}</p>
            <span className="stat-label">{stats.pendingPayoutRequests.length} requests</span>
          </div>
        </div>
      </div>

      {/* Plans Breakdown */}
      <div className="admin-section">
        <h2>📊 Clients by Plan</h2>
        <div className="plans-grid">
          <div className="plan-card trial-plan">
            <div className="plan-header">
              <h3>🆓 Trial Plan</h3>
              <span className="plan-price">FREE</span>
            </div>
            <p className="plan-count">{stats.trialClients} clients</p>
            <div className="plan-percentage">
              {((stats.trialClients / stats.totalClients) * 100).toFixed(1)}% of total
            </div>
          </div>

          <div className="plan-card pro-plan">
            <div className="plan-header">
              <h3>🚀 Pro Plan</h3>
              <span className="plan-price">R159/mo</span>
            </div>
            <p className="plan-count">{stats.proClients} clients</p>
            <div className="plan-percentage">
              {((stats.proClients / stats.totalClients) * 100).toFixed(1)}% of total
            </div>
            <div className="plan-revenue">
              Revenue: R{stats.revenueByPlan.pro}/mo
            </div>
          </div>

          <div className="plan-card premium-plan">
            <div className="plan-header">
              <h3>👑 Premium Plan</h3>
              <span className="plan-price">R215/mo</span>
            </div>
            <p className="plan-count">{stats.premiumClients} clients</p>
            <div className="plan-percentage">
              {((stats.premiumClients / stats.totalClients) * 100).toFixed(1)}% of total
            </div>
            <div className="plan-revenue">
              Revenue: R{stats.revenueByPlan.premium}/mo
            </div>
          </div>
        </div>
      </div>

      {/* Recent Signups */}
      <div className="admin-section">
        <h2>📈 Recent Signups (Last 30 Days)</h2>
        {stats.recentSignups.length === 0 ? (
          <p className="no-data">No signups in the last 30 days</p>
        ) : (
          <div className="signups-table-container">
            <table className="signups-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Store Name</th>
                  <th>Plan</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentSignups.map((signup, idx) => (
                  <tr key={idx}>
                    <td>{signup.date}</td>
                    <td>{signup.storeName}</td>
                    <td>
                      <span className={`plan-badge ${signup.plan}`}>
                        {signup.plan.toUpperCase()}
                      </span>
                    </td>
                    <td>{signup.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Affiliate Program Section */}
      <div className="admin-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2>💰 Affiliate Program</h2>
          <a href="/admin-dashboard" style={{
            padding: "0.75rem 1.5rem",
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "white",
            textDecoration: "none",
            borderRadius: "8px",
            fontWeight: "600"
          }}>
            Open Full Affiliate Dashboard →
          </a>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem"
        }}>
          <div style={{ background: "#f0fdf4", padding: "1.5rem", borderRadius: "8px", border: "2px solid #10b981" }}>
            <div style={{ fontSize: "0.9rem", color: "#065f46", marginBottom: "0.5rem" }}>Total Earned</div>
            <div style={{ fontSize: "1.75rem", fontWeight: "bold", color: "#059669" }}>
              R{stats.affiliatesTotalEarned.toFixed(2)}
            </div>
          </div>
          <div style={{ background: "#ecfdf5", padding: "1.5rem", borderRadius: "8px", border: "2px solid #059669" }}>
            <div style={{ fontSize: "0.9rem", color: "#065f46", marginBottom: "0.5rem" }}>Total Paid</div>
            <div style={{ fontSize: "1.75rem", fontWeight: "bold", color: "#047857" }}>
              R{stats.affiliatesTotalPaid.toFixed(2)}
            </div>
          </div>
          <div style={{ background: "#fef3c7", padding: "1.5rem", borderRadius: "8px", border: "2px solid #f59e0b" }}>
            <div style={{ fontSize: "0.9rem", color: "#92400e", marginBottom: "0.5rem" }}>Available to Payout</div>
            <div style={{ fontSize: "1.75rem", fontWeight: "bold", color: "#d97706" }}>
              R{stats.affiliatesPendingPayout.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Pending Payout Requests */}
        {stats.pendingPayoutRequests.length > 0 && (
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ marginBottom: "1rem", color: "#dc2626" }}>⚠️ Pending Payout Requests ({stats.pendingPayoutRequests.length})</h3>
            <div className="signups-table-container">
              <table className="signups-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Affiliate</th>
                    <th>Amount</th>
                    <th>Bank Details</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.pendingPayoutRequests.map((payout) => (
                    <tr key={payout.id} style={{ background: "#fef3c7" }}>
                      <td>{payout.date}</td>
                      <td style={{ fontWeight: "600" }}>{payout.affiliateName}</td>
                      <td style={{ fontWeight: "700", color: "#10b981", fontSize: "1.1rem" }}>
                        R{payout.amount.toFixed(2)}
                      </td>
                      <td>
                        <div style={{ fontSize: "0.85rem" }}>
                          <div><strong>{payout.bankName}</strong></div>
                          <div style={{ fontFamily: "monospace" }}>{payout.accountNumber}</div>
                        </div>
                      </td>
                      <td style={{ fontSize: "0.85rem" }}>{payout.affiliateEmail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Affiliate Signups */}
        <h3 style={{ marginBottom: "1rem" }}>📈 Recent Affiliate Signups (Last 30 Days)</h3>
        {stats.recentAffiliates.length === 0 ? (
          <p className="no-data">No new affiliates in the last 30 days</p>
        ) : (
          <div className="signups-table-container">
            <table className="signups-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Referral Code</th>
                  <th>Referrals</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentAffiliates.map((affiliate, idx) => (
                  <tr key={idx}>
                    <td>{affiliate.date}</td>
                    <td>{affiliate.name}</td>
                    <td>{affiliate.email}</td>
                    <td>
                      <span style={{
                        fontFamily: "monospace",
                        fontWeight: "bold",
                        background: "#e0e7ff",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px"
                      }}>
                        {affiliate.referralCode}
                      </span>
                    </td>
                    <td style={{ fontWeight: "600" }}>{affiliate.totalReferrals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div className="admin-actions">
        <button className="refresh-btn" onClick={fetchAdminStats}>
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
}
