// src/LiveQueue.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { getSubdomain } from "./utils/subdomain";
import "./LiveQueue.css";

export default function LiveQueue() {
  const { slug: pathSlug } = useParams();
  const subdomainSlug = getSubdomain();
  const slug = subdomainSlug || pathSlug;

  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [readyOrders, setReadyOrders] = useState([]);
  const [confirmedOrders, setConfirmedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* -------------------------------------------------------
     Load Store and Ready Orders
  ------------------------------------------------------- */
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Fetch store
        const { data: storeData, error: storeError } = await supabase
          .from("tenants")
          .select("*")
          .eq("slug", slug)
          .single();

        if (storeError) {
          setError("Store not found");
          setLoading(false);
          return;
        }

        setStore(storeData);

        // Fetch ready orders
        const { data: orders, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .eq("store_id", storeData.id)
          .eq("status", "ready")
          .order("created_at", { ascending: false });

        if (ordersError) throw ordersError;

        setReadyOrders(orders || []);

        // Fetch confirmed orders to calculate waiting time
        const { data: confirmed, error: confirmedError } = await supabase
          .from("orders")
          .select("*")
          .eq("store_id", storeData.id)
          .eq("status", "confirmed")
          .order("created_at", { ascending: false });

        if (confirmedError) throw confirmedError;

        setConfirmedOrders(confirmed || []);
        setLoading(false);
      } catch (err) {
        console.error("Error loading queue:", err);
        setError("Failed to load queue");
        setLoading(false);
      }
    }

    if (slug) {
      loadData();
    }
  }, [slug]);

  /* -------------------------------------------------------
     Realtime: Listen for order updates
  ------------------------------------------------------- */
  useEffect(() => {
    if (!store?.id) return;

    const channel = supabase
      .channel(`queue-${store.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `store_id=eq.${store.id}`,
        },
        (payload) => {
          const order = payload.new;

          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            if (order.status === "ready") {
              // Add or update order in ready queue
              setReadyOrders((prev) => {
                const exists = prev.find((o) => o.id === order.id);
                if (exists) {
                  return prev.map((o) => (o.id === order.id ? order : o));
                } else {
                  return [order, ...prev];
                }
              });
              // Remove from confirmed queue
              setConfirmedOrders((prev) => prev.filter((o) => o.id !== order.id));
            } else if (order.status === "confirmed") {
              // Add or update order in confirmed queue
              setConfirmedOrders((prev) => {
                const exists = prev.find((o) => o.id === order.id);
                if (exists) {
                  return prev.map((o) => (o.id === order.id ? order : o));
                } else {
                  return [order, ...prev];
                }
              });
              // Remove from ready queue
              setReadyOrders((prev) => prev.filter((o) => o.id !== order.id));
            } else {
              // Remove from both queues if status changed to something else
              setReadyOrders((prev) => prev.filter((o) => o.id !== order.id));
              setConfirmedOrders((prev) => prev.filter((o) => o.id !== order.id));
            }
          }

          if (payload.eventType === "DELETE") {
            setReadyOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
            setConfirmedOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [store?.id]);

  /* -------------------------------------------------------
     Render States
  ------------------------------------------------------- */
  if (loading) {
    return (
      <div className="queue-page loading">
        <div className="queue-spinner"></div>
        <h2>Loading live queue...</h2>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="queue-page error">
        <h2>😢 {error || "Store not found"}</h2>
        <button onClick={() => navigate(`/store/${slug}`)} className="btn-back-queue">
          ← Back to Store
        </button>
      </div>
    );
  }

  // Calculate estimated waiting time
  const totalEstimatedTime = confirmedOrders.reduce((sum, order) => {
    return sum + (order.estimated_time || 0);
  }, 0);
  const estimatedWaitingTime = Math.ceil(totalEstimatedTime / 2); // Divide by 2 as owner can do multiple orders

  return (
    <div className="queue-page">
      <div className="queue-container">
        {/* Header */}
        <div className="queue-header">
          <button onClick={() => navigate(`/store/${slug}`)} className="queue-back-btn">
            ← Back
          </button>
          <div className="queue-title">
            <h1>🔥 Live Queue</h1>
            <p>{store.name}</p>
          </div>
          <div className="queue-status">
            <span className={`status-dot ${store.is_open ? "open" : "closed"}`}></span>
            <span>{store.is_open ? "Open" : "Closed"}</span>
          </div>
        </div>

        {/* Estimated Waiting Time */}
        {store.is_open && confirmedOrders.length > 0 && (
          <div style={{
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            padding: "1.5rem",
            borderRadius: "15px",
            margin: "1rem 0",
            textAlign: "center",
            color: "white",
            boxShadow: "0 4px 15px rgba(245, 158, 11, 0.3)"
          }}>
            <div style={{ fontSize: "0.9rem", fontWeight: "600", marginBottom: "0.5rem" }}>
              ⏱️ Estimated Waiting Time
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "700" }}>
              {estimatedWaitingTime >= 60
                ? `${Math.floor(estimatedWaitingTime / 60)}h ${estimatedWaitingTime % 60}min`
                : `${estimatedWaitingTime} min`
              }
            </div>
            <div style={{ fontSize: "0.85rem", marginTop: "0.5rem", opacity: 0.9 }}>
              {confirmedOrders.length} {confirmedOrders.length === 1 ? 'order' : 'orders'} being prepared
            </div>
          </div>
        )}

        {/* Queue Content */}
        <div className="queue-content">
          {readyOrders.length === 0 ? (
            <div className="queue-empty">
              <div className="empty-icon">📦</div>
              <h3>No orders ready yet</h3>
              <p>Check back soon or place an order!</p>
              <button onClick={() => navigate(`/store/${slug}`)} className="btn-order-now">
                Order Now
              </button>
            </div>
          ) : (
            <>
              <div className="queue-info">
                <span className="queue-count">{readyOrders.length}</span>
                <span className="queue-label">
                  {readyOrders.length === 1 ? "order ready" : "orders ready"} for collection
                </span>
              </div>

              <div className="queue-list">
                {readyOrders.map((order, index) => (
                  <div key={order.id} className="queue-item">
                    <div className="queue-item-number">
                      #{index + 1}
                    </div>
                    <div className="queue-item-info">
                      <h3>Order {order.order_number || order.id.slice(0, 8).toUpperCase()}</h3>
                      <p className="queue-item-customer">
                        {order.customer_name || order.customer || "Customer"}
                      </p>
                      <p className="queue-item-time">
                        Ready {getTimeAgo(order.created_at)}
                      </p>
                    </div>
                    <div className="queue-item-status">
                      <div className="status-badge ready">Ready ✓</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="queue-footer">
                <p>🔄 Updates automatically in realtime</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   Helper: Time ago
------------------------------------------------------- */
function getTimeAgo(dateString) {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}
