import React from "react";
import { Users, GraduationCap, CheckCircle2, Edit2 } from "lucide-react";

const CategorySelector = ({ 
  onSelect, 
  firstYearCode, 
  tempFirstYearCode, 
  setTempFirstYearCode, 
  isEditingFirstYearCode, 
  setIsEditingFirstYearCode, 
  onSaveFirstYearCode 
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn relative z-10">
      {/* FIRST YEAR card */}
      <div
        onClick={() => onSelect('FIRST_YEAR')}
        className="group p-10 bg-purple-50/50 hover:bg-purple-600 rounded-[32px] cursor-pointer transition-all duration-500 border border-purple-100 hover:shadow-2xl hover:shadow-purple-200 flex flex-col items-center justify-center text-center relative"
      >
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-white/20 transition-all duration-500 mb-6">
          <Users className="w-8 h-8 text-purple-600 group-hover:text-white" />
        </div>
        <h3 className="text-2xl font-black text-purple-900 group-hover:text-white transition-colors">
          FIRST YEAR
        </h3>
        
        {isEditingFirstYearCode ? (
          <div className="mt-4 flex items-center gap-2 animate-fadeIn" onClick={e => e.stopPropagation()}>
            <input
              type="text"
              value={tempFirstYearCode}
              onChange={(e) => setTempFirstYearCode(e.target.value.toUpperCase())}
              className="w-24 px-3 py-1 bg-white border-2 border-purple-200 rounded-lg text-xs font-black text-purple-600 focus:outline-none focus:border-purple-400"
              autoFocus
            />
            <button 
              onClick={onSaveFirstYearCode}
              className="bg-purple-600 text-white px-3 py-1 rounded-lg text-xs font-black hover:bg-purple-700"
            >
              SAVE
            </button>
          </div>
        ) : (
          <div className="mt-2 flex items-center gap-2">
            <p className="text-xs font-black text-purple-400 group-hover:text-purple-100 uppercase tracking-widest">
              Pool: {firstYearCode}
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); setTempFirstYearCode(firstYearCode); setIsEditingFirstYearCode(true); }}
              className="p-1 text-purple-400 hover:text-white transition-colors"
            >
              <Edit2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* DEPARTMENTS card */}
      <div
        onClick={() => onSelect('DEPARTMENTS')}
        className="group p-10 bg-blue-50/50 hover:bg-[#003B73] rounded-[32px] cursor-pointer transition-all duration-500 border border-blue-100 hover:shadow-2xl hover:shadow-blue-200 flex flex-col items-center justify-center text-center"
      >
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-white/20 transition-all duration-500 mb-6">
          <GraduationCap className="w-8 h-8 text-[#003B73] group-hover:text-white" />
        </div>
        <h3 className="text-2xl font-black text-[#003B73] group-hover:text-white transition-colors">
          DEPARTMENTS
        </h3>
        <p className="text-xs font-black text-blue-400 group-hover:text-blue-100 mt-2 uppercase tracking-widest">
          Manage Departments
        </p>
      </div>

      {/* PASSED OUT card */}
      <div
        onClick={() => onSelect('PASSED_OUT')}
        className="group p-10 bg-emerald-50/50 hover:bg-emerald-600 rounded-[32px] cursor-pointer transition-all duration-500 border border-emerald-100 hover:shadow-2xl hover:shadow-emerald-200 flex flex-col items-center justify-center text-center"
      >
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-white/20 transition-all duration-500 mb-6">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 group-hover:text-white" />
        </div>
        <h3 className="text-2xl font-black text-emerald-900 group-hover:text-white transition-colors">
          PASSED OUT
        </h3>
        <p className="text-xs font-black text-emerald-400 group-hover:text-emerald-100 mt-2 uppercase tracking-widest">
          Graduated Batches
        </p>
      </div>
    </div>
  );
};

export default CategorySelector;
