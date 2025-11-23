import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

export default function UpgradeSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [planData, setPlanData] = useState(null);

  const storeId = searchParams.get('storeId');
  const targetPlan = searchParams.get('plan');

  useEffect(() => {
    async function verifyUpgrade() {
      if (!storeId || !targetPlan) {
        setStatus('error');
        return;
      }

      // Poll for plan upgrade (webhook might take a moment)
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds

      const checkUpgrade = async () => {
        const { data: store } = await supabase
          .from("tenants")
          .select("plan, plan_started_at, plan_expires_at")
          .eq("id", storeId)
          .single();

        if (store && store.plan === targetPlan) {
          setPlanData(store);
          setStatus('success');
          return true;
        }
        return false;
      };

      const pollInterval = setInterval(async () => {
        attempts++;
        const found = await checkUpgrade();

        if (found || attempts >= maxAttempts) {
          clearInterval(pollInterval);
          if (!found) {
            setStatus('pending');
          }
        }
      }, 1000);
    }

    verifyUpgrade();
  }, [storeId, targetPlan]);

  if (status === 'verifying') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.spinner}></div>
          <h1 style={styles.title}>Verifying Payment...</h1>
          <p style={styles.text}>Please wait while we confirm your upgrade.</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.successIcon}>✓</div>
          <h1 style={styles.title}>Upgrade Successful!</h1>
          <p style={styles.text}>
            Your store has been upgraded to <strong>{targetPlan.charAt(0).toUpperCase() + targetPlan.slice(1)}</strong> plan!
          </p>
          <div style={styles.upgradeDetails}>
            <p><strong>Plan:</strong> {targetPlan.charAt(0).toUpperCase() + targetPlan.slice(1)}</p>
            <p><strong>Started:</strong> {new Date(planData?.plan_started_at).toLocaleDateString()}</p>
            {planData?.plan_expires_at && (
              <p><strong>Expires:</strong> {new Date(planData?.plan_expires_at).toLocaleDateString()}</p>
            )}
          </div>
          <p style={styles.notification}>
            All {targetPlan} features are now active! Enjoy your upgraded experience.
          </p>
          <button
            onClick={() => navigate('/app')}
            style={styles.button}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.warningIcon}>⚠️</div>
          <h1 style={styles.title}>Payment Processing</h1>
          <p style={styles.text}>
            Your payment was received but the upgrade is still being processed.
          </p>
          <p style={styles.notification}>
            Your plan will be upgraded shortly. Please check back in a moment or refresh your dashboard.
          </p>
          <button
            onClick={() => navigate('/app')}
            style={styles.button}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.errorIcon}>✕</div>
        <h1 style={styles.title}>Something went wrong</h1>
        <p style={styles.text}>
          We couldn't verify your upgrade. Please contact support if you were charged.
        </p>
        <button
          onClick={() => navigate('/app')}
          style={styles.button}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '3rem',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  successIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: '#10b981',
    color: 'white',
    fontSize: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem',
    fontWeight: 'bold',
  },
  errorIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: '#ef4444',
    color: 'white',
    fontSize: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem',
    fontWeight: 'bold',
  },
  warningIcon: {
    fontSize: '64px',
    margin: '0 auto 1.5rem',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 1.5rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: '#1f2937',
  },
  text: {
    fontSize: '1.1rem',
    color: '#6b7280',
    marginBottom: '1rem',
    lineHeight: '1.6',
  },
  upgradeDetails: {
    background: '#f3f4f6',
    borderRadius: '8px',
    padding: '1.5rem',
    margin: '1.5rem 0',
    textAlign: 'left',
  },
  notification: {
    background: '#dbeafe',
    borderRadius: '8px',
    padding: '1rem',
    marginTop: '1.5rem',
    color: '#1e40af',
  },
  button: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '1rem 2rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '1.5rem',
    width: '100%',
  },
};
