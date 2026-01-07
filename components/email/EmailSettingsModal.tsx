
import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { useLanguage } from '../../contexts/LanguageContext';
import { useEmail } from '../../contexts/EmailContext';
import { EmailAccountSettings } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';
import Loader from '../common/Loader';

interface EmailSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Tab = 'accounts' | 'general' | 'import';
type WizardStep = 'provider' | 'details' | 'finish';

const AccountForm = ({ 
    initialData, 
    onSave, 
    onCancel 
}: { 
    initialData?: Partial<EmailAccountSettings>, 
    onSave: (data: any) => Promise<void>, 
    onCancel: () => void 
}) => {
    const { t } = useLanguage();
    const [step, setStep] = useState<WizardStep>(initialData?.id ? 'details' : 'provider');
    const [isSaving, setIsSaving] = useState(false);
    
    const [formData, setFormData] = useState<Partial<EmailAccountSettings>>({
        accountName: '',
        emailAddress: '',
        senderName: '',
        provider: 'other',
        color: '#3b82f6',
        imapHost: '',
        imapPort: 993,
        imapUser: '',
        imapPass: '',
        imapSecurity: 'ssl',
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPass: '',
        smtpSecurity: 'tls',
        ...initialData
    });

    const providers = [
        { id: 'gmail', name: 'Gmail', icon: 'fab fa-google', color: 'text-red-500', auto: { imapHost: 'imap.gmail.com', smtpHost: 'smtp.gmail.com' } },
        { id: 'outlook', name: 'Outlook / Hotmail', icon: 'fab fa-microsoft', color: 'text-blue-500', auto: { imapHost: 'outlook.office365.com', smtpHost: 'smtp.office365.com' } },
        { id: 'yahoo', name: 'Yahoo Mail', icon: 'fab fa-yahoo', color: 'text-purple-600', auto: { imapHost: 'imap.mail.yahoo.com', smtpHost: 'smtp.mail.yahoo.com' } },
        { id: 'other', name: 'Diğer (IMAP/POP)', icon: 'fas fa-server', color: 'text-slate-600', auto: {} }
    ];

    const handleProviderSelect = (providerId: string) => {
        const prov = providers.find(p => p.id === providerId);
        setFormData(prev => ({
            ...prev,
            provider: providerId as any,
            ...prov?.auto
        }));
        setStep('details');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(formData);
        setIsSaving(false);
    };

    if (step === 'provider') {
        return (
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-cnk-txt-primary-light text-center mb-6">Hesap Türünü Seçin</h3>
                <div className="grid grid-cols-2 gap-4">
                    {providers.map(p => (
                        <button 
                            key={p.id} 
                            onClick={() => handleProviderSelect(p.id)}
                            className="flex flex-col items-center justify-center p-6 border rounded-xl hover:bg-slate-50 hover:border-cnk-accent-primary transition-all group"
                        >
                            <i className={`${p.icon} text-4xl mb-3 ${p.color} group-hover:scale-110 transition-transform`}></i>
                            <span className="font-semibold text-cnk-txt-secondary-light">{p.name}</span>
                        </button>
                    ))}
                </div>
                <div className="mt-4 text-center">
                    <Button variant="secondary" onClick={onCancel}>{t('cancel')}</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fadeIn">
            <h3 className="text-lg font-bold border-b pb-2">{initialData?.id ? 'Hesabı Düzenle' : 'Yeni Hesap Ayarları'}</h3>
            
            <div className="grid grid-cols-2 gap-4">
                <Input label={t('accountName')} id="accountName" value={formData.accountName} onChange={handleChange} placeholder="Örn: İş E-postam" />
                <div className="flex flex-col">
                    <label className="mb-2 text-sm font-semibold text-cnk-txt-secondary-light">Etiket Rengi</label>
                    <input type="color" id="color" value={formData.color} onChange={handleChange} className="h-10 w-full rounded border p-1 cursor-pointer" />
                </div>
                <Input label={t('emailAddress')} id="emailAddress" value={formData.emailAddress} onChange={handleChange} />
                <Input label={t('senderName')} id="senderName" value={formData.senderName} onChange={handleChange} />
            </div>

            <div className="bg-slate-50 p-4 rounded border">
                <h4 className="font-bold text-sm mb-3">Gelen Sunucusu (IMAP)</h4>
                <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-6"><Input label={t('host')} id="imapHost" value={formData.imapHost} onChange={handleChange} /></div>
                    <div className="col-span-3"><Input label={t('port')} id="imapPort" value={String(formData.imapPort)} onChange={handleChange} /></div>
                    <div className="col-span-3">
                        <label className="block text-sm font-semibold mb-2">{t('security')}</label>
                        <select id="imapSecurity" value={formData.imapSecurity} onChange={handleChange} className="w-full p-2 border rounded">
                            <option value="ssl">SSL</option>
                            <option value="tls">TLS</option>
                            <option value="none">Yok</option>
                        </select>
                    </div>
                    <div className="col-span-6"><Input label={t('username')} id="imapUser" value={formData.imapUser} onChange={handleChange} /></div>
                    <div className="col-span-6"><Input label={t('password')} id="imapPass" type="password" value={formData.imapPass} onChange={handleChange} /></div>
                </div>
            </div>

            <div className="bg-slate-50 p-4 rounded border">
                <h4 className="font-bold text-sm mb-3">Giden Sunucusu (SMTP)</h4>
                <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-6"><Input label={t('host')} id="smtpHost" value={formData.smtpHost} onChange={handleChange} /></div>
                    <div className="col-span-3"><Input label={t('port')} id="smtpPort" value={String(formData.smtpPort)} onChange={handleChange} /></div>
                    <div className="col-span-3">
                        <label className="block text-sm font-semibold mb-2">{t('security')}</label>
                        <select id="smtpSecurity" value={formData.smtpSecurity} onChange={handleChange} className="w-full p-2 border rounded">
                            <option value="ssl">SSL</option>
                            <option value="tls">TLS</option>
                            <option value="none">Yok</option>
                        </select>
                    </div>
                    <div className="col-span-6"><Input label={t('username')} id="smtpUser" value={formData.smtpUser} onChange={handleChange} /></div>
                    <div className="col-span-6"><Input label={t('password')} id="smtpPass" type="password" value={formData.smtpPass} onChange={handleChange} /></div>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="secondary" onClick={onCancel} disabled={isSaving}>{t('cancel')}</Button>
                <Button onClick={handleSave} isLoading={isSaving}>{t('save')}</Button>
            </div>
        </div>
    );
};

const EmailSettingsModal = ({ isOpen, onClose }: EmailSettingsModalProps) => {
    const { t } = useLanguage();
    const { accounts, addAccount, updateAccount, deleteAccount, repairAccount, importAccount } = useEmail();
    const { showNotification } = useNotification();
    
    const [activeTab, setActiveTab] = useState<Tab>('accounts');
    const [editingAccount, setEditingAccount] = useState<Partial<EmailAccountSettings> | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'form' | 'repair' | 'import'>('list');
    
    // Repair State
    const [repairStatus, setRepairStatus] = useState<'idle' | 'checking' | 'fixing' | 'success' | 'error'>('idle');
    const [repairLog, setRepairLog] = useState<string[]>([]);
    
    // Import State
    const [importFile, setImportFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    const handleAddNew = () => {
        setEditingAccount({});
        setViewMode('form');
    };

    const handleEdit = (account: EmailAccountSettings) => {
        setEditingAccount(account);
        setViewMode('form');
    };

    const handleDelete = async (id: string) => {
        if(window.confirm('Bu hesabı ve tüm e-postalarını silmek istediğinize emin misiniz?')) {
            await deleteAccount(id);
            showNotification('accountDeleted', 'success');
        }
    };

    const handleSaveAccount = async (data: any) => {
        if (data.id) {
            await updateAccount(data as EmailAccountSettings);
            showNotification('settingsSaved', 'success');
        } else {
            await addAccount(data);
            showNotification('accountAdded', 'success');
        }
        setViewMode('list');
        setEditingAccount(null);
    };

    const handleRepair = async (id: string) => {
        setViewMode('repair');
        setRepairStatus('checking');
        setRepairLog(['Bağlantı kontrol ediliyor...', 'Sunucu yanıtı bekleniyor...']);
        
        // Simulate steps
        setTimeout(async () => {
            setRepairLog(prev => [...prev, 'Kimlik doğrulama protokolleri test ediliyor...']);
            try {
                const success = await repairAccount(id);
                if (success) {
                    setRepairStatus('success');
                    setRepairLog(prev => [...prev, 'Onarım tamamlandı. Bağlantı başarılı.', 'Klasörler eşitlendi.']);
                } else {
                    throw new Error('Bağlantı hatası');
                }
            } catch (e) {
                setRepairStatus('error');
                setRepairLog(prev => [...prev, 'HATA: Sunucuya erişilemiyor.', 'Lütfen internet bağlantınızı ve şifrenizi kontrol edin.']);
            }
        }, 1500);
    };

    const handleImport = async () => {
        if (!importFile) return;
        setIsImporting(true);
        const result = await importAccount(importFile.name, 'pst');
        setIsImporting(false);
        if (result) {
            showNotification('importSuccess', 'success');
            setViewMode('list');
        } else {
            showNotification('importError', 'error');
        }
    };

    const TabButton = ({ id, label, icon }: { id: Tab, label: string, icon: string }) => (
        <button 
            onClick={() => { setActiveTab(id); setViewMode('list'); }}
            className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === id ? 'bg-cnk-accent-primary text-white' : 'hover:bg-slate-100 text-cnk-txt-secondary-light'}`}
        >
            <i className={`${icon} w-5 text-center`}></i>
            <span className="font-medium">{label}</span>
        </button>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('emailSettingsTitle')} size="5xl">
            <div className="flex h-[600px]">
                {/* Sidebar */}
                <div className="w-64 border-r border-cnk-border-light pr-4 space-y-2">
                    <TabButton id="accounts" label="Hesaplar" icon="fas fa-users" />
                    <TabButton id="general" label="Genel Ayarlar" icon="fas fa-cog" />
                    <TabButton id="import" label="İçe Aktar / Yedekle" icon="fas fa-file-import" />
                </div>

                {/* Content */}
                <div className="flex-1 pl-6 overflow-y-auto">
                    {activeTab === 'accounts' && viewMode === 'list' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">E-posta Hesapları</h3>
                                <Button onClick={handleAddNew} icon="fas fa-plus">{t('addAccount')}</Button>
                            </div>
                            
                            <div className="space-y-3">
                                {accounts.map(acc => (
                                    <div key={acc.id} className="border rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow bg-white">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: acc.color }}>
                                                {acc.accountName.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-cnk-txt-primary-light">{acc.accountName}</h4>
                                                <p className="text-sm text-cnk-txt-muted-light">{acc.emailAddress}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`w-2 h-2 rounded-full ${acc.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                    <span className="text-xs text-slate-500">{acc.status === 'active' ? 'Bağlı' : 'Hata'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="secondary" onClick={() => handleRepair(acc.id)} icon="fas fa-wrench" title="Onar" />
                                            <Button size="sm" variant="info" onClick={() => handleEdit(acc)} icon="fas fa-edit" title="Düzenle" />
                                            <Button size="sm" variant="danger" onClick={() => handleDelete(acc.id)} icon="fas fa-trash" title="Sil" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {viewMode === 'form' && (
                        <AccountForm 
                            initialData={editingAccount || {}} 
                            onSave={handleSaveAccount} 
                            onCancel={() => setViewMode('list')} 
                        />
                    )}

                    {viewMode === 'repair' && (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-6 ${repairStatus === 'success' ? 'bg-green-100 text-green-500' : repairStatus === 'error' ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'}`}>
                                <i className={`fas ${repairStatus === 'success' ? 'fa-check' : repairStatus === 'error' ? 'fa-times' : 'fa-cog fa-spin'}`}></i>
                            </div>
                            <h3 className="text-xl font-bold mb-4">
                                {repairStatus === 'checking' ? 'Hesap Ayarları Kontrol Ediliyor...' : 
                                 repairStatus === 'fixing' ? 'Onarım Uygulanıyor...' :
                                 repairStatus === 'success' ? 'Hesap Başarıyla Onarıldı!' : 'Onarım Başarısız'}
                            </h3>
                            <div className="w-full max-w-md bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm h-48 overflow-y-auto mb-6">
                                {repairLog.map((log, i) => <div key={i}>&gt; {log}</div>)}
                            </div>
                            <Button onClick={() => setViewMode('list')}>Tamam</Button>
                        </div>
                    )}

                    {activeTab === 'import' && (
                        <div className="max-w-xl mx-auto pt-10 text-center">
                            <i className="fas fa-file-import text-6xl text-cnk-accent-primary mb-6"></i>
                            <h3 className="text-2xl font-bold mb-2">Başka Bir Hesaptan İçe Aktar</h3>
                            <p className="text-cnk-txt-secondary-light mb-8">Outlook (.pst), Thunderbird veya diğer istemcilerden verilerinizi taşıyın.</p>
                            
                            <div className="border-2 border-dashed border-cnk-border-light rounded-xl p-10 hover:bg-slate-50 transition-colors cursor-pointer relative">
                                <input 
                                    type="file" 
                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                    accept=".pst,.ost,.mbox"
                                />
                                <i className="fas fa-cloud-upload-alt text-4xl text-slate-400 mb-2"></i>
                                <p className="font-semibold text-slate-600">
                                    {importFile ? importFile.name : "Dosya Seç veya Sürükle (.pst, .mbox)"}
                                </p>
                            </div>

                            <div className="mt-8">
                                <Button size="lg" onClick={handleImport} disabled={!importFile || isImporting} isLoading={isImporting}>
                                    İçe Aktarmayı Başlat
                                </Button>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'general' && (
                        <div className="p-4">
                            <h3 className="text-lg font-bold mb-4">Genel E-posta Tercihleri</h3>
                            <div className="space-y-4">
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" className="w-4 h-4" defaultChecked />
                                    <span>Yeni e-posta geldiğinde ses çal</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" className="w-4 h-4" defaultChecked />
                                    <span>Masaüstü bildirimlerini göster</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" className="w-4 h-4" />
                                    <span>E-postaları her zaman HTML olarak göster</span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default EmailSettingsModal;
