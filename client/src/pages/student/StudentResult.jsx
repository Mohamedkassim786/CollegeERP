import React, { useState, useEffect } from 'react';
import { Award, BookOpen, AlertCircle, FileText, Download } from 'lucide-react';
import { getIndividualStudentResults } from '../../services/results.service';

const StudentResult = () => {
    const [data, setData] = useState({ results: [], isPublished: false, gpa: 0, cgpa: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        getIndividualStudentResults()
            .then(res => setData(res.data))
            .catch(err => setError(err.response?.data?.message || 'Failed to fetch results.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#003B73] border-t-transparent rounded-full animate-spin" /></div>;

    if (!data.isPublished) {
        return (
            <div className="max-w-4xl mx-auto mt-20 text-center space-y-4 animate-fadeIn">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle size={40} className="text-amber-500" />
                </div>
                <h1 className="text-2xl font-black text-gray-800">Results Not Published</h1>
                <p className="text-gray-500 max-w-md mx-auto">{data.message || 'The results for your current semester have not been released by the Admin yet.'}</p>
            </div>
        );
    }

    return (
        <div className="w-full px-4 md:px-8 space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#003B73] flex items-center gap-3">
                        <Award size={32} /> Semester {data.semester} Results
                    </h1>
                    <p className="text-gray-500 font-medium">
                        {data.publishedAt ? `Published on: ${new Date(data.publishedAt).toLocaleDateString()}` : 'Results Published'}
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">GPA</span>
                        <span className="text-2xl font-black text-blue-600">{data.gpa || '0.00'}</span>
                    </div>
                    <div className="bg-[#003B73] px-6 py-3 rounded-2xl shadow-lg border border-[#002850] flex flex-col items-center text-white">
                        <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest">CGPA</span>
                        <span className="text-2xl font-black">{data.cgpa || '0.00'}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Code</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Subject Name</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider text-center">Grade</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider text-center">Result</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.results.map((res, i) => (
                                <tr key={i} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-5 font-mono text-sm font-black text-[#003B73] tracking-tight uppercase">
                                        {res.subjectCode}
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="font-bold text-gray-900 group-hover:text-[#003B73] transition-colors">{res.subjectName}</span>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className={`inline-block px-3 py-1 rounded-lg text-sm font-black ${
                                            res.grade === 'O' ? 'bg-purple-50 text-purple-700' :
                                            res.grade === 'A+' ? 'bg-blue-50 text-blue-700' :
                                            res.grade === 'A' ? 'bg-emerald-50 text-emerald-700' :
                                            res.grade === 'U' || res.grade === 'W' || res.grade === 'UA' ? 'bg-red-50 text-red-700' :
                                            'bg-gray-50 text-gray-700'
                                        }`}>
                                            {res.grade === 'RA' ? 'U' : (res.grade === 'AB' ? 'UA' : res.grade)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className={`text-xs font-black uppercase tracking-widest ${res.result === 'PASS' ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {res.result}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-[#003B73]">
                    <FileText size={20} />
                </div>
                <div>
                    <h4 className="font-black text-[#003B73]">Note to Student</h4>
                    <p className="text-sm text-blue-700 mt-1">These are provisional results. Official mark sheets will be issued by the college office. For any discrepancies, please contact the Admin within 7 days.</p>
                </div>
            </div>
        </div>
    );
};

export default StudentResult;
