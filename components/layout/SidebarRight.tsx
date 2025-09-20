
import React from 'react';
import { useData } from '@/contexts/DataContext';
import { useNotificationCenter } from '@/contexts/NotificationCenterContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ViewState } from '@/App';
import { Appointment, Notification } from '@/types';
import { formatDateTime } from '@/utils/formatting';

interface SidebarRightProps {
    setView: (view: ViewState) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const SidebarRight = ({ setView, isOpen, setIsOpen }: SidebarRightProps) => {
    const { t } = useLanguage();
    const { appointments, customers } = useData();
    const { notifications, markAsRead } = useNotificationCenter();

    const upcomingAppointments = appointments
        .filter(app => new Date(app.start) > new Date())
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
        .slice(0, 5);

    const importantNotifications = notifications
        .filter(n => !n.isRead)
        .slice(0, 5);

    const handleAppointmentClick = (appointment: Appointment) => {
        setView({ page: 'appointments' });
        setIsOpen(false);
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            markAsRead(notification.id);
        }
        if (notification.link) {
            setView({ page: notification.link.page, id: notification.link.id });
        }
        setIsOpen(false);
    };

    const getIconForType = (type: Notification['type']) => {
        const iconMap = {
            customer: 'fa-user-plus',
            appointment: 'fa-calendar-check',
            offer: 'fa-file-invoice-dollar',
            interview: 'fa-file-signature',
            system: 'fa-cog',
            reconciliation: 'fa-handshake',
        };
        return iconMap[type] || 'fa-info-circle';
    };

    return (
        <>
            {/* Overlay for mobile/tablet */}
            <div
                className={`fixed inset-0 z-30 bg-black/30 transition-opacity xl:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            ></div>

            {/* Sidebar */}
            <aside
                className={`fixed top-0 right-0 z-40 h-full w-80 transform bg-cnk-panel-light border-l border-cnk-border-light shadow-xl transition-transform duration-300 xl:relative xl:transform-none xl:shadow-none xl:w-full ${isOpen ? 'translate-x-0' : 'translate-x-full xl:translate-x-0'}`}
            >
                <div className="p-4 border-b border-cnk-border-light flex justify-between items-center">
                    <h2 className="font-bold text-lg text-cnk-txt-primary-light">Bildirim Alanı</h2>
                    <button onClick={() => setIsOpen(false)} className="xl:hidden text-cnk-txt-muted-light hover:text-cnk-txt-primary-light">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                
                <div className="p-4 space-y-6 overflow-y-auto h-[calc(100vh-65px)]">
                    {/* Upcoming Appointments */}
                    <section>
                        <h3 className="font-semibold text-cnk-txt-secondary-light mb-3">Yaklaşan Randevular</h3>
                        <div className="space-y-3">
                            {upcomingAppointments.length > 0 ? (
                                upcomingAppointments.map(app => {
                                    const customer = customers.find(c => c.id === app.customerId);
                                    return (
                                        <div key={app.id} onClick={() => handleAppointmentClick(app)} className="p-3 bg-cnk-bg-light rounded-lg cursor-pointer hover:bg-cnk-border-light transition-colors">
                                            <p className="font-semibold text-sm text-cnk-accent-primary truncate">{app.title}</p>
                                            <p className="text-xs text-cnk-txt-secondary-light">{customer?.name || ''}</p>
                                            <p className="text-xs text-cnk-txt-muted-light mt-1">{formatDateTime(app.start)}</p>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-sm text-cnk-txt-muted-light p-3 bg-cnk-bg-light rounded-lg">Yaklaşan randevu yok.</p>
                            )}
                        </div>
                    </section>

                    {/* Important Notifications */}
                    <section>
                        <h3 className="font-semibold text-cnk-txt-secondary-light mb-3">Önemli Bildirimler</h3>
                         <div className="space-y-3">
                            {importantNotifications.length > 0 ? (
                                importantNotifications.map(notif => (
                                    <div key={notif.id} onClick={() => handleNotificationClick(notif)} className="flex items-start gap-3 p-3 bg-cnk-bg-light rounded-lg cursor-pointer hover:bg-cnk-border-light transition-colors">
                                         <div className="flex-shrink-0 mt-1">
                                            <i className={`fas ${getIconForType(notif.type)} text-cnk-txt-muted-light`}></i>
                                        </div>
                                        <div>
                                            <p className="text-sm text-cnk-txt-secondary-light">{t(notif.messageKey, notif.replacements)}</p>
                                            <p className="text-xs text-cnk-txt-muted-light">{new Date(notif.timestamp).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-cnk-txt-muted-light p-3 bg-cnk-bg-light rounded-lg">Okunmamış bildirim yok.</p>
                            )}
                        </div>
                    </section>
                </div>
            </aside>
        </>
    );
};

export default SidebarRight;
