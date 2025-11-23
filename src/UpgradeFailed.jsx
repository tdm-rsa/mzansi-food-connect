import { useSearchParams, useNavigate } from "react-router-dom";

export default function UpgradeFailed() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const targetPlan = searchParams.get('plan');

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.errorIcon}>✕</div>
        <h1 style={styles.title}>Upgrade Failed</h1>
        <p style={styles.text}>
          Your upgrade to <strong>{targetPlan?.charAt(0).toUpperCase() + targetPlan?.slice(1)}</strong> plan could not be processed. This may be due to:
        </p>
        <ul style={styles.reasonList}>
          <li>Insufficient funds in your account</li>
          <li>Card declined by your bank</li>
          <li>Payment cancelled</li>
          <li>Technical error</li>
        </ul>
        <p style={styles.notification}>
          No charges were made to your account. Please try again or contact your bank if you continue experiencing issues.
        </p>
        <button
          onClick={() => navigate('/app')}
          style={styles.button}
        >
          Back to Dashboard
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
  reasonList: {
    textAlign: 'left',
    color: '#6b7280',
    marginBottom: '1.5rem',
    paddingLeft: '2rem',
    lineHeight: '1.8',
  },
  notification: {
    background: '#fef2f2',
    borderRadius: '8px',
    padding: '1rem',
    marginTop: '1.5rem',
    color: '#991b1b',
    marginBottom: '1.5rem',
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
    width: '100%',
  },
};
