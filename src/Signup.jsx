import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { validateEmail, validatePassword, validatePasswordMatch, validateStoreName } from "./utils/validation";
import rateLimiter, { RATE_LIMITS } from "./utils/rateLimiter";
import { executeRecaptcha, initRecaptchaBadge } from "./utils/captcha";
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

  // Load reCAPTCHA
  useEffect(() => {
    initRecaptchaBadge();
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
      price: "R25",
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
      price: "R50",
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

    // Execute reCAPTCHA
    const recaptchaToken = await executeRecaptcha('signup');
    if (!recaptchaToken) {
      setError("CAPTCHA verification failed. Please try again.");
      return;
    }

    // Rate limiting check
    const rateLimit = rateLimiter.checkLimit(
      `signup_${email}`,
      RATE_LIMITS.SIGNUP.maxAttempts,
      RATE_LIMITS.SIGNUP.windowMs
    );

    if (!rateLimit.allowed) {
      setError(rateLimit.message);
      return;
    }

    // Validate store name
    const storeNameValidation = validateStoreName(storeName);
    if (!storeNameValidation.valid) {
      setError(storeNameValidation.error);
      return;
    }

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setError(emailValidation.error);
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.error);
      return;
    }

    // Validate password match
    const passwordMatchValidation = validatePasswordMatch(password, confirmPassword);
    if (!passwordMatchValidation.valid) {
      setError(passwordMatchValidation.error);
      return;
    }

    setLoading(true);

    try {
      // For trial - create account immediately (no payment needed)
      if (selectedPlan === 'trial') {
        // Use edge function to auto-confirm and send welcome email
        const { data, error: signupError } = await supabase.functions.invoke('complete-signup', {
          body: {
            email: emailValidation.value,
            password: password,
            storeName: storeNameValidation.value,
            plan: selectedPlan
          }
        });

        if (signupError || !data.success) {
          throw new Error(signupError?.message || data?.error || 'Signup failed');
        }

        alert(`✅ Account created successfully!\n\n📧 We've sent a welcome email to ${email}\n\n🔐 You can now login to access your dashboard.\n\nYour Free Trial store is ready!`);
        onBack();
      } else {
        // For Pro/Premium - GO TO PAYMENT FIRST (don't create account yet!)
        
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
      instructions: `#1. Ask before you order\n#2. Order\n#3. Wait for WhatsApp message.\n#4. Fetch Your Order.\nThank You!`,
      show_instructions: true,
      payment_reference: paymentRef,
      // Note: Vendors must add their Yoco keys in Settings after signup
    }]).select().single();

    if (storeError) {
      
      throw storeError;
    }

    return storeData; // Return store data including slug
  }

  async function handleYocoPayment() {
    setProcessingPayment(true);
    setError("");

    try {
      const selectedPlanData = plans.find(p => p.id === selectedPlan);
      const amountInCents = selectedPlan === "pro" ? 2500 : 5000; // R25 Pro, R50 Premium

      // Use create-subscription-checkout Edge Function for REAL PAYMENTS
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: {
          storeId: `new-signup-${Date.now()}`,
          storeName: storeName,
          targetPlan: selectedPlan,
          userEmail: email,
          currentPlan: 'none',
          amount: amountInCents / 100
        }
      });

      if (error) {
        
        throw error;
      }

      if (!data || !data.redirectUrl) {
        throw new Error('No redirect URL received from payment provider');
      }

      // Store signup data in localStorage before redirect
      const signupData = {
        email,
        storeName,
        password,
        plan: selectedPlan,
        timestamp: Date.now()
      };

      localStorage.setItem('pendingSignup', JSON.stringify(signupData));

      // Verify it was stored
      const stored = localStorage.getItem('pendingSignup');

      // Redirect to Yoco hosted checkout page (REAL PAYMENT with LIVE keys)
      window.location.href = data.redirectUrl;

    } catch (err) {
      
      setError('⚠️ Payment initialization failed. Please try again.');
      setProcessingPayment(false);
    }
  }

  async function savePaymentReference(paymentId, selectedPlanData) {
    setLoading(true);

    try {
      // ✅ Use edge function to auto-confirm and send welcome email
      const { data, error: signupError } = await supabase.functions.invoke('complete-signup', {
        body: {
          email: email,
          password: password,
          storeName: storeName,
          plan: selectedPlan,
          paymentReference: paymentId
        }
      });

      if (signupError || !data.success) {
        throw new Error(`Payment succeeded but account creation failed: ${signupError?.message || data?.error}. Please contact support with payment ID: ${paymentId}`);
      }

      // Show success message
      alert(`✅ Payment successful!\n\n💳 Payment ID: ${paymentId}\n\nYour ${selectedPlanData.name} subscription is confirmed!\n\n📧 We've sent a welcome email to ${email}\n\n🔐 You can now login to access your dashboard.\n\nYour ${selectedPlanData.name} store is ready!`);
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
