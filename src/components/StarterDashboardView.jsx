// STARTER PLAN DASHBOARD - COMPLETE STANDALONE COMPONENT
// This is for TRIAL accounts ONLY
// Features: 1 template, 30 products max, NO analytics, subdomain only

import { useState } from "react";

export default function StarterDashboardView({
  storeInfo,
  user,
  setCurrentView,
  newOrders,
  newMsgs,
  supabase
}) {
  const [isOpen, setIsOpen] = useState(storeInfo?.is_open || true);

  const toggleStoreStatus = async () => {
    const newState = !isOpen;
    try {
      const { error} = await supabase
        .from("tenants")
        .update({ is_open: newState })
        .eq("id", storeInfo.id);

      if (error) throw error;

      setIsOpen(newState);
      alert(newState ? "✅ Store is now OPEN" : "🔴 Store is now CLOSED");
    } catch (err) {
      alert("❌ Failed to update store status");
    }
  };

  return (
    <div className="dashboard" style={{
      background: "#f8f9fa"
    }}>
      <div className="dashboard-header" style={{
        background: "white",
        borderRadius: "12px",
        padding: "2rem",
        marginBottom: "2rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
      }}>
        <div>
          <h2 style={{
            fontSize: "1.8rem",
            marginBottom: "0.5rem",
            fontWeight: "600",
            letterSpacing: "-0.5px",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            color: "#1e293b"
          }}>
            {storeInfo?.profile_picture_url ? (
              <img
                src={storeInfo.profile_picture_url}
                alt="Profile"
                style={{
                  width: "45px",
                  height: "45px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #e2e8f0",
                  boxShadow: "none"
                }}
              />
            ) : (
              <span style={{ fontSize: "2.5rem" }}>👤</span>
            )}
          </h2>
          <p style={{
            marginBottom: "0",
            fontSize: "0.95rem",
            color: "#94a3b8"
          }}>
            Free Trial • Basic Management Tools
          </p>
        </div>
        <div style={{ display: "flex", gap: ".75rem", alignItems: "center" }}>
          {/* Open/Close Toggle */}
          <button
            className="store-toggle-btn"
            onClick={toggleStoreStatus}
            style={{
              background: isOpen ? "#10b981" : "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "0.75rem 1.25rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
            }}
          >
            {isOpen ? "🟢 Store Open" : "🔴 Store Closed"}
          </button>
        </div>
      </div>

      <div className="admin-menu-section" style={{ marginTop: "1rem" }}>
        <h3 style={{
          fontSize: "1.3rem",
          fontWeight: "600",
          marginBottom: "1.25rem",
          color: "#1e293b"
        }}>Management Tools</h3>
        <div className="admin-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1rem"
        }}>
          {/* 1. Orders */}
          <div
            className="admin-card"
            onClick={() => setCurrentView("orders")}
            style={{
              position: "relative",
              background: "white",
              padding: "1.5rem",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <h4 style={{ marginBottom: ".5rem", color: "#1e293b", fontWeight: "600", fontSize: "1.1rem" }}>📦 Orders</h4>
            <p style={{ color: "#64748b", margin: 0, fontSize: "0.9rem" }}>Manage customer orders</p>

            {newOrders > 0 && (
              <span style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "#ff6b35",
                color: "#fff",
                borderRadius: "50%",
                padding: ".25rem .5rem",
                fontWeight: 700,
                fontSize: ".8rem",
              }}>
                {newOrders}
              </span>
            )}
          </div>

          {/* 2. Menu Management */}
          <div
            className="admin-card"
            onClick={() => setCurrentView("menu")}
            style={{ position: "relative" }}
          >
            <h4 style={{ marginBottom: ".25rem" }}>📋 Menu Management</h4>
            <p style={{ opacity: 0.8, margin: 0 }}>Add and edit food items (Max 30)</p>
          </div>

          {/* 3. Notifications */}
          <div
            className="admin-card"
            onClick={() => setCurrentView("notifications")}
            style={{ position: "relative" }}
          >
            <h4 style={{ marginBottom: ".25rem" }}>🔔 Notifications</h4>
            <p style={{ opacity: 0.8, margin: 0 }}>Customer messages & replies</p>

            {newMsgs > 0 && (
              <span style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "#2196F3",
                color: "#fff",
                borderRadius: "50%",
                padding: ".25rem .5rem",
                fontWeight: 700,
                fontSize: ".8rem",
              }}>
                {newMsgs}
              </span>
            )}
          </div>

          {/* 4. Fetched Orders */}
          <div
            className="admin-card"
            onClick={() => setCurrentView("fetchedorders")}
            style={{ position: "relative" }}
          >
            <h4 style={{ marginBottom: ".25rem" }}>✅ Fetched Orders</h4>
            <p style={{ opacity: 0.8, margin: 0 }}>Completed & picked up orders</p>
          </div>

          {/* 5. Live Queue */}
          <div
            className="admin-card"
            onClick={() => setCurrentView("livequeue")}
            style={{ position: "relative" }}
          >
            <h4 style={{ marginBottom: ".25rem" }}>🕒 Live Queue</h4>
            <p style={{ opacity: 0.8, margin: 0 }}>View and manage live orders</p>
          </div>

          {/* 6. Analytics - UNLOCKED for Starter */}
          <div
            className="admin-card"
            onClick={() => setCurrentView("analytics")}
            style={{ position: "relative" }}
          >
            <h4 style={{ marginBottom: ".25rem" }}>📊 Starter Analytics</h4>
            <p style={{ opacity: 0.8, margin: 0 }}>Today's revenue & orders</p>
          </div>

          {/* 7. Store Designer */}
          <div
            className="admin-card"
            onClick={() => setCurrentView("storedesigner")}
            style={{ position: "relative" }}
          >
            <h4 style={{ marginBottom: ".25rem" }}>🎨 Store Designer</h4>
            <p style={{ opacity: 0.8, margin: 0 }}>Design your banner, header & sections</p>
          </div>

          {/* 8. Web Templates */}
          <div
            className="admin-card"
            onClick={() => setCurrentView("webtemplates")}
            style={{ position: "relative" }}
          >
            <h4 style={{ marginBottom: ".25rem" }}>🌐 Web Templates</h4>
            <p style={{ opacity: 0.8, margin: 0 }}>1 template available (Free Trial)</p>
          </div>

          {/* 9. Settings */}
          <div
            className="admin-card"
            onClick={() => setCurrentView("settings")}
            style={{ position: "relative" }}
          >
            <h4 style={{ marginBottom: ".25rem" }}>⚙️ Settings</h4>
            <p style={{ opacity: 0.8, margin: 0 }}>General settings & QR</p>
          </div>
        </div>
      </div>

      {/* Upgrade Prompt */}
      <div style={{
        marginTop: "2.5rem",
        padding: "2.5rem",
        background: "white",
        borderRadius: "12px",
        border: "2px solid #e2e8f0",
        textAlign: "center"
      }}>
        <h3 style={{ color: "#1e293b", marginBottom: "0.75rem", fontSize: "1.4rem", fontWeight: "600" }}>
          🚀 Ready to Grow Your Business?
        </h3>
        <p style={{ fontSize: "1rem", marginBottom: "1.5rem", color: "#64748b" }}>
          Upgrade to unlock analytics, more templates, and advanced features
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => setCurrentView("settings")}
            style={{
              background: "#3b82f6",
              color: "white",
              border: "none",
              padding: "0.875rem 1.75rem",
              borderRadius: "8px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(59,130,246,0.2)"
            }}
          >
            Pro - R25/month
          </button>
          <button
            onClick={() => setCurrentView("settings")}
            style={{
              background: "#f59e0b",
              color: "white",
              border: "none",
              padding: "0.875rem 1.75rem",
              borderRadius: "8px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(245,158,11,0.2)"
            }}
          >
            Premium - R25/month
          </button>
        </div>
      </div>
    </div>
  );
}
