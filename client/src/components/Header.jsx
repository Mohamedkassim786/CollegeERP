import { useNavigate } from 'react-router-dom';
import { LogOut, User, Bell, Search, Menu } from 'lucide-react';
import { useContext, useState } from 'react';
import AuthContext from '../context/AuthProvider';
import NotificationCenter from './NotificationCenter';

const Header = ({ title }) => {
    const { auth, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [showProfile, setShowProfile] = useState(false);

    return (
        <header className="h-24 bg-[#F1F5F9]/50 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 fixed top-0 right-0 left-64 z-40 transition-all duration-300">
            {/* Breadcrumb Section */}
            <div className="flex items-center gap-2">
                <span className="text-xl font-black text-[#003B73]">
                    {title || "College ERP"}
                </span>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-8">
                {/* Search Bar - Minimal Glow */}
                <div className="hidden lg:flex relative group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#003B73] transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search anything..."
                        className="w-72 pl-12 pr-6 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-[#003B73]/5 transition-all text-xs font-bold text-gray-700 placeholder:text-gray-300"
                    />
                </div>

                <div className="flex items-center gap-4">
                    {/* Welcome Text */}
                    <div className="hidden xl:block text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter leading-none mb-1">Status Active</p>
                        <p className="text-xs font-bold text-gray-600">Welcome back, <span className="text-[#003B73]">{auth?.fullName?.split(' ')[0] || 'Admin'}</span></p>
                    </div>

                    {/* Notifications */}
                    <NotificationCenter />

                    {/* User Profile */}
                    <div className="relative">
                        <button
                            onClick={() => setShowProfile(!showProfile)}
                            className="flex items-center gap-1 p-1 hover:bg-white rounded-xl transition-all group"
                        >
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#003B73] to-[#001D3D] flex items-center justify-center text-white font-black shadow-lg ring-4 ring-white transition-transform group-hover:scale-105 active:scale-95">
                                {(auth?.fullName || auth?.user || 'A').charAt(0).toUpperCase()}
                            </div>
                        </button>

                        {/* Dropdown */}
                        {showProfile && (
                            <div className="absolute right-0 mt-4 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-fadeIn overflow-hidden z-50">
                                <div className="px-5 py-4 bg-[#F5F7FA] border-b border-gray-100">
                                    <p className="text-sm font-bold text-[#003B73]">{auth?.fullName || auth?.user}</p>
                                    <p className="text-xs text-gray-500">
                                        {auth?.role === 'ADMIN' ? 'Administrator' : 'Faculty Member'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowProfile(false);
                                        navigate(auth?.role === 'ADMIN' ? '/admin/settings' : '/faculty/settings');
                                    }}
                                    className="w-full px-5 py-3 text-left text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-3"
                                >
                                    <User size={16} className="text-gray-400" />
                                    <span>Profile Settings</span>
                                </button>
                                <button
                                    onClick={logout}
                                    className="w-full px-5 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3 border-t border-gray-50 mt-1"
                                >
                                    <LogOut size={16} />
                                    <span className="font-medium">Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
