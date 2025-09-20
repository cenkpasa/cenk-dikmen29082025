
import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import SidebarLeft from '@/components/layout/SidebarLeft';
import Header from '@/components/layout/Header';
import { useSettings } from '@/contexts/SettingsContext';
import { runAIAgent } from '@/services/aiAgentService';
import { useNotificationCenter } from '@/contexts/NotificationCenterContext';
import Loader from '@/components/common/Loader';
import { Page as PageType } from '@/types';
import CommandPalette from '@/components/common/CommandPalette';
import { syncService } from '@/services/syncService';
import SidebarRight from '@/components/layout/SidebarRight';

// Lazy load all pages for code-splitting
const LoginPage = React.lazy(() => import('@/pages/LoginPage'));
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const Customers = React.lazy(() => import('@/pages/Customers'));
const Appointments = React.lazy(() => import('@/pages/Appointments'));
const InterviewFormPage = React.lazy(() => import('@/pages/InterviewFormPage'));
const OfferPage = React.lazy(() => import('@/pages/OfferPage'));
const SalesPipelinePage = React.lazy(() => import('@/pages/SalesPipelinePage'));
const Users = React.lazy(() => import('@/pages/Users'));
const CalculationToolsPage = React.lazy(() => import('@/pages/CalculationToolsPage'));
const Profile = React.lazy(() => import('@/pages/Profile'));
const EmailPage = React.lazy(() => import('@/pages/EmailPage'));
const AIHubPage = React.lazy(() => import('@/pages/AIHubPage'));
const LocationTrackingPage = React.lazy(() => import('@/pages/LocationTrackingPage'));
const ErpIntegrationPage = React.lazy(() => import('@/pages/ErpIntegrationPage'));
const AISettingsPage = React.lazy(() => import('@/pages/AISettingsPage'));
const ReportPage = React.lazy(() => import('@/pages/ReportPage'));
const EmailDraftsPage = React.lazy(() => import('@/pages/EmailDraftsPage'));
const ReconciliationPage = React.lazy(() => import('@/pages/ReconciliationPage'));
const AuditLogPage = React.lazy(() => import('@/pages/AuditLogPage'));


export type ViewState = {
    page: PageType;
    id?: string;
};

const PageContent = ({ view, setView }: { view: ViewState; setView: (view: ViewState) => void; }) => {
    switch (view.page) {
        case 'dashboard': return <Dashboard setView={setView} />;
        case 'customers': return <Customers setView={setView} view={view} />;
        case 'email': return <EmailPage />;
        case 'appointments': return <Appointments />;
        case 'gorusme-formu': return <InterviewFormPage setView={setView} view={view} />;
        case 'teklif-yaz': return <OfferPage setView={setView} view={view} />;
        case 'sales-pipeline': return <SalesPipelinePage setView={setView} />;
        case 'personnel': return <Users view={view} />;
        case 'konum-takip': return <LocationTrackingPage />;
        case 'hesaplama-araclari': return <CalculationToolsPage />;
        case 'yapay-zeka': return <AIHubPage />;
        case 'erp-entegrasyonu': return <ErpIntegrationPage />;
        case 'profile': return <Profile />;
        case 'ai-ayarlari': return <AISettingsPage />;
        case 'raporlar': return <ReportPage />;
        case 'email-taslaklari': return <EmailDraftsPage setView={setView} />;
        case 'mutabakat': return <ReconciliationPage />;
        case 'audit-log': return <AuditLogPage />;
        default: return <Dashboard setView={setView} />;
    }
};

const App = () => {
    const { currentUser, loading } = useAuth();
    const { NotificationContainer } = useNotification();
    const [view, setView] = useState<ViewState>({ page: 'dashboard' });
    const [isLeftSidebarOpen, setLeftSidebarOpen] = useState(false);
    const [isRightSidebarOpen, setRightSidebarOpen] = useState(false);
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);

    const { settings } = useSettings();
    const { addNotification } = useNotificationCenter();

    useEffect(() => {
        const initializeAIAgent = async () => {
            if (settings) {
                const insights = await runAIAgent(settings);
                await Promise.all(
                    insights.map(insight => addNotification(insight))
                );
            }
        };
        const timer = setTimeout(initializeAIAgent, 3000);
        return () => clearTimeout(timer);
    }, [settings, addNotification]);
    
    useEffect(() => {
        if (!currentUser) {
            setLeftSidebarOpen(false);
        }
    }, [currentUser]);

    // Command Palette Listener
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
                event.preventDefault();
                setIsPaletteOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Offline/Online Sync Listener
    useEffect(() => {
        const handleOnline = () => {
            console.log("Bağlantı kuruldu. Bekleyen işlemler senkronize ediliyor...");
            syncService.processSyncQueue();
        };
        window.addEventListener('online', handleOnline);
        // Initial check in case we load the page while online
        if (navigator.onLine) {
            handleOnline();
        }
        return () => {
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    const executeCommand = useCallback((action: () => void) => {
        action();
        setIsPaletteOpen(false);
    }, []);

    if (loading) {
        return <Loader fullScreen={true} />;
    }

    if (!currentUser) {
        return (
            <>
                <NotificationContainer />
                <Suspense fallback={<Loader fullScreen={true} />}>
                    <LoginPage />
                </Suspense>
            </>
        );
    }
    
    return (
        <div className="app-container grid min-h-screen bg-cnk-bg-light text-cnk-txt-secondary-light md:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_320px]">
            <NotificationContainer />
            <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} executeCommand={executeCommand} setView={setView} />
            
            <SidebarLeft view={view} setView={setView} isOpen={isLeftSidebarOpen} setIsOpen={setLeftSidebarOpen} />
            
            <div className="flex flex-col flex-grow min-w-0">
                <Header 
                    view={view} 
                    onToggleLeftSidebar={() => setLeftSidebarOpen(true)}
                    onToggleRightSidebar={() => setRightSidebarOpen(true)}
                    setView={setView}
                />
                <main className="main-content flex-grow overflow-y-auto bg-cnk-bg-light p-4 md:p-6">
                     <div id="page-content" className="min-h-[calc(100vh-120px)]">
                        <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-120px)]"><Loader /></div>}>
                            <PageContent view={view} setView={setView} />
                        </Suspense>
                    </div>
                </main>
            </div>
            
            <SidebarRight setView={setView} isOpen={isRightSidebarOpen} setIsOpen={setRightSidebarOpen} />
        </div>
    );
};

export default App;
