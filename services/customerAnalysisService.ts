import { Customer, Invoice, Interview, Appointment } from '../types';
import { db } from './dbService';

type CustomerSegment = 'loyal' | 'high_potential' | 'at_risk' | 'new';

export const analyzeCustomerSegment = async (customer: Customer): Promise<CustomerSegment> => {
    const now = new Date();
    
    // Verimlilik için tüm verileri paralel çekelim
    const [invoices, interviews, appointments] = await Promise.all([
        db.invoices.where('customerId').equals(customer.id).toArray(),
        db.interviews.where('customerId').equals(customer.id).toArray(),
        db.appointments.where('customerId').equals(customer.id).toArray()
    ]);
    
    const totalSpending = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    
    const interactionDates = [
        ...invoices.map(i => new Date(i.date)),
        ...interviews.map(i => new Date(i.createdAt)),
        ...appointments.map(a => new Date(a.start))
    ];

    const lastInteractionDate = interactionDates.length > 0
        ? new Date(Math.max(...interactionDates.map(d => d.getTime())))
        : new Date(customer.createdAt);

    const accountAgeInDays = (now.getTime() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const daysSinceLastInteraction = (now.getTime() - lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24);

    // Segmentasyon Mantığı
    if (accountAgeInDays < 30) {
        return 'new';
    }
    if (daysSinceLastInteraction > 90) {
        return 'at_risk';
    }
    // Örnek eşik değerleri: 50.000 TL harcama ve en az 5 fatura
    if (totalSpending > 50000 && invoices.length >= 5 && accountAgeInDays > 180) {
        return 'loyal';
    }
    // 10.000 TL harcama veya 5'ten fazla etkileşim
    if (totalSpending > 10000 || interactionDates.length > 5) {
        return 'high_potential';
    }
    
    return 'new';
};

export const updateAllCustomerSegments = async () => {
    try {
        const customers = await db.customers.toArray();
        const updates: Customer[] = [];
        
        for (const customer of customers) {
            const segment = await analyzeCustomerSegment(customer);
            const churnRisk = segment === 'at_risk';

            if (customer.segment !== segment || customer.churnRisk !== churnRisk) {
                updates.push({ ...customer, segment, churnRisk });
            }
        }

        if (updates.length > 0) {
            await db.customers.bulkPut(updates);
            console.log(`[AI Analizi] ${updates.length} müşteri segmenti güncellendi.`);
        }
    } catch (error) {
        console.error("Müşteri segmenti güncelleme hatası:", error);
    }
};
