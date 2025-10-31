import { useState } from "react";
import { PaystackButton } from "react-paystack";
import { supabase } from "../supabaseClient";
import LiveQueueButton from "../components/LiveQueueButton.jsx";
import "./TraditionalSATemplate.css";

export default function TraditionalSATemplate({ state, storeId }) {
  const { header, banner, menuItems, about, liveQueue } = state;
  const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [processing, setProcessing] = useState(false);

  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [askItem, setAskItem] = useState(null);
  const [askName, setAskName] = useState("");
  const [askPhone, setAskPhone] = useState("");
  const [askMessage, setAskMessage] = useState("");
  const [askSending, setAskSending] = useState(false);

  // ✅ Cart Helpers
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((x) => x.id === item.id);
      if (existing) {
        return prev.map((x) =>
          x.id === item.id ? { ...x, qty: (x.qty || 1) + 1 } : x
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
    setTotal((t) => t + item.price);
  };

  const incQty = (i) => {
    const item = cart[i];
    setCart((prev) =>
      prev.map((x, idx) =>
        idx === i ? { ...x, qty: (x.qty || 1) + 1 } : x
      )
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

  // ✅ Paystack Payment Success
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
      alert("✅ Order placed successfully!");
      clearCart();
      setIsCartOpen(false);
    } catch (err) {
      console.error(err.message);
      alert("⚠️ Something went wrong processing your order.");
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

    const handleTestPayment = async () => {
    if (!customerName || !customerPhone) {
      alert("?? Please fill in your name and phone number");
      return;
    }
    try {
      setProcessing(true);
      const orderItems = cart.map((c) => ({ item: c.name, qty: c.qty || 1, price: c.price }));
      const { error } = await supabase.from("orders").insert([{
        store_id: storeId,
        customer: customerName,
        phone: customerPhone,
        items: orderItems,
        total,
        payment_status: "paid",
        payment_method: "test",
        payment_reference: `TEST-${Date.now()}`,
      }]);
      if (error) throw error;
      alert("? Test order placed successfully!");
      clearCart();
      setCustomerName("");
      setCustomerPhone("");
      setIsCartOpen(false);
    } catch (err) {
      alert("?? Something went wrong: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const paystackBtnProps = {
    ...paystackConfig,
    text: processing ? "Processing..." : "💳 Pay Now",
    onSuccess: handlePaystackSuccess,
    className: "checkout-btn",
    disabled: processing || total === 0,
  };

  // ✅ Ask if Available
  const askAvailability = async (item) => {
    const name = prompt("Your name:");
    const phone = prompt("Enter your WhatsApp number (e.g. 27821234567):");
    const msg = prompt(`Ask about "${item.name}" (e.g. Is this item available?)`);
    if (!phone || !msg) return alert("Please fill all fields.");

    try {
      const { error } = await supabase.from("notifications").insert([
        { store_id: storeId, customer_name: name, customer_phone: phone, message: msg },
      ]);
      if (error) throw error;
      alert("✅ Message sent! The owner will reply on WhatsApp.");
    } catch (err) {
      console.error("❌ Could not send message:", err.message);
    }
  };

  return (
    <div className="sa-page">
      {/* HEADER */}
      <header className="sa-header">
        <div className="sa-left">
          {header.showLogo && (
            <img
              src={header.logoDataUrl || "/logo.png"}
              alt="logo"
              className="sa-logo"
            />
          )}
          <h1>{header.storeName || "Mzansi Eats"}</h1>
        </div>
        <button className="cart-toggle" onClick={() => setIsCartOpen(true)}>
          🛒 Cart
          {cart.length > 0 && (
            <span className="cart-count">
              {cart.reduce((n, i) => n + (i.qty || 1), 0)}
            </span>
          )}
        </button>
      </header>

      {/* BANNER */}
      <section className="sa-banner">
        <h2>{banner.bannerText}</h2>
        <p>{banner.specialsText}</p>
        <div className={`store-status ${banner.isOpen ? "open" : "closed"}`}>
          {banner.isOpen ? "🟢 Open Now" : "🔴 Closed"}
        </div>
        {banner.showQueue && <LiveQueueButton liveQueue={liveQueue} />}
      </section>

      {/* MENU */}
      <section className="sa-menu">
        <h3>🍖 Menu</h3>
        <div className="menu-grid">
          {menuItems.length === 0 ? (
            <p>No menu items yet.</p>
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
                  <p>R{item.price}</p>
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

      {/* ABOUT */}
      <section className="sa-about">
        <h3>About Us</h3>
        <p>{about.text || "Authentic South African flavors served fresh daily 🇿🇦"}</p>
      </section>

      {/* SIDEBAR CART */}
      {isCartOpen && (
        <div className="cart-overlay" onClick={() => setIsCartOpen(false)}>
          <aside className="cart-sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="cart-header">
              <h2>Your Cart</h2>
              <button className="close-cart" onClick={() => setIsCartOpen(false)}>
                ✕
              </button>
            </div>
            <div className="cart-items">
              {cart.length === 0 ? (
                <p className="cart-empty">No items in your cart.</p>
              ) : (
                cart.map((c, i) => (
                  <div key={i} className="cart-item">
                    <div className="cart-item-info">
                      <h4>{c.name}</h4>
                      <p>R{c.price}</p>
                      <div className="qty-row">
                        <button onClick={() => decQty(i)}>-</button>
                        <span>{c.qty || 1}</span>
                        <button onClick={() => incQty(i)}>+</button>
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
                  type="text"
                  placeholder="Your name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
                <input
                  type="tel" placeholder="WhatsApp number (e.g. 0821234567)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                />
                <PaystackButton {...paystackBtnProps} />
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
              <h2>?? Want to ask?</h2>
              <button className="close-modal" onClick={() => setIsAskModalOpen(false)}>
                ?
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
                  <input type="text" className="ask-input" placeholder="Enter your name" value={askName} onChange={(e) => setAskName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>WhatsApp Number</label>
                  <input type="tel" className="ask-input" placeholder="e.g. 27821234567" value={askPhone} onChange={(e) => setAskPhone(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Your Question</label>
                  <textarea className="ask-textarea" placeholder="What would you like to know?" rows="4" value={askMessage} onChange={(e) => setAskMessage(e.target.value)} />
                </div>
                <button className="ask-submit-btn" onClick={submitAskQuestion} disabled={askSending}>
                  {askSending ? "Sending..." : "?? Send Message"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}






