import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: _, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          margin: '20px auto',
          maxWidth: '800px',
          backgroundColor: '#ffe0e0',
          border: '1px solid #ffb3b3',
          borderRadius: '8px',
          color: '#cc0000',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h2 style={{ color: '#cc0000', marginBottom: '10px' }}>
            Something went wrong.
          </h2>
          <p style={{ marginBottom: '15px' }}>
            We're sorry for the inconvenience. Please try reloading the application.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: '10px 20px',
              backgroundColor: '#cc0000',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '1em'
            }}
          >
            Reload Application
          </button>
          {this.state.error && (
            <details style={{ whiteSpace: 'pre-wrap', marginTop: '20px', borderTop: '1px solid #ffb3b3', paddingTop: '15px' }}>
              <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>Error Details</summary>
              <p>{this.state.error.toString()}</p>
              {this.state.errorInfo && (
                <pre style={{ overflowX: 'auto', backgroundColor: '#fff', padding: '10px', borderRadius: '5px', border: '1px solid #eee', marginTop: '10px' }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;