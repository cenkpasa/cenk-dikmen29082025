import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { analyze3DModelForManufacturability } from '../services/aiService';
import { DFMAnalysisItem, QuoteEstimation, OfferItem } from '../types';
import { ViewState } from '../App';
import { formatCurrency } from '../utils/formatting';
import { v4 as uuidv4 } from 'uuid';

interface ManufacturingAnalysisPageProps {
    setView: (view: ViewState) => void;
}

// Fix: Standard props in list rendering handled via explicit component type
const DfmCard: React.FC<{ item: DFMAnalysisItem }> = ({ item }) => {
    const { t } = useLanguage();
    const colors = {
        critical: 'border-red-500 bg-red-500/10 text-red-700',
        warning: 'border-amber-500 bg-amber-500/10 text-amber-700',
        info: 'border-blue-500 bg-blue-500/10 text-blue-700',
    };
    const icons = {
        critical: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle',
    };

    return (
        <div className={`p-4 rounded-lg border-l-4 ${colors[item.issueType]}`}>
            <h4 className="font-bold flex items-center gap-2">
                <i className={icons[item.issueType]}></i>
                {t(item.issueType)}
            </h4>
            <p className="text-sm text-cnk-txt-secondary-light mt-1"><strong>{t('issue')}:</strong> {item.description}</p>
            <p className="text-sm text-cnk-txt-secondary-light mt-1"><strong>{t('suggestion')}:</strong> {item.suggestion}</p>
        </div>
    );
};

const ManufacturingAnalysisPage = ({ setView }: ManufacturingAnalysisPageProps) => {
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const [viewState, setViewState] = useState<'upload' | 'analyzing' | 'report'>('upload');
    const [fileName, setFileName] = useState<string | null>(null);
    const [dfmResult, setDfmResult] = useState<DFMAnalysisItem[] | null>(null);
    const [quoteResult, setQuoteResult] = useState<QuoteEstimation | null>(null);
    const [analysisMessage, setAnalysisMessage] = useState('');

    const analysisSteps = [
        "Model geometrisi doğrulanıyor...",
        "İnce duvar tespiti yapılıyor...",
        "İşlenemez bölgeler taranıyor...",
        "Ters açılar kontrol ediliyor...",
        "Malzeme maliyeti hesaplanıyor...",
        "İşleme süresi tahmin ediliyor...",
        "Rapor oluşturuluyor..."
    ];

    useEffect(() => {
        // Fix: Use any to avoid conflict between browser and NodeJS timer types
        let interval: any;
        if (viewState === 'analyzing') {
            let step = 0;
            setAnalysisMessage(analysisSteps[step]);
            interval = window.setInterval(() => {
                step++;
                if (step < analysisSteps.length) {
                    setAnalysisMessage(analysisSteps[step]);
                } else {
                    window.clearInterval(interval);
                }
            }, 800);
        }
        return () => {
            if (interval) window.clearInterval(interval);
        };
    }, [viewState]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            setViewState('upload');
            setDfmResult(null);
            setQuoteResult(null);
        }
    };

    const handleAnalyze = async () => {
        if (!fileName) {
            showNotification('noFileSelected', 'error');
            return;
        }
        setViewState('analyzing');
        try {
            const result = await analyze3DModelForManufacturability("simulated_3d_model_data");
            if (result.success) {
                setDfmResult(result.dfmAnalysis);
                setQuoteResult(result.quoteEstimation);
                setViewState('report');
            } else {
                showNotification('aiError', 'error');
                setViewState('upload');
            }
        } catch (e) {
            showNotification('aiError', 'error');
            setViewState('upload');
        }
    };

    const handleCreateOffer = () => {
        if (!quoteResult) return;

        const offerItems: OfferItem[] = quoteResult.lineItems.map(item => ({
            id: uuidv4(),
            cins: item.description,
            miktar: item.quantity,
            birim: 'Adet',
            fiyat: item.unitPrice,
            tutar: item.totalPrice,
            teslimSuresi: '1 Hafta', // Default value
        }));
        
        sessionStorage.setItem('analysisQuoteData', JSON.stringify(offerItems));
        
        showNotification("Teklif kalemleri yeni teklif formuna aktarıldı.", "info");
        setView({ page: 'teklif-yaz', id: 'create' });
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">{t('manufacturing-analysis')}</h1>

            {viewState === 'upload' && (
                <div className="bg-cnk-panel-light p-6 rounded-xl shadow-sm border border-cnk-border-light flex flex-col items-center justify-center text-center min-h-[250px]">
                    <i className="fas fa-cube text-5xl text-cnk-accent-primary mb-4"></i>
                    <h2 className="font-bold text-lg">{t('upload3DModel')}</h2>
                    <p className="text-cnk-txt-muted-light text-sm max-w-sm">Üretilebilirlik (DFM) analizi ve anında fiyat tahmini almak için 3D model dosyanızı (.step, .iges, .stl) yükleyin.</p>
                    <div className="flex items-center gap-4 mt-6">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".step,.stp,.iges,.igs,.stl" className="hidden"/>
                        <Button variant="secondary" onClick={() => fileInputRef.current?.click()} icon="fas fa-upload">{fileName || t('select')}</Button>
                        <Button onClick={handleAnalyze} disabled={!fileName} icon="fas fa-cogs">{t('analyzeForManufacturability')}</Button>
                    </div>
                </div>
            )}
            
            {viewState === 'analyzing' && (
                <div className="bg-cnk-panel-light p-8 rounded-xl shadow-sm border border-cnk-border-light flex flex-col items-center justify-center text-center min-h-[250px]">
                    <Loader />
                    <p className="mt-4 font-semibold text-lg text-cnk-txt-secondary-light">{analysisMessage}</p>
                    <p className="text-cnk-txt-muted-light">Yapay zeka modeli analiz ediyor, bu işlem biraz zaman alabilir...</p>
                </div>
            )}
            
            {viewState === 'report' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {dfmResult && (
                        <div className="bg-cnk-panel-light p-6 rounded-xl shadow-sm border border-cnk-border-light">
                            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><i className="fas fa-clipboard-check text-cnk-accent-primary"></i> {t('dfmReport')}</h2>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                {dfmResult.map((item, index) => <DfmCard key={index} item={item} />)}
                            </div>
                        </div>
                    )}
                    {quoteResult && (
                         <div className="bg-cnk-panel-light p-6 rounded-xl shadow-sm border border-cnk-border-light">
                            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><i className="fas fa-dollar-sign text-cnk-accent-green"></i> {t('quoteEstimation')}</h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-cnk-txt-muted-light">{t('materialCost')}:</span> <span>{formatCurrency(quoteResult.materialCost, 'TRY')}</span></div>
                                <div className="flex justify-between"><span className="text-cnk-txt-muted-light">{t('machiningCost')}:</span> <span>{formatCurrency(quoteResult.machiningCost, 'TRY')}</span></div>
                                <div className="flex justify-between"><span className="text-cnk-txt-muted-light">{t('setupCost')}:</span> <span>{formatCurrency(quoteResult.setupCost, 'TRY')}</span></div>
                                <div className="flex justify-between font-bold border-t pt-2 mt-2"><span className="text-cnk-txt-secondary-light">{t('totalEstimatedCost')}:</span> <span>{formatCurrency(quoteResult.totalEstimatedCost, 'TRY')}</span></div>
                                <div className="flex justify-between font-bold text-lg text-green-600 bg-green-50 p-2 rounded-md"><span >{t('suggestedQuotePrice')}:</span> <span>{formatCurrency(quoteResult.suggestedQuotePrice, 'TRY')}</span></div>
                            </div>
                            <Button onClick={handleCreateOffer} icon="fas fa-file-invoice-dollar" className="w-full mt-4">{t('createOfferFromAnalysis')}</Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ManufacturingAnalysisPage;