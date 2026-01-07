
import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { Expense } from '../types';
import DataTable from '../components/common/DataTable';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ExpenseForm from '../components/forms/ExpenseForm';
import { formatCurrency, formatDate } from '../utils/formatting';

const StatCard = ({ label, value }: { label: string; value: string | number }) => (
    <div className="bg-cnk-panel-light p-4 rounded-lg text-center border border-cnk-border-light shadow-sm">
        <p className="text-sm font-medium text-cnk-txt-muted-light">{label}</p>
        <p className="text-2xl font-bold text-cnk-accent-primary">{value}</p>
    </div>
);

const ExpensesPage = () => {
    // FIX: expenses and deleteExpense are now available from useData
    const { expenses, deleteExpense } = useData();
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

    const handleAdd = () => {
        setSelectedExpense(null);
        setIsFormModalOpen(true);
    };

    const handleEdit = (expense: Expense) => {
        setSelectedExpense(expense);
        setIsFormModalOpen(true);
    };
    
    const openDeleteConfirm = (expenseId: string) => {
        setExpenseToDelete(expenseId);
        setIsConfirmDeleteOpen(true);
    };

    const handleDelete = () => {
        if (expenseToDelete) {
            deleteExpense(expenseToDelete);
            showNotification('expenseDeleted', 'success');
        }
        setIsConfirmDeleteOpen(false);
        setExpenseToDelete(null);
    };

    const { totalExpenses, categoryDistribution } = useMemo(() => {
        const total = expenses.reduce((sum, exp) => sum + (exp.currency === 'TRY' ? exp.amount : 0), 0); // Simple sum for TRY for now
        const distribution = expenses.reduce((acc, exp) => {
            acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
            return acc;
        }, {} as Record<string, number>);
        
        // FIX: Explicitly cast Object.entries to resolve arithmetic operation errors on unknown types
        const distArray = (Object.entries(distribution) as [string, number][]).sort((a, b) => b[1] - a[1]);
        
        return {
            totalExpenses: total,
            categoryDistribution: distArray
        };
    }, [expenses]);
    
    const columns = [
        { header: t('date'), accessor: (item: Expense) => formatDate(item.date) },
        { header: t('category'), accessor: (item: Expense) => t(item.category) },
        { header: t('description'), accessor: (item: Expense) => item.description },
        { header: t('amount'), accessor: (item: Expense) => formatCurrency(item.amount, item.currency), className: 'font-semibold text-right' },
        {
            header: t('actions'),
            accessor: (item: Expense) => (
                <div className="flex justify-end gap-2">
                    <Button variant="info" size="sm" onClick={() => handleEdit(item)} icon="fas fa-edit" title={t('edit')} />
                    <Button variant="danger" size="sm" onClick={() => openDeleteConfirm(item.id)} icon="fas fa-trash" title={t('delete')} />
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{t('expenses')}</h1>
                <Button variant="primary" onClick={handleAdd} icon="fas fa-plus">{t('addExpense')}</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <StatCard label={t('totalExpenses')} value={formatCurrency(totalExpenses, 'TRY')} />
                </div>
                 <div className="md:col-span-2 bg-cnk-panel-light p-4 rounded-lg border border-cnk-border-light shadow-sm">
                    <h3 className="font-bold mb-3">{t('expensesByCategory')}</h3>
                    <div className="space-y-2">
                        {categoryDistribution.map(([category, amount]) => {
                            const percentage = totalExpenses > 0 ? (Number(amount) / totalExpenses) * 100 : 0;
                            return (
                                <div key={category}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-cnk-txt-secondary-light">{t(category)}</span>
                                        <span className="font-semibold text-cnk-txt-primary-light">{formatCurrency(amount, 'TRY')}</span>
                                    </div>
                                    <div className="w-full bg-cnk-bg-light rounded-full h-2.5" title={`%${percentage.toFixed(1)}`}>
                                        <div className="bg-cnk-accent-yellow h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={expenses}
                emptyStateMessage={t('noExpenses')}
            />
            
            <ExpenseForm
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                expense={selectedExpense}
            />
            
             <Modal
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                title={t('deleteExpenseConfirm')}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsConfirmDeleteOpen(false)}>{t('cancel')}</Button>
                        <Button variant="danger" onClick={handleDelete}>{t('delete')}</Button>
                    </>
                }
            >
                <p>{t('deleteConfirmation')}</p>
            </Modal>
        </div>
    );
};

export default ExpensesPage;
