// PREMIUM PLAN DASHBOARD - VISUAL REFRESH ONLY (functionality unchanged)
// Premium accounts: advanced analytics, custom domains (coming), templates, WhatsApp API

import { useState } from "react";

export default function PremiumDashboardView({
  storeInfo,
  user,
  setCurrentView,
  newOrders,
  newMsgs,
  supabase
}) {
  const [isOpen, setIsOpen] = useState(storeInfo?.is_open ?? true);

  const toggleStoreStatus = async () => {
    const newState = !isOpen;
    try {
      const { error } = await supabase
        .from("tenants")
        .update({ is_open: newState })
        .eq("id", storeInfo.id);

      if (error) throw error;

      setIsOpen(newState);
      alert(newState ? "✅ Store is now OPEN" : "⛔ Store is now CLOSED");
    } catch (err) {
      alert("⚠️ Failed to update store status");
    }
  };

  const tools = [
    { key: "orders", title: "Orders", desc: "Manage customer orders", icon: "📦", view: "orders", badge: newOrders, badgeColor: "#f97316" },
    { key: "menu", title: "Menu & Products", desc: "Add and edit unlimited food items", icon: "🍽️", view: "menu" },
    { key: "notifications", title: "Customer Messages", desc: "Messages, replies & notifications", icon: "💬", view: "notifications", badge: newMsgs, badgeColor: "#3b82f6" },
    { key: "fetchedorders", title: "Completed Orders", desc: "Ready for pickup & fulfilled", icon: "✅", view: "fetchedorders" },
    { key: "livequeue", title: "Live Queue", desc: "Real-time pickup queue", icon: "⏱️", view: "livequeue" },
    { key: "analytics", title: "Advanced Analytics", desc: "Charts & performance insights", icon: "📊", view: "analytics" },
    { key: "storedesigner", title: "Store Designer", desc: "Brand colors, banners & sections", icon: "🎨", view: "storedesigner" },
    { key: "webtemplates", title: "Web Templates", desc: "All professional templates", icon: "🧩", view: "webtemplates" },
    { key: "settings", title: "Settings & QR", desc: "Payments, QR & custom domain", icon: "⚙️", view: "settings" }
  ];

  return (
    <div className="dashboard premium-dashboard">
      <div className="premium-header">
        <div className="premium-header__row">
          <div className="premium-brand premium-brand--centered">
            <div className="premium-avatar">
              {storeInfo?.profile_picture_url ? (
                <img
                  src={storeInfo.profile_picture_url}
                  alt="Profile"
                />
              ) : (
                <span aria-hidden="true">👑</span>
              )}
            </div>
            <div>
              <p className="premium-eyebrow">Premium Plan</p>
              <h2>{storeInfo?.name || "Premium Store"}</h2>
              <p className="premium-subtitle">Luxury business experience · All features unlocked</p>
            </div>
          </div>
          <div className="premium-actions premium-actions--center">
            <span className={`premium-chip ${isOpen ? "success" : "neutral"}`}>
              {isOpen ? "Open now" : "Currently closed"}
            </span>
            <button className="premium-toggle-btn" onClick={toggleStoreStatus}>
              {isOpen ? "Pause store" : "Open store"}
            </button>
          </div>
        </div>

        <div className="premium-metrics">
          <div className="premium-metric">
            <span className="metric-icon">⚡</span>
            <div>
              <p>New orders today</p>
              <strong>{newOrders || 0}</strong>
            </div>
          </div>
          <div className="premium-metric">
            <span className="metric-icon">💬</span>
            <div>
              <p>New messages</p>
              <strong>{newMsgs || 0}</strong>
            </div>
          </div>
          <div className="premium-metric">
            <span className="metric-icon">🛡️</span>
            <div>
              <p>Premium status</p>
              <strong>All features enabled</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Yoco Warning Banner */}
      {(!storeInfo?.yoco_public_key || !storeInfo?.yoco_secret_key) && (
        <div className="premium-alert">
          <div>
            <strong>Yoco payment keys required</strong>
            <p>
              Add your Yoco API keys in Settings to accept card payments. Customers can see your menu, but cannot pay until keys are added.
            </p>
          </div>
          <button onClick={() => setCurrentView("settings")} className="premium-alert-btn">
            Go to Settings
          </button>
        </div>
      )}

      <div className="admin-menu-section premium-menu">
        <div className="premium-section-header">
          <div>
            <p className="premium-eyebrow">Control center</p>
            <h3>Premium management tools</h3>
            <p className="premium-subtitle">Fast access to orders, analytics, templates, messaging and settings.</p>
          </div>
          <div className="premium-chip subtle">Premium unlocked</div>
        </div>

        <div className="admin-grid premium-grid">
          {tools.map((tool) => (
            <div
              key={tool.key}
              className="admin-card premium-card"
              onClick={() => setCurrentView(tool.view)}
            >
              <div className="premium-card-head">
                <span className="premium-card-icon" aria-hidden="true">{tool.icon}</span>
                <div>
                  <h4>{tool.title}</h4>
                  <p>{tool.desc}</p>
                </div>
              </div>
              {tool.badge > 0 && (
                <span
                  className="premium-badge"
                  style={{ backgroundColor: tool.badgeColor || "#0ea5e9" }}
                >
                  {tool.badge}
                </span>
              )}
              <span className="card-arrow" aria-hidden="true">→</span>
            </div>
          ))}
        </div>
      </div>

      {/* Premium Features Highlight */}
      <div className="premium-highlight">
        <div className="premium-highlight-text">
          <p className="premium-eyebrow">Premium perks</p>
          <h3>Everything is unlocked for your store</h3>
          <p className="premium-subtitle">
            Use advanced analytics with charts, premium templates, WhatsApp automation, and custom domains (coming soon).
          </p>
        </div>
        <div className="premium-feature-grid">
          <div className="premium-feature-card">
            <span>📊</span>
            <strong>Advanced analytics</strong>
            <small>Charts & insights</small>
          </div>
          <div className="premium-feature-card">
            <span>🧩</span>
            <strong>All templates</strong>
            <small>Professional web themes</small>
          </div>
          <div className="premium-feature-card">
            <span>💬</span>
            <strong>WhatsApp API</strong>
            <small>Automated messaging</small>
          </div>
          <div className="premium-feature-card">
            <span>🌍</span>
            <strong>Custom domain</strong>
            <small>Included · coming soon</small>
          </div>
        </div>
      </div>
    </div>
  );
}
