import { useState } from "react";
import { PaystackButton } from "react-paystack";
import { supabase } from "../supabaseClient";
import "./FastMobileTemplate.css";

export default function FastMobileTemplate({ state, storeId }) {
  const { header, banner, menuItems, about } = state;
  const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [processing, setProcessing] = useState(false);

  // ? Ask modal state
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [askItem, setAskItem] = useState(null);
  const [askName, setAskName] = useState("");
  const [askPhone, setAskPhone] = useState("");
  const [askMessage, setAskMessage] = useState("");
  const [askSending, setAskSending] = useState(false);

  // ✅ Add to cart
  const addToCart = (item) => {
    setCart((prev) => {
      const found = prev.find((x) => x.id === item.id);
      if (found) {
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

  // ✅ Paystack checkout
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
      alert("⚠️ Payment could not be processed.");
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
      alert("⚠️ Please fill in your name and phone number");
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
      alert("✅ Test order placed successfully!");
      clearCart();
      setCustomerName("");
      setCustomerPhone("");
      setIsCartOpen(false);
    } catch (err) {
      alert("⚠️ Something went wrong: " + err.message);
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

  // ✅ Ask modal controls
  const openAskModal = (item) => {
    setAskItem(item);
    setAskMessage(`Is "${item.name}" available?`);
    setIsAskModalOpen(true);
  };

  const submitAskQuestion = async () => {
    if (!askName || !askPhone || !askMessage) {
      alert("Please fill in all fields");
      return;
    }
    try {
      setAskSending(true);
      const { error } = await supabase.from("notifications").insert([
        { store_id: storeId, customer_name: askName, customer_phone: askPhone, message: askMessage },
      ]);
      if (error) throw error;
      alert("✅ Message sent! The store will reply on WhatsApp.");
      setIsAskModalOpen(false);
      setAskName("");
      setAskPhone("");
      setAskMessage("");
    } catch (err) {
      alert("⚠️ Failed to send message.");
    } finally {
      setAskSending(false);
    }
  };

  return (
    <div className="fast-page">
      {/* HEADER */}
      <header className="fast-header">
        <div className="fast-left">
          {header.showLogo && (
            <img
              src={header.logoDataUrl || "/logo.png"}
              alt="logo"
              className="fast-logo"
            />
          )}
          <h1>{header.storeName || "Fast Eats"}</h1>
        </div>
      </header>

      {/* BANNER */}
      <section className="fast-banner">
        <h2>{banner.bannerText}</h2>
        {banner.specialsText && <p>{banner.specialsText}</p>}
        <div className={`status ${banner.isOpen ? "open" : "closed"}`}>
          {banner.isOpen ? "🟢 Open Now" : "🔴 Closed"}
        </div>
      </section>

      {/* MENU */}
      <section className="fast-menu">
        <h3>🍔 Menu</h3>
        <div className="menu-grid">
          {menuItems.length === 0 ? (
            <p className="empty">No items yet.</p>
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
                    <button onClick={() => addToCart(item)}>🛒 Add</button>
                    <button onClick={() => openAskModal(item)}>💬 Ask</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ABOUT */}
      <section className="fast-about">
        <h3>About</h3>
        <p>{about.text || "Quick, tasty meals delivered with speed!"}</p>
      </section>

      {/* FLOATING CART BUTTON */}
      {cart.length > 0 && (
        <button className="fab-cart" onClick={() => setIsCartOpen(true)}>
          🛍️ <span>{cart.reduce((n, i) => n + (i.qty || 1), 0)}</span>
        </button>
      )}

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
                <p className="cart-empty">Your cart is empty.</p>
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
                />
                <input
                  type="tel" placeholder="WhatsApp number (e.g. 0821234567)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                />
                <button
                  className="checkout-btn"
                  onClick={handleTestPayment}
                  disabled={processing || total === 0 || !customerName || !customerPhone}
                  style={{ background: "linear-gradient(135deg, #10b981, #059669)", marginBottom: "0.5rem" }}
                >
                  {processing ? "Processing..." : "✅ Place Test Order"}
                </button>
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






