// Admin Panel JavaScript
const API_BASE_URL = 'http://localhost:3001';
const API_ENDPOINTS = {
    books: '/api/books',
    search: '/api/books/search',
    health: '/health'
};

// State
let allBooks = [];
let bookToDelete = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    loadDashboard();
    loadAdminBooks();
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
        
        if (sectionId === 'dashboard') {
            loadDashboard();
        } else if (sectionId === 'books') {
            loadAdminBooks();
        } else if (sectionId === 'system') {
            checkHealth();
        }
    }
}

// Dashboard
async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.books}`);
        const data = await response.json();
        
        if (data.success) {
            const books = data.data;
            const total = books.length;
            const available = books.filter(b => b.status === 'Available').length;
            const borrowed = total - available;
            const categories = [...new Set(books.map(b => b.category))].length;
            
            document.getElementById('statTotalBooks').textContent = total;
            document.getElementById('statAvailable').textContent = available;
            document.getElementById('statBorrowed').textContent = borrowed;
            document.getElementById('statCategories').textContent = categories;
            
            // Load recent activity
            loadRecentActivity(books);
        }
        
        // Load system health
        checkHealth();
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function loadRecentActivity(books) {
    const container = document.getElementById('recentActivity');
    
    // Sort by createdAt descending and take top 5
    const recent = [...books]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
    
    if (recent.length === 0) {
        container.innerHTML = '<p>Chưa có hoạt động nào</p>';
        return;
    }
    
    container.innerHTML = `
        <ul class="activity-list">
            ${recent.map(book => `
                <li class="activity-item">
                    <div class="activity-icon add">
                        <i class="fas fa-plus"></i>
                    </div>
                    <div class="activity-info">
                        <p>Thêm sách: <strong>${escapeHtml(book.title)}</strong></p>
                        <span class="activity-time">${formatDate(book.createdAt)}</span>
                    </div>
                </li>
            `).join('')}
        </ul>
    `;
}

// Health Check
async function checkHealth() {
    const healthContainer = document.getElementById('systemHealth') || document.getElementById('healthInfo');
    
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.health}`);
        const data = await response.json();
        
        healthContainer.innerHTML = `
            <div class="health-item">
                <span>API Server</span>
                <span class="health-status up"><i class="fas fa-check-circle"></i> Online</span>
            </div>
            <div class="health-item">
                <span>MongoDB</span>
                <span class="health-status ${data.checks?.mongodb === 'UP' ? 'up' : 'down'}">
                    <i class="fas fa-${data.checks?.mongodb === 'UP' ? 'check-circle' : 'times-circle'}"></i>
                    ${data.checks?.mongodb || 'Unknown'}
                </span>
            </div>
            <div class="health-item">
                <span>Redis</span>
                <span class="health-status ${data.checks?.redis === 'UP' ? 'up' : 'down'}">
                    <i class="fas fa-${data.checks?.redis === 'UP' ? 'check-circle' : 'times-circle'}"></i>
                    ${data.checks?.redis || 'Unknown'}
                </span>
            </div>
        `;
        
        // Also update DB info if exists
        const dbInfo = document.getElementById('dbInfo');
        if (dbInfo) {
            dbInfo.innerHTML = `
                <div class="health-item">
                    <span>MongoDB Status</span>
                    <span class="health-status ${data.checks?.mongodb === 'UP' ? 'up' : 'down'}">
                        <i class="fas fa-${data.checks?.mongodb === 'UP' ? 'check-circle' : 'times-circle'}"></i>
                        ${data.checks?.mongodb || 'Unknown'}
                    </span>
                </div>
                <div class="health-item">
                    <span>Total Books</span>
                    <span>${allBooks.length}</span>
                </div>
            `;
        }
        
    } catch (error) {
        healthContainer.innerHTML = `
            <div class="health-item">
                <span>API Server</span>
                <span class="health-status down"><i class="fas fa-times-circle"></i> Offline</span>
            </div>
        `;
    }
}

// Load Books for Admin Table
async function loadAdminBooks() {
    const loading = document.getElementById('adminLoading');
    const tbody = document.getElementById('booksTableBody');
    
    if (loading) loading.style.display = 'block';
    
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.books}`);
        const data = await response.json();
        
        if (loading) loading.style.display = 'none';
        
        if (data.success) {
            allBooks = data.data;
            displayAdminBooks(allBooks);
        }
    } catch (error) {
        console.error('Error loading books:', error);
        if (loading) loading.style.display = 'none';
        tbody.innerHTML = '<tr><td colspan="7" class="error">Không thể tải danh sách sách</td></tr>';
    }
}

function displayAdminBooks(books) {
    const tbody = document.getElementById('booksTableBody');
    
    if (books.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Chưa có sách nào</td></tr>';
        return;
    }
    
    tbody.innerHTML = books.map(book => `
        <tr>
            <td><strong>${escapeHtml(book.title)}</strong></td>
            <td>${escapeHtml(book.author)}</td>
            <td><code>${escapeHtml(book.isbn)}</code></td>
            <td>${escapeHtml(book.category || 'Other')}</td>
            <td>${book.availableCopies}/${book.totalCopies}</td>
            <td>
                <span class="status-badge ${book.status?.toLowerCase() || 'available'}">
                    ${book.status || 'Available'}
                </span>
            </td>
            <td class="actions">
                <button class="btn btn-primary btn-sm" onclick="editBook('${book._id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="confirmDelete('${book._id}', '${escapeHtml(book.title)}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Filter Books
function adminFilterBooks() {
    const category = document.getElementById('adminCategoryFilter').value;
    let filtered = [...allBooks];
    
    if (category) {
        filtered = filtered.filter(book => book.category === category);
    }
    
    displayAdminBooks(filtered);
}

// Search Books
function adminSearchBooks() {
    const query = document.getElementById('adminSearchInput').value.toLowerCase().trim();
    
    if (!query) {
        displayAdminBooks(allBooks);
        return;
    }
    
    const filtered = allBooks.filter(book => 
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.isbn.toLowerCase().includes(query)
    );
    
    displayAdminBooks(filtered);
}

// Add Book
async function addBook(e) {
    e.preventDefault();
    
    const title = document.getElementById('title').value.trim();
    const author = document.getElementById('author').value.trim();
    const isbn = document.getElementById('isbn').value.trim();
    const totalCopies = document.getElementById('totalCopies').value;
    
    if (!title || !author || !isbn || !totalCopies) {
        alert('❌ Vui lòng điền đầy đủ các trường bắt buộc (*)');
        return;
    }
    
    const bookData = {
        title,
        author,
        isbn,
        category: document.getElementById('category').value,
        totalCopies: parseInt(totalCopies)
    };
    
    // Optional fields
    const publisher = document.getElementById('publisher').value.trim();
    const publishedYear = document.getElementById('publishedYear').value;
    const language = document.getElementById('language').value.trim();
    const description = document.getElementById('description').value.trim();
    
    if (publisher) bookData.publisher = publisher;
    if (publishedYear) bookData.publishedYear = parseInt(publishedYear);
    if (language) bookData.language = language;
    if (description) bookData.description = description;
    
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.books}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Thêm sách thành công!');
            document.getElementById('addBookForm').reset();
            loadAdminBooks();
            showSection('books');
            
            // Update nav
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.querySelector('[data-section="books"]').classList.add('active');
        } else {
            let errorMsg = data.message || 'Unknown error';
            if (data.errors) {
                errorMsg = data.errors.map(e => e.message).join('\n');
            }
            alert('❌ Lỗi: ' + errorMsg);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Lỗi mạng. Vui lòng thử lại.');
    }
}

// Edit Book
async function editBook(bookId) {
    const book = allBooks.find(b => b._id === bookId);
    if (!book) {
        alert('Không tìm thấy sách');
        return;
    }
    
    // Fill form
    document.getElementById('editBookId').value = book._id;
    document.getElementById('editTitle').value = book.title;
    document.getElementById('editAuthor').value = book.author;
    document.getElementById('editIsbn').value = book.isbn;
    document.getElementById('editPublisher').value = book.publisher || '';
    document.getElementById('editPublishedYear').value = book.publishedYear || '';
    document.getElementById('editCategory').value = book.category || 'Other';
    document.getElementById('editTotalCopies').value = book.totalCopies;
    document.getElementById('editStatus').value = book.status || 'Available';
    document.getElementById('editDescription').value = book.description || '';
    
    showSection('edit-book');
}

// Update Book
async function updateBook(e) {
    e.preventDefault();
    
    const bookId = document.getElementById('editBookId').value;
    
    const bookData = {
        title: document.getElementById('editTitle').value.trim(),
        author: document.getElementById('editAuthor').value.trim(),
        publisher: document.getElementById('editPublisher').value.trim() || undefined,
        publishedYear: document.getElementById('editPublishedYear').value ? parseInt(document.getElementById('editPublishedYear').value) : undefined,
        category: document.getElementById('editCategory').value,
        totalCopies: parseInt(document.getElementById('editTotalCopies').value),
        status: document.getElementById('editStatus').value,
        description: document.getElementById('editDescription').value.trim() || undefined
    };
    
    // Remove undefined
    Object.keys(bookData).forEach(key => bookData[key] === undefined && delete bookData[key]);
    
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.books}/${bookId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Cập nhật sách thành công!');
            loadAdminBooks();
            showSection('books');
            
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.querySelector('[data-section="books"]').classList.add('active');
        } else {
            alert('❌ Lỗi: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Lỗi mạng. Vui lòng thử lại.');
    }
}

// Delete Book
function confirmDelete(bookId, bookTitle) {
    bookToDelete = bookId;
    document.getElementById('deleteBookTitle').textContent = bookTitle;
    document.getElementById('deleteModal').style.display = 'block';
    
    document.getElementById('confirmDeleteBtn').onclick = () => deleteBook(bookId);
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    bookToDelete = null;
}

async function deleteBook(bookId) {
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.books}/${bookId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Xóa sách thành công!');
            closeDeleteModal();
            loadAdminBooks();
            loadDashboard();
        } else {
            alert('❌ Lỗi: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Lỗi mạng. Vui lòng thử lại.');
    }
}

// Refresh All Data
function refreshAllData() {
    loadDashboard();
    loadAdminBooks();
    checkHealth();
    alert('✅ Đã tải lại toàn bộ dữ liệu!');
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
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('deleteModal');
    if (event.target === modal) {
        closeDeleteModal();
    }
}
