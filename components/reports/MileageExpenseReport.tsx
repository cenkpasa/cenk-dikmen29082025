import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { ReportFilters, MileageReportData } from '../../types';
import * as erpApiService from '../../services/erpApiService';
import Loader from '../common/Loader';

const ReportStyles = () => (
    <style>{`
        .report-container {
            font-family: Arial, sans-serif;
            font-size: 10pt;
            background-color: #ffffff;
            color: #000000;
            border: 2px solid #000000;
        }
        .report-header {
            padding: 8px;
            border-bottom: 2px solid #000000;
            background-color: #ffffff;
        }
        .report-title {
            text-align: center;
            font-weight: bold;
            font-size: 14pt;
            background-color: #c00000;
            color: #ffffff;
            padding: 5px;
            margin: -8px -8px 8px -8px;
            border-bottom: 2px solid black;
        }
        .report-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0;
        }
        .report-grid-left {
            display: grid;
            grid-template-columns: auto 1fr;
            align-items: center;
            gap: 4px 8px;
        }
        .report-grid-right {
            display: grid;
            grid-template-columns: auto auto;
            align-items: center;
            justify-content: end;
            gap: 4px 8px;
            border-left: 2px solid #000;
            padding-left: 8px;
        }
        .report-label {
            font-weight: bold;
            padding: 4px;
        }
        .report-value {
            border: 1px solid #a6a6a6;
            padding: 4px;
            background-color: #ffffff;
            text-align: left;
        }
        .report-value-right {
            text-align: right;
        }
        .report-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 0;
        }
        .report-table th, .report-table td {
            border: 1px solid #000000;
            padding: 4px;
            text-align: center;
        }
        .report-table th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        .report-table td {
            background-color: #ffffff;
        }
        .report-table .align-left { text-align: left; }
        .report-table .align-right { text-align: right; }
        .blank-row {
            height: 25px; /* Approximate height for a text row */
            background-color: #e7e6e6;
        }
    `}</style>
);

const MileageExpenseReport = ({ filters, onDataLoaded }: { filters: ReportFilters, onDataLoaded: (data: any) => void }) => {
    const { t } = useLanguage();
    const { currentUser } = useAuth();
    const [reportData, setReportData] = useState<MileageReportData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await erpApiService.fetchMileageReportData(filters.userId || currentUser!.id, filters.dateRange.start, filters.dateRange.end);
            setReportData(data);
            setLoading(false);
        };
        fetchData();
    }, [filters, currentUser]);

    const { totalDistance, totalReimbursement } = useMemo(() => {
        if (!reportData) return { totalDistance: 0, totalReimbursement: 0 };
        const distance = reportData.logs.reduce((sum, log) => sum + (log.endOdometer - log.startOdometer), 0);
        return {
            totalDistance: distance,
            totalReimbursement: distance * reportData.ratePerKm,
        };
    }, [reportData]);
    
    useEffect(() => {
        if(reportData){
            const exportableData = reportData.logs.map(log => ({
                [t('date')]: log.date,
                [t('startLocation')]: log.startLocation,
                [t('endLocation')]: log.endLocation,
                [t('descriptionNotes')]: log.description,
                [t('startOdometer')]: log.startOdometer,
                [t('endOdometer')]: log.endOdometer,
                'Mesafe': log.endOdometer - log.startOdometer,
            }));

            const exportColumns = [
                { header: t('date'), accessor: (r:any) => r[t('date')] },
                { header: t('startLocation'), accessor: (r:any) => r[t('startLocation')] },
                { header: t('endLocation'), accessor: (r:any) => r[t('endLocation')] },
                { header: t('descriptionNotes'), accessor: (r:any) => r[t('descriptionNotes')] },
                { header: t('startOdometer'), accessor: (r:any) => r[t('startOdometer')] },
                { header: t('endOdometer'), accessor: (r:any) => r[t('endOdometer')] },
                { header: 'Mesafe', accessor: (r:any) => r['Mesafe'] },
            ];

            onDataLoaded({ data: exportableData, columns: exportColumns, title: t('mileage_expense_report') });
        } else {
             onDataLoaded({ data: [], columns: [], title: t('mileage_expense_report') });
        }
    }, [reportData, t, onDataLoaded]);


    if (loading) return <div className="flex justify-center items-center h-96"><Loader /></div>;
    if (!reportData) return <div className="text-center p-8">Rapor verisi bulunamadı.</div>;

    const emptyRows = Array.from({ length: Math.max(0, 8 - reportData.logs.length) });

    return (
        <div className="report-container">
            <ReportStyles />
            <div className="report-header">
                <h2 className="report-title">{t('mileage_expense_report').toLocaleUpperCase('tr-TR')}</h2>
                <div className="report-grid">
                    <div className="report-grid-left">
                        <span className="report-label">{t('employeeName')}</span><span className="report-value">{reportData.employeeName}</span>
                        <span className="report-label">{t('employeeId')}</span><span className="report-value">{reportData.employeeId}</span>
                        <span className="report-label">{t('vehicleDescription')}</span><span className="report-value">{reportData.vehicleDescription}</span>
                        <span className="report-label">{t('authorizer')}</span><span className="report-value">{reportData.authorizer}</span>
                    </div>
                    <div className="report-grid-right">
                        <span className="report-label">{t('ratePerKm')}</span><div className="report-value report-value-right">{reportData.ratePerKm.toFixed(2)} ₺</div>
                        <span className="report-label">{t('coveredPeriod')}</span><div className="report-value report-value-right">{`${reportData.periodStart} Bitiş ${reportData.periodEnd}`}</div>
                        <span className="report-label">{t('totalDistance')}</span><div className="report-value report-value-right">{totalDistance}</div>
                        <span className="report-label">{t('totalReimbursement')}</span><div className="report-value report-value-right">{totalReimbursement.toFixed(2)} ₺</div>
                    </div>
                </div>
            </div>
            <table className="report-table">
                <thead>
                    <tr>
                        <th style={{width: '10%'}}>{t('date')}</th>
                        <th style={{width: '15%'}}>{t('startLocation')}</th>
                        <th style={{width: '15%'}}>{t('endLocation')}</th>
                        <th style={{width: '30%'}}>{t('descriptionNotes')}</th>
                        <th style={{width: '15%'}}>{t('startOdometer')}</th>
                        <th style={{width: '15%'}}>{t('endOdometer')}</th>
                    </tr>
                </thead>
                <tbody>
                    {reportData.logs.map(log => (
                        <tr key={log.id}>
                            <td>{log.date}</td>
                            <td className="align-left">{log.startLocation}</td>
                            <td className="align-left">{log.endLocation}</td>
                            <td className="align-left">{log.description}</td>
                            <td className="align-right">{log.startOdometer}</td>
                            <td className="align-right">{log.endOdometer}</td>
                        </tr>
                    ))}
                    {emptyRows.map((_, index) => (
                        <tr key={`blank-${index}`}>
                            <td className="blank-row" colSpan={6}></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default MileageExpenseReport;