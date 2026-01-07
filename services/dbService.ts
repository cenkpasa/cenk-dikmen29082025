
import Dexie, { type Table } from 'dexie';
import { User, Customer, Appointment, Interview, Offer, ErpSettings, StockItem, Invoice, Notification, LeaveRequest, KmRecord, LocationRecord, AISettings, EmailDraft, Reconciliation, CalculatorState, CalculationHistoryItem, IncomingInvoice, OutgoingInvoice, AuditLog, ShiftTemplate, ShiftAssignment, Warehouse, StockLevel, Task, Expense, PayrollEntry, EmailMessage, EmailAccountSettings, Contact, Attachment } from '../types';
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
    emailSettings!: Table<EmailAccountSettings, string>;
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
    contacts!: Table<Contact, string>;

    constructor() {
        super('CnkCrmDatabase');
        (this as Dexie).version(35).stores({
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
            emails: 'id, accountId, timestamp, folder, isRead, subject, [folder+isRead]',
            emailSettings: 'id',
            reconciliations: 'id, customerId, status, period, createdAt',
            calculatorState: 'id',
            calculationHistory: '++id, timestamp',
            incomingInvoices: 'id, &faturaNo, vergiNo, tarih',
            outgoingInvoices: 'id, &faturaNo, vergiNo, tarih',
            auditLogs: '++id, userId, entityId, timestamp',
            shiftTemplates: 'id, name',
            shiftAssignments: 'id, &[personnelId+date]',
            warehouses: 'id, &code',
            stockLevels: 'id, &[stockItemId+warehouseCode]',
            contacts: 'id, &email, name'
        });
    }
}

export const db = new AppDatabase();

// Helper to generate large simulated attachments
const createMockAttachments = (count: number): Attachment[] => {
    const types = [
        { ext: 'pdf', mime: 'application/pdf', name: 'Teknik_Cizim_v' },
        { ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', name: 'Stok_Raporu_202' },
        { ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', name: 'Sozlesme_Taslagi_' },
        { ext: 'jpg', mime: 'image/jpeg', name: 'Fabrika_Foto_' },
        { ext: 'zip', mime: 'application/zip', name: 'Yedek_Arsiv_' }
    ];
    
    const attachments: Attachment[] = [];
    for(let i=0; i<count; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        // Simulate massive sizes: 5MB to 8.5 GB
        const size = Math.floor(Math.random() * (8500 * 1024 * 1024 - 5 * 1024 * 1024) + 5 * 1024 * 1024); 
        
        attachments.push({
            id: uuidv4(),
            name: `${type.name}${Math.floor(Math.random() * 100)}.${type.ext}`,
            size: size,
            type: type.mime,
            isSimulated: true
        });
    }
    return attachments;
};

const DEFAULT_ACCOUNT_ID = 'default-account-id';

// Realistic mock emails for history
const MOCK_EMAIL_HISTORY: EmailMessage[] = [
    {
        id: uuidv4(),
        accountId: DEFAULT_ACCOUNT_ID,
        from: { name: 'Ahmet Yılmaz', email: 'ahmet.yilmaz@musteri.com' },
        to: { name: 'Cenk Dikmen', email: 'satis@cnkkesicitakim.com.tr' },
        subject: 'Fiyat Teklifi Talebi - Karbür Uçlar',
        body: 'Merhaba Cenk Bey,\n\nEkteki teknik resimdeki parçalar için kullanabileceğimiz karbür uçlar hakkında fiyat teklifi rica ediyorum. Yıllık tüketimimiz yaklaşık 500 adet olacaktır.\n\nİyi çalışmalar,\nAhmet Yılmaz\nSatın Alma Müdürü',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
        isRead: true,
        folder: 'inbox',
        attachments: createMockAttachments(2)
    },
    {
        id: uuidv4(),
        accountId: DEFAULT_ACCOUNT_ID,
        from: { name: 'Cenk Dikmen', email: 'satis@cnkkesicitakim.com.tr' },
        to: { name: 'Ahmet Yılmaz', email: 'ahmet.yilmaz@musteri.com' },
        subject: 'RE: Fiyat Teklifi Talebi - Karbür Uçlar',
        body: 'Merhaba Ahmet Bey,\n\nİlginiz için teşekkürler. İlgili ürünler için teklifimiz ektedir. Stoklarımızda mevcuttur, sipariş onayı durumunda 2 gün içinde sevk edebiliriz.\n\nSaygılarımla,\nCenk Dikmen\nCNK Kesici Takım',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), // 4 days ago
        isRead: true,
        folder: 'sent',
        attachments: createMockAttachments(1)
    },
    {
        id: uuidv4(),
        accountId: DEFAULT_ACCOUNT_ID,
        from: { name: 'Mehmet Demir', email: 'mehmet@tedarikci.com' },
        to: { name: 'Satis Ekibi', email: 'satis@cnkkesicitakim.com.tr' },
        subject: 'Yeni Ürün Kataloğu 2025 (Dev Arşiv)',
        body: 'Değerli İş Ortağımız,\n\n2025 yılı yeni ürün kataloğumuz ve yüksek çözünürlüklü görseller ektedir. Dosya boyutu büyük olduğu için indirirken dikkat ediniz.\n\nSaygılar,\nMehmet Demir',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        isRead: false,
        folder: 'inbox',
        attachments: [
            { id: uuidv4(), name: '2025_Katalog_Full.pdf', size: 1024 * 1024 * 450, type: 'application/pdf', isSimulated: true }, // 450 MB
            { id: uuidv4(), name: 'Urun_Gorselleri_RAW.zip', size: 1024 * 1024 * 1024 * 4.2, type: 'application/zip', isSimulated: true } // 4.2 GB
        ]
    }
];

// Function to generate massive historical data on demand
export const generateMassiveHistory = (accountId: string): EmailMessage[] => {
    const emails: EmailMessage[] = [];
    const subjects = [
        "Sipariş Onayı", "Teknik Destek Talebi", "Fatura Gönderimi", "Toplantı Notları", 
        "Proje Güncellemesi", "Stok Durumu", "Yeni Ürün Tanıtımı", "İade İşlemleri", 
        "Kargo Takip", "Bayram Tebriği", "Aylık Rapor", "Yıllık Bakım Anlaşması"
    ];
    
    // Generate ~150 emails spread over 3 years
    for (let i = 0; i < 150; i++) {
        const daysAgo = Math.floor(Math.random() * 1000);
        const hasAttachments = Math.random() > 0.4;
        const subject = subjects[Math.floor(Math.random() * subjects.length)];
        
        emails.push({
            id: uuidv4(),
            accountId: accountId,
            from: { name: `Müşteri ${Math.floor(Math.random() * 50)}`, email: `musteri${Math.floor(Math.random() * 50)}@firma.com` },
            to: { name: 'Satis', email: 'satis@cnkkesicitakim.com.tr' },
            subject: `${subject} - #${1000+i}`,
            body: "Merhaba,\n\nİlgili konu hakkındaki detaylar ektedir veya aşağıda belirtilmiştir.\n\nİyi çalışmalar.",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * daysAgo).toISOString(),
            isRead: true,
            folder: Math.random() > 0.3 ? 'inbox' : 'sent',
            attachments: hasAttachments ? createMockAttachments(Math.floor(Math.random() * 4) + 1) : []
        });
    }
    return emails;
};

/**
 * Seeds initial mock data for testing purposes.
 */
export const seedInitialData = async () => {
    // FIX: Always ensure admin exists and has correct credentials on startup
    const adminUser = await db.users.get('admin-id');
    const adminData: User = {
        ...DEFAULT_ADMIN,
        id: 'admin-id' // Ensure ID matches constants
    };

    if (!adminUser) {
        console.log("Seeding default admin user...");
        await db.users.add(adminData);
    } else {
        // Force update password to ensure login works even if it was changed
        if (adminUser.password !== DEFAULT_ADMIN.password) {
            console.log("Resetting admin password to default...");
            await db.users.update('admin-id', { password: DEFAULT_ADMIN.password });
        }
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

    // Seed default email settings if empty
    const accountCount = await db.emailSettings.count();
    if (accountCount === 0) {
        const defaultSettings: EmailAccountSettings = {
            id: DEFAULT_ACCOUNT_ID,
            accountName: 'CNK Satış',
            provider: 'other',
            color: '#3b82f6', // Blue
            status: 'active',
            emailAddress: 'satis@cnkkesicitakim.com.tr',
            senderName: 'Cenk Dikmen',
            signature: '\n\n--\nCenk Dikmen\nGenel Müdür\nCNK Kesici Takım\nTel: +90 312 395 55 55\nWeb: www.cnkkesicitakim.com.tr',
            imapHost: 'imap.yandex.com',
            imapPort: 993,
            imapUser: 'satis@cnkkesicitakim.com.tr',
            imapPass: '',
            imapSecurity: 'ssl',
            smtpHost: 'smtp.yandex.com',
            smtpPort: 465,
            smtpUser: 'satis@cnkkesicitakim.com.tr',
            smtpPass: '',
            smtpSecurity: 'ssl'
        };
        await db.emailSettings.add(defaultSettings);
    }

    // Seed emails if empty
    const emailCount = await db.emails.count();
    if (emailCount === 0) {
        console.log("Seeding email history...");
        await db.emails.bulkAdd(MOCK_EMAIL_HISTORY);
        
        // Seed contacts from initial emails
        console.log("Seeding contacts from initial emails...");
        const contactsMap = new Map<string, Contact>();
        
        MOCK_EMAIL_HISTORY.forEach(email => {
            // Process sender
            if (email.folder === 'inbox') {
                if (!contactsMap.has(email.from.email)) {
                    contactsMap.set(email.from.email, {
                        id: uuidv4(),
                        name: email.from.name,
                        email: email.from.email,
                        source: 'incoming',
                        lastContacted: email.timestamp
                    });
                }
            } else if (email.folder === 'sent') {
                // Process recipient
                if (!contactsMap.has(email.to.email)) {
                    contactsMap.set(email.to.email, {
                        id: uuidv4(),
                        name: email.to.name,
                        email: email.to.email,
                        source: 'outgoing',
                        lastContacted: email.timestamp
                    });
                }
            }
        });
        
        const contacts = Array.from(contactsMap.values());
        if (contacts.length > 0) {
            await db.contacts.bulkPut(contacts);
        }
    }
};

seedInitialData();
