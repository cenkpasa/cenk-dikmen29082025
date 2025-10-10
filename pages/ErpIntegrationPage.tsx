

import React, { useState, useMemo } from 'react';
import { useErp, SyncResult } from '../contexts/ErpContext';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { User, ErpSettings, StockItem, Customer, Offer, Invoice, IncomingInvoice, OutgoingInvoice } from '../types';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import DataTable from '../components/common/DataTable';
import StockLevelDetail from '../components/erp/StockLevelDetail';
import { formatCurrency, formatDate } from '../utils/formatting';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/dbService';

const TargetEditModal = ({ isOpen, onClose, user, onSave }: { isOpen: boolean, onClose: () => void, user: User, onSave: (target: number) => void }) => {
    const { t } = useLanguage();
    const [target, setTarget] = useState(user.salesTarget || 0);

    const handleSave = () => {
        onSave(Number(target));
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('salesTargetFor', { name: user.name })} footer={
            <>
                <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                <Button onClick={handleSave}>{t('save')}</Button>
            </>
        }>
            <Input
                label={t('targetAmount')}
                id="salesTarget"
                type="number"
                value={String(target)}
                onChange={(e) => setTarget(Number(e.target.value))}
            />
        </Modal>
    );
};

const SyncSummaryModal = ({ isOpen, onClose, result }: { isOpen: boolean, onClose: () => void, result: SyncResult | null }) => {
    const { t } = useLanguage();
    if (!result) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('syncSummaryTitle', {type: result.type})} footer={
            <Button onClick={onClose}>{t('close')}</Button>
        }>
            <div className="space-y-3 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <i className="fas fa-check-circle text-2xl text-green-600"></i>
                </div>
                <h3 className="text-lg font-medium leading-6 text-cnk-txt-primary-light">{t('syncSuccessTitle')}</h3>
                <div className="mt-2 text-sm text-cnk-txt-secondary-light">
                    <p dangerouslySetInnerHTML={{ __html: t('syncSummaryBody', { fetched: String(result.fetched), added: String(result.added), updated: String(result.updated) }) }} />
                </div>
                <div className="mt-4 flex justify-around rounded-cnk-element bg-cnk-bg-light p-4">
                    <div>
                        <div className="text-2xl font-bold text-green-600">{result.added}</div>
                        <div className="text-sm font-medium text-cnk-txt-muted-light">{t('newRecordsAdded')}</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-blue-600">{result.updated}</div>
                        <div className="text-sm font-medium text-cnk-txt-muted-light">{t('recordsUpdated')}</div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};


const ErpIntegrationPage = () => {
    const { t } = useLanguage();
    const { erpSettings, updateErpSettings, stockItems, syncCustomers, syncOffers, syncIncomingInvoices, syncOutgoingInvoices, syncStock, syncStockLevels } = useErp();
    const { customers, offers } = useData();
    const { users, updateUser, currentUser } = useAuth();
    const { showNotification } = useNotification();
    
    const incomingInvoices = useLiveQuery(() => db.incomingInvoices.toArray(), []) || [];
    const outgoingInvoices = useLiveQuery(() => db.outgoingInvoices.toArray(), []) || [];

    const [settings, setSettings] = useState<ErpSettings | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState<string | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState('connection');
    const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
    const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null);
    
    // State for Sales Target Tab
    const [selectedYear, setSelectedYear] = useState(2025);
    const [selectedMonth, setSelectedMonth] = useState(8); // August

    React.useEffect(() => {
        if (erpSettings) {
            setSettings(erpSettings);
        }
    }, [erpSettings]);

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (settings) {
            setSettings({ ...settings, [e.target.id]: e.target.value });
        }
    };

    const handleToggleConnection = async () => {
        if (!settings) return;
        setIsLoading(true);
        await new Promise(res => setTimeout(res, 1000));
        await updateErpSettings({ ...settings, isConnected: !settings.isConnected });
        setIsLoading(false);
    };

    const handleSync = async (type: 'stock' | 'stockLevels' | 'customers' | 'offers' | 'incoming' | 'outgoing') => {
        setIsSyncing(type);
        try {
            let result;
            switch(type) {
                case 'stock': result = await syncStock(); break;
                case 'stockLevels': result = await syncStockLevels(); break;
                case 'customers': result = await syncCustomers(); break;
                case 'offers': result = await syncOffers(); break;
                case 'incoming': result = await syncIncomingInvoices(); break;
                case 'outgoing': result = await syncOutgoingInvoices(); break;
            }
            setSyncResult(result);
        } catch (error) {
            console.error("Sync failed:", error);
            showNotification('genericError', 'error');
        } finally {
            setIsSyncing(null);
        }
    };

    const handleSaveTarget = async (user: User, target: number) => {
        await updateUser({ ...user, salesTarget: target });
        showNotification('userUpdated', 'success');
        setEditingUser(null);
    };

    const salesData = useMemo(() => {
        return users.map(user => {
            const userSales = outgoingInvoices
                .filter(inv => {
                    const invDate = new Date(inv.tarih);
                    return inv.userId === user.id &&
                           invDate.getFullYear() === selectedYear &&
                           invDate.getMonth() === selectedMonth - 1;
                })
                .reduce((sum, inv) => sum + inv.tutar, 0);

            const progress = (user.salesTarget && user.salesTarget > 0) ? (userSales / user.salesTarget) * 100 : 0;
            return { ...user, monthlySales: userSales, progress };
        });
    }, [users, outgoingInvoices, selectedYear, selectedMonth]);
    
    const canAccess = currentUser?.role === 'admin';

    if (!canAccess) {
        return <p className="text-center p-4 bg-yellow-500/10 text-yellow-300 rounded-cnk-element">{t('permissionDenied')}</p>;
    }

    if (!settings) {
        return <Loader fullScreen />;
    }

    const tabs = [
        { id: 'connection', labelKey: 'erpConnectionTab' },
        { id: 'targets', labelKey: 'erpSalesTargetsTab' },
        { id: 'customers', labelKey: 'erpCustomersTab' },
        { id: 'offers', labelKey: 'erpOffersTab' },
        { id: 'stock', labelKey: 'erpStockStatusTab' },
        { id: 'incoming_invoices', labelKey: 'incomingInvoices' },
        { id: 'outgoing_invoices', labelKey: 'outgoingInvoices' },
    ];

    const customerColumns = [
        { header: t('currentCode'), accessor: (item: Customer) => item.currentCode },
        { header: t('nameCompanyName'), accessor: (item: Customer) => item.name },
        { header: t('taxNumber'), accessor: (item: Customer) => item.taxNumber },
        { header: t('city'), accessor: (item: Customer) => item.city },
    ];
    
    const offerColumns = [
        { header: t('teklifNo'), accessor: (item: Offer) => item.teklifNo },
        { header: t('customer'), accessor: (item: Offer) => customers.find(c => c.id === item.customerId)?.name || '-' },
        { header: t('date'), accessor: (item: Offer) => formatDate(item.createdAt) },
        { header: t('grandTotal'), accessor: (item: Offer) => formatCurrency(item.genelToplam, item.currency)},
    ];
    
    const incomingInvoiceColumns = [
        { header: t('invoiceNo'), accessor: (item: IncomingInvoice) => item.faturaNo },
        { header: t('supplier'), accessor: (item: IncomingInvoice) => item.tedarikciAdi },
        { header: t('date'), accessor: (item: IncomingInvoice) => formatDate(item.tarih) },
        { header: t('totalAmount'), accessor: (item: IncomingInvoice) => formatCurrency(item.tutar, item.currency) },
    ];

    const outgoingInvoiceColumns = [
        { header: t('invoiceNo'), accessor: (item: OutgoingInvoice) => item.faturaNo },
        { header: t('customer'), accessor: (item: OutgoingInvoice) => item.musteriAdi },
        { header: t('date'), accessor: (item: OutgoingInvoice) => formatDate(item.tarih) },
        { header: t('totalAmount'), accessor: (item: OutgoingInvoice) => formatCurrency(item.tutar, item.currency) },
    ];

    return (
        <div>
            {editingUser && <TargetEditModal isOpen={true} onClose={() => setEditingUser(null)} user={editingUser} onSave={(target) => handleSaveTarget(editingUser, target)} />}
            <SyncSummaryModal isOpen={!!syncResult} onClose={() => setSyncResult(null)} result={syncResult} />
            
            <div className="border-b border-cnk-border-light mb-6">
                <nav className="flex space-x-4 overflow-x-auto">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`px-3 py-2 font-medium text-sm rounded-t-cnk-element transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-cnk-panel-light border border-cnk-border-light border-b-cnk-panel-light text-cnk-accent-primary -mb-px' : 'text-cnk-txt-muted-light hover:text-cnk-accent-primary'}`}>
                            {t(tab.labelKey)}
                        </button>
                    ))}
                </nav>
            </div>

            <div className={`${activeTab === 'connection' ? 'block' : 'hidden'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="rounded-cnk-card border border-cnk-border-light bg-cnk-panel-light p-6 shadow-md lg:col-span-1">
                        <h2 className="text-xl font-semibold text-cnk-accent-primary mb-4">{t('databaseConnection')}</h2>
                        <div className="space-y-4">
                            <Input label={t('server')} id="server" value={settings.server} onChange={handleSettingsChange} disabled={settings.isConnected}/>
                            <Input label="Database Path" id="databasePath" value={settings.databasePath} onChange={handleSettingsChange} disabled={settings.isConnected}/>
                            <Input label={t('username')} id="username" value={settings.username} onChange={handleSettingsChange} disabled={settings.isConnected}/>
                            <Input label={t('password')} id="password" type="password" value="••••••••" disabled={true} />
                            <div className="flex items-center justify-between pt-4">
                                <div className="flex items-center gap-2 font-semibold">
                                    <span className={`h-3 w-3 rounded-full ${settings.isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                                    <span className={settings.isConnected ? 'text-green-600' : 'text-red-600'}>{settings.isConnected ? t('connected') : t('notConnected')}</span>
                                </div>
                                <Button onClick={handleToggleConnection} isLoading={isLoading} variant={settings.isConnected ? 'danger' : 'success'}>
                                    {settings.isConnected ? t('disconnect') : t('connect')}
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        <h2 className="text-xl font-semibold text-cnk-accent-primary mb-4">{t('dataSync')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <SyncCard titleKey="erpStockSyncDesc" lastSync={settings.lastSyncStock} type="stock" onSync={handleSync} isSyncing={isSyncing} isConnected={settings.isConnected} />
                           <SyncCard titleKey="erpStockLevelsSyncDesc" lastSync={settings.lastSyncStockLevels} type="stockLevels" onSync={handleSync} isSyncing={isSyncing} isConnected={settings.isConnected} />
                           <SyncCard titleKey="erpCustomersSyncDesc" lastSync={settings.lastSyncCustomers} type="customers" onSync={handleSync} isSyncing={isSyncing} isConnected={settings.isConnected} />
                           <SyncCard titleKey="offerManagementTitle" lastSync={settings.lastSyncOffers} type="offers" onSync={handleSync} isSyncing={isSyncing} isConnected={settings.isConnected} />
                           <SyncCard titleKey="erpIncomingInvoicesSyncDesc" lastSync={settings.lastSyncIncomingInvoices} type="incoming" onSync={handleSync} isSyncing={isSyncing} isConnected={settings.isConnected} />
                           <SyncCard titleKey="erpOutgoingInvoicesSyncDesc" lastSync={settings.lastSyncOutgoingInvoices} type="outgoing" onSync={handleSync} isSyncing={isSyncing} isConnected={settings.isConnected} />
                        </div>
                    </div>
                </div>
            </div>
            
            <TabContent isVisible={activeTab === 'targets'} title={t('erpSalesTargetsTab')}>
                <div className="flex gap-4 items-center mb-4 bg-cnk-bg-light p-2 rounded-md">
                    <label>Dönem:</label>
                    <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="p-2 border rounded-md">
                        {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(2000, i, 1).toLocaleString('tr-TR', {month: 'long'})}</option>)}
                    </select>
                    <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="p-2 border rounded-md">
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                 <DataTable columns={[
                    { header: t('personnel'), accessor: (item: any) => item.name },
                    { header: t('monthlyTarget'), accessor: (item: any) => formatCurrency(item.salesTarget || 0, 'TRY') },
                    { header: t('thisMonthSales'), accessor: (item: any) => formatCurrency(item.monthlySales, 'TRY')},
                    { header: t('progress'), accessor: (item: any) => (
                        <div className="w-full bg-cnk-border-light rounded-full h-4"><div className="bg-cnk-accent-green h-4 rounded-full text-white text-xs flex items-center justify-center" style={{ width: `${Math.min(item.progress, 100)}%`}}>{item.progress.toFixed(0)}%</div></div>
                    )},
                    { header: t('actions'), accessor: (item: User) => <Button size="sm" onClick={() => setEditingUser(item)}>{t('editTarget')}</Button>},
                ]} data={salesData} />
            </TabContent>

             <TabContent isVisible={activeTab === 'customers'} title={t('erpCustomersTab')}>
                <DataTable columns={customerColumns} data={customers.filter(c => c.synced)} emptyStateMessage={t('noCustomerData')} />
            </TabContent>

            <TabContent isVisible={activeTab === 'offers'} title={t('erpOffersTab')}>
                <DataTable columns={offerColumns} data={offers} emptyStateMessage={t('noOfferData')} />
            </TabContent>
            
            <TabContent isVisible={activeTab === 'incoming_invoices'} title={t('incomingInvoices')}>
                <DataTable columns={incomingInvoiceColumns} data={incomingInvoices} emptyStateMessage={t('noInvoiceData')} />
            </TabContent>

            <TabContent isVisible={activeTab === 'outgoing_invoices'} title={t('outgoingInvoices')}>
                <DataTable columns={outgoingInvoiceColumns} data={outgoingInvoices} emptyStateMessage={t('noInvoiceData')} />
            </TabContent>

            <TabContent isVisible={activeTab === 'stock'} title={t('erpStockStatusTab')}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[60vh]">
                    <div className="md:col-span-1 bg-cnk-bg-light p-2 rounded-cnk-element h-full overflow-y-auto">
                         {stockItems.map(item => (
                            <div key={item.id}
                                onClick={() => setSelectedStockItem(item)}
                                className={`p-3 rounded-md cursor-pointer ${selectedStockItem?.id === item.id ? 'bg-cnk-accent-primary text-white' : 'hover:bg-cnk-border-light'}`}>
                                <p className="font-semibold">{item.name}</p>
                                <p className="text-xs">{item.sku}</p>
                            </div>
                         ))}
                    </div>
                    <div className="md:col-span-2 bg-cnk-bg-light p-4 rounded-cnk-element h-full">
                        {selectedStockItem ? (
                            <StockLevelDetail stockItem={selectedStockItem} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-cnk-txt-muted-light">
                                <p>{t('selectStockItemToViewLevels')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </TabContent>

        </div>
    );
};

const TabContent = ({ isVisible, title, children }: { isVisible: boolean, title: string, children: React.ReactNode }) => {
    if (!isVisible) return null;
    return (
        <div className="rounded-cnk-card border border-cnk-border-light bg-cnk-panel-light p-6 shadow-md">
             <h2 className="text-xl font-semibold text-cnk-accent-primary mb-4">{title}</h2>
             {children}
        </div>
    );
};

const SyncCard = ({ titleKey, lastSync, type, onSync, isSyncing, isConnected } : { titleKey: string, lastSync?: string, type: 'customers' | 'offers' | 'stock' | 'stockLevels' | 'incoming' | 'outgoing', onSync: (type: any) => void, isSyncing: string | null, isConnected: boolean }) => {
    const { t } = useLanguage();
    const syncKeyMap: Record<typeof type, string> = { 
        customers: 'syncCustomers', 
        offers: 'syncOffers', 
        stock: 'syncStock', 
        stockLevels: 'syncStockLevels', 
        incoming: 'syncIncomingInvoices', 
        outgoing: 'syncOutgoingInvoices' 
    };
    
    const tooltips: Record<typeof type, string> = {
        stock: "ERP'deki stok kartı bilgilerinizi (isim, SKU, fiyat vb.) CRM'e aktarır.",
        stockLevels: "ERP'deki depo bazlı stok seviyelerinizi CRM'e aktarır.",
        customers: "ERP'deki müşteri listenizi CRM'e aktarır. Mevcut müşterileri günceller, yenilerini ekler.",
        offers: "ERP sistemindeki teklifleri CRM'e aktarır.",
        incoming: "ERP'den gelen (alış) faturalarını mutabakat modülü için CRM'e çeker.",
        outgoing: "ERP'den giden (satış) faturalarını mutabakat modülü için CRM'e çeker.",
    };

    return (
        <div className="flex flex-col justify-between p-4 bg-cnk-bg-light rounded-cnk-element border border-cnk-border-light" title={tooltips[type]}>
            <div>
                <h3 className="font-semibold text-lg text-cnk-txt-secondary-light">{t(titleKey)}</h3>
                <p className="text-xs text-cnk-txt-muted-light mt-1 mb-2 h-8">{t(`${syncKeyMap[type].replace('sync', 'erp')}SyncDesc`)}</p>
                <p className="text-xs text-cnk-txt-muted-light/50">Son Senk: {lastSync ? new Date(lastSync).toLocaleString() : 'N/A'}</p>
            </div>
            <div className="flex gap-2 mt-3">
                <Button onClick={() => onSync(type)} isLoading={isSyncing === type} disabled={!isConnected || (isSyncing !== null && isSyncing !== type)} className="w-full">{t(syncKeyMap[type])}</Button>
            </div>
        </div>
    );
};

export default ErpIntegrationPage;
