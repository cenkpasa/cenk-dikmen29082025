
import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { Interview, Customer } from '../types';
import DataTable from '../components/common/DataTable';
import Button from '../components/common/Button';
import { ViewState } from '../App';
import { summarizeText } from '../services/aiService';
import Loader from '../components/common/Loader';
import BworksLogo from '../components/assets/BworksLogo';
import VoiceNoteModal from '../components/ai/VoiceNoteModal';
import Autocomplete from '../components/common/Autocomplete';
import { downloadInterviewAsPdf } from '../services/pdfService';
import { formatDate } from '../utils/formatting';

interface InterviewListPageProps {
    setView: (view: ViewState) => void;
}

const InterviewListPage = ({ setView }: InterviewListPageProps) => {
    const { interviews, customers } = useData();
    const { t } = useLanguage();
    const { currentUser } = useAuth();

    const columns = [
        {
            header: t('customers'),
            accessor: (item: Interview) => {
                const customer = customers.find(c => c.id === item.customerId);
                return customer ? customer.name : t('unknownCustomer');
            }
        },
        { header: t('interviewDate'), accessor: (item: Interview) => formatDate(item.formTarihi) },
        { header: t('interviewer'), accessor: (item: Interview) => item.gorusmeyiYapan },
        {
            header: t('actions'),
            accessor: (item: Interview) => (
                <div className="flex gap-2">
                    <Button variant="info" size="sm" onClick={() => setView({ page: 'gorusme-formu', id: item.id })} icon="fas fa-eye" title={currentUser?.role === 'admin' ? `${t('view')}/${t('edit')}` : t('view')} />
                </div>
            ),
        },
    ];

    return (
        <div>
            <div className="flex items-center justify-end mb-6">
                <Button variant="primary" onClick={() => setView({ page: 'gorusme-formu', id: 'create' })} icon="fas fa-plus">{t('addInterview')}</Button>
            </div>
            <DataTable
                columns={columns}
                data={interviews}
                emptyStateMessage={t('noInterviewYet')}
            />
        </div>
    );
};

const SEKTOR_OPTIONS = [
    "Ahşap Profil", "PVC & Alüminyum Pencere", "Folyo-Kenar Bandı-Bant",
    "Kasa-Pervaz-Kapı", "Panel", "Mobilya", "Diğer"
];

interface InterviewFormProps {
    setView: (view: ViewState) => void;
    interviewId?: string;
}

const InterviewForm = ({ setView, interviewId }: InterviewFormProps) => {
    const { interviews, customers, addInterview, updateInterview } = useData();
    const { t } = useLanguage();
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();
    
    const isCreateMode = interviewId === 'create';
    const isReadOnly = !isCreateMode && currentUser?.role !== 'admin';
    const [existingInterview, setExistingInterview] = useState<Interview | null>(null);

    const [formState, setFormState] = useState<Omit<Interview, 'id' | 'createdAt'>>({
        customerId: '',
        formTarihi: new Date().toISOString().slice(0, 10),
        fuar: '',
        sektor: [],
        ziyaretci: { firmaAdi: '', adSoyad: '', bolumu: '', telefon: '', adres: '', email: '', web: '' },
        aksiyonlar: { katalogGonderilecek: false, teklifGonderilecek: false, ziyaretEdilecek: false, bizZiyaretEdecek: { tarih: '', adSoyad: '' } },
        notlar: '',
        gorusmeyiYapan: currentUser?.name || '',
        aiSummary: ''
    });

    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
    
    useEffect(() => {
        const interview = interviews.find(i => i.id === interviewId);
        setExistingInterview(interview || null);
        if (interview) {
             setFormState({
                customerId: interview.customerId,
                formTarihi: interview.formTarihi,
                fuar: interview.fuar,
                sektor: interview.sektor,
                ziyaretci: interview.ziyaretci,
                aksiyonlar: interview.aksiyonlar,
                notlar: interview.notlar,
                gorusmeyiYapan: interview.gorusmeyiYapan,
                aiSummary: interview.aiSummary || ''
            });
        }
    }, [interviewId, interviews]);
    
    const handleCustomerSelect = (custId: string) => {
        const customer = customers.find(c => c.id === custId);
        setFormState(prev => ({
            ...prev,
            customerId: custId,
            ziyaretci: {
                ...prev.ziyaretci,
                firmaAdi: customer?.name || '',
                adSoyad: '',
                telefon: customer?.phone1 || '',
                adres: customer?.address || '',
                email: customer?.email || '',
            }
        }));
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, section?: 'ziyaretci' | 'aksiyonlar' | 'bizZiyaretEdecek') => {
        const { id, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        if (section === 'bizZiyaretEdecek') {
             setFormState(prev => ({
                ...prev,
                aksiyonlar: {
                    ...prev.aksiyonlar,
                    bizZiyaretEdecek: {
                        ...prev.aksiyonlar.bizZiyaretEdecek,
                        [id]: value
                    }
                }
            }));
        } else if(section) {
             setFormState(prev => ({ ...prev, [section]: {...prev[section], [id]: type === 'checkbox' ? checked : value }}));
        } else {
             setFormState(prev => ({ ...prev, [id]: value }));
        }
    };

    const handleSektorChange = (sektor: string) => {
        setFormState(prev => {
            const newSektor = prev.sektor.includes(sektor)
                ? prev.sektor.filter(s => s !== sektor)
                : [...prev.sektor, sektor];
            return { ...prev, sektor: newSektor };
        });
    };
    
    const handleVoiceNoteInsert = (text: string) => {
        setFormState(prev => ({
            ...prev,
            notlar: prev.notlar ? `${prev.notlar}\n${text}` : text
        }));
        setIsVoiceModalOpen(false);
    };

    const handleSubmit = () => {
        if (!formState.customerId || !formState.gorusmeyiYapan) {
            showNotification('fieldsRequired', 'error');
            return;
        }

        if (isCreateMode) {
            addInterview(formState);
            showNotification('interviewSaved', 'success');
        } else if(existingInterview) {
            updateInterview({ ...existingInterview, ...formState });
            showNotification('interviewUpdated', 'success');
        }
        setView({ page: 'gorusme-formu' });
    };

    const handleGenerateSummary = async () => {
        if (!formState.notlar) return;
        setIsAiLoading(true);
        try {
            const result = await summarizeText(formState.notlar);
            if(result.success) {
                setFormState(prev => ({ ...prev, aiSummary: result.text }));
            } else {
                showNotification('aiError', 'error');
            }
        } catch(error) {
            showNotification('aiError', 'error');
        } finally {
            setIsAiLoading(false);
        }
    };
    
    const handleDownloadPdf = async () => {
        if (!existingInterview) return;
        const customer = customers.find(c => c.id === existingInterview.customerId);
        await downloadInterviewAsPdf(existingInterview, customer, t);
    };

    const gridBg = `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0 40 L40 40 M40 0 L40 40' fill='none' stroke='%23d1d5db' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)' /%3E%3C/svg%3E")`;

    return (
        <div className="max-w-4xl mx-auto">
            {isVoiceModalOpen && <VoiceNoteModal isOpen={isVoiceModalOpen} onClose={() => setIsVoiceModalOpen(false)} onInsert={handleVoiceNoteInsert} />}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{isCreateMode ? t('addInterview') : t('interviewForm')}</h1>
                 <div className="flex gap-2">
                    {!isCreateMode && <Button onClick={handleDownloadPdf} variant="info" icon="fas fa-file-pdf">{t('downloadPdf')}</Button>}
                    <Button onClick={() => setView({ page: 'gorusme-formu' })} variant="secondary" icon="fas fa-arrow-left">{t('backToList')}</Button>
                </div>
            </div>
            <fieldset disabled={isReadOnly} className="border-2 border-cnk-sidebar-dark p-4 font-sans text-sm disabled:bg-slate-50">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-cnk-sidebar-dark pb-2">
                    <div className="flex items-center">
                        <div className="h-12 mr-4">
                            <BworksLogo />
                        </div>
                        <span className="text-3xl font-bold">{t('interviewForm').toUpperCase()}</span>
                    </div>
                    <div className="text-right">
                        <span>{t('date').toUpperCase()}: </span><input type="date" value={formState.formTarihi} onChange={(e) => handleInputChange(e, undefined)} id="formTarihi" className="w-28 border-b border-cnk-txt-muted-light focus:outline-none bg-transparent" readOnly={isReadOnly} />
                        <br/>
                        <span>{t('fair').toUpperCase()}: </span><input type="text" value={formState.fuar} onChange={(e) => handleInputChange(e, undefined)} id="fuar" className="w-28 border-b border-cnk-txt-muted-light focus:outline-none bg-transparent" readOnly={isReadOnly} />
                    </div>
                </div>
                
                {/* Body */}
                <div className="grid grid-cols-3 gap-4 mt-2">
                    {/* Left Column */}
                    <div className="col-span-1 border-r-2 border-cnk-sidebar-dark pr-4">
                        <div className="border border-cnk-txt-muted-light p-2">
                            <h3 className="font-bold text-center">{t('sector').toUpperCase()}</h3>
                            {SEKTOR_OPTIONS.map(opt => (
                                <div key={opt} className="flex items-center my-1">
                                    <input type="checkbox" id={opt} checked={formState.sektor.includes(opt)} onChange={() => handleSektorChange(opt)} disabled={isReadOnly} className="h-4 w-4 rounded" />
                                    <label htmlFor={opt} className="ml-2">{opt}</label>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 space-y-2">
                             <div className="flex items-center"><input type="checkbox" id="katalogGonderilecek" checked={formState.aksiyonlar.katalogGonderilecek} onChange={(e) => handleInputChange(e, 'aksiyonlar')} disabled={isReadOnly} className="h-4 w-4 rounded"/><label htmlFor="katalogGonderilecek" className="ml-2">Katalog gönderilecek</label></div>
                             <div className="flex items-center"><input type="checkbox" id="teklifGonderilecek" checked={formState.aksiyonlar.teklifGonderilecek} onChange={(e) => handleInputChange(e, 'aksiyonlar')} disabled={isReadOnly} className="h-4 w-4 rounded"/><label htmlFor="teklifGonderilecek" className="ml-2">Teklif gönderilecek</label></div>
                             <div className="flex items-center"><input type="checkbox" id="ziyaretEdilecek" checked={formState.aksiyonlar.ziyaretEdilecek} onChange={(e) => handleInputChange(e, 'aksiyonlar')} disabled={isReadOnly} className="h-4 w-4 rounded"/><label htmlFor="ziyaretEdilecek" className="ml-2">Ziyaret edilecek</label></div>
                        </div>
                    </div>
                    
                    {/* Right Column */}
                    <div className="col-span-2">
                        <div className="border border-cnk-txt-muted-light p-2">
                            <h3 className="font-bold">{t('visitor').toUpperCase()}</h3>
                             <Autocomplete
                                items={customers.map(c => ({ id: c.id, name: c.name }))}
                                onSelect={handleCustomerSelect}
                                placeholder={t('selectCustomer')}
                                initialValue={customers.find(c => c.id === formState.customerId)?.name || ''}
                                disabled={isReadOnly}
                            />
                            <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 items-center mt-2">
                               <span>Firma Adı:</span><input type="text" id="firmaAdi" value={formState.ziyaretci.firmaAdi} onChange={(e) => handleInputChange(e, 'ziyaretci')} readOnly={isReadOnly} className="border-b border-cnk-txt-muted-light focus:outline-none bg-transparent"/>
                               <span>Ad Soyad:</span><input type="text" id="adSoyad" value={formState.ziyaretci.adSoyad} onChange={(e) => handleInputChange(e, 'ziyaretci')} readOnly={isReadOnly} className="border-b border-cnk-txt-muted-light focus:outline-none bg-transparent"/>
                               <span>Bölümü:</span><input type="text" id="bolumu" value={formState.ziyaretci.bolumu} onChange={(e) => handleInputChange(e, 'ziyaretci')} readOnly={isReadOnly} className="border-b border-cnk-txt-muted-light focus:outline-none bg-transparent"/>
                               <span>Telefon:</span><input type="text" id="telefon" value={formState.ziyaretci.telefon} onChange={(e) => handleInputChange(e, 'ziyaretci')} readOnly={isReadOnly} className="border-b border-cnk-txt-muted-light focus:outline-none bg-transparent"/>
                               <span>Adres:</span><input type="text" id="adres" value={formState.ziyaretci.adres} onChange={(e) => handleInputChange(e, 'ziyaretci')} readOnly={isReadOnly} className="border-b border-cnk-txt-muted-light focus:outline-none bg-transparent"/>
                               <span>E-mail:</span><input type="text" id="email" value={formState.ziyaretci.email} onChange={(e) => handleInputChange(e, 'ziyaretci')} readOnly={isReadOnly} className="border-b border-cnk-txt-muted-light focus:outline-none bg-transparent"/>
                               <span>Web:</span><input type="text" id="web" value={formState.ziyaretci.web} onChange={(e) => handleInputChange(e, 'ziyaretci')} readOnly={isReadOnly} className="border-b border-cnk-txt-muted-light focus:outline-none bg-transparent"/>
                            </div>
                        </div>
                        <div className="mt-2 flex justify-between items-center border border-cnk-txt-muted-light p-2">
                           <div className="flex items-center">
                               <input type="checkbox" disabled={isReadOnly} className="h-4 w-4 rounded"/>
                               <span className="ml-2">Bizi ziyaret edecek</span>
                           </div>
                           <div className="text-right">
                               <span>TARİH: <input type="text" id="tarih" value={formState.aksiyonlar.bizZiyaretEdecek.tarih} onChange={e => handleInputChange(e, 'bizZiyaretEdecek')} readOnly={isReadOnly} className="w-24 border-b border-cnk-txt-muted-light focus:outline-none bg-transparent"/></span>
                               <span>Ad Soyad: <input type="text" id="adSoyad" value={formState.aksiyonlar.bizZiyaretEdecek.adSoyad} onChange={e => handleInputChange(e, 'bizZiyaretEdecek')} readOnly={isReadOnly} className="w-24 border-b border-cnk-txt-muted-light focus:outline-none bg-transparent"/></span>
                           </div>
                        </div>
                    </div>
                </div>

                 {/* Notes Area */}
                <div className="mt-2 relative">
                    {!isReadOnly && <Button onClick={() => setIsVoiceModalOpen(true)} size="sm" icon="fas fa-microphone" className="absolute top-2 right-2 z-10">{t('addVoiceNote')}</Button>}
                    <textarea 
                        id="notlar" 
                        value={formState.notlar}
                        onChange={(e) => setFormState(prev => ({...prev, notlar: e.target.value}))}
                        readOnly={isReadOnly}
                        rows={12} 
                        className="w-full p-2 border-2 border-t-0 border-cnk-sidebar-dark focus:outline-none resize-none leading-normal"
                        style={{ backgroundImage: gridBg, backgroundSize: '16px 16px', backgroundRepeat: 'repeat' }}
                    ></textarea>
                </div>

                {/* AI Summary Section */}
                <div className="mt-6 p-4 rounded-cnk-card bg-cnk-accent-primary/5 border border-cnk-accent-primary/20">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-bold text-cnk-accent-primary flex items-center gap-2">
                            <i className="fas fa-robot"></i>
                            <span>{t('aiSummary')}</span>
                        </h3>
                        {!isReadOnly && (
                            <Button
                                type="button"
                                onClick={handleGenerateSummary}
                                isLoading={isAiLoading}
                                icon="fas fa-wand-magic-sparkles"
                                disabled={!formState.notlar || isAiLoading}
                                variant="secondary"
                            >
                                {t('summarizeNotes')}
                            </Button>
                        )}
                    </div>
                    <div className="relative">
                        {isAiLoading && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-cnk-panel-light/70">
                                <Loader />
                            </div>
                        )}
                        <textarea
                            value={formState.aiSummary || ''}
                            onChange={(e) => setFormState(prev => ({ ...prev, aiSummary: e.target.value }))}
                            readOnly={isReadOnly}
                            rows={8}
                            placeholder={t('aiSummaryPlaceholder')}
                            className="w-full rounded-md border border-cnk-border-light bg-cnk-panel-light p-2 text-cnk-txt-secondary-light shadow-sm focus:border-cnk-accent-primary focus:outline-none focus:ring-1 focus:ring-cnk-accent-primary"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-2 flex justify-between items-center">
                    <div>
                        <span>{t('interviewer').toUpperCase()}: </span>
                        <input id="gorusmeyiYapan" type="text" value={formState.gorusmeyiYapan} onChange={(e) => handleInputChange(e, undefined)} readOnly={isReadOnly} className="border-b border-cnk-txt-muted-light focus:outline-none bg-transparent" />
                    </div>
                    {!isReadOnly && <Button onClick={handleSubmit} icon="fas fa-save">{t('save')}</Button>}
                </div>

            </fieldset>

        </div>
    );
};

interface InterviewFormPageProps {
    view: ViewState;
    setView: (view: ViewState) => void;
}

const InterviewFormPage = ({ view, setView }: InterviewFormPageProps) => {
    if (view.id) {
        return <InterviewForm setView={setView} interviewId={view.id} />;
    }
    return <InterviewListPage setView={setView} />;
};

export default InterviewFormPage;
