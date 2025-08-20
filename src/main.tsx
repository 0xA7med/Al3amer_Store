import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { SettingsProvider } from './contexts/SettingsContext';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';
import './index.css';

// Main app container with error boundary and providers
const AppWithProviders = () => (
  <ErrorBoundary>
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  </ErrorBoundary>
);

// Render the app
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWithProviders />
  </StrictMode>
);
