

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ViewState } from '@/App';
import { Page } from '@/types';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';

interface Command {
    id: string;
    title: string;
    icon: string;
    subtitle?: string;
    keywords?: string;
    action: () => void;
}

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    executeCommand: (action: () => void) => void;
    setView: (view: ViewState) => void;
}

const CommandPalette = ({ isOpen, onClose, executeCommand, setView }: CommandPaletteProps) => {
    const { t } = useLanguage();
    const { customers, offers, appointments } = useData();
    const { users } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLUListElement>(null);
    
    const allCommands: Command[] = useMemo(() => {
        const navigationCommands: Command[] = [
            { id: 'go_dashboard', title: t('dashboard'), subtitle: 'Navigasyon', icon: 'fa-tachometer-alt', action: () => setView({ page: 'dashboard' }) },
            { id: 'go_customers', title: t('customerList'), subtitle: 'Navigasyon', icon: 'fa-users', keywords: 'müşteri cari', action: () => setView({ page: 'customers' }) },
            { id: 'go_appointments', title: t('appointmentsTitle'), subtitle: 'Navigasyon', icon: 'fa-calendar-check', keywords: 'randevu takvim', action: () => setView({ page: 'appointments' }) },
            { id: 'go_offers', title: t('offerManagement'), subtitle: 'Navigasyon', icon: 'fa-file-invoice-dollar', keywords: 'teklif', action: () => setView({ page: 'teklif-yaz' }) },
            { id: 'go_reports', title: t('reports'), subtitle: 'Navigasyon', icon: 'fa-chart-line', action: () => setView({ page: 'raporlar' }) },
            { id: 'go_profile', title: t('profileTitle'), subtitle: 'Navigasyon', icon: 'fa-user', action: () => setView({ page: 'profile' }) },
        ];

        const actionCommands: Command[] = [
            { id: 'create_offer', title: `${t('createOffer')}`, subtitle: 'Eylem', icon: 'fa-plus', action: () => setView({ page: 'teklif-yaz', id: 'create'}) },
        ];

        const customerCommands: Command[] = customers.map(customer => ({
            id: `customer_${customer.id}`,
            title: customer.name,
            icon: 'fa-user',
            subtitle: 'Müşteri',
            keywords: `müşteri cari ${customer.name}`,
            action: () => setView({ page: 'customers', id: customer.id }),
        }));
    
        const userCommands: Command[] = users.filter(u => u.role !== 'admin').map(user => ({
            id: `user_${user.id}`,
            title: user.name,
            icon: 'fa-user-tie',
            subtitle: 'Personel',
            keywords: `personel kullanıcı ${user.name}`,
            action: () => setView({ page: 'personnel', id: user.id }),
        }));

        const offerCommands: Command[] = offers.map(offer => ({
            id: `offer_${offer.id}`,
            title: `${offer.teklifNo} - ${customers.find(c => c.id === offer.customerId)?.name || ''}`,
            icon: 'fa-file-invoice-dollar',
            subtitle: 'Teklif',
            keywords: `teklif ${offer.teklifNo} ${customers.find(c => c.id === offer.customerId)?.name || ''}`,
            action: () => setView({ page: 'teklif-yaz', id: offer.id }),
        }));
    
        const appointmentCommands: Command[] = appointments.map(app => ({
            id: `appointment_${app.id}`,
            title: app.title,
            icon: 'fa-calendar-check',
            subtitle: 'Randevu',
            keywords: `randevu takvim ${app.title} ${customers.find(c => c.id === app.customerId)?.name || ''}`,
            action: () => setView({ page: 'appointments' }),
        }));

        return [...navigationCommands, ...actionCommands, ...customerCommands, ...userCommands, ...offerCommands, ...appointmentCommands];
    }, [t, setView, customers, users, offers, appointments]);

    const filteredCommands = useMemo(() => {
        if (!searchTerm) return allCommands;
        const lowerSearch = searchTerm.toLowerCase();
        return allCommands.filter(cmd => 
            cmd.title.toLowerCase().includes(lowerSearch) ||
            cmd.keywords?.toLowerCase().includes(lowerSearch)
        );
    }, [searchTerm, allCommands]);
    
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        } else {
            setSearchTerm('');
        }
        setActiveIndex(0);
    }, [isOpen]);

     useEffect(() => {
        if (activeIndex >= 0 && resultsRef.current) {
            const activeItem = resultsRef.current.children[activeIndex] as HTMLLIElement;
            activeItem?.scrollIntoView({ block: 'nearest' });
        }
    }, [activeIndex]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
        } else if (e.key === 'Enter') {
            if (filteredCommands[activeIndex]) {
                executeCommand(filteredCommands[activeIndex].action);
            }
        } else if (e.key === 'Escape') {
            onClose();
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-start justify-center bg-black/50 pt-20" onClick={onClose}>
            <div 
                className="w-full max-w-xl transform rounded-cnk-card bg-cnk-panel-light text-cnk-txt-secondary-light shadow-2xl transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative">
                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-cnk-txt-muted-light"></i>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Komut ara veya sayfaya/kişiye git..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-transparent p-4 pl-10 text-cnk-txt-primary-light focus:outline-none"
                    />
                </div>
                <ul ref={resultsRef} className="max-h-80 overflow-y-auto border-t border-cnk-border-light p-2">
                    {filteredCommands.length > 0 ? (
                        filteredCommands.map((cmd, index) => (
                           <li
                                key={cmd.id}
                                onMouseDown={() => executeCommand(cmd.action)}
                                className={`flex items-center gap-3 p-3 rounded-cnk-element cursor-pointer ${index === activeIndex ? 'bg-cnk-accent-primary/20' : 'hover:bg-cnk-bg-light'}`}
                           >
                                <i className={`fas ${cmd.icon} w-5 text-center text-cnk-txt-muted-light`}></i>
                                <span className="text-cnk-txt-secondary-light">{cmd.title}</span>
                                {cmd.subtitle && <span className="ml-auto text-xs bg-cnk-bg-light px-2 py-1 rounded-md text-cnk-txt-muted-light">{cmd.subtitle}</span>}
                           </li>
                        ))
                    ) : (
                        <li className="p-4 text-center text-cnk-txt-muted-light">Sonuç bulunamadı.</li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default CommandPalette;
