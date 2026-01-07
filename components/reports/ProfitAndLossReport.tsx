import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ReportFilters, FinancialData, FinancialAccountData } from '../../types';
import * as erpApiService from '../../services/erpApiService';
import Loader from '../common/Loader';

const ReportStyles = () => (
    <style>{`
        .pl-report {
            font-family: Arial, sans-serif;
            font-size: 9pt;
            background: #fff;
            color: #000;
            border: 1px solid #000;
        }
        .pl-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 5px 10px;
            background: #fff;
        }
        .pl-title {
            font-size: 14pt;
            font-weight: bold;
        }
        .pl-tabs {
            display: flex;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            background-color: #f2f2f2;
        }
        .pl-tab {
            padding: 5px 15px;
            border: 1px solid #000;
            border-width: 0 1px 0 0;
            cursor: pointer;
            background: #e7e6e6;
        }
        .pl-tab.active {
            background: #fff;
            font-weight: bold;
            border-bottom-color: #fff;
            position: relative;
            top: 1px;
        }
        .pl-table-container {
            padding: 5px;
        }
        .pl-table {
            width: 100%;
            border-collapse: collapse;
        }
        .pl-table th, .pl-table td {
            border: 1px solid #a6a6a6;
            padding: 2px 4px;
            text-align: right;
            min-width: 60px;
        }
        .pl-table th.header-group {
            text-align: center;
            font-weight: bold;
            background: #fff;
            border: 1px solid #000;
        }
        .pl-table th {
            background-color: #e7e6e6;
            font-weight: bold;
        }
        .pl-table td.row-header {
            text-align: left;
            font-weight: bold;
            background: #fff;
            min-width: 150px;
        }
        .pl-table .total-row td {
            font-weight: bold;
            background-color: #e7e6e6;
            border-top: 2px solid #000;
        }
        .pl-table .profit-row td {
            font-weight: bold;
            background-color: #c6efce; /* Light green */
            border: 1px solid #000;
        }
        .pl-table .negative {
            color: red;
        }
        .sparkline { display: inline-block; width: 50px; height: 16px; vertical-align: middle; margin-left: 5px; }
    `}</style>
);

const Sparkline = ({ data }: { data: number[] }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min;
    if (range === 0) return null;
    const points = data.map((d, i) => `${i * (50 / 11)},${16 - ((d - min) / range) * 14}`).join(' ');

    return (
        <svg className="sparkline" viewBox="0 0 50 16">
            <polyline points={points} stroke="#777" strokeWidth="1" fill="none" />
        </svg>
    );
};

const ProfitAndLossReport = ({ filters, onDataLoaded }: { filters: ReportFilters, onDataLoaded: (data: any) => void }) => {
    const { t } = useLanguage();
    const [data, setData] = useState<FinancialData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'revenue' | 'cogs' | 'expenses'>('revenue');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const year = new Date(filters.dateRange.start).getFullYear();
            const result = await erpApiService.fetchProfitLossData(year);
            setData(result);
            setLoading(false);
        };
        fetchData();
    }, [filters]);

    const calculations = useMemo(() => {
        if (!data) return null;
        const calc = (accounts: FinancialAccountData[]) => {
            const monthlyTotals = Array(12).fill(0);
            accounts.forEach(acc => {
                acc.monthlyValues.forEach((val, i) => monthlyTotals[i] += val);
            });
            const annualTotal = monthlyTotals.reduce((a, b) => a + b, 0);
            return { monthlyTotals, annualTotal };
        };

        const revenues = calc(data.revenues);
        const cogs = calc(data.cogs);
        const expenses = calc(data.expenses);

        const grossProfit = {
            monthlyTotals: revenues.monthlyTotals.map((r, i) => r - cogs.monthlyTotals[i]),
            annualTotal: revenues.annualTotal - cogs.annualTotal
        };

        const netProfit = {
            monthlyTotals: grossProfit.monthlyTotals.map((gp, i) => gp - expenses.monthlyTotals[i]),
            annualTotal: grossProfit.annualTotal - expenses.annualTotal
        };

        return { revenues, cogs, expenses, grossProfit, netProfit };
    }, [data]);
    
    useEffect(() => {
        if (calculations && data) {
            const getExportableData = () => {
                 const { revenues, cogs, expenses, grossProfit, netProfit } = calculations;
                 const commonHeaders = ['Bölüm', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara', 'Yıllık'];

                 switch (activeTab) {
                    case 'revenue':
                        return { 
                            data: [ ...data.revenues.map(r => ({Bölüm: r.name, ...r.monthlyValues, Yıllık: r.monthlyValues.reduce((s,v)=>s+v,0)})), {Bölüm: 'Toplam', ...revenues.monthlyTotals, Yıllık: revenues.annualTotal} ],
                            columns: commonHeaders.map(h => ({ header: h, accessor: (r: any) => r[h] })),
                            title: `${t('revenue')} - ${data.year}`
                        };
                    case 'cogs':
                        return {
                            data: [ ...data.cogs.map(r => ({Bölüm: r.name, ...r.monthlyValues, Yıllık: r.monthlyValues.reduce((s,v)=>s+v,0)})), {Bölüm: 'Toplam', ...cogs.monthlyTotals, Yıllık: cogs.annualTotal}, {Bölüm: 'Brüt Kar', ...grossProfit.monthlyTotals, Yıllık: grossProfit.annualTotal} ],
                            columns: commonHeaders.map(h => ({ header: h, accessor: (r: any) => r[h] })),
                            title: `${t('cogs')} - ${data.year}`
                        };
                    case 'expenses':
                         return {
                            data: [ ...data.expenses.map(r => ({Bölüm: r.name, ...r.monthlyValues, Yıllık: r.monthlyValues.reduce((s,v)=>s+v,0)})), {Bölüm: 'Toplam', ...expenses.monthlyTotals, Yıllık: expenses.annualTotal}, {Bölüm: 'Net Kar', ...netProfit.monthlyTotals, Yıllık: netProfit.annualTotal} ],
                            columns: commonHeaders.map(h => ({ header: h, accessor: (r: any) => r[h] })),
                            title: `${t('expenses')} - ${data.year}`
                        };
                 }
            };
            const exportable = getExportableData();
            onDataLoaded(exportable);
        } else {
            onDataLoaded({ data: [], columns: [], title: t('profit_loss_statement') });
        }
    }, [data, calculations, activeTab, t, onDataLoaded]);


    if (loading) return <div className="flex justify-center items-center h-96"><Loader /></div>;
    if (!data || !calculations) return <div className="text-center p-8">Rapor verisi bulunamadı.</div>;

    const { revenues, cogs, expenses, grossProfit, netProfit } = calculations;

    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

    const renderTable = (accounts: FinancialAccountData[], totals: { monthlyTotals: number[], annualTotal: number }, parentTotals: { annualTotal: number }, profitRow?: {label: string, data: { monthlyTotals: number[], annualTotal: number}}) => {
        return (
            <table className="pl-table">
                <thead>
                    <tr>
                        <th className="header-group" rowSpan={2}>Bölüm</th>
                        <th className="header-group" colSpan={13}>AYLAR {data.year}</th>
                        <th className="header-group" colSpan={13}>%</th>
                    </tr>
                    <tr>
                        {months.map(m => <th key={m}>{m}</th>)}
                        <th>Yıllık</th>
                        {months.map(m => <th key={`${m}-pct`}>{m}</th>)}
                        <th>Yıllık</th>
                    </tr>
                </thead>
                <tbody>
                    {accounts.map(acc => {
                        const annual = acc.monthlyValues.reduce((a, b) => a + b, 0);
                        return (
                            <tr key={acc.name}>
                                <td className="row-header">{acc.name} <Sparkline data={acc.monthlyValues} /></td>
                                {acc.monthlyValues.map((v, i) => <td key={i}>{v.toLocaleString()} ₺</td>)}
                                <td>{annual.toLocaleString()} ₺</td>
                                {acc.monthlyValues.map((v, i) => <td key={`${i}-pct`}>{parentTotals.annualTotal > 0 ? `${(v * 100 / totals.monthlyTotals[i]).toFixed(0)}%` : '0%'}</td>)}
                                <td>{parentTotals.annualTotal > 0 ? `${(annual * 100 / totals.annualTotal).toFixed(0)}%` : '0%'}</td>
                            </tr>
                        );
                    })}
                    <tr className="total-row">
                        <td className="row-header">TOPLAM</td>
                        {totals.monthlyTotals.map((v, i) => <td key={i}>{v.toLocaleString()} ₺</td>)}
                        <td>{totals.annualTotal.toLocaleString()} ₺</td>
                        {Array(13).fill(null).map((_,i) => <td key={`total-pct-${i}`}>100%</td>)}
                    </tr>
                    {profitRow && (
                        <tr className="profit-row">
                             <td className="row-header">{profitRow.label}</td>
                             {profitRow.data.monthlyTotals.map((v,i) => <td key={i} className={v < 0 ? 'negative' : ''}>{v.toLocaleString()} ₺</td>)}
                             <td className={profitRow.data.annualTotal < 0 ? 'negative' : ''}>{profitRow.data.annualTotal.toLocaleString()} ₺</td>
                             {profitRow.data.monthlyTotals.map((v,i) => <td key={`profit-pct-${i}`}>{revenues.monthlyTotals[i] > 0 ? `${(v*100/revenues.monthlyTotals[i]).toFixed(0)}%` : '0%'}</td>)}
                             <td>{revenues.annualTotal > 0 ? `${(profitRow.data.annualTotal*100/revenues.annualTotal).toFixed(0)}%` : '0%'}</td>
                        </tr>
                    )}
                </tbody>
            </table>
        );
    };

    return (
        <div className="pl-report">
            <ReportStyles />
            <div className="pl-header">
                <span className="muted">On İki Ay</span>
                <span className="pl-title">KAR VE ZARAR PLANLAMASI</span>
                <div>
                    <span className="muted">MALİ YIL BAŞLANGICI:</span> OCA {data.year}
                </div>
            </div>
            <div className="pl-tabs">
                <div onClick={() => setActiveTab('revenue')} className={`pl-tab ${activeTab === 'revenue' ? 'active' : ''}`}>{t('revenue')}</div>
                <div onClick={() => setActiveTab('cogs')} className={`pl-tab ${activeTab === 'cogs' ? 'active' : ''}`}>{t('cogs')}</div>
                <div onClick={() => setActiveTab('expenses')} className={`pl-tab ${activeTab === 'expenses' ? 'active' : ''}`}>{t('expenses')}</div>
            </div>
            <div className="pl-table-container">
                {activeTab === 'revenue' && renderTable(data.revenues, revenues, revenues)}
                {activeTab === 'cogs' && renderTable(data.cogs, cogs, revenues, { label: 'Brüt Kar', data: grossProfit })}
                {activeTab === 'expenses' && renderTable(data.expenses, expenses, revenues, { label: 'Net Kar', data: netProfit })}
            </div>
        </div>
    );
};

export default ProfitAndLossReport;