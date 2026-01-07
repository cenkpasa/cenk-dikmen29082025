
import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { EmailMessage, EmailAccountSettings, Contact } from '../types';
import { db } from '../services/dbService';
import { v4 as uuidv4 } from 'uuid';
import { useNotificationCenter } from './NotificationCenterContext';

interface EmailContextType {
    emails: EmailMessage[];
    contacts: Contact[];
    emailSettings: EmailAccountSettings | undefined;
    sendEmail: (email: Omit<EmailMessage, 'id' | 'timestamp' | 'folder' | 'isRead'>) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    deleteEmail: (id: string) => Promise<void>;
    saveEmailSettings: (settings: EmailAccountSettings) => Promise<void>;
    addContact: (contact: Omit<Contact, 'id' | 'lastContacted'>) => Promise<void>;
    updateContact: (contact: Contact) => Promise<void>;
    deleteContact: (id: string) => Promise<void>;
    unreadCount: number;
    syncEmails: () => Promise<void>;
    isSyncing: boolean;
    lastSync: Date | null;
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

export const EmailProvider = ({ children }: { children?: ReactNode }) => {
    const { addNotification } = useNotificationCenter();
    
    const emails = useLiveQuery(() => db.emails.orderBy('timestamp').reverse().toArray(), []) || [];
    const contacts = useLiveQuery(() => db.contacts.orderBy('name').toArray(), []) || [];
    const emailSettings = useLiveQuery(() => db.emailSettings.get('default'), []);
    const unreadCount = useLiveQuery(() => db.emails.where('isRead').equals(0).and(e => e.folder === 'inbox').count(), [], 0);

    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<Date | null>(null);

    // Otomatik Kişi Ekleme/Güncelleme Fonksiyonu
    const autoAddOrUpdateContact = async (name: string, email: string, source: 'incoming' | 'outgoing') => {
        const existingContact = await db.contacts.where('email').equalsIgnoreCase(email).first();
        const now = new Date().toISOString();

        if (existingContact) {
            await db.contacts.update(existingContact.id, { lastContacted: now });
        } else {
            const newContact: Contact = {
                id: uuidv4(),
                name: name || email.split('@')[0], // Fallback name
                email: email,
                source: source,
                lastContacted: now
            };
            await db.contacts.add(newContact);
        }
    };

    const syncEmails = async () => {
        if (isSyncing) return;
        setIsSyncing(true);

        // Simulate server delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Generate specific mock emails if they don't exist
        const random = Math.random();
        if (random > 0.3) { 
            const newEmails: EmailMessage[] = [
                {
                    id: uuidv4(),
                    from: { name: 'Ali Veli', email: 'ali.veli@metalurji.com' },
                    to: { name: emailSettings?.senderName || 'Satis', email: emailSettings?.emailAddress || 'satis@cnk.com' },
                    subject: 'Sipariş Durumu Hakkında',
                    body: 'Merhaba, geçen hafta verdiğimiz siparişin son durumu nedir? Acil dönüş rica ederim.',
                    timestamp: new Date().toISOString(),
                    isRead: false,
                    folder: 'inbox'
                },
                {
                    id: uuidv4(),
                    from: { name: 'Lojistik Departmanı', email: 'lojistik@kargo.com' },
                    to: { name: 'Depo', email: 'depo@cnk.com' },
                    subject: 'Teslimat Onayı: #CNK-2025-001',
                    body: 'Kargonuz teslim edilmiştir. Teslim alan: Güvenlik.',
                    timestamp: new Date().toISOString(),
                    isRead: false,
                    folder: 'inbox'
                }
            ];
            
            // Pick one randomly
            const emailToAdd = newEmails[Math.floor(Math.random() * newEmails.length)];
            
            // Check duplicate by subject to avoid spamming the same mock
            const exists = await db.emails.where('subject').equals(emailToAdd.subject).first();
            
            if (!exists) {
                await db.emails.add(emailToAdd);
                // Automatically add sender to contacts
                await autoAddOrUpdateContact(emailToAdd.from.name, emailToAdd.from.email, 'incoming');

                addNotification({
                    messageKey: 'newEmailReceived',
                    replacements: { subject: emailToAdd.subject },
                    type: 'system',
                    link: { page: 'email' }
                });
            }
        }

        setLastSync(new Date());
        setIsSyncing(false);
    };

    const sendEmail = async (emailData: Omit<EmailMessage, 'id' | 'timestamp' | 'folder' | 'isRead'>) => {
        const newEmail: EmailMessage = {
            ...emailData,
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            isRead: true,
            folder: 'sent'
        };
        await db.emails.add(newEmail);
        
        // Automatically add recipient to contacts
        // Handle multiple recipients if comma separated (simple split)
        const recipients = emailData.to.email.split(',').map(e => e.trim());
        for (const recipientEmail of recipients) {
             // For simplicity, use the email as name if name is generic, or reuse the 'name' field if single
             const name = recipients.length === 1 ? emailData.to.name : recipientEmail.split('@')[0];
             await autoAddOrUpdateContact(name, recipientEmail, 'outgoing');
        }
    };

    const markAsRead = async (id: string) => {
        await db.emails.update(id, { isRead: true });
    };

    const deleteEmail = async (id: string) => {
        await db.emails.update(id, { folder: 'trash' });
    };

    const saveEmailSettings = async (settings: EmailAccountSettings) => {
        await db.emailSettings.put(settings);
    };

    // --- Contact Management ---
    const addContact = async (contactData: Omit<Contact, 'id' | 'lastContacted'>) => {
        const existing = await db.contacts.where('email').equalsIgnoreCase(contactData.email).first();
        if (existing) throw new Error("Email already exists");

        const newContact: Contact = {
            ...contactData,
            id: uuidv4(),
            lastContacted: undefined
        };
        await db.contacts.add(newContact);
    };

    const updateContact = async (contact: Contact) => {
        await db.contacts.put(contact);
    };

    const deleteContact = async (id: string) => {
        await db.contacts.delete(id);
    };

    return (
        <EmailContext.Provider value={{ 
            emails, 
            contacts, 
            emailSettings, 
            sendEmail, 
            markAsRead, 
            deleteEmail, 
            saveEmailSettings, 
            addContact, 
            updateContact, 
            deleteContact,
            unreadCount, 
            syncEmails, 
            isSyncing, 
            lastSync 
        }}>
            {children}
        </EmailContext.Provider>
    );
};

export const useEmail = () => {
    const context = useContext(EmailContext);
    if (!context) throw new Error('useEmail must be used within EmailProvider');
    return context;
};
