import React, { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { IncomingInvoice, OutgoingInvoice, Reconciliation, Customer } from '../types';
import { useReconciliation } from '../contexts/ReconciliationContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { db, seedInitialData } from '../services/dbService';
import { useLiveQuery } from 'dexie-react-hooks';
import Button from '../components/common/Button';
import { useData } from '../contexts/DataContext';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import { downloadReconciliationAsPdf } from '../services/pdfService';
import { analyzeDisagreement, generateReconciliationEmail } from '../services/aiService';
import Loader from '../components/common/Loader';
import { formatCurrency, formatDate } from '../utils/formatting';

interface MatchedPair {
    incoming: IncomingInvoice;
    outgoing: OutgoingInvoice;
    matchType: 'perfect' | 'amount_diff' | 'date_diff' | 'both_diff';
}

const ReconciliationDetailView = ({ reconciliation, onBack, incomingInvoices, outgoingInvoices }: { reconciliation: Reconciliation; onBack: () => void; incomingInvoices: IncomingInvoice[]; outgoingInvoices: OutgoingInvoice[]; }) => {
    const { t } = useLanguage();
    const { customers } = useData();
    const { updateReconciliation } = useReconciliation();
    const { showNotification } = useNotification();
    const [customerResponse, setCustomerResponse] = useState(reconciliation.customerResponse || '');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(reconciliation.aiAnalysis || '');
    const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);

    const customer = useMemo(() => customers.find(c => c.id === reconciliation.customerId), [customers, reconciliation.customerId]);
    const relatedInvoices = useMemo(() => {
        const incoming = incomingInvoices.find(i => i.faturaNo === reconciliation.incomingInvoiceId);
        const outgoing = outgoingInvoices.find(i => i.faturaNo === reconciliation.outgoingInvoiceId);
        return { incoming, outgoing };
    }, [reconciliation, incomingInvoices, outgoingInvoices]);

    const handleDownloadPdf = async () => {
        if (customer && relatedInvoices.incoming && relatedInvoices.outgoing) {
            const result = await downloadReconciliationAsPdf(reconciliation, customer, [relatedInvoices.incoming, relatedInvoices.outgoing], t);
            if (result.success) {
                showNotification('reconciliationPdfDownloaded', 'success');
            } else {
                showNotification('pdfError', 'error');
            }
        }
    };

    const handleAnalyzeResponse = async () => {
        if (!customerResponse) return;
        setIsAnalyzing(true);
        const result = await analyzeDisagreement(customerResponse);
        if (result.success) {
            setAnalysisResult(result.text);
            await updateReconciliation(reconciliation.id, { aiAnalysis: result.text });
        } else {
            showNotification('aiError', 'error');
        }
        setIsAnalyzing(false);
    };

    const handleGenerateEmail = async (type: 'reminder' | 'agreement' | 'disagreement') => {
        if (!customer) return;
        setIsGeneratingEmail(true);
        const result = await generateReconciliationEmail(customer, t(reconciliation.type), reconciliation.period, reconciliation.amount);
        if (result.success) {
            const mailtoLink = `mailto:${customer.email}?subject=Mutabakat - ${reconciliation.period}&body=${encodeURIComponent(result.text)}`;
            window.open(mailtoLink, '_blank');
        } else {
            showNotification('aiError', 'error');
        }
        setIsGeneratingEmail(false);
    };

    if (!customer) return <p>{t('unknownCustomer')}</p>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Button onClick={onBack} icon="fas fa-arrow-left" variant="secondary">{t('backToList')}</Button>
                <div className="flex gap-2">
                    <Button onClick={handleDownloadPdf} icon="fas fa-file-pdf">{t('downloadPdf')}</Button>
                    <Button onClick={() => handleGenerateEmail('reminder')} icon="fas fa-envelope" isLoading={isGeneratingEmail}>{t('sendEmail')}</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                    <div className="p-4 bg-cnk-panel-light rounded-lg shadow-sm border">
                        <h3 className="font-bold text-lg mb-2">{t('reconciliationDetails')}</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <p><strong>{t('customer')}:</strong> {customer.name}</p>
                            <p><strong>{t('period')}:</strong> {reconciliation.period}</p>
                            <p><strong>{t('type')}:</strong> {t(reconciliation.type)}</p>
                            <p><strong>{t('amount')}:</strong> {formatCurrency(reconciliation.amount, reconciliation.currency)}</p>
                        </div>
                    </div>
                    <div className="p-4 bg-cnk-panel-light rounded-lg shadow-sm border">
                        <h3 className="font-bold text-lg mb-2">{t('matchedInvoices')}</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><strong>{t('incomingInvoices')}:</strong> <span className="font-mono">{relatedInvoices.incoming?.faturaNo}</span></div>
                            <div><strong>{t('outgoingInvoices')}:</strong> <span className="font-mono">{relatedInvoices.outgoing?.faturaNo}</span></div>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-cnk-panel-light rounded-lg shadow-sm border">
                    <h3 className="font-bold text-lg mb-2">{t('disagreementDetails')}</h3>
                    <textarea
                        value={customerResponse}
                        onChange={(e) => setCustomerResponse(e.target.value)}
                        rows={4}
                        placeholder={t('customerResponse')}
                        className="w-full p-2 border rounded-md"
                    />
                    <Button onClick={handleAnalyzeResponse} isLoading={isAnalyzing} disabled={!customerResponse} className="mt-2 w-full">{t('aiAnalyzeDisagreement')}</Button>
                    {analysisResult && <div className="mt-2 text-sm p-2 bg-cnk-bg-light rounded-md whitespace-pre-wrap">{analysisResult}</div>}
                </div>
            </div>
        </div>
    );
};


const ReconciliationPage = () => {
    const { t } = useLanguage();
    const { reconciliations, addReconciliation } = useReconciliation();
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();
    const { customers } = useData();

    const incomingInvoices = useLiveQuery(() => db.incomingInvoices.toArray(), []) || [];
    const outgoingInvoices = useLiveQuery(() => db.outgoingInvoices.toArray(), []) || [];
    
    const [selectedReconciliation, setSelectedReconciliation] = useState<Reconciliation | null>(null);

    const unmatchedInvoices = useMemo(() => {
        const matchedIncomingIds = new Set(reconciliations.map(r => r.incomingInvoiceId));
        const matchedOutgoingIds = new Set(reconciliations.map(r => r.outgoingInvoiceId));
        return {
            incoming: incomingInvoices.filter(i => !matchedIncomingIds.has(i.faturaNo)),
            outgoing: outgoingInvoices.filter(i => !matchedOutgoingIds.has(i.faturaNo)),
        };
    }, [reconciliations, incomingInvoices, outgoingInvoices]);

    const autoMatchedPairs = useMemo(() => {
        const pairs: MatchedPair[] = [];
        const unmatchedOutgoingCopy = [...unmatchedInvoices.outgoing];

        unmatchedInvoices.incoming.forEach(inc => {
            const perfectMatch = unmatchedOutgoingCopy.find(out => out.vergiNo === inc.vergiNo && out.tutar === inc.tutar);
            if (perfectMatch) {
                pairs.push({ incoming: inc, outgoing: perfectMatch, matchType: 'perfect' });
                unmatchedOutgoingCopy.splice(unmatchedOutgoingCopy.indexOf(perfectMatch), 1);
            }
        });
        return pairs;
    }, [unmatchedInvoices]);

    const handleCreateReconciliations = async () => {
        if (autoMatchedPairs.length === 0) {
            showNotification('noMatchesFound', 'warning');
            return;
        }
        let createdCount = 0;
        for (const pair of autoMatchedPairs) {
            const customer = customers.find(c => c.taxNumber === pair.incoming.vergiNo);
            if (customer) {
                await addReconciliation({
                    customerId: customer.id,
                    type: 'current_account',
                    period: new Date(pair.incoming.tarih).toISOString().slice(0, 7),
                    amount: pair.incoming.tutar,
                    currency: pair.incoming.currency,
                    incomingInvoiceId: pair.incoming.faturaNo,
                    outgoingInvoiceId: pair.outgoing.faturaNo,
                });
                createdCount++;
            }
        }
        if (createdCount > 0) {
            showNotification('reconciliationSuccess', 'success', { count: String(createdCount) });
        }
    };

    const getStatusClass = (status: Reconciliation['status']) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'sent': return 'bg-blue-100 text-blue-800';
            case 'in_review': return 'bg-purple-100 text-purple-800';
            case 'draft':
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    const reconciliationColumns = [
        { header: t('customer'), accessor: (item: Reconciliation) => customers.find(c => c.id === item.customerId)?.name || t('unknownCustomer') },
        { header: t('type'), accessor: (item: Reconciliation) => t(item.type) },
        { header: t('period'), accessor: (item: Reconciliation) => item.period },
        { header: t('amount'), accessor: (item: Reconciliation) => formatCurrency(item.amount, item.currency) },
        {
            header: t('status'),
            accessor: (item: Reconciliation) => <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(item.status)}`}>{t(item.status)}</span>
        },
        { header: t('createdAt'), accessor: (item: Reconciliation) => formatDate(item.createdAt) },
        {
            header: t('actions'),
            accessor: (item: Reconciliation) => <Button size="sm" onClick={() => setSelectedReconciliation(item)}>{t('details')}</Button>
        }
    ];

    const invoiceColumns = (type: 'incoming' | 'outgoing') => [
        { header: t('invoiceDate'), accessor: (item: any) => formatDate(item.tarih) },
        { header: type === 'incoming' ? t('supplier') : t('customer'), accessor: (item: any) => item.tedarikciAdi || item.musteriAdi },
        { header: t('taxID'), accessor: (item: any) => item.vergiNo },
        { header: t('invoiceNo'), accessor: (item: any) => item.faturaNo },
        { header: t('totalAmount'), accessor: (item: any) => formatCurrency(item.tutar, item.currency) },
    ];

    if (selectedReconciliation) {
        return <ReconciliationDetailView 
            reconciliation={selectedReconciliation} 
            onBack={() => setSelectedReconciliation(null)} 
            incomingInvoices={incomingInvoices}
            outgoingInvoices={outgoingInvoices}
        />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">{t('reconciliations')}</h1>
                <div className="flex gap-2">
                    <Button onClick={seedInitialData} variant="info">{t('loadSampleInvoices')}</Button>
                    <Button onClick={handleCreateReconciliations} variant="success" icon="fas fa-magic">{t('createReconciliationsForMatches', { count: String(autoMatchedPairs.length) })}</Button>
                </div>
            </div>

            <div className="bg-cnk-panel-light p-4 rounded-lg shadow-sm border">
                <h2 className="text-lg font-bold mb-2">{t('reconciliations')}</h2>
                <DataTable columns={reconciliationColumns} data={reconciliations} emptyStateMessage={t('noReconciliationYet')} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-cnk-panel-light p-4 rounded-lg shadow-sm border">
                    <h2 className="text-lg font-bold mb-2">{t('unmatchedIncoming')}</h2>
                    <DataTable columns={invoiceColumns('incoming')} data={unmatchedInvoices.incoming} />
                </div>
                <div className="bg-cnk-panel-light p-4 rounded-lg shadow-sm border">
                    <h2 className="text-lg font-bold mb-2">{t('unmatchedOutgoing')}</h2>
                    <DataTable columns={invoiceColumns('outgoing')} data={unmatchedInvoices.outgoing} />
                </div>
            </div>
        </div>
    );
};

export default ReconciliationPage;