// src/Checkout.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { useCart } from "./hooks/useCart";
import { useToast } from "./hooks/useToast";
import { getSubdomain } from "./utils/subdomain";
import { isPlanActive } from "./utils/planFeatures";
import { validateName, validatePhone } from "./utils/validation";
import rateLimiter, { RATE_LIMITS } from "./utils/rateLimiter";
import Toast from "./components/Toast";
import "./Checkout.css";

export default function Checkout() {
  const { slug: pathSlug } = useParams();
  const subdomainSlug = getSubdomain();
  const slug = subdomainSlug || pathSlug;

  const navigate = useNavigate();
  const cart = useCart(slug);
  const toast = useToast();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [phoneDisplay, setPhoneDisplay] = useState("+27 "); // Display value with formatting
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔥 Format phone input like Luno: +27 XX XXX XXXX
  const handlePhoneChange = (e) => {
    let input = e.target.value;

    // Remove everything except digits
    let digits = input.replace(/\D/g, '');

    // If user tries to delete +27, keep it
    if (!input.startsWith('+27')) {
      input = '+27 ' + input.replace(/^\+?27\s?/, '');
      digits = input.replace(/\D/g, '').substring(2); // Remove 27 prefix
    } else {
      digits = digits.substring(2); // Remove 27 prefix from digits
    }

    // Limit to 9 digits after +27
    digits = digits.substring(0, 9);

    // Format: +27 XX XXX XXXX
    let formatted = '+27 ';
    if (digits.length > 0) {
      formatted += digits.substring(0, 2);
    }
    if (digits.length > 2) {
      formatted += ' ' + digits.substring(2, 5);
    }
    if (digits.length > 5) {
      formatted += ' ' + digits.substring(5, 9);
    }

    setPhoneDisplay(formatted);
    // Store clean phone number for backend
    setCustomerPhone(digits.length > 0 ? '+27' + digits : '');
  };

  const { items, getTotal, clearCart, updateItem } = cart;

  const total = getTotal();
  const totalInCents = Math.round(total * 100); // Yoco uses cents

  const togglePreference = (itemId, pref) => {
    const item = items.find((it) => it.id === itemId);
    if (!item) return;
    const selected = new Set(item.selectedPreferences || []);
    if (selected.has(pref)) {
      if (selected.size <= 1) return;
      selected.delete(pref);
    } else {
      selected.add(pref);
    }
    updateItem(itemId, { selectedPreferences: Array.from(selected) });
  };

  /* -------------------------------------------------------
     Fetch Store Data to get Yoco keys
  ------------------------------------------------------- */
  const [store, setStore] = useState(null);
  const [storeLoaded, setStoreLoaded] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    async function loadStore() {

      if (!slug) {
        
        setError("Store slug not provided");
        setStoreLoaded(true);
        return;
      }

      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error || !data) {
        
        setError(`Store not found: ${slug}`);
        setStoreLoaded(true);
        return;
      }

      setStore(data);
      setStoreLoaded(true);
    }

    loadStore();
  }, [slug]);

  /* -------------------------------------------------------
     Yoco Configuration
  ------------------------------------------------------- */
  // Use vendor's Yoco key if available, otherwise fallback to platform key
  const yocoPublicKey = store?.yoco_public_key || import.meta.env.VITE_YOCO_PUBLIC_KEY;

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

  /* -------------------------------------------------------
     Handle Yoco Payment (Checkout API)
  ------------------------------------------------------- */
  const handleYocoPayment = async () => {
    setError("");

    // Rate limiting check
    const rateLimit = rateLimiter.checkLimit(
      `checkout_${slug}`,
      RATE_LIMITS.CHECKOUT.maxAttempts,
      RATE_LIMITS.CHECKOUT.windowMs
    );

    if (!rateLimit.allowed) {
      toast.error(rateLimit.message);
      setError(rateLimit.message);
      return;
    }

    // Validate customer name
    const nameValidation = validateName(customerName, 'Customer name');
    if (!nameValidation.valid) {
      toast.error(nameValidation.error);
      setError(nameValidation.error);
      return;
    }

    // Validate phone number
    const phoneValidation = validatePhone(customerPhone);
    if (!phoneValidation.valid) {
      toast.error(phoneValidation.error);
      setError(phoneValidation.error);
      return;
    }

    // Validate cart has items
    if (!items || items.length === 0) {
      toast.error('Your cart is empty');
      setError('Your cart is empty');
      return;
    }

    setProcessingPayment(true);
    setLoading(true);

    try {
      // Generate order number
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const randomLetter = letters[Math.floor(Math.random() * letters.length)];
      const randomDigits = Math.floor(Math.random() * 900) + 100;
      const orderNumber = `${randomLetter}${randomDigits}`;

      // Call Supabase Edge Function to create checkout session
      const { data, error } = await supabase.functions.invoke('create-yoco-checkout', {
        body: {
          storeId: store.id,
          storeName: store.name,
          storeSlug: slug,
          customerName: customerName,
          customerPhone: customerPhone,
          items: items.map((item) => ({
            item: item.name,
            qty: item.qty,
            price: item.price,
            instructions: item.instructions || "",
            preferences: item.selectedPreferences || [],
          })),
          total,
          orderNumber
        }
      });

      if (error) {
        
        throw error;
      }

      if (!data || !data.redirectUrl) {
        throw new Error('No redirect URL received from payment provider');
      }

      // Redirect to Yoco hosted checkout page
      window.location.href = data.redirectUrl;

    } catch (err) {
      
      toast.error('Failed to initialize payment. Please try again.');
      setProcessingPayment(false);
      setLoading(false);
    }
  };

  // Note: Order creation is now handled by the webhook after payment confirmation

  /* -------------------------------------------------------
     Validation
  ------------------------------------------------------- */
  const isValid = customerName.trim().length > 0 && customerPhone.length >= 12; // +27XXXXXXXXX = 12 chars

  if (!storeLoaded) {
    return (
      <div className="checkout-loading">
        <h2>Loading checkout...</h2>
      </div>
    );
  }

  // Block checkout if store plan is expired
  if (store && !isPlanActive(store)) {
    return (
      <div className="checkout-empty">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
          <h2>Store Temporarily Unavailable</h2>
          <p style={{ color: '#666', marginTop: '1rem' }}>
            This store is currently unable to accept new orders.
            <br />
            Please check back later or contact the store directly.
          </p>
          <button onClick={() => navigate(`/store/${slug}`)} className="btn-back" style={{ marginTop: '1.5rem' }}>
            ← Back to Store
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="checkout-empty">
        <h2>Your cart is empty 😢</h2>
        <button onClick={() => navigate(`/store/${slug}`)} className="btn-back">
          ← Back to Store
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="checkout-page">
        <div className="checkout-container">
          {/* Header */}
          <div className="checkout-header">
            <button onClick={() => navigate(`/store/${slug}`)} className="checkout-back-btn">
              ← Back
            </button>
            <h1>Checkout</h1>
            <p>{store?.name}</p>
          </div>

        {/* Error Message */}
        {error && (
          <div className="checkout-error">
            ⚠️ {error}
          </div>
        )}

        {/* Order Summary */}
        <div className="checkout-section">
          <h2>📦 Order Summary</h2>
          <div className="checkout-items">
            {items.map((item) => (
              <div key={item.id} className="checkout-item">
                <div className="checkout-item-info">
                  <span className="checkout-item-name">{item.name}</span>
                  <span className="checkout-item-qty">× {item.qty}</span>
                </div>
                <span className="checkout-item-price">
                  R{(item.price * item.qty).toFixed(2)}
                </span>
                {Array.isArray(item.availablePreferences) && item.availablePreferences.length > 0 && (
                  <div style={{ marginTop: "0.35rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {item.availablePreferences.map((pref) => (
                      <label
                        key={pref}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          padding: "0.3rem 0.5rem",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          background: (item.selectedPreferences || []).includes(pref) ? "rgba(102,126,234,0.12)" : "#fff",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={(item.selectedPreferences || []).includes(pref)}
                          onChange={() => togglePreference(item.id, pref)}
                        />
                        <span>{pref}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="checkout-total">
            <span>Total:</span>
            <span className="checkout-total-price">R{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Customer Details */}
        <div className="checkout-section">
          <h2>👤 Your Details</h2>
          <div className="checkout-form">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                placeholder="Enter your name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number (WhatsApp) *</label>
              <input
                type="tel"
                id="phone"
                placeholder="+27 XX XXX XXXX"
                value={phoneDisplay}
                onChange={handlePhoneChange}
                required
                style={{
                  fontFamily: 'monospace',
                  fontSize: '1rem',
                  letterSpacing: '0.05em'
                }}
              />
              <small>🔒 We'll send order updates via WhatsApp</small>
            </div>
          </div>
        </div>

        {/* Payment Button */}
        <div className="checkout-payment">
          {isValid ? (
            <button
              onClick={handleYocoPayment}
              className="paystack-button"
              disabled={loading || processingPayment}
            >
              {processingPayment ? "Processing..." : `Pay R${total.toFixed(2)}`}
            </button>
          ) : (
            <button className="paystack-button disabled" disabled>
              Please fill in all fields
            </button>
          )}
          <p className="checkout-secure">🔒 Secure payment powered by Yoco</p>
        </div>
        </div>
      </div>

      {/* Toast Notifications */}
      {toast.toasts.map(t => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => toast.removeToast(t.id)} duration={t.duration} />
      ))}
    </>
  );
}
