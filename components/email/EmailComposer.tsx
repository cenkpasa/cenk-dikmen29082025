
import React, { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { useEmail } from '../../contexts/EmailContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { enhanceEmailBody } from '../../services/aiService';

const EmailComposer = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const { t } = useLanguage();
    const { sendEmail } = useEmail();
    const { showNotification } = useNotification();
    
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);

    const handleSend = async () => {
        if (!to || !subject || !body) {
            showNotification('fieldsRequired', 'error');
            return;
        }
        await sendEmail({
            from: { name: 'Cenk CRM Kullanıcısı', email: 'satis@cnkkesicitakim.com.tr' },
            to: { name: to, email: to },
            subject,
            body
        });
        // Fix: Changed notification key to 'sentStatus' to match renamed constant
        showNotification('sentStatus', 'success');
        onClose();
    };

    const handleAiEnhance = async () => {
        if (!body) return;
        setIsAiLoading(true);
        const result = await enhanceEmailBody(body);
        if (result.success) {
            setBody(result.text);
            showNotification('descriptionEnhanced', 'success');
        } else {
            showNotification('aiError', 'error');
        }
        setIsAiLoading(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('createEmail')} size="3xl">
            <div className="space-y-4">
                <Input label={t('recipient')} placeholder="ornek@firma.com" value={to} onChange={e => setTo(e.target.value)} />
                <Input label={t('subject')} placeholder="Konu başlığı..." value={subject} onChange={e => setSubject(e.target.value)} />
                <div className="relative">
                    <label className="block text-sm font-semibold mb-2">{t('message')}</label>
                    <textarea
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        rows={12}
                        className="w-full p-3 border rounded-lg bg-slate-50 focus:ring-2 focus:ring-cnk-accent-primary focus:outline-none transition-all"
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
    );
};

export default EmailComposer;
