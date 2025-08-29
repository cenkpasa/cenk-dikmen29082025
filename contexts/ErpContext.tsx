import React, { createContext, useContext, ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ErpSettings, StockItem, Invoice, Customer, Offer, IncomingInvoice, OutgoingInvoice, StockLevel, Warehouse } from '../types';
import { db } from '../services/dbService';
import * as erpApiService from '../services/erpApiService';
import type { Table } from 'dexie';
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

const OVERLAP_MINUTES = 15;

const calculateUpdatedAfter = (lastSyncTimestamp?: string): string => {
    if (!lastSyncTimestamp) {
        console.log('[ERP Sync] No previous sync time found. Fetching all records.');
        return new Date(0).toISOString();
    }
    const lastSyncDate = new Date(lastSyncTimestamp);
    const overlapDate = new Date(lastSyncDate.getTime() - OVERLAP_MINUTES * 60 * 1000);
    console.log(`[ERP Sync] Last sync at ${lastSyncDate.toLocaleString()}. Fetching records updated after ${overlapDate.toLocaleString()} (with ${OVERLAP_MINUTES} min overlap).`);
    return overlapDate.toISOString();
}

export const ErpProvider = ({ children }: ErpProviderProps) => {
    const erpSettings = useLiveQuery(() => db.erpSettings.get('default'), []);
    const stockItems = useLiveQuery(() => db.stockItems.toArray(), []) || [];
    const invoices = useLiveQuery(() => db.invoices.toArray(), []) || [];

    const updateErpSettings = async (settings: ErpSettings) => {
        await db.erpSettings.put(settings);
    };
    
    const syncIncomingInvoices = async (): Promise<SyncResult> => {
        console.log('[ERP Sync] Starting INCOMING INVOICE sync...');
        const currentSettings = erpSettings || await db.erpSettings.get('default');
        const updatedAfter = calculateUpdatedAfter(currentSettings?.lastSyncIncomingInvoices);
        const newSyncTimestamp = new Date().toISOString();

        const fetchedInvoices = await erpApiService.fetchIncomingInvoices();
        console.log(`[ERP Sync] Fetched ${fetchedInvoices.length} incoming invoices from source.`);
        
        await db.transaction('rw', db.incomingInvoices, async () => {
            await db.incomingInvoices.bulkPut(fetchedInvoices);
        });
        console.log(`[ERP Sync] Database transaction for incoming invoices completed successfully.`);

        if (currentSettings) {
            await updateErpSettings({ ...currentSettings, lastSyncIncomingInvoices: newSyncTimestamp });
        }
        console.log('[ERP Sync] INCOMING INVOICE sync finished.');
        return { type: 'Gelen Fatura', fetched: fetchedInvoices.length, added: fetchedInvoices.length, updated: 0 };
    };
    
    const syncOutgoingInvoices = async (): Promise<SyncResult> => {
        console.log('[ERP Sync] Starting OUTGOING INVOICE sync...');
        const currentSettings = erpSettings || await db.erpSettings.get('default');
        const updatedAfter = calculateUpdatedAfter(currentSettings?.lastSyncOutgoingInvoices);
        const newSyncTimestamp = new Date().toISOString();

        const fetchedInvoices = await erpApiService.fetchOutgoingInvoices();
        console.log(`[ERP Sync] Fetched ${fetchedInvoices.length} outgoing invoices from source.`);

        await db.transaction('rw', db.outgoingInvoices, async () => {
            await db.outgoingInvoices.bulkPut(fetchedInvoices);
        });
        console.log(`[ERP Sync] Database transaction for outgoing invoices completed successfully.`);

        if (currentSettings) {
            await updateErpSettings({ ...currentSettings, lastSyncOutgoingInvoices: newSyncTimestamp });
        }
        console.log('[ERP Sync] OUTGOING INVOICE sync finished.');
        return { type: 'Giden Fatura', fetched: fetchedInvoices.length, added: fetchedInvoices.length, updated: 0 };
    };


    const _syncCustomersFromCSV = async (): Promise<{ newCount: number, updatedCount: number, totalCount: number, customerMap: Map<string, string> }> => {
        console.log('[ERP Sync] Starting customer sync...');
        const { customers: parsedCustomersMap } = await erpApiService.fetchErpCsvData();
        console.log(`[ERP Sync] Fetched ${parsedCustomersMap.size} unique customers from source.`);
        const parsedCustomers = Array.from(parsedCustomersMap.values());
        
        const existingCustomers = await db.customers.where('currentCode').anyOf(Array.from(parsedCustomersMap.keys())).toArray();
        console.log(`[ERP Sync] Found ${existingCustomers.length} existing customers in CRM.`);
        const existingCustomerMap = new Map(existingCustomers.map(c => [c.currentCode, c]));

        let addedCount = 0;
        let updatedCount = 0;

        const customersToUpsert: Customer[] = parsedCustomers.map(parsedCust => {
            const existing = existingCustomerMap.get(parsedCust.currentCode!);
            if (existing) {
                updatedCount++;
                const customerData: Omit<Customer, 'id' | 'createdAt'> = parsedCust;
                const updatedCustomer: Customer = { ...existing, ...customerData };
                return updatedCustomer;
            } else {
                addedCount++;
                const customerData: Omit<Customer, 'id' | 'createdAt'> = parsedCust;
                return {
                    ...customerData,
                    id: uuidv4(),
                    createdAt: new Date().toISOString()
                };
            }
        });
        
        console.log(`[ERP Sync] Preparing to add ${addedCount} new customers and update ${updatedCount} existing customers.`);
        if (customersToUpsert.length > 0) {
            await db.transaction('rw', db.customers, async () => {
                await db.customers.bulkPut(customersToUpsert);
            });
            console.log(`[ERP Sync] Database transaction for customers completed successfully.`);
        }
        
        const allRelevantCustomers = await db.customers.where('currentCode').anyOf(Array.from(parsedCustomersMap.keys())).toArray();
        const finalCustomerMap = new Map<string, string>();
        allRelevantCustomers.forEach(c => finalCustomerMap.set(c.currentCode!, c.id));

        console.log('[ERP Sync] Customer sync finished.');
        return { newCount: addedCount, updatedCount, totalCount: parsedCustomers.length, customerMap: finalCustomerMap };
    };

    const syncCustomers = async (): Promise<SyncResult> => {
        const currentSettings = erpSettings || await db.erpSettings.get('default');
        const updatedAfter = calculateUpdatedAfter(currentSettings?.lastSyncCustomers);
        const newSyncTimestamp = new Date().toISOString();

        const { newCount, updatedCount, totalCount } = await _syncCustomersFromCSV();
        
        if (currentSettings) {
            await updateErpSettings({ ...currentSettings, lastSyncCustomers: newSyncTimestamp });
        }
        console.log(`[ERP Sync] Customer sync finished. New watermark set to ${newSyncTimestamp}.`);
        return { type: 'Müşteri', fetched: totalCount, added: newCount, updated: updatedCount };
    };

    const syncInvoices = async (): Promise<SyncResult> => {
        console.log('[ERP Sync] Starting invoice sync...');
        const currentSettings = erpSettings || await db.erpSettings.get('default');
        const updatedAfter = calculateUpdatedAfter(currentSettings?.lastSyncInvoices);
        const newSyncTimestamp = new Date().toISOString();
        
        const { customerMap } = await _syncCustomersFromCSV();
        
        const { invoices: parsedInvoices } = await erpApiService.fetchErpCsvData();
        console.log(`[ERP Sync] Fetched ${parsedInvoices.length} invoices from source.`);
        
        const existingInvoiceIds = new Set((await db.invoices.toCollection().primaryKeys()).map(String));
        let addedCount = 0;
        let updatedCount = 0;

        const invoicesToUpsert: Invoice[] = parsedInvoices
            .map(parsedInv => {
                const customerId = customerMap.get(parsedInv.customerCurrentCode);
                if (!customerId) return null;
                
                const isUpdate = existingInvoiceIds.has(parsedInv.id);
                if(isUpdate) updatedCount++; else addedCount++;
                
                const { customerCurrentCode, ...invoiceData } = parsedInv;

                return {
                    ...invoiceData,
                    customerId,
                    userId: 'user-cnk',
                };
            })
            .filter((inv): inv is Invoice => inv !== null);

        console.log(`[ERP Sync] Preparing to add ${addedCount} new invoices and update ${updatedCount} existing invoices.`);
        if (invoicesToUpsert.length > 0) {
            await db.transaction('rw', db.invoices, async () => {
                await db.invoices.bulkPut(invoicesToUpsert);
            });
            console.log(`[ERP Sync] Database transaction for invoices completed successfully.`);
        }

        if (currentSettings) {
            await updateErpSettings({ ...currentSettings, lastSyncInvoices: newSyncTimestamp });
        }
        console.log(`[ERP Sync] Invoice sync finished. New watermark set to ${newSyncTimestamp}.`);
        return { type: 'Fatura', fetched: parsedInvoices.length, added: addedCount, updated: updatedCount };
    };

    const syncStock = async (): Promise<SyncResult> => {
        console.log('[ERP Sync] Starting STOCK ITEMS sync...');
        const currentSettings = erpSettings || await db.erpSettings.get('default');
        const updatedAfter = calculateUpdatedAfter(currentSettings?.lastSyncStock);
        const newSyncTimestamp = new Date().toISOString();

        const fetchedItems = await erpApiService.fetchStockItems();
        console.log(`[ERP Sync] Fetched ${fetchedItems.length} stock items from source.`);

        await db.transaction('rw', db.stockItems, async () => {
            await db.stockItems.bulkPut(fetchedItems);
        });

        if (currentSettings) {
            await updateErpSettings({ ...currentSettings, lastSyncStock: newSyncTimestamp });
        }
        console.log(`[ERP Sync] STOCK ITEMS sync finished.`);
        return { type: 'Stok Kartı', fetched: fetchedItems.length, added: fetchedItems.length, updated: 0 };
    };
    
    const syncStockLevels = async (): Promise<SyncResult> => {
        console.log('[ERP Sync] Starting STOCK LEVELS sync...');
        const currentSettings = erpSettings || await db.erpSettings.get('default');
        const newSyncTimestamp = new Date().toISOString();
        
        // Sync warehouses first to ensure they exist
        const fetchedWarehouses = await erpApiService.fetchWarehouses();
        await db.warehouses.bulkPut(fetchedWarehouses);
        console.log(`[ERP Sync] Synced ${fetchedWarehouses.length} warehouses.`);

        // Now sync stock levels
        const fetchedLevels = await erpApiService.fetchStockLevels();
        console.log(`[ERP Sync] Fetched ${fetchedLevels.length} stock levels from source.`);

        const levelsToUpsert = fetchedLevels.map(level => ({
            ...level,
            id: uuidv4()
        }));

        await db.transaction('rw', db.stockLevels, async () => {
            await db.stockLevels.bulkPut(levelsToUpsert);
        });
        
        if (currentSettings) {
            await updateErpSettings({ ...currentSettings, lastSyncStockLevels: newSyncTimestamp });
        }

        console.log(`[ERP Sync] STOCK LEVELS sync finished.`);
        return { type: 'Stok Seviyesi', fetched: fetchedLevels.length, added: fetchedLevels.length, updated: 0 };
    };


    const syncOffers = async (): Promise<SyncResult> => {
        console.log('[ERP Sync] Starting offer sync...');
        const currentSettings = erpSettings || await db.erpSettings.get('default');
        const updatedAfter = calculateUpdatedAfter(currentSettings?.lastSyncOffers);
        const newSyncTimestamp = new Date().toISOString();

        const { customerMap } = await _syncCustomersFromCSV();

        const { offers: parsedOffers } = await erpApiService.fetchErpCsvData();
        console.log(`[ERP Sync] Fetched ${parsedOffers.length} offers from source.`);

        const existingOffers = await db.offers.where('teklifNo').anyOf(parsedOffers.map(o => o.teklifNo)).toArray();
        const existingOfferMap = new Map(existingOffers.map(o => [o.teklifNo, o]));
        
        let addedCount = 0;
        let updatedCount = 0;

        const offersToUpsert: Offer[] = parsedOffers.map(parsedOffer => {
            const customerId = customerMap.get(parsedOffer.customerCurrentCode);
            if (!customerId) return null;

            const existing = existingOfferMap.get(parsedOffer.teklifNo);
            const { customerCurrentCode, ...offerData } = parsedOffer;

            if (existing) {
                updatedCount++;
                const offerUpdateData: Omit<Offer, 'id' | 'createdAt' | 'customerId'> = offerData;
                const updatedOffer: Offer = { ...existing, ...offerUpdateData, customerId };
                return updatedOffer;
            } else {
                addedCount++;
                const offerNewData: Omit<Offer, 'id' | 'createdAt' | 'customerId'> = offerData;
                return {
                    ...offerNewData,
                    id: uuidv4(),
                    createdAt: new Date().toISOString(),
                    customerId,
                };
            }
        }).filter((o): o is Offer => o !== null);

        console.log(`[ERP Sync] Preparing to add ${addedCount} new offers and update ${updatedCount} existing offers.`);
        if (offersToUpsert.length > 0) {
            await db.transaction('rw', db.offers, async () => {
                await db.offers.bulkPut(offersToUpsert);
            });
            console.log(`[ERP Sync] Database transaction for offers completed successfully.`);
        }

        if (currentSettings) {
            await updateErpSettings({ ...currentSettings, lastSyncOffers: newSyncTimestamp });
        }
        console.log(`[ERP Sync] Offer sync finished. New watermark set to ${newSyncTimestamp}.`);
        return { type: 'Teklif', fetched: parsedOffers.length, added: addedCount, updated: updatedCount };
    };
    
    const value = {
        erpSettings,
        updateErpSettings,
        stockItems,
        invoices,
        syncStock,
        syncStockLevels,
        syncInvoices,
        syncCustomers,
        syncOffers,
        syncIncomingInvoices,
        syncOutgoingInvoices,
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