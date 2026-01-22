import { useState } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";

export default function AffiliateSignup({ onSuccess }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    bankName: "",
    accountNumber: "",
    accountType: "cheque"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const bankOptions = [
    "ABSA",
    "Standard Bank",
    "FNB",
    "Nedbank",
    "Capitec",
    "African Bank",
    "TymeBank",
    "Discovery Bank",
    "Investec",
    "Other"
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Check terms acceptance
      if (!termsAccepted) {
        throw new Error("You must accept the Terms & Conditions to continue");
      }

      // Validate and normalize phone number (South African format)
      let cleanPhone = formData.phone.replace(/\s/g, '').replace(/-/g, '');
      const phoneRegex = /^(\+27|0)[0-9]{9}$/;
      if (!phoneRegex.test(cleanPhone)) {
        throw new Error("Please enter a valid South African phone number (e.g., 0821234567 or +27821234567)");
      }

      // Convert to +27 format if starts with 0
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '+27' + cleanPhone.substring(1);
      }

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error("Please enter a valid email address");
      }

      // Check if email already exists
      const { data: existing } = await supabase
        .from("affiliates")
        .select("email")
        .eq("email", formData.email.toLowerCase())
        .single();

      if (existing) {
        throw new Error("This email is already registered. Please login to your affiliate dashboard instead.");
      }

      // Validate account number (basic check)
      const cleanAccountNumber = formData.accountNumber.replace(/\s/g, '');
      if (cleanAccountNumber.length < 9 || cleanAccountNumber.length > 11) {
        throw new Error("Please enter a valid bank account number (9-11 digits)");
      }

      // STEP 1: Create Supabase Auth user with email verification
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.toLowerCase(),
        password: Math.random().toString(36).slice(-16), // Random password (magic link used for login)
        options: {
          data: {
            full_name: formData.fullName,
            user_type: 'affiliate'
          },
          emailRedirectTo: `${window.location.origin}/affiliate-dashboard`
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          throw new Error('This email is already registered. Please login instead.');
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create account. Please try again.');
      }

      // Generate unique referral code
      const firstName = formData.fullName.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '');
      const baseCode = firstName.substring(0, 4).padEnd(4, 'X');
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const tempCode = baseCode + randomSuffix;

      // STEP 2: Create affiliate profile (linked to auth user)
      const { data: affiliate, error: insertError } = await supabase
        .from("affiliates")
        .insert([{
          auth_user_id: authData.user.id, // Link to Supabase Auth
          full_name: formData.fullName,
          email: formData.email.toLowerCase(),
          phone: cleanPhone,
          bank_name: formData.bankName,
          account_number: cleanAccountNumber,
          account_type: formData.accountType,
          referral_code: tempCode,
          status: 'active',
          total_referrals: 0,
          active_referrals: 0,
          total_earned: 0,
          total_paid: 0,
          pending_payout: 0,
          available_balance: 0,
          requested_payout: 0
        }])
        .select()
        .single();

      if (insertError) {
        // If profile creation fails, clean up auth user
        await supabase.auth.admin.deleteUser(authData.user.id);

        if (insertError.code === '23505' && insertError.message.includes('referral_code')) {
          throw new Error("Please try again - referral code generation issue");
        }
        throw insertError;
      }

      setReferralCode(affiliate.referral_code);

      // Notify admin about new affiliate signup (fire and forget)
      try {
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-affiliate-signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            fullName: formData.fullName,
            email: formData.email.toLowerCase(),
            phone: cleanPhone,
            bankName: formData.bankName,
            referralCode: affiliate.referral_code
          })
        }).catch(err => console.log('Admin notification sent'));
      } catch (notifErr) {
        // Don't fail if notification fails
        console.log('Admin notification attempted');
      }

      setSuccess(true);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Success screen
  const [copied, setCopied] = useState(false);

  if (success) {
    const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;

    const handleCopy = () => {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)",
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
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
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
              You're In!
            </h1>
            <p style={{
              color: "rgba(255,255,255,0.9)",
              margin: 0,
              fontSize: "1rem"
            }}>
              Welcome to the Mzansi Food Connect Affiliate Program
            </p>
          </div>

          {/* Content */}
          <div style={{ padding: "2rem" }}>
            {/* Email Confirmation - Priority */}
            <div style={{
              background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
              border: "2px solid #f59e0b",
              borderRadius: "16px",
              padding: "1.5rem",
              marginBottom: "1.5rem",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📧</div>
              <h3 style={{
                margin: "0 0 0.75rem 0",
                color: "#92400e",
                fontSize: "1.1rem",
                fontWeight: "700"
              }}>
                Check Your Inbox
              </h3>
              <p style={{
                margin: 0,
                color: "#a16207",
                fontSize: "0.95rem",
                lineHeight: "1.6"
              }}>
                We sent a confirmation link to<br />
                <strong style={{ color: "#92400e" }}>{formData.email}</strong>
              </p>
              <p style={{
                margin: "1rem 0 0 0",
                padding: "0.75rem",
                background: "rgba(255,255,255,0.5)",
                borderRadius: "8px",
                fontSize: "0.85rem",
                color: "#92400e"
              }}>
                Click the link to activate your account
              </p>
            </div>

            {/* Referral Code */}
            <div style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "16px",
              padding: "1.5rem",
              marginBottom: "1.5rem",
              textAlign: "center"
            }}>
              <p style={{
                color: "rgba(255,255,255,0.9)",
                margin: "0 0 0.5rem 0",
                fontSize: "0.9rem",
                textTransform: "uppercase",
                letterSpacing: "1px"
              }}>
                Your Referral Code
              </p>
              <div style={{
                background: "rgba(255,255,255,0.2)",
                padding: "1rem 1.5rem",
                borderRadius: "12px",
                fontSize: "1.75rem",
                fontWeight: "800",
                color: "white",
                fontFamily: "monospace",
                letterSpacing: "3px"
              }}>
                {referralCode}
              </div>
            </div>

            {/* Referral Link */}
            <div style={{
              background: "#f8fafc",
              borderRadius: "16px",
              padding: "1.5rem",
              marginBottom: "1.5rem"
            }}>
              <p style={{
                margin: "0 0 0.75rem 0",
                fontSize: "0.9rem",
                fontWeight: "600",
                color: "#475569"
              }}>
                Your Referral Link
              </p>
              <div style={{
                background: "white",
                padding: "0.875rem 1rem",
                borderRadius: "10px",
                border: "2px solid #e2e8f0",
                fontSize: "0.8rem",
                color: "#64748b",
                wordBreak: "break-all",
                marginBottom: "1rem"
              }}>
                {referralLink}
              </div>
              <button
                onClick={handleCopy}
                style={{
                  width: "100%",
                  padding: "1rem",
                  background: copied ? "#10b981" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "1rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  transition: "all 0.2s ease"
                }}
              >
                {copied ? (
                  <>✓ Copied!</>
                ) : (
                  <>📋 Copy Referral Link</>
                )}
              </button>
            </div>

            {/* Earnings Info */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginBottom: "1.5rem"
            }}>
              <div style={{
                background: "#f0fdf4",
                borderRadius: "12px",
                padding: "1rem",
                textAlign: "center"
              }}>
                <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.8rem", color: "#166534" }}>Pro Referral</p>
                <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: "700", color: "#15803d" }}>R572/yr</p>
              </div>
              <div style={{
                background: "#faf5ff",
                borderRadius: "12px",
                padding: "1rem",
                textAlign: "center"
              }}>
                <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.8rem", color: "#7e22ce" }}>Premium Referral</p>
                <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: "700", color: "#9333ea" }}>R774/yr</p>
              </div>
            </div>

            {/* Dashboard Link */}
            <a
              href="/affiliate-dashboard"
              style={{
                display: "block",
                textAlign: "center",
                padding: "1rem",
                background: "#f1f5f9",
                borderRadius: "12px",
                color: "#475569",
                textDecoration: "none",
                fontSize: "0.95rem",
                fontWeight: "600",
                transition: "all 0.2s ease"
              }}
            >
              Go to Dashboard →
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Signup form
  return (
    <div className="modern-login-page">
      {/* Left Side - Value Proposition */}
      <div className="login-left" style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      }}>
        <div className="login-brand">
          <div className="brand-icon" style={{ fontSize: "4rem" }}>💰</div>
          <h1 style={{ color: "white" }}>Become an Affiliate</h1>
          <p className="brand-tagline" style={{ color: "rgba(255,255,255,0.9)" }}>
            Earn passive income by referring food vendors to Mzansi Food Connect
          </p>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.1)",
          padding: "2rem",
          borderRadius: "15px",
          marginTop: "2rem",
          backdropFilter: "blur(10px)"
        }}>
          <h3 style={{ color: "white", marginBottom: "1.5rem" }}>Why Join?</h3>
          <div style={{ color: "white" }}>
            <div style={{ marginBottom: "1rem", display: "flex", alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.5rem", marginRight: "1rem" }}>🎯</span>
              <div>
                <strong>30% Recurring Commission</strong>
                <p style={{ margin: "0.25rem 0 0 0", opacity: 0.9, fontSize: "0.9rem" }}>
                  Earn for 12 full months per referral
                </p>
              </div>
            </div>
            <div style={{ marginBottom: "1rem", display: "flex", alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.5rem", marginRight: "1rem" }}>💸</span>
              <div>
                <strong>R572-R774 per Year</strong>
                <p style={{ margin: "0.25rem 0 0 0", opacity: 0.9, fontSize: "0.9rem" }}>
                  Per referred vendor (Pro/Premium)
                </p>
              </div>
            </div>
            <div style={{ marginBottom: "1rem", display: "flex", alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.5rem", marginRight: "1rem" }}>🏦</span>
              <div>
                <strong>Monthly EFT Payouts</strong>
                <p style={{ margin: "0.25rem 0 0 0", opacity: 0.9, fontSize: "0.9rem" }}>
                  Straight to your bank account
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.5rem", marginRight: "1rem" }}>📈</span>
              <div>
                <strong>No Limits</strong>
                <p style={{ margin: "0.25rem 0 0 0", opacity: 0.9, fontSize: "0.9rem" }}>
                  Refer as many vendors as you want
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          background: "rgba(16, 185, 129, 0.2)",
          padding: "1.5rem",
          borderRadius: "12px",
          marginTop: "1.5rem",
          border: "2px solid rgba(16, 185, 129, 0.5)"
        }}>
          <p style={{ color: "white", fontSize: "1.1rem", fontWeight: "bold", margin: "0 0 0.5rem 0" }}>
            Example: 10 Premium Referrals
          </p>
          <p style={{ color: "white", fontSize: "2rem", fontWeight: "bold", margin: 0 }}>
            = R7,740/year
          </p>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", margin: "0.5rem 0 0 0" }}>
            That's R645/month passive income
          </p>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="login-right">
        <div className="login-form-container">
          <div className="form-header">
            <h2>Sign Up - It's Free!</h2>
            <p>Start earning in minutes</p>
          </div>

          <form onSubmit={handleSubmit} className="modern-form">
            <div className="form-group">
              <label htmlFor="fullName">Full Name *</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">WhatsApp Number *</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="0812345678 or +27812345678"
                value={formData.phone}
                onChange={handleChange}
                required
                className="form-input"
              />
              <small style={{ color: "#6b7280", fontSize: "0.85rem" }}>
                For payout notifications • Will be saved in +27 format
              </small>
            </div>

            <div style={{
              background: "#f8f9fa",
              padding: "1.5rem",
              borderRadius: "8px",
              marginBottom: "1rem"
            }}>
              <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem" }}>Bank Details (for payouts)</h4>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label htmlFor="bankName">Bank Name *</label>
                <select
                  id="bankName"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  required
                  className="form-input"
                  style={{ width: "100%" }}
                >
                  <option value="">Select your bank</option>
                  {bankOptions.map(bank => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label htmlFor="accountNumber">Account Number *</label>
                <input
                  id="accountNumber"
                  name="accountNumber"
                  type="text"
                  placeholder="1234567890"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="accountType">Account Type *</label>
                <select
                  id="accountType"
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleChange}
                  required
                  className="form-input"
                  style={{ width: "100%" }}
                >
                  <option value="cheque">Cheque Account</option>
                  <option value="savings">Savings Account</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            {/* Terms & Conditions Checkbox */}
            <div style={{ marginTop: "1.5rem" }}>
              <label style={{
                display: "flex",
                gap: "0.75rem",
                alignItems: "flex-start",
                cursor: "pointer",
                padding: "1rem",
                background: termsAccepted ? "#f0fdf4" : "#fef3c7",
                border: `2px solid ${termsAccepted ? "#10b981" : "#f59e0b"}`,
                borderRadius: "8px",
                transition: "all 0.2s"
              }}>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  required
                  style={{
                    marginTop: "0.25rem",
                    width: "18px",
                    height: "18px",
                    cursor: "pointer"
                  }}
                />
                <span style={{ fontSize: "0.9rem", lineHeight: "1.5" }}>
                  I have read and agree to the{" "}
                  <a
                    href="/affiliate-terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#667eea",
                      textDecoration: "underline",
                      fontWeight: "600"
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Affiliate Program Terms & Conditions
                  </a>
                  {" "}*
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={loading || !termsAccepted}
              style={{
                width: "100%",
                marginTop: "1rem",
                opacity: !termsAccepted ? 0.5 : 1,
                cursor: !termsAccepted ? "not-allowed" : "pointer"
              }}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner"></span>
                  Creating account...
                </span>
              ) : (
                "Create Affiliate Account - FREE"
              )}
            </button>

            <div style={{
              marginTop: "1.5rem",
              padding: "1rem",
              background: "#f0fdf4",
              border: "1px solid #10b981",
              borderRadius: "8px",
              fontSize: "0.85rem",
              color: "#065f46"
            }}>
              🔒 Your bank details are securely stored and only used for commission payouts
            </div>
          </form>

          <div className="form-footer" style={{ marginTop: "2rem" }}>
            <p>
              Already an affiliate?{" "}
              <a href="/affiliate-dashboard" style={{ color: "#667eea", fontWeight: "600" }}>
                Login to Dashboard
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
