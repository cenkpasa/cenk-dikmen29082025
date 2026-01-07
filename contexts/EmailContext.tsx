
import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { EmailMessage, EmailAccountSettings, Contact } from '../types';
import { db, generateMassiveHistory } from '../services/dbService';
import { v4 as uuidv4 } from 'uuid';
import { useNotificationCenter } from './NotificationCenterContext';

interface EmailContextType {
    emails: EmailMessage[];
    contacts: Contact[];
    accounts: EmailAccountSettings[];
    currentAccount: EmailAccountSettings | undefined;
    setCurrentAccountId: (id: string) => void;
    
    sendEmail: (email: Omit<EmailMessage, 'id' | 'timestamp' | 'folder' | 'isRead' | 'accountId'>) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    deleteEmail: (id: string) => Promise<void>;
    
    addAccount: (settings: Omit<EmailAccountSettings, 'id' | 'status'>) => Promise<void>;
    updateAccount: (settings: EmailAccountSettings) => Promise<void>;
    deleteAccount: (id: string) => Promise<void>;
    repairAccount: (id: string) => Promise<boolean>;
    importAccount: (source: string, type: string) => Promise<boolean>;

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
    const [currentAccountId, setCurrentAccountId] = useState<string>('');
    
    const accounts = useLiveQuery(() => db.emailSettings.toArray(), []) || [];
    
    // Select first account as default if none selected
    useEffect(() => {
        if (!currentAccountId && accounts.length > 0) {
            setCurrentAccountId(accounts[0].id);
        }
    }, [accounts, currentAccountId]);

    const currentAccount = accounts.find(a => a.id === currentAccountId);

    const emails = useLiveQuery(() => {
        if (!currentAccountId) return [];
        return db.emails
            .where('accountId').equals(currentAccountId)
            .reverse()
            .sortBy('timestamp');
    }, [currentAccountId]) || [];

    const contacts = useLiveQuery(() => db.contacts.orderBy('name').toArray(), []) || [];
    
    const unreadCount = useLiveQuery(() => {
        if (!currentAccountId) return 0;
        return db.emails.where({ accountId: currentAccountId, folder: 'inbox', isRead: 0 }).count();
    }, [currentAccountId]) || 0;

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
        if (isSyncing || !currentAccount) return;
        setIsSyncing(true);

        // Simulate server connection and massive download
        await new Promise(resolve => setTimeout(resolve, 2500));

        // 1. Check if we need to hydrate massive history (first sync simulation for this account)
        const count = await db.emails.where('accountId').equals(currentAccountId).count();
        if (count < 50) {
            console.log(`Downloading massive email history for account ${currentAccount.accountName}...`);
            const massiveHistory = generateMassiveHistory(currentAccountId);
            await db.emails.bulkAdd(massiveHistory);
            
            addNotification({
                messageKey: 'syncComplete',
                replacements: { count: String(massiveHistory.length) },
                type: 'system'
            });
        }

        // 2. Simulate receiving a new "live" email occasionally
        const random = Math.random();
        if (random > 0.3) { 
            const newEmails: EmailMessage[] = [
                {
                    id: uuidv4(),
                    accountId: currentAccountId,
                    from: { name: 'Ali Veli', email: 'ali.veli@metalurji.com' },
                    to: { name: currentAccount.senderName, email: currentAccount.emailAddress },
                    subject: 'Sipariş Durumu Hakkında',
                    body: 'Merhaba, geçen hafta verdiğimiz siparişin son durumu nedir? Acil dönüş rica ederim.',
                    timestamp: new Date().toISOString(),
                    isRead: false,
                    folder: 'inbox',
                    attachments: []
                },
                {
                    id: uuidv4(),
                    accountId: currentAccountId,
                    from: { name: 'Lojistik Departmanı', email: 'lojistik@kargo.com' },
                    to: { name: currentAccount.senderName, email: currentAccount.emailAddress },
                    subject: 'Teslimat Onayı: #CNK-2025-001',
                    body: 'Kargonuz teslim edilmiştir. Teslim alan: Güvenlik.',
                    timestamp: new Date().toISOString(),
                    isRead: false,
                    folder: 'inbox',
                    attachments: [{
                        id: uuidv4(),
                        name: 'Teslim_Tutanagi.pdf',
                        size: 1024 * 500, // 500KB
                        type: 'application/pdf',
                        isSimulated: true
                    }]
                }
            ];
            
            // Pick one randomly
            const emailToAdd = newEmails[Math.floor(Math.random() * newEmails.length)];
            
            // Check duplicate by subject to avoid spamming the same mock
            const exists = await db.emails.where({ accountId: currentAccountId, subject: emailToAdd.subject }).first();
            
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

    const sendEmail = async (emailData: Omit<EmailMessage, 'id' | 'timestamp' | 'folder' | 'isRead' | 'accountId'>) => {
        if (!currentAccount) throw new Error("No account selected");
        
        const newEmail: EmailMessage = {
            ...emailData,
            id: uuidv4(),
            accountId: currentAccount.id,
            timestamp: new Date().toISOString(),
            isRead: true,
            folder: 'sent'
        };
        await db.emails.add(newEmail);
        
        // Automatically add recipient to contacts
        const recipients = emailData.to.email.split(',').map(e => e.trim());
        for (const recipientEmail of recipients) {
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

    // --- Account Management ---
    const addAccount = async (settings: Omit<EmailAccountSettings, 'id' | 'status'>) => {
        const newAccount: EmailAccountSettings = {
            ...settings,
            id: uuidv4(),
            status: 'active'
        };
        await db.emailSettings.add(newAccount);
        setCurrentAccountId(newAccount.id);
        // Trigger initial hydration for this new account
        setTimeout(() => syncEmails(), 500); 
    };

    const updateAccount = async (settings: EmailAccountSettings) => {
        await db.emailSettings.put(settings);
    };

    const deleteAccount = async (id: string) => {
        await db.emails.where('accountId').equals(id).delete();
        await db.emailSettings.delete(id);
        if (currentAccountId === id) {
            const remaining = accounts.find(a => a.id !== id);
            setCurrentAccountId(remaining ? remaining.id : '');
        }
    };

    const repairAccount = async (id: string): Promise<boolean> => {
        // Simulation of repair process
        await new Promise(resolve => setTimeout(resolve, 3000));
        await db.emailSettings.update(id, { status: 'active' });
        return true;
    };

    const importAccount = async (source: string, type: string): Promise<boolean> => {
        // Simulation of import process (e.g. from PST or another service)
        await new Promise(resolve => setTimeout(resolve, 5000));
        return true;
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
            accounts,
            currentAccount,
            setCurrentAccountId,
            sendEmail, 
            markAsRead, 
            deleteEmail, 
            addAccount, 
            updateAccount, 
            deleteAccount,
            repairAccount,
            importAccount,
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
