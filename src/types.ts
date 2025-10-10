export type UserRole = 'admin' | 'muhasebe' | 'saha';

export interface User {
    id:string;
    username:string; // This is email
    password?:string;
    role: UserRole;
    name:string;
    jobTitle?:string;
    avatar?:string;
    // FIX: Added missing personnel fields to the User type
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
}

export type Page = 'dashboard' | 'projects' | 'tech-stack' | 'contact' | 'customers' | 'email' | 'appointments' | 'gorusme-formu' | 'teklif-yaz' | 'personnel' | 'hesaplama-araclari' | 'profile' | 'yapay-zeka' | 'konum-takip' | 'erp-entegrasyonu' | 'ai-ayarlari' | 'raporlar' | 'email-taslaklari' | 'mutabakat' | 'audit-log' | 'sales-pipeline';


export interface Project {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  liveUrl?: string;
  repoUrl?: string;
}

export interface Technology {
  name: string;
  icon: string; // e.g., 'fab fa-react'
  color: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

// FIX: Added all missing type definitions for the application

export type OfferStatus = 'draft' | 'sent' | 'negotiation' | 'won' | 'lost';

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
    teklifNo: string;
    customerId: string;
    createdAt: string;
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
    status: OfferStatus;
    statusReason?: string;
    aiFollowUpEmail?: string;
}

export interface Customer {
    id: string;
    createdAt: string;
    name: string;
    email?: string;
    status: 'active' | 'passive';
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
    synced?: boolean;
    aiOpportunityAnalysis?: { result: string; timestamp: string };
    aiNextStepSuggestion?: { result: string; timestamp: string };
    aiSentimentAnalysis?: { result: string; timestamp: string };
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
    createdAt: string;
    status?: 'active' | 'cancelled';
}

export interface Interview {
    id: string;
    customerId: string;
    createdAt: string;
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
    aiSummary?: string;
}

export interface Notification {
    id: string;
    timestamp: string;
    isRead: boolean | number; // Dexie uses 0/1 for boolean indexes
    messageKey: string;
    replacements?: Record<string, string>;
    type: 'customer' | 'appointment' | 'offer' | 'interview' | 'system' | 'reconciliation';
    link?: { page: Page, id?: string };
}

export interface LeaveRequest {
    id: string;
    userId: string;
    type: string;
    startDate: string;
    endDate: string;
    reason: string;
    requestDate: string;
    status: 'pending' | 'approved' | 'rejected';
}

export interface KmRecord {
    id: string;
    userId: string;
    date: string;
    type: 'morning' | 'evening';
    km: number;
}

export interface LocationRecord {
    id: string;
    userId: string;
    latitude: number;
    longitude: number;
    timestamp: string;
    isVisit?: boolean;
    customerId?: string;
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
}

export interface TripRecord {
    id: string;
    userId: string;
    date: string;
    startLocation: string;
    endLocation: string;
    notes: string;
    odometerStart: number;
    odometerEnd: number;
}

export interface TimesheetEntry {
    date: string;
    dayOfWeek: number;
    status: 'work' | 'leave' | 'absent' | 'weekend';
    checkIn: string | null;
    checkOut: string | null;
    totalHours: number;
    overtimeHours: number;
    missingHours: number;
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

export interface CalculatorState {
    id: 'default';
    unit: 'metric' | 'inch';
    activeTab: string;
    inputs: Record<string, Record<string, string>>;
}

export interface CalculationHistoryItem {
    id?: number;
    timestamp: number;
    module: string;
    unit: 'metric' | 'inch';
    summary: string;
}

export interface ErpSettings {
    id: 'default';
    server: string;
    databasePath: string;
    username: string;
    password?: string;
    isConnected: boolean;
    lastSyncCustomers?: string;
    lastSyncStock?: string;
    lastSyncStockLevels?: string;
    lastSyncInvoices?: string;
    lastSyncOffers?: string;
    lastSyncIncomingInvoices?: string;
    lastSyncOutgoingInvoices?: string;
}

export interface StockItem {
    id: string; // SKU
    erpId?: string;
    sku: string;
    name: string;
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
    items?: any[];
}

export interface IncomingInvoice {
    faturaNo: string;
    tedarikciAdi: string;
    vergiNo: string;
    tarih: string;
    tutar: number;
    currency: 'TRY' | 'USD' | 'EUR';
    description?: string;
}

export interface OutgoingInvoice {
    faturaNo: string;
    musteriAdi: string;
    vergiNo: string;
    tarih: string;
    tutar: number;
    currency: 'TRY' | 'USD' | 'EUR';
    description?: string;
    userId?: string; // To link to the salesperson
}

export interface Reconciliation {
    id: string;
    customerId: string;
    type: 'current_account' | 'ba' | 'bs';
    period: string; // e.g., '2025-08'
    amount: number;
    currency: 'TRY' | 'USD' | 'EUR';
    status: 'draft' | 'sent' | 'in_review' | 'approved' | 'rejected';
    createdAt: string;
    createdBy: string;
    incomingInvoiceId?: string;
    outgoingInvoiceId?: string;
    notes?: string;
    customerResponse?: string;
    aiAnalysis?: string;
}

export interface Warehouse {
    id: string;
    code: string;
    name: string;
}

export interface StockLevel {
    id: string;
    stockItemId: string; // Corresponds to StockItem.id (which is the SKU)
    warehouseCode: string; // Corresponds to Warehouse.code
    qtyOnHand: number;
}

export interface SyncQueueItem {
    id?: number;
    type: 'add-customer' | 'update-customer' | 'delete-customer';
    payload: any;
    timestamp: number;
}

export interface AISettings {
    userId: string;
    isAgentActive: boolean;
    enableFollowUpDrafts: boolean;
    enableAtRiskAlerts: boolean;
    followUpDays: number;
    atRiskDays: number;
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
    generatedBy: 'ai_agent' | 'user';
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

export type ReportType =
  | 'sales_performance'
  | 'customer_invoice_analysis'
  | 'ai_analysis_summary'
  | 'customer_segmentation'
  | 'offer_success_analysis';