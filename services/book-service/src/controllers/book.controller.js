const Book = require('../models/Book');
const { logger } = require('../utils/logger');
const { cacheGet, cacheSet, cacheDel, getRedlock } = require('../config/redis');
const { publishEvent } = require('../config/kafka');
const { publishMessage } = require('../config/rabbitmq');
const { activeBooksGauge, cacheHitCounter, cacheMissCounter } = require('../utils/metrics');

// GET all books with pagination and filters
exports.getAllBooks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      author,
      status,
      search
    } = req.query;

    const cacheKey = `books:list:${JSON.stringify(req.query)}`;
    
    // Try cache first
    const cachedData = await cacheGet(cacheKey);
    if (cachedData) {
      cacheHitCounter.inc({ cache_type: 'books_list' });
      return res.json({
        success: true,
        cached: true,
        ...cachedData
      });
    }
    
    cacheMissCounter.inc({ cache_type: 'books_list' });

    const query = {};
    if (category) query.category = category;
    if (author) query.author = new RegExp(author, 'i');
    if (status) query.status = status;
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;
    
    const [books, total] = await Promise.all([
      Book.find(query)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v')
        .lean(),
      Book.countDocuments(query)
    ]);

    const result = {
      data: books,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    };

    // Cache for 5 minutes
    await cacheSet(cacheKey, result, 300);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    logger.error('Error getting all books:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve books',
      error: error.message
    });
  }
};

// GET book by ID
exports.getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `book:${id}`;

    // Try cache first
    const cachedBook = await cacheGet(cacheKey);
    if (cachedBook) {
      cacheHitCounter.inc({ cache_type: 'book_detail' });
      return res.json({
        success: true,
        cached: true,
        data: cachedBook
      });
    }

    cacheMissCounter.inc({ cache_type: 'book_detail' });

    const book = await Book.findOne({ bookId: id }).select('-__v').lean();
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Cache for 10 minutes
    await cacheSet(cacheKey, book, 600);

    res.json({
      success: true,
      data: book
    });

  } catch (error) {
    logger.error('Error getting book by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve book',
      error: error.message
    });
  }
};

// CREATE new book
exports.createBook = async (req, res) => {
  try {
    const bookData = req.body;
    
    // Validate unique ISBN
    const existingBook = await Book.findOne({ isbn: bookData.isbn });
    if (existingBook) {
      return res.status(400).json({
        success: false,
        message: 'Book with this ISBN already exists'
      });
    }

    const book = new Book(bookData);
    await book.save();

    // Update metrics
    const totalBooks = await Book.countDocuments();
    activeBooksGauge.set(totalBooks);

    // Invalidate cache
    await cacheDel('books:list:*');

    // Publish event to Kafka
    await publishEvent('library-events', {
      type: 'BOOK_CREATED',
      bookId: book.bookId,
      title: book.title,
      timestamp: new Date().toISOString()
    });

    // Publish to RabbitMQ for notifications
    await publishMessage('library.events', 'book.created', {
      bookId: book.bookId,
      title: book.title,
      author: book.author
    });

    logger.info(`New book created: ${book.title} (${book.bookId})`);

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: book
    });

  } catch (error) {
    logger.error('Error creating book:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create book',
      error: error.message
    });
  }
};

// UPDATE book
exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Use distributed lock to prevent concurrent updates
    const redlock = getRedlock();
    const lockKey = `lock:book:${id}`;
    
    let lock;
    try {
      lock = await redlock.acquire([lockKey], 5000);
      
      const book = await Book.findOne({ bookId: id });
      
      if (!book) {
        await lock.release();
        return res.status(404).json({
          success: false,
          message: 'Book not found'
        });
      }

      // Apply updates
      Object.assign(book, updates);
      book.metadata.lastModifiedBy = req.user?.id || 'system';
      
      await book.save();

      // Invalidate cache
      await cacheDel(`book:${id}`);
      await cacheDel('books:list:*');

      // Publish update event
      await publishEvent('library-events', {
        type: 'BOOK_UPDATED',
        bookId: book.bookId,
        changes: Object.keys(updates),
        timestamp: new Date().toISOString()
      });

      await lock.release();

      logger.info(`Book updated: ${book.title} (${book.bookId})`);

      res.json({
        success: true,
        message: 'Book updated successfully',
        data: book
      });

    } catch (lockError) {
      logger.error('Failed to acquire lock for book update:', lockError);
      res.status(409).json({
        success: false,
        message: 'Book is being updated by another process. Please try again.'
      });
    }

  } catch (error) {
    logger.error('Error updating book:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update book',
      error: error.message
    });
  }
};

// DELETE book
exports.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await Book.findOneAndDelete({ bookId: id });
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Update metrics
    const totalBooks = await Book.countDocuments();
    activeBooksGauge.set(totalBooks);

    // Invalidate cache
    await cacheDel(`book:${id}`);
    await cacheDel('books:list:*');

    // Publish delete event
    await publishEvent('library-events', {
      type: 'BOOK_DELETED',
      bookId: book.bookId,
      title: book.title,
      timestamp: new Date().toISOString()
    });

    logger.info(`Book deleted: ${book.title} (${book.bookId})`);

    res.json({
      success: true,
      message: 'Book deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting book:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete book',
      error: error.message
    });
  }
};

// SEARCH books
exports.searchBooks = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const books = await Book.searchBooks(q);

    res.json({
      success: true,
      data: books,
      count: books.length
    });

  } catch (error) {
    logger.error('Error searching books:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
};

// GET available books
exports.getAvailableBooks = async (req, res) => {
  try {
    const books = await Book.findAvailable();

    res.json({
      success: true,
      data: books,
      count: books.length
    });

  } catch (error) {
    logger.error('Error getting available books:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve available books',
      error: error.message
    });
  }
};
