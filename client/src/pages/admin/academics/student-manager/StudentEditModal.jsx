import React from 'react';
import { X } from 'lucide-react';
import StudentFormFields from './StudentFormFields';

const StudentEditModal = ({ 
  show, 
  onClose, 
  onSave, 
  data, 
  setData, 
  departments, 
  dbSections, 
  selectedCategory,
  onPhotoChange 
}) => {
  if (!show || !data) return null;

  return (
    <div className="fixed inset-0 bg-[#003B73]/20 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fadeIn">
      <div className="bg-white rounded-[48px] w-full max-w-2xl shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-10 pb-4 shrink-0">
          <div>
            <h3 className="text-3xl font-black text-[#003B73] tracking-tight">Edit Profile</h3>
            <p className="text-gray-500 font-bold text-sm mt-1">Updating records for {data.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-4 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-3xl transition-all"
          >
            <X size={32} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-10 pb-10 custom-scrollbar scrollbar-gutter-stable my-2">
          <form onSubmit={onSave}>
            <StudentFormFields 
              data={data}
              setData={setData}
              departments={departments}
              dbSections={dbSections}
              selectedCategory={selectedCategory}
              onPhotoChange={onPhotoChange}
              isEdit={true}
            />

            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-[24px] font-black transition-all transform active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-5 bg-[#003B73] text-white rounded-[24px] font-black hover:bg-[#002850] shadow-xl shadow-blue-900/10 transition-all transform active:scale-95"
              >
                Update Record
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentEditModal;
