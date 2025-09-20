
import { db } from './dbService';
import { SyncQueueItem } from '@/types';

class SyncService {
    private isSyncing = false;

    async processSyncQueue(): Promise<void> {
        if (this.isSyncing || !navigator.onLine) {
            return;
        }

        this.isSyncing = true;
        console.log("Sync process started.");

        try {
            const queueItems = await db.syncQueue.orderBy('timestamp').toArray();
            if(queueItems.length === 0) {
                 console.log("Sync queue is empty.");
                 this.isSyncing = false;
                 return;
            }

            console.log(`Found ${queueItems.length} items to sync.`);

            for (const item of queueItems) {
                try {
                    await this.processItem(item);
                    await db.syncQueue.delete(item.id!);
                    console.log(`Successfully processed and deleted queue item ${item.id}`);
                } catch (error) {
                    console.error(`Failed to process queue item ${item.id}:`, error);
                    // Decide on an error strategy: retry, move to a dead-letter queue, etc.
                    // For now, we'll leave it in the queue for the next run.
                }
            }
        } catch (error) {
            console.error("Error processing sync queue:", error);
        } finally {
            this.isSyncing = false;
            console.log("Sync process finished.");
        }
    }

    private async processItem(item: SyncQueueItem): Promise<void> {
        switch (item.type) {
            case 'add-customer':
                // The customer is already in the local DB with synced=false.
                // Here we would typically send it to the backend API.
                console.log(`Simulating API call for adding customer: ${item.payload.name}`);
                await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
                
                // Once the API call is successful, we update the local record to mark it as synced.
                await db.customers.update(item.payload.id, { synced: true });
                console.log(`Customer ${item.payload.id} marked as synced.`);
                break;
            // Add other cases for 'update-customer', 'delete-customer', etc.
            default:
                console.warn(`Unknown sync queue item type: ${item.type}`);
        }
    }
}

export const syncService = new SyncService();
