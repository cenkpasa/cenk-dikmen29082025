import React, { Component, ErrorInfo, ReactNode } from 'react';
import Button from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-cnk-bg-light text-cnk-txt-secondary-light p-4">
          <div className="text-center bg-cnk-panel-light p-8 rounded-lg shadow-lg border border-cnk-border-light">
            <i className="fas fa-exclamation-triangle text-5xl text-red-500 mb-4"></i>
            <h1 className="text-2xl font-bold text-cnk-txt-primary-light mb-2">Oops! Bir şeyler ters gitti.</h1>
            <p className="mb-6">Beklenmedik bir hata oluştu. Lütfen sayfayı yenilemeyi deneyin veya daha sonra tekrar gelin.</p>
            <div className="flex items-center justify-center gap-4">
                <Button
                  variant="primary"
                  onClick={() => this.setState({ hasError: false })}
                >
                  Tekrar Dene
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => window.location.reload()}
                >
                  Sayfayı Yenile
                </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
