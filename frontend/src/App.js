import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import AITest from './pages/AITest';
import SkillExchange from './pages/SkillExchange';
import Login from './pages/Login';
import Register from './pages/Register';
import TeacherContent from './pages/TeacherContent';
import CourseView from './pages/CourseView';
import TeacherDashboard from './pages/TeacherDashboard';
import API from './services/api';
import Certificates from './pages/Certificates';
import CertificateView from './pages/CertificateView';

// Add these routes inside the <Routes> section:

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          await API.get('/users/profile');
          console.log('✅ Token verified');
        } catch (err) {
          console.error('❌ Token invalid:', err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
        }
      }
      setLoading(false);
    };
    
    verifyToken();
  }, [token]);

  if (loading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  return (
    <Router>
      {token && <Navbar setToken={setToken} />}
      <div className="container mt-4">
        <Routes>
          <Route path="/login" element={<Login setToken={setToken} />} />
          <Route path="/register" element={<Register setToken={setToken} />} />
          <Route path="/" element={token ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/courses" element={token ? <Courses /> : <Navigate to="/login" />} />
          <Route path="/course/:courseId" element={token ? <CourseView /> : <Navigate to="/login" />} />
          <Route path="/teacher/content/:courseId" element={token ? <TeacherContent /> : <Navigate to="/login" />} />
          <Route path="/teacher/dashboard" element={token ? <TeacherDashboard /> : <Navigate to="/login" />} />
          <Route path="/ai-test" element={token ? <AITest /> : <Navigate to="/login" />} />
          <Route path="/skills" element={token ? <SkillExchange /> : <Navigate to="/login" />} />
<Route path="/certificates" element={token ? <Certificates /> : <Navigate to="/login" />} />
<Route path="/certificate-view/:id" element={token ? <CertificateView /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;