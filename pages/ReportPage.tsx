import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useReportGenerator } from '../hooks/useReportGenerator';
import { exportToExcel, exportToPdf } from '../services/exportService';
import Button from '../components/common/Button';
import DataTable from '../components/common/DataTable';
import InvoiceAnalysisChart from '../components/reports/InvoiceAnalysisChart';
import { ReportType, ReportFilters } from '../types';
import MileageExpenseReport from '../components/reports/MileageExpenseReport';
import ProfitAndLossReport from '../components/reports/ProfitAndLossReport';

const ReportControls = ({ filters, setFilters, isAdmin }: { filters: ReportFilters, setFilters: React.Dispatch<React.SetStateAction<ReportFilters>>, isAdmin: boolean }) => {
    const { t } = useLanguage();
    const { users } = useAuth();

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'startDate' || name === 'endDate') {
            setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, [name === 'startDate' ? 'start' : 'end']: value } }));
        } else if (name === 'reportType') {
             setFilters(prev => ({ ...prev, reportType: value as ReportType }));
        } else {
            setFilters(prev => ({...prev, [name]: value}));
        }
    };
    
    return (
        <div className="bg-cnk-panel-light p-4 rounded-xl shadow-sm border border-cnk-border-light">
            <h3 className="font-bold text-lg mb-4">Raporlama Filtreleri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <label htmlFor="reportType" className="text-sm font-medium">Rapor Türü</label>
                    <select name="reportType" id="reportType" value={filters.reportType} onChange={handleFilterChange} className="w-full mt-1 p-2 border rounded-md">
                        <option value="sales_performance">Personel Satış Performansı</option>
                        <option value="customer_invoice_analysis">{t('customer_invoice_analysis')}</option>
                        <option value="ai_analysis_summary">{t('ai_analysis_summary')}</option>
                        <option value="customer_segmentation">{t('customer_segmentation')}</option>
                        <option value="offer_success_analysis">{t('offer_success_analysis')}</option>
                        <option value="mileage_expense_report">{t('mileage_expense_report')}</option>
                        <option value="profit_loss_statement">{t('profit_loss_statement')}</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="startDate" className="text-sm font-medium">Başlangıç Tarihi</label>
                    <input type="date" name="startDate" id="startDate" value={filters.dateRange.start} onChange={handleFilterChange} className="w-full mt-1 p-2 border rounded-md" />
                </div>
                <div>
                    <label htmlFor="endDate" className="text-sm font-medium">Bitiş Tarihi</label>
                    <input type="date" name="endDate" id="endDate" value={filters.dateRange.end} onChange={handleFilterChange} className="w-full mt-1 p-2 border rounded-md" />
                </div>
                {isAdmin && (
                    <div>
                        <label htmlFor="userId" className="text-sm font-medium">Personel</label>
                        <select name="userId" id="userId" value={filters.userId || ''} onChange={handleFilterChange} className="w-full mt-1 p-2 border rounded-md">
                            <option value="">Tüm Personeller</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
};

const GenericReportDisplay = ({ filters, onDataLoaded }: { filters: ReportFilters, onDataLoaded: (data: any) => void }) => {
    const { data, columns, title, summary, chartData } = useReportGenerator(filters);
    const { t } = useLanguage();

    useEffect(() => {
        onDataLoaded({ data, columns: columns.map(c => ({...c, header: t(c.header)})), title });
    }, [data, columns, title, onDataLoaded, t]);

    if (!data) return null;

    return (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DataTable columns={columns.map(c => ({...c, header: t(c.header)}))} data={data} />
            <div>
                {filters.reportType === 'customer_invoice_analysis' && chartData && <InvoiceAnalysisChart chartData={chartData} />}
                <div className="mt-4 p-4 bg-cnk-bg-light rounded-lg">
                    <h3 className="font-bold mb-2">Özet</h3>
                    {Object.entries(summary).map(([key, value]) => (
                        <p key={key}><strong>{t(key)}:</strong> {value}</p>
                    ))}
                </div>
            </div>
        </div>
    );
};


const ReportPage = () => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const [filters, setFilters] = useState<ReportFilters>({
        reportType: 'sales_performance',
        dateRange: { start: new Date(new Date().setDate(1)).toISOString().slice(0,10), end: new Date().toISOString().slice(0,10) },
        userId: currentUser?.role === 'admin' ? '' : currentUser?.id,
    });

    const [exportable, setExportable] = useState<{data: any[], columns: any[], title: string}>({ data: [], columns: [], title: '' });

    const handleDataLoaded = useCallback((data: { data: any[], columns: any[], title: string }) => {
        setExportable(data);
    }, []);

    const renderReport = () => {
        switch(filters.reportType) {
            case 'mileage_expense_report':
                return <MileageExpenseReport filters={filters} onDataLoaded={handleDataLoaded} />;
            case 'profit_loss_statement':
                return <ProfitAndLossReport filters={filters} onDataLoaded={handleDataLoaded} />;
            default:
                return <GenericReportDisplay filters={filters} onDataLoaded={handleDataLoaded} />;
        }
    };
    
    return (
        <div className="space-y-6">
            <ReportControls filters={filters} setFilters={setFilters} isAdmin={currentUser?.role === 'admin'} />

            <div className="bg-cnk-panel-light p-4 rounded-xl shadow-sm border border-cnk-border-light">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{exportable.title}</h2>
                    <div className="flex gap-2">
                        <Button onClick={() => exportToExcel(exportable.data, exportable.columns, exportable.title)} className="px-3 py-1 bg-green-600 text-white rounded-md text-sm">Excel'e Aktar</Button>
                        <Button onClick={() => exportToPdf(exportable.data, exportable.columns, exportable.title, exportable.title)} className="px-3 py-1 bg-red-600 text-white rounded-md text-sm">PDF'e Aktar</Button>
                    </div>
                </div>
                
                {renderReport()}
            </div>
        </div>
    );
};

export default ReportPage;