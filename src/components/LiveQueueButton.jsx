import { useEffect, useState } from "react";

export default function LiveQueueButton({ orders = [] }) {
  const [open, setOpen] = useState(false);
  const [lastCount, setLastCount] = useState(orders.length);

  // 🔊 Play sound + popup when new ready order appears
  useEffect(() => {
    if (orders.length > lastCount) {
      const audio = new Audio("/notification.mp3");
      audio.play();

      // Create a toast-like popup
      const toast = document.createElement("div");
      toast.textContent = "✅ A new order is ready for pickup!";
      Object.assign(toast.style, {
        position: "fixed",
        bottom: "100px",
        right: "20px",
        background: "#ff6b35",
        color: "white",
        padding: "10px 16px",
        borderRadius: "8px",
        fontWeight: "600",
        boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
        zIndex: 9999,
      });
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
    setLastCount(orders.length);
  }, [orders]);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          background: "#ff6b35",
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: "60px",
          height: "60px",
          fontSize: "1.6rem",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          cursor: "pointer",
          zIndex: 999,
          transition: "transform 0.3s ease",
        }}
        title="View Live Queue"
      >
        🕒
      </button>

      {/* Popup */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: "100px",
            right: "20px",
            background: "#fff",
            color: "#000",
            borderRadius: "12px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
            width: "280px",
            maxHeight: "60vh",
            overflowY: "auto",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <h3 style={{ marginBottom: "0.5rem", color: "#ff6b35" }}>
            Ready for Pickup
          </h3>

          {orders.length === 0 ? (
            <p style={{ fontSize: "0.9rem", color: "#555" }}>
              No ready orders yet. Check again soon 🍴
            </p>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                style={{
                  borderBottom: "1px solid #eee",
                  padding: "0.5rem 0",
                }}
              >
                <p style={{ margin: 0 }}>
                  <strong>#{order.id}</strong> —{" "}
                  {order.customer || "Customer"}
                </p>
                <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem" }}>
                  {order.items || "—"}<br />
                  <span style={{ color: "#4CAF50" }}>✅ Ready</span>
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}
