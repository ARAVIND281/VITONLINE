const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'supersecretkey123'; // In production, use environment variable

// Mock Database
const users = [
    { username: 'faculty1', password: 'password', role: 'faculty' },
    { username: 'student1', password: 'password', role: 'student' }
];

let exams = [];
let submissions = [];

// Flow: Login -> JWT Generation (with Role)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Generate Token
        const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, role: user.role });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// Middleware: Token Verification & Role-Based Authorization
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1]; // Bearer <token>
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) return res.status(403).json({ message: 'Token is invalid or expired' });
            req.user = user;
            next();
        });
    } else {
        res.status(401).json({ message: 'Authorization header is missing' });
    }
};

const authorizeRole = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied: Insufficient privileges' });
        }
        next();
    };
};

// FACULTY ENDPOINTS
app.post('/api/exams', authenticateJWT, authorizeRole('faculty'), (req, res) => {
    const { title, questions } = req.body;
    const newExam = { id: exams.length + 1, title, questions };
    exams.push(newExam);
    res.status(201).json(newExam);
});

app.get('/api/submissions', authenticateJWT, authorizeRole('faculty'), (req, res) => {
    res.json(submissions);
});

app.get('/api/results', authenticateJWT, authorizeRole('faculty'), (req, res) => {
    // Generate dummy aggregated results
    const results = submissions.map(s => ({
        student: s.student,
        examId: s.examId,
        score: Math.floor(Math.random() * 100) + '%'
    }));
    res.json(results);
});

// STUDENT ENDPOINTS
app.get('/api/exams', authenticateJWT, authorizeRole('student', 'faculty'), (req, res) => {
    res.json(exams);
});

app.post('/api/exams/:id/submit', authenticateJWT, authorizeRole('student'), (req, res) => {
    const { answers } = req.body;
    submissions.push({
        student: req.user.username,
        examId: req.params.id,
        answers,
        submittedAt: new Date()
    });
    res.status(201).json({ message: 'Exam submitted successfully' });
});

app.listen(5001, () => {
    console.log('Backend running on http://localhost:5001');
});
