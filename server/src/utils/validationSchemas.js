const { z } = require('zod');

const loginSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters")
});

const facultyLoginSchema = z.object({
    staffId: z.string().min(3, "Staff ID is required"),
    password: z.string().min(6, "Password must be at least 6 characters")
});

const studentCreateSchema = z.object({
    rollNo: z.string().min(1, "Roll Number is required"),
    name: z.string().min(1, "Name is required"),
    departmentId: z.number().int().optional(),
    semester: z.number().int().min(1).max(8),
    section: z.string().min(1)
});

const markUpdateSchema = z.object({
    subjectId: z.number().int(),
    marksData: z.array(z.object({
        studentId: z.number().int(),
        data: z.record(z.union([z.number(), z.null()]))
    }))
});

const attendanceSubmitSchema = z.object({
    subjectId: z.number().int(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
    period: z.number().int(),
    attendanceData: z.array(z.object({
        studentId: z.number().int(),
        status: z.enum(['PRESENT', 'ABSENT', 'OD', 'LATE'])
    }))
});

module.exports = {
    loginSchema,
    facultyLoginSchema,
    studentCreateSchema,
    markUpdateSchema,
    attendanceSubmitSchema
};
