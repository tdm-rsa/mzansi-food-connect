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
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
    }}>
      <div className="dashboard-header" style={{
        background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        borderRadius: "20px",
        padding: "3rem",
        marginBottom: "2rem",
        boxShadow: "0 20px 60px rgba(240,147,251,0.4), 0 0 0 1px rgba(255,255,255,0.1)",
        color: "white",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "radial-gradient(circle at top right, rgba(255,215,0,0.3), transparent 50%)",
          pointerEvents: "none"
        }}></div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{
            fontSize: "2rem",
            marginBottom: "0.5rem",
            fontWeight: "800",
            letterSpacing: "-0.5px",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            color: "white",
            textShadow: "0 2px 10px rgba(0,0,0,0.2)"
          }}>
            {storeInfo?.profile_picture_url ? (
              <img
                src={storeInfo.profile_picture_url}
                alt="Profile"
                style={{
                  width: "55px",
                  height: "55px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "4px solid rgba(255,215,0,0.6)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.3), 0 0 0 2px rgba(255,255,255,0.2)"
                }}
              />
            ) : (
              <span style={{ fontSize: "2.8rem" }}>👑</span>
            )}
          </h2>
          <p style={{
            marginBottom: "0",
            fontSize: "1.05rem",
            color: "rgba(255,215,0,0.95)",
            fontWeight: "600",
            textShadow: "0 1px 3px rgba(0,0,0,0.2)"
          }}>
            👑 Premium Plan • Luxury Business Experience
          </p>
        </div>
        <div style={{ display: "flex", gap: ".75rem", alignItems: "center", position: "relative", zIndex: 1 }}>
          {/* Open/Close Toggle */}
          <button
            className="store-toggle-btn"
            onClick={toggleStoreStatus}
            style={{
              background: isOpen
                ? "linear-gradient(135deg, #ffd700, #ffed4e)"
                : "linear-gradient(135deg, #ef4444, #dc2626)",
              color: isOpen ? "#1a1a2e" : "white",
              border: "2px solid rgba(255,255,255,0.3)",
              borderRadius: "12px",
              padding: "1rem 1.6rem",
              fontWeight: "800",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: isOpen
                ? "0 8px 24px rgba(255,215,0,0.4)"
                : "0 8px 24px rgba(239,68,68,0.4)",
              textShadow: isOpen ? "0 1px 2px rgba(0,0,0,0.1)" : "none"
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
          borderRadius: "16px",
          padding: "1.75rem",
          marginBottom: "1.5rem",
          boxShadow: "0 12px 32px rgba(245, 158, 11, 0.3), 0 0 0 1px rgba(255,215,0,0.2)"
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem" }}>
            <div style={{ fontSize: "3rem", flexShrink: 0 }}>⚠️</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: "0 0 0.5rem 0", color: "#78350f", fontWeight: "800", fontSize: "1.35rem" }}>
                Yoco Payment Keys Required
              </h3>
              <p style={{ margin: "0 0 1rem 0", color: "#92400e", fontSize: "1rem", lineHeight: "1.6" }}>
                To accept card payments, you need to add your Yoco API keys in Settings. Without these keys, customers can only see your menu but cannot complete purchases.
              </p>
              <button
                onClick={() => setCurrentView("settings")}
                style={{
                  background: "white",
                  color: "#d97706",
                  border: "2px solid #d97706",
                  borderRadius: "12px",
                  padding: "0.85rem 1.75rem",
                  fontWeight: "800",
                  cursor: "pointer",
                  fontSize: "1rem",
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#d97706";
                  e.currentTarget.style.color = "white";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.color = "#d97706";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
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
          fontSize: "1.5rem",
          fontWeight: "800",
          marginBottom: "1.75rem",
          color: "white",
          textShadow: "0 2px 8px rgba(0,0,0,0.3)",
          background: "linear-gradient(135deg, #ffd700, #ff6b35)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}>⚡ Premium Management Tools</h3>
        <div className="admin-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1.5rem"
        }}>
          {/* 1. Orders */}
          <div
            className="admin-card"
            onClick={() => setCurrentView("orders")}
            style={{
              position: "relative",
              background: "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))",
              padding: "2rem",
              borderRadius: "16px",
              cursor: "pointer",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              border: "1px solid rgba(255,215,0,0.2)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
              backdropFilter: "blur(20px)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 16px 48px rgba(255,215,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)";
              e.currentTarget.style.transform = "translateY(-6px) scale(1.02)";
              e.currentTarget.style.borderColor = "rgba(255,215,0,0.5)";
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,107,53,0.1))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)";
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.borderColor = "rgba(255,215,0,0.2)";
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))";
            }}
          >
            <h4 style={{
              marginBottom: ".5rem",
              background: "linear-gradient(135deg, #ffd700, #ff6b35)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontWeight: "800",
              fontSize: "1.2rem"
            }}>📦 Orders</h4>
            <p style={{ color: "rgba(255,255,255,0.9)", margin: 0, fontSize: "0.95rem" }}>Manage customer orders</p>

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
