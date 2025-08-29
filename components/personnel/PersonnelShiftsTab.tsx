import React, { useState, useMemo } from 'react';
import { User, ShiftAssignment, ShiftTemplate } from '../../types';
import { usePersonnel } from '../../contexts/PersonnelContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Button from '../common/Button';
import Modal from '../common/Modal';

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
    const { getShiftAssignmentsForUser, shiftTemplates, assignShift, deleteShiftAssignment } = usePersonnel();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);

    const shiftAssignments = useMemo(() => getShiftAssignmentsForUser(personnel.id), [getShiftAssignmentsForUser, personnel.id]);
    const shiftTemplateMap = new Map(shiftTemplates.map(st => [st.id, st]));

    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - (currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1));

    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        return day;
    });

    const handleAssign = (shiftTemplateId: string, date: string) => {
        assignShift({ personnelId: personnel.id, shiftTemplateId, date });
    };

    return (
        <div>
            {isModalOpen && <AssignShiftModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} personnel={personnel} onAssign={handleAssign} />}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" icon="fas fa-chevron-left" onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))} />
                    <h3 className="font-bold text-lg">{startOfWeek.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</h3>
                    <Button size="sm" variant="secondary" icon="fas fa-chevron-right" onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))} />
                </div>
                <Button onClick={() => setIsModalOpen(true)} icon="fas fa-plus">{t('assignShift')}</Button>
            </div>

            <div className="grid grid-cols-7 gap-1 bg-cnk-bg-light p-1 rounded-lg">
                {weekDays.map(day => {
                    const dayString = day.toISOString().slice(0, 10);
                    const assignment = shiftAssignments.find(a => a.date === dayString);
                    const shift = assignment ? shiftTemplateMap.get(assignment.shiftTemplateId) : null;
                    return (
                        <div key={dayString} className="bg-cnk-panel-light rounded-md p-2 min-h-[80px]">
                            <p className="font-bold text-center text-sm">{day.toLocaleDateString('tr-TR', { weekday: 'short' })}</p>
                            <p className="text-center text-xs text-cnk-txt-muted-light">{day.getDate()}</p>
                            {shift && (
                                <div className="mt-2 bg-blue-100 text-blue-800 text-xs rounded p-1 text-center relative group">
                                    <p className="font-semibold">{shift.name}</p>
                                    <p>{shift.startTime} - {shift.endTime}</p>
                                    <button onClick={() => deleteShiftAssignment(assignment!.id)} className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PersonnelShiftsTab;
