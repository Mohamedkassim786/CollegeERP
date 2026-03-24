const { z } = require('zod');

const validateZod = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      const issues = err.issues || err.errors || [];
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: issues.map(e => ({ path: e.path, message: e.message })) 
      });
    }
    next(err);
  }
};

const studentSchema = z.object({
  rollNo: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  registerNumber: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  departmentId: z.coerce.number().int().optional().nullable(),
  year: z.coerce.number().int().min(1).max(4).optional().nullable(),
  semester: z.coerce.number().int().min(1).max(8).optional().nullable(),
  section: z.string().optional().nullable(),
  sectionId: z.coerce.number().int().optional().nullable(),
  academicYearId: z.coerce.number().int().optional().nullable(),
  batch: z.string().optional().nullable(),
  regulation: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  aadharNumber: z.string().optional().nullable(),
  umisNumber: z.string().optional().nullable(),
  bloodGroup: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  fatherName: z.string().optional().nullable(),
  fatherPhone: z.string().optional().nullable(),
  motherName: z.string().optional().nullable(),
  motherPhone: z.string().optional().nullable(),
});

const markEntrySchema = z.object({
  studentId: z.number().int(),
  subjectId: z.number().int(),
  cia1_test: z.number().min(-1).max(100).optional(),
  cia2_test: z.number().min(-1).max(100).optional(),
  cia3_test: z.number().min(-1).max(100).optional(),
  lab_observation: z.number().min(-1).max(100).optional(),
  lab_record: z.number().min(-1).max(100).optional(),
  lab_model: z.number().min(-1).max(100).optional(),
});

module.exports = {
  validateZod,
  studentSchema,
  markEntrySchema
};
