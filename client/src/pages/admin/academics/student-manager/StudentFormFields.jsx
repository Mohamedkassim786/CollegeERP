import React from 'react';
import CustomSelect from "../../../../components/CustomSelect";
import { Upload, X } from 'lucide-react';
import { SEMESTER_OPTIONS } from "../../../../utils/constants";
import { getPhotoUrl } from "../../../../utils/helpers";

const StudentFormFields = ({ 
  data, 
  setData, 
  departments, 
  dbSections, 
  selectedCategory,
  onPhotoChange,
  isEdit = false
}) => {
  return (
    <div className="space-y-6 pt-4">
      {/* Photo Upload Section */}
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200 hover:border-[#003B73] transition-all group relative overflow-hidden">
        {data.photo ? (
          <div className="relative w-32 h-32">
            <img src={getPhotoUrl(data.photo, 'students')} alt="Preview" className="w-full h-full object-cover rounded-[24px] shadow-lg" />
            <button
              type="button"
              onClick={() => setData({ ...data, photo: '' })}
              className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <label className="cursor-pointer flex flex-col items-center">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-all duration-500 mb-4">
              <Upload className="w-8 h-8 text-[#003B73]" />
            </div>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
              {isEdit ? "Update Photo" : "Upload Photo"}
            </span>
            <input type="file" className="hidden" accept="image/*" onChange={(e) => onPhotoChange(e, isEdit)} />
          </label>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Roll Number</label>
          <input
            className="input-field w-full font-mono font-bold"
            value={data.rollNo}
            onChange={(e) => setData({ ...data, rollNo: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })}
            required
            readOnly={isEdit}
          />
        </div>
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Register Number</label>
          <input
            className="input-field w-full font-mono"
            value={data.registerNumber || ""}
            onChange={(e) => setData({ ...data, registerNumber: e.target.value.replace(/[^0-9]/g, "") })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Full Name</label>
          <input
            className="input-field w-full"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value.replace(/[^a-zA-Z\s]/g, "") })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Department</label>
          <CustomSelect
            className="w-full"
            value={data.department || ""}
            onChange={(e) => setData({ ...data, department: e.target.value })}
            required
          >
            <option value="">Select Dept</option>
            {departments
              .filter((d) => d && d.name?.toLowerCase() !== "first year" && d.code !== (departments.find(dy => dy.name?.toLowerCase() === "first year")?.code || "GEN"))
              .map((d) => (
                <option key={d.id} value={d.code || d.name}>{d.code || d.name}</option>
              ))}
          </CustomSelect>
        </div>
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Academic Year</label>
          <CustomSelect
            className="w-full"
            value={data.year}
            onChange={(e) => setData({ ...data, year: parseInt(e.target.value) })}
            required
          >
            {selectedCategory === 'FIRST_YEAR' ? (
              <option value="1">1st Year</option>
            ) : (
              ["2", "3", "4"].map((y) => (
                <option key={y} value={y}>{y} Year</option>
              ))
            )}
          </CustomSelect>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Section</label>
          <CustomSelect
            className="w-full"
            value={data.section}
            onChange={(e) => setData({ ...data, section: e.target.value })}
            required
          >
            <option value="">Select Section</option>
            {(() => {
              const year = parseInt(data.year);
              if (year === 1) {
                return dbSections
                  .filter(s => s.semester === (parseInt(data.semester) || 1) && s.type === "COMMON")
                  .map(s => s.name);
              }
              
              const deptId = departments.find(d => d.code === data.department || d.name === data.department)?.id;
              return dbSections
                .filter(s => s.departmentId === deptId)
                .map(s => s.name);
            })().filter((v, i, a) => v && a.indexOf(v) === i).map((s) => (
              <option key={s} value={s}>Section {s}</option>
            ))}
          </CustomSelect>
        </div>
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Semester</label>
          <CustomSelect
            className="w-full"
            value={data.semester}
            onChange={(e) => setData({ ...data, semester: parseInt(e.target.value) })}
            required
          >
            <option value="">Select Sem</option>
            {(() => {
              const dept = departments.find(d => d.code === data.department || d.name === data.department);
              const degree = dept?.degree || 'B.E.';
              const options = SEMESTER_OPTIONS[degree] || [1, 2, 3, 4, 5, 6, 7, 8];

              if (selectedCategory === 'FIRST_YEAR') {
                return options.filter(s => s <= 2).map(s => <option key={s} value={s}>Sem {s}</option>);
              }
              return options.filter(s => s > 2).map(s => <option key={s} value={s}>Sem {s}</option>);
            })()}
          </CustomSelect>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Regulation</label>
          <CustomSelect
            className="w-full"
            value={data.regulation || "2021"}
            onChange={(e) => setData({ ...data, regulation: e.target.value })}
            required
          >
            <option value="2021">2021 Regulation</option>
            <option value="2023">2023 Regulation</option>
          </CustomSelect>
        </div>
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Batch</label>
          <input
            className="input-field w-full"
            value={data.batch || ""}
            onChange={(e) => {
              let val = e.target.value.replace(/[^0-9]/g, "");
              if (val.length > 4) val = val.slice(0, 4) + "-" + val.slice(4, 8);
              setData({ ...data, batch: val });
            }}
            placeholder="e.g. 2021-2025"
          />
        </div>
      </div>

      {/* Personal & Contact - Collapsed/Summarized */}
      <div className="border-t border-gray-100 pt-6">
        <h4 className="text-sm font-black text-[#003B73] uppercase tracking-widest mb-4">Personal & Contact</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input type="date" className="input-field" value={data.dateOfBirth || ''} onChange={e => setData({ ...data, dateOfBirth: e.target.value })} required />
          <CustomSelect value={data.gender} onChange={e => setData({ ...data, gender: e.target.value })} required>
            <option value="">Gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </CustomSelect>
          <input
            className="input-field"
            placeholder="Phone"
            value={data.phoneNumber || ""}
            onChange={e => setData({ ...data, phoneNumber: e.target.value.replace(/[^0-9]/g, "").slice(0, 10) })}
            required
          />
        </div>
      </div>
    </div>
  );
};

export default StudentFormFields;
