import Dexie, { type Table } from 'dexie';
import { User, Customer, Appointment, Interview, Offer, ErpSettings, StockItem, Invoice, Notification, LeaveRequest, KmRecord, LocationRecord, AISettings, EmailDraft, Reconciliation, CalculatorState, CalculationHistoryItem, IncomingInvoice, OutgoingInvoice, AuditLog, ShiftTemplate, ShiftAssignment, Warehouse, StockLevel } from '../types';
import { DEFAULT_ADMIN, MOCK_APPOINTMENTS, MOCK_CUSTOMERS } from '../constants';
import { MOCK_INCOMING_INVOICES, MOCK_OUTGOING_INVOICES } from './erpMockData';

export class AppDatabase extends Dexie {
    users!: Table<User, string>;
    customers!: Table<Customer, string>;
    appointments!: Table<Appointment, string>;
    interviews!: Table<Interview, string>;
    offers!: Table<Offer, string>;
    erpSettings!: Table<ErpSettings, 'default'>;
    stockItems!: Table<StockItem, string>;
    invoices!: Table<Invoice, string>;
    notifications!: Table<Notification, string>;
    leaveRequests!: Table<LeaveRequest, string>;
    kmRecords!: Table<KmRecord, string>;
    locationHistory!: Table<LocationRecord, string>;
    aiSettings!: Table<AISettings, string>;
    emailDrafts!: Table<EmailDraft, string>;
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
        (this as Dexie).version(28).stores({
            users: 'id, &username',
            customers: 'id, &currentCode, name, createdAt, status',
            appointments: 'id, customerId, start, userId',
            interviews: 'id, customerId, formTarihi',
            offers: 'id, customerId, &teklifNo, createdAt',
            erpSettings: 'id',
            stockItems: 'id, &sku, name',
            invoices: 'id, customerId, userId, date',
            notifications: 'id, timestamp, isRead',
            leaveRequests: 'id, userId, requestDate, status',
            kmRecords: 'id, userId, date',
            locationHistory: 'id, userId, timestamp',
            aiSettings: 'userId',
            emailDrafts: 'id, createdAt, status, relatedObjectId',
            reconciliations: 'id, customerId, status, period, createdAt',
            calculatorState: 'id',
            calculationHistory: '++id, timestamp',
            incomingInvoices: '&faturaNo, vergiNo, tarih',
            outgoingInvoices: '&faturaNo, vergiNo, tarih',
            auditLogs: '++id, userId, entityId, timestamp',
            shiftTemplates: 'id, name',
            shiftAssignments: 'id, &[personnelId+date]',
            warehouses: 'id, &code',
            stockLevels: 'id, &[stockItemId+warehouseCode]'
        });
    }
}

export const db = new AppDatabase();

export const seedInitialData = async () => {
    try {
        await (db as Dexie).transaction('rw', db.tables, async () => {
            if ((await db.incomingInvoices.count()) === 0) {
                const incomingWithIds = MOCK_INCOMING_INVOICES.map(inv => ({ ...inv }));
                await db.incomingInvoices.bulkAdd(incomingWithIds);
            }
            if ((await db.outgoingInvoices.count()) === 0) {
                const outgoingWithIds = MOCK_OUTGOING_INVOICES.map(inv => ({ ...inv }));
                await db.outgoingInvoices.bulkAdd(outgoingWithIds);
            }
        });
        console.log("Sample invoice data seeded successfully.");
    } catch (error) {
        console.error("Failed to seed sample invoices:", error);
    }
};

export const seedDatabase = async () => {
    try {
        const userCount = await db.users.count();
        if (userCount > 0) {
            console.log("Database already contains user data. Skipping main seed.");
            await seedInitialData(); 
            return;
        }

        console.log("Database is empty. Initializing with default data...");

        const adminUser: User = { 
            id: 'admin-default', 
            ...DEFAULT_ADMIN, 
            password: DEFAULT_ADMIN.password || '1234',
        };
        
        const muhasebeUser: User = {
            id: 'user-muhasebe',
            username: 'muhasebe',
            password: '1234',
            role: 'muhasebe',
            name: 'Muhasebe Departmanı',
            jobTitle: 'Muhasebe Uzmanı',
            avatar: 'https://randomuser.me/api/portraits/women/76.jpg',
            salesTarget: 75000,
        };
        
        const sahaUser: User = {
            id: 'user-saha',
            username: 'saha',
            password: '1234',
            role: 'saha',
            name: 'Saha Personeli',
            jobTitle: 'Satış Temsilcisi',
            avatar: 'https://randomuser.me/api/portraits/men/75.jpg',
            salesTarget: 50000,
        };
        
        const defaultShiftTemplates: ShiftTemplate[] = [
            { id: 'sabah', name: 'Sabah Vardiyası', startTime: '08:00', endTime: '16:00' },
            { id: 'aksam', name: 'Akşam Vardiyası', startTime: '16:00', endTime: '00:00' },
            { id: 'gece', name: 'Gece Vardiyası', startTime: '00:00', endTime: '08:00' },
        ];

        const defaultWarehouses: Warehouse[] = [
            { id: 'merkez', code: 'MERKEZ', name: 'Merkez Depo' },
            { id: 'sube-a', code: 'SUBE-A', name: 'A Şubesi Deposu' },
        ];

        await (db as Dexie).transaction('rw', db.tables, async () => {
            await db.users.bulkPut([adminUser, muhasebeUser, sahaUser]);
            await db.shiftTemplates.bulkAdd(defaultShiftTemplates);
            await db.warehouses.bulkAdd(defaultWarehouses);

            if (MOCK_CUSTOMERS.length > 0) {
                const customersToSeed: Customer[] = MOCK_CUSTOMERS.map((c, i) => ({
                    ...c,
                    id: (i + 1).toString(),
                    createdAt: new Date().toISOString(),
                }));
                await db.customers.bulkAdd(customersToSeed);
            }
            if (MOCK_APPOINTMENTS.length > 0) {
              const appointmentsToSeed: Appointment[] = MOCK_APPOINTMENTS.map((a, i) => ({
                  ...a,
                  id: `mock-apt-${i + 1}`,
                  userId: 'user-saha',
                  createdAt: new Date().toISOString()
              }));
              await db.appointments.bulkAdd(appointmentsToSeed);
            }
            await db.erpSettings.put({ id: 'default', server: '192.168.1.100', databasePath: 'C:\\WOLVOX8\\WOLVOX.FDB', username: 'SYSDBA', isConnected: false });
        });
        
        await seedInitialData();

        console.log("Database seeded successfully.");

    } catch (error) {
        console.error("Failed to seed database:", error);
        throw error;
    }
};