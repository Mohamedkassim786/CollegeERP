import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Calendar, Clock, MapPin, User, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';

const StudentTimetable = () => {
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeDay, setActiveDay] = useState(new Date().getDay() || 1); // 1-6 (Mon-Sat), default Mon if Sun

    const days = [
        { id: 'MON', name: 'Monday', short: 'MON' },
        { id: 'TUE', name: 'Tuesday', short: 'TUE' },
        { id: 'WED', name: 'Wednesday', short: 'WED' },
        { id: 'THU', name: 'Thursday', short: 'THU' },
        { id: 'FRI', name: 'Friday', short: 'FRI' },
        { id: 'SAT', name: 'Saturday', short: 'SAT' }
    ];

    const periods = [1, 2, 3, 4, 5, 6, 7, 8];

    useEffect(() => {
        const fetchTimetable = async () => {
            try {
                const res = await api.get('/student/timetable');
                // Standardize day casing to uppercase for safety
                const normalizedData = (res.data || []).map(t => ({
                    ...t,
                    day: t.day?.toUpperCase() || ''
                }));
                setTimetable(normalizedData);
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
        <div className="h-96 bg-white rounded-[40px] flex items-center justify-center animate-pulse border border-gray-100 shadow-sm">
            <div className="text-center">
                <LayoutGrid size={48} className="mx-auto text-blue-100 mb-6 animate-spin" />
                <p className="text-gray-400 font-black uppercase tracking-[0.25em] text-[10px]">Accessing Schedule Vault...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-10 animate-fadeIn w-full">
            {/* Header - Premium Dashboard Style */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-[#003B73] text-[9px] font-black rounded-full uppercase tracking-widest border border-blue-100">
                      <Clock size={12} /> Live Academic Schedule
                    </div>
                    <h1 className="text-5xl font-black text-[#003B73] uppercase tracking-tighter leading-none">Class Registry</h1>
                    <p className="text-gray-400 font-bold text-sm">Automated weekly lecture itinerary and room allocations</p>
                </div>
                
                <div className="flex gap-4 w-full xl:w-auto">
                    <div className="flex-1 xl:flex-none bg-gray-50 px-8 py-5 rounded-3xl border border-gray-100 flex items-center gap-4 group hover:bg-white hover:shadow-lg transition-all cursor-default">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#003B73] shadow-sm group-hover:rotate-12 transition-transform">
                            <Calendar size={22} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active Week</p>
                            <p className="text-lg font-black text-[#003B73]">Current Trimester</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Grid View - Full 8 Periods */}
            <div className="hidden xl:block bg-white rounded-[48px] shadow-2xl border border-gray-100 overflow-hidden relative">
                {/* Visual Backdrop Overlay */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-50/30 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none"></div>

                <div className="grid grid-cols-[100px_repeat(8,1fr)] border-b border-gray-100 bg-gray-50/50 backdrop-blur-md relative z-10">
                    <div className="p-8 border-r border-gray-100"></div>
                    {periods.map(p => (
                        <div key={p} className="p-8 text-center border-r border-gray-100 last:border-0">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Period {p}</p>
                            <div className="inline-block px-3 py-1 bg-[#003B73] text-white rounded-lg text-[9px] font-black font-mono shadow-sm">
                                {p === 1 ? '09:15' : p === 2 ? '10:05' : p === 3 ? '11:15' : p === 4 ? '12:05' : p === 5 ? '01:45' : p === 6 ? '02:30' : p === 7 ? '03:25' : '04:10'}
                            </div>
                        </div>
                    ))}
                </div>

                {days.map(day => (
                    <div key={day.id} className="grid grid-cols-[100px_repeat(8,1fr)] border-b border-gray-100 last:border-0 relative z-10 group">
                        <div className={`p-8 border-r border-gray-100 flex items-center justify-center transition-colors duration-500 ${activeDay === day.id ? 'bg-[#003B73]' : 'bg-gray-50/30 group-hover:bg-gray-100'}`}>
                            <span className={`text-sm font-black uppercase tracking-[0.3em] vertical-text ${activeDay === day.id ? 'text-white' : 'text-gray-300'}`}>{day.short}</span>
                        </div>
                        {periods.map(period => {
                            const entry = getCell(day.id, period);
                            return (
                                <div key={period} className={`p-5 border-r border-gray-100 last:border-0 min-h-[160px] transition-all duration-300 ${entry ? 'hover:bg-blue-50/80 hover:scale-[1.02] cursor-pointer' : 'bg-gray-50/10'}`}>
                                    {entry ? (
                                        <div className="h-full flex flex-col justify-between animate-fadeIn">
                                            <div className="space-y-1">
                                                <div className="w-10 h-1 bg-blue-400 rounded-full mb-3"></div>
                                                <h4 className="text-[11px] font-black text-[#003B73] uppercase tracking-tight leading-tight line-clamp-2">{entry.subject?.name}</h4>
                                                <p className="text-[9px] font-black text-blue-500 font-mono tracking-tighter">{entry.subject?.code}</p>
                                            </div>
                                            <div className="space-y-2 mt-4">
                                                <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                                    <div className="shrink-0 w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                                        <User size={10} />
                                                    </div>
                                                    <span className="text-[9px] font-bold text-gray-600 truncate uppercase">{entry.faculty?.fullName}</span>
                                                </div>
                                                <div className="flex items-center gap-2 px-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                    <MapPin size={10} className="shrink-0 text-blue-400" />
                                                    RM &middot; {entry.room || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex items-center justify-center opacity-20">
                                            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Mobile/Tablet Tabbed View - Refined Styling */}
            <div className="xl:hidden space-y-8">
                <div className="flex gap-3 bg-white p-3 rounded-[32px] shadow-sm border border-gray-100 overflow-x-auto no-scrollbar scroll-smooth">
                    {days.map(day => (
                        <button
                            key={day.id}
                            onClick={() => setActiveDay(day.id)}
                            className={`px-8 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all duration-500 flex-1 ${
                                activeDay === day.id ? 'bg-[#003B73] text-white shadow-2xl scale-105' : 'text-gray-400 hover:text-[#003B73] hover:bg-gray-50'
                            }`}
                        >
                            {day.name}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                    {periods.map(period => {
                        const entry = getCell(activeDay, period);
                        return (
                            <div key={period} className={`p-8 rounded-[40px] border transition-all duration-500 group relative overflow-hidden ${
                                entry ? 'bg-white border-gray-100 shadow-xl' : 'bg-gray-50/50 border-gray-100 opacity-60'
                            }`}>
                                {/* Card Highlight Accent */}
                                {entry && <div className="absolute top-0 left-0 w-full h-2 bg-blue-500"></div>}

                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center gap-5">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12 ${entry ? 'bg-blue-50 text-[#003B73]' : 'bg-white text-gray-300 shadow-sm border border-gray-100'}`}>
                                            <Clock size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Period {period}</p>
                                            <p className="text-base font-black text-[#003B73] ">
                                                {period === 1 ? '09:15' : period === 2 ? '10:05' : period === 3 ? '11:15' : period === 4 ? '12:05' : period === 5 ? '01:45' : period === 6 ? '02:30' : period === 7 ? '03:25' : '04:10'} AM/PM
                                            </p>
                                        </div>
                                    </div>
                                    {entry && (
                                        <div className="px-5 py-2 bg-[#003B73] text-white rounded-2xl shadow-lg shadow-blue-900/10">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">RM {entry.room || '??'}</p>
                                        </div>
                                    )}
                                </div>

                                {entry ? (
                                    <div className="animate-slideUp">
                                        <div className="space-y-1 mb-6">
                                            <h3 className="text-2xl font-black text-[#003B73] uppercase tracking-tight leading-none group-hover:text-blue-600 transition-colors">{entry.subject?.name}</h3>
                                            <p className="text-xs font-black text-blue-400 font-mono tracking-tighter">{entry.subject?.code}</p>
                                        </div>
                                        
                                        <div className="pt-6 border-t border-gray-50 flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[#003B73] shadow-sm">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Instructional Lead</p>
                                                <p className="text-sm font-black text-gray-700 uppercase">{entry.faculty?.fullName}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Lecture Recess</p>
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
