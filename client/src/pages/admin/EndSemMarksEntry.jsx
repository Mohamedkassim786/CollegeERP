import React, { useState, useEffect } from 'react';
import { Award, Save, RefreshCw, Filter, FileSpreadsheet, Upload, Download, CheckCircle, AlertCircle, X } from 'lucide-react';
import api from '../../api/axios';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import toast from 'react-hot-toast';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const EndSemMarksEntry = () => {
    const [filters, setFilters] = useState({
        department: '',
        year: '',
        semester: '',
        section: '',
        subjectId: ''
    });

    const [subjects, setSubjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [departments, setDepartments] = useState([]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const deptsRes = await api.get('/admin/departments');
            setDepartments(deptsRes.data);
            const subsRes = await api.get('/admin/subjects');
            setSubjects(subsRes.data);
        } catch (error) {
            toast.error('Failed to load initial data');
        }
    };

    const handleSearch = async () => {
        if (!filters.department || !filters.year || !filters.semester || !filters.section || !filters.subjectId) {
            toast.error('Please fill all filters');
            return;
        }

        setLoading(true);
        try {
            const res = await api.get('/exam/end-sem-marks', { params: filters });
            setStudents(res.data);
        } catch (error) {
            toast.error('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkChange = (studentId, value) => {
        const numVal = parseInt(value);
        if (value !== '' && (isNaN(numVal) || numVal < 0 || numVal > 100)) return;

        setStudents(prev => prev.map(s => {
            if (s.id !== studentId) return s;
            const updatedMarks = [...s.marks];
            const markIndex = updatedMarks.findIndex(m => m.subjectId === parseInt(filters.subjectId));

            if (markIndex > -1) {
                updatedMarks[markIndex] = {
                    ...updatedMarks[markIndex],
                    endSemMarks: {
                        ...(updatedMarks[markIndex].endSemMarks || {}),
                        externalMarks: value === '' ? null : numVal
                    }
                };
            }
            return { ...s, marks: updatedMarks };
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const marksData = students.map(s => {
                const mark = s.marks.find(m => m.subjectId === parseInt(filters.subjectId));
                return {
                    studentId: s.id,
                    externalMarks: mark?.endSemMarks?.externalMarks || 0
                };
            });

            await api.post('/exam/end-sem-marks', {
                marksData,
                subjectId: filters.subjectId,
                semester: filters.semester
            });
            toast.success('Marks updated successfully');
            handleSearch();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error saving marks');
        } finally {
            setSaving(false);
        }
    };

    const exportTemplate = async () => {
        if (students.length === 0) {
            toast.error('Search for students first to get the template data.');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('End Sem Marks');

        worksheet.columns = [
            { header: 'Student ID', key: 'id', width: 10 },
            { header: 'Register Number', key: 'regNo', width: 20 },
            { header: 'Name', key: 'name', width: 30 },
            { header: 'Internal Marks', key: 'internal', width: 15 },
            { header: 'External Marks (Max 100)', key: 'external', width: 25 },
        ];

        students.forEach(s => {
            const mark = s.marks.find(m => m.subjectId === parseInt(filters.subjectId));
            worksheet.addRow({
                id: s.id,
                regNo: s.registerNumber,
                name: s.name,
                internal: mark?.internal || 0,
                external: mark?.endSemMarks?.externalMarks || ''
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `End_Sem_Template_${filters.section}.xlsx`);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file);
        const worksheet = workbook.getWorksheet(1);

        const updatedStudents = [...students];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header
            const studentId = row.getCell(1).value;
            const externalMarks = row.getCell(5).value;

            const student = updatedStudents.find(s => s.id === parseInt(studentId));
            if (student) {
                const markIndex = student.marks.findIndex(m => m.subjectId === parseInt(filters.subjectId));
                if (markIndex > -1) {
                    student.marks[markIndex].endSemMarks = {
                        ...(student.marks[markIndex].endSemMarks || {}),
                        externalMarks: parseInt(externalMarks) || 0
                    };
                }
            }
        });

        setStudents(updatedStudents);
        toast.success('Excel data imported. Review and Save.');
        e.target.value = null; // Reset input
    };

    const filteredSubjects = subjects.filter(s => {
        const dept = departments.find(d => d.name === filters.department || d.code === filters.department);
        const deptMatch = s.department === filters.department || (dept && s.department === dept.code);
        return deptMatch && s.semester === parseInt(filters.semester);
    });

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar role="ADMIN" />
            <div className="flex-1 flex flex-col ml-64 transition-all duration-300">
                <Header title="End Semester Marks Management" />
                <main className="flex-1 p-8 mt-24 overflow-y-auto animate-fadeIn">
                    <div className="max-w-6xl mx-auto w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Award className="text-blue-600" /> Administrative Mark Entry
                            </h1>
                            <div className="flex gap-3">
                                <button
                                    onClick={exportTemplate}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 shadow-sm transition-all"
                                >
                                    <Download size={18} /> Export Template
                                </button>
                                <label className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 shadow-sm cursor-pointer transition-all">
                                    <Upload size={18} /> Bulk Upload
                                    <input type="file" className="hidden" accept=".xlsx" onChange={handleFileUpload} />
                                </label>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || students.length === 0}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-md transition-all ${saving || students.length === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                >
                                    <Save size={18} /> {saving ? 'Saving...' : 'Save All Marks'}
                                </button>
                            </div>
                        </div>

                        {/* Filter Card */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Department</label>
                                    <select
                                        className="w-full p-2 border rounded-lg"
                                        value={filters.department}
                                        onChange={e => setFilters({ ...filters, department: e.target.value })}
                                    >
                                        <option value="">Select...</option>
                                        {departments.map(d => (
                                            <option key={d.id} value={d.name}>
                                                {d.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Semester</label>
                                    <select
                                        className="w-full p-2 border rounded-lg"
                                        value={filters.semester}
                                        onChange={e => {
                                            const sem = parseInt(e.target.value);
                                            const year = Math.ceil(sem / 2);
                                            setFilters({ ...filters, semester: e.target.value, year: year.toString() });
                                        }}
                                    >
                                        <option value="">Select...</option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Section</label>
                                    <select
                                        className="w-full p-2 border rounded-lg"
                                        value={filters.section}
                                        onChange={e => setFilters({ ...filters, section: e.target.value })}
                                    >
                                        <option value="">Select...</option>
                                        {['A', 'B', 'C', 'D'].map(s => <option key={s} value={s}>Section {s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subject</label>
                                    <select
                                        className="w-full p-2 border rounded-lg"
                                        value={filters.subjectId}
                                        onChange={e => setFilters({ ...filters, subjectId: e.target.value })}
                                    >
                                        <option value="">Select...</option>
                                        {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={handleSearch}
                                        className="w-full bg-[#003B73] text-white py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Filter size={18} /> Load Data
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Marks Table */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 h-14">
                                    <tr>
                                        <th className="px-6 py-2 font-semibold text-sm">Register Number</th>
                                        <th className="px-6 py-2 font-semibold text-sm">Student Name</th>
                                        <th className="px-6 py-2 font-semibold text-sm text-center">Internal Marks</th>
                                        <th className="px-6 py-2 font-semibold text-sm text-center">External Marks (Max 100)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                                                <RefreshCw size={32} className="mx-auto animate-spin mb-2" />
                                                <p>Loading students...</p>
                                            </td>
                                        </tr>
                                    ) : students.length === 0 ? (
                                        <tr>
                                            <td className="px-6 py-12 text-center text-gray-400" colSpan="4">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Award size={48} className="text-gray-100" />
                                                    <p>Select Subject to load students</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        students.map(s => {
                                            const mark = s.marks.find(m => m.subjectId === parseInt(filters.subjectId));
                                            return (
                                                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-sm uppercase text-gray-600">{s.registerNumber}</td>
                                                    <td className="px-6 py-4 font-medium text-gray-800">{s.name}</td>
                                                    <td className="px-6 py-4 text-center text-gray-600 font-semibold">{mark?.internal || 0}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <input
                                                            type="number"
                                                            value={mark?.endSemMarks?.externalMarks === null ? '' : mark?.endSemMarks?.externalMarks}
                                                            onChange={(e) => handleMarkChange(s.id, e.target.value)}
                                                            className="w-24 p-2 border rounded-lg text-center font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                                            placeholder="0 - 100"
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default EndSemMarksEntry;
