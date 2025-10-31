import { useState } from "react";
import { PaystackButton } from "react-paystack";
import { supabase } from "../supabaseClient";
import LiveQueueButton from "../components/LiveQueueButton.jsx";
import "./ModernFoodTemplate.css"; // ✅ NEW: use the Jersey-like CSS

export default function ModernFoodTemplate({ state, storeId }) {
  const { header, banner, menuItems, about, liveQueue } = state;
  const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

  // ✅ Cart state
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // ✅ Customer checkout state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [processing, setProcessing] = useState(false);

  // ✅ Ask modal state
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [askItem, setAskItem] = useState(null);
  const [askName, setAskName] = useState("");
  const [askPhone, setAskPhone] = useState("");
  const [askMessage, setAskMessage] = useState("");
  const [askSending, setAskSending] = useState(false);

  // Add, remove, qty helpers
  const addToCart = (item) => {
    setCart((prev) => {
      const idx = prev.findIndex((p) => p.id === item.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: (copy[idx].qty || 1) + 1 };
        return copy;
      }
      return [...prev, { ...item, qty: 1 }];
    });
    setTotal((t) => t + item.price);
  };

  const incQty = (i) => {
    const item = cart[i];
    setCart((prev) =>
      prev.map((x, idx) => (idx === i ? { ...x, qty: (x.qty || 1) + 1 } : x))
    );
    setTotal((t) => t + item.price);
  };

  const decQty = (i) => {
    const item = cart[i];
    if ((item.qty || 1) <= 1) return;
    setCart((prev) =>
      prev.map((x, idx) => (idx === i ? { ...x, qty: x.qty - 1 } : x))
    );
    setTotal((t) => t - item.price);
  };

  const removeAt = (i) => {
    const item = cart[i];
    setCart((prev) => prev.filter((_, idx) => idx !== i));
    setTotal((t) => t - item.price * (item.qty || 1));
  };

  const clearCart = () => {
    setCart([]);
    setTotal(0);
  };

  // ✅ Paystack success
  async function handlePaystackSuccess(ref) {
    try {
      setProcessing(true);

      const orderItems = cart.map((c) => ({
        item: c.name,
        qty: c.qty || 1,
        price: c.price,
      }));

      const { error } = await supabase.from("orders").insert([
        {
          store_id: storeId,
          customer: customerName,
          phone: customerPhone,
          items: orderItems,
          total,
          payment_status: "paid",
          payment_method: "paystack",
          payment_reference: ref.reference,
        },
      ]);

      if (error) throw error;
      alert("✅ Order placed and payment confirmed!");
      clearCart();
      setIsCartOpen(false);
    } catch (err) {
      console.error(err.message);
      alert("⚠️ Something went wrong saving your order.");
    } finally {
      setProcessing(false);
    }
  }

  const paystackConfig = {
    reference: new Date().getTime().toString(),
    email: customerPhone ? `${customerPhone}@temp.com` : "customer@temp.com",
    amount: total * 100,
    publicKey: paystackKey,
  };

  // ✅ Test payment mode (bypass Paystack for testing)
  const handleTestPayment = async () => {
    if (!customerName || !customerPhone) {
      alert("⚠️ Please fill in your name and phone number");
      return;
    }

    try {
      setProcessing(true);
      const orderItems = cart.map((c) => ({
        item: c.name,
        qty: c.qty || 1,
        price: c.price,
      }));

      const { error } = await supabase.from("orders").insert([
        {
          store_id: storeId,
          customer: customerName,
          phone: customerPhone,
          items: orderItems,
          total,
          payment_status: "paid",
          payment_method: "test",
          payment_reference: `TEST-${Date.now()}`,
        },
      ]);

      if (error) throw error;
      alert("✅ Test order placed successfully!");
      clearCart();
      setCustomerName("");
      setCustomerPhone("");
      setIsCartOpen(false);
    } catch (err) {
      console.error(err.message);
      alert("⚠️ Something went wrong: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const paystackBtnProps = {
    ...paystackConfig,
    text: processing ? "Processing..." : "💳 Pay Now",
    onSuccess: handlePaystackSuccess,
    onClose: () => alert("Payment cancelled"),
    className: "checkout-btn",
    disabled: processing || total === 0,
  };

  // ✅ Ask if Available - Open Modal
  const openAskModal = (item) => {
    setAskItem(item);
    setAskMessage(`Is "${item.name}" available?`);
    setIsAskModalOpen(true);
  };

  // ✅ Submit Ask Question
  const submitAskQuestion = async () => {
    if (!askName || !askPhone || !askMessage) {
      alert("Please fill in all fields");
      return;
    }

    try {
      setAskSending(true);
      const { error } = await supabase.from("notifications").insert([
        {
          store_id: storeId,
          customer_name: askName,
          customer_phone: askPhone,
          message: askMessage,
        },
      ]);
      if (error) throw error;
      alert("✅ Message sent! The owner will reply shortly on WhatsApp.");
      setIsAskModalOpen(false);
      setAskName("");
      setAskPhone("");
      setAskMessage("");
    } catch (err) {
      console.error("❌ Could not send message:", err.message);
      alert("⚠️ Failed to send message. Try again later.");
    } finally {
      setAskSending(false);
    }
  };

  return (
    <div className="store-page">
      {/* ===== Header ===== */}
      <header className="store-header">
        <div className="header-left">
          {header.showLogo && (
            <img
              src={header.logoDataUrl || "/logo.png"}
              alt="logo"
              className="store-logo"
            />
          )}
          <h1>{header.storeName}</h1>
        </div>

        <div className="header-actions">
          <button
            className="cart-toggle"
            onClick={() => setIsCartOpen(true)}
            title="Open cart"
          >
            🛒 Cart
            {cart.length > 0 && (
              <span className="cart-count">
                {cart.reduce((n, i) => n + (i.qty || 1), 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ===== Banner ===== */}
      <section className="store-banner">
        <h2>{banner.bannerText}</h2>
        {banner.specialsText && <p>{banner.specialsText}</p>}
        <div className={`store-status ${banner.isOpen ? "open" : "closed"}`}>
          {banner.isOpen ? "🟢 Open Now" : "🔴 Closed"}
        </div>
        {banner.showQueue && <button className="queue-btn">🕒 View Live Queue</button>}
      </section>

      {/* ===== Menu ===== */}
      <section className="store-menu">
        <h3>🍔 Menu</h3>
        <div className="menu-grid">
          {menuItems.length === 0 ? (
            <p className="cart-empty">No menu items yet.</p>
          ) : (
            menuItems.map((item) => (
              <div key={item.id} className="menu-card">
                {item.image_url && (
                  <div className="menu-card-image">
                    <img src={item.image_url} alt={item.name} />
                  </div>
                )}
                <div className="menu-card-content">
                  <h4>{item.name}</h4>
                  <p className="menu-card-price">R{item.price}</p>
                  <div className="menu-actions">
                    <button className="btn-primary" onClick={() => addToCart(item)}>
                      🛒 Add
                    </button>
                    <button className="btn-secondary" onClick={() => openAskModal(item)}>
                      💬 Ask
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ===== About ===== */}
      <section className="store-about">
        <h3>About Us</h3>
        <p>{about.text}</p>
      </section>

      {/* ===== Cart Sidebar (overlay + drawer) ===== */}
      {isCartOpen && (
        <div className="cart-overlay" onClick={() => setIsCartOpen(false)}>
          <aside
            className="cart-sidebar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cart-header">
              <h2 className="cart-title">Your Cart</h2>
              <button className="close-cart" onClick={() => setIsCartOpen(false)}>
                ✕
              </button>
            </div>

            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="cart-empty">Your cart is empty.</div>
              ) : (
                cart.map((c, i) => (
                  <div key={i} className="cart-item">
                    <div className="cart-item-info">
                      <h4 className="cart-item-name">{c.name}</h4>
                      <p className="cart-item-price">R{c.price}</p>
                      <div className="qty-row">
                        <button className="qty-btn" onClick={() => decQty(i)}>-</button>
                        <span>{c.qty || 1}</span>
                        <button className="qty-btn" onClick={() => incQty(i)}>+</button>
                        <button className="remove-item" onClick={() => removeAt(i)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="cart-summary">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>R{total}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>R{total}</span>
              </div>

              <div className="checkout-row">
                <input
                  className="checkout-input"
                  type="text"
                  placeholder="Your name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
                <input
                  className="checkout-input"
                  type="tel"
                  placeholder="WhatsApp number (e.g. 0821234567)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                />
                
                {/* Test Payment Button */}
                <button
                  className="checkout-btn"
                  onClick={handleTestPayment}
                  disabled={processing || total === 0 || !customerName || !customerPhone}
                  style={{
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    marginBottom: "0.5rem"
                  }}
                >
                  {processing ? "Processing..." : "✅ Place Test Order"}
                </button>
                
                {/* Real Paystack Payment (if key is configured) */}
                {paystackKey && <PaystackButton {...paystackBtnProps} />}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ===== Ask Modal ===== */}
      {isAskModalOpen && (
        <div className="ask-modal-overlay" onClick={() => setIsAskModalOpen(false)}>
          <div className="ask-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ask-modal-header">
              <h2>💬 Want to ask?</h2>
              <button className="close-modal" onClick={() => setIsAskModalOpen(false)}>
                ✕
              </button>
            </div>

            <div className="ask-modal-body">
              {askItem && (
                <div className="ask-item-info">
                  <p className="ask-item-label">About:</p>
                  <h3 className="ask-item-name">{askItem.name}</h3>
                </div>
              )}

              <div className="ask-form">
                <div className="form-group">
                  <label>Your Name</label>
                  <input
                    type="text"
                    className="ask-input"
                    placeholder="Enter your name"
                    value={askName}
                    onChange={(e) => setAskName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>WhatsApp Number</label>
                  <input
                    type="tel"
                    className="ask-input"
                    placeholder="e.g. 27821234567"
                    value={askPhone}
                    onChange={(e) => setAskPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Your Question</label>
                  <textarea
                    className="ask-textarea"
                    placeholder="What would you like to know?"
                    rows="4"
                    value={askMessage}
                    onChange={(e) => setAskMessage(e.target.value)}
                  />
                </div>

                <button
                  className="ask-submit-btn"
                  onClick={submitAskQuestion}
                  disabled={askSending}
                >
                  {askSending ? "Sending..." : "📤 Send Message"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
