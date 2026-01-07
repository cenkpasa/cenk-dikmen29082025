import React, { useState, useMemo, useEffect } from 'react';
import { User, PayrollEntry } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatCurrency } from '../../utils/formatting';

const StatCard = ({ label, value }: { label: string; value: string | number }) => (
    <div className="bg-cnk-bg-light p-4 rounded-lg text-center border border-cnk-border-light shadow-sm">
        <p className="text-sm font-medium text-cnk-txt-muted-light">{label}</p>
        <p className="text-2xl font-bold text-cnk-accent-primary">{value}</p>
    </div>
);

const DetailRow = ({ label, value }: { label: string, value: number }) => (
    <div className="flex justify-between items-center py-2 border-b border-cnk-border-light">
        <span className="text-cnk-txt-secondary-light">{label}</span>
        <span className="font-semibold text-cnk-txt-primary-light">{formatCurrency(value, 'TRY')}</span>
    </div>
);

const PersonnelPayrollTab = ({ personnel }: { personnel: User }) => {
    const { t } = useLanguage();
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));

    const availableMonths = useMemo(() => {
        return [...new Set(personnel.payrollHistory?.map(p => p.month) || [])].sort().reverse();
    }, [personnel.payrollHistory]);
    
    useEffect(() => {
        if(availableMonths.length > 0 && !availableMonths.includes(selectedMonth)){
            setSelectedMonth(availableMonths[0]);
        }
    }, [availableMonths, selectedMonth]);

    const payrollData = useMemo(() => {
        return personnel.payrollHistory?.find(p => p.month === selectedMonth) || null;
    }, [personnel.payrollHistory, selectedMonth]);

    const totalDeductions = payrollData ? (payrollData.sgkWorker + payrollData.unemploymentWorker + payrollData.incomeTax + payrollData.stampTax) : 0;

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <label htmlFor="payroll-month" className="font-semibold">{t('payrollMonth')}:</label>
                <select 
                    id="payroll-month" 
                    value={selectedMonth} 
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="p-2 border border-cnk-border-light bg-cnk-bg-light rounded-md"
                >
                    {availableMonths.length > 0 ? (
                        availableMonths.map(month => (
                            <option key={month} value={month}>
                                {new Date(`${month}-02`).toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}
                            </option>
                        ))
                    ) : (
                        <option disabled>{t('noPayrollData')}</option>
                    )}
                </select>
            </div>

            {payrollData ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard label={t('grossSalary')} value={formatCurrency(payrollData.grossSalary, 'TRY')} />
                        <StatCard label={t('netSalary')} value={formatCurrency(payrollData.netSalary, 'TRY')} />
                        <StatCard label={t('employerCost')} value={formatCurrency(payrollData.totalEmployerCost, 'TRY')} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-cnk-panel-light p-4 rounded-lg border border-cnk-border-light">
                            <h3 className="font-bold text-lg mb-3">{t('earnings')} & {t('deductions')}</h3>
                            <DetailRow label={t('grossSalary')} value={payrollData.grossSalary} />
                            <DetailRow label={t('sgkWorker')} value={-payrollData.sgkWorker} />
                            <DetailRow label={t('unemploymentWorker')} value={-payrollData.unemploymentWorker} />
                            <DetailRow label={t('incomeTax')} value={-payrollData.incomeTax} />
                            <DetailRow label={t('stampTax')} value={-payrollData.stampTax} />
                            <div className="flex justify-between items-center py-2 font-bold border-t-2 border-cnk-txt-primary-light mt-2">
                                <span>{t('netSalary')}</span>
                                <span>{formatCurrency(payrollData.netSalary, 'TRY')}</span>
                            </div>
                        </div>
                        <div className="bg-cnk-panel-light p-4 rounded-lg border border-cnk-border-light">
                             <h3 className="font-bold text-lg mb-3">{t('payrollSummary')}</h3>
                             <DetailRow label={t('grossSalary')} value={payrollData.grossSalary} />
                             <DetailRow label={t('sgkEmployer')} value={payrollData.sgkEmployer} />
                             <DetailRow label={t('unemploymentEmployer')} value={payrollData.unemploymentEmployer} />
                             <div className="flex justify-between items-center py-2 font-bold border-t-2 border-cnk-txt-primary-light mt-2">
                                <span>{t('employerCost')}</span>
                                <span>{formatCurrency(payrollData.totalEmployerCost, 'TRY')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center p-8 bg-cnk-bg-light rounded-lg">
                    <p className="text-cnk-txt-muted-light">{t('noPayrollData')}</p>
                </div>
            )}
        </div>
    );
};

export default PersonnelPayrollTab;