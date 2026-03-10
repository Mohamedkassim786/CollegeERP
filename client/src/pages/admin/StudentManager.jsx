import CustomSelect from "../../components/CustomSelect";
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  ChevronRight,
  GraduationCap,
  Plus,
  X,
  ArrowLeft,
  Trash2,
  Edit2,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  ClipboardList,
  User,
  Search,
} from "lucide-react";
import ExcelJS from "exceljs";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { handleApiError } from "../../utils/errorHandler";

const StudentManager = () => {
  const [selectedCategory, setSelectedCategory] = useState(null); // 'FIRST_YEAR' | 'DEPARTMENTS'
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [studentsList, setStudentsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [batchFilter, setBatchFilter] = useState("ALL");

  // Dynamic Departments & Sections
  const [departments, setDepartments] = useState([]);
  const [dbSections, setDbSections] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [passedOutBatches, setPassedOutBatches] = useState([]); // Added for Passed Out students
  const [passedOutSubview, setPassedOutSubview] = useState(null); // null | 'STUDENTS' | 'ARREARS'
  const [passedOutArrears, setPassedOutArrears] = useState([]);
  const [passingOut, setPassingOut] = useState(false);
  const [showPassOutArrearUpload, setShowPassOutArrearUpload] = useState(false);
  const [passOutArrearFile, setPassOutArrearFile] = useState(null);
  const [passOutArrearUploading, setPassOutArrearUploading] = useState(false);

  // UI States
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // Form Inputs
  const [newStudent, setNewStudent] = useState({
    rollNo: "",
    registerNumber: "",
    name: "",
    department: "",
    year: "",
    section: "",
    semester: "",
    regulation: "2021",
    batch: "",
    admissionYear: "",
    photo: "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    nationality: "",
    phoneNumber: "",
    email: "",
    address: "",
    city: "",
    district: "",
    state: "",
    pincode: "",
    fatherName: "",
    fatherPhone: "",
    motherName: "",
    motherPhone: "",
    guardianName: "",
    guardianPhone: "",
    status: "ACTIVE",
  });

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkZipFile, setBulkZipFile] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkConfig, setBulkConfig] = useState({
    year: 1,
    section: "A",
    semester: 1,
    department: "",
    regulation: "2021",
    batch: "",
  });

  // First Year Short Code State
  const [firstYearCode, setFirstYearCode] = useState(() => {
    return localStorage.getItem('firstYearCode') || "GEN1";
  });
  const [isEditingFirstYearCode, setIsEditingFirstYearCode] = useState(false);
  const [tempFirstYearCode, setTempFirstYearCode] = useState(firstYearCode);

  // Add Section State
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [addingSection, setAddingSection] = useState(false);

  useEffect(() => {
    fetchDepartments();
    if (location.state?.openAddModal) {
      setShowCreateModal(true);
    }
  }, [location]);

  const fetchDepartments = async () => {
    setLoadingDepts(true);
    try {
      const [deptRes, secRes] = await Promise.all([
        api.get("/admin/departments"),
        api.get("/admin/sections")
      ]);
      setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
      setDbSections(Array.isArray(secRes.data) ? secRes.data : []);
    } catch (err) {
      console.error("Failed to fetch departments");
    } finally {
      setLoadingDepts(false);
    }
  };

  const handleSaveFirstYearCode = (e) => {
    e.stopPropagation();
    if (tempFirstYearCode.trim() !== "") {
      setFirstYearCode(tempFirstYearCode);
      localStorage.setItem('firstYearCode', tempFirstYearCode);
    }
    setIsEditingFirstYearCode(false);
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;
    setAddingSection(true);
    try {
      await api.post('/admin/sections', {
        name: newSectionName.toUpperCase(),
        semester: selectedSemester,
        type: "COMMON",
        departmentId: null
      });
      toast.success("Section added successfully!");
      setShowAddSectionModal(false);
      setNewSectionName("");
      fetchDepartments(); // Refresh DB Sections
    } catch (err) {
      handleApiError(err, "Failed to create section");
    } finally {
      setAddingSection(false);
    }
  };

  const fetchPassedOutArrears = async () => {
    try {
      const res = await api.get('/admin/arrears?type=passedout');
      setPassedOutArrears(res.data);
    } catch (err) {
      console.error("Failed to fetch passed-out arrears");
    }
  };

  const fetchPassedOutBatches = async () => {
    try {
      const res = await api.get('/admin/students?status=PASSED_OUT');
      const batches = [...new Set(res.data.map(s => s.batch || s.batchYear).filter(Boolean))];
      setPassedOutBatches(batches.sort());
    } catch (err) {
      console.error("Failed to fetch batches");
    }
  };

  useEffect(() => {
    if (selectedCategory === 'PASSED_OUT') {
      if (passedOutSubview === 'STUDENTS') fetchPassedOutBatches();
      if (passedOutSubview === 'ARREARS') fetchPassedOutArrears();
    }
  }, [selectedCategory, passedOutSubview]);

  const fetchStudents = async (section) => {
    setSelectedSection(section);
    setLoading(true);
    try {
      let queryParams = "";

      if (selectedCategory === 'PASSED_OUT') {
        queryParams = `?status=PASSED_OUT`;
        if (section) queryParams += `&batch=${section}`; // Reusing 'section' state for batch for simplicity in this view
      } else if (selectedSemester <= 2 && selectedSemester) {
        const sectionObj = dbSections.find(s => s.name === section && s.semester === selectedSemester && s.type === "COMMON");
        if (sectionObj) {
          queryParams = `?semester=${selectedSemester}&sectionId=${sectionObj.id}`;
        }
      } else {
        const matchingDept = departments.find(d => d.name === selectedDept || d.code === selectedDept);
        if (matchingDept) {
          const targetSemester = selectedYear * 2 - 1; // Base semester for the year
          const sectionObj = dbSections.find(s => s.name === section && s.semester >= targetSemester && s.semester <= targetSemester + 1 && s.departmentId === matchingDept.id);
          if (sectionObj) {
            queryParams = `?semester=${sectionObj.semester}&departmentId=${matchingDept.id}&sectionId=${sectionObj.id}`;
          }
        }
      }

      // Support legacy string filtering if DB structure isn't perfect yet
      const res = await api.get(`/admin/students${queryParams}`);
      let allStudents = Array.isArray(res.data) ? res.data : [];

      if (!queryParams) {
        const filtered = allStudents.filter((s) => {
          const yearMatch = !selectedYear || String(s.year) === String(selectedYear);
          const sectionMatch = !section || s.section === section;

          const matchingDept = departments.find(d => d.code === selectedDept || d.name === selectedDept);
          const deptMatch = matchingDept && (
            s.departmentId === matchingDept.id ||
            s.department === matchingDept.code ||
            s.department === matchingDept.name
          );

          const statusMatch = s.status !== 'PASSED_OUT';

          return yearMatch && sectionMatch && deptMatch && statusMatch;
        });
        setStudentsList(filtered);
      } else {
        setStudentsList(allStudents);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const resetSelection = (level) => {
    if (level === -1) {
      setSelectedCategory(null);
      setSelectedDept(null);
      setSelectedYear(null);
      setSelectedSemester(null);
      setSelectedSection(null);
      setPassedOutSubview(null);
    }
    if (level === 0) {
      setSelectedDept(null);
      setSelectedYear(null);
      setSelectedSemester(null);
      setSelectedSection(null);
      setPassedOutSubview(null);
    }
    if (level === 1) {
      setSelectedYear(null);
      setSelectedSection(null);
      setSelectedSemester(null);
    }
    if (level === 2) {
      setSelectedSection(null);
    }
  };

  const handleBack = () => {
    if (selectedSection) {
      setSelectedSection(null);
    } else if (selectedYear || selectedSemester) {
      setSelectedYear(null);
      setSelectedSemester(null);
      setSelectedDept(null);
    } else if (selectedDept) {
      setSelectedDept(null);
    } else if (selectedCategory) {
      setSelectedCategory(null);
    }
  };

  const handleEditStudent = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(editingStudent).forEach((key) => {
        if (key !== "photoFile" && editingStudent[key] !== null) {
          formData.append(key, editingStudent[key]);
        }
      });
      // Append physical file if newly uploaded
      if (editingStudent.photoFile) {
        formData.append("photo", editingStudent.photoFile);
      }

      await api.put(`/admin/students/${editingStudent.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert("Student Updated Successfully");
      setShowEditModal(false);
      setEditingStudent(null);
      fetchStudents(selectedSection);
    } catch (err) {
      handleApiError(err, "Error updating student");
    }
  };

  // Handle Photo Upload - Stores Blob File + Object URL preview
  const handlePhotoChange = (e, isEditing = false) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = window.URL.createObjectURL(file);
      if (isEditing) {
        setEditingStudent({ ...editingStudent, photoFile: file, photo: previewUrl });
      } else {
        setNewStudent({ ...newStudent, photoFile: file, photo: previewUrl });
      }
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(newStudent).forEach((key) => {
        if (key !== "photoFile" && newStudent[key] !== null) {
          formData.append(key, newStudent[key]);
        }
      });
      // Append physical file if newly uploaded
      if (newStudent.photoFile) {
        formData.append("photo", newStudent.photoFile);
      }

      await api.post("/admin/students", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert("Student Added Successfully");
      setShowCreateModal(false);
      setNewStudent({
        rollNo: "",
        registerNumber: "",
        name: "",
        department: "",
        year: "",
        section: "",
        semester: "",
        regulation: "2021",
        batch: "",
        photoFile: null,
        photo: ""
      });
      if (
        selectedDept === newStudent.department &&
        parseInt(selectedYear) === parseInt(newStudent.year) &&
        selectedSection === newStudent.section
      ) {
        fetchStudents(selectedSection);
      }
    } catch (err) {
      handleApiError(err, "Error adding student");
    }
  };

  const handleDeleteStudent = async (id) => {
    if (
      !confirm(
        "Are you sure you want to delete this student? All marks will be lost.",
      )
    )
      return;
    try {
      await api.delete(`/admin/students/${id}`);
      setStudentsList(studentsList.filter((s) => s.id !== id));
    } catch (err) {
      alert("Failed to delete student");
    }
  };

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Students");

    worksheet.mergeCells("A2:D2");
    const titleCell = worksheet.getCell("A2");
    titleCell.value = "IV YEAR 2022 2026 BATCH CSE A SEC";
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: "center" };

    worksheet.getRow(3).values = [
      "S.No", "Roll No", "Register No", "Student Name", "Admission Year", 
      "DOB", "Gender", "Blood Group", "Nationality", "Phone", "Email", 
      "Address", "Father Name", "Father Phone", "Mother Name", "Mother Phone", "Photo URL"
    ];
    worksheet.getRow(3).font = { bold: true };
    worksheet.getRow(3).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF00B0F0" } };

    worksheet.columns = [
      { key: "sno", width: 8 },
      { key: "rollNo", width: 15 },
      { key: "registerNumber", width: 20 },
      { key: "name", width: 30 },
      { key: "admissionYear", width: 15 },
      { key: "dateOfBirth", width: 15 },
      { key: "gender", width: 10 },
      { key: "bloodGroup", width: 10 },
      { key: "nationality", width: 15 },
      { key: "phoneNumber", width: 15 },
      { key: "email", width: 25 },
      { key: "address", width: 40 },
      { key: "fatherName", width: 25 },
      { key: "fatherPhone", width: 15 },
      { key: "motherName", width: 25 },
      { key: "motherPhone", width: 15 },
      { key: "photo", width: 30 },
    ];

    worksheet.addRow({
      sno: 1,
      rollNo: "E1225001",
      registerNumber: "812422104001",
      name: "ABHILASH S",
      admissionYear: "2022",
      dateOfBirth: "01/01/2004",
      gender: "Male",
      bloodGroup: "O+",
      phoneNumber: "9876543210",
      email: "abhilash@example.com",
      photo: "E1225001.jpg"
    });

    worksheet.addRow({
      sno: 2,
      rollNo: "E1225002",
      registerNumber: "812422104002",
      name: "ABINAYA K",
      admissionYear: "2022",
      dateOfBirth: "02/02/2004",
      gender: "Female",
      bloodGroup: "A+",
      photo: "E1225002.png"
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Student_Bulk_Upload_Template.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkFile) return;

    setBulkUploading(true);
    setBulkResult(null);

    try {
      const workbook = new ExcelJS.Workbook();
      const buffer = await bulkFile.arrayBuffer();
      await workbook.xlsx.load(buffer);

      // Find first non-empty worksheet
      const worksheet =
        workbook.worksheets.find((ws) => ws.actualRowCount > 0) ||
        workbook.getWorksheet(1);
      if (!worksheet)
        throw new Error("Could not find a valid worksheet in the file");

      console.log(
        `[BulkDebug] Using Worksheet: "${worksheet.name}" with ${worksheet.actualRowCount} rows`,
      );

      const students = [];
      let currentDept = null;
      const deptMap = {
        CIVIL: "Civil Engineering",
        CSE: "Computer Science and Engineering",
        COMPUTER: "Computer Science and Engineering",
        MECHANICAL: "Mechanical Engineering",
        MECH: "Mechanical Engineering",
        ECE: "Electronics and Communication Engineering",
        EEE: "Electrical and Electronics Engineering",
      };

      let headerKeys = { 
        name: -1, rollNo: -1, registerNumber: -1, admissionYear: -1,
        dateOfBirth: -1, gender: -1, bloodGroup: -1, nationality: -1,
        phoneNumber: -1, email: -1, address: -1, 
        fatherName: -1, fatherPhone: -1, motherName: -1, motherPhone: -1, photoURL: -1
      };
      let headersFound = false;

      worksheet.eachRow((row, rowNumber) => {
        if (!headersFound) {
          let tempMap = { 
            name: -1, rollNo: -1, registerNumber: -1, admissionYear: -1,
            dateOfBirth: -1, gender: -1, bloodGroup: -1, nationality: -1,
            phoneNumber: -1, email: -1, address: -1, 
            fatherName: -1, fatherPhone: -1, motherName: -1, motherPhone: -1, photoURL: -1
          };
          row.eachCell((cell, colNumber) => {
            const text = String(cell.text || "").toLowerCase().replace(/[^a-z]/g, '');
            if (text === "name" || text === "studentname") tempMap.name = colNumber;
            else if (text.includes("roll")) tempMap.rollNo = colNumber;
            else if (text.includes("reg") && !text.includes("regulation")) tempMap.registerNumber = colNumber;
            else if (text.includes("admissionyear")) tempMap.admissionYear = colNumber;
            else if (text.includes("dob") || text.includes("birth")) tempMap.dateOfBirth = colNumber;
            else if (text.includes("gender")) tempMap.gender = colNumber;
            else if (text.includes("blood")) tempMap.bloodGroup = colNumber;
            else if (text.includes("nation")) tempMap.nationality = colNumber;
            else if (text.includes("phone") || text.includes("mobile")) {
              if (text.includes("father")) tempMap.fatherPhone = colNumber;
              else if (text.includes("mother")) tempMap.motherPhone = colNumber;
              else tempMap.phoneNumber = colNumber;
            }
            else if (text.includes("email")) tempMap.email = colNumber;
            else if (text.includes("address")) tempMap.address = colNumber;
            else if (text.includes("mother") && text.includes("name")) tempMap.motherName = colNumber;
            else if (text.includes("photo") || text.includes("image")) tempMap.photoURL = colNumber;
          });

          if (tempMap.name !== -1 && (tempMap.rollNo !== -1 || tempMap.registerNumber !== -1)) {
            headersFound = true;
            headerKeys = tempMap;
            console.log(`[BulkDebug] Headers detected at row ${rowNumber}:`, headerKeys);
            return;
          }

          // Check for department header if headers not yet found
          let possibleDeptStr = "";
          row.eachCell((cell) => {
            if (String(cell.text).length > 5 && isNaN(String(cell.text))) possibleDeptStr += " " + String(cell.text);
          });
          // Note: Ignoring Excel's dynamic department string as requested by the user.
          // We will strictly rely on `bulkConfig.department` or `selectedDept`.
          return;
        }

        // Extract data
        const nameVal = headerKeys.name !== -1 ? String(row.getCell(headerKeys.name).text || "").trim() : "";
        const rollVal = headerKeys.rollNo !== -1 ? String(row.getCell(headerKeys.rollNo).text || "").trim() : "";
        const regVal = headerKeys.registerNumber !== -1 ? String(row.getCell(headerKeys.registerNumber).text || "").trim() : "";
        const admissionYear = headerKeys.admissionYear !== -1 ? String(row.getCell(headerKeys.admissionYear).text || "").trim() : "";
        const dob = headerKeys.dateOfBirth !== -1 ? String(row.getCell(headerKeys.dateOfBirth).text || "").trim() : "";
        const gender = headerKeys.gender !== -1 ? String(row.getCell(headerKeys.gender).text || "").trim() : "";
        const blood = headerKeys.bloodGroup !== -1 ? String(row.getCell(headerKeys.bloodGroup).text || "").trim() : "";
        const nation = headerKeys.nationality !== -1 ? String(row.getCell(headerKeys.nationality).text || "").trim() : "";
        const phone = headerKeys.phoneNumber !== -1 ? String(row.getCell(headerKeys.phoneNumber).text || "").trim() : "";
        const email = headerKeys.email !== -1 ? String(row.getCell(headerKeys.email).text || "").trim() : "";
        const addr = headerKeys.address !== -1 ? String(row.getCell(headerKeys.address).text || "").trim() : "";
        const fName = headerKeys.fatherName !== -1 ? String(row.getCell(headerKeys.fatherName).text || "").trim() : "";
        const fPhone = headerKeys.fatherPhone !== -1 ? String(row.getCell(headerKeys.fatherPhone).text || "").trim() : "";
        const mName = headerKeys.motherName !== -1 ? String(row.getCell(headerKeys.motherName).text || "").trim() : "";
        const mPhone = headerKeys.motherPhone !== -1 ? String(row.getCell(headerKeys.motherPhone).text || "").trim() : "";
        
        let photo = "";
        const photoCell = row.getCell(headerKeys.photoURL);
        if (photoCell && photoCell.value) {
           photo = String(photoCell.value).trim();
        }

        if (!nameVal && !rollVal && !regVal) return;
        if (nameVal.toLowerCase().includes("name") && (rollVal.toLowerCase().includes("roll") || regVal.toLowerCase().includes("reg"))) return;

        // Accept if we have a name, and at least a roll or register number
        if (nameVal && (rollVal || regVal)) {
          const finalRoll = rollVal || regVal || `TEMP-${rowNumber}`;

          // Strict UI Selection Logic for Department
          let strictDept = bulkConfig.department;
          if (!strictDept || strictDept === "Auto-Detect") {
            strictDept = selectedDept;
          }

          students.push({
            rollNo: finalRoll,
            registerNumber: regVal || null,
            name: nameVal,
            department: strictDept,
            year: parseInt(bulkConfig.year),
            section: bulkConfig.section,
            semester: parseInt(bulkConfig.semester),
            regulation: bulkConfig.regulation || "2021",
            batch: bulkConfig.batch || "",
            admissionYear: admissionYear || "",
            dateOfBirth: dob || "",
            gender: gender || "",
            bloodGroup: blood || "",
            nationality: nation || "",
            phoneNumber: phone || "",
            email: email || "",
            address: addr || "",
            fatherName: fName || "",
            fatherPhone: fPhone || "",
            motherName: mName || "",
            motherPhone: mPhone || "",
            photo: photo || "",
          });
        }
      });

      if (students.length === 0)
        throw new Error("No valid student records found in file");

      const formData = new FormData();
      formData.append('students', JSON.stringify(students));
      if (bulkZipFile) {
        formData.append('photosZip', bulkZipFile);
      }

      const res = await api.post("/admin/students/bulk", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setBulkResult(res.data);
      if (res.data?.errors && res.data.errors.length > 0) {
        toast.error(`Imported with ${res.data.errors.length} errors. Check console.`);
        console.table(res.data.errors);
      } else {
        toast.success(`Processed ${students.length} records successfully`);
      }

      if (selectedSection) fetchStudents(selectedSection);
    } catch (err) {
      console.error("Bulk Upload Error:", err);
      const msg = err.response?.data?.message || err.message || "Failed to process bulk upload";
      toast.error(msg);
    } finally {
      setBulkUploading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="mb-8 p-4 bg-white rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-[#003B73] tracking-tight">
            Student Management
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Navigate and manage student records across all departments.
          </p>
        </div>

        {selectedCategory && selectedCategory !== 'PASSED_OUT' && (
          <div className="flex gap-4">
            <button
              onClick={() => {
                setBulkFile(null);
                const isFirstYear = selectedCategory === 'FIRST_YEAR';
                setBulkConfig({
                  ...bulkConfig,
                  year: selectedYear || (isFirstYear ? 1 : 2),
                  semester: selectedSemester || (isFirstYear ? 1 : 3),
                  department: selectedDept || "",
                  section: selectedSection || "A"
                });
                setShowBulkModal(true);
              }}
              className="px-6 py-4 bg-emerald-50 text-emerald-600 rounded-[24px] font-black hover:bg-emerald-100 transition-all flex items-center gap-2 border border-emerald-100"
            >
              <Upload size={20} /> Bulk Upload
            </button>
            <button
              onClick={() => {
                const isFirstYear = selectedCategory === 'FIRST_YEAR';
                setNewStudent({
                  ...newStudent,
                  department: selectedDept || "",
                  year: selectedYear || (isFirstYear ? "1" : ""),
                  section: selectedSection || "",
                  semester: (selectedSemester !== null && selectedSemester !== undefined) ? String(selectedSemester) : (selectedYear ? String(selectedYear * 2 - 1) : (isFirstYear ? "1" : "")),
                });
                setShowCreateModal(true);
              }}
              className="px-8 py-4 bg-[#003B73] text-white rounded-[24px] font-black hover:bg-[#002850] shadow-xl shadow-blue-900/10 transition-all flex items-center gap-2 transform active:scale-95"
            >
              <Plus size={22} strokeWidth={3} /> Register Student
            </button>
          </div>
        )}
      </div>

      <div className="bg-white p-10 rounded-[40px] shadow-xl border border-gray-100 min-h-[650px] transition-all relative overflow-hidden">
        {/* Decorative Element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gray-50 rounded-bl-[100px] -z-0 opacity-50"></div>

        {/* Back Button & Breadcrumbs */}
        <div className="flex items-center gap-6 mb-12 relative z-10 border-b border-gray-50 pb-8">
          {selectedDept && (
            <button
              onClick={handleBack}
              className="w-12 h-12 flex items-center justify-center bg-gray-50 hover:bg-white hover:shadow-md rounded-2xl transition-all text-[#003B73] border border-transparent hover:border-gray-100"
              title="Go Back"
            >
              <ArrowLeft size={24} strokeWidth={2.5} />
            </button>
          )}

          <div className="flex items-center gap-3 text-sm overflow-x-auto no-scrollbar">
            <button
              onClick={() => resetSelection(-1)}
              className={`px-4 py-2 rounded-xl transition-all font-black uppercase tracking-widest text-[10px] ${!selectedCategory ? "bg-[#003B73] text-white shadow-lg" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
            >
              Categories
            </button>

            {selectedCategory && (
              <>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                <button
                  onClick={() => resetSelection(0)}
                  className={`px-4 py-2 rounded-xl transition-all font-black uppercase tracking-widest text-[10px] whitespace-nowrap ${!selectedDept && !selectedSemester && !selectedSection && !passedOutSubview ? "bg-[#003B73] text-white shadow-lg" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
                >
                  {selectedCategory === 'FIRST_YEAR' ? 'FIRST YEAR' : (selectedCategory === 'PASSED_OUT' ? 'PASSED OUT' : 'DEPARTMENTS')}
                </button>
              </>
            )}

            {selectedCategory === 'PASSED_OUT' && passedOutSubview && (
              <>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                <div className={`px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] whitespace-nowrap ${passedOutSubview === 'STUDENTS' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-orange-500 text-white shadow-lg'
                  }`}>
                  {passedOutSubview === 'STUDENTS' ? 'Students' : 'Arrears'}
                </div>
              </>
            )}

            {selectedSemester <= 2 && selectedSemester && !selectedDept && (
              <>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                <button
                  onClick={() => resetSelection(1)}
                  className={`px-4 py-2 rounded-xl transition-all font-black uppercase tracking-widest text-[10px] whitespace-nowrap ${!selectedSection ? "bg-purple-600 text-white shadow-lg" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
                >
                  Semester {selectedSemester} (First Year)
                </button>
              </>
            )}

            {selectedDept && (
              <>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                <button
                  onClick={() => resetSelection(1)}
                  className={`px-4 py-2 rounded-xl transition-all font-black uppercase tracking-widest text-[10px] whitespace-nowrap ${!selectedYear ? "bg-indigo-600 text-white shadow-lg" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
                >
                  {departments.find(d => d.code === selectedDept || d.name === selectedDept)?.code || selectedDept}
                </button>
              </>
            )}

            {selectedYear && selectedDept && (
              <>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                <button
                  onClick={() => resetSelection(2)}
                  className={`px-4 py-2 rounded-xl transition-all font-black uppercase tracking-widest text-[10px] whitespace-nowrap ${!selectedSection ? "bg-emerald-600 text-white shadow-lg" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
                >
                  Year {selectedYear}
                </button>
              </>
            )}

            {selectedSection && (
              <>
                <ChevronRight
                  size={16}
                  className="text-gray-300 flex-shrink-0"
                />
                <div className="px-5 py-2 bg-blue-50 text-blue-600 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-sm border border-blue-100 whitespace-nowrap">
                  Section {selectedSection}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Level 0: Categories (First Year vs Departments) */}
        {!selectedCategory && !selectedDept && !selectedSemester && !selectedYear && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 animate-fadeIn relative z-10">
            <div
              onClick={() => {
                if (!isEditingFirstYearCode) setSelectedCategory('FIRST_YEAR');
              }}
              className="group p-10 bg-purple-50/50 hover:bg-purple-600 rounded-[32px] cursor-pointer transition-all duration-500 border border-purple-100 hover:shadow-2xl hover:shadow-purple-200 flex flex-col items-center justify-center text-center relative"
            >
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-white/20 transition-all duration-500 mb-6">
                <Users className="w-8 h-8 text-purple-600 group-hover:text-white" />
              </div>
              <h3 className="text-2xl font-black text-purple-900 group-hover:text-white transition-colors">
                FIRST YEAR
              </h3>

              {isEditingFirstYearCode ? (
                <div className="mt-3 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <input
                    autoFocus
                    className="px-3 py-1.5 text-xs font-black text-purple-900 text-center rounded-lg border border-purple-300 w-24 outline-none"
                    value={tempFirstYearCode}
                    onChange={e => setTempFirstYearCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleSaveFirstYearCode(e)}
                  />
                  <button onClick={handleSaveFirstYearCode} className="p-1.5 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 shadow-sm">
                    <CheckCircle2 size={16} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setIsEditingFirstYearCode(false); }} className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 shadow-sm">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex items-center justify-center gap-2 group-hover:text-purple-100">
                  <p className="text-xs font-black text-purple-500 group-hover:text-purple-100 uppercase tracking-widest bg-white/50 group-hover:bg-black/10 px-3 py-1 rounded-md">
                    CODE: {firstYearCode}
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setTempFirstYearCode(firstYearCode); setIsEditingFirstYearCode(true); }}
                    className="p-1 text-purple-400 hover:text-white transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              )}
            </div>

            <div
              onClick={() => setSelectedCategory('DEPARTMENTS')}
              className="group p-10 bg-blue-50/50 hover:bg-[#003B73] rounded-[32px] cursor-pointer transition-all duration-500 border border-blue-100 hover:shadow-2xl hover:shadow-blue-200 flex flex-col items-center justify-center text-center"
            >
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-white/20 transition-all duration-500 mb-6">
                <GraduationCap className="w-8 h-8 text-[#003B73] group-hover:text-white" />
              </div>
              <h3 className="text-2xl font-black text-[#003B73] group-hover:text-white transition-colors">
                DEPARTMENTS
              </h3>
              <p className="text-xs font-black text-blue-400 group-hover:text-blue-100 mt-2 uppercase tracking-widest">
                Manage Departments
              </p>
            </div>

            <div
              onClick={() => setSelectedCategory('PASSED_OUT')}
              className="group p-10 bg-emerald-50/50 hover:bg-emerald-600 rounded-[32px] cursor-pointer transition-all duration-500 border border-emerald-100 hover:shadow-2xl hover:shadow-emerald-200 flex flex-col items-center justify-center text-center"
            >
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-white/20 transition-all duration-500 mb-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 group-hover:text-white" />
              </div>
              <h3 className="text-2xl font-black text-emerald-900 group-hover:text-white transition-colors">
                PASSED OUT
              </h3>
              <p className="text-xs font-black text-emerald-400 group-hover:text-emerald-100 mt-2 uppercase tracking-widest">
                Graduated Batches
              </p>
            </div>
          </div>
        )}

        {/* Level 1: Sub-Categories */}
        {selectedCategory === 'FIRST_YEAR' && !selectedSemester && !selectedSection && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 animate-fadeIn relative z-10">
            {[1, 2].map(sem => (
              <div
                key={`sem-${sem}`}
                onClick={() => setSelectedSemester(sem)}
                className="group p-10 bg-purple-50/50 hover:bg-purple-600 rounded-[32px] cursor-pointer transition-all duration-500 border border-purple-100 hover:shadow-2xl hover:shadow-purple-200 flex flex-col items-center justify-center text-center"
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-white/20 transition-all duration-500 mb-6">
                  <Users className="w-8 h-8 text-purple-600 group-hover:text-white" />
                </div>
                <h3 className="text-2xl font-black text-purple-900 group-hover:text-white transition-colors">
                  Semester {sem}
                </h3>
                <p className="text-xs font-black text-purple-400 group-hover:text-purple-100 mt-2 uppercase tracking-widest">
                  First Year Pool
                </p>
              </div>
            ))}
          </div>
        )}

        {/* PASSED OUT — Sub-option picker */}
        {selectedCategory === 'PASSED_OUT' && !passedOutSubview && !selectedSection && (
          <div className="animate-fadeIn relative z-10">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black text-emerald-900 tracking-tight">
                Passed Out — Select View
              </h2>
              <div className="px-6 py-2 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-xs uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                Archive Mode
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Students card */}
              <div
                onClick={() => setPassedOutSubview('STUDENTS')}
                className="group p-10 bg-emerald-50/50 hover:bg-emerald-600 rounded-[32px] cursor-pointer transition-all duration-500 border border-emerald-100 hover:shadow-2xl hover:shadow-emerald-200 flex flex-col items-center justify-center text-center"
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-white/20 transition-all duration-500 mb-6">
                  <GraduationCap className="w-8 h-8 text-emerald-600 group-hover:text-white" />
                </div>
                <h3 className="text-2xl font-black text-emerald-900 group-hover:text-white transition-colors">
                  STUDENTS
                </h3>
                <p className="text-xs font-black text-emerald-400 group-hover:text-emerald-100 mt-2 uppercase tracking-widest">
                  View Graduated Batches
                </p>
              </div>
              {/* Arrears card */}
              <div
                onClick={() => setPassedOutSubview('ARREARS')}
                className="group p-10 bg-orange-50/50 hover:bg-orange-500 rounded-[32px] cursor-pointer transition-all duration-500 border border-orange-100 hover:shadow-2xl hover:shadow-orange-200 flex flex-col items-center justify-center text-center"
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-white/20 transition-all duration-500 mb-6">
                  <ClipboardList className="w-8 h-8 text-orange-500 group-hover:text-white" />
                </div>
                <h3 className="text-2xl font-black text-orange-900 group-hover:text-white transition-colors">
                  ARREARS
                </h3>
                <p className="text-xs font-black text-orange-400 group-hover:text-orange-100 mt-2 uppercase tracking-widest">
                  Pending Arrear Records
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PASSED OUT — Students (batch selection) */}
        {selectedCategory === 'PASSED_OUT' && passedOutSubview === 'STUDENTS' && !selectedSection && (
          <div className="animate-fadeIn relative z-10">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black text-emerald-900 tracking-tight">
                Select Graduated Batch
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {passedOutBatches.length > 0 ? (
                passedOutBatches.map(batch => (
                  <div
                    key={batch}
                    onClick={() => fetchStudents(batch)}
                    className="group p-10 bg-emerald-50/50 hover:bg-emerald-600 rounded-[32px] cursor-pointer transition-all duration-500 border border-emerald-100 hover:shadow-2xl hover:shadow-emerald-200 flex flex-col items-center justify-center text-center"
                  >
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-white/20 transition-all duration-500 mb-6">
                      <GraduationCap className="w-8 h-8 text-emerald-600 group-hover:text-white" />
                    </div>
                    <h3 className="text-2xl font-black text-emerald-900 group-hover:text-white transition-colors">
                      Batch {batch}
                    </h3>
                    <p className="text-xs font-black text-emerald-400 group-hover:text-emerald-100 mt-2 uppercase tracking-widest">
                      View Graduates
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-400 font-bold text-xl italic mb-2">No Graduated Records Found</p>
                  <p className="text-gray-400 text-sm max-w-sm">Mark students as "PASSED OUT" to see them here.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PASSED OUT — Arrears view */}
        {selectedCategory === 'PASSED_OUT' && passedOutSubview === 'ARREARS' && (
          <div className="animate-fadeIn relative z-10">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-orange-900 tracking-tight">
                Passed Out — Arrear Records
              </h2>
              <div className="flex items-center gap-4">
                <div className="px-6 py-2 bg-orange-50 text-orange-600 rounded-2xl font-black text-xs uppercase tracking-widest border border-orange-100 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                  Archive Mode
                </div>
                <button
                  onClick={() => setShowPassOutArrearUpload(v => !v)}
                  className="px-6 py-4 bg-orange-600 text-white rounded-[24px] font-black hover:bg-orange-700 transition-all flex items-center gap-3 shadow-xl shadow-orange-900/20 hover:-translate-y-1"
                >
                  <Upload size={20} />
                  Bulk Upload Arrears
                </button>
              </div>
            </div>

            {/* Bulk upload panel */}
            {showPassOutArrearUpload && (
              <div className="mb-8 p-8 bg-orange-50 border border-orange-200 rounded-3xl animate-fadeIn">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="font-black text-orange-900 text-lg mb-1">Bulk Upload Passed-Out Arrears</h3>
                    <p className="text-orange-700 text-sm">Upload an Excel file with columns: <strong>registerNumber</strong>, <strong>subjectCode</strong>, <strong>semester</strong>.</p>
                  </div>
                  <button
                    onClick={async () => {
                      const wb = new ExcelJS.Workbook();
                      const ws = wb.addWorksheet('Passed Out Arrears');
                      ws.addRow(['registerNumber', 'subjectCode', 'semester']);
                      ws.addRow(['21CSE001', 'CS8501', '7']);
                      ws.addRow(['21CSE002', 'CS8401', '7']);
                      const buf = await wb.xlsx.writeBuffer();
                      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a'); a.href = url; a.download = 'passedout_arrear_template.xlsx'; a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center gap-2 px-5 py-3 bg-white text-orange-600 border border-orange-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-100 transition-all flex-shrink-0"
                  >
                    <FileSpreadsheet size={16} /> Download Template
                  </button>
                </div>

                <label className="flex items-center gap-4 px-6 py-6 bg-white border-2 border-dashed border-orange-300 hover:border-orange-500 rounded-2xl cursor-pointer transition-all mb-4 group">
                  <div className="w-14 h-14 bg-orange-50 group-hover:bg-orange-100 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all">
                    <FileSpreadsheet size={28} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="font-black text-gray-800">{passOutArrearFile ? passOutArrearFile.name : 'Choose Excel file (.xlsx)'}</p>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">{passOutArrearFile ? 'Click to change file' : 'Click to browse or drag and drop'}</p>
                  </div>
                  <input type="file" accept=".xlsx,.xls" className="hidden" onChange={e => setPassOutArrearFile(e.target.files[0])} />
                </label>

                <button
                  disabled={!passOutArrearFile || passOutArrearUploading}
                  onClick={async () => {
                    if (!passOutArrearFile) return;
                    setPassOutArrearUploading(true);
                    try {
                      const wb = new ExcelJS.Workbook();
                      const ab = await passOutArrearFile.arrayBuffer();
                      await wb.xlsx.load(ab);
                      const ws = wb.worksheets[0];
                      if (!ws) throw new Error('No worksheet found');

                      let headers = {};
                      const records = [];
                      ws.eachRow((row, rn) => {
                        if (rn === 1) {
                          row.eachCell((cell, cn) => {
                            const h = String(cell.value || '').toLowerCase().replace(/\s+/g, '');
                            if (h.includes('register') || h.includes('regnum')) headers.reg = cn;
                            if (h.includes('subject') || h.includes('code')) headers.code = cn;
                            if (h.includes('semester') || h.includes('sem')) headers.sem = cn;
                          });
                          return;
                        }
                        const reg = headers.reg ? String(row.getCell(headers.reg).value || '').trim() : '';
                        const code = headers.code ? String(row.getCell(headers.code).value || '').trim() : '';
                        const sem = headers.sem ? parseInt(row.getCell(headers.sem).value) : null;
                        if (reg && code) records.push({ registerNumber: reg, subjectCode: code, semester: sem });
                      });

                      if (!records.length) throw new Error('No valid records found in file');
                      const res = await api.post('/admin/arrears/bulk-passedout', { records });
                      toast.success(`Uploaded ${res.data.count || records.length} arrear records.`);
                      setPassOutArrearFile(null);
                      setShowPassOutArrearUpload(false);
                      fetchPassedOutArrears();
                    } catch (err) {
                      toast.error(err.response?.data?.message || err.message || 'Upload failed');
                    } finally {
                      setPassOutArrearUploading(false);
                    }
                  }}
                  className="w-full py-5 bg-orange-500 text-white rounded-2xl font-black text-base hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-orange-200"
                >
                  <Upload size={22} />
                  {passOutArrearUploading ? 'Uploading...' : 'Upload Arrear Records'}
                </button>
              </div>
            )}


            {passedOutArrears.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-400 font-bold text-xl italic mb-2">No Pending Arrears</p>
                <p className="text-gray-400 text-sm">All passed-out students have cleared their arrears.</p>
              </div>
            ) : (
              <div className="overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-orange-500 text-white">
                    <tr>
                      <th className="px-6 py-4 font-bold tracking-wider">Reg No</th>
                      <th className="px-6 py-4 font-bold tracking-wider">Student Name</th>
                      <th className="px-6 py-4 font-bold tracking-wider">Subject Code</th>
                      <th className="px-6 py-4 font-bold tracking-wider">Orig. Sem</th>
                      <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {passedOutArrears.map((a, i) => (
                      <tr key={i} className="hover:bg-orange-50/40 transition-colors">
                        <td className="px-6 py-4 font-black text-gray-800">{a.student?.registerNumber || a.student?.rollNo || 'N/A'}</td>
                        <td className="px-6 py-4 font-bold text-gray-600">{a.student?.name || 'Unknown'}</td>
                        <td className="px-6 py-4 font-bold text-orange-600">{a.subject?.code || 'N/A'}</td>
                        <td className="px-6 py-4 font-semibold text-gray-600">{a.semester}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg font-bold text-xs">Pending</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}


        {selectedCategory === 'DEPARTMENTS' && !selectedDept && !selectedSection && !selectedYear && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 animate-fadeIn relative z-10">
            {(Array.isArray(departments) ? departments : [])
              .filter((d) => d && d.name?.toLowerCase() !== "first year" && d.code !== "GEN1" && d.code !== "GEN")
              .map((dept) => (
                <div
                  key={dept.id}
                  onClick={() => setSelectedDept(dept.code || dept.name)}
                  className="group p-10 bg-blue-50/50 hover:bg-[#003B73] rounded-[32px] cursor-pointer transition-all duration-500 border border-blue-100 hover:shadow-2xl hover:shadow-blue-200 flex flex-col items-center justify-center text-center"
                >
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-white/20 transition-all duration-500 mb-6">
                    <GraduationCap className="w-8 h-8 text-[#003B73] group-hover:text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-[#003B73] group-hover:text-white transition-colors">
                    {dept.code || dept.name}
                  </h3>
                  <p className="text-xs font-black text-blue-400 group-hover:text-blue-100 mt-2 uppercase tracking-widest">
                    Explore Dept
                  </p>
                </div>
              ))}
          </div>
        )}

        {/* Level 2: Year */}
        {selectedDept &&
          selectedDept?.toLowerCase() !== "first year" &&
          !selectedYear && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 animate-fadeIn relative z-10">
              {(
                departments
                  .find((d) => d.code === selectedDept || d.name === selectedDept)
                  ?.years?.split(",")
                  .map((y) => parseInt(y)) || [2, 3, 4]
              ).map((year) => (
                <div
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className="group p-10 bg-indigo-50/50 hover:bg-indigo-600 rounded-[32px] cursor-pointer transition-all duration-500 border border-indigo-100 hover:shadow-2xl hover:shadow-indigo-200 flex flex-col items-center justify-center text-center"
                >
                  <div className="text-5xl font-black text-indigo-300 group-hover:text-indigo-200 group-hover:scale-110 transition-all duration-500 mb-4 opacity-50">
                    {year}
                  </div>
                  <h3 className="text-2xl font-black text-indigo-900 group-hover:text-white uppercase transition-colors">
                    Year {year}
                  </h3>
                  <p className="text-[10px] font-black text-indigo-400 group-hover:text-indigo-100 uppercase tracking-widest mt-2 px-4 py-1.5 bg-white group-hover:bg-white/10 rounded-lg">
                    Sem {year * 2 - 1} & {year * 2}
                  </p>
                </div>
              ))}
            </div>
          )}

        {/* Level 3: Section (For Semester 1 & 2) */}
        {selectedSemester <= 2 && selectedSemester && !selectedSection && !selectedDept && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 animate-fadeIn relative z-10">
            {(
              dbSections.filter(s => s.semester === selectedSemester && s.type === "COMMON").map(s => s.name)
            ).filter((v, i, a) => a.indexOf(v) === i).map((sec) => (
              <div
                key={`common-${sec}`}
                onClick={() => fetchStudents(sec)}
                className="group p-10 bg-emerald-50/50 hover:bg-emerald-600 rounded-[32px] cursor-pointer transition-all duration-500 border border-emerald-100 hover:shadow-2xl hover:shadow-emerald-200 flex flex-col items-center justify-center text-center"
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-white/20 transition-all duration-500 mb-6">
                  <Users className="w-8 h-8 text-emerald-600 group-hover:text-white" />
                </div>
                <h3 className="text-2xl font-black text-emerald-900 group-hover:text-white uppercase transition-colors">
                  Section {sec}
                </h3>
                <p className="text-xs font-black text-emerald-500 group-hover:text-emerald-100 mt-2 uppercase tracking-widest">
                  View Roster
                </p>
              </div>
            ))}

            {/* Add Section Button */}
            <div
              onClick={() => setShowAddSectionModal(true)}
              className="group p-10 bg-emerald-50/30 hover:bg-emerald-100 border-2 border-dashed border-emerald-200 hover:border-emerald-400 rounded-[32px] cursor-pointer transition-all duration-500 flex flex-col items-center justify-center text-center"
            >
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-[0_4px_20px_-4px_rgba(52,211,153,0.3)] group-hover:scale-110 transition-all duration-500 mb-6 group-hover:bg-emerald-500 group-hover:text-white">
                <Plus className="w-8 h-8 text-emerald-500 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-black text-emerald-700 transition-colors">
                Add Section
              </h3>
              <p className="text-[10px] font-black text-emerald-500 mt-2 uppercase tracking-widest">
                Create New Cohort
              </p>
            </div>
          </div>
        )}

        {/* Level 3: Section (For Higher Years) */}
        {selectedDept && selectedYear && !selectedSection && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 animate-fadeIn relative z-10">
            {(
              dbSections.filter(s => {
                const deptObj = departments.find(d => d.name === selectedDept || d.code === selectedDept);
                const targetSem = selectedYear * 2 - 1;
                return s.departmentId === deptObj?.id && (s.semester === targetSem || s.semester === targetSem + 1);
              }).map(s => s.name)
            ).filter((v, i, a) => a.indexOf(v) === i).length > 0 ? (
              dbSections.filter(s => {
                const deptObj = departments.find(d => d.name === selectedDept || d.code === selectedDept);
                const targetSem = selectedYear * 2 - 1;
                return s.departmentId === deptObj?.id && (s.semester === targetSem || s.semester === targetSem + 1);
              }).map(s => s.name).filter((v, i, a) => a.indexOf(v) === i).map((sec) => (
                <div
                  key={`dept-${sec}`}
                  onClick={() => fetchStudents(sec)}
                  className="group p-10 bg-emerald-50/50 hover:bg-emerald-600 rounded-[32px] cursor-pointer transition-all duration-500 border border-emerald-100 hover:shadow-2xl hover:shadow-emerald-200 flex flex-col items-center justify-center text-center"
                >
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-white/20 transition-all duration-500 mb-6">
                    <Users className="w-8 h-8 text-emerald-600 group-hover:text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-emerald-900 group-hover:text-white uppercase transition-colors">
                    Section {sec}
                  </h3>
                  <p className="text-xs font-black text-emerald-500 group-hover:text-emerald-100 mt-2 uppercase tracking-widest">
                    View Roster
                  </p>
                </div>
              ))
            ) : (
              ["A", "B", "C"].map((sec) => (
                <div
                  key={`fallback-${sec}`}
                  onClick={() => fetchStudents(sec)}
                  className="group p-10 bg-emerald-50/50 hover:bg-emerald-600 rounded-[32px] cursor-pointer transition-all duration-500 border border-emerald-100 hover:shadow-2xl hover:shadow-emerald-200 flex flex-col items-center justify-center text-center"
                >
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-white/20 transition-all duration-500 mb-6">
                    <Users className="w-8 h-8 text-emerald-600 group-hover:text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-emerald-900 group-hover:text-white uppercase transition-colors">
                    Section {sec}
                  </h3>
                  <p className="text-xs font-black text-emerald-500 group-hover:text-emerald-100 mt-2 uppercase tracking-widest">
                    View Roster
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Level 4: List */}
        {selectedSection && (
          <div className="animate-fadeIn relative z-10 h-full">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-40">
                <div className="w-12 h-12 border-4 border-gray-100 border-t-[#003B73] rounded-full animate-spin mb-4"></div>
                <p className="font-black text-gray-400 uppercase tracking-widest text-xs">
                  Fetching Roster...
                </p>
              </div>
            ) : (
              <div className="overflow-hidden bg-gray-50/30 rounded-3xl border border-gray-100">
                {/* Advanced Filters */}
                <div className="p-6 bg-white/50 border-b border-gray-100 flex flex-wrap items-center gap-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search Name or Roll Number..."
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#003B73]/10 transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <CustomSelect
                    className="min-w-[150px]"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ARREAR">Arrear</option>
                    <option value="PASSED_OUT">Passed Out</option>
                    <option value="DETENTION">Detention</option>
                    <option value="DROPOUT">Dropout</option>
                  </CustomSelect>
                  <CustomSelect
                    className="min-w-[150px]"
                    value={batchFilter}
                    onChange={(e) => setBatchFilter(e.target.value)}
                  >
                    <option value="ALL">All Batches</option>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </CustomSelect>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('ALL');
                      setBatchFilter('ALL');
                    }}
                    className="p-3 bg-gray-100 text-gray-500 rounded-2xl hover:bg-gray-200 transition-all"
                    title="Clear Filters"
                  >
                    <X size={18} />
                  </button>
                </div>

                <table className="w-full text-center border-collapse">
                  <thead className="bg-gray-100/50 text-[#003B73] text-[10px] font-black uppercase tracking-[0.2em]">
                    <tr>
                      <th className="px-6 py-6 text-left">Photo</th>
                      <th className="px-6 py-6 text-left">Student Details</th>
                      <th className="px-6 py-6">Roll No</th>
                      <th className="px-6 py-6">Dept/Sec</th>
                      <th className="px-6 py-6">Batch/Sem</th>
                      <th className="px-6 py-6">Phone</th>
                      <th className="px-6 py-6">Status</th>
                      <th className="px-6 py-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/50">
                    {studentsList
                      .filter(s => {
                        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.rollNo.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
                        const matchesBatch = batchFilter === 'ALL' || s.batch?.includes(batchFilter);
                        return matchesSearch && matchesStatus && matchesBatch;
                      })
                      .map((s) => (
                        <tr
                          key={s.id}
                          className="group hover:bg-white transition-all duration-300"
                        >
                          <td className="px-6 py-6 text-left">
                            {s.photo ? (
                              <img src={s.photo} alt={s.name} className="w-12 h-12 rounded-2xl object-cover border border-gray-100 shadow-sm" />
                            ) : (
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-[#003B73] shadow-sm border border-gray-100 group-hover:scale-110 transition-all duration-500 group-hover:shadow-indigo-100">
                                {s.name.charAt(0)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-6 text-left">
                            <div className="flex flex-col">
                              <span className="font-extrabold text-gray-800 text-lg group-hover:text-[#003B73] transition-colors">
                                {s.name}
                              </span>
                              <span className="text-[10px] font-bold text-gray-400 font-mono tracking-wider">
                                {s.registerNumber || "NO REGISTER NO"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-6 font-mono font-bold text-[#003B73] text-sm group-hover:text-blue-600">
                            {s.rollNo}
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex flex-col items-center">
                              <span className="font-bold text-gray-700 text-sm">{s.department || "-"}</span>
                              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Sec {s.section || "-"}</span>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex flex-col items-center">
                              <span className="font-bold text-emerald-600 text-sm">{s.batch || "-"}</span>
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg font-black text-[9px] border border-indigo-100 mt-1">
                                Sem {s.semester}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-6 font-bold text-gray-600 text-sm">
                            {s.phoneNumber || "-"}
                          </td>
                          <td className="px-6 py-6">
                            <span className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest border ${s.status === 'ACTIVE' ? 'bg-green-50 text-green-600 border-green-100' :
                                s.status === 'ARREAR' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                  s.status === 'PASSED_OUT' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                    'bg-red-50 text-red-600 border-red-100'
                              }`}>
                              {s.status || 'ACTIVE'}
                            </span>
                          </td>
                          <td className="px-6 py-6 text-right">
                            <div className="flex justify-end gap-2 transition-all duration-300">
                              <button
                                onClick={() => {
                                  const basePath = location.pathname.split('/')[1];
                                  navigate(`/${basePath}/students/profile/${s.id}`);
                                }}
                                className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                title="View Profile"
                              >
                                <User size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingStudent(s);
                                  setShowEditModal(true);
                                }}
                                className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(s.id)}
                                className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    {studentsList.length === 0 && (
                      <tr>
                        <td colSpan="4" className="py-32 text-center">
                          <Users size={64} className="mx-auto mb-4 text-gray-100" />
                          <p className="font-black text-gray-300 text-xl uppercase tracking-widest">
                            Class is Empty
                          </p>
                          <p className="text-gray-300 font-bold mt-1 text-sm">
                            No students registered in this section yet.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Add Student Modal */}
      {
        showCreateModal && (
          <div className="fixed inset-0 bg-[#003B73]/20 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fadeIn">
            <div className="bg-white rounded-[48px] p-10 w-full max-w-2xl shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-3xl font-black text-[#003B73] tracking-tight">
                    New Student
                  </h3>
                  <p className="text-gray-500 font-bold text-sm mt-1">
                    Register a new profile to the system.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-4 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-3xl transition-all"
                >
                  <X size={32} />
                </button>
              </div>

              <form onSubmit={handleCreateStudent} className="space-y-6">
                {/* Photo Upload Section */}
                <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200 hover:border-[#003B73] transition-all group relative overflow-hidden">
                  {newStudent.photo ? (
                    <div className="relative w-32 h-32">
                      <img src={newStudent.photo} alt="Preview" className="w-full h-full object-cover rounded-[24px] shadow-lg" />
                      <button 
                        type="button"
                        onClick={() => setNewStudent({ ...newStudent, photo: '' })}
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
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Upload Photo</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoChange(e)} />
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
                      Roll Number (Primary)
                    </label>
                    <input
                      className="input-field w-full font-mono"
                      placeholder="E123456"
                      value={newStudent.rollNo}
                      onChange={(e) =>
                        setNewStudent({ ...newStudent, rollNo: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
                      Register Number (Optional)
                    </label>
                    <input
                      className="input-field w-full font-mono"
                      placeholder="2021CSE001"
                      value={newStudent.registerNumber}
                      onChange={(e) =>
                        setNewStudent({
                          ...newStudent,
                          registerNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
                      Full Name
                    </label>
                    <input
                      className="input-field w-full"
                      placeholder="John Doe"
                      value={newStudent.name}
                      onChange={(e) =>
                        setNewStudent({ ...newStudent, name: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
                      Department
                    </label>
                    <CustomSelect
                      className="w-full"
                      value={newStudent.department}
                      onChange={(e) =>
                        setNewStudent({
                          ...newStudent,
                          department: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Select Dept</option>
                      {departments
                        .filter((d) => d && d.name?.toLowerCase() !== "first year" && d.code !== (departments.find(dy => dy.name?.toLowerCase() === "first year")?.code || "GEN"))
                        .map((d) => (
                          <option key={d.id} value={d.code || d.name}>
                            {d.code || d.name}
                          </option>
                        ))}
                    </CustomSelect>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
                      Academic Year
                    </label>
                    <CustomSelect
                      className="w-full"
                      value={newStudent.year}
                      onChange={(e) =>
                        setNewStudent({ ...newStudent, year: e.target.value })
                      }
                      required
                    >
                      <option value="">Select Year</option>
                      {selectedCategory === 'FIRST_YEAR' ? (
                        <option value="1">1st Year</option>
                      ) : (
                        ["2", "3", "4"].map((y) => (
                          <option key={y} value={y}>
                            {y} Year
                          </option>
                        ))
                      )}
                    </CustomSelect>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
                      Section
                    </label>
                    <CustomSelect
                      className="w-full"
                      value={newStudent.section}
                      onChange={(e) =>
                        setNewStudent({ ...newStudent, section: e.target.value })
                      }
                      required
                    >
                      <option value="">Select Section</option>
                      {/* For Year 1, show COMMON sections. For 2+, show departmental sections. */}
                      {(newStudent.year === "1"
                        ? dbSections.filter(s => s.semester === (parseInt(newStudent.semester) || 1) && s.type === "COMMON").map(s => s.name)
                        : departments
                          .find(d => d.code === newStudent.department)
                          ?.sections?.split(",") || ["A", "B", "C"]
                      ).filter((v, i, a) => a.indexOf(v) === i).map((s) => (
                        <option key={s} value={s}>
                          Section {s}
                        </option>
                      ))}
                    </CustomSelect>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
                      Semester
                    </label>
                    <CustomSelect
                      className="w-full"
                      value={newStudent.semester}
                      onChange={(e) =>
                        setNewStudent({ ...newStudent, semester: e.target.value })
                      }
                      required
                    >
                      <option value="">Select Sem</option>
                      {selectedCategory === 'FIRST_YEAR' ? (
                        [1, 2].map((s) => (
                          <option key={s} value={s}>
                            Sem {s}
                          </option>
                        ))
                      ) : (
                        [3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>
                            Sem {s}
                          </option>
                        ))
                      )}
                    </CustomSelect>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
                      Regulation
                    </label>
                    <CustomSelect
                      className="w-full"
                      value={newStudent.regulation}
                      onChange={(e) =>
                        setNewStudent({
                          ...newStudent,
                          regulation: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="2021">2021 Regulation</option>
                      <option value="2023">2023 Regulation</option>
                    </CustomSelect>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
                      Batch (e.g. 2021-25)
                    </label>
                    <input
                      className="input-field w-full"
                      placeholder="2021-2025"
                      value={newStudent.batch}
                      onChange={(e) =>
                        setNewStudent({ ...newStudent, batch: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
                      Admission Year
                    </label>
                    <input
                      className="input-field w-full"
                      placeholder="2021"
                      value={newStudent.admissionYear}
                      onChange={(e) =>
                        setNewStudent({ ...newStudent, admissionYear: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Personal Information */}
                <div className="border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-black text-[#003B73] uppercase tracking-widest mb-4">Personal Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="date" className="input-field" placeholder="DOB" value={newStudent.dateOfBirth || ''} onChange={e => setNewStudent({ ...newStudent, dateOfBirth: e.target.value })} />
                    <CustomSelect value={newStudent.gender} onChange={e => setNewStudent({ ...newStudent, gender: e.target.value })}>
                      <option value="">Gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </CustomSelect>
                    <input className="input-field" placeholder="Blood Group" value={newStudent.bloodGroup} onChange={e => setNewStudent({ ...newStudent, bloodGroup: e.target.value })} />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-black text-[#003B73] uppercase tracking-widest mb-4">Contact Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input className="input-field" placeholder="Phone Number" value={newStudent.phoneNumber} onChange={e => setNewStudent({ ...newStudent, phoneNumber: e.target.value })} />
                    <input className="input-field" placeholder="Email Address" value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} />
                    <input className="input-field col-span-2" placeholder="Full Address" value={newStudent.address} onChange={e => setNewStudent({ ...newStudent, address: e.target.value })} />
                  </div>
                </div>

                {/* Parent Details */}
                <div className="border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-black text-[#003B73] uppercase tracking-widest mb-4">Parent Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input className="input-field" placeholder="Father's Name" value={newStudent.fatherName} onChange={e => setNewStudent({ ...newStudent, fatherName: e.target.value })} />
                    <input className="input-field" placeholder="Father's Phone" value={newStudent.fatherPhone} onChange={e => setNewStudent({ ...newStudent, fatherPhone: e.target.value })} />
                    <input className="input-field" placeholder="Mother's Name" value={newStudent.motherName} onChange={e => setNewStudent({ ...newStudent, motherName: e.target.value })} />
                    <input className="input-field" placeholder="Mother's Phone" value={newStudent.motherPhone} onChange={e => setNewStudent({ ...newStudent, motherPhone: e.target.value })} />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-[24px] font-black transition-all transform active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-5 bg-[#003B73] text-white rounded-[24px] font-black hover:bg-[#002850] shadow-xl shadow-blue-900/10 transition-all transform active:scale-95"
                  >
                    Finalize Entry
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* Edit Student Modal */}
      {
        showEditModal && editingStudent && (
          <div className="fixed inset-0 bg-[#003B73]/20 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fadeIn">
            <div className="bg-white rounded-[48px] p-10 w-full max-w-xl shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-3xl font-black text-[#003B73] tracking-tight">
                    Edit Profile
                  </h3>
                  <p className="text-gray-500 font-bold text-sm mt-1">
                    Updating records for {editingStudent.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-4 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-3xl transition-all"
                >
                  <X size={32} />
                </button>
              </div>

              <form onSubmit={handleEditStudent} className="space-y-6">
                {/* Photo Upload Section */}
                <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200 hover:border-[#003B73] transition-all group relative overflow-hidden">
                  {editingStudent.photo ? (
                    <div className="relative w-32 h-32">
                      <img src={editingStudent.photo} alt="Preview" className="w-full h-full object-cover rounded-[24px] shadow-lg" />
                      <button
                        type="button"
                        onClick={() => setEditingStudent({ ...editingStudent, photo: '' })}
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
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Update Photo</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoChange(e, true)} />
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
                      Roll Number
                    </label>
                    <input
                      className="input-field w-full font-mono"
                      value={editingStudent.rollNo}
                      onChange={(e) =>
                        setEditingStudent({
                          ...editingStudent,
                          rollNo: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
                      Register Number
                    </label>
                    <input
                      className="input-field w-full font-mono"
                      value={editingStudent.registerNumber || ""}
                      onChange={(e) =>
                        setEditingStudent({
                          ...editingStudent,
                          registerNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
                      Full Name
                    </label>
                    <input
                      className="input-field w-full"
                      value={editingStudent.name}
                      onChange={(e) =>
                        setEditingStudent({
                          ...editingStudent,
                          name: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
                      Department
                    </label>
                    <CustomSelect
                      className="w-full"
                      value={editingStudent.department || ""}
                      onChange={(e) =>
                        setEditingStudent({
                          ...editingStudent,
                          department: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Select Dept</option>
                      {departments
                        .filter((d) => d && d.name?.toLowerCase() !== "first year" && d.code !== (departments.find(dy => dy.name?.toLowerCase() === "first year")?.code || "GEN"))
                        .map((d) => (
                          <option key={d.id} value={d.code || d.name}>
                            {d.code || d.name}
                          </option>
                        ))}
                    </CustomSelect>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
                      Academic Year
                    </label>
                    <CustomSelect
                      className="w-full"
                      value={editingStudent.year}
                      onChange={(e) => {
                        const year = parseInt(e.target.value);
                        setEditingStudent({
                          ...editingStudent,
                          year: year,
                        });
                      }}
                      required
                    >
                      {selectedCategory === 'FIRST_YEAR' ? (
                        <option value="1">1st Year</option>
                      ) : (
                        ["2", "3", "4"].map((y) => (
                          <option key={y} value={y}>
                            {y} Year
                          </option>
                        ))
                      )}
                    </CustomSelect>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
                      Section
                    </label>
                    <CustomSelect
                      className="w-full"
                      value={editingStudent.section}
                      onChange={(e) =>
                        setEditingStudent({
                          ...editingStudent,
                          section: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Select Section</option>
                      {/* For Year 1, show COMMON sections. For 2+, show departmental sections. */}
                      {(parseInt(editingStudent.year) === 1
                        ? dbSections.filter(s => s.semester === (parseInt(editingStudent.semester) || 1) && s.type === "COMMON").map(s => s.name)
                        : departments
                          .find(d => d.code === editingStudent.department)
                          ?.sections?.split(",") || ["A", "B", "C"]
                      ).filter((v, i, a) => a.indexOf(v) === i).map((s) => (
                        <option key={s} value={s}>
                          Section {s}
                        </option>
                      ))}
                    </CustomSelect>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
                      Semester
                    </label>
                    <CustomSelect
                      className="w-full"
                      value={editingStudent.semester}
                      onChange={(e) =>
                        setEditingStudent({
                          ...editingStudent,
                          semester: parseInt(e.target.value),
                        })
                      }
                      required
                    >
                      {selectedCategory === 'FIRST_YEAR' ? (
                        [1, 2].map((s) => (
                          <option key={s} value={s}>
                            Sem {s}
                          </option>
                        ))
                      ) : (
                        [3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>
                            Sem {s}
                          </option>
                        ))
                      )}
                    </CustomSelect>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
                      Regulation
                    </label>
                    <CustomSelect
                      className="w-full"
                      value={editingStudent.regulation || "2021"}
                      onChange={(e) =>
                        setEditingStudent({
                          ...editingStudent,
                          regulation: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="2021">2021 Regulation</option>
                      <option value="2023">2023 Regulation</option>
                    </CustomSelect>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
                      Batch
                    </label>
                    <input
                      className="input-field w-full"
                      value={editingStudent.batch || ""}
                      onChange={(e) =>
                        setEditingStudent({
                          ...editingStudent,
                          batch: e.target.value,
                        })
                      }
                      placeholder="e.g. 2021-2025"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
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
        )
      }
      {/* Bulk Upload Modal */}
      {
        showBulkModal && (
          <div className="fixed inset-0 bg-emerald-900/20 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fadeIn">
            <div className="bg-white rounded-[48px] p-10 w-full max-w-2xl shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
              {/* Status bar */}
              {bulkUploading && (
                <div className="absolute top-0 left-0 h-1.5 bg-emerald-500 animate-pulse w-full"></div>
              )}

              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-3xl font-black text-emerald-900 tracking-tight">
                    Bulk Student Upload
                  </h3>
                  <p className="text-gray-500 font-bold text-sm mt-1">
                    Import multiple student records via Excel.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowBulkModal(false);
                    setBulkResult(null);
                  }}
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
                      <p className="font-black text-blue-900 text-sm">
                        Need a template?
                      </p>
                      <p className="text-xs text-blue-600 font-bold">
                        Download our pre-formatted Excel file.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                  >
                    Download Template
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Department
                    </label>
                    <CustomSelect
                      value={bulkConfig.department}
                      onChange={(e) =>
                        setBulkConfig({
                          ...bulkConfig,
                          department: e.target.value,
                        })
                      }
                      className="w-full"
                    >
                      <option value="">Auto-Detect</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.code || d.name}>
                          {d.code || d.name}
                        </option>
                      ))}
                    </CustomSelect>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Year
                    </label>
                    <CustomSelect
                      value={bulkConfig.year}
                      onChange={(e) =>
                        setBulkConfig({
                          ...bulkConfig,
                          year: e.target.value,
                          semester: selectedCategory === 'FIRST_YEAR' ? 1 : (e.target.value * 2 - 1),
                        })
                      }
                      className="w-full"
                    >
                      {selectedCategory === 'FIRST_YEAR' ? (
                        <option value="1">Year 1</option>
                      ) : (
                        [2, 3, 4].map((y) => (
                          <option key={y} value={y}>
                            Year {y}
                          </option>
                        ))
                      )}
                    </CustomSelect>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Section
                    </label>
                    <CustomSelect
                      value={bulkConfig.section}
                      onChange={(e) =>
                        setBulkConfig({ ...bulkConfig, section: e.target.value })
                      }
                      className="w-full"
                    >
                      <option value="">Select Section</option>
                      {(parseInt(bulkConfig.year) === 1
                        ? dbSections.filter(s => s.semester === (parseInt(bulkConfig.semester) || 1) && s.type === "COMMON").map(s => s.name)
                        : departments
                          .find(d => d.code === bulkConfig.department || d.name === bulkConfig.department)
                          ?.sections?.split(",") || ["A", "B", "C"]
                      ).filter((v, i, a) => v && a.indexOf(v) === i).map((s) => (
                        <option key={s} value={s}>
                          Section {s}
                        </option>
                      ))}
                    </CustomSelect>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Semester
                    </label>
                    <CustomSelect
                      value={bulkConfig.semester}
                      onChange={(e) =>
                        setBulkConfig({ ...bulkConfig, semester: e.target.value })
                      }
                      className="w-full"
                    >
                      {selectedCategory === 'FIRST_YEAR' ? (
                        [1, 2].map((s) => (
                          <option key={s} value={s}>
                            Sem {s}
                          </option>
                        ))
                      ) : (
                        [3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>
                            Sem {s}
                          </option>
                        ))
                      )}
                    </CustomSelect>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Regulation
                    </label>
                    <CustomSelect
                      value={bulkConfig.regulation}
                      onChange={(e) =>
                        setBulkConfig({
                          ...bulkConfig,
                          regulation: e.target.value,
                        })
                      }
                      className="w-full"
                    >
                      <option value="2021">2021</option>
                      <option value="2023">2023</option>
                    </CustomSelect>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Default Batch
                    </label>
                    <input
                      value={bulkConfig.batch}
                      onChange={(e) =>
                        setBulkConfig({ ...bulkConfig, batch: e.target.value })
                      }
                      placeholder="e.g. 2021-2025"
                      className="input-field w-full"
                    />
                  </div>
                </div>

                {!bulkResult ? (
                  <form onSubmit={handleBulkUpload} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Excel File Input */}
                      <div className="group relative">
                        <input
                          type="file"
                          accept=".xlsx, .xls"
                          onChange={(e) => setBulkFile(e.target.files[0])}
                          className="hidden"
                          id="bulk-file-input"
                        />
                        <label
                          htmlFor="bulk-file-input"
                          className={`flex flex-col items-center justify-center w-full py-10 border-4 border-dashed rounded-[32px] cursor-pointer transition-all ${bulkFile ? "border-emerald-200 bg-emerald-50" : "border-gray-100 bg-gray-50/50 hover:border-blue-200 hover:bg-blue-50/30"}`}
                        >
                          <FileSpreadsheet
                            size={40}
                            className={`mb-3 ${bulkFile ? "text-emerald-500" : "text-gray-300 group-hover:text-blue-400"}`}
                          />
                          <p className={`font-black uppercase tracking-[0.15em] text-[10px] text-center px-4 ${bulkFile ? "text-emerald-600" : "text-gray-400 group-hover:text-blue-900/40"}`}>
                            {bulkFile ? bulkFile.name : "1. SELECT STUDENT EXCEL SHEET"}
                          </p>
                          {bulkFile && (
                            <p className="text-[9px] font-bold text-emerald-400 mt-2">
                              {(bulkFile.size / 1024).toFixed(1)} KB Ready
                            </p>
                          )}
                        </label>
                      </div>

                      {/* ZIP Photo Input */}
                      <div className="group relative">
                        <input
                          type="file"
                          accept=".zip"
                          onChange={(e) => setBulkZipFile(e.target.files[0])}
                          className="hidden"
                          id="bulk-zip-input"
                        />
                        <label
                          htmlFor="bulk-zip-input"
                          className={`flex flex-col items-center justify-center w-full py-10 border-4 border-dashed rounded-[32px] cursor-pointer transition-all ${bulkZipFile ? "border-blue-200 bg-blue-50" : "border-gray-100 bg-gray-50/50 hover:border-blue-200 hover:bg-blue-50/30"}`}
                        >
                          <Upload
                            size={40}
                            className={`mb-3 ${bulkZipFile ? "text-blue-500" : "text-gray-300 group-hover:text-blue-400"}`}
                          />
                          <p className={`font-black uppercase tracking-[0.15em] text-[10px] text-center px-4 ${bulkZipFile ? "text-blue-600" : "text-gray-400 group-hover:text-blue-900/40"}`}>
                            {bulkZipFile ? bulkZipFile.name : "2. SELECT PHOTOS ZIP (OPTIONAL)"}
                          </p>
                          {bulkZipFile && (
                            <p className="text-[9px] font-bold text-blue-400 mt-2">
                              {(bulkZipFile.size / (1024 * 1024)).toFixed(2)} MB Ready
                            </p>
                          )}
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!bulkFile || bulkUploading}
                      className={`w-full py-6 rounded-[32px] font-black text-lg transition-all flex items-center justify-center gap-3 ${!bulkFile || bulkUploading ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xl shadow-emerald-200 active:scale-[0.98]"}`}
                    >
                      {bulkUploading ? (
                        <>
                          <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Processing Records...
                        </>
                      ) : (
                        <>Proceed with Import</>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-8 bg-emerald-50 rounded-[32px] border border-emerald-100 text-center">
                        <p className="text-4xl font-black text-emerald-600 mb-2">
                          {bulkResult.created}
                        </p>
                        <p className="text-xs font-black text-emerald-900/40 uppercase tracking-widest">
                          New Students
                        </p>
                      </div>
                      <div className="p-8 bg-blue-50 rounded-[32px] border border-blue-100 text-center">
                        <p className="text-4xl font-black text-blue-600 mb-2">
                          {bulkResult.updated}
                        </p>
                        <p className="text-xs font-black text-blue-900/40 uppercase tracking-widest">
                          Profiles Updated
                        </p>
                      </div>
                    </div>

                    {bulkResult.errors && bulkResult.errors.length > 0 && (
                      <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                        <div className="flex items-center gap-3 mb-4 text-amber-600">
                          <AlertCircle size={20} />
                          <p className="font-black text-sm uppercase tracking-widest">
                            Issues Found ({bulkResult.errors.length})
                          </p>
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                          {bulkResult.errors.map((err, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center text-xs p-3 bg-white rounded-xl border border-amber-100/50"
                            >
                              <span className="font-mono font-bold text-gray-400">
                                {err.rollNo}
                              </span>
                              <span className="font-bold text-amber-700">
                                {err.error}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setShowBulkModal(false);
                        setBulkResult(null);
                        setBulkFile(null);
                      }}
                      className="w-full py-6 bg-emerald-900 text-white rounded-[32px] font-black text-lg hover:bg-[#003B73] transition-all flex items-center justify-center gap-3 shadow-xl"
                    >
                      <CheckCircle2 size={24} /> Done
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }
      {/* Add Section Modal */}
      {
        showAddSectionModal && (
          <div className="fixed inset-0 bg-[#003B73]/20 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fadeIn">
            <div className="bg-white rounded-[48px] p-10 w-full max-w-sm shadow-2xl border border-gray-100 text-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Plus className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-black text-[#003B73] mb-2">New Section</h3>
              <p className="text-gray-500 font-bold text-sm mb-6">Semester {selectedSemester} (First Year)</p>

              <form onSubmit={handleCreateSection}>
                <input
                  autoFocus
                  className="input-field w-full text-center text-xl uppercase font-black tracking-widest mb-6"
                  placeholder="e.g. A"
                  maxLength={2}
                  value={newSectionName}
                  onChange={e => setNewSectionName(e.target.value.toUpperCase())}
                  required
                />
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowAddSectionModal(false)}
                    className="flex-1 px-6 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-sm hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingSection || !newSectionName.trim()}
                    className="flex-1 px-6 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase text-sm shadow-xl hover:bg-emerald-600 hover:-translate-y-1 transition-all disabled:opacity-50"
                  >
                    {addingSection ? "Adding..." : "Add"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

    </div >
  );
};

export default StudentManager;
