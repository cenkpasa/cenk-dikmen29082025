
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotification } from '@/contexts/NotificationContext';
import { Customer } from '@/types';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';

interface ExcelMappingModalProps {
    isOpen: boolean;
    onClose: () => void;
    jsonData: any[];
    headers: string[];
    onConfirm: (mappedData: Omit<Customer, 'id' | 'createdAt'>[]) => void;
}

// Fix: Export the component to make it available for import.
export const ExcelMappingModal = ({ isOpen, onClose, jsonData, headers, onConfirm }: ExcelMappingModalProps) => {
    const { t } = useLanguage();
    const { showNotification } = useNotification();

    const crmFields = [
        { key: 'name', label: t('nameCompanyName'), required: true },
        { key: 'commercialTitle', label: t('commercialTitle') },
        { key: 'email', label: t('email') },
        { key: 'phone1', label: t('phone1') },
        { key: 'mobilePhone1', label: t('mobilePhone1') },
        { key: 'address', label: t('address') },
        { key: 'taxOffice', label: t('taxOffice') },
        { key: 'taxNumber', label: t('taxNumber') },
        { key: 'notes', label: t('notes') },
    ];

    const [mapping, setMapping] = useState<Record<string, string>>(() => {
        const initialMapping: Record<string, string> = {};
        crmFields.forEach(field => {
            const matchedHeader = headers.find(h => h.toLowerCase().replace(/[\s\-_]/g, '') === field.label.toLowerCase().replace(/[\s\-_]/g, '')) || '';
            initialMapping[field.key] = matchedHeader;
        });
        return initialMapping;
    });

    const handleMappingChange = (crmKey: string, excelHeader: string) => {
        setMapping(prev => ({ ...prev, [crmKey]: excelHeader }));
    };

    const handleConfirm = () => {
        if (!mapping.name) {
            showNotification('fieldsRequired', 'error'); // Or a more specific message
            return;
        }
        
        const mappedData = jsonData.map(row => {
            const newCustomer: Partial<Omit<Customer, 'id' | 'createdAt'>> = { status: 'active' };
            for (const crmKey in mapping) {
                if (mapping[crmKey]) {
                    (newCustomer as any)[crmKey] = row[mapping[crmKey]];
                }
            }
            return newCustomer as Omit<Customer, 'id' | 'createdAt'>;
        });

        onConfirm(mappedData);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('excelColumnMapping')}
            size="3xl"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button variant="primary" onClick={handleConfirm}>{t('confirmMappingAndPreview')}</Button>
                </>
            }
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="font-bold mb-2">{t('crmField')} &rarr; {t('excelColumn')}</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {crmFields.map(field => (
                            <div key={field.key} className="flex items-center gap-2">
                                <label className="w-1/3 text-sm font-medium">{field.label} {field.required && '*'}</label>
                                <select 
                                    value={mapping[field.key] || ''}
                                    onChange={(e) => handleMappingChange(field.key, e.target.value)}
                                    className="flex-grow p-2 border rounded-md"
                                >
                                    <option value="">Eşleştirme</option>
                                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="font-bold mb-2">{t('dataPreview')} (İlk 5 Satır)</h3>
                    <div className="overflow-x-auto border rounded-md max-h-96">
                        <table className="w-full text-xs">
                           <thead className="bg-gray-100">
                                <tr>
                                    {headers.map(h => <th key={h} className="p-2 font-semibold text-left">{h}</th>)}
                                </tr>
                           </thead>
                           <tbody>
                                {jsonData.slice(0, 5).map((row, index) => (
                                    <tr key={index} className="border-t">
                                        {headers.map(h => <td key={h} className="p-2 truncate">{row[h]}</td>)}
                                    </tr>
                                ))}
                           </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
