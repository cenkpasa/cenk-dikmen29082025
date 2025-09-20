
import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Offer, OfferStatus, Customer } from '../types';
import { formatCurrency } from '../utils/formatting';
import Button from '../components/common/Button';
import { ViewState } from '../App';

const STAGES: OfferStatus[] = ['draft', 'sent', 'negotiation', 'won', 'lost'];

const PipelineCard = ({ offer, customer, onDragStart, setView }: { offer: Offer, customer?: Customer, onDragStart: (e: React.DragEvent<HTMLDivElement>, offerId: string) => void, setView: (view: ViewState) => void }) => {
    const { t } = useLanguage();
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, offer.id)}
            onClick={() => setView({ page: 'teklif-yaz', id: offer.id })}
            className="p-3 mb-3 bg-cnk-panel-light rounded-cnk-element border border-cnk-border-light shadow-sm cursor-pointer hover:shadow-md hover:border-cnk-accent-primary"
        >
            <p className="font-bold text-cnk-txt-primary-light text-sm">{offer.teklifNo}</p>
            <p className="text-xs text-cnk-txt-secondary-light truncate">{customer?.name || t('unknownCustomer')}</p>
            <p className="text-sm font-semibold text-cnk-accent-primary mt-2">{formatCurrency(offer.genelToplam, offer.currency)}</p>
        </div>
    );
};

const PipelineColumn = ({ status, offers, customerMap, onDragOver, onDrop, onDragStart, setView }: { status: OfferStatus, offers: Offer[], customerMap: Map<string, Customer>, onDragOver: (e: React.DragEvent<HTMLDivElement>) => void, onDrop: (e: React.DragEvent<HTMLDivElement>, status: OfferStatus) => void, onDragStart: (e: React.DragEvent<HTMLDivElement>, offerId: string) => void, setView: (view: ViewState) => void }) => {
    const { t } = useLanguage();
    const totalValue = offers.reduce((sum, offer) => sum + offer.genelToplam, 0);
    const count = offers.length;

    const statusColors = {
        draft: 'bg-gray-500',
        sent: 'bg-blue-500',
        negotiation: 'bg-yellow-500',
        won: 'bg-green-500',
        lost: 'bg-red-500',
    };

    return (
        <div 
            className="w-72 bg-cnk-bg-light rounded-cnk-card flex-shrink-0 p-3"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, status)}
        >
            <h3 className={`font-bold text-white px-3 py-1 rounded-md mb-3 flex justify-between items-center ${statusColors[status]}`}>
                <span>{t(status)}</span>
                <span className="text-xs font-mono bg-black/20 px-1.5 py-0.5 rounded">{count}</span>
            </h3>
            <p className="text-xs text-cnk-txt-muted-light text-center mb-3 font-semibold">{formatCurrency(totalValue, 'TRY')}</p>
            <div className="h-[calc(100vh-280px)] overflow-y-auto pr-1">
                {offers.map(offer => (
                    <PipelineCard key={offer.id} offer={offer} customer={customerMap.get(offer.customerId)} onDragStart={onDragStart} setView={setView} />
                ))}
            </div>
        </div>
    );
};

const SalesPipelinePage = ({ setView }: { setView: (view: ViewState) => void }) => {
    const { t } = useLanguage();
    const { offers, customers, updateOffer } = useData();
    const [draggedOfferId, setDraggedOfferId] = useState<string | null>(null);

    const customerMap = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);
    
    const offersByStatus = useMemo(() => {
        const grouped: Record<OfferStatus, Offer[]> = { draft: [], sent: [], negotiation: [], won: [], lost: [] };
        offers.forEach(offer => {
            if (offer.status) {
                grouped[offer.status].push(offer);
            } else {
                grouped.draft.push(offer); // Default to draft if status is missing
            }
        });
        return grouped;
    }, [offers]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, offerId: string) => {
        setDraggedOfferId(offerId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: OfferStatus) => {
        e.preventDefault();
        if (!draggedOfferId) return;

        const offerToMove = offers.find(o => o.id === draggedOfferId);
        if (offerToMove && offerToMove.status !== newStatus) {
            await updateOffer({ ...offerToMove, status: newStatus });
        }
        setDraggedOfferId(null);
    };

    const stats = useMemo(() => {
        const wonCount = offersByStatus.won.length;
        const lostCount = offersByStatus.lost.length;
        const totalClosed = wonCount + lostCount;
        const successRate = totalClosed > 0 ? (wonCount / totalClosed) * 100 : 0;
        return {
            wonValue: offersByStatus.won.reduce((sum, o) => sum + o.genelToplam, 0),
            lostValue: offersByStatus.lost.reduce((sum, o) => sum + o.genelToplam, 0),
            activeValue: [...offersByStatus.draft, ...offersByStatus.sent, ...offersByStatus.negotiation].reduce((sum, o) => sum + o.genelToplam, 0),
            successRate,
        };
    }, [offersByStatus]);
    
    const StatCard = ({ title, value, icon, color }: { title: string, value: string, icon: string, color: string }) => (
         <div className="bg-cnk-panel-light p-4 rounded-cnk-card shadow-sm border border-cnk-border-light flex items-center gap-4">
             <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${color}`}>
                 <i className={`fas ${icon}`}></i>
             </div>
             <div>
                 <p className="text-sm text-cnk-txt-muted-light">{title}</p>
                 <p className="text-xl font-bold text-cnk-txt-primary-light">{value}</p>
             </div>
         </div>
    );

    return (
        <div className="flex flex-col h-full">
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <StatCard title="Aktif Fırsatlar" value={formatCurrency(stats.activeValue, 'TRY')} icon="fa-tasks" color="bg-blue-100 text-blue-600" />
                <StatCard title="Kazanılan Fırsatlar" value={formatCurrency(stats.wonValue, 'TRY')} icon="fa-trophy" color="bg-green-100 text-green-600" />
                <StatCard title="Kaybedilen Fırsatlar" value={formatCurrency(stats.lostValue, 'TRY')} icon="fa-times-circle" color="bg-red-100 text-red-600" />
                <StatCard title={t('successRate')} value={`${stats.successRate.toFixed(1)}%`} icon="fa-chart-pie" color="bg-yellow-100 text-yellow-600" />
            </div>
            <div className="flex-grow overflow-x-auto pb-4">
                <div className="flex gap-4">
                    {STAGES.map(status => (
                        <PipelineColumn 
                            key={status} 
                            status={status} 
                            offers={offersByStatus[status]}
                            customerMap={customerMap}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onDragStart={handleDragStart}
                            setView={setView}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SalesPipelinePage;
