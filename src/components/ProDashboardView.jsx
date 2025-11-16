// PRO PLAN DASHBOARD - COMPLETE STANDALONE COMPONENT
// This is for PRO accounts ONLY - R150/month
// Features: 3 templates, unlimited products, BASIC analytics (numbers only), WhatsApp API, subdomain

import { useState } from "react";

export default function ProDashboardView({
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
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)"
    }}>
      <div className="dashboard-header" style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderRadius: "16px",
        padding: "2.5rem",
        marginBottom: "2rem",
        boxShadow: "0 10px 30px rgba(102,126,234,0.3)",
        color: "white"
      }}>
        <div>
          <h2 style={{
            fontSize: "1.9rem",
            marginBottom: "0.5rem",
            fontWeight: "700",
            letterSpacing: "-0.5px",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            color: "white"
          }}>
            {storeInfo?.profile_picture_url ? (
              <img
                src={storeInfo.profile_picture_url}
                alt="Profile"
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid rgba(255,255,255,0.5)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
                }}
              />
            ) : (
              <span style={{ fontSize: "2.5rem" }}>👤</span>
            )}
            {user?.email?.split('@')[0] || 'Owner'}
          </h2>
          <p style={{
            marginBottom: "0",
            fontSize: "1rem",
            color: "rgba(255,255,255,0.85)"
          }}>
            🚀 Pro Plan • Professional Business Management
          </p>
        </div>
        <div style={{ display: "flex", gap: ".75rem", alignItems: "center" }}>
          {/* Open/Close Toggle */}
          <button
            className="store-toggle-btn"
            onClick={toggleStoreStatus}
            style={{
              background: isOpen
                ? "rgba(255,255,255,0.25)"
                : "rgba(239,68,68,0.9)",
              color: "white",
              border: isOpen ? "2px solid rgba(255,255,255,0.5)" : "none",
              borderRadius: "10px",
              padding: "0.85rem 1.4rem",
              fontWeight: "700",
              cursor: "pointer",
              transition: "all 0.2s ease",
              backdropFilter: "blur(10px)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
            }}
          >
            {isOpen ? "🟢 Store Open" : "🔴 Store Closed"}
          </button>
        </div>
      </div>

      {/* Yoco Warning Banner */}
      {(!storeInfo?.yoco_public_key || !storeInfo?.yoco_secret_key) && (
        <div style={{
          background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
          border: "2px solid #d97706",
          borderRadius: "14px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          boxShadow: "0 8px 24px rgba(245, 158, 11, 0.25)"
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
            <div style={{ fontSize: "2.5rem", flexShrink: 0 }}>⚠️</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: "0 0 0.5rem 0", color: "#78350f", fontWeight: "700", fontSize: "1.25rem" }}>
                Yoco Payment Keys Required
              </h3>
              <p style={{ margin: "0 0 1rem 0", color: "#92400e", fontSize: "0.95rem", lineHeight: "1.6" }}>
                To accept card payments, you need to add your Yoco API keys in Settings. Without these keys, customers can only see your menu but cannot complete purchases.
              </p>
              <button
                onClick={() => setCurrentView("settings")}
                style={{
                  background: "white",
                  color: "#d97706",
                  border: "2px solid #d97706",
                  borderRadius: "10px",
                  padding: "0.75rem 1.5rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#d97706";
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.color = "#d97706";
                }}
              >
                Go to Settings →
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-menu-section" style={{ marginTop: "1rem" }}>
        <h3 style={{
          fontSize: "1.4rem",
          fontWeight: "700",
          marginBottom: "1.5rem",
          color: "#1e293b",
          textShadow: "0 1px 2px rgba(0,0,0,0.05)"
        }}>Management Tools</h3>
        <div className="admin-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1.25rem"
        }}>
          {/* 1. Orders */}
          <div
            className="admin-card"
            onClick={() => setCurrentView("orders")}
            style={{
              position: "relative",
              background: "white",
              padding: "1.75rem",
              borderRadius: "14px",
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              border: "1px solid rgba(102,126,234,0.15)",
              boxShadow: "0 4px 12px rgba(102,126,234,0.08)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 12px 24px rgba(102,126,234,0.2)";
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.borderColor = "rgba(102,126,234,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(102,126,234,0.08)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = "rgba(102,126,234,0.15)";
            }}
          >
            <h4 style={{ marginBottom: ".5rem", color: "#667eea", fontWeight: "700", fontSize: "1.15rem" }}>📦 Orders</h4>
            <p style={{ color: "#64748b", margin: 0, fontSize: "0.95rem" }}>Manage customer orders</p>

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

          {/* 6. Analytics - Basic Analytics UNLOCKED */}
          <div
            className="admin-card"
            onClick={() => setCurrentView("analytics")}
            style={{ position: "relative" }}
          >
            <h4 style={{ marginBottom: ".25rem" }}>📊 Basic Analytics</h4>
            <p style={{ opacity: 0.8, margin: 0 }}>Revenue tracking & business insights</p>
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
            <p style={{ opacity: 0.8, margin: 0 }}>General settings & QR</p>
          </div>
        </div>
      </div>

      {/* Upgrade to Premium Prompt */}
      <div style={{
        marginTop: "3rem",
        padding: "2rem",
        background: "linear-gradient(135deg, #ffd700 0%, #ff6b35 100%)",
        borderRadius: "15px",
        color: "white",
        textAlign: "center"
      }}>
        <h3 style={{ color: "white", marginBottom: "1rem", fontSize: "1.5rem" }}>
          👑 Want Charts & Custom Domain?
        </h3>
        <p style={{ fontSize: "1.1rem", marginBottom: "1.5rem", opacity: 0.9 }}>
          Upgrade to Premium for advanced analytics with charts<br/>
          Plus get a custom domain (yourbusiness.co.za) INCLUDED!
        </p>
        <button
          onClick={() => setCurrentView("settings")}
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
          Upgrade to Premium - R300/month (Only R150 more!)
        </button>
      </div>
    </div>
  );
}
