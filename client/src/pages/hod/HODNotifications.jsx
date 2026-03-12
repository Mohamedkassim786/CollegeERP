import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, Trash2, AlertTriangle } from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/notification.service';

const HODNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetch = async () => {
        setLoading(true);
        try {
            const res = await getNotifications();
            setNotifications(res.data.notifications || []);
        } catch { }
        setLoading(false);
    };

    useEffect(() => { fetch(); }, []);

    const markAllRead = async () => {
        await markAllNotificationsRead();
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const markRead = async (id) => {
        await markNotificationRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const unread = notifications.filter(n => !n.isRead).length;

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-[#003B73] flex items-center gap-3">
                        <Bell className="text-blue-500" /> Notifications
                        {unread > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">{unread}</span>
                        )}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Faculty attendance alerts and updates.</p>
                </div>
                {unread > 0 && (
                    <button onClick={markAllRead}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-all">
                        <CheckCheck size={16} /> Mark all read
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-[#003B73] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : notifications.length === 0 ? (
                <div className="bg-white rounded-2xl p-20 text-center border border-dashed border-gray-200 text-gray-400">
                    <Bell className="mx-auto mb-4 opacity-20" size={48} />
                    <p className="font-medium">No notifications yet.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map(n => (
                        <div key={n.id}
                            className={`flex items-start gap-4 p-5 rounded-2xl border transition-all ${n.isRead ? 'bg-gray-50 border-gray-100' : 'bg-orange-50 border-orange-200 shadow-sm'}`}>
                            <div className={`p-2 rounded-xl ${n.isRead ? 'bg-gray-200' : 'bg-orange-100'}`}>
                                <AlertTriangle className={`w-4 h-4 ${n.isRead ? 'text-gray-400' : 'text-orange-600'}`} />
                            </div>
                            <div className="flex-1">
                                <p className={`font-medium text-sm ${n.isRead ? 'text-gray-500' : 'text-gray-800'}`}>{n.message}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Faculty: <span className="font-medium">{n.faculty?.fullName || 'Unknown'}</span>
                                    &nbsp;·&nbsp;{new Date(n.createdAt).toLocaleString('en-IN')}
                                </p>
                            </div>
                            {!n.isRead && (
                                <button onClick={() => markRead(n.id)}
                                    className="text-xs text-blue-600 hover:underline font-semibold whitespace-nowrap self-center">
                                    Mark read
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HODNotifications;
