import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";

export default function Signup({ onBack, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Choose Plan, 2: Account Details, 3: Payment
  const [selectedPlan, setSelectedPlan] = useState("trial");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdUserId, setCreatedUserId] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentReference, setPaymentReference] = useState(null);

  // Use LIVE key for production signups
  const yocoPublicKey = import.meta.env.VITE_YOCO_PUBLIC_KEY; // Yoco live key from .env

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

  const plans = [
    {
      id: "trial",
      name: "Free Trial",
      subtitle: "Training Ground",
      price: "R0",
      period: "forever",
      description: "Full access with test payments - no credit card required",
      features: [
        "Subdomain (storename.mzansifoodconnect.app)",
        "Up to 10 products",
        "Full order management system",
        "Store designer & customization",
        "WhatsApp notifications (test mode)",
        "Test payments only - Learn the platform",
        "Perfect for training & demos"
      ]
    },
    {
      id: "pro",
      name: "Pro",
      subtitle: "For Growing Businesses",
      price: "R4",
      period: "per month",
      description: "Everything you need to run your food business",
      features: [
        "Subdomain (storename.mzansifoodconnect.app)",
        "Unlimited products",
        "Basic analytics (revenue tracking)",
        "WhatsApp notifications",
        "Remove branding",
        "Priority support"
      ],
      popular: true
    },
    {
      id: "premium",
      name: "Premium",
      subtitle: "Custom Domain Included",
      price: "R6",
      period: "per month",
      description: "Professional solution with your own domain",
      features: [
        "Custom domain (yourbusiness.co.za) - INCLUDED",
        "Everything in Pro",
        "Advanced analytics (charts & insights)",
        "More professional templates",
        "White-label solution",
        "Dedicated support"
      ]
    }
  ];

  async function handleAccountCreation(e) {
    e.preventDefault();
    setError("");

    // Validation
    if (!storeName.trim()) {
      setError("Please enter a store name");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // For trial - create account immediately (no payment needed)
      if (selectedPlan === 'trial') {
        const productionUrl = import.meta.env.VITE_PRODUCTION_URL || window.location.origin;

        const { data: authData, error: authError} = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${productionUrl}/app`,
            data: {
              store_name: storeName,
              plan: selectedPlan,
              payment_reference: null,
              payment_completed: false
            }
          }
        });

        if (authError) throw authError;

        alert(`✅ Account created successfully!\n\n📧 Check your email (${email}) to confirm your account.\n\n🔐 After confirming, login to access your dashboard.\n\nYour Free Trial (training ground) will be created automatically when you login for the first time!`);
        onBack();
      } else {
        // For Pro/Premium - GO TO PAYMENT FIRST (don't create account yet!)
        console.log('💳 Pro/Premium selected - proceeding to payment first');
        setStep(3); // Go directly to payment step
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function createStore(userId, plan, paymentRef) {
    // Calculate plan_expires_at: trial = null (forever), paid plans = 30 days from now
    const planExpiresAt = plan === 'trial'
      ? null // Trial never expires - training ground
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Pro/Premium = 30 days

    // 🔥 Generate clean slug from store name (no random suffix)
    const baseSlug = storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dashes
      .replace(/^-|-$/g, ''); // Remove leading/trailing dashes

    // Check if slug exists and find next available
    let finalSlug = baseSlug;
    let counter = 2;

    while (true) {
      const { data: existing } = await supabase
        .from("tenants")
        .select("slug")
        .eq("slug", finalSlug)
        .single();

      if (!existing) {
        // Slug is available!
        break;
      }

      // Slug taken, try with number suffix
      finalSlug = `${baseSlug}${counter}`;
      counter++;
    }

    // DEBUG: Log what's being inserted
    console.log('💾 DATABASE INSERT:', {
      owner_id: userId,
      name: storeName,
      slug: finalSlug,
      plan: plan,
      plan_type: typeof plan,
      plan_expires_at: planExpiresAt,
      payment_reference: paymentRef
    });

    const { data: storeData, error: storeError } = await supabase.from("tenants").insert([{
      owner_id: userId,
      name: storeName,
      slug: finalSlug,
      plan: plan,
      plan_started_at: new Date().toISOString(),
      plan_expires_at: planExpiresAt,
      is_open: true,
      banner_text: `Welcome to ${storeName}!`,
      about_text: `Proudly serving authentic food.`,
      payment_reference: paymentRef,
      // Note: Vendors must add their Yoco keys in Settings after signup
    }]).select().single();

    if (storeError) {
      console.error('❌ Store creation error:', storeError);
      throw storeError;
    }

    console.log('✅ Store created successfully with slug:', finalSlug);
    return storeData; // Return store data including slug
  }

  async function handleYocoPayment() {
    if (!yocoPublicKey) {
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
      const selectedPlanData = plans.find(p => p.id === selectedPlan);
      const amountInCents = selectedPlan === "pro" ? 400 : 600; // R4 Pro, R6 Premium

      const sdk = new window.YocoSDK({
        publicKey: yocoPublicKey,
      });

      // Create checkout
      sdk.showPopup({
        amountInCents: amountInCents,
        currency: 'ZAR',
        name: 'Mzansi Food Connect',
        description: `${selectedPlanData.name} Plan Subscription`,
        metadata: {
          storeName: storeName,
          email: email,
          plan: selectedPlan,
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
          await savePaymentReference(result.id, selectedPlanData);
        },
      });
    } catch (err) {
      console.error('Yoco SDK error:', err);
      setError('⚠️ Payment initialization failed. Please try again.');
      setProcessingPayment(false);
    }
  }

  async function savePaymentReference(paymentId, selectedPlanData) {
    setLoading(true);

    try {
      console.log('✅ Payment successful! ID:', paymentId);
      console.log('📋 Plan selected:', selectedPlan);
      console.log('🔐 NOW creating account after payment...');

      // ✅ SECURITY FIX: Create account AFTER payment succeeds
      const productionUrl = import.meta.env.VITE_PRODUCTION_URL || window.location.origin;

      const { data: authData, error: authError} = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${productionUrl}/app`,
          data: {
            store_name: storeName,
            plan: selectedPlan,
            payment_reference: paymentId,
            payment_completed: true
          }
        }
      });

      if (authError) {
        console.error('❌ Account creation failed after payment:', authError);
        throw new Error(`Payment succeeded but account creation failed: ${authError.message}. Please contact support with payment ID: ${paymentId}`);
      }

      console.log('✅ Account created with user ID:', authData.user.id);

      // Store payment in pending_payments table for webhook processing
      const { error: paymentError } = await supabase
        .from('pending_payments')
        .insert([{
          user_id: authData.user.id,
          email: email,
          store_name: storeName,
          plan: selectedPlan,
          payment_reference: paymentId,
          amount_in_cents: selectedPlan === 'pro' ? 400 : 600, // R4 Pro, R6 Premium
          payment_status: 'completed',
          created_at: new Date().toISOString()
        }]);

      if (paymentError) {
        console.error('❌ Failed to save payment reference:', paymentError);
        console.warn('⚠️ Payment and account created, but couldn\'t save to pending_payments');
      } else {
        console.log('✅ Payment reference saved to pending_payments table');
      }

      // Show success message
      alert(`✅ Payment successful!\n\n💳 Payment ID: ${paymentId}\n\nYour ${selectedPlanData.name} subscription is confirmed!\n\n📧 Next steps:\n1. Check your email (${email}) and confirm your account\n2. Login to access your dashboard\n\nYour ${selectedPlanData.name} store will be created automatically when you login for the first time!`);
      onBack();
    } catch (err) {
      setError("Error: " + err.message);
    } finally {
      setLoading(false);
      setProcessingPayment(false);
    }
  }

  // Step 3: Payment page
  if (step === 3) {
    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    return (
      <div className="modern-login-page">
        <div className="login-left" style={{ background: "linear-gradient(135deg, #ff6b35 0%, #e55a28 100%)" }}>
          <div className="login-brand">
            <div className="brand-icon">💳</div>
            <h1 style={{ color: "white" }}>Complete Payment</h1>
            <p className="brand-tagline" style={{ color: "rgba(255,255,255,0.9)" }}>
              You're one step away from growing your business!
            </p>
          </div>
          <div className="payment-summary" style={{ background: "rgba(255,255,255,0.1)", padding: "2rem", borderRadius: "15px", marginTop: "2rem" }}>
            <h3 style={{ color: "white", marginBottom: "1rem" }}>Order Summary</h3>
            <div style={{ color: "white", marginBottom: "1rem" }}>
              <p><strong>Plan:</strong> {selectedPlanData.name}</p>
              <p><strong>Store:</strong> {storeName}</p>
              <p><strong>Email:</strong> {email}</p>
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.3)", paddingTop: "1rem", marginTop: "1rem" }}>
              <p style={{ color: "white", fontSize: "1.5rem", fontWeight: "bold" }}>
                Total: {selectedPlanData.price}/{selectedPlanData.period}
              </p>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-form-container">
            <div className="form-header">
              <h2>Payment</h2>
              <p>Secure payment powered by Yoco</p>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div style={{ marginTop: "2rem" }}>
              <button
                onClick={handleYocoPayment}
                disabled={loading || processingPayment}
                className="login-btn"
                style={{
                  width: "100%",
                  marginBottom: "1rem",
                  cursor: (loading || processingPayment) ? "not-allowed" : "pointer",
                  opacity: (loading || processingPayment) ? 0.6 : 1
                }}
              >
                {processingPayment ? "Processing..." : `Pay ${selectedPlanData.price} - Start ${selectedPlanData.name}`}
              </button>

              <button
                type="button"
                className="toggle-mode-btn"
                onClick={() => setStep(2)}
                disabled={loading || processingPayment}
              >
                ← Back to Account Details
              </button>

              <button
                type="button"
                className="toggle-mode-btn"
                onClick={onBack}
                style={{ marginTop: "0.5rem" }}
              >
                Cancel & Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Account details
  if (step === 2) {
    return (
      <div className="modern-login-page">
        <div className="login-left">
          <div className="login-brand">
            <div className="brand-icon">📝</div>
            <h1>Create Your Account</h1>
            <p className="brand-tagline">Set up your store in minutes</p>
          </div>
          <div className="login-features">
            <div className="feature-item">
              <span className="feature-icon">✅</span>
              <div>
                <h3>Selected Plan</h3>
                <p>{plans.find(p => p.id === selectedPlan).name} - {plans.find(p => p.id === selectedPlan).price}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-form-container">
            <div className="form-header">
              <h2>Account Details</h2>
              <p>Create your store owner account</p>
            </div>

            <form onSubmit={handleAccountCreation} className="modern-form">
              <div className="form-group">
                <label htmlFor="storeName">Store Name *</label>
                <input
                  id="storeName"
                  type="text"
                  placeholder="e.g., Mama's Kitchen"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  required
                  className="form-input"
                />
                <small style={{
                  display: "block",
                  marginTop: "0.5rem",
                  padding: "0.75rem",
                  background: "#fff3cd",
                  border: "1px solid #ffc107",
                  borderRadius: "6px",
                  color: "#856404",
                  fontSize: "0.875rem",
                  lineHeight: "1.4"
                }}>
                  ⚠️ <strong>Important:</strong> Your store URL will be based on this name and <strong>cannot be changed later</strong>.
                  Choose carefully! Example: "Mama's Kitchen" → <code style={{
                    background: "#f8f9fa",
                    padding: "0.2rem 0.4rem",
                    borderRadius: "3px",
                    fontSize: "0.85rem"
                  }}>mamas-kitchen.mzansifoodconnect.app</code>
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="form-input"
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="form-input"
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? (
                  <span className="btn-loading">
                    <span className="spinner"></span>
                    Creating account...
                  </span>
                ) : (
                  <span>
                    {selectedPlan === "trial" ? "Start Free Trial" : "Continue to Payment"}
                  </span>
                )}
              </button>
            </form>

            <div className="form-divider">
              <span>or</span>
            </div>

            <button
              type="button"
              className="toggle-mode-btn"
              onClick={() => setStep(1)}
            >
              ← Back to Plan Selection
            </button>

            <button
              type="button"
              className="toggle-mode-btn"
              onClick={onBack}
              style={{ marginTop: "0.5rem" }}
            >
              Already have an account? Sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Plan selection
  return (
    <div className="modern-login-page">
      {/* Left Side - Plan Selection */}
      <div className="login-left signup-plans">
        <div className="signup-header">
          <h2>Choose Your Plan</h2>
          <p>Select the plan that fits your business</p>
        </div>

        <div className="plan-selector">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`plan-option ${selectedPlan === plan.id ? "selected" : ""} ${plan.popular ? "popular" : ""}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && <div className="popular-tag">Most Popular</div>}
              <div className="plan-option-header">
                <h3>{plan.name}</h3>
                <p className="plan-option-subtitle">{plan.subtitle}</p>
                <div className="plan-option-price">
                  <span className="price-amount">{plan.price}</span>
                  <span className="price-period">/{plan.period}</span>
                </div>
                <p className="plan-option-description">{plan.description}</p>
              </div>
              <ul className="plan-option-features">
                {plan.features.map((feature, i) => (
                  <li key={i}>
                    <span className="check">✓</span> {feature}
                  </li>
                ))}
              </ul>
              <div className="plan-selector-radio">
                <input
                  type="radio"
                  name="plan"
                  checked={selectedPlan === plan.id}
                  onChange={() => setSelectedPlan(plan.id)}
                />
                <span>Select {plan.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side - Continue Button */}
      <div className="login-right">
        <div className="login-form-container">
          <div className="form-header">
            <h2>Ready to Start?</h2>
            <p>Click continue to create your account</p>
          </div>

          <div className="selected-plan-summary" style={{ background: "#f8f8f8", padding: "1.5rem", borderRadius: "10px", marginBottom: "2rem" }}>
            <h3 style={{ marginBottom: "0.5rem" }}>Selected Plan</h3>
            <p style={{ fontSize: "1.25rem", fontWeight: "700", color: "#ff6b35" }}>
              {plans.find(p => p.id === selectedPlan).name}
            </p>
            <p style={{ color: "#666" }}>
              {plans.find(p => p.id === selectedPlan).price}/{plans.find(p => p.id === selectedPlan).period}
            </p>
          </div>

          <button
            type="button"
            className="login-btn"
            onClick={() => setStep(2)}
            style={{ width: "100%", marginBottom: "1rem" }}
          >
            Continue with {plans.find(p => p.id === selectedPlan).name}
          </button>

          <div className="form-divider">
            <span>or</span>
          </div>

          <button
            type="button"
            className="toggle-mode-btn"
            onClick={onBack}
          >
            Already have an account? Sign in
          </button>

          <div className="form-footer">
            <p>
              By continuing, you agree to our{" "}
              <a href="#terms">Terms of Service</a> and{" "}
              <a href="#privacy">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
