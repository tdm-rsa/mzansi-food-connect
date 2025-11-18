import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

/**
 * Upgrade Payment Component
 * Handles Yoco payments for Pro and Premium plan upgrades
 */
export default function UpgradePayment({ user, storeInfo, targetPlan, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  const yocoKey = import.meta.env.VITE_YOCO_PUBLIC_KEY;

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

  const planDetails = {
    pro: {
      name: "Pro",
      price: 25,
      priceInCents: 2500,
      features: [
        "Subdomain (yourstore.mzansifoodconnect.app)",
        "Unlimited products",
        "Basic analytics (revenue tracking)",
        "WhatsApp API integration",
        "Remove branding",
        "Priority support"
      ]
    },
    premium: {
      name: "Premium",
      price: 25,
      priceInCents: 2500,
      features: [
        "Premium subdomain (yourbusiness.mzansifoodconnect.app)",
        "Everything in Pro",
        "Advanced analytics with charts",
        "More professional templates",
        "White-label solution",
        "Dedicated support"
      ]
    }
  };

  const plan = planDetails[targetPlan];

  if (!plan) {
    return <div>Invalid plan selected</div>;
  }

  async function handleYocoPayment() {
    if (!yocoKey) {
      setError('⚠️ Payment is not configured. Please contact support.');
      return;
    }

    if (!window.YocoSDK) {
      setError('⚠️ Payment system is loading. Please try again in a moment.');
      return;
    }

    setProcessingPayment(true);
    setError("");

    try {
      const sdk = new window.YocoSDK({
        publicKey: yocoKey,
      });

      // Create checkout
      sdk.showPopup({
        amountInCents: plan.priceInCents,
        currency: 'ZAR',
        name: 'Mzansi Food Connect',
        description: `${plan.name} Plan Subscription`,
        metadata: {
          storeId: storeInfo.id,
          storeName: storeInfo.name,
          upgradeFrom: storeInfo.plan,
          upgradeTo: targetPlan,
          userEmail: user.email,
        },
        callback: async function (result) {
          if (result.error) {
            console.error('Yoco payment error:', result.error);
            setError('❌ Payment failed: ' + result.error.message);
            setProcessingPayment(false);
            return;
          }

          // Payment successful
          console.log('💳 Yoco payment successful:', result);
          await upgradeStore(result.id);
        },
      });
    } catch (err) {
      console.error('Yoco SDK error:', err);
      setError('⚠️ Payment initialization failed. Please try again.');
      setProcessingPayment(false);
    }
  }

  async function upgradeStore(paymentId) {
    setLoading(true);

    try {
      console.log('💳 Payment successful! ID:', paymentId);
      console.log('⏳ Waiting for Yoco webhook to confirm payment...');

      // ✅ SECURITY FIX: Don't upgrade immediately - let webhook handle it
      // Store payment in pending_payments table for webhook to process
      const { error: pendingError } = await supabase
        .from("pending_payments")
        .insert([{
          user_id: user.id,
          plan: targetPlan,
          payment_reference: paymentId,
          status: 'pending',
          created_at: new Date().toISOString(),
        }]);

      if (pendingError) {
        throw pendingError;
      }

      console.log('✅ Payment recorded. Waiting for webhook confirmation...');

      // Poll for webhook to process the payment (with timeout)
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds (30 attempts × 1 second)

      const checkPayment = async () => {
        const { data: updatedStore } = await supabase
          .from("tenants")
          .select("plan, payment_reference")
          .eq("id", storeInfo.id)
          .single();

        if (updatedStore?.plan === targetPlan && updatedStore?.payment_reference === paymentId) {
          // Webhook processed successfully!
          console.log('✅ Webhook confirmed! Store upgraded to:', targetPlan);

          alert(`✅ Upgrade successful!\n\nYour store has been upgraded to ${plan.name} plan!\n\nAll ${plan.name} features are now active.\n\nThank you for upgrading!`);

          if (onSuccess) {
            onSuccess(updatedStore);
          }
          return true;
        }
        return false;
      };

      // Poll every 1 second for up to 30 seconds
      const pollInterval = setInterval(async () => {
        attempts++;
        const success = await checkPayment();

        if (success || attempts >= maxAttempts) {
          clearInterval(pollInterval);

          if (!success) {
            console.warn('⚠️ Webhook timeout. Payment may still be processing.');
            alert(`⚠️ Payment received but verification is taking longer than expected.\n\nPlease refresh the page in a moment to see your upgraded plan.\n\nIf the upgrade doesn't appear after 2 minutes, please contact support with payment ID: ${paymentId}`);
          }

          setLoading(false);
          setProcessingPayment(false);
        }
      }, 1000);

    } catch (err) {
      console.error('❌ Upgrade error:', err);
      setError(`Failed to process upgrade: ${err.message}`);
      setLoading(false);
      setProcessingPayment(false);
    }
  }

  return (
    <div style={{
      background: "rgba(255,255,255,0.05)",
      borderRadius: "16px",
      padding: "2rem",
      marginTop: "1rem"
    }}>
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "2rem",
        borderRadius: "12px",
        marginBottom: "1.5rem",
        color: "white"
      }}>
        <h3 style={{ margin: "0 0 1rem 0", color: "white" }}>
          Upgrade to {plan.name} Plan
        </h3>
        <div style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
          R{plan.price} / month
        </div>
        <p style={{ margin: 0, opacity: 0.9 }}>
          Billed monthly • Cancel anytime
        </p>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <h4 style={{ color: "#fff", marginBottom: "1rem" }}>What you'll get:</h4>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {plan.features.map((feature, idx) => (
            <li key={idx} style={{
              color: "#cbd5e1",
              marginBottom: "0.5rem",
              paddingLeft: "1.5rem",
              position: "relative"
            }}>
              <span style={{
                position: "absolute",
                left: 0,
                color: "#10b981"
              }}>✓</span>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {error && (
        <div style={{
          background: "#f443361a",
          border: "1px solid #f44336",
          borderRadius: "8px",
          padding: "1rem",
          marginBottom: "1rem",
          color: "#f44336"
        }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ marginTop: "1.5rem" }}>
        <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "1rem" }}>
          🔒 Secure payment powered by Yoco
        </p>

        {yocoKey ? (
          <button
            onClick={handleYocoPayment}
            disabled={loading || processingPayment}
            className="btn-primary"
            style={{
              width: "100%",
              padding: "1rem",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: (loading || processingPayment) ? "not-allowed" : "pointer",
              opacity: (loading || processingPayment) ? 0.6 : 1,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              borderRadius: "8px",
              color: "white"
            }}
          >
            {processingPayment ? "Processing..." : `Pay R${plan.price} - Upgrade to ${plan.name}`}
          </button>
        ) : (
          <div style={{
            background: "#f443361a",
            border: "1px solid #f44336",
            borderRadius: "8px",
            padding: "1rem",
            color: "#f44336"
          }}>
            ⚠️ Yoco is not configured. Please contact support.
          </div>
        )}

        {onCancel && (
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "1rem",
              padding: "0.75rem",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "8px",
              color: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1
            }}
          >
            Cancel
          </button>
        )}
      </div>

      <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "1.5rem", textAlign: "center" }}>
        Your subscription will renew automatically each month. You can cancel anytime from your settings.
      </p>
    </div>
  );
}
