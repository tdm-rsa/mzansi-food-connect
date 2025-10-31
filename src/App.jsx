// src/App.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { supabase } from "./supabaseClient";

// Views / components you already have
import StoreDesigner from "./designer/StoreDesigner.jsx";
import AnalyticsView from "./components/AnalyticsView.jsx";
import StyledQRCode from "./components/StyledQRCode.jsx";
import MenuManagement from "./components/MenuManagement.jsx";

/* -------------------------------------------------------
   Helper: tiny badge pill component
------------------------------------------------------- */
function Pill({ children, bg = "#ff6b35", color = "#fff" }) {
  return (
    <span
      style={{
        background: bg,
        color,
        borderRadius: "999px",
        fontSize: ".72rem",
        fontWeight: 600,
        padding: ".15rem .5rem",
      }}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------
   Toast helper (DOM injection so it floats above everything)
------------------------------------------------------- */
function showToast(msg, color = "#4CAF50") {
  const toast = document.createElement("div");
  toast.textContent = msg;
  Object.assign(toast.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    background: color,
    color: "#fff",
    padding: "12px 18px",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
    zIndex: 9999,
  });
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

/* -------------------------------------------------------
   Main App
------------------------------------------------------- */
export default function App({ user }) {
  // Core state
  const [currentView, setCurrentView] = useState("dashboard");
  const [storeInfo, setStoreInfo] = useState(null);

  // Data tables
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [liveQueue, setLiveQueue] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // UI state
  const [activeTemplate, setActiveTemplate] = useState("Modern Food");
  const [loading, setLoading] = useState(true);
  const [newOrders, setNewOrders] = useState(0); // badge for new INSERTs
  const [newMsgs, setNewMsgs] = useState(0);     // badge for new customer messages

  const audioReadyUrl = useMemo(
    () => localStorage.getItem("app_notification_url") || "/notification.mp3",
    []
  );
  const audioRef = useRef(null);

  // 🌙 THEME SYSTEM ADDED
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");
  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);
  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.body.classList.toggle("dark", next);
    localStorage.setItem("darkMode", next ? "true" : "false");
  };
  // 🌙 END THEME SYSTEM

  /* -------------------------------------------------------
     Load initial data for the logged-in owner
  ------------------------------------------------------- */
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        // 1) Store for this owner
        const { data: store, error: e1 } = await supabase
          .from("stores")
          .select("*")
          .eq("owner_id", user.id)
          .limit(1)
          .single();

        if (e1 && e1.code !== "PGRST116") throw e1;

        let s = store;
        if (!s) {
          // create a starter store if none
          const { data: created, error: e2 } = await supabase
            .from("stores")
            .insert([
              {
                owner_id: user.id,
                name: "My New Store",
                banner_text: "Welcome!",
                specials_text: "🔥 Opening Specials",
                is_open: true,
                active_template: "Modern Food",
              },
            ])
            .select()
            .single();
          if (e2) throw e2;
          s = created;
        }

        if (!mounted) return;
        setStoreInfo(s);
        setActiveTemplate(s.active_template || "Modern Food");

        // 2) Menu
        const { data: menu } = await supabase
          .from("menu_items")
          .select("*")
          .eq("store_id", s.id)
          .order("created_at", { ascending: true });
        if (!mounted) return;
        setMenuItems(menu || []);

        // 3) Orders
        const { data: allOrders } = await supabase
          .from("orders")
          .select("*")
          .eq("store_id", s.id)
          .order("created_at", { ascending: false });
        if (!mounted) return;
        setOrders(allOrders || []);
        setLiveQueue((allOrders || []).filter((o) => o.status === "ready"));

        // 4) Analytics (optional; your view/materialized view)
        const { data: stats } = await supabase
          .from("analytics")
          .select("*")
          .eq("store_id", s.id)
          .order("created_at", { ascending: false })
          .limit(12);
        if (!mounted) return;
        setAnalytics(stats || []);

        // 5) Notifications (customer messages)
        const { data: notifs } = await supabase
          .from("notifications")
          .select("*")
          .eq("store_id", s.id)
          .order("created_at", { ascending: false });
        if (!mounted) return;
        setNotifications(notifs || []);
      } catch (err) {
        console.error("Load failed:", err.message);
        showToast("⚠️ Failed to load data", "#f44336");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [user]);

  /* -------------------------------------------------------
     Realtime: orders INSERT + UPDATE
     - INSERT: increment newOrders badge, play sound for paid orders
     - UPDATE: keep order rows fresh; push into liveQueue if status ready
  ------------------------------------------------------- */
  useEffect(() => {
    const ch = supabase
      .channel("orders-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const o = payload.new;
          if (storeInfo && o.store_id !== storeInfo.id) return;
          setOrders((prev) => [o, ...prev]);
          setNewOrders((n) => n + 1);

          // Play sound only for paid/online
          if (o.payment_status === "paid" || o.payment_type === "online") {
            try {
              const a = new Audio(audioReadyUrl);
              a.play();
            } catch {}
            showToast(
              `💰 New Order #${o.id?.slice(0, 6) || ""} — R${o.total}`,
              "#ff6b35"
            );
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const u = payload.new;
          if (storeInfo && u.store_id !== storeInfo.id) return;
          setOrders((prev) => prev.map((x) => (x.id === u.id ? u : x)));

          if (u.status === "ready") {
            setLiveQueue((prev) =>
              prev.some((q) => q.id === u.id) ? prev : [...prev, u]
            );
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, [storeInfo, audioReadyUrl]);

  /* -------------------------------------------------------
     Realtime: notifications INSERT
     - INSERT: increment newMsgs badge, play sound and toast
  ------------------------------------------------------- */
  useEffect(() => {
    const ch = supabase
      .channel("notifications-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const n = payload.new;
          if (storeInfo && n.store_id !== storeInfo.id) return;
          setNotifications((prev) => [n, ...prev]);
          setNewMsgs((m) => m + 1);
          try {
            const a = new Audio(audioReadyUrl);
            a.play();
          } catch {}
          showToast(
            `📩 New customer message from ${n.customer_name || "customer"}`,
            "#2196F3"
          );
        }
      )
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, [storeInfo, audioReadyUrl]);

  /* -------------------------------------------------------
     Reset the order/message badge when the tab is opened
  ------------------------------------------------------- */
  useEffect(() => {
    if (currentView === "orders" && newOrders > 0) setNewOrders(0);
    if (currentView === "notifications" && newMsgs > 0) setNewMsgs(0);
  }, [currentView, newOrders, newMsgs]);

  /* -------------------------------------------------------
     Actions: Orders, Menu, Notifications
  ------------------------------------------------------- */
  const refreshMenu = async () => {
    if (!storeInfo?.id) return;
    const { data: menu } = await supabase
      .from("menu_items")
      .select("*")
      .eq("store_id", storeInfo.id)
      .order("created_at", { ascending: true });
    setMenuItems(menu || []);
  };

  const markReady = async (id) => {
    const { error } = await supabase.from("orders").update({ status: "ready" }).eq("id", id);
    if (error) return showToast("⚠️ Could not update order", "#f44336");
    showToast(`✅ Order #${id.slice(0, 6)} marked ready`);
  };

  const sendFetchOrder = async (order) => {
    // Format WhatsApp number (ensure +27 format for SA numbers)
    let phone = order.phone || "";
    phone = phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "");
    if (phone.startsWith("0")) {
      phone = "+27" + phone.substring(1);
    } else if (phone.startsWith("27")) {
      phone = "+" + phone;
    } else if (!phone.startsWith("+")) {
      phone = "+27" + phone;
    }

    const storeUrl = window.location.origin + "/store";
    const orderNum = order.id.slice(0, 8).toUpperCase();
    const msg = encodeURIComponent(
      `🍔 Come fetch your order!\n\n` +
      `Order Number: ${orderNum}\n` +
      `Total: R${order.total}\n\n` +
      `📍 ${storeInfo?.name || "Mzansi Food Connect"}\n\n` +
      `Order again: ${storeUrl}`
    );

    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
    showToast(`✅ Fetch message sent to ${phone}`);
  };

  const addMenuItem = async (item) => {
    const { data, error } = await supabase
      .from("menu_items")
      .insert([{ ...item, store_id: storeInfo.id }])
      .select();
    if (error) return showToast("⚠️ Could not add item", "#f44336");
    setMenuItems((prev) => [...prev, ...(data || [])]);
  };

  const deleteMenuItem = async (id) => {
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) return showToast("⚠️ Delete failed", "#f44336");
    setMenuItems((prev) => prev.filter((m) => m.id !== id));
  };

  const handleResponse = async (notif, replyText) => {
    const { error } = await supabase
      .from("notifications")
      .update({ response: replyText, status: "replied" })
      .eq("id", notif.id);
    if (error) {
      showToast("⚠️ Could not send response", "#f44336");
      return;
    }

    // Format WhatsApp number (ensure +27 format for SA numbers)
    let phone = notif.customer_phone || "";
    phone = phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "");
    if (phone.startsWith("0")) {
      phone = "+27" + phone.substring(1);
    } else if (phone.startsWith("27")) {
      phone = "+" + phone;
    } else if (!phone.startsWith("+")) {
      phone = "+27" + phone;
    }

    const msg = encodeURIComponent(
      `Hi ${notif.customer_name || "there"} 👋\n${replyText}\n\n- ${
        storeInfo?.name || "Mzansi Food Connect"
      }`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, response: replyText, status: "replied" } : n))
    );
    showToast(`✅ Sent reply to ${phone}`);
  };

  const activateTemplate = async (name) => {
    setActiveTemplate(name);
    if (storeInfo?.id) {
      await supabase.from("stores").update({ active_template: name }).eq("id", storeInfo.id);
    }
    showToast(`✅ "${name}" template activated!`);
  };

  /* -------------------------------------------------------
     Admin menu cards
  ------------------------------------------------------- */
  const adminMenu = [
    { id: "webtemplates", title: "🌐 Web Templates", desc: "Choose your website theme" },
    { id: "storedesigner", title: "🎨 Store Designer", desc: "Design your banner, header & sections" },
    { id: "analytics", title: "📊 Analytics", desc: "Business performance & insights" },
    { id: "orders", title: "📦 Orders", desc: "Manage customer orders" },
    { id: "menu", title: "📋 Menu Management", desc: "Add and edit food items" },
    { id: "notifications", title: "🔔 Notifications", desc: "Customer messages & replies" },
    { id: "settings", title: "⚙️ Settings", desc: "General settings & QR" },
  ];

  /* -------------------------------------------------------
     Header
  ------------------------------------------------------- */
  const Header = () => (
    <header className="header">
      <div className="header-content">
        <h1>🌍 Mzansi Food Connect - Owner Portal</h1>
        <p>Business Management System</p>
      </div>

      <div className="user-menu">
        {/* 🌙 THEME TOGGLE BUTTON */}
        <button
          className="btn-secondary"
          onClick={toggleTheme}
          style={{
            border: "1px solid rgba(255,255,255,0.4)",
            background: darkMode ? "#fff" : "rgba(255,255,255,0.1)",
            color: darkMode ? "#222" : "#fff",
            fontWeight: "600",
          }}
        >
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>

        <span className="user-name">{user?.email}</span>
        <audio ref={audioRef} src={audioReadyUrl} preload="none" />
        <button
          className="btn-primary"
          onClick={() => window.open("/store", "_blank")}
          title="Open your public storefront"
          style={{ marginRight: ".75rem" }}
        >
          👁️ View Store
        </button>
        <button
          className="btn-secondary"
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.reload();
          }}
          title="Sign out"
        >
          🚪 Logout
        </button>
      </div>
    </header>
  );

  /* -------------------------------------------------------
     Views
  ------------------------------------------------------- */
  const renderView = () => {
    if (loading) {
      return (
        <div className="template-view">
          <div className="view-header">
            <h2>Loading…</h2>
          </div>
          <p style={{ opacity: 0.8 }}>Fetching your store, menu, and orders from Supabase.</p>
        </div>
      );
    }

    switch (currentView) {
      /* ---------------------- Store Designer ---------------------- */
      case "storedesigner":
        return (
          <StoreDesigner
            onBack={() => setCurrentView("dashboard")}
            menuItems={menuItems}
          />
        );

      /* ---------------------- Web Templates ---------------------- */
      case "webtemplates": {
        const templates = [
          { id: 1, name: "Modern Food", desc: "Clean, minimal theme with vibrant highlights", preview: "🍱" },
          { id: 2, name: "Traditional SA", desc: "Warm, cultural look inspired by shisanyama", preview: "🔥" },
          { id: 3, name: "Fast & Mobile", desc: "Optimized for mobile users and quick orders", preview: "⚡" },
        ];

        return (
          <div className="template-view">
            <div className="view-header">
              <button className="back-btn" onClick={() => setCurrentView("dashboard")}>← Back</button>
              <h2>🌐 Storefront Templates</h2>
              <p>Choose and activate your website look</p>
            </div>

            <div className="templates-management">
              <div className="templates-grid">
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className="template-card"
                    style={{
                      border:
                        t.name === activeTemplate
                          ? "2px solid #4CAF50"
                          : "1px solid rgba(255,255,255,0.2)",
                      position: "relative",
                    }}
                    onClick={() => activateTemplate(t.name)}
                  >
                    {t.name === activeTemplate && (
                      <div
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                        }}
                      >
                        <Pill>Active</Pill>
                      </div>
                    )}
                    <div className="template-preview">
                      <div className="preview-image" style={{ fontSize: "3rem" }}>
                        {t.preview}
                      </div>
                    </div>
                    <div className="template-info">
                      <h4>{t.name}</h4>
                      <p>{t.desc}</p>
                      <div className={`template-status ${t.name === activeTemplate ? "active" : ""}`}>
                        {t.name === activeTemplate ? "Active" : "Inactive"}
                      </div>
                    </div>
                    <div className="template-actions" style={{ marginTop: "1rem" }}>
                      <button
                        className="btn-primary"
                        disabled={t.name === activeTemplate}
                        onClick={() => activateTemplate(t.name)}
                      >
                        {t.name === activeTemplate ? "Active" : "Activate"}
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open("/store", "_blank");
                        }}
                      >
                        Preview
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      /* ---------------------- Orders ---------------------- */
      case "orders":
        return (
          <div className="template-view">
            <div className="view-header">
              <button className="back-btn" onClick={() => setCurrentView("dashboard")}>← Back</button>
              <h2>📦 Orders</h2>
              <p>Manage and mark orders as ready</p>
            </div>

            {orders.length === 0 ? (
              <p>No orders yet.</p>
            ) : (
              <div className="orders-list">
                {orders.map((o) => (
                  <div key={o.id} className="order-management-card">
                    <div className="order-header">
                      <h4>
                        #{o.id.slice(0, 6)} — {o.customer || "Customer"}
                      </h4>
                      <span className={`status-badge ${o.status}`}>{o.status}</span>
                    </div>

                    <p style={{ margin: ".25rem 0", fontSize: "0.85rem", opacity: 0.7 }}>
                      <strong>📅</strong> {new Date(o.created_at).toLocaleString("en-ZA", { 
                        dateStyle: "medium", 
                        timeStyle: "short" 
                      })}
                    </p>
                    <p><strong>Phone:</strong> {o.phone || "N/A"}</p>
                    <p><strong>Total:</strong> R{o.total}</p>
                    {Array.isArray(o.items) && o.items.length > 0 && (
                      <ul style={{ marginTop: ".3rem" }}>
                        {o.items.map((it, idx) => (
                          <li key={idx}>
                            {it.qty || 1} × {it.item || it.name} — R{it.price}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div style={{ marginTop: ".75rem", display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                      {o.status !== "ready" && (
                        <button className="btn-primary" onClick={() => markReady(o.id)}>
                          Mark Ready 🟢
                        </button>
                      )}
                      {o.status === "ready" && o.phone && (
                        <button 
                          className="btn-secondary" 
                          onClick={() => sendFetchOrder(o)}
                          style={{
                            background: "linear-gradient(135deg, #10b981, #059669)",
                            color: "white",
                            border: "none"
                          }}
                        >
                          📩 Send Fetch Order
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      /* ---------------------- Menu ---------------------- */
      case "menu":
        return (
          <MenuManagement
            storeInfo={storeInfo}
            menuItems={menuItems}
            onBack={() => setCurrentView("dashboard")}
            onRefresh={refreshMenu}
          />
        );

      /* ---------------------- Notifications ---------------------- */
      case "notifications":
        return (
          <div className="template-view">
            <div className="view-header">
              <button className="back-btn" onClick={() => setCurrentView("dashboard")}>← Back</button>
              <h2>🔔 Notifications</h2>
              <p>Customer messages from the storefront</p>
            </div>

            {notifications.length === 0 ? (
              <p>No messages yet.</p>
            ) : (
              <div className="orders-list">
                {notifications.map((n) => (
                  <div key={n.id} className="order-management-card">
                    <div className="order-header">
                      <h4>From: {n.customer_name || "Customer"}</h4>
                      <span className={`status-badge ${n.status || "new"}`}>
                        {n.status || "new"}
                      </span>
                    </div>
                    <p style={{ margin: ".25rem 0", fontSize: "0.85rem", opacity: 0.7 }}>
                      <strong>📅</strong> {new Date(n.created_at).toLocaleString("en-ZA", { 
                        dateStyle: "medium", 
                        timeStyle: "short" 
                      })}
                    </p>
                    <p style={{ margin: ".25rem 0" }}>
                      <strong>Phone:</strong> {n.customer_phone}
                    </p>
                    <p style={{ margin: ".25rem 0" }}>
                      <strong>Message:</strong> {n.message}
                    </p>
                    {n.response && (
                      <p style={{ marginTop: ".25rem", opacity: 0.85 }}>
                        <strong>Your reply:</strong> {n.response}
                      </p>
                    )}

                    <div style={{ display: "flex", gap: ".5rem", marginTop: ".75rem", flexWrap: "wrap" }}>
                      <button
                        className="btn-primary"
                        onClick={() => handleResponse(n, "Yes, it's available. You can place your order ✅")}
                      >
                        ✅ Yes — Available
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => handleResponse(n, "Sorry, it is currently unavailable ❌")}
                      >
                        ❌ No — Unavailable
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          const custom = prompt("Type your custom reply:");
                          if (custom && custom.trim().length > 0) handleResponse(n, custom.trim());
                        }}
                      >
                        ✍️ Custom Reply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      /* ---------------------- Analytics ---------------------- */
      case "analytics":
        return (
          <AnalyticsView
            storeInfo={storeInfo}
            onBack={() => setCurrentView("dashboard")}
          />
        );

      /* ---------------------- Settings ---------------------- */
      case "settings":
        return (
          <div className="template-view">
            <div className="view-header">
              <button className="back-btn" onClick={() => setCurrentView("dashboard")}>← Back</button>
              <h2>⚙️ Settings</h2>
              <p>Manage your account and preferences</p>
            </div>

            {/* Dark Mode */}
            <div className="settings-section">
              <h3>🌓 Theme Mode</h3>
              <label style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                <input
                  type="checkbox"
                  defaultChecked={localStorage.getItem("darkMode") === "true"}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    document.body.classList.toggle("dark", enabled);
                    localStorage.setItem("darkMode", String(enabled));
                    setDarkMode(enabled);
                  }}
                />
                Enable Dark Mode
              </label>
            </div>

            {/* Sound source */}
            <div className="settings-section">
              <h3>🔔 Notification Sound</h3>
              <p style={{ marginBottom: ".5rem" }}>
                Paste a direct MP3 URL here, or keep default <code>/notification.mp3</code>.
              </p>
              <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                <input
                  className="design-select"
                  placeholder="https://your-cdn.com/notification.mp3"
                  defaultValue={localStorage.getItem("app_notification_url") || ""}
                  onBlur={(e) => {
                    const v = (e.target.value || "").trim();
                    if (v) {
                      localStorage.setItem("app_notification_url", v);
                      showToast("✅ Sound updated");
                    } else {
                      localStorage.removeItem("app_notification_url");
                      showToast("✅ Using default sound");
                    }
                  }}
                  style={{ minWidth: "320px" }}
                />
                <button className="btn-secondary" onClick={() => audioRef.current?.play()}>
                  ▶️ Test Sound
                </button>
              </div>
            </div>

            {/* QR Code */}
            <div className="settings-section">
              <StyledQRCode storeName={storeInfo?.name || "Mzansi Store"} />
            </div>

            {/* Plans */}
            <div className="settings-section">
              <h3>💰 Subscription Plans</h3>
              <p>Upgrade your store features</p>

              <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
                <div className="plan-card">
                  <h4>Starter (Free)</h4>
                  <p>Default plan for all new stores.</p>
                  <span className="plan-price">R0 / month</span>
                </div>

                <div className="plan-card">
                  <h4>Pro Plan (Subdomain)</h4>
                  <p>
                    Get your own subdomain e.g., <strong>yourstore.mzansifoodconnect.co.za</strong>
                  </p>
                  <span className="plan-price">R89 / month</span>
                  <button
                    onClick={() => window.open("https://paystack.com/pay/mzansi-pro", "_blank")}
                    className="btn-primary"
                  >
                    Upgrade to Pro 🚀
                  </button>
                </div>

                <div className="plan-card">
                  <h4>Premium Plan (Custom Domain)</h4>
                  <p>
                    Bring your own domain (e.g., <strong>www.yourstore.co.za</strong>)
                  </p>
                  <span className="plan-price">R150 / month</span>
                  <button
                    onClick={() => window.open("https://paystack.com/pay/mzansi-premium", "_blank")}
                    className="btn-primary"
                  >
                    Upgrade to Premium 🌍
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      /* ---------------------- Dashboard ---------------------- */
      default:
        return (
          <div className="dashboard">
            <div className="dashboard-header">
              <div>
                <h2>Owner Dashboard 🎯</h2>
                <p>Manage your Mzansi Food Connect business</p>
              </div>
              <div style={{ display: "flex", gap: ".75rem", alignItems: "center" }}>
                {/* Open/Close Toggle */}
                <button
                  className="store-toggle-btn"
                  onClick={async () => {
                    const newState = !storeInfo.is_open;
                    try {
                      const { error } = await supabase
                        .from("stores")
                        .update({ is_open: newState })
                        .eq("id", storeInfo.id);
                      
                      if (error) throw error;
                      
                      setStoreInfo({ ...storeInfo, is_open: newState });
                      showToast(
                        newState ? "✅ Store is now OPEN" : "🔴 Store is now CLOSED",
                        newState ? "#10b981" : "#ef4444"
                      );
                    } catch (err) {
                      showToast("❌ Failed to update store status", "#f44336");
                    }
                  }}
                  style={{
                    background: storeInfo?.is_open 
                      ? "linear-gradient(135deg, #10b981, #059669)" 
                      : "linear-gradient(135deg, #ef4444, #dc2626)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0.75rem 1.25rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: storeInfo?.is_open
                      ? "0 2px 8px rgba(16, 185, 129, 0.3)"
                      : "0 2px 8px rgba(239, 68, 68, 0.3)",
                  }}
                  title={storeInfo?.is_open ? "Click to close store" : "Click to open store"}
                >
                  {storeInfo?.is_open ? "🟢 Store Open" : "🔴 Store Closed"}
                </button>
                
                <button
                  className="btn-primary"
                  onClick={() => window.open("/store", "_blank")}
                >
                  👁️ View Store
                </button>
              </div>
            </div>

            <div className="admin-menu-section">
              <h3>Management Tools</h3>
              <div className="admin-grid">
                {adminMenu.map((item) => (
                  <div
                    key={item.id}
                    className="admin-card"
                    data-id={item.id}
                    onClick={() => setCurrentView(item.id)}
                    style={{ position: "relative" }}
                  >
                    <h4 style={{ marginBottom: ".25rem" }}>{item.title}</h4>
                    <p style={{ opacity: 0.8, margin: 0 }}>{item.desc}</p>

                    {/* Badges */}
                    {item.id === "orders" && newOrders > 0 && (
                      <span
                        className="order-badge"
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          background: "#ff6b35",
                          color: "#fff",
                          borderRadius: "50%",
                          padding: ".25rem .5rem",
                          fontWeight: 700,
                          fontSize: ".8rem",
                        }}
                      >
                        {newOrders}
                      </span>
                    )}

                    {item.id === "notifications" && newMsgs > 0 && (
                      <span
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          background: "#2196F3",
                          color: "#fff",
                          borderRadius: "50%",
                          padding: ".25rem .5rem",
                          fontWeight: 700,
                          fontSize: ".8rem",
                        }}
                      >
                        {newMsgs}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="app">
      <Header />
      <main className="main">{renderView()}</main>
    </div>
  );
}




