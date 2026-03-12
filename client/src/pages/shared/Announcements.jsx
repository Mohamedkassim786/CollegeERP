import CustomSelect from "../../components/CustomSelect";
import { useState, useEffect } from "react";
import {
  Bell,
  Plus,
  Trash2,
  Filter,
  Megaphone,
  Calendar,
  User,
} from "lucide-react";
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from "../../services/announcement.service";
import toast from "react-hot-toast";

const Announcements = ({ role }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "GENERAL",
    department: "",
    year: "",
    semester: "",
    section: "",
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await getAnnouncements();
      setAnnouncements(res.data);
    } catch (err) {
      toast.error("Failed to fetch announcements");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createAnnouncement(formData);
      toast.success("Announcement posted successfully");
      setShowForm(false);
      setFormData({
        title: "",
        content: "",
        category: "GENERAL",
        department: "",
        year: "",
        semester: "",
        section: "",
      });
      fetchAnnouncements();
    } catch (err) {
      toast.error("Failed to post announcement");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?"))
      return;
    try {
      await deleteAnnouncement(id);
      toast.success("Announcement deleted");
      fetchAnnouncements();
    } catch (err) {
      toast.error("Failed to delete announcement");
    }
  };

  const categories = ["GENERAL", "EXAM", "ACADEMIC", "EVENT", "HOLIDAY"];

  return (
    <div className="p-8 pb-24">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#003B73] flex items-center gap-3">
            <Bell className="text-blue-600" size={32} />
            Announcements
          </h1>
          <p className="text-gray-500 mt-1 font-medium italic">
            Stay updated with latest college notifications
          </p>
        </div>
        {(role === "ADMIN" || role === "FACULTY") && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-[#003B73] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#002850] transition-all shadow-lg hover:scale-105 active:scale-95"
          >
            <Plus size={20} />
            {showForm ? "Cancel" : "New Announcement"}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-2xl shadow-2xl border border-blue-50 mb-8 animate-slideDown max-w-2xl">
          <h2 className="text-xl font-bold text-[#003B73] mb-6 flex items-center gap-2 border-b pb-4">
            <Megaphone className="text-blue-500" /> Post New Announcement
          </h2>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Category
                </label>
                <CustomSelect
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none "
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </CustomSelect>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Department (Optional)
                </label>
                <input
                  type="text"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  placeholder="e.g. CSE"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Content
              </label>
              <textarea
                required
                rows="4"
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
              />
            </div>
            <button className="w-full bg-[#003B73] text-white py-4 rounded-xl font-bold hover:bg-[#002850] transition-all shadow-xl">
              Post Announcement
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-blue-600">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="font-bold">Loading updates...</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {announcements.length > 0 ? (
            announcements.map((ann, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group animate-fadeIn"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl bg-blue-50 text-blue-600`}>
                      <Bell size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#003B73] transition-colors">
                          {ann.title}
                        </h3>
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                          {ann.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />{" "}
                          {new Date(ann.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <User size={12} /> {ann.author?.fullName} (
                          {ann.author?.role})
                        </span>
                      </div>
                    </div>
                  </div>
                  {(role === "ADMIN" || ann.postedBy === ann.postedBy) && ( // Author check logic to be refined if needed
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                <p className="text-gray-600 leading-relaxed font-sans">
                  {ann.content}
                </p>
                {ann.department && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Target:
                    </span>
                    <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      {ann.department}
                    </span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-3xl p-16 text-center shadow-inner border border-dashed border-gray-200">
              <Bell size={64} className="mx-auto text-gray-200 mb-4" />
              <p className="text-xl font-bold text-gray-400">
                No announcements yet
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Announcements;
