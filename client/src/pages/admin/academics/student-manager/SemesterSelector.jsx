import React from "react";
import { Users } from "lucide-react";

const SemesterSelector = ({ onSelect }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 animate-fadeIn relative z-10">
      {[1, 2].map(sem => (
        <div
          key={`sem-${sem}`}
          onClick={() => onSelect(sem)}
          className="group p-10 bg-purple-50/50 hover:bg-purple-600 rounded-[32px] cursor-pointer transition-all duration-500 border border-purple-100 hover:shadow-2xl hover:shadow-purple-200 flex flex-col items-center justify-center text-center"
        >
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-white/20 transition-all duration-500 mb-6">
            <Users className="w-8 h-8 text-purple-600 group-hover:text-white" />
          </div>
          <h3 className="text-2xl font-black text-purple-900 group-hover:text-white transition-colors">
            Semester {sem}
          </h3>
          <p className="text-xs font-black text-purple-400 group-hover:text-purple-100 mt-2 uppercase tracking-widest">
            First Year Pool
          </p>
        </div>
      ))}
    </div>
  );
};

export default SemesterSelector;
