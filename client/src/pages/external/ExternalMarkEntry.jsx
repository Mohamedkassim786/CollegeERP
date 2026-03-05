import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import {
  ClipboardList,
  Send,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import api from "../../api/axios";
import toast from "react-hot-toast";

const ExternalMarkEntry = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMarks();
  }, [assignmentId]);

  const fetchMarks = async () => {
    try {
      const res = await api.get(`/external/marks/assignment/${assignmentId}`);
      setData(res.data);
      const initialMarks = {};
      res.data.dummyList.forEach((item) => {
        if (item.mark !== null && item.mark !== undefined)
          initialMarks[item.dummyNumber] = item.mark;
      });
      setMarks(initialMarks);
    } catch (err) {
      toast.error("Failed to load dummy numbers");
    } finally {
      setLoading(false);
    }
  };

  // Max mark allowed per category
  const getMaxMark = (category) => {
    if (category === "LAB") return 40;
    if (category === "INTEGRATED") return 50;
    return 100;
  };

  const handleMarkChange = (dummyNumber, value) => {
    if (value === "") {
      setMarks((prev) => ({ ...prev, [dummyNumber]: value }));
      return;
    }
    const intVal = parseInt(value, 10);
    const maxMark = getMaxMark(data?.subjectCategory);
    if (!isNaN(intVal) && intVal >= 0 && intVal <= maxMark) {
      setMarks((prev) => ({ ...prev, [dummyNumber]: intVal }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const marksArray = Object.entries(marks).map(
        ([dummyNumber, rawMark]) => ({
          dummyNumber,
          rawMark: parseInt(rawMark, 10),
        }),
      );
      await api.post("/external/marks/submit", {
        subjectId: data.subjectId,
        marks: marksArray,
      });
      toast.success("Marks submitted successfully");

      // Auto-generate PDF after submission
      try {
        const response = await api.get("/external/marks/statement-pdf", {
          params: { subjectId: data.subjectId },
          responseType: "blob",
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Statement_${data.subjectCode || data.subjectId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (pdfErr) {
        toast.error("Marks submitted, but PDF generation failed");
      }

      fetchMarks();
    } catch (err) {
      toast.error("Failed to submit marks");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003B73]"></div>
      </div>
    );

  const category = data?.subjectCategory || "THEORY";
  const maxMark = getMaxMark(category);
  const isLabOrIntegrated = category === "LAB" || category === "INTEGRATED";

  // Category details for UI
  const categoryInfo = {
    THEORY: { label: "Theory", color: "bg-blue-100 text-blue-700", desc: "Marks out of 100 (converted to 60 externally)" },
    LAB: { label: "Lab", color: "bg-green-100 text-green-700", desc: "External lab marks out of 40" },
    INTEGRATED: { label: "Integrated", color: "bg-purple-100 text-purple-700", desc: "External marks out of 50 (theory + lab combined)" },
  };
  const catInfo = categoryInfo[category] || categoryInfo.THEORY;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role="EXTERNAL_STAFF" />
      <div className="flex-1 flex flex-col ml-64 transition-all duration-300">
        <Header title="Enter External Marks" />
        <main className="flex-1 p-10 mt-24 overflow-y-auto animate-fadeIn">
          <button
            onClick={() => navigate("/external")}
            className="flex items-center gap-2 text-gray-400 hover:text-[#003B73] font-bold mb-8 transition-colors group"
          >
            <ChevronLeft
              size={20}
              className="group-hover:-translate-x-1 transition-transform"
            />{" "}
            Back to Dashboard
          </button>

          <div className="bg-white rounded-[32px] shadow-xl shadow-blue-900/5 overflow-hidden border border-gray-100 mb-10">
            <div className="p-10 bg-[#003B73] text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-blue-200 text-xs font-black uppercase tracking-[0.2em] mb-3">
                    Assessment Entry
                  </p>
                  <h1 className="text-4xl font-black tracking-tight">
                    {data.subject}
                  </h1>
                  <div className="mt-4 flex items-center gap-4 flex-wrap">
                    <span className="bg-white/10 px-4 py-1.5 rounded-full text-sm font-bold border border-white/20 uppercase">
                      {data.subjectCode || `ID: ${data.subjectId}`}
                    </span>
                    <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${catInfo.color}`}>
                      {catInfo.label}
                    </span>
                    <span className="bg-white/10 px-4 py-1.5 rounded-full text-xs font-bold border border-white/20">
                      Max: {maxMark} marks
                    </span>
                  </div>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl border border-white/20 backdrop-blur-md text-center min-w-[140px]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">
                    Submission Limit
                  </p>
                  <p className="text-xl font-black">
                    {new Date(data.deadline).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-10">
              {/* Info banner: identity masking for THEORY, register numbers for LAB/INTEGRATED */}
              <div className={`border rounded-2xl p-6 mb-10 flex items-start gap-4 ${isLabOrIntegrated ? "bg-green-50 border-green-100" : "bg-blue-50 border-blue-100"}`}>
                {isLabOrIntegrated ? (
                  <Eye className="text-green-600 mt-1 shrink-0" size={24} />
                ) : (
                  <EyeOff className="text-blue-600 mt-1 shrink-0" size={24} />
                )}
                <div>
                  <p className={`font-black text-lg ${isLabOrIntegrated ? "text-green-800" : "text-[#003B73]"}`}>
                    {isLabOrIntegrated ? "Register Numbers Visible" : "Identity Masking Active"}
                  </p>
                  <p className={`font-medium text-sm ${isLabOrIntegrated ? "text-green-700/80" : "text-blue-700/70"}`}>
                    {isLabOrIntegrated
                      ? `${catInfo.desc}. Student register numbers are shown for lab/integrated evaluation.`
                      : "You are entering marks for randomized dummy numbers. Student names and register numbers are hidden to ensure unbiased evaluation."}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border border-gray-200 rounded-2xl overflow-hidden mb-6">
                  <table className="w-full text-center border-collapse bg-white">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-xs font-black text-gray-500 uppercase tracking-widest">
                        <th className="p-4 border-r border-gray-200 w-24">
                          Sl.No
                        </th>
                        <th className="p-4 border-r border-gray-200">
                          {isLabOrIntegrated ? "Register Number" : "Dummy Number"}
                        </th>
                        {isLabOrIntegrated && (
                          <th className="p-4 border-r border-gray-200">
                            Name
                          </th>
                        )}
                        <th className="p-4">Marks (out of {maxMark})</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.dummyList.map((item, idx) => (
                        <tr
                          key={item.dummyNumber}
                          className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors"
                        >
                          <td className="p-4 border-r border-gray-100 font-bold text-gray-600">
                            {idx + 1}
                          </td>
                          <td className="p-4 border-r border-gray-100 font-black text-[#003B73] text-lg">
                            {isLabOrIntegrated
                              ? item.registerNumber
                              : item.dummyNumber}
                          </td>
                          {isLabOrIntegrated && (
                            <td className="p-4 border-r border-gray-100 font-medium text-gray-600 text-sm">
                              {item.name}
                            </td>
                          )}
                          <td className="p-4 relative">
                            <div className="flex items-center justify-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max={maxMark}
                                step="1"
                                placeholder="0"
                                className="w-24 p-2 bg-gray-50 rounded-xl border-2 border-transparent focus:border-blue-600 outline-none font-black text-center text-lg text-[#003B73] transition-all"
                                value={marks[item.dummyNumber] ?? ""}
                                onChange={(e) =>
                                  handleMarkChange(
                                    item.dummyNumber,
                                    e.target.value,
                                  )
                                }
                                required
                              />
                              <span className="font-bold text-gray-400">
                                / {maxMark}
                              </span>
                              {marks[item.dummyNumber] !== undefined &&
                                marks[item.dummyNumber] !== "" && (
                                  <div className="absolute right-4 text-green-500">
                                    <CheckCircle2 size={18} />
                                  </div>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {data.dummyList.length === 0 && (
                        <tr>
                          <td
                            colSpan={isLabOrIntegrated ? "4" : "3"}
                            className="p-10 text-gray-400 font-bold"
                          >
                            No students available for this subject.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="pt-8 border-t border-gray-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-10 py-5 rounded-[24px] font-black flex items-center justify-center gap-3 shadow-2xl shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-lg ${submitting ? "bg-gray-400 cursor-not-allowed text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                  >
                    {submitting ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    ) : (
                      <Send size={24} />
                    )}
                    {submitting ? "Submitting..." : "Finalize and Submit Marks"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ExternalMarkEntry;
