import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign cross-origin iframe errors that trigger SecurityError when tools (like React DevTools or browser extensions) try to inspect the iframe.
if (typeof window !== 'undefined') {
  const handleSecurityError = (event: ErrorEvent) => {
    const msg = event.message || '';
    if (
      msg.includes("Failed to read a named property '$$typeof' from 'Window'") ||
      msg.includes("Blocked a frame with origin") ||
      msg.includes("cross-origin frame")
    ) {
      console.warn('Suppressed cross-origin iframe security error:', msg);
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handlePromiseSecurityError = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const msg = (reason && reason.message) || '';
    if (
      msg.includes("Failed to read a named property '$$typeof' from 'Window'") ||
      msg.includes("Blocked a frame with origin") ||
      msg.includes("cross-origin frame")
    ) {
      console.warn('Suppressed cross-origin iframe security rejection:', msg);
      event.preventDefault();
      event.stopPropagation();
    }
  };

  window.addEventListener('error', handleSecurityError, true);
  window.addEventListener('unhandledrejection', handlePromiseSecurityError, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

