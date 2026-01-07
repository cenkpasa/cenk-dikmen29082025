import React from 'react';
import StatCard from './StatCard';
import BarChart from './BarChart';
import LatestActivity from './LatestActivity';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { ViewState } from '../../App';
import AIInsightCenter from './AIInsightCenter';
import CustomerSegmentChart from './CustomerSegmentChart';
import ChurnRiskWidget from './ChurnRiskWidget';

const AdminDashboard = ({ setView }: { setView: (view: ViewState) => void; }) => {
    const { customers, appointments } = useData();
    const { users } = useAuth();
    const { t } = useLanguage();

    const pendingAppointments = appointments.filter(a => new Date(a.start) >= new Date()).length;

    return (
        <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard titleKey="dashboard_totalCustomers" value={String(customers.length)} change="" color="blue" />
                <StatCard titleKey="dashboard_totalUsers" value={String(users.length)} change="" color="green" />
                <StatCard titleKey="dashboard_pendingAppointments" value={String(pendingAppointments)} change="" color="pink" />
                <StatCard titleKey="reconciliationDifference" value={'0 ₺'} change="" color="yellow" />
            </div>

            {/* AI & Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2"><BarChart /></div>
                <div className="lg:col-span-1"><AIInsightCenter setView={setView} /></div>
            </div>
            
            {/* Customer Analysis Section */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1"><CustomerSegmentChart /></div>
                <div className="lg:col-span-2"><ChurnRiskWidget setView={setView} /></div>
            </div>
            
            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3"><LatestActivity setView={setView} /></div>
            </div>
        </div>
    );
};

export default AdminDashboard;
