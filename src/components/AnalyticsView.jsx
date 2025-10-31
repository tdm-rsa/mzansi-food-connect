import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { supabase } from "../supabaseClient";

export default function AnalyticsView({ storeInfo, onBack }) {
  const [daily, setDaily] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [growth, setGrowth] = useState(0);

  useEffect(() => {
    async function loadAll() {
      if (!storeInfo?.id) return;

      const { data: d } = await supabase
        .from("store_analytics_daily")
        .select("*")
        .eq("store_id", storeInfo.id)
        .order("day", { ascending: true });

      const { data: m } = await supabase
        .from("store_analytics_monthly")
        .select("*")
        .eq("store_id", storeInfo.id)
        .order("month", { ascending: true });

      const { data: b } = await supabase
        .from("store_best_sellers")
        .select("*")
        .eq("store_id", storeInfo.id)
        .limit(5);

      setDaily(d || []);
      setMonthly(m || []);
      setTopItems(b || []);

      if (m && m.length >= 2) {
        const [prev, curr] = m.slice(-2);
        const growthPct = ((curr.total_revenue - prev.total_revenue) / prev.total_revenue) * 100;
        setGrowth(isFinite(growthPct) ? growthPct.toFixed(1) : 0);
      }
    }

    loadAll();
  }, [storeInfo]);

  return (
    <div className="template-view">
      <div className="view-header">
        <button onClick={onBack}>← Back</button>
        <h2>📊 Store Analytics</h2>
        <p>Daily, Monthly and Product Performance</p>
      </div>

      {/* Growth Overview */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h4>📈 Monthly Growth</h4>
          <p style={{ fontSize: "1.5rem", color: growth >= 0 ? "#4CAF50" : "#F44336" }}>
            {growth >= 0 ? "▲" : "▼"} {Math.abs(growth)}%
          </p>
        </div>
        {monthly.length > 0 && (
          <div className="metric-card">
            <h4>💰 Last Month Revenue</h4>
            <p style={{ fontSize: "1.5rem", color: "#ffd700" }}>
              R{monthly[monthly.length - 1].total_revenue.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Daily Revenue Chart */}
      <h3>📆 Daily Revenue</h3>
      {daily.length === 0 ? (
        <p>No daily data yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total_revenue" fill="#ff6b35" name="Revenue (R)" />
            <Bar dataKey="orders_count" fill="#ffd700" name="Orders" />
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Monthly Revenue Chart */}
      <h3 style={{ marginTop: "2rem" }}>🗓️ Monthly Revenue</h3>
      {monthly.length === 0 ? (
        <p>No monthly data yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="total_revenue" stroke="#ff6b35" strokeWidth={3} />
            <Line type="monotone" dataKey="orders_count" stroke="#ffd700" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Top 5 Best Sellers */}
      <h3 style={{ marginTop: "2rem" }}>🔥 Top 5 Best Sellers</h3>
      {topItems.length === 0 ? (
        <p>No top sellers yet.</p>
      ) : (
        <div className="best-sellers">
          {topItems.map((item, i) => (
            <div key={i} className="seller-card">
              <strong>#{i + 1}</strong> {item.item_name}
              <p>Sold: {item.times_sold} | Earned: R{item.total_earned}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
