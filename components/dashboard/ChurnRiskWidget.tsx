import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { ViewState } from '../../App';
import { Customer } from '../../types';
import Button from '../common/Button';

interface ChurnRiskWidgetProps {
    setView: (view: ViewState) => void;
}

const ChurnRiskWidget = ({ setView }: ChurnRiskWidgetProps) => {
    const { t } = useLanguage();
    const { customers } = useData();

    const atRiskCustomers = useMemo(() => {
        return customers.filter(c => c.churnRisk).slice(0, 5);
    }, [customers]);

    const handleViewCustomer = (customer: Customer) => {
        setView({ page: 'customers', id: customer.id });
    };

    return (
        <div className="bg-cnk-panel-light p-5 rounded-xl shadow-sm border border-cnk-border-light h-full flex flex-col">
            <h3 className="font-bold text-lg text-cnk-txt-primary-light mb-4">
                <i className="fas fa-exclamation-triangle text-amber-500 mr-2"></i>
                {t('churnRiskWidgetTitle')}
            </h3>
            {atRiskCustomers.length > 0 ? (
                <div className="flex-grow overflow-y-auto pr-2">
                    <ul className="space-y-3">
                        {atRiskCustomers.map(customer => (
                            <li key={customer.id} className="flex items-center justify-between p-2 rounded-md hover:bg-cnk-bg-light">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-bold">
                                        {customer.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-cnk-txt-secondary-light">{customer.name}</p>
                                        <p className="text-xs text-cnk-txt-muted-light">{customer.email || customer.phone1}</p>
                                    </div>
                                </div>
                                <Button size="sm" variant="secondary" onClick={() => handleViewCustomer(customer)}>
                                    {t('viewDetails')}
                                </Button>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="text-center text-sm text-cnk-txt-muted-light flex-grow flex flex-col justify-center items-center">
                    <i className="fas fa-shield-alt text-4xl text-green-400 mb-2"></i>
                    <p>Risk altında müşteri bulunmuyor.</p>
                </div>
            )}
        </div>
    );
};

export default ChurnRiskWidget;
