// API Configuration
const API_BASE_URL = 'http://localhost:3001';
const API_ENDPOINTS = {
    books: '/api/books',
    search: '/api/books/search',
    available: '/api/books/available',
    health: '/health'
};

// State Management
let currentBooks = [];
let currentFilter = 'all';
let currentSort = 'title';

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    loadStats();
    loadBooks();
    initEventListeners();
});

// Navigation
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-section');
            showSection(target);
            
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Load data when switching to section
        if (sectionId === 'home') {
            loadBooks();
        } else if (sectionId === 'stats') {
            loadSystemStats();
        }
    }
}

// Event Listeners
function initEventListeners() {
    // Filter & Sort
    document.getElementById('filter-availability')?.addEventListener('change', handleFilterChange);
    document.getElementById('sort-by')?.addEventListener('change', handleSortChange);
    
    // Search
    document.getElementById('search-btn')?.addEventListener('click', handleSearch);
    document.getElementById('search-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    // Add Book Form
    document.getElementById('book-form')?.addEventListener('submit', handleAddBook);
    
    // Modal Close
    document.querySelector('.close')?.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('book-modal');
        if (e.target === modal) closeModal();
    });
}

// Load Stats
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.books}`);
        const data = await response.json();
        
        if (data.success) {
            const total = data.pagination.total;
            const available = data.data.filter(book => book.status === 'Available').length;
            const unavailable = total - available;
            
            // Update stats cards
            updateStatCard('total-books', total);
            updateStatCard('available-books', available);
            updateStatCard('borrowed-books', unavailable);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function updateStatCard(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
        element.style.animation = 'none';
        setTimeout(() => element.style.animation = 'fadeIn 0.5s ease', 10);
    }
}

// Load Books
async function loadBooks(filters = {}) {
    const container = document.getElementById('booksContainer');
    const loading = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    
    if (loading) loading.style.display = 'block';
    if (errorDiv) errorDiv.style.display = 'none';
    if (container) container.innerHTML = '';
    
    try {
        let url = `${API_BASE_URL}${API_ENDPOINTS.books}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (loading) loading.style.display = 'none';
        
        if (data.success) {
            currentBooks = data.data;
            displayBooks(currentBooks);
            updateStats(currentBooks);
        } else {
            if (errorDiv) {
                errorDiv.textContent = 'Không thể tải danh sách sách';
                errorDiv.style.display = 'block';
            }
        }
    } catch (err) {
        console.error('Error loading books:', err);
        if (loading) loading.style.display = 'none';
        if (errorDiv) {
            errorDiv.textContent = 'Lỗi mạng. Vui lòng kiểm tra API server.';
            errorDiv.style.display = 'block';
        }
    }
}

// Update Stats
function updateStats(books) {
    const total = books.length;
    const available = books.filter(book => book.status === 'Available').length;
    const categories = [...new Set(books.map(b => b.category))].length;
    
    const totalEl = document.getElementById('totalBooks');
    const availEl = document.getElementById('availableBooks');
    const catEl = document.getElementById('categories');
    
    if (totalEl) totalEl.textContent = total;
    if (availEl) availEl.textContent = available;
    if (catEl) catEl.textContent = categories;
}

// Filter Books
function filterBooks() {
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    
    let filtered = [...currentBooks];
    
    if (categoryFilter) {
        filtered = filtered.filter(book => book.category === categoryFilter);
    }
    
    if (statusFilter) {
        filtered = filtered.filter(book => book.status === statusFilter);
    }
    
    displayBooks(filtered);
}

// Search Books
async function searchBooks() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput?.value.trim();
    
    if (!query) {
        alert('Vui lòng nhập từ khóa tìm kiếm');
        return;
    }
    
    const resultsDiv = document.getElementById('searchResults');
    if (resultsDiv) resultsDiv.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Đang tìm kiếm...</div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.search}?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            resultsDiv.innerHTML = data.data.map(book => `
                <div class="book-card">
                    <h3 class="book-title">${escapeHtml(book.title)}</h3>
                    <p class="book-author"><i class="fas fa-user"></i> ${escapeHtml(book.author)}</p>
                    <p><i class="fas fa-barcode"></i> ${escapeHtml(book.isbn)}</p>
                    <div class="book-info">
                        <span class="book-category">${escapeHtml(book.category || 'Other')}</span>
                        <span class="book-status ${book.status === 'Available' ? 'available' : 'unavailable'}">
                            ${book.status || 'Available'}
                        </span>
                    </div>
                </div>
            `).join('');
        } else {
            resultsDiv.innerHTML = '<div class="no-results"><i class="fas fa-search"></i><p>Không tìm thấy sách phù hợp</p></div>';
        }
    } catch (error) {
        console.error('Search error:', error);
        resultsDiv.innerHTML = '<div class="error"><i class="fas fa-exclamation-circle"></i> Lỗi tìm kiếm. Vui lòng thử lại.</div>';
    }
}

// Display Books
function displayBooks(books) {
    const grid = document.getElementById('booksContainer');
    if (!grid) return;
    
    if (books.length === 0) {
        grid.innerHTML = '<div class="no-results"><i class="fas fa-book-open"></i><p>Không có sách nào</p></div>';
        return;
    }
    
    // Sort books
    const sortedBooks = sortBooks([...books]);
    
    grid.innerHTML = sortedBooks.map(book => `
        <div class="book-card" onclick="showBookDetails('${book._id}')">
            <h3 class="book-title">${escapeHtml(book.title)}</h3>
            <p class="book-author"><i class="fas fa-user"></i> ${escapeHtml(book.author)}</p>
            <p class="book-isbn"><i class="fas fa-barcode"></i> ${escapeHtml(book.isbn)}</p>
            <div class="book-info">
                <span class="book-category">${escapeHtml(book.category || 'General')}</span>
                <span class="book-status ${book.status === 'Available' ? 'available' : 'unavailable'}">
                    ${book.status || 'Available'}
                </span>
            </div>
            <div class="book-actions">
                <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); showBookDetails('${book._id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                ${book.status === 'Available' ? 
                    `<button class="btn btn-sm btn-success" onclick="event.stopPropagation(); borrowBook('${book._id}')">
                        <i class="fas fa-book-reader"></i> Borrow
                    </button>` : 
                    `<button class="btn btn-sm btn-secondary" disabled>
                        <i class="fas fa-clock"></i> Unavailable
                    </button>`
                }
            </div>
        </div>
    `).join('');
}

// Sort Books
function sortBooks(books) {
    return books.sort((a, b) => {
        switch(currentSort) {
            case 'title':
                return a.title.localeCompare(b.title);
            case 'author':
                return a.author.localeCompare(b.author);
            case 'newest':
                return new Date(b.createdAt) - new Date(a.createdAt);
            default:
                return 0;
        }
    });
}

// Filter & Sort Handlers
function handleFilterChange(e) {
    currentFilter = e.target.value;
    loadBooks();
}

function handleSortChange(e) {
    currentSort = e.target.value;
    displayBooks(currentBooks);
}

// Search Books
async function handleSearch() {
    const searchInput = document.getElementById('search-input');
    const query = searchInput.value.trim();
    
    if (!query) {
        alert('Please enter a search term');
        return;
    }
    
    showLoading('search-results');
    
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.search}?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.success) {
            displaySearchResults(data.data);
        } else {
            showError('search-results', 'Search failed');
        }
    } catch (error) {
        console.error('Error searching books:', error);
        showError('search-results', 'Search error. Please try again.');
    }
}

// Display Search Results
function displaySearchResults(books) {
    const resultsDiv = document.getElementById('search-results');
    if (!resultsDiv) return;
    
    if (books.length === 0) {
        resultsDiv.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>No books found matching your search</p>
            </div>
        `;
        return;
    }
    
    resultsDiv.innerHTML = `
        <h3>Found ${books.length} book(s)</h3>
        <div class="books-grid">
            ${books.map(book => `
                <div class="book-card" onclick="showBookDetails('${book._id}')">
                    <h3 class="book-title">${escapeHtml(book.title)}</h3>
                    <p class="book-author"><i class="fas fa-user"></i> ${escapeHtml(book.author)}</p>
                    <p class="book-isbn"><i class="fas fa-barcode"></i> ${escapeHtml(book.isbn)}</p>
                    <div class="book-info">
                        <span class="book-category">${escapeHtml(book.category || 'General')}</span>
                        <span class="book-status ${book.status === 'Available' ? 'available' : 'unavailable'}">
                            ${book.status || 'Available'}
                        </span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Add Book - called from form onsubmit
async function addBook(e) {
    e.preventDefault();
    
    const title = document.getElementById('title').value.trim();
    const author = document.getElementById('author').value.trim();
    const isbn = document.getElementById('isbn').value.trim();
    const totalCopies = document.getElementById('totalCopies').value;
    
    // Validate required fields
    if (!title || !author || !isbn || !totalCopies) {
        alert('❌ Vui lòng điền đầy đủ các trường bắt buộc (*)');
        return;
    }
    
    // Validate ISBN format (must start with 978 or 979 for ISBN-13)
    const cleanIsbn = isbn.replace(/[-\s]/g, '');
    if (cleanIsbn.length !== 10 && cleanIsbn.length !== 13) {
        alert('❌ ISBN phải có 10 hoặc 13 chữ số.\nVí dụ: 978-0-123-45678-9 hoặc 0-123-45678-9');
        return;
    }
    
    const bookData = {
        title: title,
        author: author,
        isbn: isbn,
        category: document.getElementById('category').value,
        totalCopies: parseInt(totalCopies)
    };
    
    // Add optional fields
    const publisher = document.getElementById('publisher').value.trim();
    const publishedYear = document.getElementById('publishedYear').value;
    const description = document.getElementById('description').value.trim();
    
    if (publisher) bookData.publisher = publisher;
    if (publishedYear) bookData.publishedYear = parseInt(publishedYear);
    if (description) bookData.description = description;

    console.log('Sending book data:', bookData);
    
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.books}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookData)
        });
        
        const data = await response.json();
        console.log('API response:', data);
        
        if (data.success) {
            alert('✅ Thêm sách thành công!');
            document.getElementById('addBookForm').reset();
            loadBooks(); // Refresh book list
            
            // Switch to home section to see the new book
            setTimeout(() => {
                showSection('home');
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                document.querySelector('[data-section="home"]').classList.add('active');
            }, 500);
        } else {
            let errorMsg = data.message || 'Unknown error';
            if (data.errors && data.errors.length > 0) {
                errorMsg = data.errors.map(e => e.message).join('\n');
            }
            alert('❌ Lỗi: ' + errorMsg);
        }
    } catch (error) {
        console.error('Error adding book:', error);
        alert('❌ Lỗi mạng. Vui lòng kiểm tra:\n1. API server đang chạy (http://localhost:3001)\n2. Kết nối mạng');
    }
}

// Legacy function for compatibility
async function handleAddBook(e) {
    return addBook(e);
}

// Show Book Details Modal
async function showBookDetails(bookId) {
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.books}/${bookId}`);
        const data = await response.json();
        
        if (data.success) {
            const book = data.data;
            document.getElementById('modal-title').textContent = book.title;
            document.getElementById('modal-body').innerHTML = `
                <p><strong>Author:</strong> ${escapeHtml(book.author)}</p>
                <p><strong>ISBN:</strong> ${escapeHtml(book.isbn)}</p>
                <p><strong>Category:</strong> ${escapeHtml(book.category || 'General')}</p>
                <p><strong>Publish Year:</strong> ${book.publishedYear || 'N/A'}</p>
                <p><strong>Total Copies:</strong> ${book.totalCopies || 1}</p>
                <p><strong>Available Copies:</strong> ${book.availableCopies || 0}</p>
                <p><strong>Status:</strong> 
                    <span class="book-status ${book.status === 'Available' ? 'available' : 'unavailable'}">
                        ${book.status || 'Available'}
                    </span>
                </p>
                ${book.description ? `<p><strong>Description:</strong> ${escapeHtml(book.description)}</p>` : ''}
                <p><strong>Added:</strong> ${new Date(book.createdAt).toLocaleDateString()}</p>
            `;
            
            document.getElementById('book-modal').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading book details:', error);
        alert('Failed to load book details');
    }
}

// Close Modal
function closeModal() {
    document.getElementById('book-modal').style.display = 'none';
}

// Borrow Book (Placeholder - needs borrowing service)
function borrowBook(bookId) {
    alert(`Borrowing functionality will be implemented with the Borrowing Service.\nBook ID: ${bookId}`);
    // TODO: Implement actual borrowing when borrowing-service is ready
}

// Load System Stats
async function loadSystemStats() {
    try {
        // Health Check
        const healthResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.health}`);
        const healthData = await healthResponse.json();
        
        const healthStatus = document.getElementById('health-status');
        if (healthStatus) {
            healthStatus.innerHTML = `
                <i class="fas fa-${healthData.status === 'UP' ? 'check-circle' : 'times-circle'}"></i>
                <h3>${healthData.status === 'UP' ? 'All Systems Operational' : 'System Issues Detected'}</h3>
                <p>Last checked: ${new Date().toLocaleTimeString()}</p>
            `;
        }
        
        // Update service stats
        const services = healthData.checks || {};
        let activeServices = 0;
        Object.values(services).forEach(check => {
            if (check.status === 'UP') activeServices++;
        });
        
        updateStatCard('active-services', activeServices);
        updateStatCard('uptime', '99.9%'); // Placeholder
        
    } catch (error) {
        console.error('Error loading system stats:', error);
        const healthStatus = document.getElementById('health-status');
        if (healthStatus) {
            healthStatus.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Unable to Connect</h3>
                <p>Please check if the API server is running</p>
            `;
        }
    }
}

// Utility Functions
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading...</p>
            </div>
        `;
    }
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-circle"></i>
                <p>${escapeHtml(message)}</p>
            </div>
        `;
    }
}

function showSuccessMessage(message) {
    const container = document.querySelector('.form-container');
    if (!container) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.innerHTML = `
        <i class="fas fa-check-circle"></i> ${escapeHtml(message)}
    `;
    
    container.insertBefore(messageDiv, container.firstChild);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Auto-refresh stats every 30 seconds
setInterval(() => {
    const statsSection = document.getElementById('stats');
    if (statsSection && statsSection.classList.contains('active')) {
        loadSystemStats();
    }
}, 30000);
