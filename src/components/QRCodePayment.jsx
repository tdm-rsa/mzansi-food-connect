import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../supabaseClient';

export default function QRCodePayment({
  store,
  orderNumber,
  total,
  customerName,
  customerPhone,
  items,
  onSuccess,
  onCancel
}) {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    generateQRCode();
  }, []);

  const generateQRCode = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Generating QR code payment...');

      // Call Edge Function to create Yoco checkout session
      const { data, error: invokeError } = await supabase.functions.invoke('create-yoco-checkout', {
        body: {
          storeId: store.id,
          storeName: store.name,
          storeSlug: store.slug,
          customerName,
          customerPhone,
          items,
          total,
          orderNumber
        }
      });

      if (invokeError) {
        console.error('❌ QR code generation error:', invokeError);
        throw invokeError;
      }

      if (!data || !data.redirectUrl) {
        throw new Error('No payment URL received');
      }

      console.log('✅ QR code payment URL generated:', data.redirectUrl);

      setQrData({
        url: data.redirectUrl,
        checkoutId: data.checkoutId,
        orderNumber: data.orderNumber
      });

      // Start polling for payment confirmation
      startPolling(data.orderNumber);

    } catch (err) {
      console.error('QR code generation failed:', err);
      setError(err.message || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (orderNum) => {
    setPolling(true);
    let attempts = 0;
    const maxAttempts = 180; // 3 minutes (180 seconds)

    const pollInterval = setInterval(async () => {
      attempts++;
      console.log(`🔍 Checking payment status... Attempt ${attempts}/${maxAttempts}`);

      // Check if order has been created (webhook will create it after payment)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNum)
        .single();

      if (order && order.payment_status === 'paid') {
        console.log('✅ Payment confirmed! Order created:', order.order_number);
        clearInterval(pollInterval);
        setPolling(false);
        onSuccess(order);
        return;
      }

      if (attempts >= maxAttempts) {
        console.log('⏱️ Polling timeout - payment not confirmed');
        clearInterval(pollInterval);
        setPolling(false);
      }
    }, 1000); // Check every second
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.spinner}></div>
        <h3 style={styles.title}>Generating QR Code...</h3>
        <p style={styles.text}>Please wait</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorIcon}>⚠️</div>
        <h3 style={styles.title}>Error</h3>
        <p style={styles.text}>{error}</p>
        <button onClick={onCancel} style={styles.button}>
          Try Another Payment Method
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* QR Code Display */}
      <div style={styles.qrContainer}>
        <QRCodeSVG
          value={qrData.url}
          size={280}
          level="H"
          includeMargin={true}
          fgColor="#1f2937"
        />
      </div>

      {/* Instructions */}
      <div style={styles.instructions}>
        <h2 style={styles.title}>Scan to Pay</h2>
        <p style={styles.orderNumber}>Order: <strong>{qrData.orderNumber}</strong></p>
        <p style={styles.amount}>Amount: <strong>R{total.toFixed(2)}</strong></p>

        <div style={styles.steps}>
          <div style={styles.step}>
            <div style={styles.stepNumber}>1</div>
            <div style={styles.stepText}>Open your banking app or camera</div>
          </div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>2</div>
            <div style={styles.stepText}>Scan the QR code above</div>
          </div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>3</div>
            <div style={styles.stepText}>Complete payment on Yoco page</div>
          </div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>4</div>
            <div style={styles.stepText}>Wait for confirmation</div>
          </div>
        </div>

        {polling && (
          <div style={styles.pollingIndicator}>
            <div style={styles.smallSpinner}></div>
            <span>Waiting for payment confirmation...</span>
          </div>
        )}
      </div>

      {/* Alternative: Manual link */}
      <div style={styles.alternativeSection}>
        <p style={styles.alternativeText}>Can't scan?</p>
        <a
          href={qrData.url}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.link}
        >
          Click here to pay
        </a>
      </div>

      {/* Cancel Button */}
      <button onClick={onCancel} style={styles.cancelButton}>
        ← Back to Checkout
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2rem',
    maxWidth: '500px',
    margin: '0 auto',
  },
  qrContainer: {
    background: 'white',
    padding: '1.5rem',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    marginBottom: '1.5rem',
  },
  instructions: {
    width: '100%',
    textAlign: 'center',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '0.5rem',
  },
  orderNumber: {
    fontSize: '0.9rem',
    color: '#6b7280',
    marginBottom: '0.25rem',
  },
  amount: {
    fontSize: '1.25rem',
    color: '#059669',
    fontWeight: '600',
    marginBottom: '1.5rem',
  },
  steps: {
    background: '#f3f4f6',
    borderRadius: '12px',
    padding: '1rem',
    marginBottom: '1rem',
    textAlign: 'left',
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  stepNumber: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    marginRight: '0.75rem',
    flexShrink: 0,
  },
  stepText: {
    fontSize: '0.9rem',
    color: '#374151',
  },
  pollingIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem',
    background: '#dbeafe',
    borderRadius: '8px',
    color: '#1e40af',
    fontSize: '0.9rem',
    marginTop: '1rem',
  },
  smallSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid #bfdbfe',
    borderTop: '2px solid #1e40af',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  alternativeSection: {
    marginTop: '1.5rem',
    textAlign: 'center',
  },
  alternativeText: {
    fontSize: '0.85rem',
    color: '#6b7280',
    marginBottom: '0.5rem',
  },
  link: {
    color: '#667eea',
    textDecoration: 'underline',
    fontSize: '0.9rem',
  },
  button: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '1rem',
  },
  cancelButton: {
    background: 'transparent',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '0.75rem 1.5rem',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '1rem',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  },
  errorIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },
  text: {
    color: '#6b7280',
    fontSize: '0.95rem',
    marginBottom: '1rem',
  },
};
