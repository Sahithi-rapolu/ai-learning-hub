import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Button, Badge, Alert, Spinner, 
  Modal, Form 
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

function Courses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [user, setUser] = useState(null);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    category: '',
    level: 'beginner'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get user info
      const userRes = await API.get('/users/profile');
      setUser(userRes.data);
      console.log('✅ Logged in user:', userRes.data);
      console.log('User ID:', userRes.data._id);
      
      // Get all courses
      const coursesRes = await API.get('/courses');
      setCourses(coursesRes.data);
      console.log('✅ Courses loaded:', coursesRes.data);
      
      // Log teacher IDs for debugging
      coursesRes.data.forEach(course => {
        console.log(`Course "${course.title}" - Teacher ID:`, course.teacherId);
        if (course.teacherId && typeof course.teacherId === 'object') {
          console.log(`  - Teacher Object ID: ${course.teacherId._id}`);
          console.log(`  - Teacher Name: ${course.teacherId.name}`);
        }
      });
      
      // Get enrolled courses
      const myCoursesRes = await API.get('/courses/my-courses');
      setMyCourses(myCoursesRes.data);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setMessage({ text: 'Error loading courses', type: 'danger' });
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      setEnrolling(courseId);
      setMessage({ text: '', type: '' });
      
      const response = await API.post(`/courses/enroll/${courseId}`);
      
      setMessage({ 
        text: response.data.message || '✅ Successfully enrolled!', 
        type: 'success' 
      });
      
      await fetchData();
      
    } catch (err) {
      setMessage({ 
        text: err.response?.data?.error || 'Failed to enroll', 
        type: 'danger' 
      });
    } finally {
      setEnrolling(null);
    }
  };

  const isEnrolled = (courseId) => {
    return myCourses.some(course => course._id === courseId);
  };

  const getLevelColor = (level) => {
    const colors = {
      beginner: 'success',
      intermediate: 'warning',
      advanced: 'danger'
    };
    return colors[level] || 'primary';
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    
    if (!newCourse.title || !newCourse.description || !newCourse.category) {
      setMessage({ text: 'Please fill in all required fields', type: 'warning' });
      return;
    }
    
    try {
      setCreating(true);
      setMessage({ text: '', type: '' });
      
      const response = await API.post('/courses', newCourse);
      
      setMessage({ 
        text: '✅ Course created successfully!', 
        type: 'success' 
      });
      
      setNewCourse({
        title: '',
        description: '',
        category: '',
        level: 'beginner'
      });
      setShowCreateModal(false);
      await fetchData();
      
    } catch (err) {
      console.error('Create course error:', err);
      setMessage({ 
        text: err.response?.data?.error || 'Failed to create course', 
        type: 'danger' 
      });
    } finally {
      setCreating(false);
    }
  };

  const handleInputChange = (e) => {
    setNewCourse({
      ...newCourse,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading courses...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>📚 Available Courses</h2>
        <div>
          <Badge bg="info" className="me-2">
            {myCourses.length} Enrolled
          </Badge>
          {user?.role === 'teacher' && (
            <Button 
              variant="primary" 
              onClick={() => setShowCreateModal(true)}
            >
              <i className="bi bi-plus-circle me-2"></i>Create Course
            </Button>
          )}
        </div>
      </div>

      {message.text && (
        <Alert 
          variant={message.type} 
          onClose={() => setMessage({ text: '', type: '' })} 
          dismissible
        >
          {message.text}
        </Alert>
      )}

      {/* Debug info - remove this after testing */}
      {user && (
        <Alert variant="info" className="small">
          <strong>Debug:</strong> You are logged in as <strong>{user.name}</strong> (ID: {user._id}) with role: <strong>{user.role}</strong>
        </Alert>
      )}

      <Row>
        {courses.length === 0 ? (
          <Col>
            <Alert variant="info">
              No courses available yet. 
              {user?.role === 'teacher' && ' Click "Create Course" to add one!'}
            </Alert>
          </Col>
        ) : (
          courses.map((course) => {
            const enrolled = isEnrolled(course._id);
            
            // ✅ FIXED: Get teacher ID properly
            let teacherId = null;
            if (course.teacherId) {
              if (typeof course.teacherId === 'object' && course.teacherId._id) {
                teacherId = course.teacherId._id;
              } else if (typeof course.teacherId === 'string') {
                teacherId = course.teacherId;
              }
            }
            
            // Check if current user is the teacher of this course
            const isTeacherOfCourse = user?.role === 'teacher' && user?._id === teacherId;
            
            // Debug each course
            console.log(`Course "${course.title}":`, {
              teacherId: teacherId,
              userId: user?._id,
              isTeacher: isTeacherOfCourse
            });
            
            return (
              <Col md={4} key={course._id} className="mb-4">
                <Card className="h-100 shadow-sm">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start">
                      <Card.Title>{course.title}</Card.Title>
                      {enrolled && (
                        <Badge bg="success" className="ms-2">
                          ✅ Enrolled
                        </Badge>
                      )}
                      {isTeacherOfCourse && (
                        <Badge bg="primary" className="ms-2">
                          👨‍🏫 Your Course
                        </Badge>
                      )}
                    </div>
                    <Card.Text className="text-muted" style={{ fontSize: '0.9rem' }}>
                      {course.description}
                    </Card.Text>
                    <div className="mb-2">
                      <Badge bg={getLevelColor(course.level)}>{course.level}</Badge>
                      <Badge bg="info" className="ms-2">{course.category}</Badge>
                    </div>
                    <div className="mt-2">
                      <small className="text-muted">
                        <i className="bi bi-person me-1"></i>
                        Teacher: {course.teacherId?.name || 'Unknown'}
                      </small>
                    </div>
                    <div className="mt-2">
                      <small className="text-muted">
                        <i className="bi bi-people me-1"></i>
                        {course.enrolledStudents?.length || 0} students enrolled
                      </small>
                    </div>
                    
                    {/* Enroll / View Course Button */}
                    <Button 
                      variant={enrolled ? 'success' : 'primary'} 
                      className="mt-3 w-100"
                      onClick={() => {
                        if (enrolled) {
                          navigate(`/course/${course._id}`);
                        } else {
                          handleEnroll(course._id);
                        }
                      }}
                      disabled={enrolling === course._id}
                    >
                      {enrolling === course._id ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" className="me-2" />
                          Enrolling...
                        </>
                      ) : enrolled ? (
                        '📖 View Course'
                      ) : (
                        '📖 Enroll Now'
                      )}
                    </Button>

                    {/* ✅ FIXED: Manage Content button - now always shows for teachers who own the course */}
                    {isTeacherOfCourse && (
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="mt-2 w-100"
                        onClick={() => navigate(`/teacher/content/${course._id}`)}
                      >
                        📝 Manage Content
                      </Button>
                    )}

                    {/* Show a hint for debugging */}
                    {user?.role === 'teacher' && !isTeacherOfCourse && course.teacherId && (
                      <div className="mt-1">
                        <small className="text-muted">
                          (Not your course - Teacher ID: {teacherId?.substring(0, 10)}...)
                        </small>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            );
          })
        )}
      </Row>

      {myCourses.length > 0 && (
        <div className="mt-5">
          <h4>📖 Your Enrolled Courses</h4>
          <Row>
            {myCourses.map((course) => (
              <Col md={4} key={course._id} className="mb-3">
                <Card className="border-success">
                  <Card.Body>
                    <Card.Title style={{ fontSize: '1rem' }}>{course.title}</Card.Title>
                    <Badge bg="success">In Progress</Badge>
                    <div className="mt-2">
                      <small className="text-muted">
                        <i className="bi bi-person me-1"></i>
                        {course.teacherId?.name || 'Unknown'}
                      </small>
                    </div>
                    <Button 
                      variant="outline-success" 
                      size="sm" 
                      className="mt-2 w-100"
                      onClick={() => navigate(`/course/${course._id}`)}
                    >
                      Continue Learning →
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* Create Course Modal */}
      <Modal show={showCreateModal} onHide={() => {
        setShowCreateModal(false);
        setNewCourse({
          title: '',
          description: '',
          category: '',
          level: 'beginner'
        });
        setMessage({ text: '', type: '' });
      }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>📝 Create New Course</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateCourse}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Course Title *</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={newCourse.title}
                onChange={handleInputChange}
                placeholder="e.g., Advanced Machine Learning"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Course Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={newCourse.description}
                onChange={handleInputChange}
                placeholder="Describe what students will learn"
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category *</Form.Label>
                  <Form.Control
                    type="text"
                    name="category"
                    value={newCourse.category}
                    onChange={handleInputChange}
                    placeholder="e.g., AI, Programming, Web Development"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Level *</Form.Label>
                  <Form.Select
                    name="level"
                    value={newCourse.level}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => {
                setShowCreateModal(false);
                setNewCourse({
                  title: '',
                  description: '',
                  category: '',
                  level: 'beginner'
                });
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={creating}
            >
              {creating ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Creating...
                </>
              ) : (
                'Create Course'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default Courses;