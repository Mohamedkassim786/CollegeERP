import React from "react";
import { GraduationCap, ClipboardList, AlertCircle } from "lucide-react";

export const PassedOutSubviewPicker = ({ onSelect, subview }) => {
  return (
    <div className="animate-fadeIn relative z-10">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-black text-emerald-900 tracking-tight">
          Passed Out — Select View
        </h2>
        <div className="px-6 py-2 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-xs uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          Archive Mode
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div
          onClick={() => onSelect('STUDENTS')}
          className="group p-10 bg-emerald-50/50 hover:bg-emerald-600 rounded-[32px] cursor-pointer transition-all duration-500 border border-emerald-100 hover:shadow-2xl hover:shadow-emerald-200 flex flex-col items-center justify-center text-center"
        >
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-white/20 transition-all duration-500 mb-6">
            <GraduationCap className="w-8 h-8 text-emerald-600 group-hover:text-white" />
          </div>
          <h3 className="text-2xl font-black text-emerald-900 group-hover:text-white transition-colors">
            STUDENTS
          </h3>
          <p className="text-xs font-black text-emerald-400 group-hover:text-emerald-100 mt-2 uppercase tracking-widest">
            View Graduated Batches
          </p>
        </div>
        <div
          onClick={() => onSelect('ARREARS')}
          className="group p-10 bg-orange-50/50 hover:bg-orange-500 rounded-[32px] cursor-pointer transition-all duration-500 border border-orange-100 hover:shadow-2xl hover:shadow-orange-200 flex flex-col items-center justify-center text-center"
        >
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-white/20 transition-all duration-500 mb-6">
            <ClipboardList className="w-8 h-8 text-orange-500 group-hover:text-white" />
          </div>
          <h3 className="text-2xl font-black text-orange-900 group-hover:text-white transition-colors">
            ARREARS
          </h3>
          <p className="text-xs font-black text-orange-400 group-hover:text-orange-100 mt-2 uppercase tracking-widest">
            Pending Arrear Records
          </p>
        </div>
      </div>
    </div>
  );
};

export const PassedOutBatchSelector = ({ batches, onSelect }) => {
  return (
    <div className="animate-fadeIn relative z-10">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-black text-emerald-900 tracking-tight">
          Select Graduated Batch
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {batches.length > 0 ? (
          batches.map(batch => (
            <div
              key={batch}
              onClick={() => onSelect(batch)}
              className="group p-10 bg-emerald-50/50 hover:bg-emerald-600 rounded-[32px] cursor-pointer transition-all duration-500 border border-emerald-100 hover:shadow-2xl hover:shadow-emerald-200 flex flex-col items-center justify-center text-center"
            >
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-white/20 transition-all duration-500 mb-6">
                <GraduationCap className="w-8 h-8 text-emerald-600 group-hover:text-white" />
              </div>
              <h3 className="text-2xl font-black text-emerald-900 group-hover:text-white transition-colors">
                Batch {batch}
              </h3>
              <p className="text-xs font-black text-emerald-400 group-hover:text-emerald-100 mt-2 uppercase tracking-widest">
                View Graduates
              </p>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-400 font-bold text-xl italic mb-2">No Graduated Records Found</p>
            <p className="text-gray-400 text-sm max-w-sm">Mark students as "PASSED OUT" to see them here.</p>
          </div>
        )}
      </div>
    </div>
  );
};
