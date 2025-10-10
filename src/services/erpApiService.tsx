// This service simulates fetching data from a remote ERP system.
// The data is sourced from `erpMockData.ts`, which is modeled after AKINSOFT WOLVOX screenshots.
import { Customer, Invoice, Offer, IncomingInvoice, OutgoingInvoice, Warehouse, StockItem, StockLevel } from '../types';
import { 
    MOCK_ERP_CUSTOMERS, 
    MOCK_ERP_INVOICES,
    MOCK_ERP_STOCK_ITEMS,
    MOCK_ERP_WAREHOUSES,
    MOCK_ERP_STOCK_LEVELS,
    MOCK_INCOMING_INVOICES, 
    MOCK_OUTGOING_INVOICES,
    MOCK_ERP_OFFERS
} from './erpMockData';
import { v4 as uuidv4 } from 'uuid';

const SIMULATED_DELAY = 500; // ms

export const fetchCustomers = (): Promise<Omit<Customer, 'id' | 'createdAt'>[]> => {
    console.log("[ERP Sim] Fetching customers...");
    return new Promise(resolve => {
        setTimeout(() => {
            console.log(`[ERP Sim] Found ${MOCK_ERP_CUSTOMERS.length} customers.`);
            resolve(MOCK_ERP_CUSTOMERS);
        }, SIMULATED_DELAY);
    });
};

export const fetchStockItems = (): Promise<StockItem[]> => {
    console.log("[ERP Sim] Fetching stock items...");
    return new Promise(resolve => {
        setTimeout(() => {
            const items: StockItem[] = MOCK_ERP_STOCK_ITEMS.map(item => ({
                id: item.sku, // Use SKU as the primary key
                ...item,
                lastSync: new Date().toISOString()
            }));
            console.log(`[ERP Sim] Found ${items.length} stock items.`);
            resolve(items);
        }, SIMULATED_DELAY);
    });
};

export const fetchInvoices = (): Promise<(Omit<Invoice, 'items' | 'customerId' | 'userId'> & { customerCurrentCode: string })[]> => {
    console.log("[ERP Sim] Fetching invoices...");
     return new Promise(resolve => {
        setTimeout(() => {
            console.log(`[ERP Sim] Found ${MOCK_ERP_INVOICES.length} invoices.`);
            resolve(MOCK_ERP_INVOICES);
        }, SIMULATED_DELAY);
    });
};

export const fetchIncomingInvoices = (): Promise<IncomingInvoice[]> => {
    console.log("Simulating ERP fetch for INCOMING invoices...");
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(MOCK_INCOMING_INVOICES);
        }, SIMULATED_DELAY);
    });
};

export const fetchOutgoingInvoices = (): Promise<OutgoingInvoice[]> => {
    console.log("Simulating ERP fetch for OUTGOING invoices...");
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(MOCK_OUTGOING_INVOICES);
        }, SIMULATED_DELAY);
    });
};

export const fetchWarehouses = (): Promise<Warehouse[]> => {
    console.log("[ERP Sim] Fetching warehouses...");
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(MOCK_ERP_WAREHOUSES);
        }, SIMULATED_DELAY);
    });
};

export const fetchStockLevels = (): Promise<Omit<StockLevel, 'id'>[]> => {
    console.log("[ERP Sim] Fetching stock levels...");
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(MOCK_ERP_STOCK_LEVELS);
        }, SIMULATED_DELAY);
    });
};

export const fetchOffers = (): Promise<(Omit<Offer, 'id' | 'createdAt' | 'customerId'> & { customerCurrentCode: string })[]> => {
    console.log("[ERP Sim] Fetching offers...");
     return new Promise(resolve => {
        setTimeout(() => {
            resolve(MOCK_ERP_OFFERS);
        }, SIMULATED_DELAY);
    });
};
