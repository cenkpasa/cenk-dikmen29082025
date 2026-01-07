
import React, { createContext, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { EmailMessage } from '../types';
import { db } from '../services/dbService';
import { v4 as uuidv4 } from 'uuid';
import { useNotificationCenter } from './NotificationCenterContext';

interface EmailContextType {
    emails: EmailMessage[];
    sendEmail: (email: Omit<EmailMessage, 'id' | 'timestamp' | 'folder' | 'isRead'>) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    deleteEmail: (id: string) => Promise<void>;
    unreadCount: number;
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

// Fix: Made children optional to prevent 'Property children is missing' errors in parent components
export const EmailProvider = ({ children }: { children?: ReactNode }) => {
    const { addNotification } = useNotificationCenter();
    
    const emails = useLiveQuery(() => db.emails.orderBy('timestamp').reverse().toArray(), []) || [];
    const unreadCount = useLiveQuery(() => db.emails.where('isRead').equals(0).and(e => e.folder === 'inbox').count(), [], 0);

    // Simüle edilmiş gerçek zamanlı e-posta gelişi
    useEffect(() => {
        const simulateIncomingEmail = async () => {
            const random = Math.random();
            if (random > 0.95) { // %5 şansla yeni mail gelir (test amaçlı yüksek tutuldu)
                const newEmail: EmailMessage = {
                    id: uuidv4(),
                    from: { name: 'Müşteri Temsilcisi', email: 'musteri@client.com' },
                    to: { name: 'Cenk CRM Kullanıcısı', email: 'satis@cnkkesicitakim.com.tr' },
                    subject: 'Yeni Sipariş Talebi ve Teknik Detaylar',
                    body: 'Merhaba, son gönderdiğiniz teklifi inceledik. Birkaç teknik sorumuz olacak...',
                    timestamp: new Date().toISOString(),
                    isRead: false,
                    folder: 'inbox'
                };
                await db.emails.add(newEmail);
                addNotification({
                    messageKey: 'newEmailReceived',
                    replacements: { subject: newEmail.subject },
                    type: 'system',
                    link: { page: 'email' }
                });
            }
        };

        const interval = setInterval(simulateIncomingEmail, 30000); // 30 saniyede bir kontrol
        return () => clearInterval(interval);
    }, [addNotification]);

    const sendEmail = async (emailData: Omit<EmailMessage, 'id' | 'timestamp' | 'folder' | 'isRead'>) => {
        const newEmail: EmailMessage = {
            ...emailData,
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            isRead: true,
            folder: 'sent'
        };
        await db.emails.add(newEmail);
    };

    const markAsRead = async (id: string) => {
        await db.emails.update(id, { isRead: true });
    };

    const deleteEmail = async (id: string) => {
        await db.emails.update(id, { folder: 'trash' });
    };

    return (
        <EmailContext.Provider value={{ emails, sendEmail, markAsRead, deleteEmail, unreadCount }}>
            {children}
        </EmailContext.Provider>
    );
};

export const useEmail = () => {
    const context = useContext(EmailContext);
    if (!context) throw new Error('useEmail must be used within EmailProvider');
    return context;
};
