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
  department: z.string().optional(),
  year: z.coerce.number().int().min(1).max(4).optional(),
  semester: z.coerce.number().int().min(1).max(8).optional(),
  section: z.string().optional(),
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
