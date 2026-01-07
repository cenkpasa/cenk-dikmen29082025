
export type UserRole = 'admin' | 'saha' | 'muhasebe';

// ... existing interfaces ...

export interface Attachment {
    id: string;
    name: string;
    size: number; // in bytes
    type: string; // MIME type
    url?: string; // For preview if available
    isSimulated?: boolean; // True if it's a mock large file
}

export interface EmailMessage {
    id: string;
    accountId: string; // Added to link email to specific account
    from: { name: string; email: string };
    to: { name: string; email: string };
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    timestamp: string;
    isRead: boolean;
    folder: 'inbox' | 'sent' | 'drafts' | 'trash';
    relatedToEntity?: 'customer' | 'offer';
    relatedToId?: string;
    attachments?: Attachment[];
}

export interface Contact {
    id: string;
    name: string;
    email: string;
    company?: string;
    source: 'manual' | 'incoming' | 'outgoing';
    lastContacted?: string;
}

export interface EmailAccountSettings {
    id: string; // GUID
    accountName: string; // e.g. "Work Email"
    provider: 'gmail' | 'outlook' | 'yahoo' | 'other';
    color: string; // UI color tag
    emailAddress: string;
    senderName: string;
    signature?: string;
    
    // Incoming (IMAP) - Still needed for potential backend integration
    imapHost: string;
    imapPort: number;
    imapUser: string;
    imapPass: string;
    imapSecurity: 'ssl' | 'tls' | 'none';
    
    // Outgoing (SMTP) - Kept for reference, but EmailJS is used for real browser sending
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    smtpSecurity: 'ssl' | 'tls' | 'none';

    // EmailJS Configuration (For Real Sending from Browser)
    useEmailJs?: boolean;
    emailJsServiceId?: string;
    emailJsTemplateId?: string;
    emailJsPublicKey?: string;

    // Status
    lastSync?: string;
    status: 'active' | 'error' | 'syncing';
}

// ... existing interfaces ...

export interface EmailDraft {
    id: string;
    createdAt: string;
    recipientEmail: string;
    recipientName: string;
    subject: string;
    body: string;
    status: 'draft' | 'sent';
    relatedObjectType?: 'offer' | 'customer';
    relatedObjectId?: string;
    generatedBy?: 'ai_agent' | 'user';
}

export interface ErpSettings {
    id: 'default';
    server: string;
    databasePath: string;
    username: string;
    isConnected: boolean;
    lastSyncCustomers?: string;
    lastSyncInvoices?: string;
    lastSyncOffers?: string;
    lastSyncStock?: string;
    lastSyncStockLevels?: string;
    lastSyncIncomingInvoices?: string;
    lastSyncOutgoingInvoices?: string;
}

export interface StockItem {
    id: string;
    erpId: string;
    sku: string;
    name: string;
    barcode: string;
    unit: string;
    price: number;
    isActive: boolean;
    lastSync: string;
}

export interface Invoice {
    id: string;
    customerId: string;
    userId: string;
    date: string;
    totalAmount: number;
    currency: 'TRY' | 'USD' | 'EUR';
    description?: string;
    items?: { stockId: string; quantity: number; price: number }[];
}

export interface Notification {
    id: string;
    timestamp: string;
    isRead: boolean;
    messageKey: string;
    replacements?: Record<string, string>;
    type: 'customer' | 'appointment' | 'offer' | 'interview' | 'system' | 'reconciliation';
    link?: { page: Page; id?: string };
}

export interface LeaveRequest {
    id: string;
    userId: string;
    requestDate: string;
    type: string;
    startDate: string;
    endDate: string;
    reason?: string;
    status: 'pending' | 'approved' | 'rejected';
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

export interface AISettings {
    userId: string;
    isAgentActive: boolean;
    enableFollowUpDrafts: boolean;
    enableAtRiskAlerts: boolean;
    followUpDays: number;
    atRiskDays: number;
}

export interface Reconciliation {
    id: string;
    customerId: string;
    type: 'current_account' | 'ba_bs';
    period: string;
    amount: number;
    currency: 'TRY' | 'USD' | 'EUR';
    status: 'draft' | 'sent' | 'in_review' | 'approved' | 'rejected';
    incomingInvoiceId: string;
    outgoingInvoiceId: string;
    notes?: string;
    customerResponse?: string;
    aiAnalysis?: string;
    createdBy: string;
    createdAt: string;
}

export interface CalculatorState {
    id: 'default';
    unit: 'metric' | 'inch';
    activeTab: string;
    inputs: any;
}

export interface CalculationHistoryItem {
    id: number;
    timestamp: number;
    module: string;
    unit: 'metric' | 'inch';
    summary: string;
}

export interface IncomingInvoice {
    id: string;
    faturaNo: string;
    tedarikciAdi: string;
    vergiNo: string;
    tarih: string;
    tutar: number;
    currency: 'TRY' | 'USD' | 'EUR';
    description: string;
}

export interface OutgoingInvoice {
    id: string;
    faturaNo: string;
    musteriAdi: string;
    vergiNo: string;
    tarih: string;
    tutar: number;
    currency: 'TRY' | 'USD' | 'EUR';
    description: string;
}

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
    startTime: string;
    endTime: string;
}

export interface ShiftAssignment {
    id: string;
    personnelId: string;
    shiftTemplateId: string;
    date: string;
    createdBy?: string;
}

export interface Warehouse {
    id: string;
    code: string;
    name: string;
}

export interface StockLevel {
    id: string;
    stockItemId: string;
    warehouseCode: string;
    qtyOnHand: number;
}

export type ReportType = 'sales_performance' | 'customer_invoice_analysis' | 'ai_analysis_summary' | 'customer_segmentation' | 'offer_success_analysis' | 'mileage_expense_report' | 'profit_loss_statement';

export interface ReportFilters {
    reportType: ReportType;
    dateRange: { start: string; end: string };
    userId?: string;
}

export interface MileageReportData {
    employeeName: string;
    employeeId: string;
    vehicleDescription: string;
    authorizer: string;
    ratePerKm: number;
    periodStart: string;
    periodEnd: string;
    logs: {
        id: string;
        date: string;
        startLocation: string;
        endLocation: string;
        description: string;
        startOdometer: number;
        endOdometer: number;
    }[];
}

export interface FinancialAccountData {
    name: string;
    monthlyValues: number[];
}

export interface FinancialData {
    year: number;
    revenues: FinancialAccountData[];
    cogs: FinancialAccountData[];
    expenses: FinancialAccountData[];
}

export interface DFMAnalysisItem {
    issueType: 'critical' | 'warning' | 'info';
    description: string;
    suggestion: string;
}

export interface QuoteEstimation {
    materialCost: number;
    machiningTimeHours: number;
    machiningCost: number;
    setupCost: number;
    totalEstimatedCost: number;
    suggestedQuotePrice: number;
    lineItems: {
        description: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }[];
}

export interface PayrollEntry {
    month: string;
    grossSalary: number;
    netSalary: number;
    totalEmployerCost: number;
    sgkWorker: number;
    unemploymentWorker: number;
    incomeTax: number;
    stampTax: number;
    sgkEmployer: number;
    unemploymentEmployer: number;
}

export interface User {
    id: string;
    username: string;
    password?: string;
    role: UserRole;
    name: string;
    jobTitle?: string;
    avatar?: string;
    tcNo?: string;
    phone?: string;
    startDate?: string;
    employmentStatus?: 'Aktif' | 'Pasif';
    bloodType?: string;
    licensePlate?: string;
    gender?: 'male' | 'female' | 'other';
    salary?: number;
    educationLevel?: string;
    address?: string;
    annualLeaveDays?: number;
    workType?: 'full-time' | 'part-time';
    vehicleModel?: string;
    vehicleInitialKm?: number;
    salesTarget?: number;
    payrollHistory?: PayrollEntry[];
}

export interface Customer {
    id: string;
    createdAt: string;
    name: string;
    email?: string;
    phone1?: string;
    phone2?: string;
    mobilePhone1?: string;
    address?: string;
    city?: string;
    district?: string;
    country?: string;
    taxOffice?: string;
    taxNumber?: string;
    commercialTitle?: string;
    currentCode?: string;
    status?: 'active' | 'passive';
    segment?: 'loyal' | 'high_potential' | 'at_risk' | 'new';
    churnRisk?: boolean;
    assignedToId?: string;
    notes?: string;
    registrationDate?: string;
    group?: string;
    subgroup1?: string;
    subgroup2?: string;
    homePhone?: string;
    fax?: string;
    nationalId?: string;
    specialCode1?: string;
    specialCode2?: string;
    specialCode3?: string;
    specialDate?: string;
    webcamImage?: string;
    
    // AI Analysis fields
    aiOpportunityAnalysis?: { result: string, timestamp: string };
    aiNextStepSuggestion?: { result: string, timestamp: string };
    aiSentimentAnalysis?: { result: string, timestamp: string };
}

export interface Appointment {
    id: string;
    createdAt: string;
    customerId: string;
    userId: string;
    assignedToId: string;
    title: string;
    start: string; // ISO
    end: string;   // ISO
    allDay?: boolean;
    notes?: string;
    reminder?: 'none' | '15m' | '1h' | '1d';
}

export interface Interview {
    id: string;
    createdAt: string;
    customerId: string;
    formTarihi: string;
    fuar?: string;
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
        bizZiyaretEdecek: { tarih: string; adSoyad: string };
    };
    notlar: string;
    gorusmeyiYapan: string;
    gorusmeyiYapanId: string;
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

export interface Offer {
    id: string;
    createdAt: string;
    teklifNo: string;
    customerId: string;
    teklifVerenId: string;
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
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
    id: string;
    createdAt: string;
    title: string;
    description?: string;
    status: TaskStatus;
    dueDate?: string;
    assignedToId: string;
    relatedToEntity?: 'customer' | 'offer';
    relatedToId?: string;
}

export type ExpenseCategory = 'travel' | 'food' | 'accommodation' | 'fuel' | 'representation' | 'other';

export interface Expense {
    id: string;
    createdAt: string;
    userId: string;
    date: string;
    category: ExpenseCategory;
    amount: number;
    currency: 'TRY' | 'USD' | 'EUR';
    description: string;
    receiptImage?: string;
}

export type Page = 'dashboard' | 'customers' | 'email' | 'appointments' | 'gorusme-formu' | 'teklif-yaz' | 'personnel' | 'hesaplama-araclari' | 'profile' | 'yapay-zeka' | 'konum-takip' | 'erp-entegrasyonu' | 'ai-ayarlari' | 'raporlar' | 'email-taslaklari' | 'mutabakat' | 'audit-log' | 'tasks' | 'expenses' | 'manufacturing-analysis' | 'email-hub';
