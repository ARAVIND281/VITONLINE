import React, { useState } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

const api = axios.create({
  baseURL: 'http://localhost:5001/api'
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/login', { username, password });
      onLogin(res.data.token, res.data.role);
    } catch (err) { alert('Login failed'); }
  };

  return (
    <form onSubmit={submit}>
      <h2>Login</h2>
      <input placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} /><br/>
      <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} /><br/>
      <button type="submit">Login</button>
    </form>
  );
}

function FacultyDashboard() {
  const [title, setTitle] = useState('');
  const [subs, setSubs] = useState([]);

  const createExam = () => api.post('/exams', { title, questions:['Q1'] }).then(() => alert('Created'));
  const loadSubs = () => api.get('/submissions').then(res => setSubs(res.data));

  return (
    <div>
      <h3>Faculty</h3>
      <input value={title} onChange={e=>setTitle(e.target.value)}/> <button onClick={createExam}>Make Exam</button>
      <hr/>
      <button onClick={loadSubs}>View Subs</button>
      {subs.map((s,i) => <div key={i}>{s.student} - Exam {s.examId}</div>)}
    </div>
  );
}

function StudentDashboard() {
  const [exams, setExams] = useState([]);

  const loadExams = () => api.get('/exams').then(res => setExams(res.data));
  const submitExam = (id) => api.post(`/exams/${id}/submit`, { answers:['A1'] }).then(() => alert('Submitted'));

  return (
    <div>
      <h3>Student</h3>
      <button onClick={loadExams}>View Exams</button>
      {exams.map(ex => <div key={ex.id}>{ex.title} <button onClick={()=>submitExam(ex.id)}>Submit</button></div>)}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    const role = localStorage.getItem('role');
    return role ? { role } : null;
  });

  const login = (token, role) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    setUser({ role });
  };

  const logout = () => { localStorage.clear(); setUser(null); };

  return (
    <Router>
      <div style={{padding: 20}}>
        <h1>VITONLINE Exam System</h1>
        {user && <button onClick={logout}>Logout</button>}
        <Routes>
          <Route path="/" element={!user ? <Login onLogin={login}/> : <Navigate to={user.role==='faculty'?'/faculty':'/student'}/>} />
          <Route path="/faculty" element={user?.role==='faculty' ? <FacultyDashboard/> : <Navigate to="/"/>} />
          <Route path="/student" element={user?.role==='student' ? <StudentDashboard/> : <Navigate to="/"/>} />
        </Routes>
      </div>
    </Router>
  );
}
