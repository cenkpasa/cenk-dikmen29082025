import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { User } from '../types';
import Button from '../components/common/Button';
import UserForm from '../components/forms/UserForm';
import PersonnelShiftsTab from '../components/personnel/PersonnelShiftsTab';
import PersonnelLeavesTab from '../components/personnel/PersonnelLeavesTab';
import VehicleKmTab from '../components/personnel/VehicleKmTab';
import PersonnelPayrollTab from '../components/dashboard/TodaysSummary';

const InfoItem = ({ label, value }: { label: string, value?: string | number }) => (
    <div>
        <p className="text-xs text-cnk-txt-muted-light">{label}</p>
        <p className="font-medium text-cnk-txt-secondary-light">{value || '-'}</p>
    </div>
);

const PersonnelDetail = ({ personnel, onEdit }: { personnel: User, onEdit: () => void }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('info');

    const tabs = [
        { id: 'info', label: t('personnelInfo') },
        { id: 'leaves', label: t('personnelLeaves') },
        { id: 'shifts', label: t('personnelShifts') },
        { id: 'payroll', label: t('personnelPayroll') },
        { id: 'vehicle', label: t('vehicleKmTracking') }
    ];

    return (
        <div className="bg-cnk-panel-light rounded-lg shadow-lg">
            {/* Header */}
            <div className="bg-cnk-accent-primary/10 p-6 rounded-t-lg flex items-center space-x-6">
                <img src={personnel.avatar || `https://ui-avatars.com/api/?name=${personnel.name}&background=random`} alt={personnel.name} className="w-20 h-20 rounded-full border-4 border-cnk-accent-primary/50 object-cover"/>
                <div>
                    <h2 className="text-2xl font-bold text-cnk-txt-primary-light">{personnel.name}</h2>
                    <p className="text-cnk-accent-primary">{personnel.jobTitle || t('user')}</p>
                </div>
            </div>
            
            {/* Tabs */}
            <div className="border-b border-cnk-border-light px-6">
                <nav className="flex space-x-8 -mb-px overflow-x-auto">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 whitespace-nowrap ${activeTab === tab.id ? 'border-cnk-accent-primary text-cnk-accent-primary' : 'border-transparent text-cnk-txt-muted-light hover:text-cnk-txt-secondary-light hover:border-cnk-border-light'}`}>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
                {activeTab === 'info' && (
                     <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-cnk-txt-primary-light">{t('generalInfo')}</h3>
                            <Button onClick={onEdit} icon="fas fa-pencil-alt" size="sm">{t('edit')}</Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-y-6 gap-x-4">
                                <InfoItem label="T.C No" value={personnel.tcNo} />
                                <InfoItem label={t('fullName')} value={personnel.name} />
                                <InfoItem label={t('jobTitle')} value={personnel.jobTitle} />
                                <InfoItem label={t('email')} value={personnel.username} />
                                <InfoItem label={t('role')} value={t(personnel.role)} />
                                <InfoItem label={t('phone')} value={personnel.phone} />
                                <InfoItem label={t('startDate')} value={personnel.startDate} />
                                <InfoItem label={t('workType')} value={personnel.workType} />
                                <InfoItem label={t('status')} value={personnel.employmentStatus} />
                                <InfoItem label={t('bloodType')} value={personnel.bloodType} />
                                <InfoItem label={t('licensePlate')} value={personnel.licensePlate} />
                            </div>
                            <div className="md:col-span-4 flex justify-center md:justify-end mt-4 md:mt-0">
                                <img src={personnel.avatar || `https://ui-avatars.com/api/?name=${personnel.name}&background=random`} alt={personnel.name} className="w-32 h-32 rounded-full object-cover shadow-md"/>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'leaves' && <PersonnelLeavesTab personnel={personnel} />}
                {activeTab === 'shifts' && <PersonnelShiftsTab personnel={personnel} />}
                {activeTab === 'payroll' && <PersonnelPayrollTab personnel={personnel} />}
                {activeTab === 'vehicle' && <VehicleKmTab personnel={personnel} />}
            </div>
        </div>
    );
};

const Users = () => {
    const { users, currentUser } = useAuth();
    const { t } = useLanguage();
    const [selectedPersonnelId, setSelectedPersonnelId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [personnelToEdit, setPersonnelToEdit] = useState<User | null>(null);

    useEffect(() => {
        if (users.length > 0 && !selectedPersonnelId) {
            setSelectedPersonnelId(users[0].id);
        }
    }, [users, selectedPersonnelId]);

    const handleAddNew = () => {
        setPersonnelToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (personnel: User) => {
        setPersonnelToEdit(personnel);
        setIsModalOpen(true);
    };

    if (currentUser?.role !== 'admin') {
        return (
            <div>
                <p className="mt-4 rounded-lg bg-yellow-500/10 p-4 text-amber-500">{t('adminPrivilegeRequired')}</p>
            </div>
        );
    }
    
    const selectedPersonnel = users.find(u => u.id === selectedPersonnelId);

    return (
        <div>
            <div className="flex justify-end items-center mb-6">
                <Button onClick={handleAddNew} icon="fas fa-plus">{t('addNewPersonnel')}</Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Panel: Personnel List */}
                <div className="lg:col-span-4 xl:col-span-3">
                    <div className="bg-cnk-panel-light rounded-lg shadow-lg p-3 space-y-2 max-h-[75vh] overflow-y-auto">
                        {users.map(p => (
                            <div key={p.id} onClick={() => setSelectedPersonnelId(p.id)}
                                 className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${selectedPersonnelId === p.id ? 'bg-cnk-accent-primary text-white shadow-md' : 'hover:bg-cnk-bg-light'}`}>
                                <div className="flex items-center overflow-hidden">
                                    <img src={p.avatar || `https://ui-avatars.com/api/?name=${p.name.replace(/\s/g, "+")}&background=random`} alt={p.name} className="w-12 h-12 rounded-full mr-4 object-cover flex-shrink-0"/>
                                    <div className="truncate">
                                        <p className="font-semibold truncate">{p.name}</p>
                                        <p className={`${selectedPersonnelId === p.id ? 'text-blue-100' : 'text-cnk-txt-muted-light'} text-sm truncate`}>{p.jobTitle || t(p.role)}</p>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 ml-2">
                                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.employmentStatus === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {p.employmentStatus}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Details */}
                <div className="lg:col-span-8 xl:col-span-9">
                    {selectedPersonnel ? (
                        <PersonnelDetail personnel={selectedPersonnel} onEdit={() => handleEdit(selectedPersonnel)} />
                    ) : (
                        <div className="bg-cnk-panel-light rounded-lg shadow-lg p-8 text-center text-cnk-txt-muted-light h-full flex items-center justify-center">
                            <p>{t('selectPersonnelToView')}</p>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && <UserForm 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={personnelToEdit}
            />}
        </div>
    );
};

export default Users;
