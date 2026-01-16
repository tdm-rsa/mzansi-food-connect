// PRO ANALYTICS - Pro Plan Only
// Shows: Daily, Weekly, Monthly Revenue + Total Orders
// Basic numbers only, no advanced charts
// Navigation to view previous days, weeks, months

import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function ProAnalytics({ storeInfo, onBack, darkMode }) {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("overview"); // overview, daily, weekly, monthly

  // Stats
  const [dailyAverage, setDailyAverage] = useState(0);
  const [weeklyAverage, setWeeklyAverage] = useState(0);
  const [monthlyAverage, setMonthlyAverage] = useState(0);

  // Current period stats
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);
  const [weekRevenue, setWeekRevenue] = useState(0);
  const [weekOrders, setWeekOrders] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [monthOrders, setMonthOrders] = useState(0);

  // Historical data
  const [historicalDays, setHistoricalDays] = useState([]);
  const [historicalWeeks, setHistoricalWeeks] = useState([]);
  const [historicalMonths, setHistoricalMonths] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, [storeInfo]);

  async function loadAnalytics() {
    if (!storeInfo?.id) return;
    setLoading(true);

    try {
      // Fetch ALL orders to debug status values
      const { data: orders, error } = await supabase
        .from("orders")
        .select("total, created_at, status")
        .eq("store_id", storeInfo.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (orders && orders.length > 0) {

        orders.forEach((o, idx) => {
          
        });

        // Accept ALL orders (don't filter by status)
        const validOrders = orders;
        
        calculateStats(validOrders);
      }
    } catch (err) {
      
    }

    setLoading(false);
  }

  function calculateStats(orders) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Today's stats
    const todayOrders = orders.filter(o => new Date(o.created_at) >= today);
    setTodayRevenue(todayOrders.reduce((sum, o) => sum + (o.total || 0), 0));
    setTodayOrders(todayOrders.length);

    // This week's stats
    const weekOrders = orders.filter(o => new Date(o.created_at) >= weekStart);
    setWeekRevenue(weekOrders.reduce((sum, o) => sum + (o.total || 0), 0));
    setWeekOrders(weekOrders.length);

    // This month's stats
    const monthOrders = orders.filter(o => new Date(o.created_at) >= monthStart);
    setMonthRevenue(monthOrders.reduce((sum, o) => sum + (o.total || 0), 0));
    setMonthOrders(monthOrders.length);

    // Calculate averages and historical data
    calculateHistoricalData(orders);
  }

  function calculateHistoricalData(orders) {
    // Group by day
    const dailyMap = {};
    const weeklyMap = {};
    const monthlyMap = {};

    orders.forEach(order => {
      const date = new Date(order.created_at);
      const dayKey = date.toISOString().split('T')[0];
      const weekKey = getWeekKey(date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      // Daily
      if (!dailyMap[dayKey]) dailyMap[dayKey] = { revenue: 0, orders: 0, date: dayKey };
      dailyMap[dayKey].revenue += order.total || 0;
      dailyMap[dayKey].orders += 1;

      // Weekly
      if (!weeklyMap[weekKey]) weeklyMap[weekKey] = { revenue: 0, orders: 0, week: weekKey };
      weeklyMap[weekKey].revenue += order.total || 0;
      weeklyMap[weekKey].orders += 1;

      // Monthly
      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { revenue: 0, orders: 0, month: monthKey };
      monthlyMap[monthKey].revenue += order.total || 0;
      monthlyMap[monthKey].orders += 1;
    });

    const dailyData = Object.values(dailyMap).sort((a, b) => b.date.localeCompare(a.date));
    const weeklyData = Object.values(weeklyMap).sort((a, b) => b.week.localeCompare(a.week));
    const monthlyData = Object.values(monthlyMap).sort((a, b) => b.month.localeCompare(a.month));

    setHistoricalDays(dailyData);
    setHistoricalWeeks(weeklyData);
    setHistoricalMonths(monthlyData);

    // Calculate averages
    if (dailyData.length > 0) {
      const avgDaily = dailyData.reduce((sum, d) => sum + d.revenue, 0) / dailyData.length;
      setDailyAverage(avgDaily);
    }
    if (weeklyData.length > 0) {
      const avgWeekly = weeklyData.reduce((sum, w) => sum + w.revenue, 0) / weeklyData.length;
      setWeeklyAverage(avgWeekly);
    }
    if (monthlyData.length > 0) {
      const avgMonthly = monthlyData.reduce((sum, m) => sum + m.revenue, 0) / monthlyData.length;
      setMonthlyAverage(avgMonthly);
    }
  }

  function getWeekKey(date) {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
  }

  if (loading) {
    return (
      <div className="template-view">
        <div className="view-header">
          <button onClick={onBack}>← Back</button>
          <h2>📊 Pro Analytics</h2>
        </div>
        <div style={{ textAlign: "center", padding: "3rem", color: darkMode ? "#cbd5e1" : "#666" }}>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="template-view">
      <div className="view-header">
        <button onClick={onBack}>← Back</button>
        <h2 style={{ color: darkMode ? "#ffffff" : "#000" }}>📊 Pro Analytics</h2>
        <p style={{ color: darkMode ? "#cbd5e1" : "#000" }}>Revenue tracking with historical data</p>
      </div>

      {/* Pro Plan Banner */}
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        padding: "1.5rem",
        borderRadius: "12px",
        marginBottom: "2rem"
      }}>
        <h3 style={{ color: "white", marginBottom: "0.5rem" }}>🚀 Pro Analytics</h3>
        <p style={{ opacity: 0.9, marginBottom: "0", fontSize: "0.95rem" }}>
          Track daily, weekly & monthly performance. Upgrade to Premium for charts & insights!
        </p>
      </div>

      {/* Averages Row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "1rem",
        marginBottom: "2rem",
        padding: "1.5rem",
        background: darkMode ? "rgba(255, 255, 255, 0.1)" : "#fff",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <div>
          <h4 style={{ color: darkMode ? "#ffffff" : "#000", fontSize: "0.9rem", marginBottom: "0.5rem" }}>📊 Daily Average</h4>
          <p style={{ fontSize: "1.5rem", fontWeight: "700", color: "#ff6b35", margin: 0 }}>
            R{dailyAverage.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div>
          <h4 style={{ color: darkMode ? "#ffffff" : "#000", fontSize: "0.9rem", marginBottom: "0.5rem" }}>📊 Weekly Average</h4>
          <p style={{ fontSize: "1.5rem", fontWeight: "700", color: "#667eea", margin: 0 }}>
            R{weeklyAverage.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div>
          <h4 style={{ color: darkMode ? "#ffffff" : "#000", fontSize: "0.9rem", marginBottom: "0.5rem" }}>📊 Monthly Average</h4>
          <p style={{ fontSize: "1.5rem", fontWeight: "700", color: "#ffd700", margin: 0 }}>
            R{monthlyAverage.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* View Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        {['overview', 'daily', 'weekly', 'monthly'].map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: "0.75rem 1.5rem",
              border: "none",
              borderRadius: "8px",
              background: view === v ? "linear-gradient(135deg, #667eea, #764ba2)" : (darkMode ? "rgba(255, 255, 255, 0.1)" : "#fff"),
              color: view === v ? "white" : (darkMode ? "#ffffff" : "#000"),
              fontWeight: view === v ? "700" : "500",
              cursor: "pointer",
              textTransform: "capitalize",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Content based on view */}
      {view === 'overview' && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
          {/* Today */}
          <div style={{ background: "linear-gradient(135deg, #ff6b35, #f7931e)", padding: "2rem", borderRadius: "15px" }}>
            <h4 style={{ color: "#fff", marginBottom: "1rem" }}>💰 Today</h4>
            <p style={{ fontSize: "2rem", fontWeight: "700", margin: "0.5rem 0", color: "#fff" }}>R{todayRevenue.toLocaleString()}</p>
            <p style={{ fontSize: "1rem", opacity: 0.9, color: "#fff" }}>{todayOrders} orders</p>
          </div>

          {/* This Week */}
          <div style={{ background: "linear-gradient(135deg, #667eea, #764ba2)", padding: "2rem", borderRadius: "15px" }}>
            <h4 style={{ color: "#fff", marginBottom: "1rem" }}>📅 This Week</h4>
            <p style={{ fontSize: "2rem", fontWeight: "700", margin: "0.5rem 0", color: "#fff" }}>R{weekRevenue.toLocaleString()}</p>
            <p style={{ fontSize: "1rem", opacity: 0.9, color: "#fff" }}>{weekOrders} orders</p>
          </div>

          {/* This Month */}
          <div style={{ background: "linear-gradient(135deg, #ffd700, #ff6b35)", padding: "2rem", borderRadius: "15px" }}>
            <h4 style={{ color: "#fff", marginBottom: "1rem" }}>📆 This Month</h4>
            <p style={{ fontSize: "2rem", fontWeight: "700", margin: "0.5rem 0", color: "#fff" }}>R{monthRevenue.toLocaleString()}</p>
            <p style={{ fontSize: "1rem", opacity: 0.9, color: "#fff" }}>{monthOrders} orders</p>
          </div>
        </div>
      )}

      {view === 'daily' && (
        <div>
          <h3 style={{ marginBottom: "1rem", color: darkMode ? "#ffffff" : "#000", fontWeight: "700" }}>Daily Revenue History</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {historicalDays.slice(0, 30).map((day, idx) => (
              <div key={idx} style={{
                background: darkMode ? "rgba(255, 255, 255, 0.1)" : "#fff",
                padding: "1rem 1.5rem",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}>
                <div>
                  <strong style={{ color: darkMode ? "#ffffff" : "#000" }}>{new Date(day.date).toLocaleDateString('en-ZA', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</strong>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "1.25rem", fontWeight: "700", color: "#ff6b35", margin: 0 }}>
                    R{day.revenue.toLocaleString()}
                  </p>
                  <p style={{ fontSize: "0.9rem", color: darkMode ? "#cbd5e1" : "#666", margin: 0 }}>{day.orders} orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'weekly' && (
        <div>
          <h3 style={{ marginBottom: "1rem", color: darkMode ? "#ffffff" : "#000", fontWeight: "700" }}>Weekly Revenue History</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {historicalWeeks.slice(0, 12).map((week, idx) => (
              <div key={idx} style={{
                background: darkMode ? "rgba(255, 255, 255, 0.1)" : "#fff",
                padding: "1rem 1.5rem",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}>
                <div>
                  <strong style={{ color: darkMode ? "#ffffff" : "#000" }}>Week {week.week}</strong>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "1.25rem", fontWeight: "700", color: "#667eea", margin: 0 }}>
                    R{week.revenue.toLocaleString()}
                  </p>
                  <p style={{ fontSize: "0.9rem", color: darkMode ? "#cbd5e1" : "#666", margin: 0 }}>{week.orders} orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'monthly' && (
        <div>
          <h3 style={{ marginBottom: "1rem", color: darkMode ? "#ffffff" : "#000", fontWeight: "700" }}>Monthly Revenue History</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {historicalMonths.map((month, idx) => (
              <div key={idx} style={{
                background: darkMode ? "rgba(255, 255, 255, 0.1)" : "#fff",
                padding: "1rem 1.5rem",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}>
                <div>
                  <strong style={{ color: darkMode ? "#ffffff" : "#000" }}>{new Date(month.month + '-01').toLocaleDateString('en-ZA', { year: 'numeric', month: 'long' })}</strong>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "1.25rem", fontWeight: "700", color: "#ffd700", margin: 0 }}>
                    R{month.revenue.toLocaleString()}
                  </p>
                  <p style={{ fontSize: "0.9rem", color: darkMode ? "#cbd5e1" : "#666", margin: 0 }}>{month.orders} orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade to Premium */}
      <div style={{
        textAlign: "center",
        padding: "2rem",
        background: "linear-gradient(135deg, #ffd700 0%, #ff6b35 100%)",
        borderRadius: "15px",
        marginTop: "3rem"
      }}>
        <h3 style={{ color: "#fff", marginBottom: "1rem" }}>👑 Want Charts & Insights?</h3>
        <p style={{ fontSize: "1.1rem", marginBottom: "1.5rem", opacity: 0.9, color: "#fff" }}>
          Upgrade to Premium for visual charts, product analytics, and more!
        </p>
        <button
          onClick={() => alert("Redirect to Premium upgrade")}
          style={{
            background: "white",
            color: "#ff6b35",
            border: "none",
            padding: "1rem 2rem",
            borderRadius: "8px",
            fontSize: "1.1rem",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          Upgrade to Premium - R215/month
        </button>
      </div>
    </div>
  );
}
