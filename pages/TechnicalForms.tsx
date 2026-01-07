import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { Task } from '../types';
import DataTable from '../components/common/DataTable';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { ViewState } from '../App';
import TaskForm from '../components/forms/TaskForm';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/formatting';

interface TasksPageProps {
    setView: (view: ViewState) => void;
}

const TasksPage = ({ setView }: TasksPageProps) => {
    // FIX: tasks and deleteTask are now available from useData
    const { tasks, deleteTask } = useData();
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    const { users } = useAuth();
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

    const handleAdd = () => {
        setSelectedTask(null);
        setIsFormModalOpen(true);
    };

    const handleEdit = (task: Task) => {
        setSelectedTask(task);
        setIsFormModalOpen(true);
    };
    
    const openDeleteConfirm = (taskId: string) => {
        setTaskToDelete(taskId);
        setIsConfirmDeleteOpen(true);
    };

    const handleDelete = () => {
        if (taskToDelete) {
            deleteTask(taskToDelete);
            showNotification('taskDeleted', 'success');
        }
        setIsConfirmDeleteOpen(false);
        setTaskToDelete(null);
    };
    
    const getStatusClass = (status: Task['status']) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'pending':
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    const columns = [
        { header: t('taskTitle'), accessor: (item: Task) => <span className="font-medium">{item.title}</span> },
        { 
            header: t('status'), 
            accessor: (item: Task) => (
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(item.status)}`}>
                    {t(item.status)}
                </span>
            )
        },
        { header: t('assignedTo'), accessor: (item: Task) => users.find(u => u.id === item.assignedToId)?.name || '-' },
        { header: t('dueDate'), accessor: (item: Task) => item.dueDate ? formatDate(item.dueDate) : '-' },
        {
            header: t('actions'),
            accessor: (item: Task) => (
                <div className="flex gap-2">
                    <Button variant="info" size="sm" onClick={() => handleEdit(item)} icon="fas fa-edit" title={t('edit')} />
                    <Button variant="danger" size="sm" onClick={() => openDeleteConfirm(item.id)} icon="fas fa-trash" title={t('delete')} />
                </div>
            ),
        },
    ];

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">{t('tasks')}</h1>
                <Button variant="primary" onClick={handleAdd} icon="fas fa-plus">{t('addTask')}</Button>
            </div>
            <DataTable
                columns={columns}
                data={tasks}
                emptyStateMessage={t('noTasks')}
            />
            
            <TaskForm
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                task={selectedTask}
            />
             <Modal
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                title={t('deleteTaskConfirm')}
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

export default TasksPage;