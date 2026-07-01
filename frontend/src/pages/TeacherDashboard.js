import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Badge, Spinner, ListGroup, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

function TeacherDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalModules: 0,
    totalQuizzes: 0,
    pendingRequests: 0
  });
  const [courses, setCourses] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user profile
      const userRes = await API.get('/users/profile');
      setUser(userRes.data);
      
      // Get all courses
      const coursesRes = await API.get('/courses');
      
      // Filter courses by teacher (using the logged-in user's ID)
      const teacherCourses = coursesRes.data.filter(course => {
        if (!course.teacherId) return false;
        // Handle both populated and unpopulated teacherId
        const teacherId = course.teacherId._id || course.teacherId;
        return teacherId === userRes.data._id;
      });
      
      setCourses(teacherCourses);
      
      // Calculate stats
      let totalStudents = 0;
      let totalModules = 0;
      let totalQuizzes = 0;
      
      for (const course of teacherCourses) {
        totalStudents += course.enrolledStudents?.length || 0;
        // Get course content
        try {
          const contentRes = await API.get(`/courses/${course._id}/content`);
          const modules = contentRes.data.content?.modules || [];
          totalModules += modules.length;
          totalQuizzes += modules.filter(m => m.type === 'quiz').length;
        } catch (err) {
          // No content yet - this is fine
          console.log(`No content for course: ${course.title}`);
        }
      }
      
      // Get pending requests from skills exchange
      try {
        const skillsRes = await API.get('/skills');
        const pendingRequests = skillsRes.data.filter(s => s.status === 'pending').length;
        setStats({
          totalCourses: teacherCourses.length,
          totalStudents,
          totalModules,
          totalQuizzes,
          pendingRequests
        });
      } catch (err) {
        console.error('Error fetching skills:', err);
        setStats({
          totalCourses: teacherCourses.length,
          totalStudents,
          totalModules,
          totalQuizzes,
          pendingRequests: 0
        });
      }
      
      // Recent activity
      if (teacherCourses.length > 0) {
        setRecentActivity([
          { 
            action: '📝 Course created', 
            course: teacherCourses[0]?.title || 'Course', 
            time: 'Recently' 
          },
          { 
            action: '👨‍🎓 Students enrolled', 
            course: teacherCourses[0]?.title || 'Course', 
            time: 'Recently' 
          },
        ]);
      } else {
        setRecentActivity([]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching teacher data:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load dashboard');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading teacher dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4">
        <Alert variant="danger">
          <h5>❌ Error Loading Dashboard</h5>
          <p>{error}</p>
          <Button variant="primary" onClick={fetchData}>
            <i className="bi bi-arrow-repeat me-2"></i>
            Retry
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>👨‍🏫 Teacher Dashboard</h2>
          <p className="text-muted">Welcome back, {user?.name || 'Teacher'}!</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/courses')}>
          <i className="bi bi-plus-circle me-2"></i>
          Create New Course
        </Button>
      </div>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <h5>📚 My Courses</h5>
              <h2>{stats.totalCourses}</h2>
              <small className="text-muted">Created by you</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <h5>👨‍🎓 Students</h5>
              <h2>{stats.totalStudents}</h2>
              <small className="text-muted">Enrolled in your courses</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <h5>📝 Modules</h5>
              <h2>{stats.totalModules}</h2>
              <small className="text-muted">Total content modules</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <h5>📋 Quizzes</h5>
              <h2>{stats.totalQuizzes}</h2>
              <small className="text-muted">Created for students</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* My Courses */}
        <Col md={8}>
          <Card className="shadow-sm mb-4">
            <Card.Header>
              <h5 className="mb-0">📚 My Courses</h5>
            </Card.Header>
            <Card.Body>
              {courses.length === 0 ? (
                <Alert variant="info">
                  <i className="bi bi-info-circle me-2"></i>
                  You haven't created any courses yet. 
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="ms-2" 
                    onClick={() => navigate('/courses')}
                  >
                    Create One Now
                  </Button>
                </Alert>
              ) : (
                <ListGroup variant="flush">
                  {courses.map((course) => (
                    <ListGroup.Item key={course._id} className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{course.title}</strong>
                        <div className="text-muted small">
                          <i className="bi bi-people me-1"></i>
                          {course.enrolledStudents?.length || 0} students • 
                          <Badge bg="secondary" className="ms-1">{course.category}</Badge>
                        </div>
                      </div>
                      <div>
                        <Badge bg="info" className="me-2">
                          {course.level}
                        </Badge>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => navigate(`/teacher/content/${course._id}`)}
                        >
                          <i className="bi bi-pencil me-1"></i>
                          Manage
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Quick Actions & Stats */}
        <Col md={4}>
          {/* Quick Actions */}
          <Card className="shadow-sm mb-4">
            <Card.Header>
              <h5 className="mb-0">⚡ Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <Button 
                variant="outline-primary" 
                className="w-100 mb-2"
                onClick={() => navigate('/courses')}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Create New Course
              </Button>
              <Button 
                variant="outline-success" 
                className="w-100 mb-2"
                onClick={() => navigate('/courses')}
              >
                <i className="bi bi-people me-2"></i>
                View All Courses
              </Button>
              <Button 
                variant="outline-info" 
                className="w-100"
                onClick={() => navigate('/skills')}
              >
                <i className="bi bi-handshake me-2"></i>
                Skills Exchange
                {stats.pendingRequests > 0 && (
                  <Badge bg="danger" className="ms-2">{stats.pendingRequests}</Badge>
                )}
              </Button>
            </Card.Body>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">🔄 Recent Activity</h5>
            </Card.Header>
            <Card.Body>
              {recentActivity.length === 0 ? (
                <p className="text-muted text-center">No recent activity</p>
              ) : (
                recentActivity.map((activity, index) => (
                  <div key={index} className="border-bottom pb-2 mb-2">
                    <div>{activity.action}</div>
                    <div className="text-muted small">
                      {activity.course} • {activity.time}
                    </div>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default TeacherDashboard;