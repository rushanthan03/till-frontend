import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Provider } from 'react-redux'
import store from './app/store.ts'
import { AuthProvider } from './contexts/AuthContext.tsx'
import * as Sentry from '@sentry/react'
import { GeneralError } from './pages/index.ts'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.2,
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <Sentry.ErrorBoundary fallback={<GeneralError />}>
          <App />
        </Sentry.ErrorBoundary>
      </AuthProvider>
    </Provider>
  </StrictMode>
)
