import React, { useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Appointment, Offer, Interview } from '@/types';
import { formatDate, formatCurrency } from '@/utils/formatting';

type TimelineItem = (Appointment | Offer | Interview) & { type: 'appointment' | 'offer' | 'interview' };

interface ActivityTimelineProps {
    customerId: string;
}

const getItemDate = (item: TimelineItem): Date => {
    switch (item.type) {
        case 'appointment': return new Date((item as Appointment).start);
        case 'interview': return new Date((item as Interview).formTarihi);
        case 'offer': return new Date((item as Offer).createdAt);
        default: return new Date();
    }
};

const ActivityTimeline = ({ customerId }: ActivityTimelineProps) => {
    const { appointments, offers, interviews } = useData();

    const timelineItems = useMemo(() => {
        const items: TimelineItem[] = [];

        appointments.filter(a => a.customerId === customerId).forEach(a => items.push({ ...a, type: 'appointment' }));
        offers.filter(o => o.customerId === customerId).forEach(o => items.push({ ...o, type: 'offer' }));
        interviews.filter(i => i.customerId === customerId).forEach(i => items.push({ ...i, type: 'interview' }));
        
        return items.sort((a, b) => getItemDate(b).getTime() - getItemDate(a).getTime());
    }, [customerId, appointments, offers, interviews]);
    
    const getIconInfo = (type: TimelineItem['type']) => {
        const iconMap = {
            appointment: { icon: 'fa-calendar-check', color: 'bg-cnk-accent-green', text: 'text-cnk-accent-green' },
            offer: { icon: 'fa-file-invoice-dollar', color: 'bg-cnk-accent-primary', text: 'text-cnk-accent-primary' },
            interview: { icon: 'fa-comments', color: 'bg-cnk-accent-yellow', text: 'text-cnk-accent-yellow' },
        };
        return iconMap[type];
    };
    
    const renderItemContent = (item: TimelineItem) => {
        const date = getItemDate(item);
        const iconInfo = getIconInfo(item.type);
        
        let title = '';
        let details: React.ReactNode = null;
        
        switch (item.type) {
            case 'appointment':
                const app = item as Appointment;
                title = `Randevu: ${app.title}`;
                details = <p className="text-sm text-cnk-txt-muted-light">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>;
                break;
            case 'offer':
                const offer = item as Offer;
                title = `Teklif Gönderildi: #${offer.teklifNo}`;
                details = <p className="text-sm font-semibold">{formatCurrency(offer.genelToplam, offer.currency)}</p>;
                break;
            case 'interview':
                const interview = item as Interview;
                title = 'Görüşme Yapıldı';
                details = <p className="text-sm text-cnk-txt-muted-light">Yapan: {interview.gorusmeyiYapan}</p>;
                break;
        }

        return (
            <div className="ml-10">
                <div className={`absolute w-10 h-10 ${iconInfo.color} rounded-full -left-5 border-4 border-white flex items-center justify-center`}>
                    <i className={`fas ${iconInfo.icon} text-white`}></i>
                </div>
                <div className="p-4 bg-cnk-bg-light rounded-lg border border-cnk-border-light">
                    <div className="flex justify-between items-center">
                        <h3 className={`font-semibold ${iconInfo.text}`}>{title}</h3>
                        <time className="text-xs font-medium text-cnk-txt-muted-light">{formatDate(date.toISOString())}</time>
                    </div>
                    {details}
                </div>
            </div>
        );
    };

    if (timelineItems.length === 0) {
        return <div className="text-center p-4 text-sm text-cnk-txt-muted-light bg-cnk-bg-light rounded-md">Bu müşteri için henüz bir etkinlik kaydedilmemiş.</div>;
    }

    return (
        <div className="relative border-l-2 border-cnk-accent-primary/20">
            {timelineItems.map((item, index) => (
                <div key={`${item.type}-${item.id}-${index}`} className="mb-8 relative">
                    {renderItemContent(item)}
                </div>
            ))}
        </div>
    );
};

export default ActivityTimeline;