// STARTER ANALYTICS - Free Trial Plan Only
// Shows: Daily Revenue + Total Orders only
// No charts, no historical data

import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function StarterAnalytics({ storeInfo, onBack, darkMode }) {
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTodayStats() {
      if (!storeInfo?.id) {
        
        return;
      }

      setLoading(true);

      // Fetch ALL orders for this store (no date filter in query)
      const { data: allOrders, error } = await supabase
        .from("orders")
        .select("total, status, created_at")
        .eq("store_id", storeInfo.id)
        .order("created_at", { ascending: false });

      if (error) {
        
      }

      if (allOrders) {

        // Get today's date at midnight in local timezone
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

        // Filter for today's orders
        const todaysOrders = allOrders.filter(o => {
          const orderDate = new Date(o.created_at);
          
          return orderDate >= todayStart;
        });

        // Log statuses
        
        todaysOrders.forEach((o, idx) => {
          
        });

        // Accept ALL of today's orders (don't filter by status)
        const validOrders = todaysOrders;

        const revenue = validOrders.reduce((sum, order) => sum + (order.total || 0), 0);

        setTodayRevenue(revenue);
        setTodayOrders(validOrders.length);
      }

      setLoading(false);
    }

    loadTodayStats();
  }, [storeInfo]);

  return (
    <div className="template-view">
      <div className="view-header">
        <button onClick={onBack}>← Back</button>
        <h2>📊 Starter Analytics</h2>
        <p>Today's Performance Overview</p>
      </div>

      {/* Starter Plan Banner */}
      <div style={{
        background: "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
        color: "white",
        padding: "1.5rem",
        borderRadius: "12px",
        marginBottom: "2rem"
      }}>
        <h3 style={{ color: "white", marginBottom: "0.5rem" }}>📦 Free Trial Analytics</h3>
        <p style={{ opacity: 0.9, marginBottom: "0", fontSize: "0.95rem" }}>
          Track today's revenue and orders. Upgrade to Pro for weekly tracking and more!
        </p>
      </div>

      {/* Today's Metrics */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: darkMode ? "#cbd5e1" : "#666" }}>
          <p>Loading today's stats...</p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem"
        }}>
          {/* Daily Revenue */}
          <div style={{
            background: "linear-gradient(135deg, #ff6b35, #f7931e)",
            color: "white",
            padding: "2rem",
            borderRadius: "15px",
            boxShadow: "0 4px 15px rgba(255, 107, 53, 0.3)"
          }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>💰</div>
            <h4 style={{ color: "white", fontSize: "0.9rem", marginBottom: "0.5rem", opacity: 0.9 }}>
              Today's Revenue
            </h4>
            <p style={{
              fontSize: "2.5rem",
              fontWeight: "700",
              margin: "0.5rem 0",
              color: "white"
            }}>
              R{todayRevenue.toLocaleString()}
            </p>
            <p style={{ fontSize: "0.85rem", opacity: 0.8, margin: "0" }}>
              {new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Total Orders Today */}
          <div style={{
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            color: "white",
            padding: "2rem",
            borderRadius: "15px",
            boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)"
          }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📦</div>
            <h4 style={{ color: "white", fontSize: "0.9rem", marginBottom: "0.5rem", opacity: 0.9 }}>
              Total Orders Today
            </h4>
            <p style={{
              fontSize: "2.5rem",
              fontWeight: "700",
              margin: "0.5rem 0",
              color: "white"
            }}>
              {todayOrders}
            </p>
            <p style={{ fontSize: "0.85rem", opacity: 0.8, margin: "0" }}>
              Completed orders
            </p>
          </div>
        </div>
      )}

      {/* Upgrade Prompts */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "1.5rem",
        marginTop: "2rem"
      }}>
        {/* Pro Upgrade */}
        <div style={{
          textAlign: "center",
          padding: "2rem",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "15px",
          color: "white"
        }}>
          <h3 style={{ color: "white", marginBottom: "1rem", fontSize: "1.3rem" }}>
            🚀 Upgrade to Pro
          </h3>
          <p style={{ fontSize: "1rem", marginBottom: "1.5rem", opacity: 0.9, lineHeight: "1.6" }}>
            ✅ Weekly Revenue Tracking<br/>
            ✅ Historical Data<br/>
            ✅ 3 Premium Templates<br/>
            ✅ Remove Branding
          </p>
          <p style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1rem" }}>
            R25<span style={{ fontSize: "1rem", opacity: 0.8 }}>/month</span>
          </p>
          <button
            onClick={() => alert("Redirect to Pro upgrade payment")}
            style={{
              background: "white",
              color: "#667eea",
              border: "none",
              padding: "0.875rem 1.75rem",
              borderRadius: "8px",
              fontSize: "1rem",
              fontWeight: "bold",
              cursor: "pointer",
              width: "100%"
            }}
          >
            Upgrade to Pro
          </button>
        </div>

        {/* Premium Upgrade */}
        <div style={{
          textAlign: "center",
          padding: "2rem",
          background: "linear-gradient(135deg, #ffd700 0%, #ff6b35 100%)",
          borderRadius: "15px",
          color: "white"
        }}>
          <h3 style={{ color: "white", marginBottom: "1rem", fontSize: "1.3rem" }}>
            👑 Upgrade to Premium
          </h3>
          <p style={{ fontSize: "1rem", marginBottom: "1.5rem", opacity: 0.9, lineHeight: "1.6" }}>
            ✅ Everything in Pro<br/>
            ✅ Advanced Charts & Graphs<br/>
            ✅ Product Performance Analytics<br/>
            ✅ Custom Domain
          </p>
          <p style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1rem" }}>
            R25<span style={{ fontSize: "1rem", opacity: 0.8 }}>/month</span>
          </p>
          <button
            onClick={() => alert("Redirect to Premium upgrade payment")}
            style={{
              background: "white",
              color: "#ff6b35",
              border: "none",
              padding: "0.875rem 1.75rem",
              borderRadius: "8px",
              fontSize: "1rem",
              fontWeight: "bold",
              cursor: "pointer",
              width: "100%"
            }}
          >
            Upgrade to Premium
          </button>
        </div>
      </div>
    </div>
  );
}
