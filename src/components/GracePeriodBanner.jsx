import { useState } from "react";
import { getGracePeriodDaysLeft } from "../utils/planFeatures";
import UpgradePayment from "./UpgradePayment";
import "./GracePeriodBanner.css";

export default function GracePeriodBanner({ storeInfo, user, onRenewed }) {
  const [showPayment, setShowPayment] = useState(false);

  const daysLeft = getGracePeriodDaysLeft(storeInfo);
  const plan = storeInfo?.plan || 'trial';
  const planName = plan.charAt(0).toUpperCase() + plan.slice(1);

  if (showPayment) {
    return (
      <UpgradePayment
        user={user}
        targetPlan={plan}
        storeInfo={storeInfo}
        onSuccess={() => {
          setShowPayment(false);
          if (onRenewed) onRenewed();
        }}
        onCancel={() => setShowPayment(false)}
      />
    );
  }

  return (
    <div className="grace-period-banner">
      <div className="grace-banner-content">
        <div className="grace-icon">⏰</div>

        <div className="grace-message">
          <h3>Your {planName} plan has expired - Grace Period Active</h3>
          <p>
            You have <strong>{daysLeft} {daysLeft === 1 ? 'day' : 'days'} remaining</strong> to renew before your store is completely disabled.
          </p>
        </div>

        <div className="grace-actions">
          <button
            className="btn-renew-now"
            onClick={() => setShowPayment(true)}
          >
            Renew Now (R{plan === 'pro' ? '149' : '215'}/month)
          </button>
        </div>
      </div>

      <div className="grace-countdown">
        <div className="countdown-circle">
          <div className="countdown-number">{daysLeft}</div>
          <div className="countdown-label">Days Left</div>
        </div>

        <div className="grace-warnings">
          <h4>What happens after grace period:</h4>
          <ul>
            <li>❌ Dashboard access completely blocked</li>
            <li>❌ Your store hidden from all customers</li>
            <li>❌ No new orders can be placed</li>
            <li>❌ Customer messages disabled</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
