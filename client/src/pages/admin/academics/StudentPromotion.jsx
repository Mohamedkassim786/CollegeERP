import CustomSelect from "../../../components/CustomSelect";
import { useState, useEffect } from "react";
import { getStudents, promoteStudents, passOutStudents } from "../../../services/student.service";
import { getDepartments } from "../../../services/department.service";
import {
  GraduationCap,
  Users,
  CheckCircle,
  ChevronRight,
  Search,
  AlertCircle,
  TrendingUp,
  Filter,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

const StudentPromotion = () => {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);

  // Source Filter State
  const [sourceYear, setSourceYear] = useState("1");
  const [sourceDept, setSourceDept] = useState("");
  const [sourceSem, setSourceSem] = useState("1");
  const [sourceSection, setSourceSection] = useState("All");

  // Promotion Config (Target)
  const [promoDept, setPromoDept] = useState("");
  const [promoSection, setPromoSection] = useState("A");
  const [promoYear, setPromoYear] = useState("2");
  const [promoSem, setPromoSem] = useState("3");
  const [isPassOut, setIsPassOut] = useState(false); // when true, execute PASSED OUT instead of promote
  const [passingOut, setPassingOut] = useState(false);

  // First Year Short Code State
  const [firstYearCode] = useState(() => {
    return localStorage.getItem('firstYearCode') || "GEN1";
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Update target defaults ONLY when sourceYear changes
  useEffect(() => {
    const isFirstYear = sourceYear === "1";
    if (isFirstYear) {
      setPromoYear("1");
      setPromoSem("2");
    } else {
      const nextYear = Math.min(parseInt(sourceYear) + 1, 4);
      setPromoYear(nextYear.toString());
      setPromoSem((nextYear * 2 - 1).toString());
    }
    // Auto-suggest Pass Out when Year 4 / Sem 8
    if (sourceYear === "4" && String(sourceSem) === "8") {
      setIsPassOut(true);
    } else {
      setIsPassOut(false);
    }
  }, [sourceYear, sourceSem]);

  useEffect(() => {
    fetchStudents();

    // Match sourceDept to promoDept
    const matchedDept = departments.find(
      (d) => (d.code === sourceDept || d.name === sourceDept),
    );
    if (matchedDept) setPromoDept(matchedDept.code || matchedDept.name);
  }, [sourceYear, sourceDept, sourceSem, sourceSection, departments]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await getStudents();
      const allStudents = Array.isArray(res.data) ? res.data : [];

      const filtered = allStudents.filter((s) => {
        const yearMatch = s.year === parseInt(sourceYear);

        let deptMatch = false;
        if (sourceYear === "1") {
          // For Year 1, we match all students in the common pool
          deptMatch = true;
        } else if (!sourceDept) {
          deptMatch = true;
        } else {
          // Otherwise, match exact department
          deptMatch = s.departmentId === departments.find(d => d.code === sourceDept || d.name === sourceDept)?.id ||
            s.department === sourceDept;
        }

        const sectionMatch = sourceSection === "All" ? true : s.section === sourceSection;
        const statusMatch = s.status === 'ACTIVE' || !s.status; // Only promote active students
        const semMatch = s.currentSemester === parseInt(sourceSem);

        return yearMatch && deptMatch && sectionMatch && semMatch && statusMatch;
      });

      setStudents(filtered);
      setSelectedStudents([]);
    } catch (err) {
      console.error("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await getDepartments();
      setDepartments(res.data);
    } catch (err) {
      console.error("Failed to fetch departments");
    }
  };

  const handleSelectStudent = (id) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter((sid) => sid !== id));
    } else {
      setSelectedStudents([...selectedStudents, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map((s) => s.id));
    }
  };

  const handlePromote = async () => {
    if (selectedStudents.length === 0)
      return toast.error("Select students to promote");

    // PASSED OUT branch
    if (isPassOut) {
      if (!window.confirm(`Mark ${selectedStudents.length} students as PASSED OUT?`)) return;
      setPassingOut(true);
      try {
        const batchVal = students.find(s => selectedStudents.includes(s.id))?.batch || '';
        const res = await passOutStudents({ studentIds: selectedStudents, batch: batchVal });
        toast.success(res.data.message);
        setSelectedStudents([]);
        fetchStudents();
      } catch (err) {
        toast.error("Pass-out failed: " + (err.response?.data?.message || err.message));
      } finally {
        setPassingOut(false);
      }
      return;
    }

    if (parseInt(promoYear) > 1 && !promoDept)
      return toast.error("Select target department");

    if (
      !window.confirm(
        `Promote ${selectedStudents.length} students to ${promoDept || "General"} Year ${promoYear}?`,
      )
    )
      return;

    try {
      const res = await promoteStudents({
        studentIds: selectedStudents,
        department: promoDept || null,
        section: promoSection,
        year: promoYear,
        semester: promoSem,
      });
      toast.success(res.data.message);
      setSelectedStudents([]);
      fetchStudents();
    } catch (err) {
      toast.error(
        "Promotion failed: " + (err.response?.data?.message || err.message),
      );
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.registerNumber &&
        s.registerNumber.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <div className="flex flex-col animate-fadeIn">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 px-2">
        <div>
          <h1 className="text-4xl font-black text-[#003B73] tracking-tight flex items-center gap-3">
            Academic Advancement
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Strategic promotion management and departmental cadet allocation.
          </p>
        </div>
      </div>

      {/* Global Intelligence Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 animate-fadeInUp">
        <div className="bg-white p-8 rounded-[40px] shadow-xl border border-gray-100 flex items-center justify-between group hover:shadow-2xl transition-all duration-500">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">
              Source Cadets
            </p>
            <p className="text-4xl font-black text-[#003B73]">
              {students.length}
            </p>
          </div>
          <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-[#003B73] group-hover:scale-110 transition-transform">
            <Users size={32} />
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-xl border border-gray-100 flex items-center justify-between group hover:shadow-2xl transition-all duration-500">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">
              Selected for Advancement
            </p>
            <p className="text-4xl font-black text-amber-500">
              {selectedStudents.length}
            </p>
          </div>
          <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
            <CheckCircle size={32} />
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-xl border border-gray-100 flex items-center justify-between group hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">
              Promotion Readiness
            </p>
            <p className="text-4xl font-black text-emerald-600">
              {students.length > 0
                ? Math.round((selectedStudents.length / students.length) * 100)
                : 0}
              %
            </p>
          </div>
          <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform relative z-10">
            <TrendingUp size={32} />
          </div>
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mb-16 blur-2xl"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 pb-20">
        {/* Strategic Source Control */}
        <div className="xl:col-span-1 flex flex-col gap-8">
          <div className="bg-white p-10 rounded-[40px] shadow-xl border border-gray-100 relative group">
            <div className="absolute inset-0 rounded-[40px] pointer-events-none">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#003B73]/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-[#003B73]/10 transition-colors"></div>
            </div>
            <div className="flex items-center gap-4 mb-10 relative z-10">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-[#003B73] border border-gray-100 shadow-sm">
                <Filter size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#003B73] tracking-tight uppercase">
                  Base Filters
                </h3>
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                  Select Source Pool
                </p>
              </div>
            </div>

            <div className="space-y-8 relative z-10">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 mb-3 block">
                  Current Academic Year
                </label>
                <CustomSelect
                  className="w-full"
                  value={sourceYear}
                  onChange={(e) => setSourceYear(e.target.value)}
                >
                  {["1", "2", "3", "4"].map((y) => (
                    <option key={y} value={y}>
                      Year {y}
                    </option>
                  ))}
                </CustomSelect>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 mb-3 block">
                  Source Department
                </label>
                <CustomSelect
                  className="w-full"
                  value={sourceDept}
                  onChange={(e) => setSourceDept(e.target.value)}
                >
                  {String(sourceYear) === "1" ? (
                    <option value="GEN">{firstYearCode} (First Year)</option>
                  ) : (
                    <>
                      <option value="">-- ALL DEPTS --</option>
                      {departments
                        .filter((d) => {
                          const isGen = d.code === "GEN" || d.code === "GEN1" || d.name?.toLowerCase() === "first year";
                          return !isGen;
                        })
                        .map((d) => (
                          <option key={d.id} value={d.code || d.name}>
                            {d.code || d.name}
                          </option>
                        ))}
                    </>
                  )}
                </CustomSelect>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 mb-3 block">
                  Source Semester
                </label>
                <CustomSelect
                  className="w-full"
                  value={sourceSem}
                  onChange={(e) => setSourceSem(e.target.value)}
                >
                  {[
                    (parseInt(sourceYear) * 2 - 1).toString(),
                    (parseInt(sourceYear) * 2).toString(),
                  ].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </CustomSelect>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 mb-3 block">
                  Source Section
                </label>
                <CustomSelect
                  className="w-full"
                  value={sourceSection}
                  onChange={(e) => setSourceSection(e.target.value)}
                >
                  <option value="All">All Sections</option>
                  {(
                    departments
                      .find(
                        (d) =>
                          (d.code || d.name) ===
                          (String(sourceYear) === "1"
                            ? departments.find(d => d.name?.toLowerCase() === "first year" || d.code === "GEN")?.code || "GEN"
                            : sourceDept),
                      )
                      ?.sections?.split(",") || ["A", "B", "C"]
                  ).map((s) => (
                    <option key={s} value={s}>
                      Section {s}
                    </option>
                  ))}
                </CustomSelect>
              </div>
            </div>
          </div>

          <div className="bg-[#003B73] p-10 rounded-[40px] shadow-2xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/10 transition-colors duration-1000"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2 relative z-10">
              Advancement Status
            </p>
            <div className="flex justify-between items-end relative z-10">
              <div>
                <p className="text-5xl font-black">{selectedStudents.length}</p>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-1">
                  Ready for Promotion
                </p>
              </div>
              <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-white backdrop-blur-md border border-white/10">
                <GraduationCap size={32} />
              </div>
            </div>
          </div>
        </div>

        {/* Cadet Selection Repository */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-[40px] shadow-xl border border-gray-100 h-full flex flex-col overflow-hidden relative group/table">
            <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/20 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#003B73] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
                  <Users size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#003B73] tracking-tight uppercase">
                    Cadet Repository
                  </h3>
                  <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                    Select Advancement Candidates
                  </p>
                </div>
              </div>
              <button
                onClick={handleSelectAll}
                className="text-[10px] font-black text-[#003B73] uppercase tracking-widest hover:bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100 transition-all flex items-center gap-2 group/btn"
              >
                <CheckCircle
                  size={14}
                  className="group-hover/btn:scale-110 transition-transform"
                />
                {selectedStudents.length === filteredStudents.length
                  ? "Reset All"
                  : "Omni Select"}
              </button>
            </div>

            <div className="p-8 bg-white border-b border-gray-50 relative z-10">
              <div className="relative group/search">
                <Search
                  className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/search:text-[#003B73] transition-colors"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="IDENTIFY BY NAME, ROLL NO OR REGISTER ID..."
                  className="w-full pl-16 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-[#003B73] rounded-[24px] font-black text-gray-800 outline-none transition-all placeholder:text-gray-300 placeholder:font-black placeholder:text-[10px] placeholder:tracking-widest"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[600px] px-8 pb-8 relative z-10">
              <table className="w-full text-center border-separate border-spacing-y-3">
                <thead className="bg-white sticky top-0 z-20">
                  <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    <th className="px-6 py-4 w-20">
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={
                            selectedStudents.length > 0 &&
                            selectedStudents.length === filteredStudents.length
                          }
                          onChange={handleSelectAll}
                          className="w-6 h-6 rounded-xl border-2 border-gray-200 text-[#003B73] focus:ring-[#003B73] cursor-pointer accent-[#003B73]"
                        />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left">Cadet Profile</th>
                    <th className="px-6 py-4">Metrics</th>
                    <th className="px-6 py-4 text-right">Cadence</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="p-32 text-center">
                        <div className="w-12 h-12 border-4 border-gray-100 border-t-[#003B73] rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="font-black text-gray-400 uppercase tracking-widest text-[10px]">
                          Scanning Databases...
                        </p>
                      </td>
                    </tr>
                  ) : filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <tr
                        key={student.id}
                        className={`group/row transition-all duration-300 cursor-pointer ${!student.registerNumber ? "bg-red-50/30 grayscale-[0.5]" : selectedStudents.includes(student.id) ? "bg-blue-50/50" : "hover:bg-gray-50"}`}
                        onClick={() => {
                          if (!student.registerNumber) {
                            return alert(
                              "This student cannot be promoted yet. Register Number is required.",
                            );
                          }
                          handleSelectStudent(student.id);
                        }}
                      >
                        <td className="px-6 py-6 rounded-l-[24px] border-y border-l border-transparent group-hover/row:border-gray-100">
                          <div className="flex justify-center">
                            {student.registerNumber ? (
                              <input
                                type="checkbox"
                                checked={selectedStudents.includes(student.id)}
                                onChange={() => { }}
                                className="w-6 h-6 rounded-xl border-2 border-gray-200 text-[#003B73] focus:ring-[#003B73] pointer-events-none accent-[#003B73]"
                              />
                            ) : (
                              <AlertCircle size={20} className="text-red-400" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-6 text-left border-y border-transparent group-hover/row:border-gray-100">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-[#003B73] font-black text-sm group-hover/row:scale-110 transition-transform flex-shrink-0">
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-gray-800 group-hover/row:text-[#003B73] transition-colors">
                                {student.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 font-mono font-black text-[10px] tracking-tighter uppercase">
                                <span className="text-[#003B73]">
                                  {student.rollNo}
                                </span>
                                {student.registerNumber ? (
                                  <span className="text-gray-400">
                                    | {student.registerNumber}
                                  </span>
                                ) : (
                                  <span className="text-red-500 bg-red-50 px-2 rounded">
                                    MISSING REG NO
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 border-y border-transparent group-hover/row:border-gray-100">
                          <div className="inline-flex flex-col items-center">
                            <span className="text-[10px] font-black text-[#003B73] uppercase tracking-widest leading-none mb-1">
                              Year {student.year}
                            </span>
                            <span className="text-[9px] bg-white border border-gray-100 text-gray-400 px-3 py-1 rounded-full font-black uppercase tracking-tighter shadow-sm">
                              SEC {student.section}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-6 rounded-r-[24px] text-right border-y border-r border-transparent group-hover/row:border-gray-100">
                          {selectedStudents.includes(student.id) ? (
                            <span className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-[9px] font-black tracking-[0.1em] shadow-lg shadow-emerald-500/20 uppercase">
                              Queued
                            </span>
                          ) : (
                            <ChevronRight
                              className="inline text-gray-100 group-hover/row:text-[#003B73] transition-all transform group-hover/row:translate-x-1"
                              size={24}
                            />
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className="p-32 text-center text-gray-400 italic"
                      >
                        <Users
                          size={64}
                          className="mx-auto mb-6 text-gray-100"
                        />
                        <p className="font-black text-xl text-gray-300 uppercase tracking-widest">
                          No Cadets Found
                        </p>
                        <p className="font-bold mt-2 text-xs uppercase tracking-tighter">
                          Adjust source filters to populate pool
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Tactical Advancement Config */}
        <div className="xl:col-span-1">
          <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-gray-100 relative group/target sticky top-8">
            <div className="absolute inset-0 rounded-[40px] pointer-events-none">
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl group-hover/target:bg-emerald-500/10 transition-colors duration-1000"></div>
            </div>
            <div className="flex items-center gap-4 mb-10 relative z-10">
              <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-900/20">
                <TrendingUp size={28} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-black text-emerald-900 tracking-tight uppercase leading-tight">
                  Strategic
                  <br />
                  Target
                </h3>
                <p className="text-emerald-600/60 font-black text-[10px] uppercase tracking-widest mt-1">
                  Optimization
                </p>
              </div>
            </div>

            <div className="space-y-8 relative z-10">
              <div className="bg-emerald-50/50 p-6 rounded-[32px] border border-emerald-100/50 flex items-center gap-4 mb-2">
                <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-md shadow-emerald-900/20">
                  <ArrowRight size={20} strokeWidth={3} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] leading-none mb-1">
                    Target Phase
                  </p>
                  <p className="text-xs font-black text-emerald-900 uppercase">
                    Operational Level
                  </p>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 mb-3 block">
                  Deployment Dept
                </label>
                <CustomSelect
                  className="w-full"
                  value={promoDept}
                  onChange={(e) => setPromoDept(e.target.value)}
                >
                  {promoYear === "1" ? (
                    <option value="GEN">{firstYearCode} (First Year)</option>
                  ) : (
                    <>
                      <option value="">-- SELECT SECTOR --</option>
                      {departments
                        .filter((d) => {
                          const isGen = d.code === "GEN" || d.code === "GEN1" || d.name?.toLowerCase() === "first year";
                          return !isGen;
                        })
                        .map((d) => (
                          <option key={d.id} value={d.code || d.name}>
                            {d.code || d.name}
                          </option>
                        ))}
                    </>
                  )}
                </CustomSelect>
              </div>

              <div className="pt-10 border-t border-gray-100 mt-4 flex flex-col gap-4">
                {/* PASSED OUT badge — auto-shown for Year 4, Semester 8 */}
                {sourceYear === "4" && String(sourceSem) === "8" && (
                  <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
                    <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                    <div>
                      <p className="font-black text-emerald-900 text-xs uppercase tracking-wider">Final Year — Pass Out</p>
                      <p className="text-emerald-600 text-[10px] font-medium">Students will be archived as passed out</p>
                    </div>
                  </div>
                )}

                {/* Normal target fields — hidden when PASSED OUT is active */}
                {!isPassOut && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 mb-3 block">Target Year</label>
                        <CustomSelect className="w-full" value={promoYear} onChange={(e) => setPromoYear(e.target.value)}>
                          {sourceYear === "4" ? (
                            <option value="4">Year 4 (Repeat)</option>
                          ) : (
                            [1, 2, 3, 4].map((y) => (<option key={y} value={y}>Year {y}</option>))
                          )}
                        </CustomSelect>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 mb-3 block">Target Sec</label>
                        <CustomSelect className="w-full" value={promoSection} onChange={(e) => setPromoSection(e.target.value)}>
                          {(departments.find((d) => (d.code || d.name) === (promoYear === "1" ? "GEN" : promoDept))?.sections?.split(",") || ["A", "B", "C"]).map((s) => (<option key={s} value={s}>Section {s}</option>))}
                        </CustomSelect>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 mb-3 block">Target Cycle (Sem)</label>
                      <CustomSelect className="w-full" value={promoSem} onChange={(e) => setPromoSem(e.target.value)}>
                        {promoYear === "1" ? (
                          [1, 2].map((s) => (<option key={s} value={s}>Semester {s}</option>))
                        ) : (
                          [3, 4, 5, 6, 7, 8].map((s) => (<option key={s} value={s}>Semester {s}</option>))
                        )}
                      </CustomSelect>
                    </div>
                  </>
                )}

                <button
                  onClick={handlePromote}
                  disabled={selectedStudents.length === 0 || passingOut}
                  className={`w-full py-6 rounded-[28px] font-black text-xs tracking-[0.2em] flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-2xl relative overflow-hidden group/submit ${selectedStudents.length === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                    : isPassOut
                      ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-900/20"
                      : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-900/20"
                    }`}
                >
                  {selectedStudents.length > 0 && (
                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/submit:translate-x-full transition-transform duration-1000 skew-x-[45deg]"></div>
                  )}
                  {isPassOut ? (
                    <><CheckCircle2 size={22} strokeWidth={3} /> {passingOut ? 'ARCHIVING...' : 'MARK AS PASSED OUT'}</>
                  ) : (
                    <><TrendingUp size={22} strokeWidth={3} className={selectedStudents.length > 0 ? "animate-bounce" : ""} /> EXECUTE ADVANCEMENT</>
                  )}
                </button>

                {selectedStudents.length === 0 && (
                  <div className="flex items-center justify-center gap-2 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <AlertCircle size={14} className="text-amber-600" />
                    <p className="text-[9px] text-amber-600 font-black uppercase tracking-widest">Select Cadets to Authorize</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPromotion;
