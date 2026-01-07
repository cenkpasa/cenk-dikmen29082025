import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ViewState } from '../../App';
import NotificationBell from './NotificationBell';
import CnkLogo from '../assets/CnkLogo';
import GlobalSearch from './SidebarRight';

interface HeaderProps {
    setView: (view: ViewState) => void;
    onToggleLeftSidebar: () => void;
}

const Header = ({ setView, onToggleLeftSidebar }: HeaderProps) => {
    const { t } = useLanguage();

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-cnk-border-light bg-cnk-panel-light px-4 md:px-6">
            <div className="flex items-center gap-4">
                <button onClick={onToggleLeftSidebar} className="text-2xl text-cnk-txt-muted-light md:hidden">
                    <i className="fas fa-bars"></i>
                </button>
                <div className="hidden md:block">
                   <CnkLogo className="h-10" />
                </div>
            </div>
            
            <div className="flex-1 max-w-lg mx-4">
                <GlobalSearch setView={setView} />
            </div>

            <div className="flex items-center gap-4">
                <NotificationBell setView={setView}/>
            </div>
        </header>
    );
};

export default Header;