import React from 'react';
import { Search, X } from 'lucide-react';
import CustomSelect from "../../../../components/CustomSelect";

const StudentFilters = ({ 
  searchTerm, 
  setSearchTerm, 
  statusFilter, 
  setStatusFilter, 
  batchFilter, 
  setBatchFilter 
}) => {
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="p-6 bg-white/50 border-b border-gray-100 flex flex-wrap items-center gap-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search Name or Roll Number..."
          className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#003B73]/10 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <CustomSelect
        className="min-w-[150px]"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="ALL">All Status</option>
        <option value="ACTIVE">Active</option>
        <option value="ARREAR">Arrear</option>
        <option value="PASSED_OUT">Passed Out</option>
        <option value="DETENTION">Detention</option>
        <option value="DROPOUT">Dropout</option>
      </CustomSelect>

      <CustomSelect
        className="min-w-[150px]"
        value={batchFilter}
        onChange={(e) => setBatchFilter(e.target.value)}
      >
        <option value="ALL">All Batches</option>
        {years.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </CustomSelect>

      <button
        onClick={() => {
          setSearchTerm('');
          setStatusFilter('ALL');
          setBatchFilter('ALL');
        }}
        className="p-3 bg-gray-100 text-gray-500 rounded-2xl hover:bg-gray-200 transition-all"
        title="Clear Filters"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default StudentFilters;
