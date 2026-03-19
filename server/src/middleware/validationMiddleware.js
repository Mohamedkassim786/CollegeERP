const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        return res.status(400).json({
            message: "Validation Error",
            errors: error.errors.map(err => ({
                path: err.path.join('.'),
                message: err.message
            }))
        });
    }
};

module.exports = { validate };
