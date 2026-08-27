export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      req.body = await schema.parseAsync(req.body);
      return next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }
  };
};
