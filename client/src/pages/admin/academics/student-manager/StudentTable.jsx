import React from 'react';
import { User, Edit2, Trash2, Users } from 'lucide-react';
import { getPhotoUrl } from "../../../../utils/helpers";

const StudentTable = ({ 
  students, 
  searchTerm, 
  statusFilter, 
  batchFilter, 
  loading,
  onViewProfile,
  onEdit,
  onDelete,
  readOnly = false
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <div className="w-12 h-12 border-4 border-gray-100 border-t-[#003B73] rounded-full animate-spin mb-4"></div>
        <p className="font-black text-gray-400 uppercase tracking-widest text-xs">
          Fetching Roster...
        </p>
      </div>
    );
  }

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchesBatch = batchFilter === 'ALL' || s.batch?.includes(batchFilter);
    return matchesSearch && matchesStatus && matchesBatch;
  });

  if (filteredStudents.length === 0) {
    return (
      <div className="py-32 text-center bg-white/50 rounded-3xl border border-gray-100">
        <Users size={64} className="mx-auto mb-4 text-gray-100" />
        <p className="font-black text-gray-300 text-xl uppercase tracking-widest">
          Class is Empty
        </p>
        <p className="text-gray-300 font-bold mt-1 text-sm">
          No students match the selected filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/50 rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full border-collapse min-w-[1200px] table-fixed">
          <thead className="bg-gray-100/50 text-[#003B73] text-[10px] font-black uppercase tracking-[0.2em]">
            <tr>
              <th className="pl-6 pr-4 py-6 text-left w-[80px]">Photo</th>
              <th className="px-4 py-6 text-left w-[120px]">Roll No</th>
              <th className="px-4 py-6 text-left w-[250px]">Student Details</th>
              <th className="px-4 py-6 text-center w-[150px]">Dept/Sec</th>
              <th className="px-4 py-6 text-center w-[140px]">Batch/Sem</th>
              <th className="px-4 py-6 text-center w-[140px]">Phone</th>
              <th className="px-4 py-6 text-center w-[120px]">Status</th>
              <th className="pl-4 pr-6 py-6 text-right w-[150px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100/50">
            {filteredStudents.map((s) => (
              <tr
                key={s.id}
                className="group relative hover:bg-slate-50/50 transition-all duration-500 hover:shadow-xl hover:-translate-y-1"
              >
                <td className="pl-6 pr-4 py-6 text-left">
                  {s.photo ? (
                    <div className="w-12 h-12 rounded-2xl overflow-hidden border border-gray-100 shadow-sm group-hover:shadow-lg transition-all duration-500">
                      <img src={getPhotoUrl(s.photo, 'students')} alt={s.name} className="w-full h-full object-cover group-hover:scale-150 transition-transform duration-700" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-[#003B73] shadow-sm border border-gray-100 group-hover:scale-125 transition-all duration-500 group-hover:shadow-blue-100">
                      {s.name.charAt(0)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-6 text-left">
                  <span className="font-mono font-bold text-[#003B73] text-sm group-hover:text-blue-600 whitespace-nowrap">
                    {s.rollNo}
                  </span>
                </td>
                <td className="px-4 py-6 text-left">
                  <div className="flex flex-col min-w-0">
                    <span className="font-extrabold text-gray-800 text-lg group-hover:text-[#003B73] transition-colors truncate" title={s.name}>
                      {s.name}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 font-mono tracking-wider truncate">
                      {s.registerNumber || "NO REG NO"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-6">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-[#003B73] text-sm truncate max-w-[150px]" title={s.departmentRef?.name || s.department}>
                      {s.departmentRef?.code || s.department || "-"}
                    </span>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Sec {s.section || "-"}</span>
                  </div>
                </td>
                <td className="px-4 py-6">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-emerald-600 text-sm">{s.batch || "-"}</span>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg font-black text-[9px] border border-indigo-100 mt-1">
                      Sem {s.semester}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-6 text-center text-sm font-bold text-gray-600">
                  {s.phoneNumber || "-"}
                </td>
                <td className="px-4 py-6 text-center">
                  <span className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest border ${
                    s.status === 'ACTIVE' ? 'bg-green-50 text-green-600 border-green-100' :
                    s.status === 'ARREAR' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                    s.status === 'PASSED_OUT' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                    'bg-red-50 text-red-600 border-red-100'
                  }`}>
                    {s.status || 'ACTIVE'}
                  </span>
                </td>
                <td className="pl-4 pr-6 py-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onViewProfile(s.id)}
                      className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                      title="View Profile"
                    >
                      <User size={14} />
                    </button>
                    {!readOnly && (
                      <>
                        <button
                          onClick={() => onEdit(s)}
                          className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => onDelete(s)}
                          className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentTable;
