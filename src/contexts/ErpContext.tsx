





import React, { createContext, useContext, ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ErpSettings, StockItem, Invoice, Customer, Offer, IncomingInvoice, OutgoingInvoice, StockLevel, Warehouse } from '../types';
import { db } from '../services/dbService';
import * as erpApiService from '../services/erpApiService';
import Dexie from 'dexie';
import { v4 as uuidv4 } from 'uuid';

export interface SyncResult {
    type: string;
    fetched: number;
    added: number;
    updated: number;
}

interface ErpContextType {
    erpSettings: ErpSettings | undefined;
    updateErpSettings: (settings: ErpSettings) => Promise<void>;
    stockItems: StockItem[];
    invoices: Invoice[];
    syncStock: () => Promise<SyncResult>;
    syncStockLevels: () => Promise<SyncResult>;
    syncInvoices: () => Promise<SyncResult>;
    syncCustomers: () => Promise<SyncResult>;
    syncOffers: () => Promise<SyncResult>;
    syncIncomingInvoices: () => Promise<SyncResult>;
    syncOutgoingInvoices: () => Promise<SyncResult>;
}

const ErpContext = createContext<ErpContextType | undefined>(undefined);

interface ErpProviderProps {
    children: ReactNode;
}

export const ErpProvider = ({ children }: ErpProviderProps) => {
    const erpSettings = useLiveQuery(() => db.erpSettings.get('default'), []);
    const stockItems = useLiveQuery(() => db.stockItems.toArray(), []) || [];
    const invoices = useLiveQuery(() => db.invoices.toArray(), []) || [];

    const updateErpSettings = async (settings: ErpSettings) => {
        await db.erpSettings.put(settings);
    };

    const syncCustomers = async (): Promise<SyncResult> => {
        const currentSettings = erpSettings || await db.erpSettings.get('default');
        const newSyncTimestamp = new Date().toISOString();

        const fetchedCustomers = await erpApiService.fetchCustomers();
        const fetchedCustomerCodes = fetchedCustomers.map(c => c.currentCode).filter(Boolean) as string[];

        const existingCustomers = await db.customers.where('currentCode').anyOf(fetchedCustomerCodes).toArray();
        const existingCustomerMap = new Map(existingCustomers.map(c => [c.currentCode!, c]));

        let addedCount = 0;
        let updatedCount = 0;

        const customersToUpsert: Customer[] = fetchedCustomers.map(erpCust => {
            const existing = existingCustomerMap.get(erpCust.currentCode!);
            if (existing) {
                updatedCount++;
                // Fix: Added a non-null assertion `!` because TypeScript was not narrowing the type of 'existing' inside the 'if' block. This assures the compiler that 'existing' is an object, resolving the spread operator error.
                return { ...existing!, ...erpCust, synced: true };
            } else {
                addedCount++;
                return {
                    ...erpCust,
                    id: uuidv4(),
                    createdAt: new Date().toISOString(),
                    synced: true,
                };
            }
        });

        if (customersToUpsert.length > 0) {
            await db.customers.bulkPut(customersToUpsert);
        }

        if (currentSettings) {
            await updateErpSettings({ ...currentSettings, lastSyncCustomers: newSyncTimestamp });
        }
        return { type: 'Müşteri', fetched: fetchedCustomers.length, added: addedCount, updated: updatedCount };
    };
    
    const syncStock = async (): Promise<SyncResult> => {
        const currentSettings = erpSettings || await db.erpSettings.get('default');
        const newSyncTimestamp = new Date().toISOString();

        const fetchedItems = await erpApiService.fetchStockItems();
        const existingSkus = fetchedItems.map(item => item.sku);
        const existingItems = await db.stockItems.where('sku').anyOf(existingSkus).toArray();
        const existingItemsMap = new Map(existingItems.map(item => [item.sku, item]));

        let addedCount = 0;
        let updatedCount = 0;

        const itemsToUpsert: StockItem[] = fetchedItems.map(item => {
            const existingItem = existingItemsMap.get(item.sku);
            if (existingItem) {
                updatedCount++;
                // Fix: Added a non-null assertion `!` because TypeScript was not narrowing the type of 'existingItem' inside the 'if' block. This assures the compiler that 'existingItem' is an object, resolving the spread operator error.
                return { ...existingItem!, ...item, lastSync: newSyncTimestamp };
            } else {
                addedCount++;
                return { ...item, id: item.sku, lastSync: newSyncTimestamp };
            }
        });

        await db.stockItems.bulkPut(itemsToUpsert);

        if (currentSettings) {
            await updateErpSettings({ ...currentSettings, lastSyncStock: newSyncTimestamp });
        }
        return { type: 'Stok Kartı', fetched: fetchedItems.length, added: addedCount, updated: updatedCount };
    };

    const syncIncomingInvoices = async (): Promise<SyncResult> => {
        const currentSettings = erpSettings || await db.erpSettings.get('default');
        const newSyncTimestamp = new Date().toISOString();
        const fetchedInvoices = await erpApiService.fetchIncomingInvoices();
        
        const existingInvoiceNos = fetchedInvoices.map(inv => inv.faturaNo);
        const existingInvoices = await db.incomingInvoices.where('faturaNo').anyOf(existingInvoiceNos).toArray();
        const existingInvoiceMap = new Map(existingInvoices.map(inv => [inv.faturaNo, inv]));
        
        let addedCount = 0;
        let updatedCount = 0;

        const invoicesToUpsert = fetchedInvoices.map(inv => {
            const existingInv = existingInvoiceMap.get(inv.faturaNo);
            if(existingInv) {
                updatedCount++;
                // Fix: Added a non-null assertion `!` because TypeScript was not narrowing the type of 'existingInv' inside the 'if' block. This assures the compiler that 'existingInv' is an object, resolving the spread operator error.
                return { ...existingInv!, ...inv };
            } else {
                addedCount++;
                return inv;
            }
        });

        await db.incomingInvoices.bulkPut(invoicesToUpsert);

        if (currentSettings) {
            await updateErpSettings({ ...currentSettings, lastSyncIncomingInvoices: newSyncTimestamp });
        }
        return { type: 'Gelen Fatura', fetched: fetchedInvoices.length, added: addedCount, updated: updatedCount };
    };

    const syncOutgoingInvoices = async (): Promise<SyncResult> => {
        const currentSettings = erpSettings || await db.erpSettings.get('default');
        const newSyncTimestamp = new Date().toISOString();
        const fetchedInvoices = await erpApiService.fetchOutgoingInvoices();

        const existingInvoiceNos = fetchedInvoices.map(inv => inv.faturaNo);
        const existingInvoices = await db.outgoingInvoices.where('faturaNo').anyOf(existingInvoiceNos).toArray();
        const existingInvoiceMap = new Map(existingInvoices.map(inv => [inv.faturaNo, inv]));

        let addedCount = 0;
        let updatedCount = 0;

        const invoicesToUpsert = fetchedInvoices.map(inv => {
            const existingInv = existingInvoiceMap.get(inv.faturaNo);
            if(existingInv) {
                updatedCount++;
                // Fix: Added a non-null assertion `!` because TypeScript was not narrowing the type of 'existingInv' inside the 'if' block. This assures the compiler that 'existingInv' is an object, resolving the spread operator error.
                return { ...existingInv!, ...inv };
            } else {
                addedCount++;
                return inv;
            }
        });
        
        await db.outgoingInvoices.bulkPut(invoicesToUpsert);

        if (currentSettings) {
            await updateErpSettings({ ...currentSettings, lastSyncOutgoingInvoices: newSyncTimestamp });
        }
        return { type: 'Giden Fatura', fetched: fetchedInvoices.length, added: addedCount, updated: updatedCount };
    };
    
    const syncStockLevels = async (): Promise<SyncResult> => {
        const currentSettings = erpSettings || await db.erpSettings.get('default');
        const newSyncTimestamp = new Date().toISOString();
        const fetchedWarehouses = await erpApiService.fetchWarehouses();
        await db.warehouses.bulkPut(fetchedWarehouses);

        const fetchedLevels = await erpApiService.fetchStockLevels();
        const levelsToUpsert = fetchedLevels.map(level => ({ ...level, id: uuidv4() }));
        await db.stockLevels.clear();
        await db.stockLevels.bulkAdd(levelsToUpsert);

        if (currentSettings) {
            await updateErpSettings({ ...currentSettings, lastSyncStockLevels: newSyncTimestamp });
        }
        return { type: 'Stok Seviyesi', fetched: fetchedLevels.length, added: fetchedLevels.length, updated: 0 };
    };

    const syncInvoices = async (): Promise<SyncResult> => {
        // This is a placeholder for the general invoice sync, which might be different from incoming/outgoing.
        return { type: 'Fatura', fetched: 0, added: 0, updated: 0 };
    };

    const syncOffers = async (): Promise<SyncResult> => {
        const currentSettings = erpSettings || await db.erpSettings.get('default');
        const newSyncTimestamp = new Date().toISOString();

        const fetchedOffers = await erpApiService.fetchOffers();
        const existingOffers = await db.offers.where('teklifNo').anyOf(fetchedOffers.map(o => o.teklifNo)).toArray();
        const existingOfferMap = new Map(existingOffers.map(o => [o.teklifNo, o]));

        const allCustomers = await db.customers.toArray();
        const customerCodeToIdMap = new Map(allCustomers.filter(c => c.currentCode).map(c => [c.currentCode!, c.id]));

        let addedCount = 0;
        let updatedCount = 0;
        
        const offersToUpsert: Offer[] = [];

        for (const erpOffer of fetchedOffers) {
            const customerId = customerCodeToIdMap.get(erpOffer.customerCurrentCode);
            if (!customerId) continue; // Skip if customer doesn't exist in CRM

            const existing = existingOfferMap.get(erpOffer.teklifNo);
            const { customerCurrentCode, ...restOfErpOffer } = erpOffer;
            const fullOfferData = { ...restOfErpOffer, customerId };

            if (existing) {
                updatedCount++;
                // Fix: Added a non-null assertion `!` because TypeScript was not narrowing the type of 'existing' inside the 'if' block. This assures the compiler that 'existing' is an object, resolving the spread operator error.
                offersToUpsert.push({ ...existing!, ...fullOfferData });
            } else {
                addedCount++;
                // Fix: Cast the created object to `Offer` to resolve a complex type inference issue where `customerId` was being incorrectly typed as `unknown`.
                offersToUpsert.push({
                    ...fullOfferData,
                    id: uuidv4(),
                    createdAt: new Date().toISOString(),
                } as Offer);
            }
        }
        
        if (offersToUpsert.length > 0) {
            await db.offers.bulkPut(offersToUpsert);
        }

        if (currentSettings) {
            await updateErpSettings({ ...currentSettings, lastSyncOffers: newSyncTimestamp });
        }

        return { type: 'Teklif', fetched: fetchedOffers.length, added: addedCount, updated: updatedCount };
    };
    
    const value = {
        erpSettings, updateErpSettings, stockItems, invoices,
        syncStock, syncStockLevels, syncInvoices, syncCustomers,
        syncOffers, syncIncomingInvoices, syncOutgoingInvoices,
    };

    return <ErpContext.Provider value={value}>{children}</ErpContext.Provider>;
};

export const useErp = (): ErpContextType => {
    const context = useContext(ErpContext);
    if (!context) {
        throw new Error('useErp must be used within an ErpProvider');
    }
    return context;
};