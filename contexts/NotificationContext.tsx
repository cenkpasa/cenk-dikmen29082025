
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Notification {
    id: number;
    messageKey: string;
    type: 'success' | 'error' | 'warning' | 'info';
    replacements?: Record<string, string>;
}

interface NotificationContextType {
    showNotification: (messageKey: string, type?: Notification['type'], replacements?: Record<string, string>) => void;
    NotificationContainer: () => React.JSX.Element;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationComponentProps {
    notification: Notification;
    onDismiss: (id: number) => void;
}

const NotificationComponent = ({ notification, onDismiss }: NotificationComponentProps) => {
    const { t } = useLanguage();
    const message = t(notification.messageKey, notification.replacements);
    const title = t(notification.type);

    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(notification.id);
        }, 3000);
        return () => clearTimeout(timer);
    }, [notification.id, onDismiss]);

    const typeClasses = {
        success: 'bg-green-500/10 border-green-500/30 text-green-800',
        error: 'bg-red-500/10 border-red-500/30 text-red-800',
        warning: 'bg-amber-500/10 border-amber-500/30 text-amber-800',
        info: 'bg-blue-500/10 border-blue-500/30 text-blue-800',
    };
    const iconClasses = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle',
    };

    return (
        <div className={`notification relative flex w-full max-w-sm animate-slideInRight items-start gap-4 overflow-hidden rounded-lg p-4 shadow-lg border ${typeClasses[notification.type]}`}>
            <div className="icon text-2xl mt-1">
                <i className={`fas ${iconClasses[notification.type]}`}></i>
            </div>
            <div className="message flex-grow">
                <p className="font-bold text-sm">{title}</p>
                <p className="text-sm">{message}</p>
            </div>
            <button onClick={() => onDismiss(notification.id)} className="absolute top-2 right-2 text-current opacity-60 hover:opacity-100">
                <i className="fas fa-times text-sm"></i>
            </button>
        </div>
    );
};


interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const showNotification = useCallback((messageKey: string, type: Notification['type'] = 'info', replacements: Record<string, string> = {}) => {
        const newNotification: Notification = {
            id: Date.now(),
            messageKey,
            type,
            replacements
        };
        setNotifications(prev => [...prev, newNotification]);
    }, []);

    const dismissNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const NotificationContainer = () => (
        <div id="notification-container" className="fixed top-5 right-5 z-[10001] flex flex-col gap-3">
            {notifications.map(n => (
                <NotificationComponent key={n.id} notification={n} onDismiss={dismissNotification} />
            ))}
        </div>
    );

    return (
        <NotificationContext.Provider value={{ showNotification, NotificationContainer }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
