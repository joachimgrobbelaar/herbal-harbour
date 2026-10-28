import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { ShopProvider } from './context/ShopContext.tsx';
import { SmoothScroll } from './components/SmoothScroll.tsx';
import './index.css';

// Guard against third-party browser extensions (Firefox moz-extension, Chrome extensions, etc.)
// injecting scripts that throw unhandled cross-origin errors into iframes.
if (typeof window !== 'undefined') {
  const isExtensionNoise = (source?: string, msg?: string, stack?: string): boolean => {
    const combined = `${source || ''} ${msg || ''} ${stack || ''}`.toLowerCase();
    return (
      combined.includes('moz-extension://') ||
      combined.includes('chrome-extension://') ||
      combined.includes('safari-extension://') ||
      combined.includes('injected.js') ||
      (msg === 'Script error.' && (!source || combined.includes('extension')))
    );
  };

  window.addEventListener(
    'error',
    (event) => {
      if (isExtensionNoise(event.filename, event.message, event.error?.stack)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return true;
      }
    },
    true
  );

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      const reason = event.reason;
      const stack = reason?.stack || reason?.message || String(reason || '');
      if (isExtensionNoise(undefined, undefined, stack)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return true;
      }
    },
    true
  );
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <SmoothScroll>
    <AuthProvider>
      <ShopProvider>
        <App />
      </ShopProvider>
    </AuthProvider>
    </SmoothScroll>
  </ErrorBoundary>
);
