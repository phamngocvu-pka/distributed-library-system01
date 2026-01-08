const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const bookSchema = new mongoose.Schema({
  bookId: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  author: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  isbn: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  publisher: {
    type: String,
    trim: true
  },
  publishedYear: {
    type: Number,
    min: 1000,
    max: new Date().getFullYear() + 1
  },
  category: {
    type: String,
    enum: ['Fiction', 'Non-Fiction', 'Science', 'Technology', 'History', 'Biography', 'Other'],
    default: 'Other'
  },
  language: {
    type: String,
    default: 'English'
  },
  totalCopies: {
    type: Number,
    required: true,
    min: 0,
    default: 1
  },
  availableCopies: {
    type: Number,
    required: true,
    min: 0,
    default: 1
  },
  description: {
    type: String,
    maxlength: 2000
  },
  coverImage: {
    type: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  location: {
    shelf: String,
    section: String
  },
  status: {
    type: String,
    enum: ['Available', 'Unavailable', 'Maintenance'],
    default: 'Available'
  },
  metadata: {
    addedBy: String,
    lastModifiedBy: String,
    version: {
      type: Number,
      default: 1
    }
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for better query performance
bookSchema.index({ title: 'text', author: 'text', description: 'text' });
bookSchema.index({ category: 1, status: 1 });
bookSchema.index({ isbn: 1 }, { unique: true });

// Virtual for borrow availability
bookSchema.virtual('canBeBorrowed').get(function() {
  return this.availableCopies > 0 && this.status === 'Available';
});

// Methods
bookSchema.methods.borrowCopy = function() {
  if (this.availableCopies > 0) {
    this.availableCopies -= 1;
    if (this.availableCopies === 0) {
      this.status = 'Unavailable';
    }
    return true;
  }
  return false;
};

bookSchema.methods.returnCopy = function() {
  if (this.availableCopies < this.totalCopies) {
    this.availableCopies += 1;
    if (this.status === 'Unavailable') {
      this.status = 'Available';
    }
    return true;
  }
  return false;
};

// Static methods
bookSchema.statics.findAvailable = function(filters = {}) {
  return this.find({
    ...filters,
    status: 'Available',
    availableCopies: { $gt: 0 }
  });
};

bookSchema.statics.searchBooks = function(query) {
  return this.find({
    $text: { $search: query }
  }, {
    score: { $meta: 'textScore' }
  }).sort({ score: { $meta: 'textScore' } });
};

// Pre-save middleware
bookSchema.pre('save', function(next) {
  if (this.isModified('totalCopies') || this.isModified('availableCopies')) {
    if (this.availableCopies > this.totalCopies) {
      this.availableCopies = this.totalCopies;
    }
    if (this.availableCopies === 0) {
      this.status = 'Unavailable';
    } else if (this.status === 'Unavailable' && this.availableCopies > 0) {
      this.status = 'Available';
    }
  }
  this.metadata.version += 1;
  next();
});

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
