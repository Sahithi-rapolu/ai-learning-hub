import React, { useState } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';

function Login({ setToken }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      console.log('📝 Attempting login for:', email);
      
      const response = await API.post('/auth/login', { email, password });
      console.log('✅ Login response:', response.data);
      
      const { token, user } = response.data;
      
      // ✅ Store token and user
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // ✅ Set the token in axios headers
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Update state
      setToken(token);
      
      // Navigate to dashboard
      navigate('/');
      
    } catch (err) {
      console.error('❌ Login error:', err);
      console.error('Error response:', err.response);
      
      if (err.response) {
        setError(err.response.data?.error || 'Login failed');
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
        <h3 className="text-center mb-4">🔐 Login</h3>
        
        {error && (
          <Alert variant="danger" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </Form.Group>
          
          <Button 
            type="submit" 
            variant="primary" 
            className="w-100"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </Form>
        
        <div className="text-center mt-3">
          <Link to="/register">Don't have an account? Register</Link>
        </div>
        
        <div className="text-center mt-2">
          <small className="text-muted">
            Demo: student@example.com / password123
          </small>
        </div>
      </Card>
    </div>
  );
}

export default Login;