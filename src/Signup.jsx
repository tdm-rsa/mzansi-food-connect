import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { validateEmail, validatePassword, validatePasswordMatch, validateStoreName } from "./utils/validation";
import rateLimiter, { RATE_LIMITS } from "./utils/rateLimiter";
import { executeRecaptcha, initRecaptchaBadge } from "./utils/captcha";
import "./App.css";

export default function Signup({ onBack, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Choose Plan, 2: Account Details, 3: Payment, 4: Success
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
  const [referralCode, setReferralCode] = useState(null); // Capture affiliate referral code
  const [createdSlug, setCreatedSlug] = useState(null); // Store the created slug for success screen

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

  // Capture referral code from URL (?ref=CODE)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setReferralCode(ref);
      console.log('Referral code captured:', ref);
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
      price: "R159",
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
      price: "R215",
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
            plan: selectedPlan,
            referralCode: referralCode // Pass referral code if exists
          }
        });

        if (signupError || !data.success) {
          throw new Error(signupError?.message || data?.error || 'Signup failed');
        }

        // Store the slug for success screen
        if (data.slug) {
          setCreatedSlug(data.slug);
        }
        setStep(4); // Go to success screen
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
      const amountInCents = selectedPlan === "pro" ? 15900 : 21500; // R159 Pro, R215 Premium

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
        referralCode: referralCode, // Store referral code for after payment
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
          paymentReference: paymentId,
          referralCode: referralCode // Pass referral code if exists
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

  // Step 4: Success screen
  if (step === 4) {
    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    const storeUrl = createdSlug
      ? `https://${createdSlug}.mzansifoodconnect.app`
      : `https://${storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.mzansifoodconnect.app`;

    return (
      <div style={{
        minHeight: "100vh",
        background: selectedPlan === "trial"
          ? "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)"
          : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem"
      }}>
        <div style={{
          background: "white",
          borderRadius: "24px",
          maxWidth: "500px",
          width: "100%",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
        }}>
          {/* Success Header */}
          <div style={{
            background: selectedPlan === "trial"
              ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: "2.5rem 2rem",
            textAlign: "center"
          }}>
            <div style={{
              width: "80px",
              height: "80px",
              background: "white",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              fontSize: "2.5rem",
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)"
            }}>
              ✓
            </div>
            <h1 style={{
              color: "white",
              margin: "0 0 0.5rem 0",
              fontSize: "1.75rem",
              fontWeight: "700"
            }}>
              Welcome to Mzansi Food Connect!
            </h1>
            <p style={{
              color: "rgba(255,255,255,0.9)",
              margin: 0,
              fontSize: "1rem"
            }}>
              Your {selectedPlanData?.name || "store"} is ready
            </p>
          </div>

          {/* Content */}
          <div style={{ padding: "2rem" }}>
            {/* Email Confirmation */}
            <div style={{
              background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
              border: "2px solid #3b82f6",
              borderRadius: "16px",
              padding: "1.5rem",
              marginBottom: "1.5rem",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📧</div>
              <h3 style={{
                margin: "0 0 0.5rem 0",
                color: "#1e40af",
                fontSize: "1rem",
                fontWeight: "700"
              }}>
                Check Your Email
              </h3>
              <p style={{
                margin: 0,
                color: "#1e40af",
                fontSize: "0.9rem"
              }}>
                We sent a welcome email to<br />
                <strong>{email}</strong>
              </p>
            </div>

            {/* Store Info */}
            <div style={{
              background: "#f8fafc",
              borderRadius: "16px",
              padding: "1.5rem",
              marginBottom: "1.5rem"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                marginBottom: "1rem"
              }}>
                <div style={{
                  width: "50px",
                  height: "50px",
                  background: selectedPlan === "trial" ? "#10b981" : "#667eea",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem"
                }}>
                  🏪
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: "700", color: "#1e293b", fontSize: "1.1rem" }}>
                    {storeName}
                  </p>
                  <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem" }}>
                    {selectedPlanData?.name} Plan
                  </p>
                </div>
              </div>
              <div style={{
                background: "white",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "0.85rem",
                color: "#64748b",
                wordBreak: "break-all"
              }}>
                {storeUrl}
              </div>
            </div>

            {/* What's Next */}
            <div style={{
              background: "#f0fdf4",
              borderRadius: "12px",
              padding: "1.25rem",
              marginBottom: "1.5rem"
            }}>
              <h4 style={{ margin: "0 0 0.75rem 0", color: "#166534", fontSize: "0.95rem" }}>
                What's Next?
              </h4>
              <ul style={{
                margin: 0,
                paddingLeft: "1.25rem",
                color: "#15803d",
                fontSize: "0.9rem",
                lineHeight: "1.8"
              }}>
                <li>Login to your dashboard</li>
                <li>Add your menu items</li>
                <li>Customize your store design</li>
                <li>Start taking orders!</li>
              </ul>
            </div>

            {/* Login Button */}
            <button
              onClick={onBack}
              style={{
                width: "100%",
                padding: "1rem",
                background: selectedPlan === "trial"
                  ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                  : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "1rem",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem"
              }}
            >
              Go to Login →
            </button>
          </div>
        </div>
      </div>
    );
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
