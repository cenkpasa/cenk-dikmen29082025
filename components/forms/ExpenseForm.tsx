import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Expense, ExpenseCategory } from '../../types';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';

interface ExpenseFormProps {
    isOpen: boolean;
    onClose: () => void;
    expense: Expense | null;
}

const ExpenseForm = ({ isOpen, onClose, expense }: ExpenseFormProps) => {
    const { addExpense, updateExpense } = useData();
    const { t } = useLanguage();
    const { showNotification } = useNotification();

    const getInitialState = (): Omit<Expense, 'id' | 'createdAt' | 'userId'> => ({
        date: new Date().toISOString().slice(0, 10),
        category: 'travel',
        amount: 0,
        currency: 'TRY',
        description: '',
        receiptImage: ''
    });

    const [formData, setFormData] = useState(getInitialState());
    
    useEffect(() => {
        if (isOpen) {
            if (expense) {
                setFormData({
                    date: expense.date,
                    category: expense.category,
                    amount: expense.amount,
                    currency: expense.currency,
                    description: expense.description,
                    receiptImage: expense.receiptImage || ''
                });
            } else {
                setFormData(getInitialState());
            }
        }
    }, [expense, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value, type } = e.target;
        setFormData(prev => ({ ...prev, [id]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({...prev, receiptImage: reader.result as string}));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.description || formData.amount <= 0) {
            showNotification('fieldsRequired', 'error');
            return;
        }

        if (expense) {
            updateExpense({ ...expense, ...formData });
            showNotification('expenseUpdated', 'success');
        } else {
            addExpense(formData);
            showNotification('expenseAdded', 'success');
        }
        onClose();
    };
    
    const expenseCategories: ExpenseCategory[] = ['travel', 'food', 'accommodation', 'fuel', 'representation', 'other'];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={expense ? t('editExpense') : t('addExpense')}
            size="2xl"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button variant="primary" onClick={handleSubmit}>{t('save')}</Button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input id="date" label={t('date')} type="date" value={formData.date} onChange={handleChange} required />
                    <div>
                        <label htmlFor="category" className="mb-2 block text-sm font-semibold">{t('category')}</label>
                        <select id="category" value={formData.category} onChange={handleChange} className="w-full rounded-lg border border-cnk-border-light bg-cnk-bg-light p-2.5">
                            {expenseCategories.map(cat => <option key={cat} value={cat}>{t(cat)}</option>)}
                        </select>
                    </div>
                    <Input id="amount" label={t('amount')} type="number" value={String(formData.amount)} onChange={handleChange} required />
                    <div>
                        <label htmlFor="currency" className="mb-2 block text-sm font-semibold">Para Birimi</label>
                        <select id="currency" value={formData.currency} onChange={handleChange} className="w-full rounded-lg border border-cnk-border-light bg-cnk-bg-light p-2.5">
                            <option value="TRY">TRY (₺)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor="description" className="mb-2 block text-sm font-semibold">{t('description')}</label>
                    <textarea id="description" value={formData.description} onChange={handleChange} rows={3} required className="w-full rounded-lg border border-cnk-border-light bg-cnk-bg-light p-2"></textarea>
                </div>
                 <div>
                    <label htmlFor="receipt" className="mb-2 block text-sm font-semibold">{t('receipt')}</label>
                    <input id="receipt" type="file" onChange={handleFileChange} accept="image/*" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cnk-accent-primary/10 file:text-cnk-accent-primary hover:file:bg-cnk-accent-primary/20"/>
                    {formData.receiptImage && <img src={formData.receiptImage} alt="Receipt Preview" className="mt-2 max-h-40 rounded-lg"/>}
                </div>
            </form>
        </Modal>
    );
};

export default ExpenseForm;