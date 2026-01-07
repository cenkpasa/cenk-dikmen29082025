
import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { useLanguage } from '../../contexts/LanguageContext';
import { useEmail } from '../../contexts/EmailContext';
import { EmailAccountSettings } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';

interface EmailSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const EmailSettingsModal = ({ isOpen, onClose }: EmailSettingsModalProps) => {
    const { t } = useLanguage();
    const { emailSettings, saveEmailSettings } = useEmail();
    const { showNotification } = useNotification();
    const [isTesting, setIsTesting] = useState(false);

    const [formData, setFormData] = useState<EmailAccountSettings>({
        id: 'default',
        emailAddress: '',
        senderName: '',
        signature: '',
        imapHost: '',
        imapPort: 993,
        imapUser: '',
        imapPass: '',
        imapSecurity: 'ssl',
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPass: '',
        smtpSecurity: 'tls'
    });

    useEffect(() => {
        if (emailSettings) {
            setFormData(emailSettings);
        }
    }, [emailSettings, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: e.target.type === 'number' ? parseInt(value) : value
        }));
    };

    const handleSave = async () => {
        await saveEmailSettings(formData);
        showNotification('settingsSaved', 'success');
        onClose();
    };

    const handleTestConnection = async () => {
        setIsTesting(true);
        showNotification('testingConnection', 'info');
        // Simulate network delay and connection check
        setTimeout(() => {
            setIsTesting(false);
            if (formData.imapHost && formData.smtpHost && formData.emailAddress) {
                showNotification('connectionSuccess', 'success');
            } else {
                showNotification('connectionFailed', 'error');
            }
        }, 2000);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('emailSettingsTitle')} size="4xl">
            <div className="space-y-6 p-2">
                {/* Account Info */}
                <div className="bg-slate-50 p-4 rounded-lg border border-cnk-border-light">
                    <h3 className="font-bold text-lg mb-3 text-cnk-txt-primary-light border-b pb-2">{t('accountInfo')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label={t('emailAddress')} id="emailAddress" value={formData.emailAddress} onChange={handleChange} placeholder="ornek@firma.com" />
                        <Input label={t('senderName')} id="senderName" value={formData.senderName} onChange={handleChange} placeholder="Ad Soyad veya Firma Adı" />
                        <div className="md:col-span-2">
                            <label htmlFor="signature" className="mb-2 block text-sm font-semibold text-cnk-txt-secondary-light">{t('signature')}</label>
                            <textarea
                                id="signature"
                                value={formData.signature}
                                onChange={handleChange}
                                rows={4}
                                className="w-full rounded-lg border border-cnk-border-light bg-cnk-panel-light p-2.5"
                                placeholder={t('signaturePlaceholder')}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Incoming Server (IMAP) */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-cnk-border-light">
                        <h3 className="font-bold text-lg mb-3 text-cnk-txt-primary-light border-b pb-2">{t('incomingServer')}</h3>
                        <div className="space-y-3">
                            <Input label={t('host')} id="imapHost" value={formData.imapHost} onChange={handleChange} placeholder="imap.mail.com" />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label={t('port')} id="imapPort" type="number" value={String(formData.imapPort)} onChange={handleChange} />
                                <div>
                                    <label htmlFor="imapSecurity" className="mb-2 block text-sm font-semibold text-cnk-txt-secondary-light">{t('security')}</label>
                                    <select id="imapSecurity" value={formData.imapSecurity} onChange={handleChange} className="w-full rounded-lg border border-cnk-border-light bg-cnk-panel-light p-2.5">
                                        <option value="none">{t('none')}</option>
                                        <option value="ssl">{t('ssl')}</option>
                                        <option value="tls">{t('tls')}</option>
                                    </select>
                                </div>
                            </div>
                            <Input label={t('username')} id="imapUser" value={formData.imapUser} onChange={handleChange} />
                            <Input label={t('password')} id="imapPass" type="password" value={formData.imapPass} onChange={handleChange} />
                        </div>
                    </div>

                    {/* Outgoing Server (SMTP) */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-cnk-border-light">
                        <h3 className="font-bold text-lg mb-3 text-cnk-txt-primary-light border-b pb-2">{t('outgoingServer')}</h3>
                        <div className="space-y-3">
                            <Input label={t('host')} id="smtpHost" value={formData.smtpHost} onChange={handleChange} placeholder="smtp.mail.com" />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label={t('port')} id="smtpPort" type="number" value={String(formData.smtpPort)} onChange={handleChange} />
                                <div>
                                    <label htmlFor="smtpSecurity" className="mb-2 block text-sm font-semibold text-cnk-txt-secondary-light">{t('security')}</label>
                                    <select id="smtpSecurity" value={formData.smtpSecurity} onChange={handleChange} className="w-full rounded-lg border border-cnk-border-light bg-cnk-panel-light p-2.5">
                                        <option value="none">{t('none')}</option>
                                        <option value="ssl">{t('ssl')}</option>
                                        <option value="tls">{t('tls')}</option>
                                    </select>
                                </div>
                            </div>
                            <Input label={t('username')} id="smtpUser" value={formData.smtpUser} onChange={handleChange} />
                            <Input label={t('password')} id="smtpPass" type="password" value={formData.smtpPass} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-cnk-border-light">
                    <Button variant="info" onClick={handleTestConnection} isLoading={isTesting} icon="fas fa-plug">{t('testConnection')}</Button>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                        <Button variant="primary" onClick={handleSave} icon="fas fa-save">{t('save')}</Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default EmailSettingsModal;
