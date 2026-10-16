import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept harmless auth popup dismissal rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (
      reason?.code === 'auth/popup-closed-by-user' ||
      reason?.code === 'auth/cancelled-popup-request' ||
      reason?.code === 'auth/popup-blocked' ||
      reason?.message?.includes('popup-closed-by-user') ||
      reason?.message?.includes('popup-blocked') ||
      reason?.message?.includes('auth/popup')
    ) {
      event.preventDefault();
      console.info('Handled benign auth popup closure event.');
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
