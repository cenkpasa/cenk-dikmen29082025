import Dexie, { type Table } from 'dexie';
import { User, Customer, Appointment, Interview, Offer, ErpSettings, StockItem, Invoice, Notification, LeaveRequest, KmRecord, LocationRecord, AISettings, EmailDraft, Reconciliation, CalculatorState, CalculationHistoryItem, IncomingInvoice, OutgoingInvoice, AuditLog, ShiftTemplate, ShiftAssignment, Warehouse, StockLevel, Task, Expense, PayrollEntry, EmailMessage } from '../types';
import { DEFAULT_ADMIN, MOCK_APPOINTMENTS, MOCK_CUSTOMERS } from '../constants';
import { MOCK_INCOMING_INVOICES, MOCK_OUTGOING_INVOICES } from './erpMockData';
import { v4 as uuidv4 } from 'uuid';

export class AppDatabase extends Dexie {
    users!: Table<User, string>;
    customers!: Table<Customer, string>;
    appointments!: Table<Appointment, string>;
    interviews!: Table<Interview, string>;
    offers!: Table<Offer, string>;
    tasks!: Table<Task, string>;
    expenses!: Table<Expense, string>;
    erpSettings!: Table<ErpSettings, 'default'>;
    stockItems!: Table<StockItem, string>;
    invoices!: Table<Invoice, string>;
    notifications!: Table<Notification, string>;
    leaveRequests!: Table<LeaveRequest, string>;
    kmRecords!: Table<KmRecord, string>;
    locationHistory!: Table<LocationRecord, string>;
    aiSettings!: Table<AISettings, string>;
    emailDrafts!: Table<EmailDraft, string>;
    emails!: Table<EmailMessage, string>;
    reconciliations!: Table<Reconciliation, string>;
    calculatorState!: Table<CalculatorState, 'default'>;
    calculationHistory!: Table<CalculationHistoryItem, number>;
    incomingInvoices!: Table<IncomingInvoice, string>;
    outgoingInvoices!: Table<OutgoingInvoice, string>;
    auditLogs!: Table<AuditLog, number>;
    shiftTemplates!: Table<ShiftTemplate, string>;
    shiftAssignments!: Table<ShiftAssignment, string>;
    warehouses!: Table<Warehouse, string>;
    stockLevels!: Table<StockLevel, string>;

    constructor() {
        super('CnkCrmDatabase');
        (this as Dexie).version(31).stores({
            users: 'id, &username',
            customers: 'id, &currentCode, name, createdAt, status, assignedToId',
            appointments: 'id, customerId, start, userId, assignedToId',
            interviews: 'id, customerId, formTarihi, gorusmeyiYapanId',
            offers: 'id, customerId, &teklifNo, createdAt, teklifVerenId',
            tasks: 'id, assignedToId, status, dueDate',
            expenses: 'id, userId, date, category',
            erpSettings: 'id',
            stockItems: 'id, &sku, name',
            invoices: 'id, customerId, userId, date',
            notifications: 'id, timestamp, isRead',
            leaveRequests: 'id, userId, requestDate, status',
            kmRecords: 'id, userId, date',
            locationHistory: 'id, userId, timestamp',
            aiSettings: 'userId',
            emailDrafts: 'id, createdAt, status, relatedObjectId',
            emails: 'id, timestamp, folder, isRead, subject, [folder+isRead]',
            reconciliations: 'id, customerId, status, period, createdAt',
            calculatorState: 'id',
            calculationHistory: '++id, timestamp',
            incomingInvoices: 'id, &faturaNo, vergiNo, tarih',
            outgoingInvoices: 'id, &faturaNo, vergiNo, tarih',
            auditLogs: '++id, userId, entityId, timestamp',
            shiftTemplates: 'id, name',
            shiftAssignments: 'id, &[personnelId+date]',
            warehouses: 'id, &code',
            stockLevels: 'id, &[stockItemId+warehouseCode]'
        });
    }
}

export const db = new AppDatabase();

/**
 * Seeds initial mock data for testing purposes.
 */
export const seedInitialData = async () => {
    const userCount = await db.users.count();
    if (userCount === 0) {
        // Fix: Explicitly ensuring DEFAULT_ADMIN has an id during add operation
        // to avoid "Evaluating the object store's key path did not yield a value" error.
        const adminData: User = {
            ...DEFAULT_ADMIN,
            id: DEFAULT_ADMIN.id || 'admin-id'
        };
        await db.users.add(adminData);
    }
    
    // Seed invoices if empty
    const incCount = await db.incomingInvoices.count();
    if (incCount === 0) {
        await db.incomingInvoices.bulkAdd(MOCK_INCOMING_INVOICES.map(i => ({...i, id: i.faturaNo} as IncomingInvoice)));
    }
    const outCount = await db.outgoingInvoices.count();
    if (outCount === 0) {
        await db.outgoingInvoices.bulkAdd(MOCK_OUTGOING_INVOICES.map(i => ({...i, id: i.faturaNo} as OutgoingInvoice)));
    }
};

seedInitialData();
