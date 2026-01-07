
import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { useEmail } from '../../contexts/EmailContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { enhanceEmailBody } from '../../services/aiService';
import ContactListModal from './ContactListModal';

interface EmailComposerProps {
    isOpen: boolean;
    onClose: () => void;
    initialRecipients?: string[];
}

const EmailComposer = ({ isOpen, onClose, initialRecipients = [] }: EmailComposerProps) => {
    const { t } = useLanguage();
    const { sendEmail, emailSettings } = useEmail();
    const { showNotification } = useNotification();
    
    const [to, setTo] = useState(initialRecipients.join(', '));
    const [cc, setCc] = useState('');
    const [bcc, setBcc] = useState('');
    const [showCcBcc, setShowCcBcc] = useState(false);
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    
    // Address Book Modal State
    const [isAddressBookOpen, setIsAddressBookOpen] = useState(false);

    useEffect(() => {
        if (emailSettings?.signature) {
            setBody(prev => prev ? prev : emailSettings.signature!);
        }
    }, [emailSettings]);

    // Update 'to' field if initialRecipients changes (e.g. reopening with data)
    useEffect(() => {
        if(initialRecipients.length > 0) {
            setTo(initialRecipients.join(', '));
        }
    }, [initialRecipients]);

    const handleSend = async () => {
        if (!to || !subject || !body) {
            showNotification('fieldsRequired', 'error');
            return;
        }
        
        // Handle Multiple Recipients logic
        // If there are multiple emails in 'To', backend logic usually handles looping.
        // In our EmailContext simulation, we split by comma.
        
        await sendEmail({
            from: { name: emailSettings?.senderName || 'Cenk CRM', email: emailSettings?.emailAddress || 'satis@cnkkesicitakim.com.tr' },
            to: { name: to, email: to }, // The context will parse comma separated emails
            cc: cc ? cc.split(',').map(e => e.trim()) : [],
            bcc: bcc ? bcc.split(',').map(e => e.trim()) : [],
            subject,
            body
        });
        showNotification('sentStatus', 'success');
        onClose();
    };

    const handleAiEnhance = async () => {
        if (!body) return;
        setIsAiLoading(true);
        // Temporarily remove signature to enhance only body text
        const signature = emailSettings?.signature || '';
        const bodyContent = body.replace(signature, '').trim();
        
        const result = await enhanceEmailBody(bodyContent);
        if (result.success) {
            setBody(`${result.text}\n${signature}`);
            showNotification('descriptionEnhanced', 'success');
        } else {
            showNotification('aiError', 'error');
        }
        setIsAiLoading(false);
    };

    const handleAddressBookSelect = (emails: string[]) => {
        const currentRecipients = to ? to.split(',').map(e => e.trim()).filter(e => e) : [];
        // Add new emails avoiding duplicates
        const uniqueRecipients = Array.from(new Set([...currentRecipients, ...emails]));
        setTo(uniqueRecipients.join(', '));
        setIsAddressBookOpen(false);
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={t('createEmail')} size="3xl">
                <div className="space-y-4">
                    <div className="relative flex items-end gap-2">
                        <div className="flex-grow">
                            <Input 
                                label={t('recipient')} 
                                placeholder="ornek@firma.com, diger@firma.com" 
                                value={to} 
                                onChange={e => setTo(e.target.value)} 
                                containerClassName="!mb-0" 
                            />
                        </div>
                        <Button variant="secondary" onClick={() => setIsAddressBookOpen(true)} icon="fas fa-address-book" title={t('addressBook')} className="mb-[2px]"/>
                        
                        <button 
                            onClick={() => setShowCcBcc(!showCcBcc)}
                            className="absolute right-14 top-0 text-xs text-cnk-accent-primary hover:underline font-medium"
                        >
                            {showCcBcc ? t('hideCcBcc') : t('showCcBcc')}
                        </button>
                    </div>
                    
                    {showCcBcc && (
                        <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                            <Input label="CC" placeholder="cc@firma.com" value={cc} onChange={e => setCc(e.target.value)} />
                            <Input label="BCC" placeholder="bcc@firma.com" value={bcc} onChange={e => setBcc(e.target.value)} />
                        </div>
                    )}

                    <Input label={t('subject')} placeholder="Konu başlığı..." value={subject} onChange={e => setSubject(e.target.value)} />
                    
                    <div className="relative">
                        <label className="block text-sm font-semibold mb-2">{t('message')}</label>
                        <textarea
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            rows={15}
                            className="w-full p-3 border rounded-lg bg-slate-50 focus:ring-2 focus:ring-cnk-accent-primary focus:outline-none transition-all font-sans"
                        />
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={handleAiEnhance}
                            isLoading={isAiLoading}
                            className="absolute bottom-4 right-4 shadow-md bg-white hover:bg-slate-100"
                            icon="fas fa-robot"
                        >
                            AI ile Düzenle
                        </Button>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                        <Button onClick={handleSend} icon="fas fa-paper-plane" className="px-8">{t('send')}</Button>
                    </div>
                </div>
            </Modal>
            
            {isAddressBookOpen && (
                <ContactListModal 
                    isOpen={isAddressBookOpen} 
                    onClose={() => setIsAddressBookOpen(false)} 
                    onSelect={handleAddressBookSelect}
                />
            )}
        </>
    );
};

export default EmailComposer;
