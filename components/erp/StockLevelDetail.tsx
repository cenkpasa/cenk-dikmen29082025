import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/dbService';
import { StockItem, Warehouse } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import DataTable from '../common/DataTable';

interface StockLevelDetailProps {
    stockItem: StockItem;
}

const StockLevelDetail = ({ stockItem }: StockLevelDetailProps) => {
    const { t } = useLanguage();
    
    const stockLevels = useLiveQuery(
        () => db.stockLevels.where('stockItemId').equals(stockItem.id).toArray(),
        [stockItem.id]
    ) || [];

    const warehouses = useLiveQuery(() => db.warehouses.toArray(), []) || [];
    const warehouseMap = new Map(warehouses.map(w => [w.code, w.name]));

    const data = stockLevels.map(level => ({
        ...level,
        warehouseName: warehouseMap.get(level.warehouseCode) || level.warehouseCode
    }));

    const columns = [
        { header: 'Depo', accessor: (item: any) => item.warehouseName },
        { header: t('stockQuantity'), accessor: (item: any) => item.qtyOnHand },
    ];

    return (
        <div>
            <h3 className="font-bold text-lg mb-4 text-cnk-txt-primary-light">{stockItem.name}</h3>
            <h4 className="font-semibold text-md mb-2 text-cnk-txt-secondary-light">{t('warehouseStockLevels')}</h4>
            <DataTable 
                columns={columns} 
                data={data}
                emptyStateMessage="Bu ürün için depo stok bilgisi bulunamadı."
            />
        </div>
    );
};

export default StockLevelDetail;