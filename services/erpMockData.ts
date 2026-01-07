// This file centralizes all mock data used to simulate the ERP system.
import { Offer, IncomingInvoice, OutgoingInvoice, StockItem, Warehouse, StockLevel, MileageReportData, FinancialData } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const CSV_DATA = `Fatura Türü;İptal;Cari Kodu;Ticari Unvanı;Yetkilisi;İlçesi;İli;Ülkesi;Fatura Seri;Fatura No;Fatura Tarihi;Fatura Saati;Vadesi;Vadesi; Genel Toplam ;Genel Toplam;Simge;Dvz.Kullan;İşlem;Açıklama;Grubu;Vergi Dairesi;Vergi No;Pazarlama Personeli;Miktar 1 Toplam;Miktar 2 Toplam
Alış Faturası;Hayır;CNKCK-1030847;SEYMEN İŞ SAĞLIĞI VE GÜVENLİĞİ DANIŞMANLIK SANAYİ VE TİCARET LİMİTED ŞİRKETİ;R E;YENİMAHALLE;ANKARA;TÜRKİYE;;SF02025000001949;7.08.2025;08:58;5.12.2025;08:58; ₺1.000,00 ;0;;Hayır;KPB;İŞ SAĞLIĞI HİZMETİ,İŞ GÜVENLİĞİ HİZMETİ;;YENİMAHALLE;4610455720;;2;2
Alış Faturası;Hayır;CR01332;EUROFER KESİCİ TAKIMLAR MAKİNA SANAYİ TİCARET LİMİTED ŞİRKETİ; ;YENİMAHALLE;ANKARA;TÜRKİYE;;EUR2025000009155;4.08.2025;13:46;2.12.2025;13:46; ₺3.288,00 ;0;;Hayır;KPB;CG35692,IAT206B-080;;İVEDİK;4641531636;;3;3
Alış Faturası;Hayır;CR00980;CUTRON KESİCİ TAKIMLAR END. VE TEK. HIR. MAK. İTH. İHR. SAN. TİC. LTD. ŞTİ.;METİN YALÇINDERE;YENİMAHALLE;ANKARA;TÜRKİYE;;CTR2025000002662;1.08.2025;10:56;29.11.2025;10:56; ₺13.566,24 ;0;;Hayır;KPB;Ø6,00 KARBÜR FREZE,Ø6,00 KARBÜR FREZE;;İVEDİK;2161201788;;20;20
Alıştan İadeler;Hayır;CR01332;EUROFER KESİCİ TAKIMLAR MAKİNA SANAYİ TİCARET LİMİTED ŞİRKETİ; ;YENİMAHALLE;ANKARA;TÜRKİYE;;CNK2025000000617;29.07.2025;12:33;27.09.2025;12:33; ₺12.144,00 ;256,14;€;Evet;KPB;SDMT120412;;İVEDİK;4641531636;;50;50
Alış Faturası;Hayır;5376;AK KESİCİ TAKIM HIRDAVAT SANAYİ TİCARET ANONİM ŞİRKETİ;AKIN İZDEŞ;YENİMAHALLE;ANKARA;TÜRKİYE;;AKH2025000000728;24.07.2025;14:18;21.11.2025;14:18; ₺2.169,60 ;0;;Hayır;KPB;2,50MM 14X50 Ø4 KARBÜR MATKAP;;ULUS;0111103590;;4;4
`;

export const MOCK_ERP_STOCK_ITEMS: Omit<StockItem, 'id' | 'lastSync'>[] = [
    { erpId: 'SKU001', sku: 'SKU001', name: 'Karbür Matkap Ucu 5mm', barcode: '8691234567890', unit: 'Adet', price: 120.50, isActive: true },
    { erpId: 'SKU002', sku: 'SKU002', name: 'CNC Torna Kateri', barcode: '8691234567891', unit: 'Adet', price: 450.00, isActive: true },
    { erpId: 'SKU003', sku: 'SKU003', name: 'Elmas Freze Ucu 10mm', barcode: '8691234567892', unit: 'Adet', price: 275.75, isActive: true },
    { erpId: 'SKU004', sku: 'SKU004', name: 'Kılavuz Pafta Seti', barcode: '8691234567893', unit: 'Set', price: 890.00, isActive: false },
    { erpId: 'SKU005', sku: 'SKU005', name: 'HSS-E Matkap Ucu 8mm', barcode: '8691234567894', unit: 'Adet', price: 95.00, isActive: true }
];

export const MOCK_ERP_WAREHOUSES: Warehouse[] = [
    { id: 'merkez', code: 'MERKEZ', name: 'Merkez Depo' },
    { id: 'sube-a', code: 'SUBE-A', name: 'A Şubesi Deposu' },
    { id: 'sube-b', code: 'SUBE-B', name: 'B Şubesi Deposu' },
];

export const MOCK_ERP_STOCK_LEVELS: Omit<StockLevel, 'id'>[] = [
    { stockItemId: 'SKU001', warehouseCode: 'MERKEZ', qtyOnHand: 150 },
    { stockItemId: 'SKU001', warehouseCode: 'SUBE-A', qtyOnHand: 50 },
    { stockItemId: 'SKU002', warehouseCode: 'MERKEZ', qtyOnHand: 45 },
    { stockItemId: 'SKU003', warehouseCode: 'MERKEZ', qtyOnHand: 80 },
    { stockItemId: 'SKU003', warehouseCode: 'SUBE-A', qtyOnHand: 20 },
    { stockItemId: 'SKU003', warehouseCode: 'SUBE-B', qtyOnHand: 15 },
    { stockItemId: 'SKU005', warehouseCode: 'MERKEZ', qtyOnHand: 250 },
];


// This is a placeholder and will be processed into a full Offer object by the erpApiService
export const MOCK_ERP_OFFERS: (Omit<Offer, 'id' | 'createdAt' | 'toplam' | 'kdv' | 'genelToplam' | 'customerId'> & { customerCurrentCode: string })[] = [
    {
        customerCurrentCode: 'CR01332', // Corresponds to EUROFER from CSV
        teklifNo: 'ERP-TEK-001',
        currency: 'TRY',
        firma: {
            yetkili: 'ERP Yetkilisi',
            telefon: '0312 555 10 20',
            eposta: 'info@eurofer.com.tr',
            vade: '60 Gün',
            teklifTarihi: new Date().toISOString().slice(0, 10),
        },
        teklifVeren: {
            yetkili: 'ERP Sistemi',
            telefon: '0312 123 45 67',
            eposta: 'satis@cnkkesicitakim.com.tr',
        },
        // FIX: Added `teklifVerenId` to satisfy the Offer type.
        teklifVerenId: 'erp-system',
        items: [
            { id: uuidv4(), cins: 'CNC Torna Ucu - ERP Özel', miktar: 50, birim: 'Adet', fiyat: 85, tutar: 4250, teslimSuresi: '3 Gün' },
            { id: uuidv4(), cins: 'Freze Bıçağı - 12mm ERP', miktar: 20, birim: 'Adet', fiyat: 155, tutar: 3100, teslimSuresi: 'Stoktan' }
        ],
        notlar: 'ERP üzerinden otomatik oluşturulmuş test teklifi.',
    },
    {
        customerCurrentCode: 'CR00980', // Corresponds to CUTRON from CSV
        teklifNo: 'ERP-TEK-002',
        currency: 'TRY',
        firma: {
            yetkili: 'Metin Yalçındere',
            telefon: '0312 222 33 44',
            eposta: 'info@cutron.com.tr',
            vade: '30 Gün',
            teklifTarihi: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 2 days ago
        },
        teklifVeren: {
            yetkili: 'ERP Sistemi',
            telefon: '0312 123 45 67',
            eposta: 'satis@cnkkesicitakim.com.tr',
        },
        // FIX: Added `teklifVerenId` to satisfy the Offer type.
        teklifVerenId: 'erp-system',
        items: [
            { id: uuidv4(), cins: 'Özel Karbür Freze', miktar: 100, birim: 'Adet', fiyat: 135.66, tutar: 13566, teslimSuresi: '1 Hafta' }
        ],
        notlar: 'İkinci ERP üzerinden otomatik oluşturulmuş test teklifi.',
    }
];


export const MOCK_INCOMING_INVOICES: Omit<IncomingInvoice, 'id'>[] = [
  { faturaNo: 'EUR2025000009155', tedarikciAdi: 'EUROFER KESİCİ TAKIMLAR', vergiNo: '4641531636', tarih: '2025-08-04T10:46:00.000Z', tutar: 3288.00, currency: 'TRY', description: 'CG35692,IAT206B-080' },
  { faturaNo: 'CTR2025000002662', tedarikciAdi: 'CUTRON KESİCİ TAKIMLAR', vergiNo: '2161201788', tarih: '2025-08-01T07:56:00.000Z', tutar: 13566.24, currency: 'TRY', description: 'KARBÜR FREZE' },
  { faturaNo: 'AKH2025000000728', tedarikciAdi: 'AK KESİCİ TAKIM', vergiNo: '0111103590', tarih: '2025-07-24T11:18:00.000Z', tutar: 2169.60, currency: 'TRY', description: 'KARBÜR MATKAP' },
  { faturaNo: 'ASL2025000002659', tedarikciAdi: 'ASLAN GRUP KESİCİ TAKIM', vergiNo: '0891305401', tarih: '2025-07-23T18:15:00.000Z', tutar: 7333.62, currency: 'TRY', description: 'Özel Takım' },
];

export const MOCK_OUTGOING_INVOICES: Omit<OutgoingInvoice, 'id'>[] = [
  // A perfect match for EUROFER
  { faturaNo: 'CNK-SATIS-001', musteriAdi: 'EUROFER KESİCİ TAKIMLAR', vergiNo: '4641531636', tarih: '2025-08-05T09:00:00.000Z', tutar: 3288.00, currency: 'TRY', description: 'CG35692' },
  // A match with date tolerance for CUTRON
  { faturaNo: 'CNK-SATIS-002', musteriAdi: 'CUTRON KESİCİ TAKIMLAR', vergiNo: '2161201788', tarih: '2025-08-03T14:30:00.000Z', tutar: 13566.24, currency: 'TRY', description: 'KARBÜR FREZE' },
   // A match with amount tolerance for ASLAN GRUP
  { faturaNo: 'CNK-SATIS-003', musteriAdi: 'ASLAN GRUP KESİCİ TAKIM', vergiNo: '0891305401', tarih: '2025-07-23T18:15:00.000Z', tutar: 7333.61, currency: 'TRY', description: 'Özel Takımlar' },
  // Unmatched outgoing invoice
  { faturaNo: 'CNK-SATIS-004', musteriAdi: 'YENİ MÜŞTERİ A.Ş.', vergiNo: '9999999999', tarih: '2025-08-10T11:00:00.000Z', tutar: 5000.00, currency: 'TRY', description: 'Hırdavat' },
];

// FIX: Added mock data for mileage and profit/loss reports.
export const MOCK_MILEAGE_REPORT_DATA: MileageReportData = {
    employeeName: 'Saha Personeli',
    employeeId: 'user-saha',
    vehicleDescription: 'Ford Transit - 06 CNK 123',
    authorizer: 'Admin User',
    ratePerKm: 2.50,
    periodStart: '2025-08-01',
    periodEnd: '2025-08-31',
    logs: [
        { id: 'mlog-1', date: '2025-08-01', startLocation: 'Ofis', endLocation: 'ABC Makina', description: 'Müşteri Ziyareti', startOdometer: 12500, endOdometer: 12535 },
        { id: 'mlog-2', date: '2025-08-02', startLocation: 'ABC Makina', endLocation: 'DEF Metalurji', description: 'Teklif Takip', startOdometer: 12535, endOdometer: 12580 },
        { id: 'mlog-3', date: '2025-08-02', startLocation: 'DEF Metalurji', endLocation: 'Ofis', description: 'Ofise Dönüş', startOdometer: 12580, endOdometer: 12610 },
    ],
};

export const MOCK_PROFIT_LOSS_DATA: FinancialData = {
    year: 2025,
    revenues: [
        { name: 'Yurtiçi Satışlar', monthlyValues: [150000, 165000, 180000, 175000, 190000, 210000, 205000, 220000, 230000, 240000, 250000, 280000] },
        { name: 'Yurtdışı Satışlar', monthlyValues: [50000, 55000, 60000, 58000, 62000, 70000, 68000, 72000, 75000, 80000, 85000, 95000] },
    ],
    cogs: [
        { name: 'Satılan Malın Maliyeti', monthlyValues: [120000, 130000, 145000, 140000, 150000, 165000, 160000, 170000, 175000, 180000, 190000, 210000] },
    ],
    expenses: [
        { name: 'Pazarlama Giderleri', monthlyValues: [10000, 11000, 10500, 12000, 11500, 13000, 12500, 14000, 13500, 15000, 14500, 16000] },
        { name: 'Personel Giderleri', monthlyValues: [30000, 30000, 31000, 31000, 32000, 32000, 33000, 33000, 34000, 34000, 35000, 35000] },
        { name: 'Genel Yönetim Giderleri', monthlyValues: [5000, 5200, 5100, 5300, 5400, 5500, 5600, 5700, 5800, 5900, 6000, 6100] },
    ]
};