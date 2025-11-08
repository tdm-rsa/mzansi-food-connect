// src/App.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { supabase } from "./supabaseClient";
import { getPlanFeatures, canAccessFeature, isPlanActive, getDaysRemaining } from "./utils/planFeatures";
import { sendOrderConfirmation, sendOrderReady, sendOrderFetched, sendWhatsAppMessage } from "./utils/whatsapp";
import logo from "./images/logo.png";

// Views / components you already have
import StoreDesigner from "./designer/StoreDesigner.jsx";
import AnalyticsView from "./components/AnalyticsView.jsx";
import StarterAnalytics from "./components/StarterAnalytics.jsx";
import ProAnalytics from "./components/ProAnalytics.jsx";
import PremiumAnalytics from "./components/PremiumAnalytics.jsx";
import StyledQRCode from "./components/StyledQRCode.jsx";
import MenuManagement from "./components/MenuManagement.jsx";

// SEPARATE DASHBOARD COMPONENTS FOR EACH PLAN - NO MIXING!
import StarterDashboardView from "./components/StarterDashboardView.jsx";
import ProDashboardView from "./components/ProDashboardView.jsx";
import PremiumDashboardView from "./components/PremiumDashboardView.jsx";

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
  const [ordersToShow, setOrdersToShow] = useState(10); // pagination for orders
  const [estimatingOrder, setEstimatingOrder] = useState(null); // order being estimated
  const [selectedDuration, setSelectedDuration] = useState(null); // selected duration

  const audioReadyUrl = useMemo(
    () => localStorage.getItem("app_notification_url") || "/sounds/notification.mp3",
    []
  );
  const audioRef = useRef(null);
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Paystack settings states
  const [paystackPublicKey, setPaystackPublicKey] = useState("");
  const [paystackSecretKey, setPaystackSecretKey] = useState("");
  const [savingPaystack, setSavingPaystack] = useState(false);

  // Enable audio on first user interaction
  useEffect(() => {
    const enableAudio = () => {
      if (!audioEnabled) {
        const audio = new Audio(audioReadyUrl);
        audio.volume = 0.01;
        audio.play().then(() => {
          audio.pause();
          setAudioEnabled(true);
          console.log('✅ Audio enabled');
        }).catch(() => {
          console.log('⚠️ Audio still blocked');
        });
      }
    };
    
    document.addEventListener('click', enableAudio, { once: true });
    return () => document.removeEventListener('click', enableAudio);
  }, [audioReadyUrl, audioEnabled]);

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
     Load Paystack keys when store info changes
  ------------------------------------------------------- */
  useEffect(() => {
    if (storeInfo) {
      setPaystackPublicKey(storeInfo.paystack_public_key || "");
      setPaystackSecretKey(storeInfo.paystack_secret_key || "");
    }
  }, [storeInfo]);

  /* -------------------------------------------------------
     Load initial data for the logged-in owner
  ------------------------------------------------------- */
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);

        console.log('🔍 LOGIN: Loading store for user:', user.id, user.email);

        // First check if there are multiple stores for this user
        const { data: allStores } = await supabase
          .from("stores")
          .select("*")
          .eq("owner_id", user.id);

        console.log('🔍 LOGIN: All stores for user:', allStores);

        if (allStores && allStores.length > 1) {
          console.warn('⚠️ MULTIPLE STORES FOUND! Taking most recent one');
        }

        // 1) Store for this owner - GET MOST RECENT ONE
        const { data: store, error: e1 } = await supabase
          .from("stores")
          .select("*")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        console.log('📦 LOGIN: Store query result:', {
          found: !!store,
          error: e1,
          storePlan: store?.plan,
          storeId: store?.id,
          storeName: store?.name
        });

        if (e1 && e1.code !== "PGRST116") throw e1;

        let s = store;
        if (!s) {
          console.warn('⚠️ LOGIN: No store found! Creating default trial store');

          // 🔥 FIX: Generate unique slug
          const uniqueSlug = `my-new-store-${Math.random().toString(36).substring(2, 8)}`;

          // create a starter store if none
          const { data: created, error: e2 } = await supabase
            .from("stores")
            .insert([
              {
                owner_id: user.id,
                name: "My New Store",
                slug: uniqueSlug, // 🔥 FIX: Add slug
                banner_text: "Welcome!",
                specials_text: "🔥 Opening Specials",
                is_open: true,
                active_template: "Modern Food",
                plan: "trial", // Default to trial plan
                plan_started_at: new Date().toISOString(),
                plan_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
              },
            ])
            .select()
            .single();
          if (e2) throw e2;
          s = created;
          console.log('✅ LOGIN: Created new trial store with slug:', uniqueSlug);
        } else {
          console.log('✅ LOGIN: Found existing store with plan:', s.plan);

          // 🔥 FIX: If existing store has no slug, generate one now
          if (!s.slug) {
            console.warn('⚠️ Store has no slug! Generating one now...');
            const baseSlug = s.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '');
            const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`;

            const { error: slugError } = await supabase
              .from("stores")
              .update({ slug: uniqueSlug })
              .eq("id", s.id);

            if (slugError) {
              console.error('❌ Failed to add slug:', slugError);
            } else {
              s.slug = uniqueSlug;
              console.log('✅ Added slug to existing store:', uniqueSlug);
            }
          }
        }

        if (!mounted) return;

        // Trim whitespace from plan value to prevent comparison issues
        if (s && s.plan) {
          s.plan = s.plan.trim();
        }

        console.log('🔍 Store loaded:', s);
        console.log('📋 Store plan:', s?.plan);
        console.log('📋 Store plan TYPE:', typeof s?.plan);
        console.log('📋 Store plan LENGTH:', s?.plan?.length);
        console.log('📋 Store plan === "trial":', s?.plan === 'trial');
        console.log('📋 Store plan === "pro":', s?.plan === 'pro');
        console.log('📋 Store plan === "premium":', s?.plan === 'premium');
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
        // Show all ready orders (unfetched)
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
          console.log('🔔 NEW ORDER RECEIVED:', o);
          if (storeInfo && o.store_id !== storeInfo.id) {
            console.log('❌ Order not for this store');
            return;
          }
          setOrders((prev) => [o, ...prev]);
          setNewOrders((n) => {
            console.log(`📊 Badge count: ${n} → ${n + 1}`);
            return n + 1;
          });

          // Play sound for all paid orders
          if (o.payment_status === "paid") {
            console.log('🔊 Playing order notification sound...');
            try {
              const a = new Audio(audioReadyUrl);
              a.volume = 0.7;
              a.play()
                .then(() => console.log('✅ Sound played successfully'))
                .catch((error) => {
                  console.warn('⚠️ Order sound blocked by browser:', error);
                  console.log('💡 Click anywhere on the page to enable sound');
                });
            } catch (err) {
              console.error('❌ Order sound error:', err);
            }
            showToast(
              `💰 New Order #${o.order_number || o.id?.slice(0, 6) || ""} — R${o.total}`,
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
          console.log('💬 NEW CUSTOMER MESSAGE RECEIVED:', n);
          if (storeInfo && n.store_id !== storeInfo.id) {
            console.log('❌ Message not for this store');
            return;
          }
          setNotifications((prev) => [n, ...prev]);
          setNewMsgs((m) => {
            console.log(`📊 Messages badge count: ${m} → ${m + 1}`);
            return m + 1;
          });

          // Play notification sound
          console.log('🔊 Playing customer message notification sound...');
          try {
            const a = new Audio(audioReadyUrl);
            a.volume = 0.7;
            a.play()
              .then(() => console.log('✅ Message sound played successfully'))
              .catch((error) => {
                console.warn('⚠️ Message sound blocked by browser:', error);
                console.log('💡 Click anywhere on the page to enable sound');
              });
          } catch (err) {
            console.error('❌ Message sound error:', err);
          }

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
    if (currentView === "orders") {
      if (newOrders > 0) setNewOrders(0);
      setOrdersToShow(10); // Reset pagination when entering orders view
    }
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
    try {
      // Find the order
      const updatedOrder = orders.find(o => o.id === id);
      if (!updatedOrder) {
        showToast("⚠️ Order not found", "#f44336");
        return;
      }

      // Update database status to ready
      const { error } = await supabase
        .from("orders")
        .update({ status: "ready" })
        .eq("id", id);

      if (error && !error.message?.includes('updated_at') && error.code !== '42703') {
        console.error("Mark Ready Error:", error);
        throw error;
      }

      // Format phone number
      let phone = updatedOrder.phone || "";
      phone = phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "");
      if (phone.startsWith("0")) phone = "27" + phone.substring(1);
      else if (phone.startsWith("+27")) phone = phone.substring(1);
      else if (!phone.startsWith("27")) phone = "27" + phone;

      // Send WhatsApp message via Ultramsg
      const orderNum = updatedOrder.order_number || updatedOrder.id.slice(0, 8).toUpperCase();
      const customerName = updatedOrder.customer_name || updatedOrder.customer || "there";
      const storeName = storeInfo?.name || "Mzansi Food Connect";

      const result = await sendOrderReady(phone, customerName, orderNum, storeName, storeInfo?.slug);

      // Update local state
      setOrders((prev) =>
        prev.map((o) => o.id === id ? { ...o, status: "ready" } : o)
      );
      setLiveQueue((prev) =>
        prev.some((q) => q.id === id) ? prev : [...prev, { ...updatedOrder, status: "ready" }]
      );

      if (result.success) {
        showToast(`✅ Order marked ready! WhatsApp sent to ${customerName}`, "#10b981");
      } else {
        showToast(`✅ Order marked ready (WhatsApp: ${result.error || 'not configured'})`, "#10b981");
      }
    } catch (err) {
      console.error("Mark Ready Failed:", err.message);
      showToast("⚠️ Could not update order: " + err.message, "#f44336");
    }
  };

  const sendEstimatedDuration = async () => {
    if (!estimatingOrder || !selectedDuration) {
      showToast("⚠️ Please select a duration", "#f44336");
      return;
    }

    try {
      // Update order with estimated time and set to confirmed
      const { error } = await supabase
        .from("orders")
        .update({
          status: "confirmed",
          estimated_time: selectedDuration
        })
        .eq("id", estimatingOrder.id);

      if (error && !error.message?.includes('updated_at')) {
        throw error;
      }

      // Format phone
      let phone = estimatingOrder.phone || "";
      phone = phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "");
      if (phone.startsWith("0")) phone = "27" + phone.substring(1);
      else if (phone.startsWith("+27")) phone = phone.substring(1);
      else if (!phone.startsWith("27")) phone = "27" + phone;

      // Send confirmation message via Ultramsg
      const orderNum = estimatingOrder.order_number || estimatingOrder.id.slice(0, 8).toUpperCase();
      const customerName = estimatingOrder.customer_name || estimatingOrder.customer || "there";
      const storeName = storeInfo?.name || "Mzansi Food Connect";
      const totalAmount = estimatingOrder.total;

      const result = await sendOrderConfirmation(
        phone,
        customerName,
        orderNum,
        storeName,
        selectedDuration,
        totalAmount,
        storeInfo?.slug
      );

      // Update local state
      setOrders((prev) => prev.map(o =>
        o.id === estimatingOrder.id ? { ...o, status: "confirmed", estimated_time: selectedDuration } : o
      ));
      setLiveQueue((prev) => prev.map(o =>
        o.id === estimatingOrder.id ? { ...o, status: "confirmed", estimated_time: selectedDuration } : o
      ));

      const timeText = selectedDuration >= 60
        ? `${Math.floor(selectedDuration / 60)} hour${selectedDuration >= 120 ? 's' : ''}`
        : `${selectedDuration} minutes`;

      if (result.success) {
        showToast(`✅ Order confirmed! WhatsApp sent to ${customerName}`, "#10b981");
      } else {
        showToast(`✅ Order confirmed (WhatsApp: ${result.error || 'not configured'})`, "#10b981");
      }

      setEstimatingOrder(null);
      setSelectedDuration(null);
    } catch (err) {
      console.error('Send estimated duration failed:', err);
      showToast("⚠️ Failed: " + err.message, "#f44336");
    }
  };

  const markOrderDone = async (orderId) => {
    try {
      // Find the order
      const completedOrder = orders.find(o => o.id === orderId);

      // Update order status to completed (fetched)
      const { error } = await supabase
        .from("orders")
        .update({ status: "completed" })
        .eq("id", orderId);

      if (error && !error.message?.includes('updated_at')) {
        throw error;
      }

      // Send thank you message via WhatsApp
      if (completedOrder && completedOrder.phone) {
        let phone = completedOrder.phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "");
        if (phone.startsWith("0")) phone = "27" + phone.substring(1);
        else if (phone.startsWith("+27")) phone = phone.substring(1);
        else if (!phone.startsWith("27")) phone = "27" + phone;

        const orderNum = completedOrder.order_number || completedOrder.id.slice(0, 8).toUpperCase();
        const customerName = completedOrder.customer_name || completedOrder.customer || "there";
        const storeName = storeInfo?.name || "Mzansi Food Connect";

        const result = await sendOrderFetched(phone, customerName, orderNum, storeName, storeInfo?.slug);

        if (!result.success) {
          console.warn('WhatsApp thank you message failed:', result.error);
        }
      }

      // Update local state
      setOrders((prev) =>
        prev.map((o) => o.id === orderId ? { ...o, status: "completed" } : o)
      );
      setLiveQueue((prev) => prev.filter((q) => q.id !== orderId));

      showToast("✅ Order marked as fetched! Thank you message sent", "#10b981");
    } catch (err) {
      console.error('Mark done failed:', err);
      showToast("⚠️ Failed to mark as done: " + err.message, "#f44336");
    }
  };

  const sendFetchOrder = async (order) => {
    try {
      // Format WhatsApp number (ensure +27 format for SA numbers)
      let phone = order.phone || "";
      // Remove all spaces and non-digit characters except +
      phone = phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "");
      
      // Convert to +27 format
      if (phone.startsWith("0")) {
        phone = "+27" + phone.substring(1);
      } else if (phone.startsWith("27") && !phone.startsWith("+27")) {
        phone = "+" + phone;
      } else if (!phone.startsWith("+")) {
        phone = "+27" + phone;
      }
      
      console.log('Formatted phone:', phone);

      // Build WhatsApp message
      const storeUrl = window.location.origin + "/store";
      const orderNum = order.id.slice(0, 8).toUpperCase();
      
      // Build message text
      const messageText = 
        `🍔 Come fetch your order!\n\n` +
        `Order Number: ${orderNum}\n` +
        `Total: R${order.total}\n\n` +
        `📍 ${storeInfo?.name || "Mzansi Food Connect"}\n\n` +
        `Order again: ${storeUrl}`;
      
      const msg = encodeURIComponent(messageText);
      const whatsappUrl = `https://wa.me/${phone}?text=${msg}`;
      
      console.log('WhatsApp URL:', whatsappUrl);

      // Open WhatsApp
      window.open(whatsappUrl, "_blank");
      
      // Update order status to completed
      const { error } = await supabase
        .from("orders")
        .update({ status: "completed" })
        .eq("id", order.id);
      
      if (error && !error.message?.includes('updated_at')) {
        console.error("Status update error:", error);
      }
      
      // Update local state
      setOrders((prev) => 
        prev.map((o) => o.id === order.id ? { ...o, status: "completed" } : o)
      );
      setLiveQueue((prev) => prev.filter((q) => q.id !== order.id));
      
      showToast(`✅ Fetch message sent to ${phone}`, "#10b981");
    } catch (err) {
      console.error('Send fetch order failed:', err);
      showToast("⚠️ Failed to send message: " + err.message, "#f44336");
    }
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
    try {
      // Update notification in database - only update fields that exist
      const { error } = await supabase
        .from("notifications")
        .update({
          response: replyText,
          status: "replied"
        })
        .eq("id", notif.id);

      if (error) {
        console.error("Handle Response Error:", error);
        throw error;
      }

      // Update local state immediately
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, response: replyText, status: "replied" } : n))
      );

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

      // Send WhatsApp message via API instead of opening window
      const message = `Hi ${notif.customer_name || "there"} 👋\n${replyText}\n\n- ${storeInfo?.name || "Mzansi Food Connect"}`;

      const result = await sendWhatsAppMessage(phone, message);

      if (result.success) {
        // Play success sound
        if (audioRef.current && audioEnabled) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(err => console.log('Audio play failed:', err));
        }
        showToast(`✅ Reply sent to ${notif.customer_name || phone}`, "#10b981");
      } else {
        showToast(`⚠️ Reply sent but WhatsApp failed: ${result.error}`, "#f59e0b");
      }
    } catch (err) {
      console.error("Handle Response Failed:", err.message);
      showToast("⚠️ Could not send response: " + err.message, "#f44336");
    }
  };

  const dismissNotification = async (id) => {
    try {
      // Just delete the notification instead of updating
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);
      
      if (error) {
        console.error("Delete error:", error);
        throw error;
      }
      
      // Update local state
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      showToast("✅ Notification dismissed", "#10b981");
    } catch (err) {
      console.error("Dismiss failed:", err.message);
      showToast("⚠️ Could not dismiss: " + err.message, "#f44336");
    }
  };

  const activateTemplate = async (name) => {
    setActiveTemplate(name);
    if (storeInfo?.id) {
      await supabase.from("stores").update({ active_template: name }).eq("id", storeInfo.id);
    }
    showToast(`✅ "${name}" template activated!`);
  };

  /* -------------------------------------------------------
     Paystack settings functions
  ------------------------------------------------------- */
  const handleSavePaystackKeys = async () => {
    if (!paystackPublicKey.trim() || !paystackSecretKey.trim()) {
      showToast("⚠️ Please enter both Paystack keys", "#f59e0b");
      return;
    }

    setSavingPaystack(true);

    try {
      const { error } = await supabase
        .from("stores")
        .update({
          paystack_public_key: paystackPublicKey.trim(),
          paystack_secret_key: paystackSecretKey.trim(),
        })
        .eq("id", storeInfo.id);

      if (error) throw error;

      showToast("✅ Paystack keys saved successfully!", "#10b981");

      // Update local store info
      setStoreInfo({
        ...storeInfo,
        paystack_public_key: paystackPublicKey.trim(),
        paystack_secret_key: paystackSecretKey.trim(),
      });
    } catch (error) {
      console.error("Save Paystack keys failed:", error);
      showToast("❌ Failed to save Paystack keys", "#ef4444");
    } finally {
      setSavingPaystack(false);
    }
  };

  /* -------------------------------------------------------
     Plan features for analytics and other components
  ------------------------------------------------------- */
  const planFeatures = getPlanFeatures(storeInfo?.plan);
  console.log('🎯 Current plan from storeInfo:', storeInfo?.plan);
  console.log('✨ Plan features:', planFeatures);

  /* -------------------------------------------------------
     Header
  ------------------------------------------------------- */
  const Header = () => (
    <header className="header">
      <div className="header-content">
        <h1 style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <img src={logo} alt="Mzansi Food Connect" style={{ width: "40px", height: "40px" }} />
          Mzansi Food Connect - Owner Portal
        </h1>
        <p>Business Management System</p>
      </div>

      <div className="user-menu" style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.75rem"
      }}>
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

        {/* Profile Section - Centered */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          minWidth: "fit-content"
        }}>
          {/* Plan Badge */}
          {storeInfo && (
            <div style={{
              background: storeInfo.plan === 'pro'
                ? "linear-gradient(135deg, #667eea, #764ba2)"
                : storeInfo.plan === 'premium'
                  ? "linear-gradient(135deg, #ffd700, #ff6b35)"
                  : "linear-gradient(135deg, #94a3b8, #64748b)",
              color: "white",
              padding: "0.65rem 1.25rem",
              borderRadius: "25px",
              fontSize: "1rem",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              boxShadow: "0 3px 12px rgba(0, 0, 0, 0.3)",
              border: "2px solid rgba(255, 255, 255, 0.3)"
            }}>
              {storeInfo.plan === 'pro' ? '🚀 Pro' : storeInfo.plan === 'premium' ? '👑 Premium' : '📦 Starter'}
            </div>
          )}
          {/* Owner Name */}
          <span className="user-name" style={{ textAlign: "center" }}>
            {storeInfo?.owner_name || user?.email?.split('@')[0] || 'User'}
          </span>
        </div>

        <audio ref={audioRef} src={audioReadyUrl} preload="none" />

        <button
          className="btn-primary"
          onClick={() => {
            const url = storeInfo?.slug
              ? `https://${storeInfo.slug}.mzansifoodconnect.app`
              : "/store";
            window.open(url, "_blank");
          }}
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
          style={{ fontSize: "0.85rem" }}
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
          <p style={{ opacity: 0.8 }}>Loading...</p>
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
            storeInfo={storeInfo}
          />
        );

      /* ---------------------- Web Templates ---------------------- */
      case "webtemplates": {
        const templates = [
          { id: 1, name: "Modern Food", desc: "Clean, minimal theme with vibrant highlights", preview: "🍱" },
          { id: 2, name: "Traditional SA", desc: "Warm, cultural look inspired by shisanyama", preview: "🔥" },
          { id: 3, name: "Fast & Mobile", desc: "Optimized for mobile users and quick orders", preview: "⚡" },
        ];

        // Check which templates are available for current plan
        const allowedTemplates = planFeatures.templates || ['Modern Food'];
        const isTemplateLocked = (templateName) => !allowedTemplates.includes(templateName);

        return (
          <div className="template-view">
            <div className="view-header">
              <button className="back-btn" onClick={() => setCurrentView("dashboard")}>← Back</button>
              <h2>🌐 Storefront Templates</h2>
              <p>Choose and activate your website look</p>
            </div>

            {/* Plan badge showing template access */}
            <div style={{
              textAlign: "center",
              padding: "1rem",
              background: "rgba(102, 126, 234, 0.1)",
              borderRadius: "10px",
              marginBottom: "2rem"
            }}>
              <p style={{ margin: 0, color: "#667eea", fontWeight: "600" }}>
                {storeInfo?.plan === 'trial' && '📦 Free Trial: 1 Template Available'}
                {storeInfo?.plan === 'pro' && '🚀 Pro Plan: 3 Templates Available'}
                {storeInfo?.plan === 'premium' && '👑 Premium Plan: All Templates Available'}
              </p>
            </div>

            <div className="templates-management">
              <div className="templates-grid">
                {templates.map((t) => {
                  const locked = isTemplateLocked(t.name);

                  return (
                    <div
                      key={t.id}
                      className="template-card"
                      style={{
                        border: t.name === activeTemplate
                          ? "2px solid #4CAF50"
                          : locked
                            ? "1px solid rgba(255,107,53,0.3)"
                            : "1px solid rgba(255,255,255,0.2)",
                        position: "relative",
                        opacity: locked ? 0.6 : 1,
                      }}
                      onClick={() => !locked && activateTemplate(t.name)}
                    >
                      {/* Locked overlay */}
                      {locked && (
                        <div
                          style={{
                            position: "absolute",
                            top: 10,
                            left: 10,
                            background: "linear-gradient(135deg, #ff6b35 0%, #e55a28 100%)",
                            color: "white",
                            padding: "0.5rem 1rem",
                            borderRadius: "20px",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            zIndex: 10,
                          }}
                        >
                          🔒 {storeInfo?.plan === 'trial' ? 'Pro' : 'Premium'} Only
                        </div>
                      )}

                      {t.name === activeTemplate && !locked && (
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
                        <div className={`template-status ${t.name === activeTemplate ? "active" : locked ? "locked" : ""}`}>
                          {locked ? "🔒 Locked" : t.name === activeTemplate ? "Active" : "Inactive"}
                        </div>
                      </div>

                      <div className="template-actions" style={{ marginTop: "1rem" }}>
                        {locked ? (
                          <button
                            className="btn-primary"
                            style={{
                              background: "linear-gradient(135deg, #ff6b35 0%, #e55a28 100%)",
                              border: "none"
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentView("settings");
                            }}
                          >
                            Upgrade to Unlock
                          </button>
                        ) : (
                          <>
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
                                const url = storeInfo?.slug
                                  ? `https://${storeInfo.slug}.mzansifoodconnect.app`
                                  : "/store";
                                window.open(url, "_blank");
                              }}
                            >
                              Preview
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upgrade prompt for locked templates */}
            {(storeInfo?.plan === 'trial' || storeInfo?.plan === 'pro') && (
              <div style={{
                textAlign: "center",
                padding: "2rem",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: "15px",
                marginTop: "2rem",
                color: "white"
              }}>
                <h3 style={{ color: "white", marginBottom: "1rem" }}>
                  {storeInfo?.plan === 'trial' ? '🚀 Want More Templates?' : '👑 Unlock Premium Templates'}
                </h3>
                <p style={{ color: "rgba(255,255,255,0.9)", marginBottom: "1.5rem" }}>
                  {storeInfo?.plan === 'trial'
                    ? 'Upgrade to Pro for 3 professional templates, or Premium for advanced analytics'
                    : 'Upgrade to Premium for advanced analytics with charts'}
                </p>
                {storeInfo?.plan === 'trial' && (
                  <button
                    className="btn-primary"
                    style={{
                      background: "white",
                      color: "#667eea",
                      marginRight: "1rem",
                      border: "none"
                    }}
                    onClick={() => setCurrentView("settings")}
                  >
                    Upgrade to Pro - R150/month
                  </button>
                )}
                <button
                  className="btn-primary"
                  style={{
                    background: "white",
                    color: "#764ba2",
                    border: "none"
                  }}
                  onClick={() => setCurrentView("settings")}
                >
                  {storeInfo?.plan === 'trial' ? 'Upgrade to Premium - R300/month' : 'Upgrade to Premium - R300/month'}
                </button>
              </div>
            )}
          </div>
        );
      }

      /* ---------------------- Live Queue ---------------------- */
      case "livequeue":
        const queueOrders = orders.filter(o => o.status === "pending" || o.status === "confirmed" || o.status === "ready");
        
        return (
          <div className="template-view">
            <div className="view-header">
              <button className="back-btn" onClick={() => setCurrentView("dashboard")}>← Back</button>
              <h2>🕒 Live Order Queue</h2>
              <p>{queueOrders.length} orders waiting</p>
            </div>

            {queueOrders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: darkMode ? "#cbd5e1" : "#6b7280" }}>
                <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎉</div>
                <h3>All caught up!</h3>
                <p>No pending orders at the moment</p>
              </div>
            ) : (
              <div className="orders-list">
                {queueOrders.map((o) => (
                  <div key={o.id} className="order-management-card" style={{ background: "linear-gradient(135deg, #fff7ed, #ffffff)" }}>
                    <div className="order-header">
                      <h4>#{o.order_number || o.id.slice(0, 6)} — {o.customer_name || o.customer || "Customer"}</h4>
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
                      {o.status === "pending" && o.phone && (
                        <button 
                          className="btn-primary" 
                          onClick={() => {
                            setEstimatingOrder(o);
                            setSelectedDuration(null);
                          }}
                          style={{
                            background: "linear-gradient(135deg, #f59e0b, #d97706)",
                            color: "white"
                          }}
                        >
                          ⏱️ Set Estimated Time
                        </button>
                      )}
                      {o.status === "confirmed" && o.estimated_time && (
                        <>
                          <span style={{
                            padding: "0.5rem 0.75rem",
                            background: "linear-gradient(135deg, #10b981, #059669)",
                            color: "white",
                            borderRadius: "8px",
                            fontSize: "0.85rem",
                            fontWeight: "600"
                          }}>
                            ✅ Confirmed - {o.estimated_time >= 60 ? `${Math.floor(o.estimated_time / 60)}h` : `${o.estimated_time}min`}
                          </span>
                          <button 
                            className="btn-primary" 
                            onClick={() => markReady(o.id)}
                            style={{
                              background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                              color: "white"
                            }}
                          >
                            📩 Mark Ready & Send Fetch
                          </button>
                        </>
                      )}
                      {o.status === "ready" && (
                        <div style={{ width: "100%" }}>
                          <p style={{ 
                            margin: "0 0 0.5rem 0", 
                            fontSize: "0.85rem", 
                            fontWeight: "600", 
                            color: "#059669",
                            textAlign: "center"
                          }}>
                            ☝️ Click Done when order is fetched
                          </p>
                          <button 
                            className="btn-secondary" 
                            onClick={() => markOrderDone(o.id)}
                            style={{
                              background: "linear-gradient(135deg, #10b981, #059669)",
                              color: "white",
                              border: "none",
                              width: "100%"
                            }}
                          >
                            ✅ Done
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      /* ---------------------- Orders ---------------------- */
      case "orders":
        const displayedOrders = orders.slice(0, ordersToShow);
        const hasMoreOrders = orders.length > ordersToShow;
        
        return (
          <div className="template-view">
            <div className="view-header">
              <button className="back-btn" onClick={() => setCurrentView("dashboard")}>← Back</button>
              <h2>📦 Orders</h2>
              <p>Showing {displayedOrders.length} of {orders.length} orders</p>
            </div>

            {orders.length === 0 ? (
              <p>No orders yet.</p>
            ) : (
              <>
                <div className="orders-list">
                  {displayedOrders.map((o) => (
                  <div key={o.id} className="order-management-card">
                    <div className="order-header">
                      <h4>
                        #{o.order_number || o.id.slice(0, 6)} — {o.customer_name || o.customer || "Customer"}
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
                      {o.status === "pending" && o.phone && (
                        <button 
                          className="btn-primary" 
                          onClick={() => {
                            setEstimatingOrder(o);
                            setSelectedDuration(null);
                          }}
                          style={{
                            background: "linear-gradient(135deg, #f59e0b, #d97706)",
                            color: "white"
                          }}
                        >
                          ⏱️ Estimated Duration
                        </button>
                      )}
                      {o.status === "confirmed" && o.estimated_time && (
                        <span style={{
                          padding: "0.5rem 0.75rem",
                          background: "linear-gradient(135deg, #10b981, #059669)",
                          color: "white",
                          borderRadius: "8px",
                          fontSize: "0.85rem",
                          fontWeight: "600"
                        }}>
                          ✅ Confirmed - {o.estimated_time >= 60 ? `${Math.floor(o.estimated_time / 60)}h` : `${o.estimated_time}min`}
                        </span>
                      )}
                      {(o.status === "confirmed" || o.status === "ready") && o.phone && (
                        <button 
                          className="btn-primary" 
                          onClick={() => markReady(o.id)}
                          style={{
                            background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                            color: "white"
                          }}
                        >
                          📩 Mark Ready
                        </button>
                      )}
                      {o.status === "ready" && (
                        <div style={{ width: "100%" }}>
                          <p style={{ 
                            margin: "0 0 0.5rem 0", 
                            fontSize: "0.85rem", 
                            fontWeight: "600", 
                            color: "#059669",
                            textAlign: "center"
                          }}>
                            ☝️ Click Done when order is fetched
                          </p>
                          <button 
                            className="btn-secondary" 
                            onClick={() => markOrderDone(o.id)}
                            style={{
                              background: "linear-gradient(135deg, #10b981, #059669)",
                              color: "white",
                              border: "none",
                              width: "100%"
                            }}
                          >
                            ✅ Done
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  ))}
                </div>
                
                {hasMoreOrders && (
                  <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                    <button
                      className="btn-primary"
                      onClick={() => setOrdersToShow(prev => prev + 10)}
                      style={{
                        background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                        padding: "0.75rem 2rem",
                        fontSize: "1rem",
                        fontWeight: "600",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        margin: "0 auto",
                        boxShadow: "0 4px 12px rgba(14, 165, 233, 0.3)"
                      }}
                    >
                      ⬇️ Load More Orders ({orders.length - ordersToShow} remaining)
                    </button>
                  </div>
                )}
                
                {ordersToShow > 10 && (
                  <div style={{ textAlign: "center", marginTop: "1rem" }}>
                    <button
                      className="btn-secondary"
                      onClick={() => setOrdersToShow(10)}
                      style={{
                        padding: "0.5rem 1.5rem",
                        fontSize: "0.9rem"
                      }}
                    >
                      ⬆️ Show Less
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        );

      /* ---------------------- Fetched Orders ---------------------- */
      case "fetchedorders":
        const fetchedOrders = orders.filter(o => o.status === "completed");
        
        return (
          <div className="template-view">
            <div className="view-header">
              <button className="back-btn" onClick={() => setCurrentView("dashboard")}>← Back</button>
              <h2>✅ Fetched Orders</h2>
              <p>{fetchedOrders.length} completed orders</p>
            </div>

            {fetchedOrders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: darkMode ? "#cbd5e1" : "#6b7280" }}>
                <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📦</div>
                <h3>No fetched orders yet</h3>
                <p>Completed orders will appear here</p>
              </div>
            ) : (
              <div className="orders-list">
                {fetchedOrders.map((o) => (
                  <div key={o.id} className="order-management-card" style={{ background: "linear-gradient(135deg, #f0fdf4, #ffffff)", border: "2px solid #86efac" }}>
                    <div className="order-header">
                      <h4>#{o.order_number || o.id.slice(0, 6)} — {o.customer_name || o.customer || "Customer"}</h4>
                      <span className="status-badge completed" style={{ background: "#10b981", color: "white" }}>✅ Fetched</span>
                    </div>

                    <p style={{ margin: ".25rem 0", fontSize: "0.85rem", opacity: 0.7 }}>
                      <strong>📅</strong> {new Date(o.created_at).toLocaleString("en-ZA", { 
                        dateStyle: "medium", 
                        timeStyle: "short" 
                      })}
                    </p>
                    <p><strong>Phone:</strong> {o.phone || "N/A"}</p>
                    <p><strong>Total:</strong> R{o.total}</p>
                    {o.estimated_time && (
                      <p><strong>⏱️ Estimated Time:</strong> {o.estimated_time >= 60 ? `${Math.floor(o.estimated_time / 60)}h` : `${o.estimated_time}min`}</p>
                    )}
                    {Array.isArray(o.items) && o.items.length > 0 && (
                      <ul style={{ marginTop: ".3rem" }}>
                        {o.items.map((it, idx) => (
                          <li key={idx}>
                            {it.qty || 1} × {it.item || it.name} — R{it.price}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div style={{ marginTop: ".75rem", padding: "0.75rem", background: "#dcfce7", borderRadius: "8px", textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: "600", color: "#166534" }}>
                        ✅ Order completed and picked up
                      </p>
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

                    <div style={{ display: "flex", gap: ".5rem", marginTop: ".75rem", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                        {!n.response && (
                          <>
                            <button
                              className="btn-primary"
                              onClick={() => handleResponse(n, "Yes, it's available. You can place your order ✅")}
                              disabled={n.status === "replied"}
                            >
                              ✅ Yes — Available
                            </button>
                            <button
                              className="btn-secondary"
                              onClick={() => handleResponse(n, "Sorry, it is currently unavailable ❌")}
                              disabled={n.status === "replied"}
                            >
                              ❌ No — Unavailable
                            </button>
                            <button
                              className="btn-secondary"
                              onClick={() => {
                                const custom = prompt("Type your custom reply:");
                                if (custom && custom.trim().length > 0) handleResponse(n, custom.trim());
                              }}
                              disabled={n.status === "replied"}
                            >
                              ✍️ Custom Reply
                            </button>
                          </>
                        )}
                        {n.response && (
                          <span style={{ color: "#10b981", fontWeight: 600, fontSize: "0.9rem" }}>
                            ✓ Replied
                          </span>
                        )}
                      </div>
                      <button
                        className="btn-secondary"
                        onClick={() => dismissNotification(n.id)}
                        style={{
                          background: "#f44336",
                          color: "white",
                          border: "none",
                          padding: "0.5rem 1rem",
                          fontSize: "0.85rem"
                        }}
                      >
                        ✕ Close
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
        // Route to correct analytics component based on plan
        const normalizedPlanForAnalytics = storeInfo?.plan?.toLowerCase() || 'trial';

        if (normalizedPlanForAnalytics === 'trial' || normalizedPlanForAnalytics === 'starter') {
          // Starter Analytics - Today's revenue & orders only
          return (
            <StarterAnalytics
              storeInfo={storeInfo}
              onBack={() => setCurrentView("dashboard")}
              darkMode={darkMode}
            />
          );
        } else if (normalizedPlanForAnalytics === 'pro') {
          // Pro Analytics - Daily, Weekly, Monthly tracking
          return (
            <ProAnalytics
              storeInfo={storeInfo}
              onBack={() => setCurrentView("dashboard")}
              darkMode={darkMode}
            />
          );
        } else {
          // Premium - Advanced Analytics with charts
          return (
            <PremiumAnalytics
              storeInfo={storeInfo}
              onBack={() => setCurrentView("dashboard")}
              darkMode={darkMode}
            />
          );
        }

      /* ---------------------- Settings ---------------------- */
      case "settings":
        return (
          <div className="template-view">
            <div className="view-header">
              <button className="back-btn" onClick={() => setCurrentView("dashboard")}>← Back</button>
              <h2>⚙️ Settings</h2>
              <p>Manage your account and preferences</p>
            </div>

            {/* Owner Name */}
            <div className="settings-section">
              <h3 style={{ color: darkMode ? "#ffffff" : "#333" }}>👤 Your Name</h3>
              <p style={{ color: darkMode ? "#cbd5e1" : "#6b7280", fontSize: "0.9rem", marginBottom: "1rem" }}>
                Change your display name (shows in header)
              </p>
              <div style={{ display: "flex", gap: "0.75rem", maxWidth: "500px" }}>
                <input
                  type="text"
                  id="newOwnerName"
                  defaultValue={storeInfo?.owner_name || user?.email?.split('@')[0] || ""}
                  placeholder="Enter your name"
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "2px solid #e5e7eb",
                    fontSize: "1rem"
                  }}
                />
                <button
                  className="btn-primary"
                  onClick={async () => {
                    if (!storeInfo?.id) {
                      showToast("⚠️ Store not loaded yet. Please wait.", "#f44336");
                      return;
                    }

                    const newName = document.getElementById("newOwnerName").value.trim();
                    if (!newName) {
                      showToast("⚠️ Name cannot be empty", "#f44336");
                      return;
                    }

                    try {
                      console.log('Updating owner_name to:', newName, 'for store:', storeInfo.id);
                      const { data, error } = await supabase
                        .from("stores")
                        .update({ owner_name: newName })
                        .eq("id", storeInfo.id)
                        .select();

                      if (error) {
                        console.error('Update error:', error);
                        throw error;
                      }

                      console.log('Update successful:', data);
                      setStoreInfo({ ...storeInfo, owner_name: newName });
                      showToast("✅ Your name updated successfully!", "#4caf50");
                    } catch (error) {
                      showToast(`❌ Failed to update name: ${error.message}`, "#f44336");
                      console.error('Full error:', error);
                    }
                  }}
                  style={{ whiteSpace: "nowrap" }}
                >
                  Update Name
                </button>
              </div>
            </div>

            {/* Store Name */}
            <div className="settings-section">
              <h3 style={{ color: darkMode ? "#ffffff" : "#333" }}>🏪 Store Name</h3>
              <p style={{ color: darkMode ? "#cbd5e1" : "#6b7280", fontSize: "0.9rem", marginBottom: "1rem" }}>
                Change your store's display name (updates everywhere)
              </p>
              <div style={{ display: "flex", gap: "0.75rem", maxWidth: "500px" }}>
                <input
                  type="text"
                  id="newStoreName"
                  defaultValue={storeInfo?.name || ""}
                  placeholder="Enter store name"
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "2px solid #e5e7eb",
                    fontSize: "1rem"
                  }}
                />
                <button
                  className="btn-primary"
                  onClick={async () => {
                    if (!storeInfo?.id) {
                      showToast("⚠️ Store not loaded yet. Please wait.", "#f44336");
                      return;
                    }

                    const newName = document.getElementById("newStoreName").value.trim();
                    if (!newName) {
                      showToast("⚠️ Store name cannot be empty", "#f44336");
                      return;
                    }

                    try {
                      console.log('Updating store name to:', newName, 'for store:', storeInfo.id);
                      const { data, error } = await supabase
                        .from("stores")
                        .update({ name: newName })
                        .eq("id", storeInfo.id)
                        .select();

                      if (error) {
                        console.error('Update error:', error);
                        throw error;
                      }

                      console.log('Update successful:', data);
                      setStoreInfo({ ...storeInfo, name: newName });
                      showToast("✅ Store name updated successfully!", "#4caf50");
                    } catch (error) {
                      showToast(`❌ Failed to update store name: ${error.message}`, "#f44336");
                      console.error('Full error:', error);
                    }
                  }}
                  style={{ whiteSpace: "nowrap" }}
                >
                  Update Name
                </button>
              </div>
            </div>

            {/* Dark Mode */}
            <div className="settings-section">
              <h3 style={{ color: darkMode ? "#ffffff" : "#333" }}>🌓 Theme Mode</h3>
              <label style={{ display: "flex", alignItems: "center", gap: ".5rem", color: darkMode ? "#ffffff" : "#333" }}>
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

            {/* Change Password */}
            <div className="settings-section">
              <h3 style={{ color: darkMode ? "#ffffff" : "#333" }}>🔐 Change Password</h3>
              <p style={{ color: darkMode ? "#cbd5e1" : "#6b7280", fontSize: "0.9rem", marginBottom: "1rem" }}>
                Update your account password
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "400px" }}>
                <input
                  type="password"
                  placeholder="Current Password"
                  id="currentPassword"
                  style={{
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "2px solid #e5e7eb",
                    fontSize: "1rem"
                  }}
                />
                <input
                  type="password"
                  placeholder="New Password"
                  id="newPassword"
                  style={{
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "2px solid #e5e7eb",
                    fontSize: "1rem"
                  }}
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  id="confirmPassword"
                  style={{
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "2px solid #e5e7eb",
                    fontSize: "1rem"
                  }}
                />
                <button
                  className="btn-primary"
                  onClick={async () => {
                    const currentPassword = document.getElementById("currentPassword").value;
                    const newPassword = document.getElementById("newPassword").value;
                    const confirmPassword = document.getElementById("confirmPassword").value;

                    if (!currentPassword || !newPassword || !confirmPassword) {
                      showToast("⚠️ Please fill in all password fields", "#f44336");
                      return;
                    }

                    if (newPassword !== confirmPassword) {
                      showToast("⚠️ New passwords do not match", "#f44336");
                      return;
                    }

                    if (newPassword.length < 6) {
                      showToast("⚠️ Password must be at least 6 characters", "#f44336");
                      return;
                    }

                    try {
                      const { error } = await supabase.auth.updateUser({
                        password: newPassword
                      });

                      if (error) throw error;

                      showToast("✅ Password updated successfully!", "#10b981");

                      // Clear password fields
                      document.getElementById("currentPassword").value = "";
                      document.getElementById("newPassword").value = "";
                      document.getElementById("confirmPassword").value = "";
                    } catch (err) {
                      console.error("Password update error:", err);
                      showToast("⚠️ Failed to update password: " + err.message, "#f44336");
                    }
                  }}
                  style={{ width: "fit-content" }}
                >
                  Update Password
                </button>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="settings-section">
              <h3 style={{ color: darkMode ? "#ffffff" : "#333" }}>💳 Payment Methods</h3>
              <p style={{ color: darkMode ? "#cbd5e1" : "#6b7280", fontSize: "0.9rem", marginBottom: "1rem" }}>
                Manage your payment cards for online transactions
              </p>

              {/* Payment cards list */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                marginBottom: "1.5rem"
              }}>
                {/* This will show saved cards from Paystack */}
                <div style={{
                  background: darkMode ? "rgba(255, 255, 255, 0.1)" : "linear-gradient(135deg, #f3f4f6, #ffffff)",
                  border: darkMode ? "2px solid rgba(255, 255, 255, 0.2)" : "2px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "1.5rem",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💳</div>
                  <p style={{ color: darkMode ? "#cbd5e1" : "#6b7280", fontSize: "0.9rem", margin: "0 0 1rem 0" }}>
                    No cards saved yet. Add a card to enable faster checkout.
                  </p>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      // Open Paystack card management
                      showToast("💳 Opening Paystack to add card...", "#667eea");
                      window.open("https://paystack.com/pay/mzansi-add-card", "_blank");
                    }}
                    style={{
                      background: "linear-gradient(135deg, #667eea, #764ba2)",
                      border: "none"
                    }}
                  >
                    + Add New Card
                  </button>
                </div>

                {/* Example of what a saved card would look like */}
                {/* Uncomment this section when you have cards saved */}
                {/*
                <div style={{
                  background: "white",
                  border: "2px solid #667eea",
                  borderRadius: "12px",
                  padding: "1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ fontSize: "2rem" }}>💳</div>
                    <div>
                      <p style={{ margin: 0, fontWeight: "600", color: "#111827" }}>
                        •••• •••• •••• 4242
                      </p>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: darkMode ? "#cbd5e1" : "#6b7280" }}>
                        Expires 12/25
                      </p>
                    </div>
                  </div>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      if (confirm("Remove this card?")) {
                        showToast("✅ Card removed", "#10b981");
                      }
                    }}
                    style={{
                      background: "#f44336",
                      color: "white",
                      border: "none",
                      padding: "0.5rem 1rem",
                      fontSize: "0.85rem"
                    }}
                  >
                    Remove
                  </button>
                </div>
                */}
              </div>

              <div style={{
                background: "linear-gradient(135deg, #fff7ed, #ffedd5)",
                border: "1px solid #fed7aa",
                borderRadius: "10px",
                padding: "1rem",
                fontSize: "0.85rem",
                color: "#92400e"
              }}>
                <strong>🔒 Secure Payment Processing</strong>
                <p style={{ margin: "0.5rem 0 0 0" }}>
                  All payment information is securely processed through Paystack.
                  We never store your card details on our servers.
                </p>
              </div>
            </div>

            {/* Paystack Integration */}
            <div className="settings-section">
              <h3 style={{ color: darkMode ? "#ffffff" : "#333" }}>💰 Paystack Integration</h3>
              <p style={{ color: darkMode ? "#cbd5e1" : "#6b7280", fontSize: "0.9rem", marginBottom: "1rem" }}>
                Connect your Paystack account to accept customer payments
              </p>

              <div className="form-group">
                <label htmlFor="paystack-public" style={{ color: darkMode ? "#ffffff" : "#333" }}>
                  Paystack Public Key
                </label>
                <input
                  id="paystack-public"
                  type="text"
                  className="form-input"
                  placeholder="pk_test_xxxxxxxxxxxxx or pk_live_xxxxxxxxxxxxx"
                  value={paystackPublicKey}
                  onChange={(e) => setPaystackPublicKey(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="paystack-secret" style={{ color: darkMode ? "#ffffff" : "#333" }}>
                  Paystack Secret Key
                </label>
                <input
                  id="paystack-secret"
                  type="password"
                  className="form-input"
                  placeholder="sk_test_xxxxxxxxxxxxx or sk_live_xxxxxxxxxxxxx"
                  value={paystackSecretKey}
                  onChange={(e) => setPaystackSecretKey(e.target.value)}
                />
              </div>

              <button
                onClick={handleSavePaystackKeys}
                className="btn-primary"
                disabled={savingPaystack}
              >
                {savingPaystack ? "Saving..." : "Save Paystack Keys"}
              </button>

              <div style={{
                marginTop: "1.5rem",
                padding: "1rem",
                background: darkMode ? "#1e293b" : "#eff6ff",
                borderRadius: "8px",
                fontSize: "0.85rem",
                color: darkMode ? "#93c5fd" : "#1e40af"
              }}>
                <strong>📌 How to get your Paystack keys:</strong>
                <ol style={{ margin: "0.5rem 0 0 0", paddingLeft: "1.5rem" }}>
                  <li>Go to <a href="https://dashboard.paystack.com/" target="_blank" rel="noopener noreferrer" style={{ color: darkMode ? "#60a5fa" : "#2563eb" }}>Paystack Dashboard</a></li>
                  <li>Click Settings → API Keys & Webhooks</li>
                  <li>Copy your Public Key and Secret Key</li>
                  <li>Paste them here and click "Save"</li>
                </ol>
              </div>
            </div>

            {/* QR Code */}
            <div className="settings-section">
              <StyledQRCode storeName={storeInfo?.name || "Mzansi Store"} />
            </div>

            {/* Current Plan & Upgrade Options */}
            <div className="settings-section">
              <h3 style={{ color: darkMode ? "#ffffff" : "#333" }}>💰 Your Subscription Plan</h3>

              {/* Current Plan Display */}
              <div style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                padding: "1.5rem",
                borderRadius: "12px",
                marginBottom: "1.5rem"
              }}>
                <h4 style={{ margin: "0 0 0.5rem 0", color: "white" }}>
                  Current Plan: {planFeatures.name}
                </h4>
                {storeInfo?.plan === 'trial' && (
                  <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.9 }}>
                    {getDaysRemaining(storeInfo) > 0
                      ? `Trial expires in ${getDaysRemaining(storeInfo)} days`
                      : 'Trial expired - Upgrade to continue'}
                  </p>
                )}
                {storeInfo?.plan === 'pro' && (
                  <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.9 }}>
                    R150/month - Unlimited products & basic analytics
                  </p>
                )}
                {storeInfo?.plan === 'premium' && (
                  <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.9 }}>
                    R300/month - Premium subdomain + advanced analytics (Custom domains coming soon)
                  </p>
                )}
              </div>

              {/* Upgrade Options */}
              {storeInfo?.plan !== 'premium' && (
                <>
                  <h4 style={{ color: darkMode ? "#ffffff" : "#333" }}>Upgrade Your Plan</h4>
                  <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
                    {storeInfo?.plan === 'trial' && (
                      <>
                        <div className="plan-card" style={{ border: "2px solid #667eea" }}>
                          <h4 style={{ color: darkMode ? "#ffffff" : "#333" }}>Pro Plan</h4>
                          <p style={{ color: darkMode ? "#cbd5e1" : "#333" }}>
                            ✅ Subdomain (yourstore.mzansifoodconnect.app)<br/>
                            ✅ Unlimited products<br/>
                            ✅ Basic analytics (revenue tracking)<br/>
                            ✅ WhatsApp API integration<br/>
                            ✅ Remove branding
                          </p>
                          <span className="plan-price" style={{ color: darkMode ? "#ffffff" : "#333" }}>R150 / month</span>
                          <button
                            onClick={() => window.open("https://paystack.com/pay/mzansi-pro", "_blank")}
                            className="btn-primary"
                          >
                            Upgrade to Pro 🚀
                          </button>
                        </div>

                        <div className="plan-card" style={{ border: "2px solid #764ba2" }}>
                          <h4 style={{ color: darkMode ? "#ffffff" : "#333" }}>Premium Plan - Best Value</h4>
                          <p style={{ color: darkMode ? "#cbd5e1" : "#333" }}>
                            ✅ Premium subdomain (yourbusiness.mzansifoodconnect.app)<br/>
                            ✅ Everything in Pro<br/>
                            ✅ Advanced analytics with charts<br/>
                            ✅ More professional templates<br/>
                            ✅ White-label solution<br/>
                            🚧 Custom domain (yourbusiness.co.za) - Coming Soon
                          </p>
                          <span className="plan-price" style={{ color: darkMode ? "#ffffff" : "#333" }}>R300 / month</span>
                          <button
                            onClick={() => window.open("https://paystack.com/pay/mzansi-premium", "_blank")}
                            className="btn-primary"
                          >
                            Upgrade to Premium 🌍
                          </button>
                        </div>
                      </>
                    )}

                    {storeInfo?.plan === 'pro' && (
                      <div className="plan-card" style={{ border: "2px solid #764ba2" }}>
                        <h4 style={{ color: darkMode ? "#ffffff" : "#333" }}>Premium Plan - Upgrade</h4>
                        <p style={{ color: darkMode ? "#cbd5e1" : "#333" }}>
                          ✅ Advanced analytics with charts<br/>
                          ✅ More professional templates<br/>
                          ✅ White-label solution<br/>
                          ✅ Dedicated support<br/>
                          🚧 Custom domain (yourbusiness.co.za) - Coming Soon
                        </p>
                        <span className="plan-price" style={{ color: darkMode ? "#ffffff" : "#333" }}>R300 / month (only R150 more!)</span>
                        <button
                          onClick={() => window.open("https://paystack.com/pay/mzansi-premium", "_blank")}
                          className="btn-primary"
                        >
                          Upgrade to Premium 🌍
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        );

      /* ---------------------- Dashboard - ROUTE TO PLAN-SPECIFIC COMPONENT ---------------------- */
      default:
        // Get normalized plan value (trim and lowercase for robust comparison)
        const normalizedPlan = storeInfo?.plan?.trim().toLowerCase();

        // DEBUG: Log which dashboard we're routing to
        console.log('🚨 DASHBOARD ROUTING:', {
          originalPlan: storeInfo?.plan,
          normalizedPlan: normalizedPlan,
          planType: typeof storeInfo?.plan,
          storeId: storeInfo?.id
        });

        // ROBUST ROUTING - Normalize plan value before comparison
        if (normalizedPlan === 'premium') {
          console.log('✅ Routing to PREMIUM dashboard');
          return (
            <PremiumDashboardView
              storeInfo={storeInfo}
              user={user}
              setCurrentView={setCurrentView}
              newOrders={newOrders}
              newMsgs={newMsgs}
              supabase={supabase}
            />
          );
        }

        if (normalizedPlan === 'pro') {
          console.log('✅ Routing to PRO dashboard');
          return (
            <ProDashboardView
              storeInfo={storeInfo}
              user={user}
              setCurrentView={setCurrentView}
              newOrders={newOrders}
              newMsgs={newMsgs}
              supabase={supabase}
            />
          );
        }

        // Default to Starter dashboard for trial and fallback
        console.log('✅ Routing to STARTER dashboard (plan:', normalizedPlan, ')');
        return (
          <StarterDashboardView
            storeInfo={storeInfo}
            user={user}
            setCurrentView={setCurrentView}
            newOrders={newOrders}
            newMsgs={newMsgs}
            supabase={supabase}
          />
        );
    }
  };

  return (
    <div className="app">
      <Header />
      <main className="main">{renderView()}</main>
      
      {/* Estimated Duration Popup Modal */}
      {estimatingOrder && (
        <div 
          className="cart-overlay" 
          onClick={() => {
            setEstimatingOrder(null);
            setSelectedDuration(null);
          }}
          style={{ zIndex: 9999 }}
        >
          <div 
            className="duration-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "2rem",
              maxWidth: "420px",
              width: "90%",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              animation: "slideUp 0.3s ease"
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>⏱️</div>
              <h2 style={{ margin: "0 0 0.5rem 0", fontSize: "1.5rem", color: darkMode ? "#ffffff" : "#111827" }}>
                Estimated Duration
              </h2>
              <p style={{ margin: 0, color: darkMode ? "#cbd5e1" : "#6b7280", fontSize: "0.9rem" }}>
                How long until this order is ready?
              </p>
            </div>

            {/* Order Info */}
            <div style={{
              background: "linear-gradient(135deg, #fff7ed, #ffedd5)",
              border: "1px solid #fed7aa",
              borderRadius: "12px",
              padding: "1rem",
              marginBottom: "1.5rem"
            }}>
              <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.85rem", color: "#92400e", fontWeight: "600" }}>
                ORDER #{estimatingOrder.id.slice(0, 8).toUpperCase()}
              </p>
              <p style={{ margin: "0 0 0.25rem 0", fontSize: "1rem", fontWeight: "700", color: darkMode ? "#ffffff" : "#111827" }}>
                {estimatingOrder.customer}
              </p>
              <p style={{ margin: 0, fontSize: "0.85rem", color: darkMode ? "#cbd5e1" : "#6b7280" }}>
                Total: R{estimatingOrder.total}
              </p>
            </div>

            {/* Duration Options */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: "600", color: darkMode ? "#ffffff" : "#374151" }}>
                Select estimated time:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                {[3, 5, 10, 15, 30, 60].map((minutes) => (
                  <button
                    key={minutes}
                    onClick={() => setSelectedDuration(minutes)}
                    style={{
                      padding: "1rem",
                      border: selectedDuration === minutes ? "2px solid #f59e0b" : "2px solid #e5e7eb",
                      borderRadius: "12px",
                      background: selectedDuration === minutes 
                        ? "linear-gradient(135deg, #fef3c7, #fde68a)" 
                        : "white",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      fontWeight: "700",
                      fontSize: "0.95rem",
                      color: selectedDuration === minutes ? "#92400e" : "#374151",
                      boxShadow: selectedDuration === minutes ? "0 4px 12px rgba(245, 158, 11, 0.2)" : "none"
                    }}
                  >
                    {minutes >= 60 ? `${Math.floor(minutes / 60)}h` : `${minutes}min`}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => {
                  setEstimatingOrder(null);
                  setSelectedDuration(null);
                }}
                style={{
                  flex: 1,
                  padding: "0.875rem",
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  background: "white",
                  fontSize: "1rem",
                  fontWeight: "600",
                  color: "#6b7280",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                Cancel
              </button>
              <button
                onClick={sendEstimatedDuration}
                disabled={!selectedDuration}
                style={{
                  flex: 2,
                  padding: "0.875rem",
                  border: "none",
                  borderRadius: "12px",
                  background: selectedDuration
                    ? "linear-gradient(135deg, #f59e0b, #d97706)"
                    : "#e5e7eb",
                  color: selectedDuration ? "white" : "#9ca3af",
                  fontSize: "1rem",
                  fontWeight: "700",
                  cursor: selectedDuration ? "pointer" : "not-allowed",
                  transition: "all 0.2s ease",
                  boxShadow: selectedDuration ? "0 4px 12px rgba(245, 158, 11, 0.3)" : "none"
                }}
              >
                📩 Send Estimated Duration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




