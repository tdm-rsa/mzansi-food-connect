// src/Checkout.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { useCart } from "./hooks/useCart";
import { useToast } from "./hooks/useToast";
import { getSubdomain } from "./utils/subdomain";
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

  /* -------------------------------------------------------
     Fetch Store Data to get Yoco keys
  ------------------------------------------------------- */
  const [store, setStore] = useState(null);
  const [storeLoaded, setStoreLoaded] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    async function loadStore() {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error || !data) {
        setError("Store not found");
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
     Handle Yoco Payment
  ------------------------------------------------------- */
  const handleYocoPayment = async () => {
    if (!yocoPublicKey) {
      toast.error('Payment is not configured. Please contact the store.');
      return;
    }

    if (!window.YocoSDK) {
      toast.warning('Payment system is loading. Please try again in a moment.');
      return;
    }

    setProcessingPayment(true);

    try {
      const sdk = new window.YocoSDK({
        publicKey: yocoPublicKey,
      });

      // Create checkout
      sdk.showPopup({
        amountInCents: totalInCents,
        currency: 'ZAR',
        name: store?.name || 'Mzansi Food Connect',
        description: `Order from ${store?.name}`,
        metadata: {
          customerName: customerName,
          customerPhone: customerPhone,
          storeSlug: slug,
          storeId: store?.id || '',
        },
        callback: async function (result) {
          if (result.error) {
            console.error('Yoco payment error:', result.error);
            toast.error(`Payment failed: ${result.error.message}\nPlease try again or contact the store.`);
            setProcessingPayment(false);
            return;
          }

          // Payment successful
          console.log('💳 Yoco payment successful:', result);
          await createOrder(result.id);
        },
      });
    } catch (err) {
      console.error('Yoco SDK error:', err);
      toast.error('Payment initialization failed. Please try again.');
      setProcessingPayment(false);
    }
  };

  /* -------------------------------------------------------
     Create Order after Payment Success
  ------------------------------------------------------- */
  const createOrder = async (paymentId) => {
    setLoading(true);

    try {
      console.log('💳 Payment successful! ID:', paymentId);

      // Generate order number in format: C067, F873, etc (random letter + 3 digits)
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const randomLetter = letters[Math.floor(Math.random() * letters.length)];
      const randomDigits = Math.floor(Math.random() * 900) + 100; // 100-999
      const orderNumber = `${randomLetter}${randomDigits}`;

      // Create order directly (Yoco SDK doesn't trigger webhooks, only Checkout API does)
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            store_id: store.id,
            customer_name: customerName,
            phone: customerPhone,
            items: items.map((item) => ({
              item: item.name,
              qty: item.qty,
              price: item.price,
              instructions: item.instructions || "",
            })),
            total,
            payment_status: "paid",
            payment_reference: paymentId,
            order_number: orderNumber,
            status: "pending",
            estimated_time: 0,
          },
        ])
        .select()
        .single();

      if (orderError) {
        console.error('❌ Order creation error:', orderError);
        throw orderError;
      }

      console.log('✅ Order created:', orderData);

      // Clear cart
      clearCart();

      // Show success message with order number
      toast.success(
        `Payment Successful!\n\nOrder Number: ${orderNumber}\nTotal: R${total.toFixed(2)}\n\nYou'll receive a WhatsApp notification when your order is ready!`,
        6000
      );

      // Redirect to store after delay
      setTimeout(() => {
        navigate(`/store/${slug}`);
      }, 2000);
    } catch (err) {
      console.error("Order creation error:", err);
      toast.error(
        `Payment was successful but order creation failed.\n\nPlease contact ${store?.name} with your payment ID:\n${paymentId}`,
        8000
      );
      setError("Failed to create order. Please contact the store with your payment reference.");
    } finally {
      setLoading(false);
      setProcessingPayment(false);
    }
  };

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
                <input
                  type="text"
                  placeholder="Add notes (hot, extra chilli, no sauce...)"
                  value={item.instructions || ""}
                  onChange={(e) => updateItem(item.id, { instructions: e.target.value })}
                  style={{
                    marginTop: "0.35rem",
                    width: "100%",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    padding: "0.55rem 0.75rem",
                    fontSize: "0.95rem",
                  }}
                />
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
