import React, { useState, useMemo } from 'react';
import { useErp, SyncResult } from '../contexts/ErpContext';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { User, ErpSettings, StockItem, Customer, Offer, Invoice } from '../types';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import DataTable from '../components/common/DataTable';
import StockLevelDetail from '../components/erp/StockLevelDetail';

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
                <div className="mt-4 flex justify-around rounded-lg bg-cnk-bg-light p-4">
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
    // FIX: Removed duplicate `syncInvoices` from destructuring.
    const { erpSettings, updateErpSettings, stockItems, invoices, syncCustomers, syncOffers, syncIncomingInvoices, syncOutgoingInvoices, syncStock, syncStockLevels } = useErp();
    const { customers, offers } = useData();
    const { users, updateUser, currentUser } = useAuth();
    const { showNotification } = useNotification();

    const [settings, setSettings] = useState<ErpSettings | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState<string | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState('connection');
    const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
    const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null);


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

    const handleSync = async (type: 'stock' | 'stockLevels' | 'invoices' | 'customers' | 'offers' | 'incoming' | 'outgoing') => {
        setIsSyncing(type);
        try {
            let result;
            switch(type) {
                case 'stock': result = await syncStock(); break;
                case 'stockLevels': result = await syncStockLevels(); break;
                case 'invoices': result = await useErp().syncInvoices(); break; // Call from fresh hook context if needed
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
            const monthlySales = invoices
                .filter(inv => inv.userId === user.id)
                .reduce((sum, inv) => sum + inv.totalAmount, 0);
            const progress = (user.salesTarget && user.salesTarget > 0) ? (monthlySales / user.salesTarget) * 100 : 0;
            return { ...user, monthlySales, progress };
        });
    }, [users, invoices]);
    
    const canAccess = currentUser?.role === 'admin' || currentUser?.role === 'muhasebe';

    if (!canAccess) {
        return <p className="text-center p-4 bg-yellow-500/10 text-yellow-300 rounded-lg">{t('permissionDenied')}</p>;
    }

    if (!settings) {
        return <Loader fullScreen />;
    }

    const tabs = [
        { id: 'connection', labelKey: 'erpConnectionTab' },
        { id: 'targets', labelKey: 'erpSalesTargetsTab' },
        { id: 'stock', labelKey: 'erpStockStatusTab' },
    ];

    return (
        <div>
            {editingUser && <TargetEditModal isOpen={true} onClose={() => setEditingUser(null)} user={editingUser} onSave={(target) => handleSaveTarget(editingUser, target)} />}
            <SyncSummaryModal isOpen={!!syncResult} onClose={() => setSyncResult(null)} result={syncResult} />
            
            <div className="border-b border-cnk-border-light mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-cnk-accent-primary text-cnk-accent-primary' : 'border-transparent text-cnk-txt-muted-light hover:text-cnk-txt-secondary-light'}`}
                        >
                            {t(tab.labelKey)}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mt-6">
                {activeTab === 'connection' && (
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-cnk-panel-light p-6 rounded-xl shadow-sm border border-cnk-border-light">
                             <h3 className="text-lg font-bold mb-4">{t('databaseConnection')}</h3>
                             <Input label={t('server')} id="server" value={settings.server} onChange={handleSettingsChange} />
                             <Input label="Database Path" id="databasePath" value={settings.databasePath} onChange={handleSettingsChange} />
                             <Input label={t('username')} id="username" value={settings.username} onChange={handleSettingsChange} />
                             <div className="flex items-center justify-between mt-4">
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${settings.isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{settings.isConnected ? t('connected') : t('notConnected')}</span>
                                <Button onClick={handleToggleConnection} isLoading={isLoading} variant={settings.isConnected ? 'danger' : 'success'}>{settings.isConnected ? t('disconnect') : t('connect')}</Button>
                             </div>
                        </div>
                        <div className="bg-cnk-panel-light p-6 rounded-xl shadow-sm border border-cnk-border-light">
                             <h3 className="text-lg font-bold mb-4">{t('dataSync')}</h3>
                             <div className="space-y-3">
                                <Button onClick={() => handleSync('customers')} isLoading={isSyncing === 'customers'} className="w-full justify-between"><span>{t('syncCustomers')} <small className="font-normal opacity-70">({t('erpCustomerSyncDesc')})</small></span> <i className="fas fa-sync"></i></Button>
                                <Button onClick={() => handleSync('offers')} isLoading={isSyncing === 'offers'} className="w-full justify-between"><span>{t('syncOffers')} <small className="font-normal opacity-70">({t('erpOfferSyncDesc')})</small></span> <i className="fas fa-sync"></i></Button>
                                <Button onClick={() => handleSync('stock')} isLoading={isSyncing === 'stock'} className="w-full justify-between"><span>{t('syncStock')} <small className="font-normal opacity-70">({t('erpStockSyncDesc')})</small></span> <i className="fas fa-sync"></i></Button>
                                <Button onClick={() => handleSync('stockLevels')} isLoading={isSyncing === 'stockLevels'} className="w-full justify-between"><span>{t('syncStockLevels')} <small className="font-normal opacity-70">({t('erpStockLevelSyncDesc')})</small></span> <i className="fas fa-sync"></i></Button>
                                <Button onClick={() => handleSync('incoming')} isLoading={isSyncing === 'incoming'} className="w-full justify-between"><span>{t('syncIncomingInvoices')} <small className="font-normal opacity-70">({t('erpIncomingInvoiceSyncDesc')})</small></span> <i className="fas fa-sync"></i></Button>
                                <Button onClick={() => handleSync('outgoing')} isLoading={isSyncing === 'outgoing'} className="w-full justify-between"><span>{t('syncOutgoingInvoices')} <small className="font-normal opacity-70">({t('erpOutgoingInvoiceSyncDesc')})</small></span> <i className="fas fa-sync"></i></Button>
                             </div>
                        </div>
                     </div>
                )}
                 {activeTab === 'targets' && (
                    <DataTable
                        columns={[
                            { header: t('personnel'), accessor: (row: any) => row.name },
                            { header: t('monthlyTarget'), accessor: (row: any) => (row.salesTarget || 0).toLocaleString('tr-TR') + ' ₺' },
                            { header: t('thisMonthSales'), accessor: (row: any) => row.monthlySales.toLocaleString('tr-TR') + ' ₺' },
                            { header: t('progress'), accessor: (row: any) => <div className="w-full bg-cnk-bg-light rounded-full"><div className="bg-green-500 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full" style={{ width: `${Math.min(100, row.progress)}%` }}> {row.progress.toFixed(0)}%</div></div> },
                            { header: t('actions'), accessor: (row: any) => <Button size="sm" onClick={() => setEditingUser(row)}>{t('editTarget')}</Button> }
                        ]}
                        data={salesData}
                    />
                 )}
                 {activeTab === 'stock' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <DataTable
                                columns={[
                                    { header: t('stockCode'), accessor: (row: StockItem) => <button onClick={() => setSelectedStockItem(row)} className="text-cnk-accent-primary hover:underline">{row.sku}</button> },
                                    { header: t('stockName'), accessor: (row: StockItem) => row.name },
                                ]}
                                data={stockItems}
                                emptyStateMessage={t('noStockData')}
                            />
                        </div>
                        <div className="bg-cnk-bg-light p-4 rounded-lg">
                            {selectedStockItem ? (
                                <StockLevelDetail stockItem={selectedStockItem} />
                            ) : (
                                <div className="flex items-center justify-center h-full text-cnk-txt-muted-light">{t('selectStockItemToViewLevels')}</div>
                            )}
                        </div>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default ErpIntegrationPage;