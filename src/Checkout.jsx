// src/Checkout.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PaystackButton } from "react-paystack";
import { supabase } from "./supabaseClient";
import { useCart } from "./hooks/useCart";
import "./Checkout.css";

export default function Checkout() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const cart = useCart(slug);

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

  const { items, getTotal, clearCart } = cart;

  const total = getTotal();
  const totalInKobo = Math.round(total * 100); // Paystack uses kobo (cents)

  /* -------------------------------------------------------
     Fetch Store Data to get PayFast/Paystack keys
  ------------------------------------------------------- */
  const [store, setStore] = useState(null);
  const [storeLoaded, setStoreLoaded] = useState(false);

  useEffect(() => {
    async function loadStore() {
      const { data, error } = await supabase
        .from("stores")
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
     Paystack Configuration
  ------------------------------------------------------- */
  const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_xxxxxxxxxxxxxxxxxxxxxx";

  const paystackConfig = {
    publicKey: paystackPublicKey,
    email: customerPhone ? `${customerPhone.replace(/\D/g, '')}@mzansifood.co.za` : "customer@mzansifood.co.za",
    amount: totalInKobo,
    currency: "ZAR",
    reference: `MFC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    metadata: {
      custom_fields: [
        {
          display_name: "Customer Name",
          variable_name: "customer_name",
          value: customerName,
        },
        {
          display_name: "Phone Number",
          variable_name: "phone",
          value: customerPhone,
        },
        {
          display_name: "Store",
          variable_name: "store_slug",
          value: slug,
        },
        {
          display_name: "Store ID",
          variable_name: "store_id",
          value: store?.id || "",
        },
      ],
    },
  };

  /* -------------------------------------------------------
     Handle Payment Success
  ------------------------------------------------------- */
  const handlePaymentSuccess = async (reference) => {
    console.log('💳 Payment successful:', reference);
    setLoading(true);

    try {
      // Generate order number in format: C067, F873, etc (random letter + 3 digits)
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const randomLetter = letters[Math.floor(Math.random() * letters.length)];
      const randomDigits = Math.floor(Math.random() * 900) + 100; // 100-999
      const orderNumber = `${randomLetter}${randomDigits}`;

      // Create order in Supabase with correct field names
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            store_id: store.id,
            customer_name: customerName, // 🔥 FIX: Use customer_name not customer
            phone: customerPhone,
            items: items.map((item) => ({
              item: item.name, // 🔥 FIX: Use 'item' field name as expected by database
              qty: item.qty,
              price: item.price,
            })),
            total,
            payment_status: "paid",
            payment_reference: reference.reference,
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
      alert(`✅ Payment Successful!\n\nOrder Number: ${orderNumber}\nTotal: R${total.toFixed(2)}\n\nYou'll receive a WhatsApp notification when your order is ready!`);

      // Redirect to store
      navigate(`/store/${slug}`);
    } catch (err) {
      console.error("Order creation error:", err);
      alert(`⚠️ Payment was successful but order creation failed.\n\nPlease contact ${store?.name} with your payment reference:\n${reference.reference}`);
      setError("Failed to create order. Please contact the store with your payment reference.");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------
     Handle Payment Close (Cancel)
  ------------------------------------------------------- */
  const handlePaymentClose = () => {
    alert("Payment cancelled. Your cart is still saved.");
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
            <PaystackButton
              {...paystackConfig}
              text={loading ? "Processing..." : `Pay R${total.toFixed(2)}`}
              onSuccess={handlePaymentSuccess}
              onClose={handlePaymentClose}
              className="paystack-button"
              disabled={loading}
            />
          ) : (
            <button className="paystack-button disabled" disabled>
              Please fill in all fields
            </button>
          )}
          <p className="checkout-secure">🔒 Secure payment powered by Paystack</p>
        </div>
      </div>
    </div>
  );
}
