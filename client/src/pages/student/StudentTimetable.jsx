import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Calendar, Clock, MapPin, User, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';

const StudentTimetable = () => {
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeDay, setActiveDay] = useState(new Date().getDay() || 1); // 1-6 (Mon-Sat), default Mon if Sun

    const days = [
        { id: 1, name: 'Monday', short: 'MON' },
        { id: 2, name: 'Tuesday', short: 'TUE' },
        { id: 3, name: 'Wednesday', short: 'WED' },
        { id: 4, name: 'Thursday', short: 'THU' },
        { id: 5, name: 'Friday', short: 'FRI' },
        { id: 6, name: 'Saturday', short: 'SAT' }
    ];

    const periods = [1, 2, 3, 4, 5, 6];

    useEffect(() => {
        const fetchTimetable = async () => {
            try {
                const res = await api.get('/student/timetable');
                setTimetable(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTimetable();
    }, []);

    const getCell = (dayId, period) => {
        return timetable.find(t => t.day === dayId && t.period === period);
    };

    if (loading) return (
        <div className="h-96 bg-white rounded-[40px] flex items-center justify-center animate-pulse">
            <div className="text-center">
                <LayoutGrid size={48} className="mx-auto text-gray-200 mb-4 animate-spin" />
                <p className="text-gray-400 font-black uppercase tracking-[0.25em]">Scheduling Registry...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-[#003B73] uppercase tracking-tighter">Academic Schedule</h1>
                    <p className="text-gray-500 font-medium">Your weekly lecture itinerary and room allocations</p>
                </div>
                <div className="bg-white px-6 py-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-[#003B73]">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active Week</p>
                        <p className="text-base font-black text-[#003B73]">Continuous Monitoring</p>
                    </div>
                </div>
            </div>

            {/* Desktop Grid View */}
            <div className="hidden lg:block bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-7 border-b border-gray-100">
                    <div className="p-6 bg-gray-50 border-r border-gray-100"></div>
                    {periods.map(p => (
                        <div key={p} className="p-6 text-center border-r border-gray-100 bg-gray-50 last:border-0">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Period {p}</p>
                            <p className="text-xs font-bold text-[#003B73] font-mono">Slot {p}:00</p>
                        </div>
                    ))}
                </div>

                {days.map(day => (
                    <div key={day.id} className="grid grid-cols-7 border-b border-gray-100 last:border-0 group">
                        <div className={`p-6 bg-gray-50 border-r border-gray-100 flex items-center justify-center ${activeDay === day.id ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>
                            <span className="text-sm font-black uppercase tracking-widest vertical-text">{day.short}</span>
                        </div>
                        {periods.map(period => {
                            const entry = getCell(day.id, period);
                            return (
                                <div key={period} className={`p-4 border-r border-gray-100 last:border-0 min-h-[140px] transition-all duration-300 ${entry ? 'hover:bg-blue-50/50 hover:shadow-inner' : 'bg-gray-50/20'}`}>
                                    {entry ? (
                                        <div className="h-full flex flex-col justify-between">
                                            <div>
                                                <h4 className="text-xs font-black text-[#003B73] uppercase tracking-tight leading-tight mb-1">{entry.subject.name}</h4>
                                                <p className="text-[10px] font-black text-blue-500 font-mono tracking-tighter mb-2">{entry.subject.code}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-500 truncate uppercase">
                                                    <User size={10} className="shrink-0" />
                                                    {entry.faculty.fullName}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                    <MapPin size={10} className="shrink-0 text-blue-400" />
                                                    Room {entry.roomNo || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 bg-gray-200 rounded-full"></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Mobile/Tablet Tabbed View */}
            <div className="lg:hidden space-y-6">
                <div className="flex gap-2 bg-white p-2 rounded-[32px] shadow-sm border border-gray-100 overflow-x-auto custom-scrollbar no-scrollbar">
                    {days.map(day => (
                        <button
                            key={day.id}
                            onClick={() => setActiveDay(day.id)}
                            className={`px-6 py-4 rounded-[24px] font-black text-[11px] uppercase tracking-widest whitespace-nowrap transition-all duration-300 flex-1 ${
                                activeDay === day.id ? 'bg-[#003B73] text-white shadow-xl scale-105' : 'text-gray-400 hover:text-[#003B73] hover:bg-gray-50'
                            }`}
                        >
                            {day.name}
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    {periods.map(period => {
                        const entry = getCell(activeDay, period);
                        return (
                            <div key={period} className={`p-6 rounded-[32px] border transition-all duration-300 ${
                                entry ? 'bg-white border-gray-100 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-50'
                            }`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${entry ? 'bg-blue-50 text-[#003B73]' : 'bg-gray-200 text-gray-400'}`}>
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Period {period}</p>
                                            <p className="text-sm font-black text-[#003B73]">{period}:00 - {period + 1}:00</p>
                                        </div>
                                    </div>
                                    {entry && (
                                        <div className="px-4 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                                            <p className="text-[10px] font-black text-[#003B73] uppercase tracking-widest">RM-{entry.roomNo || '??'}</p>
                                        </div>
                                    )}
                                </div>

                                {entry ? (
                                    <div className="mt-6 animate-slideUp">
                                        <h3 className="text-xl font-black text-[#003B73] uppercase tracking-tight mb-1">{entry.subject.name}</h3>
                                        <p className="text-xs font-black text-blue-500 font-mono tracking-tighter mb-4">{entry.subject.code}</p>
                                        <div className="pt-4 border-t border-gray-50 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#003B73]">
                                                <User size={14} />
                                            </div>
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Prof. {entry.faculty.fullName}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 text-center">
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">No Class Registry</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default StudentTimetable;
