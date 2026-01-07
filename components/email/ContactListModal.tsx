
import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { useEmail } from '../../contexts/EmailContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Contact } from '../../types';
import DataTable from '../common/DataTable';

interface ContactListModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect?: (emails: string[]) => void; // If provided, acts as a picker
}

const ContactListModal = ({ isOpen, onClose, onSelect }: ContactListModalProps) => {
    const { contacts, addContact, updateContact, deleteContact } = useEmail();
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    
    const [view, setView] = useState<'list' | 'form'>('list');
    const [formData, setFormData] = useState<{ id?: string, name: string, email: string, company: string }>({ name: '', email: '', company: '' });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    const filteredContacts = contacts.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (contact: Contact) => {
        setFormData({ id: contact.id, name: contact.name, email: contact.email, company: contact.company || '' });
        setView('form');
    };

    const handleDelete = async (id: string) => {
        if (window.confirm(t('areYouSure'))) {
            await deleteContact(id);
            showNotification('contactDeleted', 'success');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email) {
            showNotification('fieldsRequired', 'error');
            return;
        }

        try {
            if (formData.id) {
                // Update
                const existing = contacts.find(c => c.id === formData.id);
                if (existing) {
                    await updateContact({ ...existing, name: formData.name, email: formData.email, company: formData.company });
                    showNotification('contactUpdated', 'success');
                }
            } else {
                // Add
                await addContact({ name: formData.name, email: formData.email, company: formData.company, source: 'manual' });
                showNotification('contactAdded', 'success');
            }
            setView('list');
            setFormData({ name: '', email: '', company: '' });
        } catch (err) {
            showNotification('genericError', 'error');
        }
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleConfirmSelection = () => {
        if (onSelect) {
            const selectedEmails = contacts.filter(c => selectedIds.has(c.id)).map(c => c.email);
            onSelect(selectedEmails);
            onClose();
        }
    };

    const columns = [
        { 
            header: '', 
            accessor: (item: Contact) => (
                onSelect ? (
                    <input 
                        type="checkbox" 
                        checked={selectedIds.has(item.id)} 
                        onChange={() => toggleSelection(item.id)}
                        className="h-4 w-4 rounded border-gray-300 text-cnk-accent-primary focus:ring-cnk-accent-primary"
                    />
                ) : null
            ),
            className: onSelect ? 'w-10' : 'hidden'
        },
        { header: t('name'), accessor: (item: Contact) => item.name },
        { header: t('email'), accessor: (item: Contact) => item.email },
        { header: t('company'), accessor: (item: Contact) => item.company || '-' },
        { header: t('source'), accessor: (item: Contact) => t(item.source) },
        {
            header: t('actions'),
            accessor: (item: Contact) => (
                <div className="flex gap-2 justify-end">
                    <Button variant="info" size="sm" onClick={() => handleEdit(item)} icon="fas fa-edit" />
                    <Button variant="danger" size="sm" onClick={() => handleDelete(item.id)} icon="fas fa-trash" />
                </div>
            ),
        }
    ];

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={view === 'list' ? t('addressBook') : (formData.id ? t('editContact') : t('addContact'))}
            size="3xl"
            footer={
                view === 'list' ? (
                    <div className="flex justify-between w-full">
                        <div className="text-sm text-gray-500 self-center">
                            {onSelect && `${selectedIds.size} ${t('select')}ild.`}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={onClose}>{t('close')}</Button>
                            {onSelect && selectedIds.size > 0 && (
                                <Button onClick={handleConfirmSelection} icon="fas fa-paper-plane">{t('composeToSelected')}</Button>
                            )}
                        </div>
                    </div>
                ) : null
            }
        >
            {view === 'list' ? (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <Input 
                            placeholder={t('searchPlaceholder')} 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            containerClassName="!mb-0 w-64"
                        />
                        <Button onClick={() => { setFormData({ name: '', email: '', company: '' }); setView('form'); }} icon="fas fa-plus">{t('addContact')}</Button>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto">
                        <DataTable 
                            columns={columns} 
                            data={filteredContacts} 
                            emptyStateMessage={t('noContacts')} 
                        />
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSave} className="space-y-4">
                    <Input label={t('contactName')} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                    <Input label={t('email')} type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                    <Input label={t('company')} value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} />
                    
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="secondary" type="button" onClick={() => setView('list')}>{t('cancel')}</Button>
                        <Button type="submit">{t('save')}</Button>
                    </div>
                </form>
            )}
        </Modal>
    );
};

export default ContactListModal;
