import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { Task, TaskStatus } from '../../types';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';

interface TaskFormProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task | null;
}

const TaskForm = ({ isOpen, onClose, task }: TaskFormProps) => {
    const { addTask, updateTask } = useData();
    const { users, currentUser } = useAuth();
    const { t } = useLanguage();
    const { showNotification } = useNotification();

    const getInitialState = (): Omit<Task, 'id' | 'createdAt'> => ({
        title: '',
        description: '',
        status: 'pending',
        dueDate: '',
        assignedToId: currentUser?.id || '',
        relatedToEntity: undefined,
        relatedToId: undefined,
    });

    const [formData, setFormData] = useState(getInitialState());

    useEffect(() => {
        if (isOpen) {
            if (task) {
                setFormData({
                    title: task.title,
                    description: task.description || '',
                    status: task.status,
                    dueDate: task.dueDate || '',
                    assignedToId: task.assignedToId,
                    relatedToEntity: task.relatedToEntity,
                    relatedToId: task.relatedToId,
                });
            } else {
                setFormData(getInitialState());
            }
        }
    }, [task, isOpen, currentUser]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.assignedToId) {
            showNotification('fieldsRequired', 'error');
            return;
        }

        if (task) {
            updateTask({ ...task, ...formData });
            showNotification('taskUpdated', 'success');
        } else {
            addTask(formData);
            showNotification('taskAdded', 'success');
        }
        onClose();
    };

    const taskStatuses: TaskStatus[] = ['pending', 'in_progress', 'completed'];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={task ? t('editTask') : t('addTask')}
            size="2xl"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button variant="primary" onClick={handleSubmit}>{t('save')}</Button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input id="title" label={t('taskTitle')} value={formData.title} onChange={handleChange} required />
                <div>
                    <label htmlFor="description" className="mb-2 block text-sm font-semibold">{t('description')}</label>
                    <textarea id="description" value={formData.description} onChange={handleChange} rows={4} className="w-full rounded-lg border border-cnk-border-light bg-cnk-bg-light p-2"></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="assignedToId" className="mb-2 block text-sm font-semibold">{t('assignedTo')}</label>
                        <select id="assignedToId" value={formData.assignedToId} onChange={handleChange} className="w-full rounded-lg border border-cnk-border-light bg-cnk-bg-light p-2.5">
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="status" className="mb-2 block text-sm font-semibold">{t('status')}</label>
                        <select id="status" value={formData.status} onChange={handleChange} className="w-full rounded-lg border border-cnk-border-light bg-cnk-bg-light p-2.5">
                            {taskStatuses.map(s => <option key={s} value={s}>{t(s)}</option>)}
                        </select>
                    </div>
                    <Input id="dueDate" label={t('dueDate')} type="date" value={formData.dueDate} onChange={handleChange} />
                </div>
            </form>
        </Modal>
    );
};

export default TaskForm;