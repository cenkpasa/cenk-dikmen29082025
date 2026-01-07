import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';

const CustomerSegmentChart = () => {
    const { t } = useLanguage();
    const { customers } = useData();

    const segmentData = useMemo(() => {
        const segments = {
            loyal: 0,
            high_potential: 0,
            at_risk: 0,
            new: 0,
        };
        customers.forEach(c => {
            if (c.segment) {
                segments[c.segment]++;
            } else {
                segments.new++; // Fallback for customers without a segment
            }
        });
        return [
            { name: t('loyalCustomer'), value: segments.loyal, color: 'bg-green-500' },
            { name: t('highPotential'), value: segments.high_potential, color: 'bg-blue-500' },
            { name: t('atRisk'), value: segments.at_risk, color: 'bg-amber-500' },
            { name: t('new'), value: segments.new, color: 'bg-slate-400' },
        ].filter(s => s.value > 0);
    }, [customers, t]);
    
    const total = customers.length;
    let accumulatedPercentage = 0;
    
    const conicGradient = segmentData.map(segment => {
        const percentage = (segment.value / total) * 100;
        const color = `var(--cnk-accent-${segment.color.split('-')[1]})`; // Get color from Tailwind config
        const startAngle = accumulatedPercentage;
        accumulatedPercentage += percentage;
        const endAngle = accumulatedPercentage;
        return `${color} ${startAngle}% ${endAngle}%`;
    }).join(', ');

    return (
        <div className="bg-cnk-panel-light p-5 rounded-xl shadow-sm border border-cnk-border-light h-full flex flex-col">
            <h3 className="font-bold text-lg text-cnk-txt-primary-light mb-4">{t('customerSegments')}</h3>
            <div className="flex-grow flex flex-col md:flex-row items-center justify-center gap-6">
                <div className="relative w-40 h-40">
                    <div 
                        className="w-full h-full rounded-full"
                        style={{ background: `conic-gradient(${conicGradient})`}}
                    ></div>
                    <div className="absolute inset-2 bg-cnk-panel-light rounded-full flex items-center justify-center">
                        <span className="text-3xl font-bold text-cnk-txt-primary-light">{total}</span>
                    </div>
                </div>
                <div className="text-sm space-y-2">
                    {segmentData.map(segment => (
                        <div key={segment.name} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${segment.color}`}></div>
                            <span>{segment.name}:</span>
                            <span className="font-semibold">{segment.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CustomerSegmentChart;
