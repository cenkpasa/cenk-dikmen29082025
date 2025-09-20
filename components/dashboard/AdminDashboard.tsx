

import React from 'react';
import StatCard from '@/components/dashboard/StatCard';
import BarChart from '@/components/dashboard/BarChart';
import LatestActivity from '@/components/dashboard/LatestActivity';
import TopSalesDonut from '@/components/dashboard/TopSalesDonut';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePersonnel } from '@/contexts/PersonnelContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ViewState } from '@/App';
import AIInsightCenter from '@/components/dashboard/AIInsightCenter';

const AdminDashboard = ({ setView }: { setView: (view: ViewState) => void; }) => {
    const { customers, offers } = useData();
    const { users } = useAuth();
    const { leaveRequests } = usePersonnel();
    const { t } = useLanguage();
    
    const pendingLeaveRequests = leaveRequests.filter(r => r.status === 'pending').length;

    return (
        <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard titleKey="dashboard_totalCustomers" value={String(customers.length)} change="" color="blue" />
                <StatCard titleKey="dashboard_totalUsers" value={String(users.length)} change="" color="green" />
                <StatCard titleKey="pendingLeaveRequests" value={String(pendingLeaveRequests)} change="" color="yellow" />
                <StatCard titleKey="activeOffers" value={String(offers.length)} change="" color="pink" />
            </div>

            {/* Charts & AI */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 shadow-md rounded-cnk-card"><BarChart /></div>
                <div className="lg:col-span-1 shadow-md rounded-cnk-card"><AIInsightCenter setView={setView} /></div>
            </div>
            
            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 shadow-md rounded-cnk-card"><LatestActivity setView={setView} /></div>
                <div className="lg:col-span-1 shadow-md rounded-cnk-card"><TopSalesDonut /></div>
            </div>
        </div>
    );
};

export default AdminDashboard;
