/**
 * Sidebar.jsx
 * Renders the left navigation sidebar for all user roles.
 * Menu items are driven by config from sidebarConfig.js — never hardcode items here.
 */

import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { MENUS_BY_ROLE } from '../config/sidebarConfig';
import AuthContext from '../context/AuthProvider';

const Sidebar = ({ role, activePath }) => {
    const location = useLocation();
    const currentPath = activePath || location.pathname;
    const [expandedGroup, setExpandedGroup] = useState(null);
    const { auth } = useContext(AuthContext);

    // Merge menus for all computed roles assigned to the user, memoized to prevent re-renders
    const menu = useMemo(() => {
        const rolesToUse = (role === 'HOD' || role === 'HOD_WITH_SUBJECTS')
            ? [role]
            : (auth?.computedRoles?.length ? auth.computedRoles : [role || 'FACULTY']);
        const _menuKeys = new Set();
        const _menu = [];
        
        rolesToUse.forEach(r => {
            const roleMenu = MENUS_BY_ROLE[r] || [];
            roleMenu.forEach(item => {
                if (!_menuKeys.has(item.key)) {
                    _menuKeys.add(item.key);
                    _menu.push(item);
                }
            });
        });
        return _menu;
    }, [auth?.computedRoles, role]);

    // Auto-expand the group that contains the active route
    useEffect(() => {
        let activeGroupKey = null;
        menu.forEach((item) => {
            if (item.isGroup) {
                const hasActiveChild = item.children.some(
                    (child) => currentPath === child.path || currentPath.startsWith(child.path + '/')
                );
                if (hasActiveChild) {
                    activeGroupKey = item.key;
                }
            }
        });
        
        if (activeGroupKey && expandedGroup !== activeGroupKey) {
            setExpandedGroup(activeGroupKey);
        }
    }, [currentPath, menu]);

    const toggleGroup = (key) => {
        setExpandedGroup(expandedGroup === key ? null : key);
    };

    const renderMenuItem = (item, idx, isChild = false) => {
        const Icon = item.icon;
        const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');

        // ── Group (collapsible) ───────────────────────────────────────────────
        if (item.isGroup) {
            const isExpanded = expandedGroup === item.key;
            const hasActiveChild = item.children.some(
                (child) => currentPath === child.path || currentPath.startsWith(child.path + '/')
            );

            return (
                <li key={item.key} className="space-y-1">
                    <button
                        onClick={() => toggleGroup(item.key)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group
                            ${hasActiveChild && !isExpanded
                                ? 'bg-white/10 text-white'
                                : 'text-blue-100 hover:bg-[#0F2C59] hover:text-white'
                            }`}
                    >
                        <div className="flex items-center">
                            <Icon className="w-5 h-5 mr-3 transition-transform duration-300 group-hover:scale-110" />
                            {item.label}
                        </div>
                        {isExpanded
                            ? <ChevronDown className="w-4 h-4 flex-shrink-0" />
                            : <ChevronRight className="w-4 h-4 flex-shrink-0" />
                        }
                    </button>

                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <ul className="mt-1 ml-4 space-y-1 border-l border-blue-800/50 pl-2">
                            {item.children.map((child, cIdx) =>
                                renderMenuItem(child, `${idx}-${cIdx}`, true)
                            )}
                        </ul>
                    </div>
                </li>
            );
        }

        // ── Leaf link ─────────────────────────────────────────────────────────
        return (
            <li key={item.key} className="animate-fadeIn" style={{ animationDelay: `${idx * 30}ms` }}>
                <Link
                    to={item.path}
                    className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 group relative overflow-hidden
                        ${isActive
                            ? 'bg-white text-[#003B73] shadow-xl shadow-blue-900/20'
                            : 'text-blue-100/90 hover:bg-white/10 hover:text-white'
                        } ${isChild ? 'py-2 px-3' : ''}`}
                >
                    <Icon className={`w-5 h-5 mr-3 flex-shrink-0 transition-transform duration-300 ${isActive ? 'text-[#003B73]' : 'group-hover:scale-110 group-hover:text-white'}`} />
                    <span className="relative z-10 truncate">{item.label}</span>
                    {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#003B73] rounded-r-full" />
                    )}
                </Link>
            </li>
        );
    };

    return (
        <div className="w-64 bg-[#003B73] text-white min-h-screen flex flex-col shadow-2xl fixed left-0 top-0 bottom-0 z-50 overflow-hidden">
            {/* Background Texture Overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#003B73] via-[#002850] to-[#001D3D] opacity-90" />

            {/* Logo Area */}
            <div className="h-24 flex items-center px-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white text-[#003B73] flex items-center justify-center shadow-xl font-black text-2xl hover:rotate-3 transition-transform cursor-pointer">
                        M
                    </div>
                    <div className="leading-tight">
                        <span className="text-xl font-black tracking-tighter text-white">MIET ERP</span>
                        <p className="text-[9px] text-blue-300 font-bold uppercase tracking-[0.2em]">
                            {String(role || '').replace(/_/g, ' ')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto py-4 px-4 custom-scrollbar relative z-10">
                <ul className="space-y-1.5">
                    {menu.map((item, idx) => renderMenuItem(item, idx))}
                </ul>
            </div>

            {/* Footer */}
            <div className="p-6 bg-black/10 backdrop-blur-sm relative z-10">
                <div className="text-[10px] text-blue-300 font-bold text-center space-y-1">
                    <p className="uppercase tracking-[0.2em] opacity-60">© 2026 MIET ERP</p>
                    <p className="text-white/40">Build Version 1.5.0</p>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
