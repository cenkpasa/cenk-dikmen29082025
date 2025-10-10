import { Offer, IncomingInvoice, OutgoingInvoice, StockItem, Warehouse, StockLevel, Customer, Invoice } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const MOCK_ERP_CUSTOMERS: Omit<Customer, 'id' | 'createdAt'>[] = [
    { currentCode: 'CR010518', commercialTitle: "PROTİCO PROTEZ ORTEZ", name: "PROTİCO PROTEZ ORTEZ", city: "YENİMAHALLE", country: "TÜRKİYE", group:"MÜŞTERİ", status: 'active' },
    { currentCode: 'CR010536', commercialTitle: "BY TECH MAKİNA SAN.", name: "BY TECH MAKİNA SAN.", city: "YENİMAHALLE", country: "TÜRKİYE", group:"MÜŞTERİ", status: 'active' },
    { currentCode: 'CR010517', commercialTitle: "ATAK KESİCİ TAKIMLAR FATİH AKINSU", name: "ATAK KESİCİ TAKIMLAR", city: "Toprakkale", country: "TÜRKİYE", group:"MÜŞTERİ", status: 'active' },
    { currentCode: 'CNKCK-10308', commercialTitle: "VERMA MAKİNA TORKU HAYRETTİN ÇEPLİ", name: "VERMA MAKİNA TORKU", city: "YENİMAHALLE", country: "TÜRKİYE", group:"MÜŞTERİ", status: 'active' },
    { currentCode: 'CR012340', commercialTitle: "ÖZAVMİN SANAYİ LİMİTED AHMET BEY", name: "ÖZAVMİN SANAYİ", city: "Sincan", country: "TÜRKİYE", group:"MÜŞTERİ", status: 'active' },
    { currentCode: 'CNKCK-0141', commercialTitle: "ÖZOKLAR METAL SAN. ZAHİT ÖZCAN", name: "ÖZOKLAR METAL", city: "YENİMAHALLE", country: "TÜRKİYE", group:"MÜŞTERİ", status: 'active' },
];

export const MOCK_ERP_STOCK_ITEMS: Omit<StockItem, 'id' | 'lastSync'>[] = [
    { erpId: 'OKE-149', sku: 'OKE-149', name: 'DCHT201-WSH OP1215', unit: 'ADET', price: 150.00, isActive: true },
    { erpId: 'AKXOR-1112', sku: 'AKXOR-1112', name: '34DCHT201-RSH AS21 BEDELİ', unit: 'ADET', price: 220.50, isActive: true },
    { erpId: 'CMSK-214', sku: 'CMSK-214', name: 'V-Power Karışımsız', unit: 'ADET', price: 85.75, isActive: true },
    { erpId: 'CMSK-215', sku: 'CMSK-215', name: 'V-Power Diesel', unit: 'ADET', price: 92.30, isActive: true },
    { erpId: 'OKE-405', sku: 'OKE-405', name: 'MG1106G08-R-M1 OP1215', unit: 'ADET', price: 180.00, isActive: true },
];

export const MOCK_ERP_INVOICES: (Omit<Invoice, 'items' | 'customerId' | 'userId'> & { customerCurrentCode: string })[] = [
    { id: 'CMC2025000018309', customerCurrentCode: 'CR010518', date: '2025-10-09', totalAmount: 45600.00, currency: 'TRY', description: 'MÜHTELİF C' },
    { id: 'CMC2025000018109', customerCurrentCode: 'CR010536', date: '2025-10-01', totalAmount: 82460.00, currency: 'TRY', description: '115X7 TKJ-6X1,50ISO' },
    { id: 'CMC2025000018113', customerCurrentCode: 'CR010517', date: '2025-09-21', totalAmount: 39000.00, currency: 'TRY', description: 'DNMG150608' },
    { id: 'PRT2025000010009', customerCurrentCode: 'CR010518', date: '2025-08-13', totalAmount: 6508.34, currency: 'TRY', description: 'SPGT07T308L A03KT-K' },
    { id: 'CDA2025000049909', customerCurrentCode: 'CR012340', date: '2025-08-13', totalAmount: 3455.49, currency: 'TRY', description: 'ZulaOx3mm' },
];

export const MOCK_ERP_OFFERS: (Omit<Offer, 'id' | 'createdAt' | 'customerId'> & { customerCurrentCode: string })[] = [
    {
        teklifNo: 'ERP-TEK-001',
        customerCurrentCode: 'CR010518',
        currency: 'TRY',
        firma: { yetkili: 'PROTİCO YETKİLİ', telefon: '03125550101', eposta: 'info@protico.com', vade: '60 Gün', teklifTarihi: '2025-09-15' },
        teklifVeren: { yetkili: 'Cenk Dikmen', telefon: '', eposta: '' },
        items: [{ id: uuidv4(), cins: 'DCHT201-WSH OP1215', miktar: 10, birim: 'Adet', fiyat: 150, tutar: 1500, teslimSuresi: '1 Gün' }],
        notlar: 'ERP üzerinden senkronize edilen teklif.',
        toplam: 1500,
        kdv: 300,
        genelToplam: 1800,
        status: 'sent',
    },
    {
        teklifNo: 'ERP-TEK-002',
        customerCurrentCode: 'CR012340',
        currency: 'EUR',
        firma: { yetkili: 'AHMET BEY', telefon: '03125550202', eposta: 'ahmet@ozavmin.com', vade: '30 Gün', teklifTarihi: '2025-09-20' },
        teklifVeren: { yetkili: 'Cenk Dikmen', telefon: '', eposta: '' },
        items: [{ id: uuidv4(), cins: 'V-Power Diesel', miktar: 5, birim: 'Adet', fiyat: 4.5, tutar: 22.5, teslimSuresi: 'Stoktan' }],
        notlar: 'Avrupa menşeili ürünler için teklif.',
        toplam: 22.5,
        kdv: 4.5,
        genelToplam: 27,
        status: 'draft',
    }
];

export const MOCK_INCOMING_INVOICES: IncomingInvoice[] = [
  { faturaNo: 'EUR2025000009155', tedarikciAdi: 'EUROFER KESİCİ TAKIMLAR', vergiNo: '4641531636', tarih: '2025-08-04T10:46:00.000Z', tutar: 3288.00, currency: 'TRY', description: 'CG35692,IAT206B-080' },
  { faturaNo: 'CTR2025000002662', tedarikciAdi: 'CUTRON KESİCİ TAKIMLAR', vergiNo: '2161201788', tarih: '2025-08-01T07:56:00.000Z', tutar: 13566.24, currency: 'TRY', description: 'KARBÜR FREZE' },
];

export const MOCK_OUTGOING_INVOICES: OutgoingInvoice[] = [
  { faturaNo: 'CNK-SATIS-001', musteriAdi: 'EUROFER KESİCİ TAKIMLAR', vergiNo: '4641531636', tarih: '2025-08-05T09:00:00.000Z', tutar: 3288.00, currency: 'TRY', description: 'CG35692', userId: 'user-goksel-gurlenkaya' },
  { faturaNo: 'CNK-SATIS-002', musteriAdi: 'CUTRON KESİCİ TAKIMLAR', vergiNo: '2161201788', tarih: '2025-08-03T14:30:00.000Z', tutar: 13566.24, currency: 'TRY', description: 'KARBÜR FREZE', userId: 'user-hatice-kayretli' },
  { faturaNo: 'CNK-SATIS-003', musteriAdi: 'PROTİCO PROTEZ ORTEZ', vergiNo: '7330561994', tarih: '2025-07-15T11:00:00.000Z', tutar: 8500.50, currency: 'TRY', description: 'Özel imalat kesici takım', userId: 'user-ilker-taya' },
  { faturaNo: 'CNK-SATIS-004', musteriAdi: 'ATAK KESİCİ TAKIMLAR', vergiNo: '1030674511', tarih: '2025-07-20T16:00:00.000Z', tutar: 12450.00, currency: 'TRY', description: 'Freze ucu seti', userId: 'user-goksel-gurlenkaya' },
];

export const MOCK_ERP_WAREHOUSES: Warehouse[] = [
    { id: 'merkez', code: 'MERKEZ', name: 'Merkez Depo' },
    { id: 'sube-a', code: 'SUBE-A', name: 'A Şubesi Deposu' },
];

export const MOCK_ERP_STOCK_LEVELS: Omit<StockLevel, 'id'>[] = [
    { stockItemId: 'OKE-149', warehouseCode: 'MERKEZ', qtyOnHand: 15 },
    { stockItemId: 'AKXOR-1112', warehouseCode: 'MERKEZ', qtyOnHand: 0 },
    { stockItemId: 'CMSK-214', warehouseCode: 'MERKEZ', qtyOnHand: 1871 },
    { stockItemId: 'CMSK-215', warehouseCode: 'MERKEZ', qtyOnHand: 1440 },
    { stockItemId: 'OKE-405', warehouseCode: 'SUBE-A', qtyOnHand: 1350 },
];
