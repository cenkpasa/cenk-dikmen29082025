import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Page } from '@/types';
import { ViewState } from '@/App';
import CnkLogo from '@/components/assets/CnkLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

interface NavLink {
    page: Page;
    labelKey: string;
    icon: string;
    subLinks?: NavLink[];
    adminOnly?: boolean;
}

const NAV_LINKS: NavLink[] = [
    { page: 'dashboard', labelKey: 'dashboard', icon: 'fas fa-tachometer-alt' },
    {
        page: 'customers', labelKey: 'crm', icon: 'fas fa-users', subLinks: [
            { page: 'customers', labelKey: 'customerList', icon: 'fas fa-users' },
            { page: 'appointments', labelKey: 'appointmentsTitle', icon: 'fas fa-calendar-alt' },
            { page: 'gorusme-formu', labelKey: 'interviewForms', icon: 'fas fa-file-signature' },
            { page: 'teklif-yaz', labelKey: 'offerManagement', icon: 'fas fa-file-invoice-dollar' },
            { page: 'sales-pipeline', labelKey: 'salesPipeline', icon: 'fas fa-stream' },
        ]
    },
    { page: 'email', labelKey: 'email', icon: 'fas fa-envelope' },
    {
        page: 'personnel', labelKey: 'personnel', icon: 'fas fa-user-friends', adminOnly: true, subLinks: [
            { page: 'personnel', labelKey: 'personnelManagement', icon: 'fas fa-user-cog' },
            { page: 'konum-takip', labelKey: 'locationTracking', icon: 'fas fa-map-marker-alt' },
        ]
    },
    { page: 'hesaplama-araclari', labelKey: 'calculationTools', icon: 'fas fa-calculator' },
    { page: 'yapay-zeka', labelKey: 'aiHub', icon: 'fas fa-robot' },
    {
        page: 'erp-entegrasyonu', labelKey: 'settings', icon: 'fas fa-cogs', adminOnly: true, subLinks: [
            { page: 'erp-entegrasyonu', labelKey: 'erpIntegration', icon: 'fas fa-exchange-alt' },
            { page: 'ai-ayarlari', labelKey: 'aiSettings', icon: 'fas fa-magic' },
            { page: 'raporlar', labelKey: 'reports', icon: 'fas fa-chart-bar' },
            { page: 'email-taslaklari', labelKey: 'emailDrafts', icon: 'fas fa-envelope-open-text' },
            { page: 'mutabakat', labelKey: 'reconciliation', icon: 'fas fa-handshake' },
            { page: 'audit-log', labelKey: 'auditLog', icon: 'fas fa-history' },
        ]
    },
];

interface SidebarLeftProps {
    view: ViewState;
    setView: (view: ViewState) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const SidebarLeft = ({ view, setView, isOpen, setIsOpen }: SidebarLeftProps) => {
    const { t } = useLanguage();
    const { currentUser } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [openSubMenus, setOpenSubMenus] = useState<string[]>([]);

    const handleLinkClick = (page: Page) => {
        setView({ page });
        if (window.innerWidth < 768) {
            setIsOpen(false);
        }
    };
    
    const toggleSubMenu = (page: Page) => {
        setOpenSubMenus(prev => prev.includes(page) ? prev.filter(p => p !== page) : [...prev, page]);
    };

    return (
        <>
            <div 
                className={`fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            ></div>
            <nav className={`fixed top-0 left-0 z-50 flex h-full w-64 flex-col bg-cnk-sidebar-dark text-cnk-sidebar-txt-dark transition-transform duration-300 md:relative md:transform-none ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-center gap-4 p-5" onClick={() => setView({ page: 'dashboard' })}>
                    <CnkLogo className="h-12 cursor-pointer" />
                </div>
                <ul className="flex-grow space-y-1 p-2 overflow-y-auto">
                    {NAV_LINKS.filter(link => !link.adminOnly || currentUser?.role === 'admin').map(link => (
                        <li key={link.page}>
                           {link.subLinks ? (
                                <>
                                    <button
                                        onClick={() => toggleSubMenu(link.page)}
                                        className="relative flex w-full items-center justify-between rounded-cnk-element px-3 py-2.5 text-sm font-medium hover:bg-cnk-accent-primary/10"
                                    >
                                        <div className="flex items-center gap-3">
                                            <i className={`${link.icon} w-5 text-center text-lg`}></i>
                                            <span>{t(link.labelKey)}</span>
                                        </div>
                                        <i className={`fas fa-chevron-down text-xs transition-transform ${openSubMenus.includes(link.page) ? 'rotate-180' : ''}`}></i>
                                    </button>
                                    <ul className={`overflow-hidden transition-all duration-300 ${openSubMenus.includes(link.page) ? 'max-h-96' : 'max-h-0'}`}>
                                        {link.subLinks.map(sub => (
                                            <li key={sub.page}>
                                                <a href="#" onClick={(e) => { e.preventDefault(); handleLinkClick(sub.page); }} className={`flex items-center gap-3 rounded-md px-3 py-2 pl-11 text-sm ${view.page === sub.page ? 'font-semibold text-white' : 'hover:bg-cnk-accent-primary/10'}`}>{t(sub.labelKey)}</a>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                           ) : (
                                <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); handleLinkClick(link.page); }}
                                    className={`relative flex items-center justify-between rounded-cnk-element px-3 py-2.5 text-sm font-medium ${view.page === link.page ? 'bg-cnk-accent-primary text-white shadow-md' : 'hover:bg-cnk-accent-primary/10'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <i className={`${link.icon} w-5 text-center text-lg`}></i>
                                        <span>{t(link.labelKey)}</span>
                                    </div>
                                </a>
                           )}
                        </li>
                    ))}
                </ul>
                <div className="mt-auto border-t border-slate-700 p-4 space-y-2">
                    <button
                        onClick={() => setView({ page: 'profile' })}
                        className="w-full flex items-center gap-3 rounded-cnk-element p-2 text-sm text-cnk-sidebar-txt-dark hover:bg-slate-700"
                    >
                         <img src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${currentUser?.name}&background=random`} alt="Avatar" className="w-8 h-8 rounded-full object-cover"/>
                         <span className="font-semibold">{currentUser?.name}</span>
                    </button>
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between rounded-cnk-element border border-slate-600 bg-slate-700/50 p-2 text-sm text-white"
                        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    >
                        <span>{theme === 'light' ? 'Açık Tema' : 'Koyu Tema'}</span>
                        <i className={`fas ${theme === 'light' ? 'fa-sun text-amber-400' : 'fa-moon text-indigo-300'}`}></i>
                    </button>
                </div>
            </nav>
        </>
    );
};

export default SidebarLeft;
