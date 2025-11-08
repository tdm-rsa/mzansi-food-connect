// src/components/AskAboutProduct.jsx
import { useState } from "react";
import { supabase } from "../supabaseClient";
import "./AskAboutProduct.css";

export default function AskAboutProduct({ product, store, onClose }) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [message, setMessage] = useState(`Is ${product.name} available?`);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim() || !message.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setSending(true);
    setError("");

    try {
      // Create notification in database
      const fullMessage = `${message}\n\n🍽️ Product: ${product.name}`;

      const { error: insertError } = await supabase
        .from("notifications")
        .insert([
          {
            store_id: store.id,
            customer_name: customerName,
            customer_phone: customerPhone,
            message: fullMessage,
            status: "pending",
          },
        ]);

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (success) {
    return (
      <div className="ask-modal-overlay" onClick={onClose}>
        <div className="ask-modal success" onClick={(e) => e.stopPropagation()}>
          <div className="ask-success">
            <div className="success-icon">✓</div>
            <h3>Message Sent!</h3>
            <p>The store will reply via WhatsApp shortly.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ask-modal-overlay" onClick={onClose}>
      <div className="ask-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ask-header">
          <h2>Ask About {product.name}</h2>
          <button className="ask-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form className="ask-form" onSubmit={handleSubmit}>
          {error && <div className="ask-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="ask-name">Your Name *</label>
            <input
              type="text"
              id="ask-name"
              placeholder="Enter your name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              disabled={sending}
            />
          </div>

          <div className="form-group">
            <label htmlFor="ask-phone">WhatsApp Number *</label>
            <input
              type="tel"
              id="ask-phone"
              placeholder="0812345678"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
              disabled={sending}
            />
          </div>

          <div className="form-group">
            <label htmlFor="ask-message">Your Message *</label>
            <textarea
              id="ask-message"
              placeholder="Ask about availability, price, etc."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
              disabled={sending}
            />
          </div>

          <button
            type="submit"
            className="ask-submit-btn"
            disabled={sending}
          >
            {sending ? "Sending..." : "Send Message 📩"}
          </button>

          <p className="ask-note">
            💬 The store will respond via WhatsApp
          </p>
        </form>
      </div>
    </div>
  );
}
