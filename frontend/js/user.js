// User Interface JavaScript
const API_BASE_URL = 'http://localhost:3001';
const API_ENDPOINTS = {
    books: '/api/books',
    search: '/api/books/search',
    health: '/health'
};

// State
let currentBooks = [];
let myBorrowedBooks = JSON.parse(localStorage.getItem('borrowedBooks') || '[]');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    loadBooks();
    
    // Enter key for search
    document.getElementById('quickSearchInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') quickSearch();
    });
    document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchBooks();
    });
});

// Navigation
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-section');
            showSection(target);
            
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
        
        if (sectionId === 'home') {
            loadBooks();
        } else if (sectionId === 'my-books') {
            displayMyBooks();
        }
    }
    
    // Update nav active state
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`[data-section="${sectionId}"]`);
    if (activeLink) activeLink.classList.add('active');
}

// Load Books
async function loadBooks() {
    const container = document.getElementById('booksContainer');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    
    if (loading) loading.style.display = 'block';
    if (error) error.style.display = 'none';
    if (container) container.innerHTML = '';
    
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.books}`);
        const data = await response.json();
        
        if (loading) loading.style.display = 'none';
        
        if (data.success) {
            currentBooks = data.data;
            displayBooks(currentBooks);
            updateStats(currentBooks);
        } else {
            showError('Không thể tải danh sách sách');
        }
    } catch (err) {
        console.error('Error loading books:', err);
        if (loading) loading.style.display = 'none';
        showError('Lỗi kết nối. Vui lòng kiểm tra API server.');
    }
}

// Display Books
function displayBooks(books) {
    const container = document.getElementById('booksContainer');
    if (!container) return;
    
    if (books.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book-open"></i>
                <p>Không có sách nào</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = books.map(book => `
        <div class="book-card" onclick="showBookDetail('${book._id}')">
            <div class="book-cover">
                <i class="fas fa-book"></i>
            </div>
            <h3 class="book-title">${escapeHtml(book.title)}</h3>
            <p class="book-author"><i class="fas fa-user"></i> ${escapeHtml(book.author)}</p>
            <div class="book-info">
                <span class="book-category">${escapeHtml(book.category || 'Other')}</span>
                <span class="book-status ${book.status === 'Available' ? 'available' : 'unavailable'}">
                    ${book.status === 'Available' ? '✅ Có sẵn' : '❌ Hết'}
                </span>
            </div>
            <div class="book-actions">
                ${book.status === 'Available' ? `
                    <button class="btn btn-success btn-sm" onclick="event.stopPropagation(); borrowBook('${book._id}')">
                        <i class="fas fa-hand-holding"></i> Mượn sách
                    </button>
                ` : `
                    <button class="btn btn-secondary btn-sm" disabled>
                        <i class="fas fa-clock"></i> Đã hết
                    </button>
                `}
            </div>
        </div>
    `).join('');
}

// Update Stats
function updateStats(books) {
    const total = books.length;
    const available = books.filter(b => b.status === 'Available').length;
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
    const category = document.getElementById('categoryFilter')?.value || '';
    const status = document.getElementById('statusFilter')?.value || '';
    
    let filtered = [...currentBooks];
    
    if (category) {
        filtered = filtered.filter(book => book.category === category);
    }
    
    if (status) {
        filtered = filtered.filter(book => book.status === status);
    }
    
    displayBooks(filtered);
}

// Quick Search
function quickSearch() {
    const query = document.getElementById('quickSearchInput')?.value.trim();
    if (!query) {
        displayBooks(currentBooks);
        return;
    }
    
    const filtered = currentBooks.filter(book =>
        book.title.toLowerCase().includes(query.toLowerCase()) ||
        book.author.toLowerCase().includes(query.toLowerCase())
    );
    
    displayBooks(filtered);
}

// Search Books
async function searchBooks() {
    const query = document.getElementById('searchInput')?.value.trim();
    const resultsContainer = document.getElementById('searchResults');
    
    if (!query) {
        resultsContainer.innerHTML = '<p class="search-hint">Nhập từ khóa để tìm kiếm</p>';
        return;
    }
    
    resultsContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Đang tìm kiếm...</div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.search}?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            resultsContainer.innerHTML = data.data.map(book => `
                <div class="book-card" onclick="showBookDetail('${book._id}')">
                    <h3 class="book-title">${escapeHtml(book.title)}</h3>
                    <p class="book-author"><i class="fas fa-user"></i> ${escapeHtml(book.author)}</p>
                    <div class="book-info">
                        <span class="book-category">${escapeHtml(book.category || 'Other')}</span>
                        <span class="book-status ${book.status === 'Available' ? 'available' : 'unavailable'}">
                            ${book.status === 'Available' ? '✅ Có sẵn' : '❌ Hết'}
                        </span>
                    </div>
                </div>
            `).join('');
        } else {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>Không tìm thấy sách phù hợp với "${escapeHtml(query)}"</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Search error:', error);
        resultsContainer.innerHTML = '<div class="error"><i class="fas fa-exclamation-circle"></i> Lỗi tìm kiếm</div>';
    }
}

// Show Book Detail
async function showBookDetail(bookId) {
    const book = currentBooks.find(b => b._id === bookId);
    if (!book) return;
    
    const modal = document.getElementById('bookModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    const actions = document.getElementById('modalActions');
    
    title.textContent = book.title;
    body.innerHTML = `
        <div class="book-detail">
            <p><strong><i class="fas fa-user"></i> Tác giả:</strong> ${escapeHtml(book.author)}</p>
            <p><strong><i class="fas fa-barcode"></i> ISBN:</strong> ${escapeHtml(book.isbn)}</p>
            <p><strong><i class="fas fa-folder"></i> Thể loại:</strong> ${escapeHtml(book.category || 'Other')}</p>
            <p><strong><i class="fas fa-calendar"></i> Năm XB:</strong> ${book.publishedYear || 'N/A'}</p>
            <p><strong><i class="fas fa-building"></i> NXB:</strong> ${escapeHtml(book.publisher || 'N/A')}</p>
            <p><strong><i class="fas fa-copy"></i> Số lượng:</strong> ${book.availableCopies}/${book.totalCopies} có sẵn</p>
            <p><strong><i class="fas fa-info-circle"></i> Trạng thái:</strong> 
                <span class="book-status ${book.status === 'Available' ? 'available' : 'unavailable'}">
                    ${book.status === 'Available' ? '✅ Có sẵn' : '❌ Không có'}
                </span>
            </p>
            ${book.description ? `<p><strong><i class="fas fa-align-left"></i> Mô tả:</strong> ${escapeHtml(book.description)}</p>` : ''}
        </div>
    `;
    
    actions.innerHTML = book.status === 'Available' ? `
        <button class="btn btn-success" onclick="borrowBook('${book._id}'); closeModal();">
            <i class="fas fa-hand-holding"></i> Mượn sách này
        </button>
    ` : `
        <button class="btn btn-secondary" disabled>
            <i class="fas fa-clock"></i> Sách không có sẵn
        </button>
    `;
    
    modal.style.display = 'block';
}

// Close Modal
function closeModal() {
    document.getElementById('bookModal').style.display = 'none';
}

// Borrow Book (Simulated - stores in localStorage)
function borrowBook(bookId) {
    const book = currentBooks.find(b => b._id === bookId);
    if (!book) return;
    
    if (book.status !== 'Available') {
        alert('❌ Sách này hiện không có sẵn');
        return;
    }
    
    // Check if already borrowed
    if (myBorrowedBooks.find(b => b._id === bookId)) {
        alert('⚠️ Bạn đã mượn sách này rồi');
        return;
    }
    
    // Add to borrowed books
    const borrowedBook = {
        ...book,
        borrowedAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days
    };
    
    myBorrowedBooks.push(borrowedBook);
    localStorage.setItem('borrowedBooks', JSON.stringify(myBorrowedBooks));
    
    alert(`✅ Mượn sách thành công!\n\n📚 ${book.title}\n📅 Hạn trả: ${formatDate(borrowedBook.dueDate)}`);
}

// Display My Books
function displayMyBooks() {
    const container = document.getElementById('myBooksContainer');
    
    if (myBorrowedBooks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Bạn chưa mượn sách nào</p>
                <button onclick="showSection('home')" class="btn btn-primary">
                    <i class="fas fa-book"></i> Khám phá sách
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = myBorrowedBooks.map(book => `
        <div class="book-card borrowed">
            <h3 class="book-title">${escapeHtml(book.title)}</h3>
            <p class="book-author"><i class="fas fa-user"></i> ${escapeHtml(book.author)}</p>
            <p class="borrow-info">
                <i class="fas fa-calendar-check"></i> Mượn: ${formatDate(book.borrowedAt)}
            </p>
            <p class="due-info ${isOverdue(book.dueDate) ? 'overdue' : ''}">
                <i class="fas fa-calendar-times"></i> Hạn trả: ${formatDate(book.dueDate)}
                ${isOverdue(book.dueDate) ? '<span class="overdue-badge">Quá hạn!</span>' : ''}
            </p>
            <div class="book-actions">
                <button class="btn btn-primary btn-sm" onclick="returnBook('${book._id}')">
                    <i class="fas fa-undo"></i> Trả sách
                </button>
            </div>
        </div>
    `).join('');
}

// Return Book
function returnBook(bookId) {
    const index = myBorrowedBooks.findIndex(b => b._id === bookId);
    if (index === -1) return;
    
    const book = myBorrowedBooks[index];
    myBorrowedBooks.splice(index, 1);
    localStorage.setItem('borrowedBooks', JSON.stringify(myBorrowedBooks));
    
    alert(`✅ Đã trả sách: ${book.title}`);
    displayMyBooks();
}

// Utility Functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function isOverdue(dueDate) {
    return new Date(dueDate) < new Date();
}

function showError(message) {
    const error = document.getElementById('error');
    if (error) {
        error.textContent = message;
        error.style.display = 'block';
    }
}

// Close modal on outside click
window.onclick = function(event) {
    const modal = document.getElementById('bookModal');
    if (event.target === modal) {
        closeModal();
    }
}
