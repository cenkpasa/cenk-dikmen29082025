// This service simulates fetching data from a remote ERP system by parsing a local CSV.
import { Customer, Invoice, Offer, IncomingInvoice, OutgoingInvoice, Warehouse, StockItem, StockLevel } from '../types';
import { MOCK_OUTGOING_INVOICES, MOCK_INCOMING_INVOICES, CSV_DATA, MOCK_ERP_OFFERS, MOCK_ERP_STOCK_ITEMS, MOCK_ERP_WAREHOUSES, MOCK_ERP_STOCK_LEVELS } from './erpMockData';
import { v4 as uuidv4 } from 'uuid';


const SIMULATED_DELAY = 500; // ms

// Type definitions for canonical models used within the service
type CanonicalStockItem = Omit<StockItem, 'id'> & { id: string };
type CanonicalWarehouse = Warehouse;
type CanonicalStockLevel = Omit<StockLevel, 'id'>;


export const fetchIncomingInvoices = (): Promise<IncomingInvoice[]> => {
    console.log("Simulating ERP fetch for INCOMING invoices...");
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(MOCK_INCOMING_INVOICES.map(inv => ({...inv, id: uuidv4()})));
        }, SIMULATED_DELAY);
    });
};

export const fetchOutgoingInvoices = (): Promise<OutgoingInvoice[]> => {
    console.log("Simulating ERP fetch for OUTGOING invoices...");
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(MOCK_OUTGOING_INVOICES.map(inv => ({...inv, id: uuidv4()})));
        }, SIMULATED_DELAY);
    });
};

export const fetchStockItems = (): Promise<StockItem[]> => {
    console.log("Simulating ERP fetch for STOCK ITEMS...");
    return new Promise(resolve => {
        setTimeout(() => {
            const items: StockItem[] = MOCK_ERP_STOCK_ITEMS.map(item => ({
                id: item.sku, // Use SKU as the primary key for idempotency
                ...item,
                lastSync: new Date().toISOString()
            }));
            resolve(items);
        }, SIMULATED_DELAY);
    });
};

export const fetchWarehouses = (): Promise<CanonicalWarehouse[]> => {
    console.log("Simulating ERP fetch for WAREHOUSES...");
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(MOCK_ERP_WAREHOUSES);
        }, SIMULATED_DELAY);
    });
};

export const fetchStockLevels = (): Promise<CanonicalStockLevel[]> => {
    console.log("Simulating ERP fetch for STOCK LEVELS...");
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(MOCK_ERP_STOCK_LEVELS);
        }, SIMULATED_DELAY);
    });
};


// --- The rest of the file is kept for compatibility with other ERP sync features ---

const parseCurrency = (str: string): number => {
    if (!str) return 0;
    const num = parseFloat(str.replace('₺', '').replace(/\./g, '').replace(',', '.').trim());
    return isNaN(num) ? 0 : num;
};

const parseDate = (str: string): string => {
    if (!str || !str.includes('.')) return new Date().toISOString();
    const parts = str.split('.');
    if (parts.length !== 3) return new Date().toISOString();
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return new Date().toISOString();
    return new Date(year, month, day).toISOString();
};

const parseNumber = (str: string): number => {
    if (!str) return 0;
    const num = parseInt(str.trim(), 10);
    return isNaN(num) ? 0 : num;
};

type ParsedInvoice = Omit<Invoice, 'customerId' | 'userId' | 'items'> & { customerCurrentCode: string, items: { stockId: string, quantity: number, price: number}[] };
type ParsedOffer = Omit<Offer, 'id' | 'createdAt' | 'customerId'> & { customerCurrentCode: string };

type ParsedResult = {
    customers: Map<string, Omit<Customer, 'id' | 'createdAt'>>;
    invoices: ParsedInvoice[];
    offers: ParsedOffer[];
};

let cachedData: ParsedResult | null = null;

const parseErpData = (csvText: string): ParsedResult => {
    if (cachedData) return cachedData;

    const lines = csvText.trim().split('\n').filter(line => line.trim() !== '');
    const headerLine = lines.shift()?.replace(/^\uFEFF/, '');
    if (!headerLine) return { customers: new Map(), invoices: [], offers: [] };
    
    const headers = headerLine.split(';').map(h => h.trim());
    const col = (name: string) => headers.indexOf(name);
    
    let totalAmountColIndex = -1;
    const generalTotalIndices = headers.map((h, i) => h === 'Genel Toplam' ? i : -1).filter(i => i !== -1);
    
    if (generalTotalIndices.length > 1 && lines.length > 0) {
        const firstDataRow = lines[0].split(';');
        for (const index of generalTotalIndices) {
            if (firstDataRow[index] && (firstDataRow[index].includes('₺') || firstDataRow[index].includes('$') || firstDataRow[index].includes('€'))) {
                totalAmountColIndex = index;
                break;
            }
        }
    }
    if (totalAmountColIndex === -1) {
        totalAmountColIndex = col('Genel Toplam');
    }

    const customers = new Map<string, Omit<Customer, 'id' | 'createdAt'>>();
    const invoices: ParsedInvoice[] = [];

    for (const line of lines) {
        const values = line.split(';');
        if (values.length < headers.length) continue;
        if (values[col('Fatura Türü')] !== 'Alış Faturası' || values[col('İptal')] === 'Evet') continue;
        const currentCode = values[col('Cari Kodu')]?.trim();
        if (!currentCode) continue;

        if (!customers.has(currentCode)) {
             customers.set(currentCode, {
                currentCode: currentCode,
                name: values[col('Ticari Unvanı')]?.trim(),
                commercialTitle: values[col('Ticari Unvanı')]?.trim(),
                city: values[col('İli')]?.trim(),
                district: values[col('İlçesi')]?.trim(),
                country: values[col('Ülkesi')]?.trim(),
                taxOffice: values[col('Vergi Dairesi')]?.trim(),
                taxNumber: values[col('Vergi No')]?.trim(),
                status: 'active',
            });
        }
        
        const totalAmount = parseCurrency(values[totalAmountColIndex]);
        const quantity = parseNumber(values[col('Miktar 1 Toplam')]);

        const dvzKullan = values[col('Dvz.Kullan')]?.trim();
        const simge = values[col('Simge')]?.trim();
        let currency: 'TRY' | 'USD' | 'EUR' = 'TRY';
        if (dvzKullan === 'Evet') {
            if (simge === '€') {
                currency = 'EUR';
            } else if (simge === '$') {
                currency = 'USD';
            }
        }

        invoices.push({
            id: values[col('Fatura No')]?.trim(),
            customerCurrentCode: currentCode,
            date: parseDate(values[col('Fatura Tarihi')]?.trim()),
            totalAmount: totalAmount,
            currency: currency,
            description: values[col('Açıklama')]?.trim(),
            items: [{
                stockId: 'CSV_ITEM',
                quantity: quantity || 1,
                price: quantity > 0 ? totalAmount / quantity : totalAmount
            }],
        });
    }
    
    const offers: ParsedOffer[] = MOCK_ERP_OFFERS.map(offer => ({
        ...offer,
        toplam: offer.items.reduce((acc, item) => acc + item.tutar, 0),
        kdv: offer.items.reduce((acc, item) => acc + item.tutar, 0) * 0.20,
        genelToplam: offer.items.reduce((acc, item) => acc + item.tutar, 0) * 1.20,
    }));


    cachedData = { customers, invoices, offers };
    return cachedData;
};

export const fetchErpCsvData = (): Promise<ParsedResult> => {
    console.log("Simulating ERP CSV data parsing for Customers/Offers...");
    return new Promise(resolve => {
        setTimeout(() => {
            cachedData = null; 
            const data = parseErpData(CSV_DATA);
            resolve(data);
        }, SIMULATED_DELAY);
    });
};

export const getInvoicesForReconciliation = async (customerCurrentCode: string, period: string): Promise<Invoice[]> => {
    const { invoices: allInvoices } = parseErpData(CSV_DATA);
    const [year, month] = period.split('-').map(Number);

    return allInvoices
        .filter(inv => {
            const invDate = new Date(inv.date);
            return (
                inv.customerCurrentCode === customerCurrentCode &&
                invDate.getFullYear() === year &&
                invDate.getMonth() === month - 1
            );
        })
        .map(({ customerCurrentCode, ...rest }) => ({
             ...rest,
             customerId: '', 
             userId: ''
        }));
};