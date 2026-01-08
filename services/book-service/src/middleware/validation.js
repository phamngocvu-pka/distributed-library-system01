const Joi = require('joi');
const { logger } = require('../utils/logger');

const bookSchema = Joi.object({
  title: Joi.string().trim().min(1).max(255).required(),
  author: Joi.string().trim().min(1).max(255).required(),
  isbn: Joi.string().trim().min(10).max(20).required(),
  publisher: Joi.string().trim().max(255).optional(),
  publishedYear: Joi.number().integer().min(1000).max(new Date().getFullYear() + 1).optional(),
  category: Joi.string().valid('Fiction', 'Non-Fiction', 'Science', 'Technology', 'History', 'Biography', 'Other').optional(),
  language: Joi.string().trim().max(50).optional(),
  totalCopies: Joi.number().integer().min(1).required(),
  availableCopies: Joi.number().integer().min(0).optional(),
  description: Joi.string().max(2000).optional(),
  coverImage: Joi.string().uri().optional(),
  tags: Joi.array().items(Joi.string().trim()).optional(),
  location: Joi.object({
    shelf: Joi.string().trim().optional(),
    section: Joi.string().trim().optional()
  }).optional(),
  status: Joi.string().valid('Available', 'Unavailable', 'Maintenance').optional()
});

function validateBook(req, res, next) {
  const { error, value } = bookSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    logger.warn('Validation error:', error.details);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  req.body = value;
  next();
}

module.exports = { validateBook };
