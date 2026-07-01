import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import Notifications from './Notifications';


function Navigation({ setToken }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await API.get('/users/profile');
        setUser(response.data);
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    navigate('/login');
  };

  return (
    <Navbar bg="primary" variant="dark" expand="lg" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/">
          🤖 AI-Learning HUB
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Dashboard</Nav.Link>
            <Nav.Link as={Link} to="/courses">Courses</Nav.Link>
            <Nav.Link as={Link} to="/certificates">🏆 Certificates</Nav.Link>
            <Nav.Link as={Link} to="/ai-test">AI Test</Nav.Link>
            <Nav.Link as={Link} to="/skills">Skills Exchange</Nav.Link>
            {user?.role === 'teacher' && (
              <Nav.Link as={Link} to="/teacher/dashboard">
                👨‍🏫 Teacher Dashboard
              </Nav.Link>
            )}
          </Nav>
          <div className="d-flex align-items-center">
            {/* ✅ Notifications */}
            <Notifications />
            <div className="text-light me-3 ms-3">
              <small>{user?.name} ({user?.role})</small>
            </div>
            <Button variant="outline-light" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Navigation;