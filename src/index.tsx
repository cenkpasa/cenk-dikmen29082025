import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { ErpProvider } from '@/contexts/ErpContext';
import { PersonnelProvider } from '@/contexts/PersonnelContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { ReconciliationProvider } from '@/contexts/ReconciliationContext';
import { NotificationCenterProvider } from '@/contexts/NotificationCenterContext';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { syncService } from '@/services/syncService';

// Çevrimdışı çalışırken yapılan değişiklikleri senkronize etmek için periyodik kontrolleri başlat.
window.addEventListener('online', () => syncService.processSyncQueue());
setInterval(() => syncService.processSyncQueue(), 5 * 60 * 1000); // Her 5 dakikada bir
syncService.processSyncQueue();

const AppProviders = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <LanguageProvider>
      <NotificationProvider>
        <AuthProvider>
          <DataProvider>
            <ErpProvider>
              <PersonnelProvider>
                <SettingsProvider>
                  <ReconciliationProvider>
                    <NotificationCenterProvider>
                      {children}
                    </NotificationCenterProvider>
                  </ReconciliationProvider>
                </SettingsProvider>
              </PersonnelProvider>
            </ErpProvider>
          </DataProvider>
        </AuthProvider>
      </NotificationProvider>
    </LanguageProvider>
  </ThemeProvider>
);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppProviders>
        <App />
      </AppProviders>
    </ErrorBoundary>
  </React.StrictMode>
);
