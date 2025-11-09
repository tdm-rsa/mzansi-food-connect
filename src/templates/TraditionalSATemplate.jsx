import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { PaystackButton } from "react-paystack";
import LiveQueueButton from "../components/LiveQueueButton.jsx";
import PhoneInput from "../components/PhoneInput.jsx";
import { generateOrderNumber } from "../utils/orderNumber";
import "./TraditionalSATemplate.css";

export default function TraditionalSATemplate(props) {
  const { state, storeId, cart: extCart } = props;
  const { header, banner, menuItems, about, liveQueue } = state;

  // DEBUG: Log what data the template receives
  useEffect(() => {
    console.log("🎨 TraditionalSATemplate - banner.showInstructions:", banner.showInstructions);
    console.log("🎨 TraditionalSATemplate - banner.instructions:", banner.instructions);
    console.log("🎨 TraditionalSATemplate - banner.showNotes:", banner.showNotes);
    console.log("🎨 TraditionalSATemplate - banner.notes:", banner.notes);
  }, [banner]);

  // ✅ Cart state with localStorage persistence
  const cartStorageKey = `cart_${storeId}`;

  const [cart, setCart] = useState(() => {
    // Load cart from localStorage on mount
    try {
      const savedCart = localStorage.getItem(cartStorageKey);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
      return [];
    }
  });

  const [total, setTotal] = useState(() => {
    // Calculate total from saved cart
    try {
      const savedCart = localStorage.getItem(cartStorageKey);
      if (savedCart) {
        const cartItems = JSON.parse(savedCart);
        return cartItems.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
      }
    } catch (error) {
      console.error('Failed to calculate total from localStorage:', error);
    }
    return 0;
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(cartStorageKey, JSON.stringify(cart));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [cart, cartStorageKey]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [processing, setProcessing] = useState(false);

  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [askItem, setAskItem] = useState(null);
  const [askName, setAskName] = useState("");
  const [askPhone, setAskPhone] = useState("");
  const [askMessage, setAskMessage] = useState("");
  const [askSending, setAskSending] = useState(false);

  // Instructions and Notes dropdown state
  const [showInstructions, setShowInstructions] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  // 🔥 NEW: Banner modals state
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);

  // ✅ Cart Helpers
  const addToCart = (item) => {
    if (extCart?.addItem) {
      extCart.addItem({ id: item.id, name: item.name, price: item.price, qty: 1, image_url: item.image_url });
      return;
    }
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
    // Clear from localStorage too
    try {
      localStorage.removeItem(cartStorageKey);
    } catch (error) {
      console.error('Failed to clear cart from localStorage:', error);
    }
  };

  // ✅ Paystack Payment Handler
  const handlePaymentSuccess = async (reference) => {
    try {
      setProcessing(true);

      const orderItems = cart.map((c) => ({
        item: c.name,
        qty: c.qty || 1,
        price: c.price,
      }));

      const orderNumber = generateOrderNumber();

      const { error } = await supabase.from("orders").insert([
        {
          store_id: storeId,
          customer_name: customerName,
          phone: customerPhone,
          items: orderItems,
          total,
          payment_status: "paid",
          payment_reference: reference.reference,
          order_number: orderNumber,
        },
      ]);

      if (error) throw error;
      alert(`✅ Payment successful! Order placed.\n\nOrder #${orderNumber}\nPayment Ref: ${reference.reference}\n\nThank you! 🎉`);
      clearCart();
      setCustomerName("");
      setCustomerPhone("");
      setIsCartOpen(false);
    } catch (err) {
      console.error(err.message);
      alert("⚠️ Order failed after payment: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentClose = () => {
    alert("❌ Payment cancelled");
  };

  // Paystack configuration
  const paystackConfig = {
    reference: `ORD-${new Date().getTime()}`,
    email: customerPhone ? `${customerPhone.replace(/\D/g, '')}@customer.mzansifoodconnect.app` : 'customer@mzansifoodconnect.app',
    amount: Math.round(total * 100), // Amount in cents
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
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
          status: "pending",
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
          <h1 style={{ fontSize: `${header.fontSize || 20}px` }}>{header.storeName || "My Store"}</h1>
        </div>
        {!extCart && (
          <button className="cart-toggle" onClick={() => setIsCartOpen(true)}>
            🛒 Cart
            {cart.length > 0 && (
              <span className="cart-count">
                {cart.reduce((n, i) => n + (i.qty || 1), 0)}
              </span>
            )}
          </button>
        )}
      </header>

      {/* BANNER */}
      <section className="sa-banner">
        <h2 style={{ fontSize: `${banner.fontSize || 28}px` }}>{banner.bannerText}</h2>
        <div className={`store-status ${banner.isOpen ? "open" : "closed"}`}>
          {banner.isOpen ? "🟢 Open Now" : "🔴 Closed"}
        </div>

        {/* Banner Action Buttons */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem", justifyContent: "center" }}>
          {banner.specialsText && (
            <button
              className="queue-btn"
              onClick={() => setShowAnnouncementsModal(true)}
              style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
            >
              📢 Announcements
            </button>
          )}

          {banner.showQueue && (
            <LiveQueueButton storeInfo={{ id: storeId, name: header.storeName, slug: state.slug }} />
          )}

          {state.show_instructions && state.instructions && (
            <button
              className="queue-btn"
              onClick={() => setShowInstructionsModal(true)}
              style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}
            >
              ℹ️ Instructions
            </button>
          )}
        </div>
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
                    <button
                      className="btn-primary"
                      onClick={() => addToCart(item)}
                      disabled={!banner.isOpen}
                      style={{
                        opacity: banner.isOpen ? 1 : 0.5,
                        cursor: banner.isOpen ? "pointer" : "not-allowed",
                      }}
                      title={!banner.isOpen ? "Store is closed" : ""}
                    >
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
        <p style={{ fontSize: `${about.fontSize || 16}px` }}>{about.text || "Authentic South African flavors served fresh daily 🇿🇦"}</p>

        {/* Instructions Section */}
        {banner.showInstructions && banner.instructions && (
          <div style={{
            marginTop: "2rem",
            padding: "1.5rem",
            background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
            borderRadius: "12px",
            border: "2px solid #3b82f6",
            boxShadow: "0 4px 15px rgba(59, 130, 246, 0.2)",
            textAlign: "left"
          }}>
            <h4 style={{ margin: "0 0 1rem 0", color: "#1e40af", fontSize: "1.1rem", fontWeight: "700" }}>
              📋 Store Instructions
            </h4>
            <ul style={{ margin: 0, paddingLeft: "1.5rem", color: "#1e3a8a", lineHeight: "1.8" }}>
              {banner.instructions.split('\n').filter(line => line.trim()).map((line, i) => (
                <li key={i} style={{ marginBottom: "0.5rem" }}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Announcements Section */}
        {banner.showNotes && banner.notes && (
          <div style={{
            marginTop: "1.5rem",
            padding: "1.5rem",
            background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
            borderRadius: "12px",
            border: "2px solid #f59e0b",
            boxShadow: "0 4px 15px rgba(245, 158, 11, 0.2)",
            textAlign: "left"
          }}>
            <h4 style={{ margin: "0 0 1rem 0", color: "#92400e", fontSize: "1.1rem", fontWeight: "700" }}>
              📢 Announcements
            </h4>
            <div style={{ color: "#78350f", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>
              {banner.notes}
            </div>
          </div>
        )}

        {/* Social Links */}
        {about.socials && Object.keys(about.socials).filter(k => about.socials[k]).length > 0 && (
          <div className="social-links" style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            {about.socials.facebook && (
              <a
                href={about.socials.facebook.startsWith('http') ? about.socials.facebook : `https://facebook.com/${about.socials.facebook}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.2rem", background: "#1877F2", color: "white", borderRadius: "50px", textDecoration: "none", fontWeight: "600", boxShadow: "0 2px 8px rgba(24, 119, 242, 0.3)" }}
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" alt="" style={{ width: "20px", height: "20px" }} />
                Facebook
              </a>
            )}
            {about.socials.instagram && (
              <a
                href={about.socials.instagram.startsWith('http') ? about.socials.instagram : `https://instagram.com/${about.socials.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.2rem", background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)", color: "white", borderRadius: "50px", textDecoration: "none", fontWeight: "600", boxShadow: "0 2px 8px rgba(188, 24, 136, 0.3)" }}
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" alt="" style={{ width: "20px", height: "20px" }} />
                Instagram
              </a>
            )}
            {about.socials.whatsapp && (
              <a
                href={about.socials.whatsapp.startsWith('http') ? about.socials.whatsapp : `https://wa.me/${about.socials.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.2rem", background: "#25D366", color: "white", borderRadius: "50px", textDecoration: "none", fontWeight: "600", boxShadow: "0 2px 8px rgba(37, 211, 102, 0.3)" }}
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="" style={{ width: "20px", height: "20px" }} />
                WhatsApp
              </a>
            )}
            {about.socials.youtube && (
              <a
                href={about.socials.youtube.startsWith('http') ? about.socials.youtube : `https://youtube.com/${about.socials.youtube}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.2rem", background: "#FF0000", color: "white", borderRadius: "50px", textDecoration: "none", fontWeight: "600", boxShadow: "0 2px 8px rgba(255, 0, 0, 0.3)" }}
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg" alt="" style={{ width: "20px", height: "20px" }} />
                YouTube
              </a>
            )}
            {about.socials.tiktok && (
              <a
                href={about.socials.tiktok.startsWith('http') ? about.socials.tiktok : `https://tiktok.com/@${about.socials.tiktok}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.2rem", background: "#000000", color: "white", borderRadius: "50px", textDecoration: "none", fontWeight: "600", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)" }}
              >
                <img src="https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg" alt="" style={{ width: "20px", height: "20px" }} />
                TikTok
              </a>
            )}
          </div>
        )}
      </section>

      {/* SIDEBAR CART */}
      {!extCart && isCartOpen && (
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
                    {c.image_url && (
                      <div className="cart-item-image">
                        <img src={c.image_url} alt={c.name} />
                      </div>
                    )}
                    <div className="cart-item-info">
                      <h4>{c.name}</h4>
                      <p>R{c.price}</p>
                      <div className="qty-row">
                        <button onClick={() => decQty(i)}>-</button>
                        <span>{c.qty || 1}</span>
                        <button onClick={() => incQty(i)}>+</button>
                        <button 
                          className="remove-item" 
                          onClick={() => removeAt(i)}
                          style={{
                            background: "#ef4444",
                            color: "white",
                            border: "none"
                          }}
                        >
                          ❌
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
                <PhoneInput
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                />

                {/* Paystack Payment Button */}
                {!processing && total > 0 && customerName && customerPhone ? (
                  <PaystackButton
                    {...paystackConfig}
                    text={`💳 Pay R${total.toFixed(2)}`}
                    onSuccess={handlePaymentSuccess}
                    onClose={handlePaymentClose}
                    className="checkout-btn"
                    style={{
                      background: "linear-gradient(135deg, #667eea, #764ba2)",
                      color: "white",
                      border: "none",
                      padding: "1rem",
                      borderRadius: "12px",
                      fontSize: "1.1rem",
                      fontWeight: "bold",
                      cursor: "pointer",
                      width: "100%"
                    }}
                  />
                ) : (
                  <button
                    className="checkout-btn"
                    disabled={true}
                    style={{
                      background: "#ccc",
                      opacity: 0.6
                    }}
                  >
                    {processing ? "Processing Payment..." : "💳 Pay with Card"}
                  </button>
                )}
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
                  <input type="text" className="ask-input" placeholder="Enter your name" value={askName} onChange={(e) => setAskName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>WhatsApp Number</label>
                  <PhoneInput className="ask-input" value={askPhone} onChange={(e) => setAskPhone(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Your Question</label>
                  <textarea className="ask-textarea" placeholder="What would you like to know?" rows="4" value={askMessage} onChange={(e) => setAskMessage(e.target.value)} />
                </div>
                <button className="ask-submit-btn" onClick={submitAskQuestion} disabled={askSending}>
                  {askSending ? "Sending..." : "📤 Send Message"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Announcements Modal ===== */}
      {showAnnouncementsModal && (
        <div className="ask-modal-overlay" onClick={() => setShowAnnouncementsModal(false)}>
          <div className="ask-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ask-modal-header">
              <h2>📢 Announcements</h2>
              <button className="close-modal" onClick={() => setShowAnnouncementsModal(false)}>
                ✕
              </button>
            </div>

            <div className="ask-modal-body">
              <p style={{
                fontSize: '1.1rem',
                lineHeight: '1.6',
                color: '#333',
                whiteSpace: 'pre-wrap'
              }}>
                {banner.specialsText}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===== Instructions Modal ===== */}
      {showInstructionsModal && (
        <div className="ask-modal-overlay" onClick={() => setShowInstructionsModal(false)}>
          <div className="ask-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ask-modal-header">
              <h2>ℹ️ Instructions</h2>
              <button className="close-modal" onClick={() => setShowInstructionsModal(false)}>
                ✕
              </button>
            </div>

            <div className="ask-modal-body">
              <p style={{
                fontSize: '1.1rem',
                lineHeight: '1.6',
                color: '#333',
                whiteSpace: 'pre-wrap'
              }}>
                {state.instructions}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Live Queue Button */}
      <LiveQueueButton storeInfo={{ id: storeId, name: header.storeName }} />
    </div>
  );
}






