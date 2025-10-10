


import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePersonnel } from '@/contexts/PersonnelContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { TripRecord, User } from '@/types';
import Button from '@/components/common/Button';
import { v4 as uuidv4 } from 'uuid';

const ExpenseReportPage = () => {
    const { t } = useLanguage();
    const { currentUser, users } = useAuth();
    const { getTripRecordsForUser, addOrUpdateTripRecords } = usePersonnel();

    const [selectedUserId, setSelectedUserId] = useState<string>(currentUser?.id || '');
    const [ratePerKm, setRatePerKm] = useState(0.27);
    const [trips, setTrips] = useState<Partial<TripRecord>[]>([]);
    const reportRef = useRef<HTMLDivElement>(null);

    const selectedUser = useMemo(() => users.find(u => u.id === selectedUserId), [users, selectedUserId]);
    
    useEffect(() => {
        if (selectedUserId) {
            const userTrips = getTripRecordsForUser(selectedUserId);
            // Show at least 10 rows, filled with existing data or empty
            // FIX: Explicitly type `displayTrips` as `Partial<TripRecord>[]` to allow pushing partial objects for new empty rows.
            const displayTrips: Partial<TripRecord>[] = [...userTrips];
            while (displayTrips.length < 10) {
                displayTrips.push({ id: uuidv4(), userId: selectedUserId });
            }
            setTrips(displayTrips);
        }
    }, [selectedUserId, getTripRecordsForUser]);

    const handleTripChange = (index: number, field: keyof TripRecord, value: string | number) => {
        const newTrips = [...trips];
        const trip = { ...newTrips[index] };
        (trip as any)[field] = value;
        newTrips[index] = trip;
        setTrips(newTrips);
    };

    const addRow = () => {
        setTrips(prev => [...prev, { id: uuidv4(), userId: selectedUserId }]);
    };
    
    const handleSave = () => {
        const validTrips = trips.filter(
            (t): t is TripRecord => 
                !!t.id &&
                !!t.userId &&
                !!t.date && 
                typeof t.odometerStart === 'number' && 
                typeof t.odometerEnd === 'number' &&
                t.odometerEnd > t.odometerStart
        );
        addOrUpdateTripRecords(validTrips);
        alert(t('saveReport') + ' ' + t('success'));
    };

    const handlePrint = () => {
        window.print();
    };

    const calculations = useMemo(() => {
        let totalDistance = 0;
        const validTrips = trips.filter(t => t.odometerEnd && t.odometerStart && t.odometerEnd > t.odometerStart);
        
        validTrips.forEach(t => {
            totalDistance += (t.odometerEnd! - t.odometerStart!);
        });
        
        const totalReimbursement = totalDistance * ratePerKm;

        const dates = validTrips.map(t => new Date(t.date!)).filter(d => !isNaN(d.getTime()));
        const startDate = dates.length > 0 ? new Date(Math.min.apply(null, dates as any)).toLocaleDateString('tr-TR') : '-';
        const endDate = dates.length > 0 ? new Date(Math.max.apply(null, dates as any)).toLocaleDateString('tr-TR') : '-';
        
        return { totalDistance, totalReimbursement, startDate, endDate };
    }, [trips, ratePerKm]);

    return (
        <div className="bg-cnk-panel-light p-4 md:p-6">
            <style>
                {`
                @media print {
                    body * { visibility: hidden; }
                    .print-area, .print-area * { visibility: visible; }
                    .print-area { position: absolute; left: 0; top: 0; width: 100%; }
                    .no-print { display: none; }
                }
                `}
            </style>
            <div className="flex justify-between items-center mb-4 no-print">
                <h1 className="text-2xl font-bold">{t('expenseReport')}</h1>
                <div className="flex gap-2">
                    <Button onClick={handleSave} icon="fas fa-save">{t('saveReport')}</Button>
                    <Button onClick={handlePrint} icon="fas fa-print" variant="secondary">{t('printReport')}</Button>
                </div>
            </div>

            <div ref={reportRef} className="print-area border border-cnk-border-light p-4 bg-white">
                <h2 className="text-xl font-bold text-center mb-4">{t('expenseReport')}</h2>
                
                {/* Header */}
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div className="space-y-1">
                        <div className="grid grid-cols-[200px_1fr]">
                            <span>{t('employeeName')}:</span>
                            {currentUser?.role === 'admin' ? (
                                <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="border-b no-print">
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            ) : (
                                <b>{selectedUser?.name}</b>
                            )}
                             <b className="hidden print:block">{selectedUser?.name}</b>
                        </div>
                        <div className="grid grid-cols-[200px_1fr]"><span>{t('employeeId')}:</span><b>{selectedUser?.tcNo || '-'}</b></div>
                        <div className="grid grid-cols-[200px_1fr]"><span>{t('vehicleDescription')}:</span><b>{selectedUser?.vehicleModel} ({selectedUser?.licensePlate})</b></div>
                        <div className="grid grid-cols-[200px_1fr]"><span>{t('authorizer')}:</span><b>{users.find(u => u.role === 'admin')?.name}</b></div>
                    </div>
                     <div className="space-y-1">
                        <div className="grid grid-cols-[150px_1fr]">
                            <span>{t('ratePerKm')}:</span>
                            <input type="number" step="0.01" value={ratePerKm} onChange={e => setRatePerKm(parseFloat(e.target.value) || 0)} className="border-b font-bold w-24 text-right" /> ₺
                        </div>
                        <div className="grid grid-cols-[150px_1fr]"><span>{t('coveredPeriod')}:</span><b>{calculations.startDate} - {calculations.endDate}</b></div>
                        <div className="grid grid-cols-[150px_1fr]"><span>{t('totalDistance')}:</span><b>{calculations.totalDistance.toFixed(2)} km</b></div>
                        <div className="grid grid-cols-[150px_1fr]"><span>{t('totalReimbursement')}:</span><b>{calculations.totalReimbursement.toFixed(2)} ₺</b></div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                        <thead className="bg-cnk-bg-light">
                            <tr className="text-left">
                                {['date', 'startLocation', 'endLocation', 'notes', 'odometerStart', 'odometerEnd', 'distance', 'reimbursement'].map(h => 
                                    <th key={h} className="p-2 border border-cnk-border-light">{t(h)}</th>
                                )}
                                <th className="p-2 border border-cnk-border-light no-print"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {trips.map((trip, index) => {
                                const distance = (trip.odometerEnd && trip.odometerStart && trip.odometerEnd > trip.odometerStart) ? trip.odometerEnd - trip.odometerStart : 0;
                                const reimbursement = distance * ratePerKm;
                                return (
                                <tr key={trip.id}>
                                    <td className="border border-cnk-border-light"><input type="date" value={trip.date || ''} onChange={e => handleTripChange(index, 'date', e.target.value)} className="w-full p-1"/></td>
                                    <td className="border border-cnk-border-light"><input type="text" value={trip.startLocation || ''} onChange={e => handleTripChange(index, 'startLocation', e.target.value)} className="w-full p-1"/></td>
                                    <td className="border border-cnk-border-light"><input type="text" value={trip.endLocation || ''} onChange={e => handleTripChange(index, 'endLocation', e.target.value)} className="w-full p-1"/></td>
                                    <td className="border border-cnk-border-light"><input type="text" value={trip.notes || ''} onChange={e => handleTripChange(index, 'notes', e.target.value)} className="w-full p-1"/></td>
                                    <td className="border border-cnk-border-light"><input type="number" value={trip.odometerStart || ''} onChange={e => handleTripChange(index, 'odometerStart', parseFloat(e.target.value))} className="w-full p-1"/></td>
                                    <td className="border border-cnk-border-light"><input type="number" value={trip.odometerEnd || ''} onChange={e => handleTripChange(index, 'odometerEnd', parseFloat(e.target.value))} className="w-full p-1"/></td>
                                    <td className="border border-cnk-border-light p-1 text-right">{distance.toFixed(0)}</td>
                                    <td className="border border-cnk-border-light p-1 text-right">{reimbursement.toFixed(2)}</td>
                                    <td className="border border-cnk-border-light no-print"></td>
                                </tr>
                            )})}
                        </tbody>
                        <tfoot>
                            <tr className="font-bold bg-cnk-bg-light">
                                <td colSpan={6} className="p-2 border border-cnk-border-light text-right">{t('totals')}</td>
                                <td className="p-2 border border-cnk-border-light text-right">{calculations.totalDistance.toFixed(0)}</td>
                                <td className="p-2 border border-cnk-border-light text-right">{calculations.totalReimbursement.toFixed(2)}</td>
                                <td className="p-2 border border-cnk-border-light no-print"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                 <Button onClick={addRow} icon="fas fa-plus" size="sm" className="mt-2 no-print">{t('addRow')}</Button>
            </div>
        </div>
    );
};

export default ExpenseReportPage;