
import React, { useState, useMemo } from 'react';
import { User, ShiftAssignment, ShiftTemplate } from '../../types';
import { usePersonnel } from '../../contexts/PersonnelContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Button from '../common/Button';
import Modal from '../common/Modal';
import DataTable from '../common/DataTable';

const AssignShiftModal = ({ isOpen, onClose, personnel, onAssign }: { isOpen: boolean, onClose: () => void, personnel: User, onAssign: (shiftTemplateId: string, date: string) => void }) => {
    const { t } = useLanguage();
    const { shiftTemplates } = usePersonnel();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [selectedShiftId, setSelectedShiftId] = useState<string>(shiftTemplates[0]?.id || '');

    const handleSave = () => {
        if (!selectedShiftId || !selectedDate) return;
        onAssign(selectedShiftId, selectedDate);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${personnel.name} - ${t('assignShift')}`}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button onClick={handleSave}>{t('save')}</Button>
                </>
            }
        >
            <div className="space-y-4">
                <div>
                    <label htmlFor="shift-date" className="block text-sm font-medium text-gray-700">{t('date')}</label>
                    <input type="date" id="shift-date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="shift-template" className="block text-sm font-medium text-gray-700">{t('selectShift')}</label>
                    <select id="shift-template" value={selectedShiftId} onChange={e => setSelectedShiftId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        {shiftTemplates.map(st => <option key={st.id} value={st.id}>{st.name} ({st.startTime} - {st.endTime})</option>)}
                    </select>
                </div>
            </div>
        </Modal>
    );
};

const PersonnelShiftsTab = ({ personnel }: { personnel: User }) => {
    const { t } = useLanguage();
    const { getShiftAssignmentsForUser, shiftTemplates, assignShift } = usePersonnel();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const shiftAssignments = useMemo(() => 
        getShiftAssignmentsForUser(personnel.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), 
        [getShiftAssignmentsForUser, personnel.id]
    );
    const shiftTemplateMap = new Map(shiftTemplates.map(st => [st.id, st]));

    const handleAssign = (shiftTemplateId: string, date: string) => {
        assignShift({ personnelId: personnel.id, shiftTemplateId, date });
    };

    const columns = [
        { 
            header: t('date'), 
            accessor: (item: ShiftAssignment) => new Date(item.date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) 
        },
        { 
            header: "Vardiya Adı", 
            accessor: (item: ShiftAssignment) => shiftTemplateMap.get(item.shiftTemplateId)?.name || 'Bilinmeyen Vardiya'
        },
        { 
            header: "Başlangıç", 
            accessor: (item: ShiftAssignment) => shiftTemplateMap.get(item.shiftTemplateId)?.startTime
        },
        { 
            header: "Bitiş", 
            accessor: (item: ShiftAssignment) => shiftTemplateMap.get(item.shiftTemplateId)?.endTime
        }
    ];

    return (
        <div>
            {isModalOpen && <AssignShiftModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} personnel={personnel} onAssign={handleAssign} />}
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Atanmış Vardiyalar</h3>
                <Button onClick={() => setIsModalOpen(true)} icon="fas fa-plus">{t('assignShift')}</Button>
            </div>

            <DataTable
                columns={columns}
                data={shiftAssignments}
                emptyStateMessage="Bu personele atanmış vardiya bulunmuyor."
            />
        </div>
    );
};

export default PersonnelShiftsTab;
