import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { LeaveRequest, KmRecord, LocationRecord, ShiftTemplate, ShiftAssignment } from '../types';
import { db } from '../services/dbService';
import { v4 as uuidv4 } from 'uuid';
import { useNotification } from './NotificationContext';
import { useLanguage } from './LanguageContext';
import { auditLogService } from '../services/auditLogService';
import { useAuth } from './AuthContext';

interface PersonnelContextType {
    leaveRequests: LeaveRequest[];
    kmRecords: KmRecord[];
    locationHistory: LocationRecord[];
    shiftTemplates: ShiftTemplate[];
    shiftAssignments: ShiftAssignment[];
    getLeaveRequestsForUser: (userId: string) => LeaveRequest[];
    getKmRecordsForUser: (userId: string) => KmRecord[];
    getLocationHistoryForUser: (userId: string) => LocationRecord[];
    getShiftAssignmentsForUser: (userId: string) => ShiftAssignment[];
    addLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'requestDate' | 'status'>) => Promise<void>;
    approveLeaveRequest: (requestId: string) => Promise<void>;
    rejectLeaveRequest: (requestId: string) => Promise<void>;
    addKmRecord: (record: Omit<KmRecord, 'id' | 'date'> & { date?: string }) => Promise<void>;
    addLocationRecord: (record: Omit<LocationRecord, 'id' | 'timestamp'>) => Promise<void>;
    assignShift: (assignment: Omit<ShiftAssignment, 'id'>) => Promise<void>;
    deleteShiftAssignment: (assignmentId: string) => Promise<void>;
}

const PersonnelContext = createContext<PersonnelContextType | undefined>(undefined);

export const PersonnelProvider = ({ children }: { children?: ReactNode }) => {
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();
    const { t } = useLanguage();
    
    const leaveRequests = useLiveQuery(() => db.leaveRequests.toArray(), []) || [];
    const kmRecords = useLiveQuery(() => db.kmRecords.toArray(), []) || [];
    const locationHistory = useLiveQuery(() => db.locationHistory.toArray(), []) || [];
    const shiftTemplates = useLiveQuery(() => db.shiftTemplates.toArray(), []) || [];
    const shiftAssignments = useLiveQuery(() => db.shiftAssignments.toArray(), []) || [];

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
    
    const addKmRecord = async (recordData: Omit<KmRecord, 'id' | 'date'> & { date?: string }) => {
        const newRecord: KmRecord = {
            ...recordData,
            id: uuidv4(),
            date: recordData.date || new Date().toISOString().slice(0, 10),
        };
        await db.kmRecords.add(newRecord);
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

    const deleteShiftAssignment = async (assignmentId: string) => {
        if (!currentUser || currentUser.role !== 'admin') return;
        const assignmentToDelete = shiftAssignments.find(a => a.id === assignmentId);
        await db.shiftAssignments.delete(assignmentId);
        if (assignmentToDelete) {
             await auditLogService.logAction(currentUser, 'DELETE_SHIFT_ASSIGNMENT', 'shiftAssignment', assignmentId, `Shift deleted for user ${assignmentToDelete.personnelId} on ${assignmentToDelete.date}`);
        }
        showNotification('shiftDeleted', 'success');
    };

    const value = {
        leaveRequests,
        kmRecords,
        locationHistory,
        shiftTemplates,
        shiftAssignments,
        getLeaveRequestsForUser,
        getKmRecordsForUser,
        getLocationHistoryForUser,
        getShiftAssignmentsForUser,
        addLeaveRequest,
        approveLeaveRequest,
        rejectLeaveRequest,
        addKmRecord,
        addLocationRecord,
        assignShift,
        deleteShiftAssignment,
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