import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [orderData, setOrderData] = useState(null);

  const orderNumber = searchParams.get('orderNumber');
  const slug = searchParams.get('slug');

  useEffect(() => {
    async function verifyPayment() {
      if (!orderNumber) {
        setStatus('error');
        return;
      }

      // Poll for order creation (webhook might take a moment)
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds

      const checkOrder = async () => {
        const { data: order } = await supabase
          .from("orders")
          .select("*")
          .eq("order_number", orderNumber)
          .single();

        if (order) {
          setOrderData(order);
          setStatus('success');
          return true;
        }
        return false;
      };

      const pollInterval = setInterval(async () => {
        attempts++;
        const found = await checkOrder();

        if (found || attempts >= maxAttempts) {
          clearInterval(pollInterval);
          if (!found) {
            setStatus('pending');
          }
        }
      }, 1000);
    }

    verifyPayment();
  }, [orderNumber]);

  if (status === 'verifying') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.spinner}></div>
          <h1 style={styles.title}>Verifying Payment...</h1>
          <p style={styles.text}>Please wait while we confirm your payment.</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.successIcon}>✓</div>
          <h1 style={styles.title}>Payment Successful!</h1>
          <p style={styles.text}>
            Your order has been confirmed.
          </p>
          <div style={styles.orderDetails}>
            <p><strong>Order Number:</strong> {orderData?.order_number}</p>
            <p><strong>Total:</strong> R{orderData?.total?.toFixed(2)}</p>
          </div>
          <p style={styles.notification}>
            You'll receive a WhatsApp notification when your order is ready!
          </p>
          <button
            onClick={() => navigate(`/store/${slug}`)}
            style={styles.button}
          >
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.warningIcon}>⚠️</div>
          <h1 style={styles.title}>Payment Processing</h1>
          <p style={styles.text}>
            Your payment was received but is still being processed.
          </p>
          <p style={styles.text}>
            Order Number: <strong>{orderNumber}</strong>
          </p>
          <p style={styles.notification}>
            Your order will appear shortly. Please check back in a moment.
          </p>
          <button
            onClick={() => navigate(`/store/${slug}`)}
            style={styles.button}
          >
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.errorIcon}>✕</div>
        <h1 style={styles.title}>Something went wrong</h1>
        <p style={styles.text}>
          We couldn't verify your payment. Please contact support if you were charged.
        </p>
        <button
          onClick={() => navigate(`/store/${slug}`)}
          style={styles.button}
        >
          Back to Store
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '3rem',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  successIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: '#10b981',
    color: 'white',
    fontSize: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem',
    fontWeight: 'bold',
  },
  errorIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: '#ef4444',
    color: 'white',
    fontSize: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem',
    fontWeight: 'bold',
  },
  warningIcon: {
    fontSize: '64px',
    margin: '0 auto 1.5rem',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 1.5rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: '#1f2937',
  },
  text: {
    fontSize: '1.1rem',
    color: '#6b7280',
    marginBottom: '1rem',
    lineHeight: '1.6',
  },
  orderDetails: {
    background: '#f3f4f6',
    borderRadius: '8px',
    padding: '1.5rem',
    margin: '1.5rem 0',
    textAlign: 'left',
  },
  notification: {
    background: '#dbeafe',
    borderRadius: '8px',
    padding: '1rem',
    marginTop: '1.5rem',
    color: '#1e40af',
  },
  button: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '1rem 2rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '1.5rem',
    width: '100%',
  },
};
