

import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { LeaveRequest, KmRecord, LocationRecord, ShiftTemplate, ShiftAssignment, TripRecord, TimesheetEntry, PayrollData, User } from '../types';
import { db } from '../services/dbService';
import { v4 as uuidv4 } from 'uuid';
import { useNotification } from './NotificationContext';
import { useLanguage } from './LanguageContext';
import { auditLogService } from '../services/auditLogService';
import { useAuth } from './AuthContext';
import { getDistance } from '../utils/location';
import { calculatePayroll } from '../utils/payroll';
import { WORKPLACE_COORDS, WORKPLACE_RADIUS_KM, WORK_HOURS } from '../constants';

interface PersonnelContextType {
    leaveRequests: LeaveRequest[];
    kmRecords: KmRecord[];
    locationHistory: LocationRecord[];
    shiftTemplates: ShiftTemplate[];
    shiftAssignments: ShiftAssignment[];
    tripRecords: TripRecord[];
    getLeaveRequestsForUser: (userId: string) => LeaveRequest[];
    getKmRecordsForUser: (userId: string) => KmRecord[];
    getLocationHistoryForUser: (userId: string) => LocationRecord[];
    getShiftAssignmentsForUser: (userId: string) => ShiftAssignment[];
    getTripRecordsForUser: (userId: string) => TripRecord[];
    addLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'requestDate' | 'status'>) => Promise<void>;
    approveLeaveRequest: (requestId: string) => Promise<void>;
    rejectLeaveRequest: (requestId: string) => Promise<void>;
    addKmRecord: (record: Omit<KmRecord, 'id'>) => Promise<void>;
    addLocationRecord: (record: Omit<LocationRecord, 'id' | 'timestamp'>) => Promise<void>;
    assignShift: (assignment: Omit<ShiftAssignment, 'id'>) => Promise<void>;
    addOrUpdateTripRecords: (records: TripRecord[]) => Promise<void>;
    generateTimesheetAndPayroll: (userId: string, year: number, month: number) => Promise<{ timesheet: TimesheetEntry[], payroll: PayrollData | null }>;
}

const PersonnelContext = createContext<PersonnelContextType | undefined>(undefined);

export const PersonnelProvider = ({ children }: { children: ReactNode }) => {
    const { currentUser, users } = useAuth();
    const { showNotification } = useNotification();
    const { t } = useLanguage();
    
    const leaveRequests = useLiveQuery(() => db.leaveRequests.toArray(), []) || [];
    const kmRecords = useLiveQuery(() => db.kmRecords.toArray(), []) || [];
    const locationHistory = useLiveQuery(() => db.locationHistory.toArray(), []) || [];
    const shiftTemplates = useLiveQuery(() => db.shiftTemplates.toArray(), []) || [];
    const shiftAssignments = useLiveQuery(() => db.shiftAssignments.toArray(), []) || [];
    const tripRecords = useLiveQuery(() => db.tripRecords.toArray(), []) || [];

    const getLeaveRequestsForUser = useCallback((userId: string) => {
        return leaveRequests.filter(r => r.userId === userId);
    }, [leaveRequests]);

    const getKmRecordsForUser = useCallback((userId: string) => {
        return kmRecords.filter(r => r.userId === userId);
    }, [kmRecords]);
    
    const getLocationHistoryForUser = useCallback((userId: string) => {
        return locationHistory.filter(r => r.userId === userId);
    }, [locationHistory]);

    const getShiftAssignmentsForUser = useCallback((userId: string) => {
        return shiftAssignments.filter(a => a.personnelId === userId);
    }, [shiftAssignments]);

    const getTripRecordsForUser = useCallback((userId: string) => {
        return tripRecords.filter(r => r.userId === userId);
    }, [tripRecords]);


    const addLeaveRequest = async (requestData: Omit<LeaveRequest, 'id' | 'requestDate' | 'status'>) => {
        if (!currentUser) return;
        const newRequest: LeaveRequest = {
            ...requestData,
            id: uuidv4(),
            requestDate: new Date().toISOString(),
            status: 'pending'
        };
        await db.leaveRequests.add(newRequest);
        await auditLogService.logAction(currentUser, 'CREATE_LEAVE_REQUEST', 'leaveRequest', newRequest.id);
    };

    const approveLeaveRequest = async (requestId: string) => {
        if (!currentUser || currentUser.role !== 'admin') return;
        await db.leaveRequests.update(requestId, { status: 'approved' });
        await auditLogService.logAction(currentUser, 'APPROVE_LEAVE_REQUEST', 'leaveRequest', requestId);
        showNotification('leaveStatusUpdated', 'success');
    };

    const rejectLeaveRequest = async (requestId: string) => {
        if (!currentUser || currentUser.role !== 'admin') return;
        await db.leaveRequests.update(requestId, { status: 'rejected' });
        await auditLogService.logAction(currentUser, 'REJECT_LEAVE_REQUEST', 'leaveRequest', requestId);
        showNotification('leaveStatusUpdated', 'success');
    };
    
    const addKmRecord = async (recordData: Omit<KmRecord, 'id'>) => {
        if (!currentUser) return;

        const existingRecord = await db.kmRecords
            .where({
                userId: recordData.userId,
                date: recordData.date,
                type: recordData.type,
            })
            .first();
    
        if (existingRecord) {
            await db.kmRecords.update(existingRecord.id, { km: recordData.km });
            await auditLogService.logAction(currentUser, 'UPDATE_KM_RECORD', 'kmRecord', existingRecord.id);
        } else {
            const newRecord: KmRecord = {
                ...recordData,
                id: uuidv4(),
            };
            await db.kmRecords.add(newRecord);
            await auditLogService.logAction(currentUser, 'CREATE_KM_RECORD', 'kmRecord', newRecord.id);
        }
    };

    const addLocationRecord = async (recordData: Omit<LocationRecord, 'id' | 'timestamp'>) => {
        const newRecord: LocationRecord = {
            ...recordData,
            id: uuidv4(),
            timestamp: new Date().toISOString(),
        };
       await db.locationHistory.add(newRecord);
    };

    const assignShift = async (assignmentData: Omit<ShiftAssignment, 'id'>) => {
        if (!currentUser || currentUser.role !== 'admin') return;
        const newAssignment: ShiftAssignment = {
            ...assignmentData,
            id: uuidv4(),
        };
        await db.shiftAssignments.put(newAssignment);
        await auditLogService.logAction(currentUser, 'ASSIGN_SHIFT', 'shiftAssignment', newAssignment.id, `Shift assigned to user ${newAssignment.personnelId} on ${newAssignment.date}`);
        showNotification('shiftAssigned', 'success');
    };

    const addOrUpdateTripRecords = async (records: TripRecord[]) => {
        if (!currentUser) return;
        await db.tripRecords.bulkPut(records);
        const userId = records.length > 0 ? records[0].userId : 'unknown';
        await auditLogService.logAction(currentUser, 'BULK_UPDATE_TRIP_RECORDS', 'tripRecord', 'multiple', `Updated ${records.length} trip records for user ID ${userId}.`);
    };

    const generateTimesheetAndPayroll = useCallback(async (userId: string, year: number, month: number): Promise<{ timesheet: TimesheetEntry[], payroll: PayrollData | null }> => {
        const user = users.find(u => u.id === userId);
        if (!user) return { timesheet: [], payroll: null };

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        const userLocations = locationHistory.filter(l => {
            const d = new Date(l.timestamp);
            return l.userId === userId && d >= startDate && d <= endDate;
        });

        const userLeaves = leaveRequests.filter(l => l.userId === userId && l.status === 'approved');

        const timesheet: TimesheetEntry[] = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().slice(0, 10);
            const dayOfWeek = d.getDay();
            const entry: TimesheetEntry = { date: dateStr, dayOfWeek, status: 'absent', checkIn: null, checkOut: null, totalHours: 0, overtimeHours: 0, missingHours: 0 };
            
            const isLeaveDay = userLeaves.some(l => {
                const leaveStart = new Date(l.startDate);
                const leaveEnd = new Date(l.endDate);
                return d >= leaveStart && d <= leaveEnd;
            });
            if (isLeaveDay) {
                entry.status = 'leave';
                timesheet.push(entry);
                continue;
            }

            const workSchedule = WORK_HOURS[dayOfWeek as keyof typeof WORK_HOURS];
            if (!workSchedule) {
                entry.status = 'weekend';
                timesheet.push(entry);
                continue;
            }

            const dailyLocations = userLocations
                .filter(l => new Date(l.timestamp).toISOString().slice(0, 10) === dateStr)
                .filter(l => getDistance(l.latitude, l.longitude, WORKPLACE_COORDS.latitude, WORKPLACE_COORDS.longitude) <= WORKPLACE_RADIUS_KM)
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            if (dailyLocations.length > 0) {
                entry.status = 'work';
                const checkInTime = new Date(dailyLocations[0].timestamp);
                const checkOutTime = new Date(dailyLocations[dailyLocations.length - 1].timestamp);

                entry.checkIn = checkInTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                entry.checkOut = checkOutTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                
                const durationMs = checkOutTime.getTime() - checkInTime.getTime();
                const totalHours = (durationMs / (1000 * 60 * 60));
                entry.totalHours = totalHours > workSchedule.lunch ? totalHours - workSchedule.lunch : totalHours;

                const scheduledHours = (new Date(`1970-01-01T${workSchedule.end}:00`).getTime() - new Date(`1970-01-01T${workSchedule.start}:00`).getTime()) / (1000 * 60 * 60) - workSchedule.lunch;
                
                if (entry.totalHours > scheduledHours) {
                    entry.overtimeHours = entry.totalHours - scheduledHours;
                } else {
                    entry.missingHours = scheduledHours - entry.totalHours;
                }
            } else {
                 entry.missingHours = (new Date(`1970-01-01T${workSchedule.end}:00`).getTime() - new Date(`1970-01-01T${workSchedule.start}:00`).getTime()) / (1000 * 60 * 60) - workSchedule.lunch;
            }
            timesheet.push(entry);
        }

        const payroll = calculatePayroll(timesheet, user);
        return { timesheet, payroll };

    }, [locationHistory, leaveRequests, users]);


    const value = {
        leaveRequests,
        kmRecords,
        locationHistory,
        shiftTemplates,
        shiftAssignments,
        tripRecords,
        getLeaveRequestsForUser,
        getKmRecordsForUser,
        getLocationHistoryForUser,
        getShiftAssignmentsForUser,
        getTripRecordsForUser,
        addLeaveRequest,
        approveLeaveRequest,
        rejectLeaveRequest,
        addKmRecord,
        addLocationRecord,
        assignShift,
        addOrUpdateTripRecords,
        generateTimesheetAndPayroll
    };

    return (
        <PersonnelContext.Provider value={value}>
            {children}
        </PersonnelContext.Provider>
    );
};

export const usePersonnel = (): PersonnelContextType => {
    const context = useContext(PersonnelContext);
    if (!context) {
        throw new Error('usePersonnel must be used within a PersonnelProvider');
    }
    return context;
};
