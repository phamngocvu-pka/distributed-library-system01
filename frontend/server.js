const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS
app.use(cors());

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Main route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════╗
    ║  📚 Library System Frontend Server    ║
    ╠════════════════════════════════════════╣
    ║  Server running at:                    ║
    ║  → http://localhost:${PORT}             ║
    ║                                        ║
    ║  Backend API:                          ║
    ║  → http://localhost:3001               ║
    ╚════════════════════════════════════════╝
    `);
});
