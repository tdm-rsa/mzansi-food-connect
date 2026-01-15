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
      setSuccess(true);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Success screen
  if (success) {
    const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;

    return (
      <div className="modern-login-page">
        <div className="login-left" style={{
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)"
        }}>
          <div className="login-brand">
            <div className="brand-icon" style={{ fontSize: "4rem" }}>🎉</div>
            <h1 style={{ color: "white" }}>Welcome Aboard!</h1>
            <p className="brand-tagline" style={{ color: "rgba(255,255,255,0.9)" }}>
              You're now an official Mzansi Food Connect affiliate
            </p>
          </div>

          <div style={{
            background: "rgba(255,255,255,0.1)",
            padding: "2rem",
            borderRadius: "15px",
            marginTop: "2rem",
            backdropFilter: "blur(10px)"
          }}>
            <h3 style={{ color: "white", marginBottom: "1rem" }}>💰 Your Earnings Potential</h3>
            <div style={{ color: "white", fontSize: "0.95rem", lineHeight: "1.8" }}>
              <p><strong>Pro referrals:</strong> R572/year each</p>
              <p><strong>Premium referrals:</strong> R774/year each</p>
              <p style={{ marginTop: "1rem", fontSize: "1.1rem", fontWeight: "bold" }}>
                10 Premium clients = R7,740/year passive income
              </p>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-form-container">
            <div className="form-header">
              <h2>Your Affiliate Dashboard</h2>
              <p>Start sharing and earning today</p>
            </div>

            <div style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              padding: "2rem",
              borderRadius: "12px",
              marginBottom: "2rem",
              color: "white"
            }}>
              <h3 style={{ margin: "0 0 1rem 0", color: "white" }}>Your Referral Code</h3>
              <div style={{
                background: "rgba(255,255,255,0.2)",
                padding: "1rem",
                borderRadius: "8px",
                fontSize: "1.5rem",
                fontWeight: "bold",
                textAlign: "center",
                fontFamily: "monospace",
                letterSpacing: "2px"
              }}>
                {referralCode}
              </div>
            </div>

            <div style={{
              background: "#f8f9fa",
              padding: "1.5rem",
              borderRadius: "12px",
              marginBottom: "2rem"
            }}>
              <h3 style={{ marginBottom: "1rem", fontSize: "1rem" }}>📎 Your Referral Link</h3>
              <div style={{
                background: "white",
                padding: "1rem",
                borderRadius: "8px",
                border: "2px solid #e5e7eb",
                wordBreak: "break-all",
                fontSize: "0.9rem",
                marginBottom: "1rem"
              }}>
                {referralLink}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(referralLink);
                  alert("✅ Link copied to clipboard!");
                }}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                📋 Copy Link
              </button>
            </div>

            <div style={{
              background: "#fff3cd",
              border: "1px solid #ffc107",
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "2rem"
            }}>
              <p style={{ margin: 0, color: "#856404", fontSize: "0.9rem" }}>
                <strong>📧 Important:</strong> We've sent your affiliate details to {formData.email}.
                Save your referral link and start promoting!
              </p>
            </div>

            <div style={{
              background: "#f8f9fa",
              padding: "1.5rem",
              borderRadius: "12px"
            }}>
              <h3 style={{ marginBottom: "1rem", fontSize: "1rem" }}>🚀 How to Get Started</h3>
              <ol style={{ margin: 0, paddingLeft: "1.5rem", color: "#4b5563" }}>
                <li style={{ marginBottom: "0.5rem" }}>Share your referral link with food vendors</li>
                <li style={{ marginBottom: "0.5rem" }}>They sign up and choose Pro or Premium</li>
                <li style={{ marginBottom: "0.5rem" }}>Earn 30% monthly for 12 months per client</li>
                <li>Get paid via EFT to your bank account</li>
              </ol>
            </div>

            <button
              onClick={() => window.location.href = "/affiliate-dashboard"}
              style={{
                width: "100%",
                marginTop: "2rem",
                padding: "1rem",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Go to Dashboard →
            </button>
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
