import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { FileUp, Clock, CheckCircle, ExternalLink, X, Send } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const ExternalDashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);
    const [submissionForm, setSubmissionForm] = useState({
        questionPaperUrl: '',
        remarks: ''
    });

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await api.get('/external/tasks');
            setTasks(res.data);
        } catch (err) {
            toast.error('Failed to fetch assigned tasks');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmission = async (e) => {
        e.preventDefault();
        try {
            await api.post('/external/submit-paper', {
                taskId: selectedTask.id,
                ...submissionForm
            });
            toast.success('Question paper submitted successfully');
            setSelectedTask(null);
            setSubmissionForm({ questionPaperUrl: '', remarks: '' });
            fetchTasks();
        } catch (err) {
            toast.error('Failed to submit question paper');
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar role="EXTERNAL_STAFF" />
            <div className="flex-1 flex flex-col ml-64 transition-all duration-300">
                <Header title="External Staff Portal" />
                <main className="flex-1 p-8 mt-24 overflow-y-auto animate-fadeIn">
                    <div className="mb-8">
                        <h1 className="text-3xl font-black text-[#003B73]">Assigned Question Papers</h1>
                        <p className="text-gray-500 font-medium">Manage your question paper setting assignments</p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003B73]"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tasks.length > 0 ? (
                                tasks.map((task) => (
                                    <div key={task.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-3 rounded-xl ${task.status === 'SUBMITTED' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                                <FileUp size={24} />
                                            </div>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${task.status === 'SUBMITTED' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {task.status}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-[#003B73] mb-1">{task.subject?.name}</h3>
                                        <p className="text-xs text-gray-500 mb-4 flex items-center gap-2 font-medium">
                                            <Clock size={14} /> Deadline: {new Date(task.deadline).toLocaleDateString()}
                                        </p>

                                        {task.status !== 'SUBMITTED' ? (
                                            <button
                                                onClick={() => setSelectedTask(task)}
                                                className="w-full bg-[#003B73] text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#002850] transition-all font-bold shadow-md"
                                            >
                                                <FileUp size={18} /> Upload Question Paper
                                            </button>
                                        ) : (
                                            <div className="space-y-2">
                                                <a
                                                    href={task.questionPaperUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all font-bold"
                                                >
                                                    <ExternalLink size={18} /> View Submission
                                                </a>
                                                <p className="text-[10px] text-gray-400 font-medium italic">Submitted on: {new Date(task.updatedAt).toLocaleDateString()}</p>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full bg-white p-12 rounded-3xl text-center border-2 border-dashed border-gray-100">
                                    <FileUp size={48} className="mx-auto text-gray-200 mb-4" />
                                    <p className="text-lg font-bold text-gray-400">No tasks assigned to you yet</p>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Submission Modal */}
            {selectedTask && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slideUp">
                        <div className="p-6 bg-[#003B73] text-white flex justify-between items-center">
                            <h2 className="text-xl font-bold">Submit Question Paper</h2>
                            <button onClick={() => setSelectedTask(null)} className="hover:bg-white/10 p-1 rounded-lg transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Subject</p>
                                <p className="font-bold text-[#003B73]">{selectedTask.subject?.name}</p>
                            </div>
                            <form onSubmit={handleSubmission} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Question Paper Link (Google Drive/OneDrive)</label>
                                    <input
                                        type="url"
                                        required
                                        placeholder="https://drive.google.com/..."
                                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#003B73] outline-none font-mono text-sm"
                                        value={submissionForm.questionPaperUrl}
                                        onChange={(e) => setSubmissionForm({ ...submissionForm, questionPaperUrl: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Remarks (Optional)</label>
                                    <textarea
                                        rows="3"
                                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#003B73] outline-none"
                                        value={submissionForm.remarks}
                                        onChange={(e) => setSubmissionForm({ ...submissionForm, remarks: e.target.value })}
                                    />
                                </div>
                                <button className="w-full bg-[#003B73] text-white py-4 rounded-xl font-bold hover:bg-[#002850] transition-all shadow-xl flex items-center justify-center gap-2">
                                    <Send size={18} /> Confirm Submission
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExternalDashboard;
