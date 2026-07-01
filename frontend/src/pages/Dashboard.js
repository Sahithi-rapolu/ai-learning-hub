import React, { useState, useEffect } from 'react';
import { Card, Row, Col, ProgressBar, Badge, Spinner } from 'react-bootstrap';
import API from '../services/api';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState([]);
  const [stats, setStats] = useState({ courses: 0, skills: 0, xp: 0, streak: 0 });
  const [loading, setLoading] = useState(true);
  const [myCourses, setMyCourses] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const userRes = await API.get('/users/profile');
        setUser(userRes.data);
        
        const progressRes = await API.get('/progress');
        setProgress(progressRes.data);
        
        const statsRes = await API.get('/users/stats');
        setStats(statsRes.data);
        
        const coursesRes = await API.get('/courses/my-courses');
        setMyCourses(coursesRes.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard:', err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4">📊 Dashboard</h2>
      
      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <h5>📚 Courses</h5>
              <h2>{myCourses.length}</h2>
              <small className="text-muted">Enrolled</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <h5>⚡ Skills</h5>
              <h2>{user?.skills?.length || 0}</h2>
              <small className="text-muted">Learned</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <h5>⭐ XP</h5>
              <h2>{stats.xp}</h2>
              <small className="text-muted">Experience Points</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <h5>📈 Streak</h5>
              <h2>{stats.streak} days</h2>
              <small className="text-muted">Learning Streak</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Learning Progress */}
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">📈 Learning Progress</h5>
            </Card.Header>
            <Card.Body>
              {progress.length === 0 ? (
                <p className="text-muted">No progress yet. Enroll in a course to start learning!</p>
              ) : (
                progress.map((item, idx) => (
                  <div key={idx} className="mb-3">
                    <div className="d-flex justify-content-between">
                      <span>{item.course}</span>
                      <span>{item.completed}%</span>
                    </div>
                    <ProgressBar 
                      now={item.completed} 
                      variant={item.completed > 70 ? 'success' : item.completed > 40 ? 'warning' : 'primary'} 
                    />
                  </div>
                ))
              )}
            </Card.Body>
          </Card>

          {/* Enrolled Courses */}
          {myCourses.length > 0 && (
            <Card className="shadow-sm mt-3">
              <Card.Header>
                <h5 className="mb-0">📖 Your Enrolled Courses</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  {myCourses.map((course) => (
                    <Col md={6} key={course._id} className="mb-2">
                      <Card className="border-start border-primary border-4">
                        <Card.Body className="py-2">
                          <div className="d-flex justify-content-between align-items-center">
                            <span>{course.title}</span>
                            <Badge bg="success">In Progress</Badge>
                          </div>
                          <small className="text-muted">
                            Teacher: {course.teacherId?.name || 'Unknown'}
                          </small>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          )}
        </Col>
        
        {/* Inventory */}
        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">🎒 Inventory</h5>
            </Card.Header>
            <Card.Body>
              {user?.inventory?.length === 0 ? (
                <p className="text-muted">No items in inventory</p>
              ) : (
                user?.inventory?.map((item, idx) => (
                  <div key={idx} className="d-flex justify-content-between mb-2 border-bottom pb-2">
                    <span>{item.item}</span>
                    <Badge bg="primary">{item.quantity}</Badge>
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

export default Dashboard;