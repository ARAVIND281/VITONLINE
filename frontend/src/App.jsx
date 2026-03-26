import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5001/api';

// VITONLINE Examination System - JWT Authentication with Role-Based Access
// ARAVIND S - CNS Lab 4

const SECRET_KEY = 'VITOnlineExaminationSystemSecretKey2025CNSLab';

// Simulated user database
const users = {
  student1: { password: 'pass123', role: 'STUDENT' },
  student2: { password: 'pass456', role: 'STUDENT' },
  faculty1: { password: 'faculty123', role: 'FACULTY' },
  faculty2: { password: 'faculty456', role: 'FACULTY' }
};

// Exam questions
const examQuestions = [
  { id: 1, question: 'What is the full form of CIA in security?', marks: 5 },
  { id: 2, question: 'Which algorithm is used for symmetric encryption?', marks: 5 },
  { id: 3, question: 'What is the purpose of HMAC?', marks: 5 }
];

// Base64 URL encoding
const base64UrlEncode = (str) => {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

const base64UrlDecode = (str) => {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
};

// Simple HMAC-SHA256 simulation (for demo purposes)
const generateSignature = async (data) => {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(SECRET_KEY);
  const messageData = encoder.encode(data);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
};

// Verify signature
const verifySignature = async (headerPayload, signature) => {
  const expectedSignature = await generateSignature(headerPayload);
  return expectedSignature === signature;
};

// ----------- THEME AND UTILS -----------
const theme = {
  bg: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
  surface: 'rgba(255, 255, 255, 0.05)',
  surfaceHover: 'rgba(255, 255, 255, 0.08)',
  border: 'rgba(255, 255, 255, 0.1)',
  textMain: '#f8fafc',
  textMuted: '#94a3b8',
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  success: '#10b981',
  successBg: 'rgba(16, 185, 129, 0.1)',
  error: '#ef4444',
  errorBg: 'rgba(239, 68, 68, 0.1)',
  terminal: '#020617',
  accent: '#8b5cf6'
};

const glassObject = {
  background: theme.surface,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: `1px solid ${theme.border}`,
  borderRadius: '16px',
};
// ----------------------------------------

export default function VITOnlineExamSystem() {
  const [currentView, setCurrentView] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [logs, setLogs] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [answers, setAnswers] = useState({});
  const [tokenDetails, setTokenDetails] = useState(null);
  const [error, setError] = useState('');
  const [accessResult, setAccessResult] = useState(null);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showTokenBreakdown, setShowTokenBreakdown] = useState(false);
  const logEndRef = useRef(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [logs]);

  const addLog = (phase, message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { phase, message, type, timestamp }]);
  };

  const clearLogs = () => setLogs([]);

  // Generate JWT Token
  const generateJWT = async (username, role) => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      sub: username,
      role: role,
      iat: Date.now(),
      exp: Date.now() + 3600000 // 1 hour
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signature = await generateSignature(`${encodedHeader}.${encodedPayload}`);

    return {
      token: `${encodedHeader}.${encodedPayload}.${signature}`,
      header,
      payload,
      encodedHeader,
      encodedPayload,
      signature
    };
  };

  // Axios Login Handler
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    clearLogs(); setError(''); setAccessResult(null); setIsLoggingIn(true);
    setCurrentPhase(1);
    addLog('PHASE 1', '═══ USER AUTHENTICATION ═══', 'header');
    addLog('PHASE 1', `Username: ${username}`, 'info');
    addLog('PHASE 1', `Password: ${'*'.repeat(password.length)}`, 'info');

    try {
      const response = await axios.post(`${API_BASE}/login`, { username, password });
      const { token: jwtToken, role } = response.data;
      addLog('PHASE 1', '✓ Authentication Successful!', 'success');
      addLog('PHASE 1', `Role: ${role.toUpperCase()}`, 'info');

      setCurrentPhase(2);
      addLog('PHASE 2', '═══ JWT TOKEN ISSUED ═══', 'header');
      const parts = jwtToken.split('.');
      const header = JSON.parse(base64UrlDecode(parts[0]));
      const payload = JSON.parse(base64UrlDecode(parts[1]));
      
      const jwtData = {
        token: jwtToken,
        header, payload,
        encodedHeader: parts[0],
        encodedPayload: parts[1],
        signature: parts[2]
      };

      addLog('PHASE 2', 'Token retrieved from backend successfully!', 'success');
      addLog('PHASE 2', `Signature: ${parts[2]}`, 'code');
      setToken(jwtToken); setUserRole(role.toUpperCase()); setTokenDetails(jwtData); setCurrentView('dashboard');
    } catch (err) {
      addLog('PHASE 1', '✗ Authentication Failed!', 'error');
      setError('Invalid username or password');
    }
    setIsLoggingIn(false);
  };

  // Secure API Call utilizing Backend
  const accessResource = async (endpoint, action, method = 'get', body = null) => {
    setAccessResult(null); setCurrentPhase(3);
    addLog('PHASE 3', '═══ SECURE HTTP REQUEST ═══', 'header');
    addLog('PHASE 3', `Requesting: ${method.toUpperCase()} /api/${endpoint}`, 'info');
    addLog('PHASE 3', `Attaching Token: Bearer ${token.substring(0, 15)}...`, 'code');

    setCurrentPhase(4);
    addLog('PHASE 4', '═══ BACKEND AUTHORIZATION ═══', 'header');
    addLog('PHASE 4', 'Awaiting server RBAC response...', 'info');

    try {
      const res = await axios({
        method, url: `${API_BASE}/${endpoint}`,
        headers: { Authorization: `Bearer ${token}` },
        data: body
      });
      setCurrentPhase(5);
      addLog('PHASE 4', `✓ Access GRANTED (200 OK) - Executed: ${action}`, 'success');
      setAccessResult({ success: true, message: `Access granted to /api/${endpoint}` });
      return { success: true, data: res.data };
    } catch (err) {
      setCurrentPhase(5);
      addLog('PHASE 4', `✗ Access DENIED (${err.response?.status || 500}) - Blocked from ${action}`, 'error');
      setAccessResult({ success: false, message: err.response?.data?.message || 'Access Denied' });
      return { success: false };
    }
  };

  // Submit Answer -> Backend
  const submitAnswer = async (questionId) => {
    const res = await accessResource(`exams/${questionId}/submit`, 'submit answers', 'post', { answers: [answers[questionId]] });
    if (res.success) {
      setSubmissions(prev => ({
        ...prev,
        [username]: { ...prev[username], [questionId]: answers[questionId] }
      }));
      addLog('SUBMIT', `Answer submitted for Q${questionId}: ${answers[questionId]}`, 'success');
    }
  };

  // Test Tampered Token
  const testTamperedToken = async () => {
    setCurrentPhase(3);
    addLog('SECURITY', '═══ TESTING INCORRECT TOKEN ═══', 'header');
    const tamperedToken = token.slice(0, -5) + 'XXXXX';
    addLog('SECURITY', `Original Token: ${token.substring(0, 25)}...`, 'code');
    addLog('SECURITY', `Tampered Token: ${tamperedToken.substring(0, 25)}...XXXXX`, 'code');
    addLog('SECURITY', 'Sending request with tampered token...', 'info');
    
    try {
      await axios.get(`${API_BASE}/exams`, { headers: { Authorization: `Bearer ${tamperedToken}` } });
      addLog('SECURITY', 'Wait... backend accepted it? This is a flaw.', 'error');
    } catch (err) {
      addLog('SECURITY', `✓ Request naturally rejected by backend: ${err.response?.data?.message || 'Unauthorized'}`, 'success');
      setAccessResult({ success: false, message: 'Backend correctly rejected tampered token!' });
    }
  };

  // Logout
  const handleLogout = () => {
    setToken(null); setUserRole(null); setTokenDetails(null);
    setUsername(''); setPassword(''); setLogs([]); setAccessResult(null);
    setCurrentPhase(0); setShowTokenBreakdown(false); setCurrentView('login');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: theme.bg,
      color: theme.textMain,
      fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Dynamic Header */}
      <header style={{
        ...glassObject,
        borderRadius: '0',
        borderTop: 'none', borderLeft: 'none', borderRight: 'none',
        padding: '1.2rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`, 
            padding: '0.6rem', 
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
          }}>
            🎓
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
              VIT<span style={{ color: theme.primary }}>ONLINE</span> <span style={{ fontWeight: 400, color: theme.textMuted }}>Security Lab</span>
            </h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: theme.textMuted, marginTop: '2px' }}>
              JWT Authentication & Role-Based Access Control
            </p>
          </div>
        </div>
        
        {token && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(0,0,0,0.2)', padding: '0.4rem 1rem', borderRadius: '30px', border: `1px solid ${theme.border}` }}>
              <span style={{ 
                background: userRole === 'FACULTY' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                padding: '0.2rem 0.8rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.5px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
              }}>
                {userRole}
              </span>
              <span style={{ fontWeight: 500, color: '#e2e8f0' }}>@{username}</span>
            </div>
            <button onClick={handleLogout} style={{
              background: 'transparent',
              border: `1px solid ${theme.border}`,
              color: theme.textMain,
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; e.currentTarget.style.color = theme.error; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.textMain; }}
            >
              Sign Out
            </button>
          </div>
        )}
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Main Content Area */}
        <main style={{ flex: 1, padding: '2.5rem', overflowY: 'auto', position: 'relative' }}>
          
          {currentView === 'login' && (
            <div style={{ 
              maxWidth: '420px', 
              margin: '6vh auto',
              animation: 'fadeIn 0.5s ease-out'
            }}>
              <form onSubmit={handleLogin} style={{
                ...glassObject,
                padding: '2.5rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: theme.primary, filter: 'blur(80px)', opacity: 0.3, zIndex: 0 }}></div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem', fontWeight: 600 }}>Welcome Back</h2>
                    <p style={{ color: theme.textMuted, margin: 0, fontSize: '0.9rem' }}>Sign in to access your dashboard</p>
                  </div>
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.6rem', color: theme.textMuted, fontSize: '0.85rem', fontWeight: 500 }}>Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. student1"
                      style={{
                        width: '100%',
                        padding: '0.9rem 1rem',
                        borderRadius: '10px',
                        border: `1px solid ${theme.border}`,
                        background: 'rgba(0,0,0,0.2)',
                        color: theme.textMain,
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        transition: 'all 0.2s',
                        outline: 'none'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 3px rgba(59, 130, 246, 0.1)`; }}
                      onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>

                  <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.6rem', color: theme.textMuted, fontSize: '0.85rem', fontWeight: 500 }}>Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '0.9rem 1rem',
                        borderRadius: '10px',
                        border: `1px solid ${theme.border}`,
                        background: 'rgba(0,0,0,0.2)',
                        color: theme.textMain,
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        transition: 'all 0.2s',
                        outline: 'none'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 3px rgba(59, 130, 246, 0.1)`; }}
                      onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>

                  {error && (
                    <div style={{ 
                      background: theme.errorBg, 
                      padding: '0.8rem 1rem', 
                      borderRadius: '8px',
                      marginBottom: '1.5rem',
                      color: theme.error,
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      border: `1px solid rgba(239, 68, 68, 0.2)`
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      padding: '1rem',
                      background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`,
                      border: 'none',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '1rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.6)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.4)'; }}
                  >
                    Authenticate & Generate JWT
                  </button>
                </div>
              </form>

              <div style={{ 
                marginTop: '2rem', 
                padding: '1.5rem', 
                ...glassObject,
                background: 'rgba(0,0,0,0.2)',
                border: `1px dashed ${theme.border}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  <p style={{ margin: 0, color: theme.textMuted, fontWeight: 600, fontSize: '0.9rem' }}>Demo Credentials</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 0.3rem', fontSize: '0.75rem', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>Student</p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: theme.textMain }}><code>student1</code> / <code>pass123</code></p>
                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem', color: theme.textMain }}><code>student2</code> / <code>pass456</code></p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 0.3rem', fontSize: '0.75rem', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>Faculty</p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: theme.textMain }}><code>faculty1</code> / <code>faculty123</code></p>
                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem', color: theme.textMain }}><code>faculty2</code> / <code>faculty456</code></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView === 'dashboard' && (
            <div style={{ animation: 'fadeIn 0.5s ease-out', maxWidth: '1000px', margin: '0 auto' }}>
              
              {/* Access Result Alert */}
              {accessResult && (
                <div style={{
                  background: accessResult.success ? theme.successBg : theme.errorBg,
                  borderRadius: '12px',
                  padding: '1rem 1.5rem',
                  marginBottom: '2rem',
                  border: `1px solid ${accessResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  animation: 'slideDown 0.3s ease-out'
                }}>
                  <div style={{ 
                    background: accessResult.success ? theme.success : theme.error, 
                    color: '#fff', 
                    borderRadius: '50%', 
                    width: '24px', height: '24px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 'bold'
                  }}>
                    {accessResult.success ? '✓' : '✗'}
                  </div>
                  <span style={{ color: accessResult.success ? theme.success : theme.error, fontWeight: 500 }}>
                    {accessResult.message}
                  </span>
                </div>
              )}

              {/* Token Info */}
              {tokenDetails && (
                <div style={{
                  ...glassObject,
                  padding: '1.5rem',
                  marginBottom: '2.5rem',
                  border: `1px solid rgba(59, 130, 246, 0.3)`,
                  background: 'linear-gradient(145deg, rgba(59,130,246,0.05) 0%, rgba(0,0,0,0.2) 100%)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    <h3 style={{ margin: 0, color: theme.primary, fontWeight: 600 }}>Active JWT Token</h3>
                  </div>
                  <div style={{ 
                    background: theme.terminal, 
                    padding: '1rem',
                    borderRadius: '8px',
                    border: `1px solid #1e293b`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <code style={{ 
                      color: '#a5b4fc',
                      fontFamily: '"Fira Code", monospace',
                      fontSize: '0.85rem',
                      lineHeight: '1.5',
                      wordBreak: 'break-all'
                    }}>
                      <span style={{ color: '#fb7185' }}>{tokenDetails.encodedHeader}</span>
                      <span style={{ color: '#fff' }}>.</span>
                      <span style={{ color: '#c084fc' }}>{tokenDetails.encodedPayload}</span>
                      <span style={{ color: '#fff' }}>.</span>
                      <span style={{ color: '#34d399' }}>{tokenDetails.signature}</span>
                    </code>
                  </div>
                </div>
              )}

              {/* Action Buttons Grid */}
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <h2 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 600 }}>Control Panel</h2>
                <div style={{ height: '1px', flex: 1, background: `linear-gradient(90deg, ${theme.border} 0%, transparent 100%)` }}></div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.2rem',
                marginBottom: '3rem'
              }}>
                <ActionButton 
                  icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>}
                  title="View Questions"
                  subtitle="Accessible by Student & Faculty"
                  color="#3b82f6" // blue
                  onClick={() => accessResource('exams', 'view questions')}
                />
                <ActionButton 
                  icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>}
                  title="Submit Answer"
                  subtitle="Accessible by Student Only"
                  color="#10b981" // emerald
                  onClick={() => accessResource('exams/1/submit', 'test submit answers permission', 'post', { answers: [] })}
                />
                <ActionButton 
                  icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>}
                  title="Create Exam"
                  subtitle="Accessible by Faculty Only"
                  color="#f59e0b" // amber
                  onClick={() => accessResource('exams', 'create exams', 'post', { title: 'Test Exam', questions: [] })}
                />
                <ActionButton 
                  icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>}
                  title="View Submissions"
                  subtitle="Accessible by Faculty Only"
                  color="#8b5cf6" // violet
                  onClick={() => accessResource('submissions', 'view submissions')}
                />
                <ActionButton 
                  icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>}
                  title="Manage Results"
                  subtitle="Accessible by Faculty Only"
                  color="#ec4899" // pink
                  onClick={() => accessResource('results', 'manage results')}
                />
                <ActionButton 
                  icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>}
                  title="Test Tampered Token"
                  subtitle="Security Vulnerability Test"
                  color="#ef4444" // red
                  onClick={testTamperedToken}
                />
              </div>

              {/* Exam Questions Section */}
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <h2 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 600 }}>Examination Portal</h2>
                <div style={{ height: '1px', flex: 1, background: `linear-gradient(90deg, ${theme.border} 0%, transparent 100%)` }}></div>
              </div>

              <div style={{
                ...glassObject,
                padding: '2rem',
                marginBottom: '3rem'
              }}>
                {examQuestions.map((q, index) => (
                  <div key={q.id} style={{
                    background: 'rgba(0,0,0,0.2)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    marginBottom: index !== examQuestions.length - 1 ? '1.5rem' : '0',
                    border: `1px solid ${theme.border}`,
                    borderLeft: `4px solid ${theme.primary}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 500, lineHeight: '1.5' }}>
                        <span style={{ color: theme.primary, fontWeight: 'bold', marginRight: '0.5rem' }}>Q{q.id}.</span> 
                        {q.question}
                      </p>
                      <span style={{ 
                        background: 'rgba(255,255,255,0.05)', 
                        padding: '0.3rem 0.8rem', 
                        borderRadius: '20px', 
                        fontSize: '0.8rem',
                        color: theme.textMuted,
                        border: `1px solid ${theme.border}`
                      }}>
                        {q.marks} marks
                      </span>
                    </div>

                    {userRole === 'STUDENT' && (
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <input
                            type="text"
                            placeholder="Type your secure answer here..."
                            value={answers[q.id] || ''}
                            onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '0.8rem 1rem',
                              borderRadius: '8px',
                              border: `1px solid ${theme.border}`,
                              background: 'rgba(255,255,255,0.03)',
                              color: theme.textMain,
                              fontSize: '0.95rem',
                              transition: 'all 0.2s',
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                            onFocus={(e) => { e.target.style.borderColor = theme.success; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
                            onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.background = 'rgba(255,255,255,0.03)'; }}
                          />
                        </div>
                        <button
                          onClick={() => submitAnswer(q.id)}
                          style={{
                            padding: '0 1.5rem',
                            background: theme.success,
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)'
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.filter = 'brightness(1)'; }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                          Submit
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Submissions (Faculty View) */}
              {userRole === 'FACULTY' && Object.keys(submissions).length > 0 && (
                <>
                  <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <h2 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 600 }}>Student Submissions</h2>
                    <div style={{ height: '1px', flex: 1, background: `linear-gradient(90deg, ${theme.border} 0%, transparent 100%)` }}></div>
                  </div>
                  
                  <div style={{
                    ...glassObject,
                    padding: '2rem',
                    borderLeft: `4px solid ${theme.accent}`,
                  }}>
                    {Object.entries(submissions).map(([student, stdAnswers], idx) => (
                      <div key={student} style={{ 
                        marginBottom: idx !== Object.keys(submissions).length - 1 ? '2rem' : '0',
                        paddingBottom: idx !== Object.keys(submissions).length - 1 ? '2rem' : '0',
                        borderBottom: idx !== Object.keys(submissions).length - 1 ? `1px dashed ${theme.border}` : 'none'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.accent, fontWeight: 'bold' }}>
                            {student.charAt(0).toUpperCase()}
                          </div>
                          <h4 style={{ margin: 0, fontSize: '1.1rem', color: theme.textMain }}>{student}</h4>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingLeft: '2.8rem' }}>
                          {Object.entries(stdAnswers).map(([qId, ans]) => (
                            <div key={qId} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                              <span style={{ fontSize: '0.8rem', color: theme.textMuted, display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>QUESTION {qId}</span>
                              <span style={{ color: theme.textMain }}>{ans}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </main>

        {/* High-Tech Logs Panel Sidebar */}
        <aside style={{
          width: '420px',
          background: theme.terminal,
          borderLeft: `1px solid ${theme.border}`,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.3)',
          zIndex: 10
        }}>
          <div style={{ 
            padding: '1.2rem 1.5rem',
            borderBottom: `1px solid #1e293b`,
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            background: '#0f172a'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
              <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.5px' }}>SYSTEM TERMINAL</h3>
            </div>
            <button onClick={clearLogs} style={{
              background: 'transparent',
              border: '1px solid #334155',
              color: '#94a3b8',
              padding: '0.3rem 0.8rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#fff'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
            >
              CLEAR
            </button>
          </div>
          
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '1rem 1.5rem',
            fontFamily: '"Fira Code", "Courier New", monospace',
            fontSize: '0.8rem',
            lineHeight: '1.6',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            scrollbarWidth: 'thin',
            scrollbarColor: '#334155 transparent'
          }}>
            {logs.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem', color: '#475569' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                <p style={{ color: '#475569', textAlign: 'center', margin: 0 }}>Waiting for system events...</p>
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} style={{ 
                  animation: 'fadeIn 0.3s ease-out',
                  marginBottom: log.type === 'header' ? '0.5rem' : '0',
                  marginTop: log.type === 'header' && i !== 0 ? '1rem' : '0'
                }}>
                  {log.type === 'header' ? (
                    <div style={{ 
                      color: theme.primary, 
                      fontWeight: 700,
                      padding: '0.4rem 0.6rem',
                      background: 'rgba(59, 130, 246, 0.1)',
                      borderLeft: `2px solid ${theme.primary}`,
                      letterSpacing: '0.5px'
                    }}>
                      <span style={{ color: '#64748b', marginRight: '0.5rem', fontWeight: 'normal' }}>[{log.timestamp}]</span>
                      {log.message}
                    </div>
                  ) : (
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'baseline'
                    }}>
                      <span style={{ color: '#475569', marginRight: '0.8rem', fontSize: '0.7rem', flexShrink: 0 }}>{log.timestamp}</span>
                      <span style={{ color: '#64748b', marginRight: '0.5rem', flexShrink: 0 }}>❯</span>
                      <span style={{ 
                        color: log.type === 'success' ? '#34d399' : 
                               log.type === 'error' ? '#f87171' : 
                               log.type === 'code' ? '#cbd5e1' : '#94a3b8',
                        wordBreak: 'break-all'
                      }}>
                        {log.message}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
            {/* Blinking cursor effect at the bottom of logs */}
            {logs.length > 0 && (
              <div style={{ marginTop: '0.5rem', color: '#475569', animation: 'blink 1s step-end infinite' }}>▋</div>
            )}
          </div>
        </aside>
      </div>

      {/* Global CSS for animations */}
          </div>
  );
}

// Enhanced Action Button Component
function ActionButton({ icon, title, subtitle, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: `linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.2) 100%)`,
        border: `1px solid rgba(255,255,255,0.05)`,
        borderRadius: '16px',
        padding: '1.5rem',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseOver={(e) => { 
        e.currentTarget.style.transform = 'translateY(-4px)'; 
        e.currentTarget.style.borderColor = `${color}66`;
        e.currentTarget.style.boxShadow = `0 10px 25px -5px ${color}33`;
        e.currentTarget.querySelector('.icon-container').style.transform = 'scale(1.1)';
      }}
      onMouseOut={(e) => { 
        e.currentTarget.style.transform = 'translateY(0)'; 
        e.currentTarget.style.borderColor = `rgba(255,255,255,0.05)`;
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.querySelector('.icon-container').style.transform = 'scale(1)';
      }}
    >
      <div 
        className="icon-container"
        style={{ 
          color: color, 
          background: `${color}1A`, 
          padding: '0.8rem', 
          borderRadius: '12px',
          display: 'inline-flex',
          transition: 'transform 0.3s ease'
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.3rem' }}>{title}</div>
        <div style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.4' }}>{subtitle}</div>
      </div>
      
      {/* Decorative gradient blur in background */}
      <div style={{
        position: 'absolute',
        bottom: '-20px',
        right: '-20px',
        width: '100px',
        height: '100px',
        background: color,
        filter: 'blur(50px)',
        opacity: 0.1,
        pointerEvents: 'none'
      }}></div>
    </button>
  );
}
