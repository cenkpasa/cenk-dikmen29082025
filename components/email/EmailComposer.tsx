import React, { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { useEmail } from '../../contexts/EmailContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { enhanceEmailBody } from '../../services/aiService';
import ContactListModal from './ContactListModal';
import { Attachment } from '../../types';
import { v4 as uuidv4 } from 'uuid';

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
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isAddressBookOpen, setIsAddressBookOpen] = useState(false);

    useEffect(() => {
        if (emailSettings?.signature) {
            setBody(prev => prev ? prev : emailSettings.signature!);
        }
    }, [emailSettings]);

    useEffect(() => {
        if(initialRecipients.length > 0) {
            setTo(initialRecipients.join(', '));
        }
    }, [initialRecipients]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newAttachments: Attachment[] = Array.from(e.target.files).map((file: File) => ({
                id: uuidv4(),
                name: file.name,
                size: file.size,
                type: file.type,
                // In a real app, we would read content here. 
                // For "unlimited" simulation, we don't read huge files to memory to avoid crash.
                isSimulated: file.size > 5 * 1024 * 1024 // Mark files > 5MB as simulated/metadata only
            }));
            setAttachments(prev => [...prev, ...newAttachments]);
        }
    };

    const removeAttachment = (id: string) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    const handleSend = async () => {
        if (!to || !subject || !body) {
            showNotification('fieldsRequired', 'error');
            return;
        }
        
        await sendEmail({
            from: { name: emailSettings?.senderName || 'Cenk CRM', email: emailSettings?.emailAddress || 'satis@cnkkesicitakim.com.tr' },
            to: { name: to, email: to },
            cc: cc ? cc.split(',').map(e => e.trim()) : [],
            bcc: bcc ? bcc.split(',').map(e => e.trim()) : [],
            subject,
            body,
            attachments
        });
        showNotification('sentStatus', 'success');
        onClose();
    };

    const handleAiEnhance = async () => {
        if (!body) return;
        setIsAiLoading(true);
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
        const uniqueRecipients = Array.from(new Set([...currentRecipients, ...emails]));
        setTo(uniqueRecipients.join(', '));
        setIsAddressBookOpen(false);
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

                    {/* Attachment Section */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <input 
                                type="file" 
                                multiple 
                                ref={fileInputRef} 
                                className="hidden" 
                                onChange={handleFileChange} 
                            />
                            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} icon="fas fa-paperclip">
                                {t('addAttachment')}
                            </Button>
                            <span className="text-xs text-cnk-txt-muted-light">{t('unlimitedSize')}</span>
                        </div>
                        {attachments.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                {attachments.map(att => (
                                    <div key={att.id} className="flex items-center justify-between p-2 bg-cnk-bg-light rounded border border-cnk-border-light text-sm">
                                        <div className="flex items-center gap-2 truncate">
                                            <i className="fas fa-file text-cnk-txt-secondary-light"></i>
                                            <span className="truncate">{att.name}</span>
                                            <span className="text-xs text-cnk-txt-muted-light whitespace-nowrap">({formatSize(att.size)})</span>
                                        </div>
                                        <button onClick={() => removeAttachment(att.id)} className="text-red-500 hover:text-red-700 ml-2">
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
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