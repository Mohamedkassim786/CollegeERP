const prisma = require('../lib/prisma');
const { handleError } = require('../utils/errorUtils');
const pdfService = require('../services/pdf.service.js');
const { logger } = require('../utils/logger');

const createStudent = async (req, res) => {
    let { 
        rollNo, registerNumber, name, department, year, section, semester, regulation, batch,
        dateOfBirth, gender, bloodGroup, nationality,
        phoneNumber, email, address, city, district, state, pincode,
        fatherName, fatherPhone, motherName, motherPhone, guardianName, guardianPhone,
        status: studentStatus,
    } = req.body;
    
    // Explicitly override photo with the uploaded filename if present
    let photo = req.file ? req.file.filename : (req.body.photo || "default-avatar.png");
    
    try {
        const parsedYear = parseInt(year) || 1;
        const parsedSemester = parseInt(semester) || 1;

        // Relational Support Resolver
        let targetDeptId = req.body.departmentId && !isNaN(parseInt(req.body.departmentId)) ? parseInt(req.body.departmentId) : null;
        let targetSecId = req.body.sectionId && !isNaN(parseInt(req.body.sectionId)) ? parseInt(req.body.sectionId) : null;
        let academicYearId = req.body.academicYearId;

        if (!academicYearId) {
            const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
            if (!activeYear) {
                return res.status(400).json({ 
                    message: "No active academic year found. Please go to Settings > Academic Years and set an active year first." 
                });
            }
            academicYearId = activeYear.id;
        } else {
            academicYearId = parseInt(academicYearId);
        }

        // Keep legacy department/section strings in sync with IDs
        if (targetDeptId) {
            const deptObj = await prisma.department.findUnique({ where: { id: targetDeptId } });
            if (deptObj) department = deptObj.code || deptObj.name;
        } else if (department) {
            const allDepts = await prisma.department.findMany();
            const deptText = department.trim().toUpperCase();
            const deptObj = allDepts.find(d =>
                (d.code && d.code.toUpperCase() === deptText) ||
                (d.name && d.name.toUpperCase() === deptText)
            );
            if (deptObj) {
                targetDeptId = deptObj.id;
                department = deptObj.code || deptObj.name;
            }
        }

        if (targetSecId) {
            const secObj = await prisma.section.findUnique({ where: { id: targetSecId } });
            if (secObj) section = secObj.name;
        } else if (section && parsedSemester) {
            const isFirstYear = parsedSemester <= 2;
            let secObj = await prisma.section.findFirst({
                where: { name: section, semester: parsedSemester, departmentId: isFirstYear ? null : targetDeptId, academicYearId }
            });
            if (!secObj) {
                secObj = await prisma.section.create({
                    data: { name: section, semester: parsedSemester, type: isFirstYear ? "COMMON" : "DEPARTMENT", departmentId: isFirstYear ? null : targetDeptId, academicYearId }
                });
            }
            targetSecId = secObj.id;
        }

        let parsedBatchYear = null;
        if (batch && typeof batch === 'string') {
            const parts = batch.split('-');
            if (parts.length > 0 && parts[0] && !isNaN(parseInt(parts[0]))) {
                parsedBatchYear = String(parseInt(parts[0]));
            }
        } else if (batch && (typeof batch === 'number' || typeof batch === 'string')) {
            const bNum = parseInt(batch);
            if (!isNaN(bNum)) parsedBatchYear = String(bNum);
        }

        const student = await prisma.student.create({
            data: {
                rollNo,
                registerNumber,
                name,
                department, // Legacy String
                year: parsedYear, // Legacy String
                section, // Legacy String
                semester: parseInt(semester), // Legacy String
                regulation: regulation || "2021",
                batch,
                departmentId: targetDeptId,
                sectionId: targetSecId,
                currentSemester: parseInt(semester),
                batchYear: parsedBatchYear,
                academicYearId: academicYearId,
                photo,
                dateOfBirth,
                gender,
                bloodGroup,
                nationality,
                phoneNumber,
                email,
                address,
                city,
                district,
                state,
                pincode,
                fatherName,
                fatherPhone,
                motherName,
                motherPhone,
                guardianName,
                guardianPhone,
                status: studentStatus || "ACTIVE",
            }
        });
        res.status(201).json(student);
    } catch (error) {
        handleError(res, error, "Error creating student");
    }
};

const updateStudent = async (req, res) => {
    const { id } = req.params;
    let { 
        rollNo, registerNumber, name, department, year, section, semester, regulation, batch,
        dateOfBirth, gender, bloodGroup, nationality,
        phoneNumber, email, address, city, district, state, pincode,
        fatherName, fatherPhone, motherName, motherPhone, guardianName, guardianPhone,
        status: studentStatus,
    } = req.body;
    
    // Explicitly override photo with the uploaded filename if present
    let photo = req.file ? req.file.filename : req.body.photo;
    try {
        const studentId = parseInt(id);
        const parsedYear = parseInt(year) || 1;
        const parsedSemester = parseInt(semester) || 1;

        // Relational Support Resolver
        let targetDeptId = req.body.departmentId && !isNaN(parseInt(req.body.departmentId)) ? parseInt(req.body.departmentId) : null;
        let targetSecId = req.body.sectionId && !isNaN(parseInt(req.body.sectionId)) ? parseInt(req.body.sectionId) : null;
        let academicYearId = req.body.academicYearId;

        if (!academicYearId) {
            const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
            academicYearId = activeYear ? activeYear.id : 1;
        } else {
            academicYearId = parseInt(academicYearId);
        }

        // Keep legacy department/section strings in sync with IDs
        if (targetDeptId) {
            const deptObj = await prisma.department.findUnique({ where: { id: targetDeptId } });
            if (deptObj) department = deptObj.code || deptObj.name;
        } else if (department) {
            const allDepts = await prisma.department.findMany();
            const deptText = department.trim().toUpperCase();
            const deptObj = allDepts.find(d =>
                (d.code && d.code.toUpperCase() === deptText) ||
                (d.name && d.name.toUpperCase() === deptText)
            );
            if (deptObj) {
                targetDeptId = deptObj.id;
                department = deptObj.code || deptObj.name;
            }
        }

        if (targetSecId) {
            const secObj = await prisma.section.findUnique({ where: { id: targetSecId } });
            if (secObj) section = secObj.name;
        } else if (section && parsedSemester) {
            const isFirstYear = parsedSemester <= 2;
            let secObj = await prisma.section.findFirst({
                where: { name: section, semester: parsedSemester, departmentId: isFirstYear ? null : targetDeptId, academicYearId }
            });
            if (!secObj) {
                secObj = await prisma.section.create({
                    data: { name: section, semester: parsedSemester, type: isFirstYear ? "COMMON" : "DEPARTMENT", departmentId: isFirstYear ? null : targetDeptId, academicYearId }
                });
            }
            targetSecId = secObj.id;
        }

        let parsedBatchYear = null;
        if (batch && typeof batch === 'string') {
            const parts = batch.split('-');
            if (parts.length > 0 && parts[0] && !isNaN(parseInt(parts[0]))) {
                parsedBatchYear = String(parseInt(parts[0]));
            }
        } else if (batch && (typeof batch === 'number' || typeof batch === 'string')) {
            const bNum = parseInt(batch);
            if (!isNaN(bNum)) parsedBatchYear = String(bNum);
        }

        const student = await prisma.student.update({
            where: { id: studentId },
            data: {
                rollNo,
                registerNumber,
                name,
                department, // Legacy
                year: parsedYear, // Legacy
                section, // Legacy
                semester: parseInt(semester), // Legacy
                regulation,
                batch,
                departmentId: targetDeptId,
                sectionId: targetSecId,
                currentSemester: parseInt(semester),
                batchYear: parsedBatchYear,
                academicYearId: academicYearId,
                photo,
                dateOfBirth,
                gender,
                bloodGroup,
                nationality,
                phoneNumber,
                email,
                address,
                city,
                district,
                state,
                pincode,
                fatherName,
                fatherPhone,
                motherName,
                motherPhone,
                guardianName,
                guardianPhone,
                status: studentStatus,
            }
        });
        res.json(student);
    } catch (error) {
        handleError(res, error, "Error updating student");
    }
};

const deleteStudent = async (req, res) => {
    const { id } = req.params;
    try {
        const studentId = parseInt(id);

        const publishedResults = await prisma.endSemMarks.findFirst({
            where: {
                marks: { studentId },
                OR: [{ isPublished: true }, { isLocked: true }]
            }
        });

        if (publishedResults) {
            return res.status(403).json({
                message: 'CRITICAL: Cannot delete student with published or locked results.'
            });
        }

        // Find related nested records to delete safely without relation filters
        const studentMarks = await prisma.marks.findMany({ where: { studentId }, select: { id: true }});
        const marksIds = studentMarks.map(m => m.id);

        const studentArrears = await prisma.arrear.findMany({ where: { studentId }, select: { id: true }});
        const arrearIds = studentArrears.map(a => a.id);

        const dummyMappings = await prisma.subjectDummyMapping.findMany({
            where: { studentId }
        });
        const dummyNumbers = dummyMappings.map(m => m.dummyNumber).filter(Boolean);

        await prisma.$transaction([
            prisma.externalMark.deleteMany({ where: { dummyNumber: { in: dummyNumbers } } }),
            prisma.endSemMarks.deleteMany({ where: { marksId: { in: marksIds } } }),
            prisma.marks.deleteMany({ where: { studentId } }),
            prisma.studentAttendance.deleteMany({ where: { studentId } }),
            prisma.attendanceEligibility.deleteMany({ where: { studentId } }),
            prisma.subjectDummyMapping.deleteMany({ where: { studentId } }),
            prisma.semesterResult.deleteMany({ where: { studentId } }),
            prisma.hallAllocation.deleteMany({ where: { studentId } }),
            prisma.markAuditLog.deleteMany({ where: { studentId } }),
            prisma.arrearAttempt.deleteMany({ where: { arrearId: { in: arrearIds } } }),
            prisma.arrear.deleteMany({ where: { studentId } }),
            prisma.student.delete({ where: { id: studentId } })
        ]);

        res.json({ message: 'Student and related records deleted' });
    } catch (error) {
        handleError(res, error, "Failed to delete student");
    }
};

const getStudents = async (req, res) => {
    try {
        const { semester, departmentId, sectionId, status, batch, page, limit } = req.query;
        let whereClause = {};

        if (status) {
            whereClause.status = status;
        }

        if (batch) {
            whereClause.OR = [
                { batch: batch },
                { batchYear: batch }
            ];
        }

        // Apply high-performance filtering if parameters are passed
        if (semester) {
            whereClause.semester = parseInt(semester);
        }
        
        if (departmentId) {
            whereClause.departmentId = parseInt(departmentId);
        }

        if (sectionId) {
            whereClause.sectionId = parseInt(sectionId);
        }

        // Default to ACTIVE if no status filter and looking for specific academic groups
        if (!status && (semester || departmentId || sectionId)) {
            whereClause.status = 'ACTIVE';
        }

        // Handle Hybrid Pagination
        if (page && limit) {
            const pageNum = parseInt(page) || 1;
            const limitNum = parseInt(limit) || 50;
            const skip = (pageNum - 1) * limitNum;

            const [students, total] = await Promise.all([
                prisma.student.findMany({
                    where: whereClause,
                    include: {
                        departmentRef: true,
                        sectionRef: true,
                        academicYear: true
                    },
                    orderBy: { registerNumber: 'asc' },
                    skip,
                    take: limitNum
                }),
                prisma.student.count({ where: whereClause })
            ]);

            return res.json({
                students,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum)
                }
            });
        }

        const students = await prisma.student.findMany({
            where: whereClause,
            include: {
                departmentRef: true,
                sectionRef: true,
                academicYear: true
            },
            orderBy: { registerNumber: 'asc' }
        });
        res.json(students);
    } catch (error) {
        handleError(res, error, "Error fetching students");
    }
};

const promoteStudents = async (req, res) => {
    const { studentIds, department, section, semester, year, currentSectionId, nextSemester, departmentSectionMap, targetSectionId, nextAcademicYearId } = req.body;
    try {
        // Resolve Active Academic Year if not provided
        let activeAY = null;
        if (!nextAcademicYearId) {
            activeAY = await prisma.academicYear.findFirst({ where: { isActive: true } });
        }
        const resolvedAYId = nextAcademicYearId ? parseInt(nextAcademicYearId) : (activeAY?.id || 1);

        // ✅ FIX Bug #10: Check if results are published before promoting
        // Prevents students being promoted before their semester results are officially published
        if (currentSectionId) {
            const sectionStudents = await prisma.student.findMany({
                where: { sectionId: parseInt(currentSectionId), status: 'ACTIVE' },
                select: { department: true, year: true, semester: true, section: true }
            });
            if (sectionStudents.length > 0) {
                const sample = sectionStudents[0];
                const semControl = await prisma.semesterControl.findFirst({
                    where: {
                        department: sample.department || '',
                        year: sample.year,
                        semester: sample.semester,
                        section: sample.section
                    }
                });
                if (semControl && !semControl.isPublished) {
                    return res.status(400).json({
                        message: `Cannot promote students. Results for ${sample.department} Year ${sample.year} Sem ${sample.semester} Section ${sample.section} have not been published yet. Please publish results before promotion.`
                    });
                }
            }
        }

        // Relational Architecture Branch (Phase 2+)
        if (currentSectionId && nextSemester) {
            const students = await prisma.student.findMany({
                where: { sectionId: parseInt(currentSectionId), status: 'ACTIVE' }
            });

            if (students.length === 0) return res.status(400).json({ message: "No active students found in section." });

            let updatedCount = 0;
            await prisma.$transaction(async (tx) => {
                // Fetch target section/department names for legacy sync
                const targetSection = await tx.section.findUnique({
                    where: { id: parseInt(targetSectionId || targetSectionId) }, // Initial check, might be overridden in loop
                    include: { departmentRef: true }
                });

                for (const student of students) {
                    let assignedSectionId = targetSectionId;
                    let assignedSectionName = targetSection?.name;
                    let assignedDeptName = targetSection?.departmentRef?.code || targetSection?.departmentRef?.name;

                    if (parseInt(nextSemester) === 3 && departmentSectionMap) {
                        assignedSectionId = departmentSectionMap[student.departmentId];
                        if (!assignedSectionId) throw new Error(`Missing target section mapping for department ID ${student.departmentId}`);
                        
                        // Re-fetch for specific dept-based section if needed
                        const specificSec = await tx.section.findUnique({
                            where: { id: parseInt(assignedSectionId) },
                            include: { departmentRef: true }
                        });
                        assignedSectionName = specificSec?.name;
                        assignedDeptName = specificSec?.departmentRef?.code || specificSec?.departmentRef?.name;
                    }

                    if (!assignedSectionId) throw new Error("Target section ID is required.");

                    await tx.student.update({
                        where: { id: student.id },
                        data: {
                            currentSemester: parseInt(nextSemester),
                            sectionId: parseInt(assignedSectionId),
                            academicYearId: resolvedAYId,
                            // Legacy sync
                            semester: parseInt(nextSemester),
                            year: Math.ceil(parseInt(nextSemester) / 2),
                            section: assignedSectionName || student.section,
                            department: assignedDeptName || student.department
                        }
                    });

                    // Create Promotion Log
                    await tx.activityLog.create({
                        data: {
                            action: 'STUDENT_PROMOTION',
                            description: `Promoted to Sem ${nextSemester} ${section || ''}`,
                            performedBy: parseInt(req.user.id),
                            targetId: student.id
                        }
                    });

                    updatedCount++;
                }
            });
            return res.json({ message: `Successfully promoted ${updatedCount} students`, count: updatedCount });
        }

        // Legacy String Architecture Branch (Year 3 / 4 fallback)
        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ message: "No students selected for promotion" });
        }

        const students = await prisma.student.findMany({
            where: { id: { in: studentIds.map(id => parseInt(id)) } },
            select: { id: true, registerNumber: true, rollNo: true }
        });

        const ineligible = students.filter(s => !s.registerNumber);
        if (ineligible.length > 0) {
            return res.status(400).json({
                message: "Register Number must be assigned before promotion.",
                details: `Students missing Register Number: ${ineligible.map(s => s.rollNo).join(', ')}`
            });
        }

        // Legacy String Architecture Branch - Resolve Relational IDs for consistency
        const studentsToUpdate = students.map(s => s.id);
        const resolvedSemester = parseInt(semester);
        const resolvedYear = parseInt(year);

        let targetDeptId = null;
        let standardizedDept = department;
        if (department) {
            const allDepts = await prisma.department.findMany();
            const deptText = String(department).trim().toUpperCase();
            const deptObj = allDepts.find(d =>
                (d.code && d.code.toUpperCase() === deptText) ||
                (d.name && d.name.toUpperCase() === deptText)
            );
            if (deptObj) {
                targetDeptId = deptObj.id;
                standardizedDept = deptObj.code || deptObj.name;
            }
        }

        // Resolve Section ID
        let targetSecId = null;
        if (section && resolvedSemester) {
            const isFirstYear = resolvedSemester <= 2;
            const secObj = await prisma.section.findFirst({
                where: {
                    name: section,
                    semester: resolvedSemester,
                    departmentId: isFirstYear ? null : targetDeptId,
                    academicYearId: resolvedAYId
                }
            });
            if (secObj) targetSecId = secObj.id;
        }

        const result = await prisma.student.updateMany({
            where: { id: { in: studentIds.map(id => parseInt(id)) } },
            data: {
                department: standardizedDept,
                section: section,
                semester: resolvedSemester,
                year: resolvedYear,
                departmentId: targetDeptId,
                sectionId: targetSecId,
                currentSemester: resolvedSemester
            }
        });

        res.json({ message: `Successfully promoted ${result.count} students`, count: result.count });
    } catch (error) {
        handleError(res, error, "Error promoting students");
    }
};

const { extractPhotosFromZip } = require('../utils/zipExtractor');

const bulkUploadStudents = async (req, res) => {
    // Note: Due to multer parsing, 'students' might come in as a stringified JSON array
    let students = req.body.students;
    if (typeof students === 'string') {
        try {
            students = JSON.parse(students);
        } catch(e) {
            return res.status(400).json({ message: 'Invalid students JSON format' });
        }
    }

    try {
        if (!students || !Array.isArray(students)) {
            return res.status(400).json({ message: 'Invalid student data format' });
        }

        let createdCount = 0;
        let updatedCount = 0;
        let errors = [];
        let zipInfo = null;

        // Process ZIP if provided
        if (req.files && req.files['photosZip'] && req.files['photosZip'].length > 0) {
            const zipFile = req.files['photosZip'][0];
            try {
                zipInfo = await extractPhotosFromZip(zipFile.buffer);
            } catch (zipError) {
                console.error("ZIP Extraction Failed:", zipError);
                errors.push({ type: 'ZIP_ERROR', error: 'Failed to extract photos ZIP' });
            }
        }

        const allDepts = await prisma.department.findMany();
        const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
        const academicYearId = activeYear ? activeYear.id : 1; // Fallback to 1 if none active

        for (const s of students) {
            let { 
                rollNo, registerNumber, name, department, year, section, semester, regulation, batch,
                photo, dateOfBirth, gender, bloodGroup, nationality,
                phoneNumber, email, address, city, district, state, pincode,
                fatherName, fatherPhone, motherName, motherPhone, guardianName, guardianPhone,
                status: studentStatus,
            } = s;

            if (!rollNo) {
                errors.push({ rollNo: 'MISSING', error: 'Roll Number is mandatory' });
                continue;
            }

            rollNo = String(rollNo).trim();
            
            // Apply fallback photo immediately to ensure all mapped fields have a valid string.
            // If the ZIP payload doesn't map to this string, it'll still point to the client view default.
            photo = photo || 'default-avatar.png';

            try {
                let targetDeptId = null;
                let targetSecId = null;

                const parsedYear = parseInt(year) || 1;
                const parsedSemester = parseInt(semester) || 1;

                if (department) {
                    const deptText = String(department).trim().toUpperCase();
                    const deptObj = allDepts.find(d =>
                        (d.code && d.code.toUpperCase() === deptText) ||
                        (d.name && d.name.toUpperCase() === deptText)
                    );
                    if (deptObj) {
                        targetDeptId = deptObj.id;
                        department = deptObj.code || deptObj.name;
                    }
                }

                if (section && parsedSemester) {
                    const isFirstYear = parsedSemester <= 2;
                    let secObj = await prisma.section.findFirst({
                        where: { name: section, semester: parsedSemester, departmentId: isFirstYear ? null : targetDeptId, academicYearId }
                    });
                    if (!secObj) {
                        secObj = await prisma.section.create({
                            data: { name: section, semester: parsedSemester, type: isFirstYear ? "COMMON" : "DEPARTMENT", departmentId: isFirstYear ? null : targetDeptId, academicYearId }
                        });
                    }
                    targetSecId = secObj.id;
                }

                let parsedBatchYear = null;
                if (batch && typeof batch === 'string') {
                    const parts = batch.split('-');
                    if (parts.length > 0 && parts[0] && !isNaN(parseInt(parts[0]))) {
                        parsedBatchYear = String(parseInt(parts[0]));
                    }
                } else if (batch && (typeof batch === 'number' || typeof batch === 'string')) {
                    const bNum = parseInt(batch);
                    if (!isNaN(bNum)) parsedBatchYear = String(bNum);
                }

                const existing = await prisma.student.findUnique({ where: { rollNo } });

                if (existing) {
                    await prisma.student.update({
                        where: { rollNo },
                        data: {
                            registerNumber: registerNumber || existing.registerNumber,
                            name: name || existing.name,
                            department: department || existing.department,
                            year: parseInt(year) || existing.year,
                            section: section || existing.section,
                            semester: parseInt(semester) || existing.semester,
                            regulation: regulation || existing.regulation,
                            batch: batch || existing.batch,
                            departmentId: targetDeptId || existing.departmentId,
                            sectionId: targetSecId || existing.sectionId,
                            currentSemester: parseInt(semester) || existing.currentSemester,
                            batchYear: parsedBatchYear || existing.batchYear,
                            photo: photo || existing.photo,
                            dateOfBirth: dateOfBirth || existing.dateOfBirth,
                            gender: gender || existing.gender,
                            bloodGroup: bloodGroup || existing.bloodGroup,
                            nationality: nationality || existing.nationality,
                            phoneNumber: phoneNumber || existing.phoneNumber,
                            email: email || existing.email,
                            address: address || existing.address,
                            city: city || existing.city,
                            district: district || existing.district,
                            state: state || existing.state,
                            pincode: pincode || existing.pincode,
                            fatherName: fatherName || existing.fatherName,
                            fatherPhone: fatherPhone || existing.fatherPhone,
                            motherName: motherName || existing.motherName,
                            motherPhone: motherPhone || existing.motherPhone,
                            guardianName: guardianName || existing.guardianName,
                            guardianPhone: guardianPhone || existing.guardianPhone,
                            status: studentStatus || existing.status,
                        }
                    });
                    updatedCount++;
                } else {
                    await prisma.student.create({
                        data: {
                            rollNo,
                            registerNumber: registerNumber || null,
                            name: name || 'Unknown',
                            department: department || null,
                            year: parseInt(year) || 1,
                            section: section || 'A',
                            semester: parseInt(semester) || 1,
                            regulation: regulation || "2021",
                            batch: batch || null,
                            departmentId: targetDeptId,
                            sectionId: targetSecId,
                            currentSemester: parseInt(semester) || 1,
                            batchYear: parsedBatchYear,
                            academicYearId: academicYearId,
                            photo,
                            dateOfBirth,
                            gender,
                            bloodGroup,
                            nationality,
                            phoneNumber,
                            email,
                            address,
                            city,
                            district,
                            state,
                            pincode,
                            fatherName,
                            fatherPhone,
                            motherName,
                            motherPhone,
                            guardianName,
                            guardianPhone,
                            status: studentStatus || "ACTIVE",
                        }
                    });
                    createdCount++;
                }
            } catch (err) {
                errors.push({ rollNo, error: err.message });
            }
        }

        res.json({
            message: `Bulk processing complete. Created: ${createdCount}, Updated: ${updatedCount}`,
            created: createdCount,
            updated: updatedCount,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        handleError(res, error, "Bulk upload failed");
    }
};

const batchAssignRegisterNumbers = async (req, res) => {
    const { studentIds, startNumber, prefix = '' } = req.body;
    try {
        if (!studentIds || !Array.isArray(studentIds) || !startNumber) {
            return res.status(400).json({ message: "Invalid input. studentIds and startNumber are required." });
        }

        let currentNum = parseInt(startNumber);
        if (isNaN(currentNum)) return res.status(400).json({ message: "Start number must be a valid number." });

        // ✅ FIX Bug #7: fetch students and skip those who already have a register number
        const students = await prisma.student.findMany({
            where: { id: { in: studentIds.map(id => parseInt(id)) } },
            select: { id: true, rollNo: true, registerNumber: true },
            orderBy: { rollNo: 'asc' }
        });

        const alreadyAssigned = students.filter(s => s.registerNumber);
        const toAssign = students.filter(s => !s.registerNumber);

        if (toAssign.length === 0) {
            return res.status(400).json({
                message: 'All selected students already have register numbers assigned.',
                skipped: alreadyAssigned.map(s => s.rollNo)
            });
        }

        const results = await prisma.$transaction(
            toAssign.map((s) =>
                prisma.student.update({
                    where: { id: s.id },
                    data: { registerNumber: `${prefix}${currentNum++}` }
                })
            )
        );

        res.json({
            message: `Successfully assigned register numbers to ${results.length} students`,
            count: results.length,
            skipped: alreadyAssigned.length > 0 ? `${alreadyAssigned.length} students skipped (already had register numbers)` : undefined
        });
    } catch (error) {
        handleError(res, error, "Error in batch register assignment");
    }
};

const passStudentsOut = async (req, res) => {
    const { studentIds, batch } = req.body;
    try {
        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ message: 'No students selected for passing out.' });
        }

        // Determine batch from students if not explicitly provided
        let batchLabel = batch;
        if (!batchLabel) {
            const first = await prisma.student.findFirst({
                where: { id: { in: studentIds.map(id => parseInt(id)) } },
                select: { batch: true, batchYear: true }
            });
            batchLabel = first?.batch || first?.batchYear || String(new Date().getFullYear());
        }

        await prisma.student.updateMany({
            where: { id: { in: studentIds.map(id => parseInt(id)) } },
            data: {
                status: 'PASSED_OUT',
                batch: batchLabel
            }
        });

        // Create Activity Logs
        await prisma.activityLog.createMany({
            data: studentIds.map(id => ({
                action: 'STUDENT_PASSED_OUT',
                description: `Marked as Passed Out (Batch: ${batchLabel})`,
                performedBy: parseInt(req.user.id),
                targetId: parseInt(id)
            }))
        });

        res.json({ message: `${studentIds.length} students marked as Passed Out (Batch: ${batchLabel})`, count: studentIds.length, batch: batchLabel });
    } catch (error) {
        handleError(res, error, 'Error passing students out');
    }
};

const getStudentProfile = async (req, res) => {
    const { id } = req.params;
    try {
        const studentId = parseInt(id);
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                departmentRef: true,
                sectionRef: true,
                academicYear: true,
                attendance: true,
                marks: {
                    include: {
                        subject: true,
                        endSemMarks: true
                    }
                },
                results: {
                    orderBy: { semester: 'desc' }
                },
                arrears: {
                    where: { isCleared: false },
                    include: {
                        subject: true,
                        attempts: true
                    }
                }
            }
        });

        if (!student) return res.status(404).json({ message: "Student not found" });

        // Calculate CIA totals for frontend display
        const processedMarks = student.marks.map(m => {
            const cia1 = (m.cia1_test || 0) + (m.cia1_assignment || 0) + (m.cia1_attendance || 0);
            const cia2 = (m.cia2_test || 0) + (m.cia2_assignment || 0) + (m.cia2_attendance || 0);
            const cia3 = (m.cia3_test || 0) + (m.cia3_assignment || 0) + (m.cia3_attendance || 0);
            return {
                ...m,
                cia1_total: cia1,
                cia2_total: cia2,
                cia3_total: cia3,
                internal_total: cia1 + cia2 + cia3
            };
        });

        student.marks = processedMarks;

        // Calculate statistics
        const attendance = student.attendance || [];
        const totalClasses = attendance.length;
        const presentClasses = attendance.filter(a => a.status === 'PRESENT').length;
        const attendancePercentage = totalClasses > 0 
            ? ((presentClasses / totalClasses) * 100).toFixed(1) + '%' 
            : '0.0%';
        
        const totalCredits = student.marks.reduce((acc, m) => acc + (m.subject?.credits || 0), 0);
        const arrearCount = student.arrears.length;
        
        // Use latest semester result for GPA/CGPA
        const latestResult = student.results[0];

        res.json({
            ...student,
            stats: {
                attendance: attendancePercentage,
                totalCredits,
                arrearCount,
                cgpa: latestResult?.cgpa || '0.00'
            }
        });
    } catch (error) {
        handleError(res, error, "Error fetching student profile");
    }
};

const getGradeSheet = async (req, res) => {
    const { id } = req.params;
    try {
        const student = await prisma.student.findUnique({
            where: { id: parseInt(id) },
            include: {
                departmentRef: true,
                marks: {
                    include: {
                        subject: true,
                        endSemMarks: true
                    }
                }
            }
        });

        if (!student) return res.status(404).json({ message: 'Student not found.' });

        const results = student.marks
            .filter(m => m.endSemMarks && m.endSemMarks.isPublished)
            .map(m => ({
                subjectCode: m.subject.code,
                subjectName: m.subject.name,
                cia: Math.round(m.internal || 0),
                external: Math.round(m.endSemMarks.externalMarks || 0),
                grade: m.endSemMarks.grade
            }));

        const data = {
            student,
            results,
            semester: student.semester,
            gpa: student.gpa?.toFixed(2) || '0.00',
            cgpa: student.cgpa?.toFixed(2) || '0.00'
        };

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=GradeSheet_Sem${student.semester}_${student.registerNumber || student.rollNo}.pdf`);
        
        pdfService.generateStudentGradeSheet(res, data);
    } catch (error) {
        handleError(res, error, "Error generating Grade Sheet");
    }
};

const getIDCard = async (req, res) => {
    const { id } = req.params;
    try {
        const student = await prisma.student.findUnique({
            where: { id: parseInt(id) },
            include: { departmentRef: true }
        });
        if (!student) return res.status(404).json({ message: 'Student not found.' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=ID_Card_${student.registerNumber || student.rollNo}.pdf`);
        
        pdfService.generateStudentIDCard(res, { student });
    } catch (error) {
        handleError(res, error, "Error generating ID Card");
    }
};

const resetStudentPasswordToDOB = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.student.update({
            where: { id: parseInt(id) },
            data: { password: null }
        });
        
        logger.info(`Admin reset password for student ID ${id} to DOB default.`);
        res.json({ message: 'Student password reset to DOB (default) successfully.' });
    } catch (error) {
        handleError(res, error, "Error resetting student password");
    }
};

module.exports = {
    createStudent,
    updateStudent,
    deleteStudent,
    getStudents,
    promoteStudents,
    bulkUploadStudents,
    batchAssignRegisterNumbers,
    passStudentsOut,
    getStudentProfile,
    resetStudentPasswordToDOB,
    getGradeSheet,
    getIDCard
};
