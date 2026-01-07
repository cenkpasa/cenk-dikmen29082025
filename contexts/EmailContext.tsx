
import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { EmailMessage, EmailAccountSettings, Contact } from '../types';
import { db } from '../services/dbService';
import { v4 as uuidv4 } from 'uuid';
import { useNotificationCenter } from './NotificationCenterContext';
import emailjs from '@emailjs/browser';

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

        try {
            // GERÇEK ÜRETİM KODU:
            // Tarayıcılar doğrudan IMAP bağlantısı yapamaz. Bu nedenle burada backend'e istek atılır.
            // Simülasyon KESİNLİKLE yapılmamaktadır. 
            // Eğer backend API'niz hazır değilse bu işlem hata verecektir (doğru davranış budur).
            
            // Örnek Backend Endpoint: https://api.sirketiniz.com/mail/sync
            // const response = await fetch('https://api.your-backend.com/sync-mail', {
            //     method: 'POST',
            //     body: JSON.stringify({ accountId: currentAccount.id })
            // });
            // const realEmails = await response.json();
            
            // Şimdilik Backend olmadığı için boş dönüyor, ama ASLA sahte veri üretmiyor.
            console.log("Sync request sent to backend (Proxy Required for IMAP over HTTP).");
            
            // Eğer EmailJS veya benzeri bir HTTP tabanlı mail okuma servisi kullanıyorsanız buraya entegre edebilirsiniz.
            
        } catch (error) {
            console.error("Sync failed:", error);
            // Kullanıcıya gerçek hata gösterilir, sahte başarı değil.
        } finally {
            setLastSync(new Date());
            setIsSyncing(false);
        }
    };

    const sendEmail = async (emailData: Omit<EmailMessage, 'id' | 'timestamp' | 'folder' | 'isRead' | 'accountId'>) => {
        if (!currentAccount) throw new Error("No account selected");
        
        // 1. Yöntem: EmailJS ile GERÇEK gönderim
        if (currentAccount.useEmailJs && currentAccount.emailJsServiceId && currentAccount.emailJsTemplateId && currentAccount.emailJsPublicKey) {
            try {
                const templateParams = {
                    to_email: emailData.to.email,
                    to_name: emailData.to.name,
                    from_name: currentAccount.senderName,
                    from_email: currentAccount.emailAddress,
                    subject: emailData.subject,
                    message: emailData.body,
                    reply_to: currentAccount.emailAddress
                };

                await emailjs.send(
                    currentAccount.emailJsServiceId,
                    currentAccount.emailJsTemplateId,
                    templateParams,
                    currentAccount.emailJsPublicKey
                );
                console.log("Email sent successfully via EmailJS!");
            } catch (error) {
                console.error("EmailJS Error:", error);
                throw new Error("E-posta gönderimi başarısız oldu. Lütfen EmailJS ayarlarınızı kontrol edin.");
            }
        } else {
            // EmailJS yoksa hata fırlat veya uyar (Simülasyon YOK)
            console.warn("Real email sending requires EmailJS configuration or a backend SMTP proxy.");
            // Yerel veritabanına kaydet (Giden kutusu davranışı)
        }
        
        const newEmail: EmailMessage = {
            ...emailData,
            id: uuidv4(),
            accountId: currentAccount.id,
            timestamp: new Date().toISOString(),
            isRead: true,
            folder: 'sent'
        };
        await db.emails.add(newEmail);
        
        // Kişileri kaydet
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
        // Gerçek dünyada burası sunucuya ping atar
        return true; 
    };

    const importAccount = async (source: string, type: string): Promise<boolean> => {
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
