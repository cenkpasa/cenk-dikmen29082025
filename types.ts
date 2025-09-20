

export interface LeaveRequest {
    id: string;
    userId: string; 
    type: string;
    startDate: string;
    endDate: string;
    status: 'pending' | 'approved' | 'rejected';
    requestDate: string;
    reason: string;
}

export interface KmRecord {
    id: string;
    userId: string;
    date: string;
    km: number;
    type: 'morning' | 'evening';
}

export interface LocationRecord {
    id: string;
    userId: string;
    timestamp: string;
    latitude: number;
    longitude: number;
    isVisit?: boolean;
    customerId?: string;
}

export type UserRole = 'admin' | 'muhasebe' | 'saha';

export interface User {
    id:string;
    username:string;
    password?:string;
    role: UserRole;
    name:string;
    jobTitle?:string;
    avatar?:string;
    tcNo?:string;
    phone?:string;
    startDate?:string;
    employmentStatus?:string;
    bloodType?:string;
    licensePlate?:string;
    gender?: 'male' | 'female' | 'other';
    salary?: number;
    educationLevel?: string;
    address?: string;
    annualLeaveDays?: number;
    workType?: 'full-time' | 'part-time';
    vehicleModel?: string;
    vehicleInitialKm?: number;
    salesTarget?: number;
}

export interface Customer {
    id: string;
    name: string; 
    createdAt: string;
    status?: 'active' | 'passive';
    currentCode?: string;
    commercialTitle?: string;
    address?: string;
    country?: string;
    city?: string;
    district?: string;
    postalCode?: string;
    group?: string;
    subgroup1?: string;
    subgroup2?: string;
    phone1?: string;
    phone2?: string;
    homePhone?: string;
    mobilePhone1?: string;
    fax?: string;
    taxOffice?: string;
    taxNumber?: string;
    nationalId?: string;
    specialCode1?: string;
    specialCode2?: string;
    specialCode3?: string;
    registrationDate?: string;
    specialDate?: string;
    webcamImage?: string;
    notes?: string;
    email?: string;
    aiSentimentAnalysis?: { result: string; timestamp: string; };
    aiOpportunityAnalysis?: { result: string; timestamp: string; };
    aiNextStepSuggestion?: { result: string; timestamp: string; };
    synced?: boolean;
}

export interface Appointment {
    id: string;
    customerId: string;
    userId: string;
    title: string;
    start: string;
    end: string;
    allDay?: boolean;
    notes?: string;
    reminder?: string;
    createdAt?: string;
    status?: 'active' | 'cancelled';
}

export interface Interview {
    id: string;
    customerId: string;
    formTarihi: string;
    fuar: string;
    sektor: string[];
    ziyaretci: {
        firmaAdi: string;
        adSoyad: string;
        bolumu: string;
        telefon: string;
        adres: string;
        email: string;
        web: string;
    };
    aksiyonlar: {
        katalogGonderilecek: boolean;
        teklifGonderilecek: boolean;
        ziyaretEdilecek: boolean;
        bizZiyaretEdecek: {
            tarih: string;
            adSoyad: string;
        };
    };
    notlar: string;
    gorusmeyiYapan: string;
    createdAt: string;
    aiSummary?: string;
}

export interface OfferItem {
    id: string;
    cins: string;
    miktar: number;
    birim: string;
    fiyat: number;
    tutar: number;
    teslimSuresi: string;
}

export type OfferStatus = 'draft' | 'sent' | 'negotiation' | 'won' | 'lost';

export interface Offer {
    id: string;
    teklifNo: string;
    createdAt: string;
    customerId: string;
    currency: 'TRY' | 'USD' | 'EUR';
    firma: {
        yetkili: string;
        telefon: string;
        eposta: string;
        vade: string;
        teklifTarihi: string;
    };
    teklifVeren: {
        yetkili: string;
        telefon: string;
        eposta: string;
    };
    items: OfferItem[];
    notlar: string;
    toplam: number;
    kdv: number;
    genelToplam: number;
    aiFollowUpEmail?: string;
    status: OfferStatus;
    statusReason?: string;
}

export interface StockItem {
    id: string; // This will be the SKU or erpId
    erpId: string;
    sku: string;
    name: string;
    barcode?: string;
    unit?: string;
    price: number;
    isActive: boolean;
    lastSync: string;
}

export interface Warehouse {
    id: string;
    code: string;
    name: string;
}

export interface StockLevel {
    id: string;
    stockItemId: string; // Foreign key to StockItem's id (SKU)
    warehouseCode: string; // Foreign key to Warehouse's code
    qtyOnHand: number;
}


export interface Invoice {
    id: string;
    customerId: string;
    userId: string;
    date: string;
    totalAmount: number;
    currency: 'TRY' | 'USD' | 'EUR';
    items: {
        stockId: string;
        quantity: number;
        price: number;
    }[];
    description?: string;
}

export interface IncomingInvoice {
    faturaNo: string;
    tedarikciAdi: string;
    vergiNo: string;
    tarih: string; // ISO format string
    tutar: number;
    currency: 'TRY' | 'USD' | 'EUR';
    description?: string;
}

export interface OutgoingInvoice {
    faturaNo: string;
    musteriAdi: string;
    vergiNo: string;
    tarih: string; // ISO format string
    tutar: number;
    currency: 'TRY' | 'USD' | 'EUR';
    description?: string;
    userId: string; // Link to the user/salesperson
}

export interface ErpSettings {
    id: 'default';
    server: string;
    databasePath: string;
    username: string;
    isConnected: boolean;
    lastSyncStock?: string;
    lastSyncStockLevels?: string;
    lastSyncWarehouses?: string;
    lastSyncInvoices?: string;
    lastSyncCustomers?: string;
    lastSyncOffers?: string;
    lastSyncIncomingInvoices?: string;
    lastSyncOutgoingInvoices?: string;
}

export type Page = 'dashboard' | 'customers' | 'email' | 'appointments' | 'gorusme-formu' | 'teklif-yaz' | 'personnel' | 'hesaplama-araclari' | 'profile' | 'yapay-zeka' | 'konum-takip' | 'erp-entegrasyonu' | 'ai-ayarlari' | 'raporlar' | 'email-taslaklari' | 'mutabakat' | 'audit-log' | 'sales-pipeline';

export interface Notification {
    id: string;
    messageKey: string;
    replacements?: Record<string, string>;
    type: 'customer' | 'appointment' | 'offer' | 'interview' | 'system' | 'reconciliation';
    timestamp: string;
    isRead: boolean;
    link?: {
        page: Page;
        id?: string;
    };
}

export interface EmailDraft {
    id: string;
    createdAt: string;
    recipientEmail: string;
    recipientName: string;
    subject: string;
    body: string;
    status: 'draft' | 'sent';
    relatedObjectType: 'offer' | 'customer';
    relatedObjectId: string;
    generatedBy: 'ai_agent';
}

export interface AISettings {
    userId: string;
    isAgentActive: boolean;
    enableFollowUpDrafts: boolean;
    enableAtRiskAlerts: boolean;
    followUpDays: number;
    atRiskDays: number;
}

export type ReconciliationType = 'current_account' | 'ba' | 'bs';
export type ReconciliationStatus = 'draft' | 'in_review' | 'approved' | 'sent' | 'rejected';

export interface Reconciliation {
    id: string;
    customerId: string; // Can be derived from invoices' tax number
    type: ReconciliationType;
    period: string; // e.g., "2024-07"
    amount: number;
    currency: 'TRY' | 'USD' | 'EUR';
    status: ReconciliationStatus;
    createdAt: string;
    createdBy: string; // userId
    lastEmailSent?: string;
    customerResponse?: string;
    notes?: string;
    aiAnalysis?: string;
    incomingInvoiceId: string;
    outgoingInvoiceId: string;
}

export interface CalculatorState {
    id: 'default'; // Singleton state
    unit: 'metric' | 'inch';
    activeTab: string;
    inputs: Record<string, Record<string, string>>; // e.g., { turning: { Dm: '50' }, milling: { ... } }
}

export interface CalculationHistoryItem {
    id?: number;
    timestamp: number;
    module: string;
    unit: 'metric' | 'inch';
    summary: string;
}

export type ReportType = 
    'sales_performance' | 
    'customer_invoice_analysis' |
    'ai_analysis_summary' |
    'customer_segmentation' |
    'offer_success_analysis';
    
export interface AuditLog {
    id?: number;
    userId: string;
    userName: string;
    action: string;
    entity: string;
    entityId: string;
    timestamp: string;
    details?: string;
}

export interface ShiftTemplate {
    id: string;
    name: string;
    startTime: string; // "HH:mm"
    endTime: string;   // "HH:mm"
}

export interface ShiftAssignment {
    id: string;
    personnelId: string;
    shiftTemplateId: string;
    date: string; // "YYYY-MM-DD"
}

export interface SyncQueueItem {
    id?: number;
    type: 'add-customer'; // This can be expanded with more types like 'update-customer'
    payload: Customer;
    timestamp: number;
}
export interface TripRecord {
    id: string;
    userId: string;
    date: string; // YYYY-MM-DD
    startLocation: string;
    endLocation: string;
    notes: string;
    odometerStart: number;
    odometerEnd: number;
}

export interface TimesheetEntry {
    date: string; // YYYY-MM-DD
    dayOfWeek: number; // 0 for Sunday, 1 for Monday...
    status: 'work' | 'leave' | 'weekend' | 'absent';
    checkIn: string | null; // HH:mm
    checkOut: string | null; // HH:mm
    totalHours: number;
    overtimeHours: number;
    missingHours: number;
    leaveType?: string;
}

export interface PayrollData {
    grossSalary: number;
    sgkWorkerShare: number;
    unemploymentWorkerShare: number;
    incomeTaxBase: number;
    incomeTax: number;
    stampTax: number;
    netSalary: number;
    sgkEmployerShare: number;
    unemploymentEmployerShare: number;
    totalEmployerCost: number;
}