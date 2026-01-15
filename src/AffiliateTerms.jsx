import "./App.css";

export default function AffiliateTerms() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#f9fafb",
      padding: "2rem 1rem"
    }}>
      <div style={{
        maxWidth: "900px",
        margin: "0 auto",
        background: "white",
        padding: "3rem",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem", color: "#1f2937" }}>
            💼 Affiliate Program Terms & Conditions
          </h1>
          <p style={{ color: "#6b7280", fontSize: "1.1rem" }}>
            Mzansi Food Connect Affiliate Program
          </p>
          <p style={{ color: "#9ca3af", fontSize: "0.9rem", marginTop: "0.5rem" }}>
            Effective Date: January 15, 2025
          </p>
        </div>

        <div style={{ lineHeight: "1.8", color: "#374151" }}>

          {/* Introduction */}
          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#1f2937" }}>1. Introduction</h2>
            <p>
              Welcome to the Mzansi Food Connect Affiliate Program ("Program"). These Terms and Conditions ("Terms")
              govern your participation in the Program. By signing up as an affiliate, you agree to be bound by these Terms.
            </p>
            <p style={{ marginTop: "1rem" }}>
              <strong>Program Owner:</strong> Mzansi Food Connect<br />
              <strong>Contact Email:</strong> nqubeko377@gmail.com<br />
              <strong>Website:</strong> mzansifoodconnect.app
            </p>
          </section>

          {/* Definitions */}
          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#1f2937" }}>2. Definitions</h2>
            <ul style={{ paddingLeft: "2rem" }}>
              <li><strong>"Affiliate"</strong> means you, the person or entity participating in the Program.</li>
              <li><strong>"Referral"</strong> means a new customer who signs up through your unique referral link.</li>
              <li><strong>"Commission"</strong> means the payment you earn for successful referrals.</li>
              <li><strong>"Qualified Sale"</strong> means a referral who subscribes to a Pro or Premium plan and makes payment.</li>
              <li><strong>"We/Us/Our"</strong> means Mzansi Food Connect.</li>
            </ul>
          </section>

          {/* Commission Structure */}
          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#1f2937" }}>3. Commission Structure</h2>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>3.1 Commission Rate</h3>
            <p>You will earn <strong>30% of the monthly subscription price</strong> for each Qualified Sale.</p>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>3.2 Commission Duration</h3>
            <p>Commissions are paid for <strong>12 consecutive months</strong> from the date of the customer's first payment,
            provided the customer remains subscribed.</p>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>3.3 Eligible Plans</h3>
            <p>Commissions apply only to:</p>
            <ul style={{ paddingLeft: "2rem" }}>
              <li><strong>Pro Plan:</strong> R159/month → You earn R47.70/month (R572.40 over 12 months)</li>
              <li><strong>Premium Plan:</strong> R215/month → You earn R64.50/month (R774 over 12 months)</li>
            </ul>
            <p style={{ marginTop: "0.5rem" }}>
              <strong>Free Trial plans do NOT qualify for commission.</strong>
            </p>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>3.4 Plan Changes</h3>
            <ul style={{ paddingLeft: "2rem" }}>
              <li>If a customer upgrades (Pro → Premium), your commission adjusts to the new rate going forward.</li>
              <li>If a customer downgrades (Premium → Pro), your commission adjusts to the new rate going forward.</li>
              <li>If a customer downgrades to Free Trial, commission stops immediately.</li>
            </ul>
          </section>

          {/* Payment Terms */}
          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#1f2937" }}>4. Payment Terms</h2>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>4.1 Minimum Payout</h3>
            <p>The minimum payout amount is <strong>R50</strong>. You must accumulate at least R50 in commissions before requesting a payout.</p>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>4.2 Payment Method</h3>
            <p>All payments are made via <strong>Electronic Funds Transfer (EFT)</strong> to your registered South African bank account.</p>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>4.3 Payment Timeline</h3>
            <p>Payouts are processed <strong>within 1-3 business days</strong> after your request is submitted and approved.</p>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>4.4 On-Demand Payouts</h3>
            <p>You may request payouts at any time (no monthly waiting period), subject to the minimum payout amount.</p>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>4.5 Tax Responsibility</h3>
            <p>
              <strong>You are solely responsible for all taxes</strong> related to your affiliate income. This includes declaring
              your earnings to SARS (South African Revenue Service) and paying any applicable income tax. We do not withhold taxes
              from your payments.
            </p>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>4.6 Banking Information</h3>
            <p>You must provide accurate banking information. We are not liable for failed payments due to incorrect bank details.</p>
          </section>

          {/* Tracking & Attribution */}
          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#1f2937" }}>5. Tracking & Attribution</h2>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>5.1 Referral Link</h3>
            <p>You will be provided a unique referral link containing your referral code. <strong>Only sign-ups using your
            link will be credited to you.</strong></p>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>5.2 Cookie Duration</h3>
            <p>Referral tracking is valid for <strong>30 days</strong> from the date the prospect clicks your link. If they
            sign up within 30 days, you get the commission.</p>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>5.3 Last-Click Attribution</h3>
            <p>If a prospect clicks multiple affiliate links, <strong>the last affiliate link clicked</strong> gets the commission.</p>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>5.4 Disputes</h3>
            <p>All tracking disputes will be reviewed by our team. Our decision is final. We reserve the right to verify
            all referrals for legitimacy.</p>
          </section>

          {/* Prohibited Practices */}
          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#1f2937" }}>6. Prohibited Practices</h2>
            <p style={{ marginBottom: "1rem" }}>The following activities are strictly prohibited and will result in immediate
            termination and forfeiture of all commissions:</p>

            <ul style={{ paddingLeft: "2rem" }}>
              <li><strong>Spam:</strong> Sending unsolicited emails, messages, or communications.</li>
              <li><strong>False Claims:</strong> Making false, misleading, or exaggerated claims about our platform.</li>
              <li><strong>Brand Misuse:</strong> Using our trademarks, logos, or brand name without permission.</li>
              <li><strong>Paid Search:</strong> Bidding on our brand terms (e.g., "Mzansi Food Connect") in Google Ads or other paid search.</li>
              <li><strong>Self-Referrals:</strong> Creating accounts or referring yourself to earn commissions.</li>
              <li><strong>Fake Accounts:</strong> Creating fake customer accounts or using stolen credit cards.</li>
              <li><strong>Cookie Stuffing:</strong> Using technical methods to force cookies without genuine user action.</li>
              <li><strong>Incentivized Signups:</strong> Offering cash or incentives to people to sign up (unless pre-approved).</li>
              <li><strong>Automated Traffic:</strong> Using bots, scripts, or automated tools to generate fake clicks/signups.</li>
              <li><strong>Adult/Illegal Content:</strong> Promoting our platform on adult, gambling, illegal, or harmful websites.</li>
            </ul>
          </section>

          {/* Chargebacks & Refunds */}
          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#1f2937" }}>7. Chargebacks, Refunds & Cancellations</h2>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>7.1 Chargebacks</h3>
            <p>If a customer initiates a chargeback, any commissions earned from that customer will be reversed and deducted
            from your account balance.</p>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>7.2 Refunds</h3>
            <p>If a customer receives a refund for any subscription payment, the associated commission for that month will be reversed.</p>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>7.3 Cancellations</h3>
            <p>If a customer cancels their subscription before completing 12 months, your commission stops immediately.
            You keep commissions already paid for completed months.</p>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>7.4 Churned Customers</h3>
            <p>If a customer's payment fails or they stop paying, commission stops. We are not responsible for customer retention.</p>
          </section>

          {/* Program Changes */}
          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#1f2937" }}>8. Program Changes</h2>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>8.1 Right to Modify</h3>
            <p>We reserve the right to change commission rates, program terms, or discontinue the Program at any time with
            <strong> 30 days notice</strong>.</p>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>8.2 Grandfathering</h3>
            <p>Existing affiliates will be grandfathered at current commission rates for <strong>at least 90 days</strong>
            after any rate changes are announced.</p>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>8.3 Existing Referrals</h3>
            <p>If the program is discontinued, you will continue earning commissions on existing referrals until their
            12-month period expires or they cancel.</p>
          </section>

          {/* Termination */}
          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#1f2937" }}>9. Termination</h2>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>9.1 Termination by You</h3>
            <p>You may terminate your participation at any time by emailing nqubeko377@gmail.com. Unpaid commissions earned
            legitimately will be paid according to normal schedule.</p>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>9.2 Termination by Us</h3>
            <p>We reserve the right to terminate your participation at any time for:</p>
            <ul style={{ paddingLeft: "2rem" }}>
              <li>Violation of these Terms</li>
              <li>Fraudulent activity</li>
              <li>Damage to our brand reputation</li>
              <li>Any reason, with or without cause</li>
            </ul>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>9.3 Effects of Termination</h3>
            <p>Upon termination for cause (fraud, violations), all unpaid commissions are forfeited. Upon voluntary termination
            or termination without cause, legitimate earned commissions will be paid.</p>
          </section>

          {/* Liability & Disclaimers */}
          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#1f2937" }}>10. Liability & Disclaimers</h2>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>10.1 No Earnings Guarantee</h3>
            <p><strong>We make NO guarantees about your earnings.</strong> Your income depends on your marketing efforts,
            the quality of referrals, and customer retention.</p>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>10.2 Independent Contractor</h3>
            <p>You are an independent contractor, not an employee. You are responsible for your own business expenses,
            taxes, and compliance with laws.</p>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>10.3 Marketing Responsibility</h3>
            <p>You are solely responsible for your marketing activities. We are not liable for any claims, damages, or
            legal issues arising from your promotional activities.</p>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>10.4 Platform Availability</h3>
            <p>We are not liable for platform downtime, bugs, or technical issues that may affect tracking or customer experience.</p>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>10.5 Limitation of Liability</h3>
            <p>Our total liability to you shall not exceed the total commissions paid to you in the 12 months prior to any claim.</p>
          </section>

          {/* Privacy & Data */}
          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#1f2937" }}>11. Privacy & Data Protection</h2>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>11.1 POPIA Compliance</h3>
            <p>We comply with the Protection of Personal Information Act (POPIA) and handle your personal information
            in accordance with South African data protection laws.</p>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>11.2 Data We Collect</h3>
            <p>We collect your name, email, phone number, bank details, and referral activity for the purpose of administering
            the affiliate program and processing payments.</p>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>11.3 Data Sharing</h3>
            <p>We will not sell or share your personal information with third parties except as required to process payments
            or comply with legal obligations.</p>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>11.4 Referral Data Ownership</h3>
            <p>All customer data, including referral information, belongs to Mzansi Food Connect. You have the right to view
            your own affiliate statistics but do not own customer data.</p>
          </section>

          {/* Intellectual Property */}
          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#1f2937" }}>12. Intellectual Property</h2>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>12.1 License to Use Materials</h3>
            <p>We grant you a limited, non-exclusive, revocable license to use our logos, brand name, and marketing materials
            solely for promoting the affiliate program.</p>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>12.2 Restrictions</h3>
            <p>You may NOT:</p>
            <ul style={{ paddingLeft: "2rem" }}>
              <li>Modify our logos or brand materials</li>
              <li>Register domains containing our brand name</li>
              <li>Claim endorsement or partnership beyond affiliate status</li>
              <li>Use our materials for purposes other than affiliate promotion</li>
            </ul>
          </section>

          {/* General Terms */}
          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#1f2937" }}>13. General Terms</h2>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>13.1 Governing Law</h3>
            <p>These Terms are governed by the laws of the <strong>Republic of South Africa</strong>. Any disputes will be
            resolved in South African courts.</p>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>13.2 Entire Agreement</h3>
            <p>These Terms constitute the entire agreement between you and Mzansi Food Connect regarding the affiliate program.</p>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>13.3 Severability</h3>
            <p>If any provision of these Terms is found invalid, the remaining provisions remain in full effect.</p>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>13.4 Waiver</h3>
            <p>Our failure to enforce any provision does not constitute a waiver of that provision.</p>

            <h3 style={{ fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }}>13.5 Assignment</h3>
            <p>You may not assign or transfer your affiliate account. We may assign these Terms to any successor entity.</p>
          </section>

          {/* Contact */}
          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#1f2937" }}>14. Contact Information</h2>
            <p>For questions about these Terms or the affiliate program, contact us:</p>
            <p style={{ marginTop: "1rem" }}>
              <strong>Email:</strong> nqubeko377@gmail.com<br />
              <strong>Website:</strong> mzansifoodconnect.app
            </p>
          </section>

          {/* Acceptance */}
          <section style={{ marginBottom: "2rem", padding: "1.5rem", background: "#f0fdf4", border: "2px solid #10b981", borderRadius: "8px" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#065f46" }}>15. Acceptance of Terms</h2>
            <p style={{ color: "#065f46" }}>
              By checking the box on the affiliate signup form and submitting your application, you acknowledge that you have
              read, understood, and agree to be bound by these Terms and Conditions.
            </p>
            <p style={{ marginTop: "1rem", color: "#065f46", fontWeight: "600" }}>
              Last Updated: January 15, 2025
            </p>
          </section>

        </div>

        {/* Back Button */}
        <div style={{ textAlign: "center", marginTop: "3rem" }}>
          <a
            href="/become-affiliate"
            style={{
              display: "inline-block",
              padding: "1rem 2rem",
              background: "#667eea",
              color: "white",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "600"
            }}
          >
            ← Back to Signup
          </a>
        </div>

      </div>
    </div>
  );
}
