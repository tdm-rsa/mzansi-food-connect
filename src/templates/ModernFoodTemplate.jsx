import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import LiveQueueButton from "../components/LiveQueueButton.jsx";
import PhoneInput from "../components/PhoneInput.jsx";
import { generateOrderNumber } from "../utils/orderNumber";
import "./ModernFoodTemplate.css"; // ✅ NEW: use the Jersey-like CSS

export default function ModernFoodTemplate(props) {
  const { state, storeId, cart: extCart } = props;
  const { header, banner, menuItems, about, liveQueue, yoco_public_key, yoco_secret_key } = state;


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

  // 🔥 NEW: Banner modals state
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);


  // Add, remove, qty helpers
  const addToCart = (item) => {
    if (extCart?.addItem) {
      extCart.addItem({ id: item.id, name: item.name, price: item.price, qty: 1, image_url: item.image_url });
      return;
    }
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
    // Clear from localStorage too
    try {
      localStorage.removeItem(cartStorageKey);
    } catch (error) {
      console.error('Failed to clear cart from localStorage:', error);
    }
  };

  // Yoco configuration - Use store key from database, fallback to env variable
  const yocoPublicKey = yoco_public_key || import.meta.env.VITE_YOCO_PUBLIC_KEY;
  const totalInCents = Math.round(total * 100); // Yoco uses cents

  // Load Yoco SDK
  useEffect(() => {
    if (!document.getElementById('yoco-sdk')) {
      const script = document.createElement('script');
      script.id = 'yoco-sdk';
      script.src = 'https://js.yoco.com/sdk/v1/yoco-sdk-web.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Debug: Log Yoco setup
  useEffect(() => {
    if (!yocoPublicKey) {
      console.error('❌ YOCO PUBLIC KEY MISSING! Vendor needs to add Yoco keys in Settings');
    } else {
      console.log('✅ Yoco public key loaded:', yocoPublicKey.substring(0, 20) + '...');
      console.log('   Source:', yoco_public_key ? 'Database (store settings)' : 'Environment variable');
    }

    const secretKey = yoco_secret_key || import.meta.env.VITE_YOCO_SECRET_KEY;
    if (!secretKey) {
      console.warn('⚠️ Yoco secret key not configured (needed for payment verification)');
    } else {
      console.log('✅ Yoco secret key loaded:', secretKey.substring(0, 20) + '...');
      console.log('   Source:', yoco_secret_key ? 'Database (store settings)' : 'Environment variable');
    }
  }, [yocoPublicKey, yoco_public_key, yoco_secret_key]);

  // ✅ Create Order after Payment Success
  const createOrder = async (paymentId) => {
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
          payment_reference: paymentId,
          order_number: orderNumber,
        },
      ]);

      if (error) throw error;
      alert(`✅ Payment successful! Order placed.\n\nOrder #${orderNumber}\nPayment Ref: ${paymentId}\n\nThank you! 🎉`);
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

  // ✅ Handle Yoco Payment
  const handleYocoPayment = async () => {
    if (!yocoPublicKey) {
      alert('⚠️ Payment is not configured. Please contact the store.');
      return;
    }

    if (!window.YocoSDK) {
      alert('⚠️ Payment system is loading. Please try again in a moment.');
      return;
    }

    setProcessing(true);

    try {
      const sdk = new window.YocoSDK({
        publicKey: yocoPublicKey,
      });

      sdk.showPopup({
        amountInCents: totalInCents,
        currency: 'ZAR',
        name: header.storeName || 'Mzansi Food Connect',
        description: `Order from ${header.storeName}`,
        metadata: {
          customerName: customerName,
          customerPhone: customerPhone,
          storeId: storeId,
        },
        callback: async function (result) {
          if (result.error) {
            console.error('Yoco payment error:', result.error);
            alert('❌ Payment failed: ' + result.error.message);
            setProcessing(false);
            return;
          }

          // Payment successful
          console.log('💳 Yoco payment successful:', result);
          await createOrder(result.id);
        },
      });
    } catch (err) {
      console.error('Yoco SDK error:', err);
      alert('⚠️ Payment initialization failed. Please try again.');
      setProcessing(false);
    }
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
          <h1 style={{ fontSize: `${header.fontSize || 20}px` }}>{header.storeName}</h1>
        </div>

        <div className="header-actions">
          {!extCart && (
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
          )}
        </div>
      </header>

      {/* ===== Banner ===== */}
      <section className="store-banner">
        <h2 style={{ fontSize: `${banner.fontSize || 28}px` }}>{banner.bannerText}</h2>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
          <div className={`store-status ${banner.isOpen ? "open" : "closed"}`}>
            {banner.isOpen ? "🟢 Open Now" : "🔴 Closed"}
          </div>
          {banner.isOpen && state.estimated_time > 0 && (
            <div style={{
              padding: "0.5rem 1rem",
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "white",
              borderRadius: "25px",
              fontWeight: "600",
              fontSize: "0.9rem",
              boxShadow: "0 2px 8px rgba(245, 158, 11, 0.3)"
            }}>
              ⏱️ Wait time: ~{state.estimated_time} min
            </div>
          )}
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

      {/* ===== About ===== */}
      <section className="store-about">
        <h3>About Us</h3>
        <p style={{ fontSize: `${about.fontSize || 16}px` }}>{about.text}</p>

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

      {/* ===== Cart Sidebar (overlay + drawer) ===== */}
      {!extCart && isCartOpen && (
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
                    {c.image_url && (
                      <div className="cart-item-image">
                        <img src={c.image_url} alt={c.name} />
                      </div>
                    )}
                    <div className="cart-item-info">
                      <h4 className="cart-item-name">{c.name}</h4>
                      <p className="cart-item-price">R{c.price}</p>
                      <div className="qty-row">
                        <button className="qty-btn" onClick={() => decQty(i)}>-</button>
                        <span>{c.qty || 1}</span>
                        <button className="qty-btn" onClick={() => incQty(i)}>+</button>
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
                  className="checkout-input"
                  type="text"
                  placeholder="Your name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
                <PhoneInput
                  className="checkout-input"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                />

                {/* Yoco Payment Button */}
                {/* Debug checkout button conditions */}
                {console.log('🔍 Checkout button conditions:', {
                  processing,
                  total,
                  customerName,
                  customerPhone,
                  yocoPublicKey: yocoPublicKey ? 'present' : 'missing',
                  shouldShow: !processing && total > 0 && customerName && customerPhone && yocoPublicKey
                })}
                {!processing && total > 0 && customerName && customerPhone && yocoPublicKey ? (
                  <button
                    onClick={handleYocoPayment}
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
                  >
                    💳 Pay R{total.toFixed(2)}
                  </button>
                ) : (
                  <button
                    className="checkout-btn"
                    disabled={true}
                    style={{
                      background: "#ccc",
                      opacity: 0.6
                    }}
                    title={
                      processing ? "Processing..." :
                      total === 0 ? "Cart is empty" :
                      !customerName ? "Enter your name" :
                      !customerPhone ? "Enter your phone number" :
                      !yocoPublicKey ? "Payment not configured" :
                      "Fill all fields"
                    }
                  >
                    {processing ? "Processing Payment..." :
                     total === 0 ? "💳 Add items to cart" :
                     !customerName ? "💳 Enter your name" :
                     !customerPhone ? "💳 Enter your phone" :
                     !yocoPublicKey ? "💳 Payment not available" :
                     "💳 Pay with Card"}
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
                  <PhoneInput
                    className="ask-input"
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
