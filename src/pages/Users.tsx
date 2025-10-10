

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePersonnel } from '../contexts/PersonnelContext';
import { User, LeaveRequest, TripRecord, KmRecord, TimesheetEntry, PayrollData } from '../types';
import Button from '../components/common/Button';
import UserForm from '../components/forms/UserForm';
import DataTable from '../components/common/DataTable';
import { useNotification } from '../contexts/NotificationContext';
import PersonnelShiftsTab from '../components/personnel/PersonnelShiftsTab';
import { v4 as uuidv4 } from 'uuid';
import { ViewState } from '@/App';
import Input from '../components/common/Input';
import Loader from '../components/common/Loader';
import { COMPANY_INFO } from '@/constants';

const PersonnelPayrollTab = ({ personnel }: { personnel: User }) => {
    const { generateTimesheetAndPayroll } = usePersonnel();
    const [month, setMonth] = useState(new Date().getMonth()); // 0-11
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState<{ timesheet: TimesheetEntry[], payroll: PayrollData | null } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const payrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const result = await generateTimesheetAndPayroll(personnel.id, year, month + 1);
            setData(result);
            setIsLoading(false);
        };
        fetchData();
    }, [personnel.id, year, month, generateTimesheetAndPayroll]);

    const handlePrint = () => window.print();

    const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

    return (
        <div className="space-y-4">
            <style>
                {`
                @media print {
                    body * { visibility: hidden; }
                    .payroll-print-area, .payroll-print-area * { visibility: visible; }
                    .payroll-print-area { position: absolute; left: 0; top: 0; width: 100%; }
                    .no-print { display: none; }
                }
                `}
            </style>
            <div className="flex justify-between items-center p-2 bg-cnk-bg-light rounded-md no-print">
                <div className="flex items-center gap-2">
                    <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="p-2 border rounded-md">
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={i}>{new Date(0, i).toLocaleString('tr-TR', { month: 'long' })}</option>
                        ))}
                    </select>
                    <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} className="p-2 border rounded-md w-24" />
                </div>
                <Button onClick={handlePrint} icon="fas fa-print" disabled={!data?.payroll}>Bordroyu Yazdır</Button>
            </div>
            {isLoading ? <div className="flex justify-center items-center h-64"><Loader /></div> : (
                data && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                        <div className="lg:col-span-2">
                             <h3 className="font-bold text-lg mb-2">Aylık Puantaj Cetveli</h3>
                            <div className="max-h-96 overflow-y-auto border rounded-md">
                                <table className="w-full text-sm text-center">
                                    <thead className="bg-cnk-bg-light sticky top-0"><tr><th>Tarih</th><th>Gün</th><th>Giriş</th><th>Çıkış</th><th>Durum</th></tr></thead>
                                    <tbody>
                                        {data.timesheet.map(entry => (
                                            <tr key={entry.date} className="border-t">
                                                <td>{new Date(entry.date).toLocaleDateString('tr-TR', {day: '2-digit', month: '2-digit'})}</td>
                                                <td>{dayNames[entry.dayOfWeek]}</td>
                                                <td>{entry.checkIn || '-'}</td>
                                                <td>{entry.checkOut || '-'}</td>
                                                <td>{entry.status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="lg:col-span-3">
                            <h3 className="font-bold text-lg mb-2">Maaş Bordrosu</h3>
                            {data.payroll ? (
                                <div ref={payrollRef} className="payroll-print-area border p-4 bg-white text-black text-xs">
                                    <h4 className="text-center font-bold text-base mb-2">{new Date(year, month).toLocaleString('tr-TR', { month: 'long', year: 'numeric' })} Ücret Bordrosu</h4>
                                    <p><strong>Firma Ünvanı:</strong> {COMPANY_INFO.name}</p>
                                    <p><strong>Personel:</strong> {personnel.name}</p>
                                    <div className="grid grid-cols-2 gap-x-4 mt-2">
                                        <div className="border-t pt-1">
                                            <h5 className="font-bold mb-1">Ödemeler</h5>
                                            <div className="flex justify-between"><span>Normal Kazanç</span><span>{data.payroll.grossSalary.toFixed(2)}</span></div>
                                            <div className="flex justify-between font-bold border-t mt-1 pt-1"><span>Brüt Toplam</span><span>{data.payroll.grossSalary.toFixed(2)}</span></div>
                                        </div>
                                        <div className="border-t pt-1">
                                            <h5 className="font-bold mb-1">Kesintiler</h5>
                                            <div className="flex justify-between"><span>SGK İşçi Payı (%14)</span><span>{data.payroll.sgkWorkerShare.toFixed(2)}</span></div>
                                            <div className="flex justify-between"><span>İşsizlik İşçi Payı (%1)</span><span>{data.payroll.unemploymentWorkerShare.toFixed(2)}</span></div>
                                            <div className="flex justify-between"><span>Gelir Vergisi</span><span>{data.payroll.incomeTax.toFixed(2)}</span></div>
                                            <div className="flex justify-between"><span>Damga Vergisi</span><span>{data.payroll.stampTax.toFixed(2)}</span></div>
                                            <div className="flex justify-between font-bold border-t mt-1 pt-1"><span>Kesinti Toplamı</span><span>{(data.payroll.sgkWorkerShare + data.payroll.unemploymentWorkerShare + data.payroll.incomeTax + data.payroll.stampTax).toFixed(2)}</span></div>
                                        </div>
                                    </div>
                                    <div className="text-center font-bold text-lg mt-4 p-2 bg-gray-100">
                                        NET ÖDENEN: {data.payroll.netSalary.toFixed(2)} TL
                                    </div>
                                </div>
                            ) : <p>Bu personel için maaş bilgisi girilmemiş.</p>}
                        </div>
                    </div>
                )
            )}
        </div>
    );
};


const PersonnelExpenseReportTab = ({ personnel }: { personnel: User }) => {
    const { t } = useLanguage();
    const { getTripRecordsForUser, addOrUpdateTripRecords } = usePersonnel();
    const { users } = useAuth();

    const [ratePerKm, setRatePerKm] = useState(0.27);
    const [trips, setTrips] = useState<Partial<TripRecord>[]>([]);
    const reportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const userTrips = getTripRecordsForUser(personnel.id);
        const displayTrips: Partial<TripRecord>[] = [...userTrips];
        while (displayTrips.length < 10) {
            displayTrips.push({ id: uuidv4(), userId: personnel.id });
        }
        setTrips(displayTrips);
    }, [personnel.id, getTripRecordsForUser]);

    const handleTripChange = (index: number, field: keyof TripRecord, value: string | number) => {
        const newTrips = [...trips];
        const trip = { ...newTrips[index] };
        (trip as any)[field] = value;
        newTrips[index] = trip;
        setTrips(newTrips);
    };

    const addRow = () => {
        setTrips(prev => [...prev, { id: uuidv4(), userId: personnel.id }]);
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
        <div>
            <style>
                {`
                @media print {
                    body * { visibility: hidden; }
                    .print-area, .print-area * { visibility: visible; }
                    .print-area { position: absolute; left: 0; top: 0; width: 100%; }
                    .no-print { display: none; }
                    input { border: none !important; background: transparent !important; }
                }
                `}
            </style>
            <div className="flex justify-between items-center mb-4 no-print">
                 <h3 className="text-xl font-bold text-cnk-txt-primary-light">{t('expenseReport')}</h3>
                <div className="flex gap-2">
                    <Button onClick={handleSave} icon="fas fa-save">{t('saveReport')}</Button>
                    <Button onClick={handlePrint} icon="fas fa-print" variant="secondary">{t('printReport')}</Button>
                </div>
            </div>

            <div ref={reportRef} className="print-area border border-cnk-border-light p-4 bg-white">
                <h2 className="text-xl font-bold text-center mb-4">{t('expenseReport')}</h2>
                
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div className="space-y-1">
                        <div className="grid grid-cols-[200px_1fr]"><span>{t('employeeName')}:</span><b>{personnel.name}</b></div>
                        <div className="grid grid-cols-[200px_1fr]"><span>{t('employeeId')}:</span><b>{personnel.tcNo || '-'}</b></div>
                        <div className="grid grid-cols-[200px_1fr]"><span>{t('vehicleDescription')}:</span><b>{personnel.vehicleModel} ({personnel.licensePlate})</b></div>
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

                <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                        <thead className="bg-cnk-bg-light">
                            <tr className="text-left">
                                {['date', 'startLocation', 'endLocation', 'notes', 'odometerStart', 'odometerEnd', 'distance', 'reimbursement'].map(h => 
                                    <th key={h} className="p-2 border border-cnk-border-light">{t(h)}</th>
                                )}
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
                                </tr>
                            )})}
                        </tbody>
                        <tfoot>
                            <tr className="font-bold bg-cnk-bg-light">
                                <td colSpan={6} className="p-2 border border-cnk-border-light text-right">{t('totals')}</td>
                                <td className="p-2 border border-cnk-border-light text-right">{calculations.totalDistance.toFixed(0)}</td>
                                <td className="p-2 border border-cnk-border-light text-right">{calculations.totalReimbursement.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                 <Button onClick={addRow} icon="fas fa-plus" size="sm" className="mt-2 no-print">{t('addRow')}</Button>
            </div>
        </div>
    );
};

const PersonnelKmTrackingTab = ({ personnel }: { personnel: User }) => {
    const { t } = useLanguage();
    const { getKmRecordsForUser, addKmRecord } = usePersonnel();
    const { showNotification } = useNotification();
    
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [morningKm, setMorningKm] = useState('');
    const [eveningKm, setEveningKm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
  
    const userKmHistory = useMemo(() => {
      return getKmRecordsForUser(personnel.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [getKmRecordsForUser, personnel.id]);
  
    useEffect(() => {
      const morningRecord = userKmHistory.find(r => r.date === date && r.type === 'morning');
      const eveningRecord = userKmHistory.find(r => r.date === date && r.type === 'evening');
      setMorningKm(morningRecord ? String(morningRecord.km) : '');
      setEveningKm(eveningRecord ? String(eveningRecord.km) : '');
    }, [date, userKmHistory]);
  
    const handleSave = async () => {
      setIsLoading(true);
      try {
        if (morningKm) {
          await addKmRecord({ userId: personnel.id, date, type: 'morning', km: Number(morningKm) });
        }
        if (eveningKm) {
          await addKmRecord({ userId: personnel.id, date, type: 'evening', km: Number(eveningKm) });
        }
        showNotification('userUpdatedSuccess', 'success');
      } catch (e) {
        showNotification('genericError', 'error');
      } finally {
        setIsLoading(false);
      }
    };
  
    const dailyTotal = useMemo(() => {
      const morning = Number(morningKm);
      const evening = Number(eveningKm);
      return evening > morning ? evening - morning : 0;
    }, [morningKm, eveningKm]);
    
    const weeklyTotal = useMemo(() => {
      const today = new Date();
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)));
      startOfWeek.setHours(0,0,0,0);
      
      const relevantRecords = userKmHistory.filter(r => new Date(r.date) >= startOfWeek);
      const dailyDistances = new Map<string, { morning: number, evening: number }>();
  
      relevantRecords.forEach(rec => {
          if (!dailyDistances.has(rec.date)) {
              dailyDistances.set(rec.date, { morning: 0, evening: 0 });
          }
          const day = dailyDistances.get(rec.date)!;
          day[rec.type] = rec.km;
      });
  
      let total = 0;
      dailyDistances.forEach(day => {
          if (day.evening > day.morning) {
              total += day.evening - day.morning;
          }
      });
      return total;
    }, [userKmHistory]);
  
    const historyColumns = [
        { header: t('date'), accessor: (item: KmRecord) => new Date(item.date).toLocaleDateString() },
        { header: "Tür", accessor: (item: KmRecord) => t(item.type === 'morning' ? 'morningEntry' : 'eveningExit') },
        { header: "KM", accessor: (item: KmRecord) => item.km },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PerformanceCard label={t('dailyDistance')} value={`${dailyTotal.toFixed(1)} ${t('kmUnit')}`} color="indigo" />
                <PerformanceCard label={t('weeklyDistance')} value={`${weeklyTotal.toFixed(1)} ${t('kmUnit')}`} color="green" />
            </div>
            <div className="bg-cnk-bg-light p-4 rounded-lg border border-cnk-border-light/50">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                    <Input label={t('date')} type="date" value={date} onChange={e => setDate(e.target.value)} containerClassName="sm:col-span-1" />
                    <Input label={t('morningEntry')} type="number" value={morningKm} onChange={e => setMorningKm(e.target.value)} containerClassName="sm:col-span-1" />
                    <Input label={t('eveningExit')} type="number" value={eveningKm} onChange={e => setEveningKm(e.target.value)} containerClassName="sm:col-span-1" />
                    <Button onClick={handleSave} isLoading={isLoading} icon="fas fa-save">{t('save')}</Button>
                </div>
            </div>
            <div>
                <h3 className="text-lg font-semibold mb-2">Geçmiş Kayıtlar</h3>
                <DataTable columns={historyColumns} data={userKmHistory.slice(0, 10)} />
            </div>
        </div>
    );
};


const InfoItem = ({ label, value }: { label: string, value?: string | number }) => (
    <div>
        <p className="text-xs text-cnk-txt-muted-light">{label}</p>
        <p className="font-medium text-cnk-txt-secondary-light">{value || '-'}</p>
    </div>
);

const CopyableInfoItem = ({ label, value }: { label: string, value?: string }) => {
    const { showNotification } = useNotification();
    const { t } = useLanguage();

    const handleCopy = () => {
        if (!value) return;
        navigator.clipboard.writeText(value)
            .then(() => {
                showNotification('copiedToClipboard', 'success');
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                showNotification('genericError', 'error');
            });
    };

    return (
        <div>
            <p className="text-xs text-cnk-txt-muted-light">{label}</p>
            <div className="flex items-center justify-between group">
                <p className="font-medium text-cnk-txt-secondary-light truncate" title={value}>{value || '-'}</p>
                {value && (
                    <button onClick={handleCopy} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-cnk-txt-muted-light hover:text-cnk-accent-primary focus:opacity-100 focus:outline-none" title={t('copy')}>
                        <i className="fas fa-copy"></i>
                    </button>
                )}
            </div>
        </div>
    );
};


const PerformanceCard = ({ label, value, color }: { label: string, value: string | number, color: 'blue' | 'orange' | 'green' | 'indigo' }) => {
    const colorClasses = {
        blue: 'bg-blue-500/10 text-blue-800',
        orange: 'bg-orange-500/10 text-orange-800',
        green: 'bg-green-500/10 text-green-800',
        indigo: 'bg-indigo-500/10 text-indigo-800',
    };
    return (
        <div className={`${colorClasses[color]} p-4 rounded-cnk-element text-center`}>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    );
};

const PersonnelLeavesTab = ({ personnel }: { personnel: User }) => {
    const { t } = useLanguage();
    const { addLeaveRequest, getLeaveRequestsForUser, approveLeaveRequest, rejectLeaveRequest } = usePersonnel();
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();
    const [leaveType, setLeaveType] = useState('Yıllık İzin');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    
    const leaveHistory = useMemo(() => getLeaveRequestsForUser(personnel.id), [getLeaveRequestsForUser, personnel.id]);

    const handleLeaveRequest = async () => {
        if (!startDate || !endDate) {
            showNotification('fieldsRequired', 'error');
            return;
        }
        await addLeaveRequest({ userId: personnel.id, type: leaveType, startDate, endDate, reason });
        showNotification('leaveRequestSent', 'success');
        setStartDate('');
        setEndDate('');
        setReason('');
    };

    const usedLeaveDays = useMemo(() => {
        return leaveHistory
            .filter(req => req.status === 'approved')
            .reduce((total, req) => {
                const start = new Date(req.startDate);
                const end = new Date(req.endDate);
                if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return total;
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                return total + diffDays;
            }, 0);
    }, [leaveHistory]);

    const remainingLeaveDays = (personnel.annualLeaveDays || 14) - usedLeaveDays;

    const getStatusClass = (status: LeaveRequest['status']) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'pending':
            default:
                return 'bg-yellow-100 text-yellow-800';
        }
    };

    const leaveHistoryColumns = [
        { header: t('date'), accessor: (item: LeaveRequest) => new Date(item.requestDate).toLocaleDateString() },
        { header: "Tür", accessor: (item: LeaveRequest) => item.type },
        { header: "Tarih Aralığı", accessor: (item: LeaveRequest) => `${new Date(item.startDate).toLocaleDateString()} - ${new Date(item.endDate).toLocaleDateString()}` },
        { 
            header: t('status'), 
            accessor: (item: LeaveRequest) => (
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(item.status)}`}>
                    {t(item.status)}
                </span>
            )
        },
        ...(currentUser?.role === 'admin' ? [{
            header: t('actions'),
            accessor: (item: LeaveRequest) => (
                item.status === 'pending' ? (
                    <div className="flex gap-2">
                        <Button size="sm" variant="success" onClick={() => approveLeaveRequest(item.id)}>{t('approve')}</Button>
                        <Button size="sm" variant="danger" onClick={() => rejectLeaveRequest(item.id)}>{t('reject')}</Button>
                    </div>
                ) : null
            )
        }] : [])
    ];

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <PerformanceCard label="Yıllık İzin Hakkı" value={personnel.annualLeaveDays || 14} color="blue" />
                <PerformanceCard label={t('usedLeave')} value={usedLeaveDays} color="orange" />
                <PerformanceCard label={t('remainingLeave')} value={remainingLeaveDays} color="green" />
            </div>

            <div className="bg-cnk-panel-light p-4 rounded-cnk-element mb-6 border border-cnk-border-light">
                <h4 className="font-bold text-lg mb-3">Yeni İzin Talebi Oluştur</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-sm font-medium">İzin Tipi</label>
                        <select value={leaveType} onChange={e => setLeaveType(e.target.value)} className="w-full mt-1 p-2 border border-cnk-border-light bg-cnk-bg-light rounded-md">
                            <option>Yıllık İzin</option>
                            <option>Raporlu</option>
                            <option>Ücretsiz İzin</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Başlangıç Tarihi</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full mt-1 p-2 border border-cnk-border-light bg-cnk-bg-light rounded-md"/>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Bitiş Tarihi</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full mt-1 p-2 border border-cnk-border-light bg-cnk-bg-light rounded-md"/>
                    </div>
                    <div className="md:col-span-3">
                        <label className="text-sm font-medium">Açıklama (İsteğe Bağlı)</label>
                        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className="w-full mt-1 p-2 border border-cnk-border-light bg-cnk-bg-light rounded-md"></textarea>
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <Button onClick={handleLeaveRequest}>{t('sendRequest')}</Button>
                </div>
            </div>
            
            <h4 className="font-bold text-lg mb-3">İzin Geçmişi</h4>
            <DataTable columns={leaveHistoryColumns} data={[...leaveHistory].reverse()} emptyStateMessage="İzin geçmişi bulunmuyor." />
        </div>
    );
};

const PersonnelDetail = ({ personnel, onEdit }: { personnel: User, onEdit: () => void }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('info');

    const tabs = [
        { id: 'info', label: t('personnelInfo') },
        { id: 'leaves', label: t('personnelLeaves') },
        { id: 'shifts', label: t('personnelShifts') },
        { id: 'km-tracking', label: t('vehicleKmTracking') },
        { id: 'expense-report', label: t('expenseReport') },
        { id: 'payroll', label: 'Puantaj ve Bordro' },
    ];

    return (
        <div className="bg-cnk-panel-light rounded-cnk-card shadow-md">
            {/* Header */}
            <div className="bg-cnk-accent-primary/10 p-6 rounded-t-cnk-card flex items-center space-x-6">
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
                                <CopyableInfoItem label={t('email')} value={personnel.username} />
                                <InfoItem label={t('role')} value={t(personnel.role)} />
                                <CopyableInfoItem label={t('phone')} value={personnel.phone} />
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
                {activeTab === 'km-tracking' && <PersonnelKmTrackingTab personnel={personnel} />}
                {activeTab === 'expense-report' && <PersonnelExpenseReportTab personnel={personnel} />}
                {activeTab === 'payroll' && <PersonnelPayrollTab personnel={personnel} />}
            </div>
        </div>
    );
};

const Users = ({ view }: { view: ViewState }) => {
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

    useEffect(() => {
        if (view.id && users.length > 0) {
            const userExists = users.some(u => u.id === view.id);
            if (userExists) {
                setSelectedPersonnelId(view.id);
            }
        }
    }, [view.id, users]);

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
                <p className="mt-4 rounded-cnk-element bg-yellow-500/10 p-4 text-yellow-300">{t('adminPrivilegeRequired')}</p>
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
                    <div className="bg-cnk-panel-light rounded-cnk-card shadow-md p-3 space-y-2 max-h-[75vh] overflow-y-auto">
                        {users.map(p => (
                            <div key={p.id} onClick={() => setSelectedPersonnelId(p.id)}
                                 className={`flex items-center justify-between p-3 rounded-cnk-element cursor-pointer ${selectedPersonnelId === p.id ? 'bg-cnk-accent-primary text-white shadow-md' : 'hover:bg-cnk-bg-light'}`}>
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
                        <div className="bg-cnk-panel-light rounded-cnk-card shadow-md p-8 text-center text-cnk-txt-muted-light h-full flex items-center justify-center">
                            <p>{t('selectPersonnelToView')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for Add/Edit */}
            {isModalOpen && <UserForm 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={personnelToEdit}
            />}
        </div>
    );
};

export default Users;
