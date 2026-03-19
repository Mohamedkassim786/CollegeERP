import React, { useState } from 'react';
import { X, FileSpreadsheet, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

const StudentBulkModal = ({ 
  show, 
  onClose, 
  onUpload, 
  uploading, 
  result, 
  onDownloadTemplate 
}) => {
  const [file, setFile] = useState(null);
  const [zipFile, setZipFile] = useState(null);

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (file) {
      onUpload(file, zipFile);
    }
  };

  return (
    <div className="fixed inset-0 bg-emerald-900/20 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fadeIn">
      <div className="bg-white rounded-[48px] p-10 w-full max-w-2xl shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        {uploading && (
          <div className="absolute top-0 left-0 h-1.5 bg-emerald-500 animate-pulse w-full"></div>
        )}

        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-3xl font-black text-emerald-900 tracking-tight">Bulk Student Upload</h3>
            <p className="text-gray-500 font-bold text-sm mt-1">Import multiple student records via Excel.</p>
          </div>
          <button
            onClick={onClose}
            className="p-4 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-3xl transition-all"
          >
            <X size={32} />
          </button>
        </div>

        <div className="space-y-8">
          {/* Template Download */}
          <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                <FileSpreadsheet size={24} />
              </div>
              <div>
                <p className="font-black text-blue-900 text-sm">Need a template?</p>
                <p className="text-xs text-blue-600 font-bold">Download our pre-formatted Excel file.</p>
              </div>
            </div>
            <button
              onClick={onDownloadTemplate}
              className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              Download Template
            </button>
          </div>

          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group relative">
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="hidden"
                    id="bulk-file-input"
                  />
                  <label
                    htmlFor="bulk-file-input"
                    className={`flex flex-col items-center justify-center w-full py-10 border-4 border-dashed rounded-[32px] cursor-pointer transition-all ${file ? "border-emerald-200 bg-emerald-50" : "border-gray-100 bg-gray-50/50 hover:border-blue-200 hover:bg-blue-50/30"}`}
                  >
                    <FileSpreadsheet size={40} className={`mb-3 ${file ? "text-emerald-500" : "text-gray-300 group-hover:text-blue-400"}`} />
                    <p className={`font-black uppercase tracking-[0.15em] text-[10px] text-center px-4 ${file ? "text-emerald-600" : "text-gray-400 group-hover:text-blue-900/40"}`}>
                      {file ? file.name : "1. SELECT STUDENT EXCEL"}
                    </p>
                  </label>
                </div>

                <div className="group relative">
                  <input
                    type="file"
                    accept=".zip"
                    onChange={(e) => setZipFile(e.target.files[0])}
                    className="hidden"
                    id="bulk-zip-input"
                  />
                  <label
                    htmlFor="bulk-zip-input"
                    className={`flex flex-col items-center justify-center w-full py-10 border-4 border-dashed rounded-[32px] cursor-pointer transition-all ${zipFile ? "border-blue-200 bg-blue-50" : "border-gray-100 bg-gray-50/50 hover:border-blue-200 hover:bg-blue-50/30"}`}
                  >
                    <Upload size={40} className={`mb-3 ${zipFile ? "text-blue-500" : "text-gray-300 group-hover:text-blue-400"}`} />
                    <p className={`font-black uppercase tracking-[0.15em] text-[10px] text-center px-4 ${zipFile ? "text-blue-600" : "text-gray-400 group-hover:text-blue-900/40"}`}>
                      {zipFile ? zipFile.name : "2. SELECT PHOTOS ZIP (OPTIONAL)"}
                    </p>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={!file || uploading}
                className={`w-full py-6 rounded-[32px] font-black text-lg transition-all flex items-center justify-center gap-3 ${!file || uploading ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xl shadow-emerald-200 active:scale-[0.98]"}`}
              >
                {uploading ? "Processing Records..." : "Proceed with Import"}
              </button>
            </form>
          ) : (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-8 bg-emerald-50 rounded-[32px] border border-emerald-100 text-center">
                  <p className="text-4xl font-black text-emerald-600 mb-2">{result.created}</p>
                  <p className="text-xs font-black text-emerald-900/40 uppercase tracking-widest">New Students</p>
                </div>
                <div className="p-8 bg-blue-50 rounded-[32px] border border-blue-100 text-center">
                  <p className="text-4xl font-black text-blue-600 mb-2">{result.updated}</p>
                  <p className="text-xs font-black text-blue-900/40 uppercase tracking-widest">Profiles Updated</p>
                </div>
              </div>

              {result.errors?.length > 0 && (
                <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                  <p className="text-amber-600 font-black text-sm uppercase tracking-widest mb-4">Issues Found ({result.errors.length})</p>
                  <div className="max-h-40 overflow-y-auto space-y-2 custom-scrollbar">
                    {result.errors.map((err, idx) => (
                      <div key={idx} className="flex justify-between text-xs p-3 bg-white rounded-xl border border-amber-100/50">
                        <span className="font-mono text-gray-400">{err.rollNo}</span>
                        <span className="font-bold text-amber-700">{err.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-6 bg-emerald-900 text-white rounded-[32px] font-black hover:bg-[#003B73] transition-all flex items-center justify-center gap-3"
              >
                <CheckCircle2 size={24} /> Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentBulkModal;
