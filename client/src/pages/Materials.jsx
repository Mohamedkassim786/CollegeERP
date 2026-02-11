import { useState, useEffect } from 'react';
import { Book, Plus, Trash2, FileText, Download, ExternalLink, Filter, BookOpen } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const Materials = ({ role }) => {
    const [materials, setMaterials] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        fileUrl: '',
        subjectId: ''
    });

    useEffect(() => {
        fetchSubjects();
        fetchMaterials();
    }, []);

    const fetchSubjects = async () => {
        try {
            // Fetch subjects assigned to faculty or all subjects if admin
            const endpoint = role === 'ADMIN' ? '/admin/subjects' : '/faculty/assignments';
            const res = await api.get(endpoint);
            // Handle different data structures from endpoints
            const list = role === 'ADMIN' ? res.data : res.data.map(a => a.subject);
            setSubjects(list);
        } catch (err) {
            toast.error('Failed to fetch subjects');
        }
    };

    const fetchMaterials = async () => {
        try {
            const endpoint = selectedSubject ? `/materials?subjectId=${selectedSubject}` : '/materials';
            const res = await api.get(endpoint);
            setMaterials(res.data);
        } catch (err) {
            toast.error('Failed to fetch materials');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaterials();
    }, [selectedSubject]);

    const handleUpload = async (e) => {
        e.preventDefault();
        try {
            await api.post('/materials', formData);
            toast.success('Material uploaded successfully');
            setShowForm(false);
            setFormData({ title: '', description: '', fileUrl: '', subjectId: '' });
            fetchMaterials();
        } catch (err) {
            toast.error('Failed to upload material');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this material?')) return;
        try {
            await api.delete(`/materials/${id}`);
            toast.success('Material removed');
            fetchMaterials();
        } catch (err) {
            toast.error('Failed to remove material');
        }
    };

    return (
        <div className="p-8 pb-24">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-[#003B73] flex items-center gap-3">
                        <Book className="text-[#003B73]" size={32} />
                        Study Materials
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium font-sans">Access and manage academic resources</p>
                </div>
                {role === 'FACULTY' && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-[#003B73] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#002850] transition-all shadow-lg"
                    >
                        <Plus size={20} />
                        {showForm ? 'Cancel' : 'Upload Material'}
                    </button>
                )}
            </div>

            <div className="flex items-center gap-4 mb-8 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <Filter size={18} className="text-[#003B73]" />
                <span className="text-sm font-bold text-[#003B73] uppercase tracking-wider">Filter by Subject:</span>
                <select
                    className="p-2 rounded-lg border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-gray-700"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                >
                    <option value="">All Subjects</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
                </select>
            </div>

            {showForm && (
                <div className="bg-white p-8 rounded-2xl shadow-2xl border border-blue-50 mb-8 animate-slideDown max-w-xl">
                    <h2 className="text-xl font-bold text-[#003B73] mb-6 flex items-center gap-2 border-b pb-4">
                        <FileText className="text-blue-500" /> New Study Material
                    </h2>
                    <form onSubmit={handleUpload} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Subject</label>
                            <select
                                required
                                className="w-full p-3 rounded-xl border border-gray-200"
                                value={formData.subjectId}
                                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                            >
                                <option value="">Select Subject</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                            <input
                                type="text"
                                required
                                className="w-full p-3 rounded-xl border border-gray-200"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g. Unit 1 Notes"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                            <textarea
                                className="w-full p-3 rounded-xl border border-gray-200"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows="3"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">File URL / Drive Link</label>
                            <input
                                type="url"
                                required
                                className="w-full p-3 rounded-xl border border-gray-200 font-mono text-sm"
                                value={formData.fileUrl}
                                onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                                placeholder="https://drive.google.com/..."
                            />
                        </div>
                        <button className="w-full bg-[#003B73] text-white py-4 rounded-xl font-bold hover:bg-[#002850] transition-all shadow-xl">
                            Share Material
                        </button>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 text-blue-600">
                    <div className="animate-pulse flex space-x-4">
                        <div className="rounded-full bg-blue-100 h-10 w-10"></div>
                        <div className="flex-1 space-y-6 py-1">
                            <div className="h-2 bg-blue-100 rounded"></div>
                            <div className="space-y-3">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="h-2 bg-blue-100 rounded col-span-2"></div>
                                    <div className="h-2 bg-blue-100 rounded col-span-1"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {materials.length > 0 ? (
                        materials.map((mat, idx) => (
                            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-all duration-300 animate-fadeIn" style={{ animationDelay: `${idx * 100}ms` }}>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-[#003B73] group-hover:text-white transition-colors">
                                            <FileText size={24} />
                                        </div>
                                        {role === 'FACULTY' && (
                                            <button onClick={() => handleDelete(mat.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                    <h3 className="font-black text-[#003B73] text-lg mb-1 group-hover:translate-x-1 transition-transform">{mat.title}</h3>
                                    <p className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-1">
                                        <BookOpen size={12} /> {mat.subject?.code} • {mat.subject?.name}
                                    </p>
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-4 font-sans">{mat.description || 'No description provided.'}</p>

                                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Added by {mat.instructor?.fullName}</span>
                                        {mat.fileUrl && (
                                            <a
                                                href={mat.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-[#003B73] hover:text-white transition-all shadow-sm"
                                            >
                                                <ExternalLink size={14} /> Open Link
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-24 text-center">
                            <BookOpen size={64} className="mx-auto text-gray-200 mb-4" />
                            <p className="text-xl font-bold text-gray-400">No materials found</p>
                            <p className="text-gray-400 text-sm mt-1">Try selecting a different subject or all subjects.</p>
                        </div>
                    )
                    }
                </div>
            )}
        </div>
    );
};

export default Materials;
