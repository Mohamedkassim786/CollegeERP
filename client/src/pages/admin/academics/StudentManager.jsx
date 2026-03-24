import CustomSelect from "../../../components/CustomSelect";
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
import toast from "react-hot-toast";
import { handleApiError } from "../../../utils/errorHandler";
import { getPhotoUrl, getServerUrl } from "../../../utils/helpers";
import { SEMESTER_OPTIONS } from "../../../utils/constants";
import { 
  getStudents, 
  createStudent, 
  updateStudent, 
  deleteStudent, 
  bulkUploadStudents 
} from "../../../services/student.service";
import { getDepartments, getSections, createSection, deleteSection } from "../../../services/department.service";
import { getArrears, uploadBulkPassedOutArrears } from "../../../services/arrear.service";
import SkeletonLoader from '../../../components/SkeletonLoader';
import CategorySelector from "./student-manager/CategorySelector";
import SemesterSelector from "./student-manager/SemesterSelector";
import { PassedOutSubviewPicker, PassedOutBatchSelector } from "./student-manager/PassedOutComponents";
import StudentFilters from "./student-manager/StudentFilters";
import StudentTable from "./student-manager/StudentTable";
import StudentCreateModal from "./student-manager/StudentCreateModal";
import StudentEditModal from "./student-manager/StudentEditModal";
import StudentBulkModal from "./student-manager/StudentBulkModal";

const StudentManager = ({ readOnly = false }) => {
  const [selectedCategory, setSelectedCategory] = useState(() => sessionStorage.getItem('std_category') || null);
  const [selectedDept, setSelectedDept] = useState(() => sessionStorage.getItem('std_dept') || null);
  const [selectedYear, setSelectedYear] = useState(() => sessionStorage.getItem('std_year') || null);
  const [selectedSemester, setSelectedSemester] = useState(() => sessionStorage.getItem('std_semester') || null);
  const [selectedSection, setSelectedSection] = useState(() => sessionStorage.getItem('std_section') || null);
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
  const [confirmState, setConfirmState] = useState(null);

  // Form Inputs
  const [newStudent, setNewStudent] = useState({
    rollNo: "",
    registerNumber: "",
    name: "",
    department: "",
    departmentId: "",
    year: "",
    section: "",
    semester: "",
    regulation: "2021",
    batch: "",
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
    aadharNumber: "",
    umisNumber: "",
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
    const initializeManager = async () => {
      const { depts, secs } = await fetchDepartments();
      
      if (location.state?.openAddModal) {
        setShowCreateModal(true);
      }

      // Restore student list if filters were previously set
      const savedSection = sessionStorage.getItem('std_section');
      const savedDept = sessionStorage.getItem('std_dept');
      const savedCategory = sessionStorage.getItem('std_category');

      if ((savedSection || savedDept || savedCategory) && studentsList.length === 0) {
        fetchStudents(savedSection || "", depts, secs);
      }
    };

    initializeManager();
  }, [location]);

  // Sync state to sessionStorage
  useEffect(() => {
    if (selectedCategory) sessionStorage.setItem('std_category', selectedCategory);
    else sessionStorage.removeItem('std_category');
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedDept) sessionStorage.setItem('std_dept', selectedDept);
    else sessionStorage.removeItem('std_dept');
  }, [selectedDept]);

  useEffect(() => {
    if (selectedYear) sessionStorage.setItem('std_year', selectedYear);
    else sessionStorage.removeItem('std_year');
  }, [selectedYear]);

  useEffect(() => {
    if (selectedSemester) sessionStorage.setItem('std_semester', selectedSemester);
    else sessionStorage.removeItem('std_semester');
  }, [selectedSemester]);

  useEffect(() => {
    if (selectedSection) sessionStorage.setItem('std_section', selectedSection);
    else sessionStorage.removeItem('std_section');
  }, [selectedSection]);

  const fetchDepartments = async () => {
    setLoadingDepts(true);
    try {
      const [deptRes, secRes] = await Promise.all([
        getDepartments(),
        getSections()
      ]);
      const rawDepts = Array.isArray(deptRes.data) ? deptRes.data : [];
      // Only show Academic departments in Student Manager
      const depts = rawDepts.filter(d => d.type !== 'Support');
      const secs = Array.isArray(secRes.data) ? secRes.data : [];
      setDepartments(depts);
      setDbSections(secs);
      return { depts, secs };
    } catch (err) {
      toast.error("Failed to fetch departments");
      return { depts: [], secs: [] };
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
      const deptObj = departments.find(d => d.code === selectedDept || d.name === selectedDept);
      
      if (selectedYear && deptObj) {
        // Higher Year Department-Specific Creation (Create for both semesters of the year)
        const semStart = selectedYear * 2 - 1;
        const semEnd = selectedYear * 2;
        
        await Promise.all([
          createSection({
            name: newSectionName.toUpperCase(),
            semester: semStart,
            type: "DEPARTMENT",
            departmentId: deptObj.id
          }),
          createSection({
            name: newSectionName.toUpperCase(),
            semester: semEnd,
            type: "DEPARTMENT",
            departmentId: deptObj.id
          })
        ]);
      } else {
        // COMMON Section Creation (e.g., First Year)
        await createSection({
          name: newSectionName.toUpperCase(),
          semester: selectedSemester,
          type: "COMMON",
          departmentId: null
        });
      }

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

  const handleDeleteSection = async (e, sectionId) => {
    e.stopPropagation();
    try {
      await deleteSection(sectionId);
      toast.success("Section deleted successfully");
      fetchDepartments(); // Refresh list
    } catch (err) {
      handleApiError(err, "Failed to delete section");
    }
  };

  const fetchPassedOutArrears = async () => {
    try {
      const res = await getArrears({ type: 'passedout' });
      setPassedOutArrears(res.data);
    } catch (err) {
      console.error("Failed to fetch passed-out arrears");
    }
  };

  const fetchPassedOutBatches = async () => {
    try {
      const res = await getStudents({ status: 'PASSED_OUT' });
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

  const fetchStudents = async (section, overrideDepts = null, overrideSections = null) => {
    const activeDepts = overrideDepts || departments;
    const activeSections = overrideSections || dbSections;
    
    setSelectedSection(section);
    setLoading(true);
    try {
      let params = {};
      const matchingDept = activeDepts.find(d => d.name === selectedDept || d.code === selectedDept);

      if (selectedCategory === 'PASSED_OUT') {
        params.status = 'PASSED_OUT';
        if (section) params.batch = section; 
      } else if (selectedCategory === 'FIRST_YEAR' && selectedSemester) {
        params.semester = selectedSemester;
        const sectionObj = activeSections.find(s => s.name === section && s.semester === selectedSemester && s.type === "COMMON");
        if (sectionObj) {
          params.sectionId = sectionObj.id;
        }
      } else if (matchingDept && selectedYear) {
        // Year-based filter for higher years
        const targetSemesterStart = selectedYear * 2 - 1;
        params.departmentId = matchingDept.id;
        
        // Find sectionId for either semester of that year
        const sectionObj = activeSections.find(s => 
          s.name === section && 
          (s.semester === targetSemesterStart || s.semester === targetSemesterStart + 1) && 
          s.departmentId === matchingDept.id
        );
        
        if (sectionObj) {
          params.sectionId = sectionObj.id;
        }
      }

      const res = await getStudents(params);
      let allStudents = Array.isArray(res.data) ? res.data : [];

      // Strict Frontend Fallback for safety (prevents cross-dept/year leakage)
      const filtered = allStudents.filter((s) => {
        // First Year enforced
        if (selectedCategory === 'FIRST_YEAR') {
          if (String(s.year) !== '1') return false;
        }

        // Department enforced
        if (matchingDept) {
          const deptMatch = s.departmentId === matchingDept.id || 
                            s.department === matchingDept.code || 
                            s.department === matchingDept.name;
          if (!deptMatch) return false;
        }

        // Section enforced
        if (section) {
          const sectionMatch = s.section === section || s.sectionId === params.sectionId;
          if (!sectionMatch) return false;
        }

        // Year enforced
        if (selectedYear) {
          const yearMatch = String(s.year) === String(selectedYear);
          if (!yearMatch) return false;
        }

        return (s.status !== 'PASSED_OUT');
      });

      setStudentsList(filtered);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch students");
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

      await updateStudent(editingStudent.id, formData);
      toast.success("Student Updated Successfully");
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
    
    // Basic validation
    const required = ["rollNo", "name", "department", "year", "section", "semester", "aadharNumber"];
    const missing = required.filter(f => !newStudent[f]);
    
    if (missing.length > 0) {
      toast.error(`Please fill required fields: ${missing.join(", ")}`);
      return;
    }

    const t = toast.loading("Finalizing entry...");
    try {
      const formData = new FormData();
      Object.keys(newStudent).forEach((key) => {
        const val = newStudent[key];
        // Only append non-object, non-null values
        if (key !== "photoFile" && val !== null && val !== undefined && typeof val !== 'object') {
          formData.append(key, val);
        }
      });
      // Append physical file if newly uploaded
      if (newStudent.photoFile) {
        formData.append("photo", newStudent.photoFile);
      }

      await createStudent(formData);
      toast.dismiss(t);
      toast.success("Student Added Successfully");
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
        photo: "",
        dateOfBirth: "",
        gender: "",
        bloodGroup: "",
        nationality: "",
        phoneNumber: "",
        email: "",
        address: "",
        fatherName: "",
        fatherPhone: "",
        motherName: "",
        motherPhone: "",
        status: "ACTIVE",
        aadharNumber: "",
        umisNumber: ""
      });
      fetchStudents(selectedSection);
    } catch (err) {
      toast.dismiss(t);
      handleApiError(err, "Error adding student");
      console.error("Submission error:", err);
    }
  };

  const handleDeleteStudent = async (id) => {
    try {
      await deleteStudent(id);
      setStudentsList(studentsList.filter((s) => s.id !== id));
      toast.success("Student deleted");
    } catch (err) {
      handleApiError(err, "Failed to delete student");
    }
  };

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Students");

    worksheet.mergeCells("A2:F2");
    const titleCell = worksheet.getCell("A2");
    titleCell.value = "STUDENT BULK UPLOAD TEMPLATE - ALL DEPARTMENTS";
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: "center" };

    worksheet.getRow(3).values = [
      "S.No", "Roll No", "Register No", "Student Name", 
      "Department", "Year", "Semester", "Section", "Regulation", "Batch",
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
      { key: "department", width: 15 },
      { key: "year", width: 10 },
      { key: "semester", width: 10 },
      { key: "section", width: 10 },
      { key: "regulation", width: 15 },
      { key: "batch", width: 15 },
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
      rollNo: "E1245001",
      registerNumber: "812424104001",
      name: "ARJUN K",
      department: "COMPUTER SCIENCE AND ENGINEERING",
      year: 1,
      semester: 1,
      section: "A",
      regulation: "2023",
      batch: "2024-2028",
      dateOfBirth: "01/05/2006",
      gender: "Male",
      bloodGroup: "O+",
      phoneNumber: "9876543210",
      email: "arjun@example.com",
      photo: "E1245001.jpg"
    });

    worksheet.addRow({
      sno: 2,
      rollNo: "E1244001",
      registerNumber: "812424106001",
      name: "MEERA S",
      department: "ECE",
      year: 1,
      semester: 1,
      section: "A",
      regulation: "2023",
      batch: "2024-2028",
      dateOfBirth: "12/10/2006",
      gender: "Female",
      bloodGroup: "A+",
      photo: "E1244001.png"
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

      let sessionBatch = bulkConfig.batch || "";
      let headerKeys = { 
        name: -1, rollNo: -1, registerNumber: -1,
        department: -1, year: -1, semester: -1, section: -1, regulation: -1, batch: -1,
        dateOfBirth: -1, gender: -1, bloodGroup: -1, nationality: -1,
        phoneNumber: -1, email: -1, address: -1, 
        fatherName: -1, fatherPhone: -1, motherName: -1, motherPhone: -1, photoURL: -1
      };
      let headersFound = false;

      worksheet.eachRow((row, rowNumber) => {
        if (!headersFound) {
          let tempMap = { 
            name: -1, rollNo: -1, registerNumber: -1,
            department: -1, year: -1, semester: -1, section: -1, regulation: -1, batch: -1,
            dateOfBirth: -1, gender: -1, bloodGroup: -1, nationality: -1,
            phoneNumber: -1, email: -1, address: -1, 
            fatherName: -1, fatherPhone: -1, motherName: -1, motherPhone: -1, photoURL: -1
          };
          row.eachCell((cell, colNumber) => {
            const text = String(cell.text || "").toLowerCase().replace(/[^a-z]/g, '');
            if (text === "name" || text === "studentname") tempMap.name = colNumber;
            else if (text.includes("roll")) tempMap.rollNo = colNumber;
            else if (text.includes("reg") && !text.includes("regulation")) tempMap.registerNumber = colNumber;
            else if (text === "department" || text === "dept") tempMap.department = colNumber;
            else if (text === "year") tempMap.year = colNumber;
            else if (text === "semester" || text === "sem") tempMap.semester = colNumber;
            else if (text === "section" || text === "sec") tempMap.section = colNumber;
            else if (text === "regulation" || text === "regu") tempMap.regulation = colNumber;
            else if (text === "batch") tempMap.batch = colNumber;
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

          // Auto-detect Batch from header row (Row 2 usually contains it)
          let headerText = "";
          row.eachCell((cell) => {
            headerText += " " + String(cell.text || "");
          });
          
          const batchMatch = headerText.match(/(\d{4})[^\d](\d{4})/);
          if (batchMatch) {
            const detectedBatch = `${batchMatch[1]}-${batchMatch[2]}`;
            console.log(`[BulkDebug] Detected Batch: ${detectedBatch}`);
            sessionBatch = detectedBatch;
            setBulkConfig(prev => ({ ...prev, batch: detectedBatch }));
          }
          return;
        }

        // Extract data
        const nameVal = headerKeys.name !== -1 ? String(row.getCell(headerKeys.name).text || "").trim() : "";
        const rollVal = headerKeys.rollNo !== -1 ? String(row.getCell(headerKeys.rollNo).text || "").trim() : "";
        const regVal = headerKeys.registerNumber !== -1 ? String(row.getCell(headerKeys.registerNumber).text || "").trim() : "";
        
        const deptVal = headerKeys.department !== -1 ? String(row.getCell(headerKeys.department).text || "").trim() : "";
        const yearVal = headerKeys.year !== -1 ? String(row.getCell(headerKeys.year).text || "").trim() : "";
        const semVal = headerKeys.semester !== -1 ? String(row.getCell(headerKeys.semester).text || "").trim() : "";
        const secVal = headerKeys.section !== -1 ? String(row.getCell(headerKeys.section).text || "").trim() : "";
        const reguVal = headerKeys.regulation !== -1 ? String(row.getCell(headerKeys.regulation).text || "").trim() : "";
        const bchVal = headerKeys.batch !== -1 ? String(row.getCell(headerKeys.batch).text || "").trim() : "";

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

          // Preference: Excel Value > Bulk Config > Selected Context
          const finalDept = deptVal || bulkConfig.department || selectedDept;
          const finalYear = yearVal || bulkConfig.year;
          const finalSem = semVal || bulkConfig.semester;
          const finalSec = secVal || bulkConfig.section;
          const finalRegu = reguVal || bulkConfig.regulation || "2021";
          const finalBatch = bchVal || sessionBatch || "";

          students.push({
            rollNo: finalRoll,
            registerNumber: regVal || null,
            name: nameVal,
            department: finalDept,
            year: parseInt(finalYear),
            section: finalSec,
            semester: parseInt(finalSem),
            regulation: finalRegu,
            batch: finalBatch,
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

      const res = await bulkUploadStudents(formData);
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
    <div className="flex flex-col animate-fadeIn">
      <div className="mb-8 p-4 bg-white rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-[#003B73] tracking-tight">
            Student Management
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Navigate and manage student records across all departments.
          </p>
        </div>

        {!readOnly && selectedCategory && selectedCategory !== 'PASSED_OUT' && (
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
                  {departments.find(d => d.code === selectedDept || d.name === selectedDept)?.name || selectedDept}
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
          <PassedOutSubviewPicker onSelect={setPassedOutSubview} />
        )}

        {/* PASSED OUT — Students (batch selection) */}
        {selectedCategory === 'PASSED_OUT' && passedOutSubview === 'STUDENTS' && !selectedSection && (
          <PassedOutBatchSelector batches={passedOutBatches} onSelect={fetchStudents} />
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
                      const res = await uploadBulkPassedOutArrears({ records });
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
            {dbSections.filter(s => s.semester === selectedSemester && s.type === "COMMON").map((secObj) => (
              <div
                key={`common-${secObj.id}`}
                onClick={() => fetchStudents(secObj.name)}
                className="group p-10 bg-emerald-50/50 hover:bg-emerald-600 rounded-[32px] cursor-pointer transition-all duration-500 border border-emerald-100 hover:shadow-2xl hover:shadow-emerald-200 flex flex-col items-center justify-center text-center relative"
              >
                {/* Delete Button for Empty Sections */}
                {secObj._count?.students === 0 && (
                  <button
                    onClick={(e) => handleDeleteSection(e, secObj.id)}
                    className="absolute top-6 right-6 p-2 bg-white text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 shadow-sm"
                    title="Delete Section"
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-white/20 transition-all duration-500 mb-6">
                  <Users className="w-8 h-8 text-emerald-600 group-hover:text-white" />
                </div>
                <h3 className="text-2xl font-black text-emerald-900 group-hover:text-white uppercase transition-colors">
                  Section {secObj.name}
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
              }).map(s => s.name).filter((v, i, a) => a.indexOf(v) === i).map((secName) => {
                const matchingSections = dbSections.filter(s => 
                  s.name === secName && 
                  s.departmentId === departments.find(d => d.name === selectedDept || d.code === selectedDept)?.id &&
                  (s.semester === selectedYear * 2 - 1 || s.semester === selectedYear * 2)
                );
                
                // Represent this grouped section cluster using the first section object for the ID
                const sectionObj = matchingSections[0];
                const totalStudentsInYear = matchingSections.reduce((sum, s) => sum + (s._count?.students || 0), 0);
                
                return (
                  <div
                    key={`dept-${secName}`}
                    onClick={() => fetchStudents(secName)}
                    className="group p-10 bg-emerald-50/50 hover:bg-emerald-600 rounded-[32px] cursor-pointer transition-all duration-500 border border-emerald-100 hover:shadow-2xl hover:shadow-emerald-200 flex flex-col items-center justify-center text-center relative"
                  >
                    {/* Delete Button for Empty Sections */}
                    {totalStudentsInYear === 0 && sectionObj && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmState({ action: 'delete-section', id: sectionObj.id, message: `Are you sure you want to delete Section ${secName}?` });
                        }}
                        className="absolute top-6 right-6 p-2 bg-white text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 shadow-sm"
                        title="Delete Section"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}

                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-white/20 transition-all duration-500 mb-6">
                      <Users className="w-8 h-8 text-emerald-600 group-hover:text-white" />
                    </div>
                    <h3 className="text-2xl font-black text-emerald-900 group-hover:text-white uppercase transition-colors">
                      Section {secName}
                    </h3>
                    <p className="text-xs font-black text-emerald-500 group-hover:text-emerald-100 mt-2 uppercase tracking-widest">
                      View Roster
                    </p>
                  </div>
                );
              })
            ) : null}

            {/* Add Section Button for Department/Year */}
            {!readOnly && (
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
                Yearly Setup
              </p>
            </div>
            )}
          </div>
        )}


        {/* Level 4: List */}
        {selectedSection && (
          <div className="animate-fadeIn relative z-10 h-full">
            <div className="bg-white/50 rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <StudentFilters 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                batchFilter={batchFilter}
                setBatchFilter={setBatchFilter}
              />
              
              <StudentTable 
                students={studentsList}
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                batchFilter={batchFilter}
                loading={loading}
                readOnly={readOnly}
                onViewProfile={(id) => {
                  const basePath = location.pathname.split('/')[1];
                  navigate(`/${basePath}/students/profile/${id}`);
                }}
                onEdit={(s) => {
                  setEditingStudent(s);
                  setShowEditModal(true);
                }}
                onDelete={(s) => {
                  setConfirmState({ 
                    action: 'delete-student', 
                    id: s.id, 
                    message: `Delete student ${s.rollNo}? This will erase all marks.` 
                  });
                }}
              />
            </div>
          </div>
        )}
      </div>

      {confirmState && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fadeIn">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 relative shadow-2xl border border-red-100 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-[20px] flex items-center justify-center mb-6 shadow-sm">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-2xl font-black text-red-900 mb-2 tracking-tight uppercase">Confirm Action</h2>
            <p className="text-red-700/80 font-bold text-sm mb-8">{confirmState.message}</p>
            
            <div className="flex gap-4 w-full">
              <button
                onClick={() => setConfirmState(null)}
                className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all font-black"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmState.action === 'delete-student') handleDeleteStudent(confirmState.id);
                  if (confirmState.action === 'delete-section') handleDeleteSection({ stopPropagation: () => {} }, confirmState.id);
                  setConfirmState(null);
                }}
                className="flex-1 py-4 bg-red-600 text-white rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-900/20 transition-all font-black"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <StudentCreateModal 
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateStudent}
        data={newStudent}
        setData={setNewStudent}
        departments={departments}
        dbSections={dbSections}
        selectedCategory={selectedCategory}
        onPhotoChange={handlePhotoChange}
      />


      <StudentEditModal 
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleEditStudent}
        data={editingStudent}
        setData={setEditingStudent}
        departments={departments}
        dbSections={dbSections}
        selectedCategory={selectedCategory}
        onPhotoChange={handlePhotoChange}
      />

      <StudentBulkModal 
        show={showBulkModal}
        onClose={() => {
          setShowBulkModal(false);
          setBulkResult(null);
        }}
        onUpload={handleBulkUpload}
        uploading={bulkUploading}
        result={bulkResult}
        onDownloadTemplate={downloadTemplate}
      />
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
