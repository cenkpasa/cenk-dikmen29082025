import React from 'react';
import { ViewState } from '@/App';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import CnkLogo from '@/components/assets/CnkLogo';
import NotificationBell from './NotificationBell';

interface HeaderProps {
    view: ViewState;
    setView: (view: ViewState) => void;
    onToggleLeftSidebar: () => void;
    onToggleRightSidebar: () => void;
}

const UserMenu = () => {
    const { currentUser, logout } = useAuth();
    const [isOpen, setIsOpen] = React.useState(false);

    if (!currentUser) return null;

    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2">
                <img src={currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.name}&background=random`} alt="Avatar" className="w-8 h-8 rounded-full object-cover"/>
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-cnk-panel-light rounded-md shadow-lg border border-cnk-border-light z-10">
                    <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-cnk-txt-secondary-light hover:bg-cnk-bg-light">Çıkış Yap</button>
                </div>
            )}
        </div>
    );
};

const Header = ({ view, setView, onToggleLeftSidebar, onToggleRightSidebar }: HeaderProps) => {
    const { t } = useLanguage();
    
    const getPageTitle = () => {
        // A simple title mapping; could be more sophisticated
        const key = Object.keys(t).find(k => k.toLowerCase().includes(view.page.toLowerCase())) || view.page;
        return t(key);
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-cnk-border-light bg-cnk-panel-light px-4 md:px-6">
            <div className="flex items-center gap-4 md:hidden">
                <button onClick={onToggleLeftSidebar} className="text-2xl text-cnk-txt-muted-light">
                    <i className="fas fa-bars"></i>
                </button>
                 <CnkLogo className="h-8"/>
            </div>
            
            <div className="hidden md:block">
                 <h1 className="text-xl font-bold text-cnk-txt-primary-light">{getPageTitle()}</h1>
            </div>

            <div className="flex items-center gap-4">
                <NotificationBell setView={setView} />
                <UserMenu />
                <button onClick={onToggleRightSidebar} className="text-2xl text-cnk-txt-muted-light xl:hidden">
                     <i className="fas fa-ellipsis-v"></i>
                </button>
            </div>
        </header>
    );
};

export default Header;
