
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { LanguageProvider } from './contexts/LanguageContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { NotificationCenterProvider } from './contexts/NotificationCenterContext';
import { ErpProvider } from './contexts/ErpContext';
import { EmailProvider } from './contexts/EmailContext';
import { PersonnelProvider } from './contexts/PersonnelContext';
import { ReconciliationProvider } from './contexts/ReconciliationContext';

const AppProviders = () => (
    <LanguageProvider>
      <NotificationProvider>
        <AuthProvider>
          <SettingsProvider>
            <NotificationCenterProvider>
              <DataProvider>
                  <ErpProvider>
                    <EmailProvider>
                      <PersonnelProvider>
                        <ReconciliationProvider>
                          <App />
                        </ReconciliationProvider>
                      </PersonnelProvider>
                    </EmailProvider>
                  </ErpProvider>
              </DataProvider>
            </NotificationCenterProvider>
          </SettingsProvider>
        </AuthProvider>
      </NotificationProvider>
    </LanguageProvider>
);

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <AppProviders />
  </React.StrictMode>
);
