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

  // No longer need Yoco SDK - using Checkout API instead

  const planDetails = {
    pro: {
      name: "Pro",
      price: 25,
      priceInCents: 2500,
      features: [
        "Subdomain (yourstore.mzansifoodconnect.app)",
        "Unlimited products",
        "Basic analytics (revenue tracking)",
        "WhatsApp notifications",
        "Remove branding",
        "Priority support"
      ]
    },
    premium: {
      name: "Premium",
      price: 50,
      priceInCents: 5000,
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
    setProcessingPayment(true);
    setLoading(true);
    setError("");

    try {

      // Call Supabase Edge Function to create checkout session
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: {
          storeId: storeInfo.id,
          storeName: storeInfo.name,
          targetPlan: targetPlan,
          userEmail: user.email,
          currentPlan: storeInfo.plan,
          amount: plan.price
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
      
      setError('⚠️ Failed to initialize payment. Please try again.');
      setProcessingPayment(false);
      setLoading(false);
    }
  }

  // Note: Upgrade is now handled by webhook after payment confirmation

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
