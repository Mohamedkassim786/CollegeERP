import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, X, Clock, AlertTriangle, Inbox } from 'lucide-react';
import { getNotifications } from '../services/notification.service';

const NotificationCenter = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await getNotifications();
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unreadCount);
        } catch (err) {
            console.error("Failed to fetch notifications");
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.patch(`/api/notifications/${id}/read`);
            fetchNotifications();
        } catch (err) {
            console.error("Mark read failed");
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch('/api/notifications/mark-all-read');
            fetchNotifications();
        } catch (err) {
            console.error("Mark all read failed");
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all group active:scale-95"
            >
                <Bell size={20} className="text-gray-500 group-hover:text-[#003B73]" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-5 h-5 bg-red-600 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-4 w-[380px] bg-white rounded-[32px] shadow-2xl shadow-blue-900/10 border border-gray-100 overflow-hidden z-[100] animate-scaleIn">
                    {/* Header */}
                    <div className="p-6 bg-[#003B73] text-white flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-black tracking-tight">System Alerts</h3>
                            <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest leading-tight">Institutional Response Center</p>
                        </div>
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllAsRead}
                                className="text-[10px] font-black uppercase tracking-widest hover:text-blue-100 transition-colors bg-white/10 px-3 py-1.5 rounded-lg"
                            >
                                Mark All Read
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                    <Inbox size={32}/>
                                </div>
                                <p className="font-bold text-gray-400 text-sm uppercase tracking-widest">No active alerts</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((notif) => (
                                    <div 
                                        key={notif.id} 
                                        onClick={() => !notif.isRead && markAsRead(notif.id)}
                                        className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer relative group ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                                    >
                                        <div className="flex gap-4">
                                            <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${notif.type === 'ATTENDANCE_WARNING' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {notif.type === 'ATTENDANCE_WARNING' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className={`text-sm font-black text-[#003B73] uppercase tracking-tighter ${!notif.isRead ? 'font-black' : 'font-bold opacity-60'}`}>
                                                        {notif.type.replace('_', ' ')}
                                                    </h4>
                                                    <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400">
                                                        <Clock size={10} />
                                                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                                <p className={`text-xs ${!notif.isRead ? 'text-gray-700 font-bold' : 'text-gray-500 font-medium'}`}>
                                                    {notif.message}
                                                </p>
                                                {notif.faculty && (
                                                    <div className="mt-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                        Origin: <span className="text-blue-600">{notif.faculty.fullName}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {!notif.isRead && (
                                                <div className="w-2 h-2 bg-[#003B73] rounded-full mt-1 shrink-0"></div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
                        <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-[#003B73] transition-colors">
                            View All Historical Logs
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
