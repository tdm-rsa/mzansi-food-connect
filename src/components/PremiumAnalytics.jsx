// PREMIUM ANALYTICS - Premium Plan Only
// Advanced analytics with charts, graphs, and product performance
// Daily, Weekly, Monthly views with navigation
// Pie charts, line charts, bar graphs

import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = ['#ff6b35', '#667eea', '#ffd700', '#4CAF50', '#F44336', '#2196F3', '#FF9800', '#9C27B0'];

export default function PremiumAnalytics({ storeInfo, onBack, darkMode }) {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("daily"); // daily, weekly, monthly

  // Stats
  const [dailyAverage, setDailyAverage] = useState(0);
  const [weeklyAverage, setWeeklyAverage] = useState(0);
  const [monthlyAverage, setMonthlyAverage] = useState(0);

  // Current period stats
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);

  // Historical data
  const [historicalDays, setHistoricalDays] = useState([]);
  const [historicalWeeks, setHistoricalWeeks] = useState([]);
  const [historicalMonths, setHistoricalMonths] = useState([]);

  // Product performance data
  const [dailyProductData, setDailyProductData] = useState([]);
  const [weeklyProductData, setWeeklyProductData] = useState([]);

  // Current day navigation
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);

  useEffect(() => {
    loadAnalytics();
  }, [storeInfo]);

  async function loadAnalytics() {
    if (!storeInfo?.id) return;
    setLoading(true);

    try {
      // Fetch ALL orders first (without joins to avoid relationship errors)
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id, total, created_at, status")
        .eq("store_id", storeInfo.id)
        .order("created_at", { ascending: false });

      if (ordersError) {
        
        throw ordersError;
      }

      if (orders && orders.length > 0) {
        // Log each order's status to see what we're working with
        
        orders.forEach((o, idx) => {
          
        });

        // Accept ALL orders (don't filter by status at all for now)
        const validOrders = orders;

        // Now fetch order items separately for product analytics
        const { data: orderItems, error: itemsError } = await supabase
          .from("order_items")
          .select(`
            order_id,
            menu_item_id,
            quantity,
            price,
            menu_items (
              name
            )
          `)
          .in("order_id", validOrders.map(o => o.id));

        if (!itemsError && orderItems) {
          
          // Attach items to orders
          const ordersWithItems = validOrders.map(order => ({
            ...order,
            order_items: orderItems.filter(item => item.order_id === order.id)
          }));
          calculateStats(ordersWithItems);
        } else {
          // If items fetch fails, just use orders without items
          
          calculateStats(validOrders);
        }
      }
    } catch (err) {
      
    }

    setLoading(false);
  }

  function calculateStats(orders) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Today's stats
    const todayOrders = orders.filter(o => new Date(o.created_at) >= today);
    setTodayRevenue(todayOrders.reduce((sum, o) => sum + (o.total || 0), 0));
    setTodayOrders(todayOrders.length);

    // Calculate historical data and product performance
    const { daily, weekly, monthly, dailyProducts, weeklyProducts } = processHistoricalData(orders);

    setHistoricalDays(daily);
    setHistoricalWeeks(weekly);
    setHistoricalMonths(monthly);
    setDailyProductData(dailyProducts);
    setWeeklyProductData(weeklyProducts);

    // Calculate averages
    if (daily.length > 0) {
      const avgDaily = daily.reduce((sum, d) => sum + d.revenue, 0) / daily.length;
      setDailyAverage(avgDaily);
    }
    if (weekly.length > 0) {
      const avgWeekly = weekly.reduce((sum, w) => sum + w.revenue, 0) / weekly.length;
      setWeeklyAverage(avgWeekly);
    }
    if (monthly.length > 0) {
      const avgMonthly = monthly.reduce((sum, m) => sum + m.revenue, 0) / monthly.length;
      setMonthlyAverage(avgMonthly);
    }
  }

  function processHistoricalData(orders) {
    const dailyMap = {};
    const weeklyMap = {};
    const monthlyMap = {};
    const dailyProductMap = {};
    const weeklyProductMap = {};

    orders.forEach(order => {
      const date = new Date(order.created_at);
      const dayKey = date.toISOString().split('T')[0];
      const weekKey = getWeekKey(date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      // Daily aggregation
      if (!dailyMap[dayKey]) {
        dailyMap[dayKey] = {
          date: dayKey,
          revenue: 0,
          orders: 0,
          displayDate: date.toLocaleDateString('en-ZA', { weekday: 'short', month: 'short', day: 'numeric' })
        };
      }
      dailyMap[dayKey].revenue += order.total || 0;
      dailyMap[dayKey].orders += 1;

      // Weekly aggregation
      if (!weeklyMap[weekKey]) {
        weeklyMap[weekKey] = { week: weekKey, revenue: 0, orders: 0 };
      }
      weeklyMap[weekKey].revenue += order.total || 0;
      weeklyMap[weekKey].orders += 1;

      // Monthly aggregation
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          month: monthKey,
          revenue: 0,
          orders: 0,
          displayMonth: date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long' })
        };
      }
      monthlyMap[monthKey].revenue += order.total || 0;
      monthlyMap[monthKey].orders += 1;

      // Product performance tracking
      if (order.order_items && order.order_items.length > 0) {
        order.order_items.forEach(item => {
          const productName = item.menu_items?.name || 'Unknown Product';

          // Daily products
          if (!dailyProductMap[dayKey]) dailyProductMap[dayKey] = {};
          if (!dailyProductMap[dayKey][productName]) {
            dailyProductMap[dayKey][productName] = { name: productName, orders: 0 };
          }
          dailyProductMap[dayKey][productName].orders += item.quantity || 1;

          // Weekly products
          if (!weeklyProductMap[weekKey]) weeklyProductMap[weekKey] = {};
          if (!weeklyProductMap[weekKey][productName]) {
            weeklyProductMap[weekKey][productName] = { name: productName, orders: 0 };
          }
          weeklyProductMap[weekKey][productName].orders += item.quantity || 1;
        });
      }
    });

    const daily = Object.values(dailyMap).sort((a, b) => b.date.localeCompare(a.date));
    const weekly = Object.values(weeklyMap).sort((a, b) => b.week.localeCompare(a.week));
    const monthly = Object.values(monthlyMap).sort((a, b) => b.month.localeCompare(a.month));

    // Convert product maps to arrays
    const dailyProducts = Object.keys(dailyProductMap).reduce((acc, dayKey) => {
      acc[dayKey] = Object.values(dailyProductMap[dayKey]);
      return acc;
    }, {});

    const weeklyProducts = Object.keys(weeklyProductMap).reduce((acc, weekKey) => {
      acc[weekKey] = Object.values(weeklyProductMap[weekKey]);
      return acc;
    }, {});

    return { daily, weekly, monthly, dailyProducts, weeklyProducts };
  }

  function getWeekKey(date) {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
  }

  // Get current month's daily breakdown (for monthly view)
  function getCurrentMonthDailyData() {
    if (historicalMonths.length === 0) return [];

    const currentMonth = historicalMonths[currentMonthIndex];
    if (!currentMonth) return [];

    return historicalDays.filter(day => day.date.startsWith(currentMonth.month));
  }

  // Get weekly averages for monthly view
  function getMonthlyWeeklyAverages() {
    if (historicalMonths.length === 0) return [];

    const currentMonth = historicalMonths[currentMonthIndex];
    if (!currentMonth) return [];

    return historicalWeeks
      .filter(week => week.week.startsWith(currentMonth.month.split('-')[0]))
      .slice(0, 5); // Max 5 weeks per month
  }

  if (loading) {
    return (
      <div className="template-view">
        <div className="view-header">
          <button onClick={onBack}>← Back</button>
          <h2>📊 Premium Analytics</h2>
        </div>
        <div style={{ textAlign: "center", padding: "3rem", color: darkMode ? "#cbd5e1" : "#000" }}>
          <p>Loading advanced analytics...</p>
        </div>
      </div>
    );
  }

  const currentDay = historicalDays[currentDayIndex] || {};
  const currentWeek = historicalWeeks[currentWeekIndex] || {};
  const currentMonth = historicalMonths[currentMonthIndex] || {};

  const currentDayProducts = dailyProductData[currentDay.date] || [];
  const currentWeekProducts = weeklyProductData[currentWeek.week] || [];

  return (
    <div className="template-view">
      <div className="view-header">
        <button onClick={onBack}>← Back</button>
        <h2 style={{ color: darkMode ? "#ffffff" : "#000" }}>📊 Premium Analytics</h2>
        <p style={{ color: darkMode ? "#cbd5e1" : "#000" }}>Advanced insights with charts & product performance</p>
      </div>

      {/* Premium Plan Banner */}
      <div style={{
        background: "linear-gradient(135deg, #ffd700 0%, #ff6b35 100%)",
        color: "white",
        padding: "1.5rem",
        borderRadius: "12px",
        marginBottom: "2rem"
      }}>
        <h3 style={{ color: "#fff", marginBottom: "0.5rem" }}>👑 Premium Analytics</h3>
        <p style={{ opacity: 0.9, marginBottom: "0", fontSize: "0.95rem", color: "#fff" }}>
          Complete business intelligence with charts, graphs, and product insights!
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
        {['daily', 'weekly', 'monthly'].map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: "0.75rem 1.5rem",
              border: "none",
              borderRadius: "8px",
              background: view === v ? "linear-gradient(135deg, #ffd700, #ff6b35)" : "#fff",
              color: view === v ? "#fff" : "#000",
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

      {/* DAILY VIEW */}
      {view === 'daily' && historicalDays.length > 0 && (
        <div>
          {/* Navigation */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
            padding: "1rem",
            background: darkMode ? "rgba(255, 255, 255, 0.1)" : "#fff",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}>
            <button
              onClick={() => setCurrentDayIndex(Math.min(currentDayIndex + 1, historicalDays.length - 1))}
              disabled={currentDayIndex >= historicalDays.length - 1}
              style={{
                padding: "0.5rem 1rem",
                border: "none",
                borderRadius: "6px",
                background: currentDayIndex >= historicalDays.length - 1 ? "#ccc" : "#667eea",
                color: "white",
                fontWeight: "600",
                cursor: currentDayIndex >= historicalDays.length - 1 ? "not-allowed" : "pointer"
              }}
            >
              ← Previous Day
            </button>
            <h3 style={{ color: darkMode ? "#ffffff" : "#000", margin: 0 }}>{currentDay.displayDate || currentDay.date}</h3>
            <button
              onClick={() => setCurrentDayIndex(Math.max(currentDayIndex - 1, 0))}
              disabled={currentDayIndex <= 0}
              style={{
                padding: "0.5rem 1rem",
                border: "none",
                borderRadius: "6px",
                background: currentDayIndex <= 0 ? "#ccc" : "#667eea",
                color: "white",
                fontWeight: "600",
                cursor: currentDayIndex <= 0 ? "not-allowed" : "pointer"
              }}
            >
              Next Day →
            </button>
          </div>

          {/* Daily Stats Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
            <div style={{ background: darkMode ? "rgba(255, 255, 255, 0.1)" : "#fff", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <h4 style={{ color: darkMode ? "#ffffff" : "#000", marginBottom: "0.5rem" }}>💰 Revenue</h4>
              <p style={{ fontSize: "2rem", fontWeight: "700", color: "#ff6b35", margin: 0 }}>
                R{(currentDay.revenue || 0).toLocaleString()}
              </p>
            </div>
            <div style={{ background: darkMode ? "rgba(255, 255, 255, 0.1)" : "#fff", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <h4 style={{ color: darkMode ? "#ffffff" : "#000", marginBottom: "0.5rem" }}>📦 Orders</h4>
              <p style={{ fontSize: "2rem", fontWeight: "700", color: "#667eea", margin: 0 }}>
                {currentDay.orders || 0}
              </p>
            </div>
          </div>

          {/* Product Performance Pie Chart */}
          {currentDayProducts.length > 0 && (
            <div style={{ background: darkMode ? "rgba(255, 255, 255, 0.1)" : "#fff", padding: "1.5rem", borderRadius: "12px", marginBottom: "2rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <h3 style={{ color: darkMode ? "#ffffff" : "#000", marginBottom: "1rem" }}>🍽️ Product Performance (Orders)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={currentDayProducts}
                    dataKey="orders"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.name}: ${entry.orders}`}
                  >
                    {currentDayProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Last 30 Days Revenue Trend */}
          <div style={{ background: darkMode ? "rgba(255, 255, 255, 0.1)" : "#fff", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <h3 style={{ color: darkMode ? "#ffffff" : "#000", marginBottom: "1rem" }}>📈 Last 30 Days Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalDays.slice(0, 30).reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="displayDate" angle={-45} textAnchor="end" height={80} style={{ fontSize: '0.75rem' }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#ff6b35" strokeWidth={2} name="Revenue (R)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* WEEKLY VIEW */}
      {view === 'weekly' && historicalWeeks.length > 0 && (
        <div>
          {/* Navigation */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
            padding: "1rem",
            background: darkMode ? "rgba(255, 255, 255, 0.1)" : "#fff",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}>
            <button
              onClick={() => setCurrentWeekIndex(Math.min(currentWeekIndex + 1, historicalWeeks.length - 1))}
              disabled={currentWeekIndex >= historicalWeeks.length - 1}
              style={{
                padding: "0.5rem 1rem",
                border: "none",
                borderRadius: "6px",
                background: currentWeekIndex >= historicalWeeks.length - 1 ? "#ccc" : "#667eea",
                color: "white",
                fontWeight: "600",
                cursor: currentWeekIndex >= historicalWeeks.length - 1 ? "not-allowed" : "pointer"
              }}
            >
              ← Previous Week
            </button>
            <h3 style={{ color: darkMode ? "#ffffff" : "#000", margin: 0 }}>Week {currentWeek.week}</h3>
            <button
              onClick={() => setCurrentWeekIndex(Math.max(currentWeekIndex - 1, 0))}
              disabled={currentWeekIndex <= 0}
              style={{
                padding: "0.5rem 1rem",
                border: "none",
                borderRadius: "6px",
                background: currentWeekIndex <= 0 ? "#ccc" : "#667eea",
                color: "white",
                fontWeight: "600",
                cursor: currentWeekIndex <= 0 ? "not-allowed" : "pointer"
              }}
            >
              Next Week →
            </button>
          </div>

          {/* Weekly Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
            <div style={{ background: darkMode ? "rgba(255, 255, 255, 0.1)" : "#fff", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <h4 style={{ color: darkMode ? "#ffffff" : "#000", marginBottom: "0.5rem" }}>💰 Revenue</h4>
              <p style={{ fontSize: "2rem", fontWeight: "700", color: "#667eea", margin: 0 }}>
                R{(currentWeek.revenue || 0).toLocaleString()}
              </p>
            </div>
            <div style={{ background: darkMode ? "rgba(255, 255, 255, 0.1)" : "#fff", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <h4 style={{ color: darkMode ? "#ffffff" : "#000", marginBottom: "0.5rem" }}>📦 Orders</h4>
              <p style={{ fontSize: "2rem", fontWeight: "700", color: "#ff6b35", margin: 0 }}>
                {currentWeek.orders || 0}
              </p>
            </div>
          </div>

          {/* Weekly Product Performance */}
          {currentWeekProducts.length > 0 && (
            <div style={{ background: darkMode ? "rgba(255, 255, 255, 0.1)" : "#fff", padding: "1.5rem", borderRadius: "12px", marginBottom: "2rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <h3 style={{ color: darkMode ? "#ffffff" : "#000", marginBottom: "1rem" }}>🍽️ Product Performance (Orders)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={currentWeekProducts}
                    dataKey="orders"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.name}: ${entry.orders}`}
                  >
                    {currentWeekProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Weekly Revenue Tracking - Line Chart */}
          <div style={{ background: darkMode ? "rgba(255, 255, 255, 0.1)" : "#fff", padding: "1.5rem", borderRadius: "12px", marginBottom: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <h3 style={{ color: darkMode ? "#ffffff" : "#000", marginBottom: "1rem" }}>📈 Weekly Revenue Trend (Last 12 Weeks)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalWeeks.slice(0, 12).reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#667eea" strokeWidth={3} name="Revenue (R)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly Revenue Bar Graph */}
          <div style={{ background: darkMode ? "rgba(255, 255, 255, 0.1)" : "#fff", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <h3 style={{ color: darkMode ? "#ffffff" : "#000", marginBottom: "1rem" }}>📊 Weekly Revenue (Last 12 Weeks)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={historicalWeeks.slice(0, 12).reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#667eea" name="Revenue (R)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* MONTHLY VIEW */}
      {view === 'monthly' && historicalMonths.length > 0 && (
        <div>
          {/* Navigation */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
            padding: "1rem",
            background: darkMode ? "rgba(255, 255, 255, 0.1)" : "#fff",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}>
            <button
              onClick={() => setCurrentMonthIndex(Math.min(currentMonthIndex + 1, historicalMonths.length - 1))}
              disabled={currentMonthIndex >= historicalMonths.length - 1}
              style={{
                padding: "0.5rem 1rem",
                border: "none",
                borderRadius: "6px",
                background: currentMonthIndex >= historicalMonths.length - 1 ? "#ccc" : "#ffd700",
                color: currentMonthIndex >= historicalMonths.length - 1 ? "#666" : "#000",
                fontWeight: "600",
                cursor: currentMonthIndex >= historicalMonths.length - 1 ? "not-allowed" : "pointer"
              }}
            >
              ← Previous Month
            </button>
            <h3 style={{ color: darkMode ? "#ffffff" : "#000", margin: 0 }}>{currentMonth.displayMonth || currentMonth.month}</h3>
            <button
              onClick={() => setCurrentMonthIndex(Math.max(currentMonthIndex - 1, 0))}
              disabled={currentMonthIndex <= 0}
              style={{
                padding: "0.5rem 1rem",
                border: "none",
                borderRadius: "6px",
                background: currentMonthIndex <= 0 ? "#ccc" : "#ffd700",
                color: currentMonthIndex <= 0 ? "#666" : "#000",
                fontWeight: "600",
                cursor: currentMonthIndex <= 0 ? "not-allowed" : "pointer"
              }}
            >
              Next Month →
            </button>
          </div>

          {/* Monthly Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
            <div style={{ background: darkMode ? "rgba(255, 255, 255, 0.1)" : "#fff", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <h4 style={{ color: darkMode ? "#ffffff" : "#000", marginBottom: "0.5rem" }}>💰 Revenue</h4>
              <p style={{ fontSize: "2rem", fontWeight: "700", color: "#ffd700", margin: 0 }}>
                R{(currentMonth.revenue || 0).toLocaleString()}
              </p>
            </div>
            <div style={{ background: darkMode ? "rgba(255, 255, 255, 0.1)" : "#fff", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <h4 style={{ color: darkMode ? "#ffffff" : "#000", marginBottom: "0.5rem" }}>📦 Orders</h4>
              <p style={{ fontSize: "2rem", fontWeight: "700", color: "#ff6b35", margin: 0 }}>
                {currentMonth.orders || 0}
              </p>
            </div>
          </div>

          {/* Monthly Revenue Line Chart */}
          <div style={{ background: darkMode ? "rgba(255, 255, 255, 0.1)" : "#fff", padding: "1.5rem", borderRadius: "12px", marginBottom: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <h3 style={{ color: darkMode ? "#ffffff" : "#000", marginBottom: "1rem" }}>📈 Monthly Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalMonths.slice(0, 12).reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="displayMonth" angle={-45} textAnchor="end" height={100} style={{ fontSize: '0.75rem' }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#ffd700" strokeWidth={3} name="Revenue (R)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Day-by-Day Revenue for Current Month */}
          <div style={{ background: darkMode ? "rgba(255, 255, 255, 0.1)" : "#fff", padding: "1.5rem", borderRadius: "12px", marginBottom: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <h3 style={{ color: darkMode ? "#ffffff" : "#000", marginBottom: "1rem" }}>📊 Daily Revenue Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getCurrentMonthDailyData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="displayDate" angle={-45} textAnchor="end" height={100} style={{ fontSize: '0.7rem' }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#ff6b35" name="Revenue (R)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly Averages for Current Month - Line Chart */}
          {getMonthlyWeeklyAverages().length > 0 && (
            <div style={{ background: darkMode ? "rgba(255, 255, 255, 0.1)" : "#fff", padding: "1.5rem", borderRadius: "12px", marginBottom: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <h3 style={{ color: darkMode ? "#ffffff" : "#000", marginBottom: "1rem" }}>📈 Weekly Revenue in Month (Line Chart)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getMonthlyWeeklyAverages()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#667eea" strokeWidth={3} name="Revenue (R)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Weekly Averages Bar Graph */}
          {getMonthlyWeeklyAverages().length > 0 && (
            <div style={{ background: darkMode ? "rgba(255, 255, 255, 0.1)" : "#fff", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <h3 style={{ color: darkMode ? "#ffffff" : "#000", marginBottom: "1rem" }}>📊 Weekly Revenue in Month (Bar Graph)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getMonthlyWeeklyAverages()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#4CAF50" name="Revenue (R)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* No Data Message */}
      {historicalDays.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", background: darkMode ? "rgba(255, 255, 255, 0.1)" : "#fff", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h3 style={{ color: darkMode ? "#ffffff" : "#000" }}>No data available yet</h3>
          <p style={{ color: darkMode ? "#ffffff" : "#000" }}>Complete some orders to see your analytics!</p>
        </div>
      )}
    </div>
  );
}
