import { db } from './dbService';
import { Customer, Offer, User, Appointment, Interview, Task, Expense } from '../types';

export type SearchResultItem = {
    id: string;
    type: 'Müşteri' | 'Teklif' | 'Personel' | 'Randevu' | 'Görüşme' | 'Görev' | 'Gider';
    title: string;
    description: string;
    page: 'customers' | 'teklif-yaz' | 'personnel' | 'appointments' | 'gorusme-formu' | 'tasks' | 'expenses';
};

export const searchService = {
    async search(term: string): Promise<SearchResultItem[]> {
        if (!term || term.length < 2) {
            return [];
        }

        const lowerTerm = term.toLowerCase();

        const [customers, offers, users, appointments, interviews, tasks, expenses] = await Promise.all([
            db.customers.filter(c => c.name.toLowerCase().includes(lowerTerm) || (c.commercialTitle && c.commercialTitle.toLowerCase().includes(lowerTerm))).limit(5).toArray(),
            db.offers.filter(o => o.teklifNo.toLowerCase().includes(lowerTerm)).limit(5).toArray(),
            db.users.filter(u => u.name.toLowerCase().includes(lowerTerm) || u.jobTitle?.toLowerCase().includes(lowerTerm) || u.username.toLowerCase().includes(lowerTerm)).limit(5).toArray(),
            db.appointments.filter(a => a.title.toLowerCase().includes(lowerTerm) || (a.notes && a.notes.toLowerCase().includes(lowerTerm))).limit(5).toArray(),
            db.interviews.filter(i => i.ziyaretci.firmaAdi.toLowerCase().includes(lowerTerm) || i.notlar.toLowerCase().includes(lowerTerm)).limit(5).toArray(),
            db.tasks.filter(t => t.title.toLowerCase().includes(lowerTerm) || (t.description && t.description.toLowerCase().includes(lowerTerm))).limit(5).toArray(),
            db.expenses.filter(e => e.description.toLowerCase().includes(lowerTerm)).limit(5).toArray(),
        ]);
        
        const customerResults: SearchResultItem[] = customers.map(c => ({
            id: c.id, type: 'Müşteri', title: c.name, description: c.commercialTitle || `Vergi No: ${c.taxNumber || '-'}`, page: 'customers'
        }));

        const offerResults: SearchResultItem[] = offers.map(o => ({
            id: o.id, type: 'Teklif', title: o.teklifNo, description: `Tutar: ${o.genelToplam.toLocaleString('tr-TR')} TL`, page: 'teklif-yaz'
        }));

        const userResults: SearchResultItem[] = users.map(u => ({
            id: u.id, type: 'Personel', title: u.name, description: u.jobTitle || u.role, page: 'personnel'
        }));

        const appointmentResults: SearchResultItem[] = appointments.map(a => ({
            id: a.id, type: 'Randevu', title: a.title, description: new Date(a.start).toLocaleString(), page: 'appointments'
        }));

        const interviewResults: SearchResultItem[] = interviews.map(i => ({
            id: i.id, type: 'Görüşme', title: i.ziyaretci.firmaAdi, description: `Yapan: ${i.gorusmeyiYapan}`, page: 'gorusme-formu'
        }));

        const taskResults: SearchResultItem[] = tasks.map(t => ({
            id: t.id, type: 'Görev', title: t.title, description: `Durum: ${t.status}`, page: 'tasks'
        }));

        const expenseResults: SearchResultItem[] = expenses.map(e => ({
            id: e.id, type: 'Gider', title: e.description, description: `${e.amount.toLocaleString('tr-TR')} ${e.currency}`, page: 'expenses'
        }));


        return [
            ...customerResults, 
            ...offerResults, 
            ...userResults, 
            ...appointmentResults, 
            ...interviewResults, 
            ...taskResults,
            ...expenseResults
        ];
    }
};