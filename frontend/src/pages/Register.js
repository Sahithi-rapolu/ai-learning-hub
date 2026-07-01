import React, { useState } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';

function Register({ setToken }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      console.log('📝 Attempting registration:', formData);
      
      const response = await API.post('/auth/register', formData);
      console.log('✅ Registration response:', response.data);
      
      const { token, user } = response.data;
      
      // Store token and user
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set the token in axios headers
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setToken(token);
      navigate('/');
      
    } catch (err) {
      console.error('❌ Registration error:', err);
      if (err.response) {
        setError(err.response.data?.error || 'Registration failed');
      } else if (err.request) {
        setError('Cannot connect to server. Make sure backend is running.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card style={{ width: '400px' }} className="p-4 shadow">
        <h3 className="text-center mb-4">📝 Register</h3>
        
        {error && (
          <Alert variant="danger" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Full Name</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
              disabled={loading}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Role</Form.Label>
            <Form.Select 
              name="role" 
              value={formData.role} 
              onChange={handleChange}
              disabled={loading}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </Form.Select>
          </Form.Group>
          
          <Button 
            type="submit" 
            variant="primary" 
            className="w-100"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </Button>
        </Form>
        
        <div className="text-center mt-3">
          <Link to="/login">Already have an account? Login</Link>
        </div>
      </Card>
    </div>
  );
}

export default Register;