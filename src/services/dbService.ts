import Dexie, { type Table } from 'dexie';
import { 
    User, Customer, Appointment, Interview, Offer, SyncQueueItem, 
    ErpSettings, StockItem, Invoice, LeaveRequest, KmRecord, 
    LocationRecord, ShiftTemplate, ShiftAssignment, TripRecord, 
    Notification, CalculatorState, CalculationHistoryItem, AISettings, 
    EmailDraft, Reconciliation, IncomingInvoice, OutgoingInvoice, 
    Warehouse, StockLevel, AuditLog 
} from '@/types';
import { MOCK_INCOMING_INVOICES, MOCK_OUTGOING_INVOICES } from './erpMockData';


export class AppDatabase extends Dexie {
    users!: Table<User, string>;
    customers!: Table<Customer, string>;
    appointments!: Table<Appointment, string>;
    interviews!: Table<Interview, string>;
    offers!: Table<Offer, string>;
    syncQueue!: Table<SyncQueueItem, number>;
    erpSettings!: Table<ErpSettings, string>;
    stockItems!: Table<StockItem, string>;
    invoices!: Table<Invoice, string>;
    leaveRequests!: Table<LeaveRequest, string>;
    kmRecords!: Table<KmRecord, string>;
    locationHistory!: Table<LocationRecord, string>;
    shiftTemplates!: Table<ShiftTemplate, string>;
    shiftAssignments!: Table<ShiftAssignment, string>;
    tripRecords!: Table<TripRecord, string>;
    notifications!: Table<Notification, string>;
    calculatorState!: Table<CalculatorState, string>;
    calculationHistory!: Table<CalculationHistoryItem, number>;
    aiSettings!: Table<AISettings, string>;
    emailDrafts!: Table<EmailDraft, string>;
    reconciliations!: Table<Reconciliation, string>;
    incomingInvoices!: Table<IncomingInvoice, string>;
    outgoingInvoices!: Table<OutgoingInvoice, string>;
    warehouses!: Table<Warehouse, string>;
    stockLevels!: Table<StockLevel, string>;
    auditLogs!: Table<AuditLog, number>;

    constructor() {
        super('CnkCrmDatabase');
        this.version(3).stores({
            users: 'id, &username',
            customers: 'id, &currentCode, name, email, taxNumber',
            appointments: 'id, customerId, userId, start',
            interviews: 'id, customerId, formTarihi',
            offers: 'id, &teklifNo, customerId, createdAt',
            syncQueue: '++id, timestamp',
            erpSettings: 'id',
            stockItems: 'id, &sku',
            invoices: 'id, customerId, userId, date',
            leaveRequests: 'id, userId, startDate',
            kmRecords: 'id, userId, date, type',
            locationHistory: 'id, userId, timestamp',
            shiftTemplates: 'id, name',
            shiftAssignments: 'id, &[personnelId+date]',
            tripRecords: 'id, userId, date',
            notifications: 'id, timestamp, *isRead',
            calculatorState: 'id',
            calculationHistory: '++id, timestamp',
            aiSettings: 'userId',
            emailDrafts: 'id, relatedObjectId, createdAt',
            reconciliations: 'id, customerId, period',
            incomingInvoices: 'faturaNo, tedarikciAdi, tarih',
            outgoingInvoices: 'faturaNo, musteriAdi, tarih, userId',
            warehouses: 'id, &code',
            stockLevels: 'id, stockItemId, warehouseCode',
            auditLogs: '++id, timestamp, userId, action',
        });
    }
}

export const db = new AppDatabase();

export const seedInitialData = async () => {
    try {
        await db.transaction('rw', db.incomingInvoices, db.outgoingInvoices, async () => {
            if (await db.incomingInvoices.count() === 0) {
                await db.incomingInvoices.bulkAdd(MOCK_INCOMING_INVOICES);
            }
            if (await db.outgoingInvoices.count() === 0) {
                await db.outgoingInvoices.bulkAdd(MOCK_OUTGOING_INVOICES);
            }
        });
        console.log('Sample invoice data loaded.');
        alert('Örnek fatura verileri yüklendi.');
    } catch (e) {
        console.error('Failed to seed data:', e);
        alert('Veri yüklenirken hata oluştu.');
    }
};
