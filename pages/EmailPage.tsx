
import React, { useState, useMemo } from 'react';
import { useEmail } from '../contexts/EmailContext';
import { useLanguage } from '../contexts/LanguageContext';
import { EmailMessage, Attachment } from '../types';
import Button from '../components/common/Button';
import { formatDateTime } from '../utils/formatting';
import EmailComposer from '../components/email/EmailComposer';
import EmailSettingsModal from '../components/email/EmailSettingsModal';
import { useNotification } from '../contexts/NotificationContext';
import ContactListModal from '../components/email/ContactListModal';

const EmailPage = () => {
    const { t } = useLanguage();
    const { emails, markAsRead, deleteEmail, unreadCount, syncEmails, isSyncing, lastSync, accounts, currentAccount, setCurrentAccountId } = useEmail();
    const { showNotification } = useNotification();
    
    const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'drafts' | 'trash'>('inbox');
    const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
    const [isComposerOpen, setIsComposerOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAddressBookOpen, setIsAddressBookOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
    
    const [composeRecipients, setComposeRecipients] = useState<string[]>([]);

    const filteredEmails = useMemo(() => {
        return emails.filter(e => 
            e.folder === activeFolder && 
            (e.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
             e.from.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [emails, activeFolder, searchTerm]);

    const selectedEmail = useMemo(() => 
        emails.find(e => e.id === selectedEmailId), 
    [emails, selectedEmailId]);

    const handleSelectEmail = (email: EmailMessage) => {
        setSelectedEmailId(email.id);
        if (!email.isRead) {
            markAsRead(email.id);
        }
    };

    const handleSync = async () => {
        await syncEmails();
        showNotification('foldersSynced', 'success');
    };

    const handleAddressBookSelect = (emails: string[]) => {
        setComposeRecipients(emails);
        setIsAddressBookOpen(false);
        setIsComposerOpen(true);
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.includes('pdf')) return 'fa-file-pdf text-red-500';
        if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'fa-file-excel text-green-600';
        if (mimeType.includes('word') || mimeType.includes('document')) return 'fa-file-word text-blue-600';
        if (mimeType.includes('image')) return 'fa-file-image text-purple-500';
        if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'fa-file-archive text-amber-600';
        return 'fa-file text-slate-500';
    };

    const handleDownload = (att: Attachment) => {
        // Simulation of downloading a potentially huge file
        const delay = att.size > 1024*1024*50 ? 2000 : 500; // Fake delay for large files
        setTimeout(() => {
            showNotification('fileDownloaded', 'success', { name: att.name });
        }, delay);
    };

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-120px)] bg-white rounded-xl shadow-lg border border-cnk-border-light overflow-hidden">
            {/* Left Sidebar: Folders */}
            <div className="w-full md:w-64 border-r bg-slate-50 p-4 flex flex-col gap-2">
                
                {/* Account Switcher */}
                <div className="relative mb-4">
                    <button 
                        onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                        className="w-full flex items-center justify-between p-3 bg-white border border-cnk-border-light rounded-lg hover:shadow-sm transition-all"
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: currentAccount?.color || '#3b82f6' }}>
                                {currentAccount?.accountName.charAt(0) || 'A'}
                            </div>
                            <div className="text-left truncate">
                                <div className="font-bold text-sm text-cnk-txt-primary-light truncate">{currentAccount?.accountName || 'Hesap Seçin'}</div>
                                <div className="text-xs text-cnk-txt-muted-light truncate">{currentAccount?.emailAddress}</div>
                            </div>
                        </div>
                        <i className={`fas fa-chevron-down text-slate-400 transition-transform ${isAccountDropdownOpen ? 'rotate-180' : ''}`}></i>
                    </button>
                    
                    {isAccountDropdownOpen && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-cnk-border-light rounded-lg shadow-xl z-20 overflow-hidden">
                            {accounts.map(acc => (
                                <button
                                    key={acc.id}
                                    onClick={() => { setCurrentAccountId(acc.id); setIsAccountDropdownOpen(false); setSelectedEmailId(null); }}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 text-left border-b border-slate-100 last:border-0"
                                >
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: acc.color }}>
                                        {acc.accountName.charAt(0)}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 truncate">{acc.accountName}</span>
                                </button>
                            ))}
                            <button 
                                onClick={() => { setIsSettingsOpen(true); setIsAccountDropdownOpen(false); }}
                                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 text-left text-cnk-accent-primary font-medium text-sm"
                            >
                                <i className="fas fa-plus-circle"></i> {t('addAccount')} / {t('settings')}
                            </button>
                        </div>
                    )}
                </div>

                <Button onClick={() => { setComposeRecipients([]); setIsComposerOpen(true); }} icon="fas fa-edit" className="mb-2 w-full justify-start py-3">
                    {t('createEmail')}
                </Button>

                <Button 
                    onClick={handleSync} 
                    variant="secondary" 
                    icon={isSyncing ? "fas fa-sync fa-spin" : "fas fa-sync"} 
                    className="mb-4 w-full justify-start py-2 text-cnk-accent-primary border-cnk-accent-primary/30 hover:bg-cnk-accent-primary/10"
                    disabled={isSyncing}
                >
                    {isSyncing ? t('syncing') : t('sendReceive')}
                </Button>
                
                {[
                    { id: 'inbox', label: t('inbox'), icon: 'fa-inbox', count: unreadCount },
                    { id: 'sent', label: t('sent'), icon: 'fa-paper-plane' },
                    { id: 'drafts', label: t('drafts'), icon: 'fa-file-alt' },
                    { id: 'trash', label: t('trash'), icon: 'fa-trash' },
                ].map(folder => (
                    <button
                        key={folder.id}
                        onClick={() => { setActiveFolder(folder.id as any); setSelectedEmailId(null); }}
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors ${activeFolder === folder.id ? 'bg-cnk-accent-primary text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'}`}
                    >
                        <div className="flex items-center gap-3">
                            <i className={`fas ${folder.icon} w-5`}></i>
                            <span className="font-medium">{folder.label}</span>
                        </div>
                        {folder.count ? <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${activeFolder === folder.id ? 'bg-white text-cnk-accent-primary' : 'bg-red-500 text-white'}`}>{folder.count}</span> : null}
                    </button>
                ))}
                
                <div className="mt-auto pt-2 space-y-2">
                    {lastSync && (
                        <div className="px-3 py-1 text-xs text-center text-slate-400 border-t border-slate-200 pt-2">
                            {t('lastSync')}: {lastSync.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                    )}
                    <button
                        onClick={() => setIsAddressBookOpen(true)}
                        className="flex w-full items-center gap-3 p-3 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors border-t border-slate-200"
                    >
                        <i className="fas fa-address-book w-5"></i>
                        <span className="font-medium">{t('addressBook')}</span>
                    </button>
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="flex w-full items-center gap-3 p-3 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                        <i className="fas fa-cog w-5"></i>
                        <span className="font-medium">{t('emailSettingsTitle')}</span>
                    </button>
                </div>
            </div>

            {/* Middle: Email List */}
            <div className="flex-1 min-w-0 border-r flex flex-col">
                <div className="p-4 border-b">
                    <div className="relative">
                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                        <input
                            type="text"
                            placeholder={t('searchEmail')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-cnk-accent-primary text-sm"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {filteredEmails.length > 0 ? (
                        filteredEmails.map(email => (
                            <div
                                key={email.id}
                                onClick={() => handleSelectEmail(email)}
                                className={`p-4 border-b cursor-pointer hover:bg-slate-50 transition-colors ${selectedEmailId === email.id ? 'bg-blue-50 border-l-4 border-l-cnk-accent-primary' : ''} ${!email.isRead ? 'font-bold' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-sm text-cnk-txt-primary-light truncate">{email.from.name}</span>
                                    <span className="text-[10px] text-slate-400 shrink-0">{formatDateTime(email.timestamp)}</span>
                                </div>
                                <h4 className="text-sm text-slate-700 truncate">{email.subject}</h4>
                                <div className="flex items-center gap-2">
                                    <p className="text-xs text-slate-400 line-clamp-1 flex-grow">{email.body}</p>
                                    {email.attachments && email.attachments.length > 0 && (
                                        <i className="fas fa-paperclip text-slate-400 text-xs"></i>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                            <i className="fas fa-envelope-open text-4xl mb-2 opacity-20"></i>
                            <p className="text-sm">E-posta bulunamadı.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Email Detail */}
            <div className="hidden lg:flex flex-[2] flex-col bg-slate-50/30">
                {selectedEmail ? (
                    <div className="flex flex-col h-full">
                        <div className="p-6 border-b bg-white">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-xl font-bold text-slate-800">{selectedEmail.subject}</h2>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="secondary" icon="fas fa-reply" title={t('reply')} />
                                    <Button size="sm" variant="danger" icon="fas fa-trash" onClick={() => { deleteEmail(selectedEmail.id); setSelectedEmailId(null); }} />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                                    {selectedEmail.from.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700">{selectedEmail.from.name}</p>
                                    <p className="text-xs text-slate-500">&lt;{selectedEmail.from.email}&gt;</p>
                                </div>
                                <div className="ml-auto text-xs text-slate-400">
                                    {formatDateTime(selectedEmail.timestamp)}
                                </div>
                            </div>
                        </div>
                        <div className="p-8 flex-1 overflow-y-auto bg-white m-4 rounded-xl shadow-sm border whitespace-pre-wrap text-slate-700 leading-relaxed flex flex-col">
                            <div className="flex-grow">{selectedEmail.body}</div>
                            
                            {/* Attachments Section */}
                            {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                                <div className="mt-8 pt-4 border-t border-slate-200">
                                    <h4 className="font-bold text-sm text-slate-600 mb-2 flex items-center gap-2">
                                        <i className="fas fa-paperclip"></i>
                                        {selectedEmail.attachments.length} {t('attachments')}
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {selectedEmail.attachments.map(att => (
                                            <div key={att.id} className="flex items-center p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                                                <i className={`fas ${getFileIcon(att.type)} text-2xl mr-3`}></i>
                                                <div className="flex-grow min-w-0">
                                                    <p className="text-sm font-medium text-slate-700 truncate" title={att.name}>{att.name}</p>
                                                    <p className="text-xs text-slate-500">{formatSize(att.size)}</p>
                                                </div>
                                                <Button size="sm" variant="secondary" icon="fas fa-download" onClick={() => handleDownload(att)} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50">
                        <i className="fas fa-mouse-pointer text-5xl mb-4"></i>
                        <p>Görüntülemek için bir e-posta seçin.</p>
                    </div>
                )}
            </div>
            
            {isComposerOpen && (
                <EmailComposer 
                    isOpen={isComposerOpen} 
                    onClose={() => { setIsComposerOpen(false); setComposeRecipients([]); }} 
                    initialRecipients={composeRecipients}
                />
            )}
            {isSettingsOpen && <EmailSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />}
            {isAddressBookOpen && (
                <ContactListModal 
                    isOpen={isAddressBookOpen} 
                    onClose={() => setIsAddressBookOpen(false)} 
                    onSelect={handleAddressBookSelect}
                />
            )}
        </div>
    );
};

export default EmailPage;
