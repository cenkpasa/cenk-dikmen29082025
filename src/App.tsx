import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotification } from '@/contexts/NotificationContext';

import LoginPage from '@/pages/LoginPage';
import Dashboard from '@/pages/Dashboard';
import Customers from '@/pages/Customers';
import Appointments from '@/pages/Appointments';
import InterviewFormPage from '@/pages/InterviewFormPage';
import OfferPage from '@/pages/OfferPage';
import Users from '@/pages/Users';
import CalculationToolsPage from '@/pages/CalculationToolsPage';
import Profile from '@/pages/Profile';
import AIHubPage from '@/pages/AIHubPage';
import LocationTrackingPage from '@/pages/LocationTrackingPage';
import ErpIntegrationPage from '@/pages/ErpIntegrationPage';
import AISettingsPage from '@/pages/AISettingsPage';
import ReportPage from '@/pages/ReportPage';
import EmailDraftsPage from '@/pages/EmailDraftsPage';
import ReconciliationPage from '@/pages/ReconciliationPage';
import AuditLogPage from '@/pages/AuditLogPage';
import SalesPipelinePage from '@/pages/SalesPipelinePage';
import EmailPage from '@/pages/EmailPage';

import SidebarLeft from '@/components/layout/SidebarLeft';
import SidebarRight from '@/components/layout/SidebarRight';
import Header from '@/components/layout/Header';
import CommandPalette from '@/components/common/CommandPalette';
import AIRobotWidget from '@/components/ai/AIRobotWidget';
import Loader from '@/components/common/Loader';
import { Page as PageType } from '@/types';

export type ViewState = {
  page: PageType;
  id?: string;
};

const App = () => {
    const { currentUser, loading } = useAuth();
    const { NotificationContainer } = useNotification();
    
    const [view, setView] = useState<ViewState>({ page: 'dashboard' });
    const [isLeftSidebarOpen, setLeftSidebarOpen] = useState(false);
    const [isRightSidebarOpen, setRightSidebarOpen] = useState(false);
    const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setCommandPaletteOpen(isOpen => !isOpen);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const executeCommand = (action: () => void) => {
        action();
        setCommandPaletteOpen(false);
    };

    if (loading) {
        return <Loader fullScreen />;
    }

    if (!currentUser) {
        return (
            <>
                <LoginPage />
                <NotificationContainer />
            </>
        );
    }
    
    const renderContent = () => {
        switch (view.page) {
            case 'dashboard': return <Dashboard setView={setView} />;
            case 'customers': return <Customers setView={setView} view={view} />;
            case 'appointments': return <Appointments />;
            case 'gorusme-formu': return <InterviewFormPage setView={setView} view={view} />;
            case 'teklif-yaz': return <OfferPage setView={setView} view={view} />;
            case 'personnel': return <Users view={view} />;
            case 'hesaplama-araclari': return <CalculationToolsPage />;
            case 'profile': return <Profile />;
            case 'yapay-zeka': return <AIHubPage />;
            case 'konum-takip': return <LocationTrackingPage />;
            case 'erp-entegrasyonu': return <ErpIntegrationPage />;
            case 'ai-ayarlari': return <AISettingsPage />;
            case 'raporlar': return <ReportPage />;
            case 'email-taslaklari': return <EmailDraftsPage setView={setView} />;
            case 'mutabakat': return <ReconciliationPage />;
            case 'audit-log': return <AuditLogPage />;
            case 'sales-pipeline': return <SalesPipelinePage setView={setView} />;
            case 'email': return <EmailPage />;
            default: return <Dashboard setView={setView} />;
        }
    };

    return (
        <div className="app-container grid min-h-screen bg-cnk-bg-light text-cnk-txt-secondary-light md:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_320px]">
            <NotificationContainer />
            <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} executeCommand={executeCommand} setView={setView} />
            <SidebarLeft view={view} setView={setView} isOpen={isLeftSidebarOpen} setIsOpen={setLeftSidebarOpen} />
            
            <div className="flex flex-col flex-grow min-w-0">
                <Header 
                    view={view} 
                    onToggleLeftSidebar={() => setLeftSidebarOpen(true)}
                    onToggleRightSidebar={() => setRightSidebarOpen(true)}
                    setView={setView}
                />
                <main className="main-content flex-grow overflow-y-auto bg-cnk-bg-light p-4 md:p-6">
                    {renderContent()}
                </main>
            </div>

            <SidebarRight setView={setView} isOpen={isRightSidebarOpen} setIsOpen={setRightSidebarOpen} />
            <AIRobotWidget />
        </div>
    );
};

export default App;