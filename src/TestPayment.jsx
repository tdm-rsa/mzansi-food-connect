// Test Payment Page for Platinum Stores
// Simulates payment without going to Yoco
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "./supabaseClient";
import "./TestPayment.css";

export default function TestPayment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);

  const checkoutId = searchParams.get("checkoutId");
  const orderNumber = searchParams.get("orderNumber");
  const amount = searchParams.get("amount");

  useEffect(() => {
    // Load order data
    async function loadOrder() {
      if (!orderNumber) return;

      const { data } = await supabase
        .from("pending_orders")
        .select("*")
        .eq("order_number", orderNumber)
        .single();

      setOrderData(data);
    }

    loadOrder();
  }, [orderNumber]);

  const handleTestPayment = async () => {
    setLoading(true);

    try {

      const payload = {
        orderNumber: orderNumber,
        storeId: orderData?.store_id,
        storeName: orderData?.metadata?.storeName || orderData?.store_name || "Test Store",
        storeSlug: orderData?.metadata?.storeSlug || orderData?.store_slug || "test",
        customerName: orderData?.customer_name,
        customerPhone: orderData?.phone,
        items: orderData?.items || [],
        total: orderData?.total || parseFloat(amount),
        orderType: orderData?.metadata?.orderType || orderData?.order_type || "pickup",
        deliveryAddress: orderData?.metadata?.deliveryAddress || orderData?.delivery_address || null,
        deliveryFee: orderData?.metadata?.deliveryFee || orderData?.delivery_fee || 0
      };

      // Call the complete-test-order edge function
      const { data, error } = await supabase.functions.invoke('complete-test-order', {
        body: payload
      });

      if (error) {
        
        alert("Payment failed: " + (error.message || JSON.stringify(error)));
        setLoading(false);
        return;
      }

      // Redirect to success page
      navigate(`/payment-success?orderNumber=${orderNumber}`);
    } catch (error) {
      
      alert("Payment failed: " + error.message);
      setLoading(false);
    }
  };

  if (!orderData) {
    return (
      <div className="test-payment-page">
        <div className="test-payment-container">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="test-payment-page">
      <div className="test-payment-container">
        <div className="test-payment-header">
          <h1>🧪 Test Payment Mode</h1>
          <p className="test-badge">Platinum Test Environment</p>
        </div>

        <div className="payment-summary">
          <h2>Order Summary</h2>
          <div className="summary-row">
            <span>Order Number:</span>
            <strong>#{orderNumber}</strong>
          </div>
          <div className="summary-row">
            <span>Customer:</span>
            <strong>{orderData.customer_name}</strong>
          </div>
          <div className="summary-row">
            <span>Phone:</span>
            <strong>{orderData.phone}</strong>
          </div>
          {(orderData.metadata?.orderType === 'delivery' || orderData.order_type === 'delivery') && (
            <>
              <div className="summary-row">
                <span>Delivery Address:</span>
                <strong>{orderData.metadata?.deliveryAddress || orderData.delivery_address}</strong>
              </div>
              <div className="summary-row">
                <span>Delivery Fee:</span>
                <strong>R{(orderData.metadata?.deliveryFee || orderData.delivery_fee || 0).toFixed(2)}</strong>
              </div>
            </>
          )}
          <div className="summary-row total">
            <span>Total Amount:</span>
            <strong>R{orderData.total?.toFixed(2)}</strong>
          </div>
        </div>

        <div className="test-card-info">
          <h3>💳 Test Card</h3>
          <div className="card-field">
            <label>Card Number:</label>
            <input type="text" value="4242 4242 4242 4242" readOnly />
          </div>
          <div className="card-row">
            <div className="card-field">
              <label>Expiry:</label>
              <input type="text" value="12/25" readOnly />
            </div>
            <div className="card-field">
              <label>CVV:</label>
              <input type="text" value="123" readOnly />
            </div>
          </div>
          <p className="test-note">
            ℹ️ This is a test payment page. No real money will be charged.
            <br />
            Click "Complete Test Payment" to simulate a successful payment.
          </p>
        </div>

        <button
          onClick={handleTestPayment}
          disabled={loading}
          className="test-pay-button"
        >
          {loading ? "Processing..." : "✅ Complete Test Payment"}
        </button>

        <button
          onClick={() => navigate(-1)}
          className="cancel-button"
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
