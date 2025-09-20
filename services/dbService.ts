

import Dexie, { type Table } from 'dexie';
import { User, Customer, Appointment, Interview, Offer, ErpSettings, StockItem, Invoice, Notification, LeaveRequest, KmRecord, LocationRecord, AISettings, EmailDraft, Reconciliation, CalculatorState, CalculationHistoryItem, IncomingInvoice, OutgoingInvoice, AuditLog, ShiftTemplate, ShiftAssignment, Warehouse, StockLevel, SyncQueueItem, TripRecord } from '@/types';
import { MOCK_APPOINTMENTS, MOCK_CUSTOMERS } from '@/constants';
import { MOCK_INCOMING_INVOICES, MOCK_OUTGOING_INVOICES } from '@/services/erpMockData';

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
    syncQueue!: Table<SyncQueueItem, number>;
    tripRecords!: Table<TripRecord, string>;

    constructor() {
        super('CnkCrmDatabase');
        (this as Dexie).version(33).stores({
            users: 'id, &username',
            customers: 'id, &currentCode, name, createdAt, status',
            appointments: 'id, customerId, start, userId, status',
            interviews: 'id, customerId, formTarihi',
            offers: 'id, customerId, &teklifNo, createdAt, status',
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
            outgoingInvoices: '&faturaNo, vergiNo, tarih, userId',
            auditLogs: '++id, userId, entityId, timestamp',
            shiftTemplates: 'id, name',
            shiftAssignments: 'id, &[personnelId+date]',
            warehouses: 'id, &code',
            stockLevels: 'id, &[stockItemId+warehouseCode]',
            syncQueue: '++id, timestamp',
            tripRecords: 'id, userId, date',
        });
    }
}

export const db = new AppDatabase();

export const seedInitialData = async () => {
    try {
        // FIX: Replaced `db.tables` with an explicit list of tables for the transaction
        // to avoid a typing error where `tables` property was not found on `AppDatabase`.
        await db.transaction('rw', db.incomingInvoices, db.outgoingInvoices, async () => {
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

        console.log("Database is empty. Initializing with real data from images...");

        const realUsers: User[] = [
            {
                id: 'user-cenk-dikmen',
                username: 'cenk.dikmen',
                password: '1234',
                role: 'admin',
                name: 'CENK DİKMEN',
                jobTitle: 'Genel Müdür',
                phone: '+905334047938',
                employmentStatus: 'Aktif',
            },
            {
                id: 'user-ela-koc',
                username: 'ela.koc',
                password: '1234',
                role: 'muhasebe',
                name: 'ELA KOÇ',
                jobTitle: 'Muhasebe Müdürü',
                phone: '+905059697997',
                employmentStatus: 'Aktif',
            },
            {
                id: 'user-goksel-gurlenkaya',
                username: 'goksel.gurlenkaya',
                password: '1234',
                role: 'saha',
                name: 'GÖKSEL HÜSEYİN GÜRLENKAYA',
                tcNo: '12958069404',
                startDate: '2023-12-01',
                salary: 36250.00,
                jobTitle: 'Saha Personeli',
                employmentStatus: 'Aktif',
            },
            {
                id: 'user-hatice-kayretli',
                username: 'hatice.kayretli',
                password: '1234',
                role: 'saha',
                name: 'HATİCE KAYRETLİ',
                tcNo: '10255243282',
                startDate: '2025-01-22',
                salary: 25000.00,
                jobTitle: 'Saha Personeli',
                employmentStatus: 'Aktif',
            },
            {
                id: 'user-ilker-taya',
                username: 'ilker.taya',
                password: '1234',
                role: 'saha',
                name: 'İLKER TAYA',
                tcNo: '10298249128',
                startDate: '2025-04-21',
                salary: 29000.00,
                jobTitle: 'Saha Personeli',
                employmentStatus: 'Aktif',
            },
            {
                id: 'user-can-koseoglu',
                username: 'can.koseoglu',
                password: '1234',
                role: 'saha',
                name: 'CAN KÖSEOĞLU',
                tcNo: '12517644752',
                startDate: '2025-07-26',
                salary: 6000.00,
                jobTitle: 'Saha Personeli',
                employmentStatus: 'Aktif',
            },
            {
                id: 'user-onat-gorur',
                username: 'onat.gorur',
                password: '1234',
                role: 'saha',
                name: 'ONAT DENİZ GÖRÜR',
                tcNo: '25069544678',
                startDate: '2025-07-26',
                salary: 4420.94,
                jobTitle: 'Saha Personeli',
                employmentStatus: 'Aktif',
            }
        ];
        
        const defaultShiftTemplates: ShiftTemplate[] = [
            { id: 'sabah', name: 'Sabah Vardiyası', startTime: '08:00', endTime: '16:00' },
            { id: 'aksam', name: 'Akşam Vardiyası', startTime: '16:00', endTime: '00:00' },
            { id: 'gece', name: 'Gece Vardiyası', startTime: '00:00', endTime: '08:00' },
        ];

        const defaultWarehouses: Warehouse[] = [
            { id: 'merkez', code: 'MERKEZ', name: 'Merkez Depo' },
            { id: 'sube-a', code: 'SUBE-A', name: 'A Şubesi Deposu' },
        ];

        // FIX: Pass tables as an array to the transaction method to fix "Expected 3-6 arguments, but got 8" error.
        await db.transaction('rw', [db.users, db.shiftTemplates, db.warehouses, db.customers, db.appointments, db.erpSettings], async () => {
            await db.users.bulkPut(realUsers);
            await db.shiftTemplates.bulkAdd(defaultShiftTemplates);
            await db.warehouses.bulkAdd(defaultWarehouses);

            if (MOCK_CUSTOMERS.length > 0) {
                const customersToSeed: Customer[] = MOCK_CUSTOMERS.map((c, i) => ({
                    ...c,
                    id: (i + 1).toString(),
                    createdAt: new Date().toISOString(),
                    synced: true,
                }));
                await db.customers.bulkAdd(customersToSeed);
            }
            if (MOCK_APPOINTMENTS.length > 0) {
              const appointmentsToSeed: Appointment[] = MOCK_APPOINTMENTS.map((a, i) => ({
                  ...a,
                  id: `mock-apt-${i + 1}`,
                  userId: 'user-goksel-gurlenkaya', // Assign to a real saha user
                  createdAt: new Date().toISOString(),
                  status: 'active'
              }));
              await db.appointments.bulkAdd(appointmentsToSeed);
            }
            await db.erpSettings.put({ id: 'default', server: '192.168.1.100', databasePath: 'C:\\WOLVOX8\\WOLVOX.FDB', username: 'SYSDBA', isConnected: false });
        });
        
        await seedInitialData();

        console.log("Database seeded successfully with real data.");

    } catch (error) {
        console.error("Failed to seed database:", error);
        throw error;
    }
};