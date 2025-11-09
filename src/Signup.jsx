import { useState } from "react";
import { supabase } from "./supabaseClient";
import { PaystackButton } from "react-paystack";
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

  const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

  const plans = [
    {
      id: "trial",
      name: "Free Trial",
      subtitle: "7 Days Free",
      price: "R0",
      period: "for 7 days",
      description: "Try it free - no credit card required",
      features: [
        "Subdomain (storename.mzansifoodconnect.app)",
        "Up to 30 products",
        "Order management",
        "Store designer",
        "Manual WhatsApp messaging"
      ]
    },
    {
      id: "pro",
      name: "Pro",
      subtitle: "For Growing Businesses",
      price: "R150",
      period: "per month",
      description: "Everything you need to run your food business",
      features: [
        "Subdomain (storename.mzansifoodconnect.app)",
        "Unlimited products",
        "Basic analytics (revenue tracking)",
        "WhatsApp API integration",
        "Remove branding",
        "Priority support"
      ],
      popular: true
    },
    {
      id: "premium",
      name: "Premium",
      subtitle: "Custom Domain Included",
      price: "R300",
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
      // Create auth account - save metadata for store creation after confirmation
      // Use production URL for email confirmation links (even when testing locally)
      const productionUrl = import.meta.env.VITE_PRODUCTION_URL || window.location.origin;

      const { data: authData, error: authError} = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${productionUrl}/app`,
          data: {
            store_name: storeName,
            plan: selectedPlan,
            payment_reference: selectedPlan === 'trial' ? null : `TEST-${Date.now()}`
          }
        }
      });

      if (authError) throw authError;

      setCreatedUserId(authData.user.id);

      console.log('✅ Account created - store will be created after email confirmation');

      // Show success message - store will be created after email confirmation
      alert(`✅ Account created successfully!\n\n📧 Check your email (${email}) to confirm your account.\n\n🔐 After confirming, login to access your dashboard.\n\nYour ${selectedPlan === 'trial' ? '7-day free trial' : selectedPlan.toUpperCase() + ' store'} will be created automatically when you login for the first time!`);
      onBack();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function createStore(userId, plan, paymentRef) {
    // Calculate plan_expires_at for trial (7 days from now), NULL for paid plans
    const planExpiresAt = plan === 'trial'
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      : null;

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
        .from("stores")
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

    const { data: storeData, error: storeError } = await supabase.from("stores").insert([{
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
    }]).select().single();

    if (storeError) {
      console.error('❌ Store creation error:', storeError);
      throw storeError;
    }

    console.log('✅ Store created successfully with slug:', finalSlug);
    return storeData; // Return store data including slug
  }

  function handlePaymentSuccess(reference) {
    setLoading(true);
    createStore(createdUserId, selectedPlan, reference.reference)
      .then((store) => {
        alert(`✅ Payment successful!\n\nYour ${plans.find(p => p.id === selectedPlan).name} subscription is now active!\n\n🌐 Your store is live at:\nhttps://${store.slug}.mzansifoodconnect.app\n\nPlease check your email (${email}) to verify your account, then login.`);
        onBack();
      })
      .catch((err) => {
        setError("Payment succeeded but store creation failed: " + err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  const paystackConfig = {
    reference: new Date().getTime().toString(),
    email: email,
    amount: selectedPlan === "pro" ? 15000 : 30000, // R150 or R300 in cents
    publicKey: paystackKey,
  };

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
              <p>Secure payment powered by Paystack</p>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div style={{ marginTop: "2rem" }}>
              <PaystackButton
                {...paystackConfig}
                text={`Pay ${selectedPlanData.price} - Start ${selectedPlanData.name}`}
                onSuccess={handlePaymentSuccess}
                onClose={() => setError("Payment cancelled. You can try again.")}
                className="login-btn"
                style={{ width: "100%", marginBottom: "1rem" }}
              />

              <button
                type="button"
                className="toggle-mode-btn"
                onClick={() => setStep(2)}
                disabled={loading}
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
