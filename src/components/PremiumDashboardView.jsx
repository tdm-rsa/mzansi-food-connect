// PREMIUM PLAN DASHBOARD - COMPLETE STANDALONE COMPONENT
// This is for PREMIUM accounts ONLY - R300/month
// Features: 3 templates, unlimited products, ADVANCED analytics (with charts), WhatsApp API, custom domain INCLUDED

import { useState } from "react";

export default function PremiumDashboardView({
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
      const { error } = await supabase
        .from("stores")
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
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2 style={{
            fontSize: "1.8rem",
            marginBottom: "0.5rem",
            fontWeight: "700",
            letterSpacing: "-0.5px",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem"
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
                  border: "3px solid #ffd700",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)"
                }}
              />
            ) : (
              <span style={{ fontSize: "2.5rem" }}>👤</span>
            )}
            {user?.email?.split('@')[0] || 'Owner'}
          </h2>
          <h3 style={{
            fontSize: "1.5rem",
            marginTop: "0",
            marginBottom: "0.75rem",
            color: "#ffd700",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            <span style={{ fontSize: "1.8rem" }}>🏪</span>
            {storeInfo?.name || 'My Store'}
          </h3>
          <p style={{
            marginBottom: "1rem",
            fontSize: "1rem",
            opacity: "0.8"
          }}>
            Manage your Mzansi Food Connect business
          </p>
        </div>
        <div style={{ display: "flex", gap: ".75rem", alignItems: "center" }}>
          {/* Open/Close Toggle */}
          <button
            className="store-toggle-btn"
            onClick={toggleStoreStatus}
            style={{
              background: isOpen
                ? "linear-gradient(135deg, #10b981, #059669)"
                : "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "0.75rem 1.25rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: isOpen
                ? "0 2px 8px rgba(16, 185, 129, 0.3)"
                : "0 2px 8px rgba(239, 68, 68, 0.3)",
            }}
          >
            {isOpen ? "🟢 Store Open" : "🔴 Store Closed"}
          </button>
        </div>
      </div>

      <div className="admin-menu-section">
        <h3>Management Tools</h3>
        <div className="admin-grid">
          {/* 1. Orders */}
          <div
            className="admin-card"
            onClick={() => setCurrentView("orders")}
            style={{ position: "relative" }}
          >
            <h4 style={{ marginBottom: ".25rem" }}>📦 Orders</h4>
            <p style={{ opacity: 0.8, margin: 0 }}>Manage customer orders</p>

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
            <p style={{ opacity: 0.8, margin: 0 }}>Add and edit unlimited food items</p>
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

          {/* 6. Analytics - Advanced Analytics FULLY UNLOCKED */}
          <div
            className="admin-card"
            onClick={() => setCurrentView("analytics")}
            style={{ position: "relative" }}
          >
            <h4 style={{ marginBottom: ".25rem" }}>📊 Advanced Analytics</h4>
            <p style={{ opacity: 0.8, margin: 0 }}>Full analytics with charts & graphs</p>
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
            <p style={{ opacity: 0.8, margin: 0 }}>3 professional templates available</p>
          </div>

          {/* 9. Settings */}
          <div
            className="admin-card"
            onClick={() => setCurrentView("settings")}
            style={{ position: "relative" }}
          >
            <h4 style={{ marginBottom: ".25rem" }}>⚙️ Settings</h4>
            <p style={{ opacity: 0.8, margin: 0 }}>General settings, QR & custom domain</p>
          </div>
        </div>
      </div>

      {/* Premium Features Highlight */}
      <div style={{
        marginTop: "3rem",
        padding: "2rem",
        background: "linear-gradient(135deg, #4ade80 0%, #10b981 100%)",
        borderRadius: "15px",
        color: "white",
        textAlign: "center"
      }}>
        <h3 style={{ color: "white", marginBottom: "1rem", fontSize: "1.5rem" }}>
          🎉 You're on Premium - All Features Unlocked!
        </h3>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginTop: "1.5rem"
        }}>
          <div style={{ background: "rgba(255,255,255,0.2)", padding: "1rem", borderRadius: "10px" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📊</div>
            <strong>Advanced Analytics</strong>
            <p style={{ fontSize: "0.9rem", margin: "0.5rem 0 0 0", opacity: 0.9 }}>Charts & Insights</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.2)", padding: "1rem", borderRadius: "10px" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🌐</div>
            <strong>Custom Domain</strong>
            <p style={{ fontSize: "0.9rem", margin: "0.5rem 0 0 0", opacity: 0.9 }}>Your brand</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.2)", padding: "1rem", borderRadius: "10px" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎨</div>
            <strong>All Templates</strong>
            <p style={{ fontSize: "0.9rem", margin: "0.5rem 0 0 0", opacity: 0.9 }}>5+ professional themes</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.2)", padding: "1rem", borderRadius: "10px" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💬</div>
            <strong>WhatsApp API</strong>
            <p style={{ fontSize: "0.9rem", margin: "0.5rem 0 0 0", opacity: 0.9 }}>Automated messaging</p>
          </div>
        </div>
      </div>
    </div>
  );
}
