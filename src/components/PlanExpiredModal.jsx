import { useState } from "react";
import UpgradePayment from "./UpgradePayment";
import "./PlanExpiredModal.css";

export default function PlanExpiredModal({ storeInfo, onRenewed }) {
  const [showPayment, setShowPayment] = useState(false);

  const plan = storeInfo?.plan || 'trial';
  const planName = plan.charAt(0).toUpperCase() + plan.slice(1);

  if (showPayment) {
    return (
      <UpgradePayment
        targetPlan={plan} // Renew same plan
        storeInfo={storeInfo}
        onClose={() => setShowPayment(false)}
        onSuccess={() => {
          setShowPayment(false);
          if (onRenewed) onRenewed();
        }}
      />
    );
  }

  return (
    <div className="plan-expired-overlay">
      <div className="plan-expired-modal">
        <div className="expired-icon">⏰</div>

        <h2>Your {planName} Plan Has Expired</h2>

        <p className="expired-message">
          {plan === 'trial' ? (
            <>
              Your 7-day free trial has ended. Upgrade to <strong>Pro</strong> or <strong>Premium</strong> to continue using Mzansi Food Connect.
            </>
          ) : (
            <>
              Your monthly subscription has expired. Renew now to restore access to your <strong>{planName}</strong> features.
            </>
          )}
        </p>

        <div className="expired-features-lost">
          <h3>Features Currently Unavailable:</h3>
          <ul>
            <li>❌ Create new orders</li>
            <li>❌ Update menu items</li>
            <li>❌ Access analytics</li>
            <li>❌ Customize your store</li>
            <li>❌ Receive customer messages</li>
          </ul>
        </div>

        {plan === 'trial' ? (
          <div className="expired-actions">
            <button
              className="btn-renew btn-pro"
              onClick={() => {
                // Change to Pro
                storeInfo.plan = 'pro';
                setShowPayment(true);
              }}
            >
              Upgrade to Pro (R135/month)
            </button>
            <button
              className="btn-renew btn-premium"
              onClick={() => {
                // Change to Premium
                storeInfo.plan = 'premium';
                setShowPayment(true);
              }}
            >
              Upgrade to Premium (R185/month)
            </button>
          </div>
        ) : (
          <div className="expired-actions">
            <button
              className="btn-renew"
              onClick={() => setShowPayment(true)}
            >
              Renew {planName} Plan (R{plan === 'pro' ? '135' : '185'}/month)
            </button>

            {plan === 'premium' && (
              <button
                className="btn-downgrade"
                onClick={() => {
                  storeInfo.plan = 'pro';
                  setShowPayment(true);
                }}
              >
                Downgrade to Pro (R135/month)
              </button>
            )}
          </div>
        )}

        <p className="expired-note">
          💡 Your store data is safe. Renew anytime to restore full access.
        </p>
      </div>
    </div>
  );
}
