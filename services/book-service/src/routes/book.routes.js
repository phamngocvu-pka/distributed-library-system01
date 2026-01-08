const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book.controller');
const { validateBook } = require('../middleware/validation');

/**
 * @route   GET /api/books
 * @desc    Get all books with pagination and filters
 * @access  Public
 */
router.get('/', bookController.getAllBooks);

/**
 * @route   GET /api/books/available
 * @desc    Get all available books
 * @access  Public
 */
router.get('/available', bookController.getAvailableBooks);

/**
 * @route   GET /api/books/search
 * @desc    Search books by title, author, or description
 * @access  Public
 */
router.get('/search', bookController.searchBooks);

/**
 * @route   GET /api/books/:id
 * @desc    Get book by ID
 * @access  Public
 */
router.get('/:id', bookController.getBookById);

/**
 * @route   POST /api/books
 * @desc    Create new book
 * @access  Private (Admin only)
 */
router.post('/', validateBook, bookController.createBook);

/**
 * @route   PUT /api/books/:id
 * @desc    Update book
 * @access  Private (Admin only)
 */
router.put('/:id', validateBook, bookController.updateBook);

/**
 * @route   DELETE /api/books/:id
 * @desc    Delete book
 * @access  Private (Admin only)
 */
router.delete('/:id', bookController.deleteBook);

module.exports = router;
