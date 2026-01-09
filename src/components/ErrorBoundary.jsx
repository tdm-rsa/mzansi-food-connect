import { Component } from 'react';

/**
 * Error Boundary Component
 * Catches JavaScript errors in child components and displays fallback UI
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so next render shows fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    this.setState({
      error,
      errorInfo
    });

    // You can also log to an error reporting service here
    // Example: Sentry.captureException(error);
  }

  handleReload = () => {
    // Clear error and reload
    window.location.reload();
  };

  handleGoHome = () => {
    // Navigate to home
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            background: 'white',
            color: '#333',
            borderRadius: '16px',
            padding: '3rem',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😵</div>

            <h1 style={{
              fontSize: '2rem',
              margin: '0 0 1rem 0',
              color: '#667eea'
            }}>
              Oops! Something went wrong
            </h1>

            <p style={{
              fontSize: '1.1rem',
              color: '#666',
              marginBottom: '2rem',
              lineHeight: '1.6'
            }}>
              We encountered an unexpected error. Don't worry, your data is safe.
              Please try reloading the page.
            </p>

            {this.state.error && (
              <details style={{
                background: '#f8f8f8',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '2rem',
                textAlign: 'left',
                cursor: 'pointer'
              }}>
                <summary style={{
                  fontWeight: '600',
                  color: '#667eea',
                  marginBottom: '0.5rem'
                }}>
                  Error Details (for developers)
                </summary>
                <pre style={{
                  fontSize: '0.85rem',
                  color: '#d32f2f',
                  overflow: 'auto',
                  maxHeight: '200px',
                  margin: '0.5rem 0 0 0'
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <span style={{ display: 'block', marginTop: '0.5rem', color: '#666' }}>
                      {this.state.errorInfo.componentStack}
                    </span>
                  )}
                </pre>
              </details>
            )}

            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={this.handleReload}
                style={{
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  padding: '0.875rem 2rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#5568d3';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = '#667eea';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                }}
              >
                🔄 Reload Page
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  background: 'white',
                  color: '#667eea',
                  border: '2px solid #667eea',
                  padding: '0.875rem 2rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#f3f4ff';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                🏠 Go to Homepage
              </button>
            </div>

            <p style={{
              marginTop: '2rem',
              fontSize: '0.9rem',
              color: '#999'
            }}>
              If this problem persists, please contact support at{' '}
              <a href="mailto:support@mzansifoodconnect.app" style={{ color: '#667eea', textDecoration: 'none' }}>
                support@mzansifoodconnect.app
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
