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
    recentSignups: []
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
      // Pro = R3/month, Premium = R4/month (testing prices)
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

      const proRevenue = activePro * 3; // R3 per pro client
      const premiumRevenue = activePremium * 4; // R4 per premium client
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

      const monthlyRevenue = (monthlyPro * 3) + (monthlyPremium * 4);

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
        recentSignups
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
              <span className="plan-price">R3/mo</span>
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
              <span className="plan-price">R4/mo</span>
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

      {/* Refresh Button */}
      <div className="admin-actions">
        <button className="refresh-btn" onClick={fetchAdminStats}>
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
}
