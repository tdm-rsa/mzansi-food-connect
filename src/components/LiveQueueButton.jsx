import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "../LiveQueue.css";

export default function LiveQueueButton({ storeInfo }) {
  const [open, setOpen] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load all unfetched orders (pending, confirmed, ready - anything before completed)
  useEffect(() => {
    if (!storeInfo?.id) return;

    async function loadQueue() {
      const { data } = await supabase
        .from("orders")
        .select("id, created_at, status, estimated_time")
        .eq("store_id", storeInfo.id)
        .in("status", ["pending", "confirmed", "ready"])
        .order("created_at", { ascending: true });

      setQueueCount(data?.length || 0);

      // Calculate estimated waiting time (sum of confirmed orders / 2)
      const confirmedOrders = data?.filter(o => o.status === "confirmed") || [];
      const totalTime = confirmedOrders.reduce((sum, order) => sum + (order.estimated_time || 0), 0);
      setEstimatedWaitTime(Math.ceil(totalTime / 2));

      setLoading(false);
    }
    
    loadQueue();

    // Realtime subscription
    const channel = supabase
      .channel("queue-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          if (payload.new?.store_id !== storeInfo.id) return;
          loadQueue();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [storeInfo]);


  if (!storeInfo) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="live-queue-fab"
        title="View Live Queue"
      >
        🕒
        {queueCount > 0 && (
          <span className="queue-badge">{queueCount}</span>
        )}
      </button>

      {/* Queue Panel - Customer View */}
      {open && (
        <div className="queue-overlay" onClick={() => setOpen(false)}>
          <div className="queue-panel" onClick={(e) => e.stopPropagation()}>
            <div className="queue-header">
              <h3>🕒 Live Order Queue</h3>
              <button onClick={() => setOpen(false)} className="close-queue">✕</button>
            </div>

            <div className="queue-content">
              {loading ? (
                <p className="queue-empty">Loading...</p>
              ) : queueCount === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
                  <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎉</div>
                  <h3 style={{ margin: "0 0 0.5rem 0", color: "#111827" }}>No orders in queue</h3>
                  <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>
                    All orders have been completed
                  </p>
                </div>
              ) : (
                <div style={{ padding: "1rem" }}>
                  <div style={{
                    background: "linear-gradient(135deg, #fff7ed, #ffedd5)",
                    border: "2px solid #fed7aa",
                    borderRadius: "12px",
                    padding: "1.5rem",
                    textAlign: "center",
                    marginBottom: "1rem"
                  }}>
                    <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>👥</div>
                    <h2 style={{ margin: "0 0 0.5rem 0", fontSize: "2rem", color: "#92400e" }}>
                      {queueCount}
                    </h2>
                    <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: "600", color: "#92400e" }}>
                      {queueCount === 1 ? "order" : "orders"} in queue
                    </p>
                  </div>

                  {/* Estimated Waiting Time */}
                  {estimatedWaitTime > 0 && (
                    <div style={{
                      background: "linear-gradient(135deg, #f59e0b, #d97706)",
                      borderRadius: "12px",
                      padding: "1.25rem",
                      textAlign: "center",
                      marginBottom: "1rem",
                      color: "white",
                      boxShadow: "0 4px 15px rgba(245, 158, 11, 0.3)"
                    }}>
                      <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", fontWeight: "600", opacity: 0.9 }}>
                        ⏱️ Estimated Waiting Time
                      </p>
                      <h3 style={{ margin: 0, fontSize: "1.75rem", fontWeight: "700" }}>
                        {estimatedWaitTime >= 60
                          ? `${Math.floor(estimatedWaitTime / 60)}h ${estimatedWaitTime % 60}min`
                          : `${estimatedWaitTime} min`
                        }
                      </h3>
                    </div>
                  )}

                  <div style={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "1.25rem",
                    textAlign: "center"
                  }}>
                    <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", color: "#6b7280" }}>
                      ⏱️ Your order is being prepared
                    </p>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#9ca3af" }}>
                      You'll receive a WhatsApp message when ready
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
