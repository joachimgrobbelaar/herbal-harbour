import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // If error originates from a browser extension, do not interrupt the app UI
    const errString = String(error?.stack || error?.message || '');
    if (
      errString.includes('moz-extension://') ||
      errString.includes('chrome-extension://') ||
      errString.includes('safari-extension://') ||
      errString.includes('injected.js')
    ) {
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errString = String(error?.stack || error?.message || '');
    if (
      errString.includes('moz-extension://') ||
      errString.includes('chrome-extension://') ||
      errString.includes('safari-extension://') ||
      errString.includes('injected.js')
    ) {
      // Ignore extension errors
      return;
    }
    console.error('Herbal Harbour Error Boundary caught:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-emerald-900/10 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-200">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            
            <h2 className="text-2xl font-black text-[#143329] mb-2">Notice Encountered</h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Something on the page failed to display. Your cart is still saved in this browser.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full py-3 px-4 rounded-xl bg-[#25a86a] hover:bg-[#1e8b57] text-white font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Resume Session
              </button>

              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition-all cursor-pointer text-sm"
              >
                Reload Herbal Harbour
              </button>

            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
