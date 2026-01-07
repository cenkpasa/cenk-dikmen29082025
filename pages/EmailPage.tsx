
import React, { useState, useMemo } from 'react';
import { useEmail } from '../contexts/EmailContext';
import { useLanguage } from '../contexts/LanguageContext';
import { EmailMessage } from '../types';
import Button from '../components/common/Button';
import { formatDateTime } from '../utils/formatting';
import EmailComposer from '../components/email/EmailComposer';

const EmailPage = () => {
    const { t } = useLanguage();
    const { emails, markAsRead, deleteEmail, unreadCount } = useEmail();
    
    const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'drafts' | 'trash'>('inbox');
    const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
    const [isComposerOpen, setIsComposerOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

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

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-120px)] bg-white rounded-xl shadow-lg border border-cnk-border-light overflow-hidden">
            {/* Left Sidebar: Folders */}
            <div className="w-full md:w-64 border-r bg-slate-50 p-4 flex flex-col gap-2">
                <Button onClick={() => setIsComposerOpen(true)} icon="fas fa-edit" className="mb-4 w-full justify-start py-3">
                    {t('createEmail')}
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
                                <p className="text-xs text-slate-400 line-clamp-1">{email.body}</p>
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
                        <div className="p-8 flex-1 overflow-y-auto bg-white m-4 rounded-xl shadow-sm border whitespace-pre-wrap text-slate-700 leading-relaxed">
                            {selectedEmail.body}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50">
                        <i className="fas fa-mouse-pointer text-5xl mb-4"></i>
                        <p>Görüntülemek için bir e-posta seçin.</p>
                    </div>
                )}
            </div>
            
            {isComposerOpen && <EmailComposer isOpen={isComposerOpen} onClose={() => setIsComposerOpen(false)} />}
        </div>
    );
};

export default EmailPage;
