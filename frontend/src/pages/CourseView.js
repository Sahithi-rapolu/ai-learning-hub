import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, Row, Col, Button, Badge, 
  Alert, Spinner, Container, ListGroup, 
  Tab, Nav, Form, Modal
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import QuizComponent from '../components/QuizComponent';
import FileViewer from '../components/FileViewer';

function CourseView() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [content, setContent] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [canGenerateCertificate, setCanGenerateCertificate] = useState(false);
  
  // File Viewer State
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Discussion States
  const [discussions, setDiscussions] = useState([]);
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({ title: '', content: '' });
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [loadingDiscussions, setLoadingDiscussions] = useState(false);

  // Review States
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState('content');

  // ✅ Fetch Discussions - wrapped in useCallback
  const fetchDiscussions = useCallback(async () => {
    try {
      setLoadingDiscussions(true);
      const response = await API.get(`/discussions/${courseId}`);
      setDiscussions(response.data);
    } catch (err) {
      console.error('Error fetching discussions:', err);
    } finally {
      setLoadingDiscussions(false);
    }
  }, [courseId]);

  // ✅ Fetch Reviews - wrapped in useCallback
  const fetchReviews = useCallback(async () => {
    try {
      const response = await API.get(`/reviews/${courseId}`);
      setReviews(response.data.reviews || []);
      setAvgRating(response.data.avgRating || 0);
      setTotalReviews(response.data.totalReviews || 0);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  }, [courseId]);

  // ✅ Main fetchData with all dependencies
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const userRes = await API.get('/users/profile');
      setUser(userRes.data);
      
      const coursesRes = await API.get('/courses');
      const currentCourse = coursesRes.data.find(c => c._id === courseId);
      setCourse(currentCourse);

      const timestamp = new Date().getTime();
      const response = await API.get(`/courses/${courseId}/content?t=${timestamp}`);
      
      console.log('📖 Content response:', response.data);
      
      if (response.data.content) {
        setContent(response.data.content);
        setProgress(response.data.progress);
        
        // Check if course is completed (100% progress)
        if (response.data.progress?.overallProgress === 100) {
          setCanGenerateCertificate(true);
        }
        
        if (response.data.content.modules && response.data.content.modules.length > 0) {
          setSelectedModule(response.data.content.modules[0]);
          setMessage({ text: `✅ ${response.data.content.modules.length} module(s) loaded`, type: 'success' });
          setTimeout(() => {
            setMessage(prev => prev.type === 'success' ? { text: '', type: '' } : prev);
          }, 3000);
        } else {
          setMessage({ text: '📚 No content available yet for this course.', type: 'info' });
        }
      } else {
        setContent(null);
        setMessage({ text: '📚 No content available yet. Check back later!', type: 'info' });
      }
      
      // Fetch Discussions and Reviews
      await fetchDiscussions();
      await fetchReviews();
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching course:', err);
      if (err.response?.status === 403) {
        setMessage({ text: '⚠️ You need to enroll in this course first!', type: 'warning' });
      } else {
        setMessage({ text: 'Error loading content', type: 'danger' });
      }
      setLoading(false);
    }
  }, [courseId, fetchDiscussions, fetchReviews]); // ✅ Added all dependencies

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setMessage({ text: '🔄 Refreshing content...', type: 'info' });
    await fetchData();
    setRefreshing(false);
  };

  const handleModuleComplete = async (moduleId) => {
    try {
      await API.post(`/courses/${courseId}/modules/${moduleId}/complete`);
      await fetchData();
      setMessage({ text: '✅ Module completed!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setMessage({ text: 'Failed to mark module as complete', type: 'danger' });
    }
  };

  const isModuleCompleted = (moduleId) => {
    if (!progress) return false;
    const moduleProgress = progress.moduleProgress.find(mp => mp.moduleId === moduleId);
    return moduleProgress?.completed || false;
  };

  const getModuleIcon = (type) => {
    const icons = {
      video: '🎬',
      notes: '📝',
      quiz: '📝',
      assignment: '📋',
      resource: '📚'
    };
    return icons[type] || '📄';
  };

  const getModuleTypeColor = (type) => {
    const colors = {
      video: 'danger',
      notes: 'primary',
      quiz: 'warning',
      assignment: 'info',
      resource: 'success'
    };
    return colors[type] || 'secondary';
  };

  const isTeacher = user?.role === 'teacher' && course?.teacherId?._id === user?.id;

  // Helper functions for file handling
  const getFileName = (url) => {
    if (!url) return 'No file';
    if (url.includes('cloudinary')) {
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      return filename.split('?')[0] || 'file';
    }
    const parts = url.split('/');
    return parts[parts.length - 1] || 'file';
  };

  const getFileExtension = (url) => {
    if (!url) return '';
    const filename = getFileName(url);
    const ext = filename.split('.').pop().toLowerCase();
    return ext;
  };

  // Handle View File - opens in FileViewer modal
  const handleViewFile = (fileUrl, fileName) => {
    setSelectedFile({ url: fileUrl, name: fileName || getFileName(fileUrl) });
    setShowFileViewer(true);
  };

  // Handle Generate Certificate
  const handleGenerateCertificate = async () => {
    try {
      const response = await API.post('/certificates/generate', { 
        courseId: course._id 
      });
      alert(response.data.message);
      navigate('/certificates');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate certificate');
    }
  };

  // Handle Discussion Submit
  const handleDiscussionSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/discussions', {
        courseId: course._id,
        title: newDiscussion.title,
        content: newDiscussion.content
      });
      setNewDiscussion({ title: '', content: '' });
      setShowDiscussionModal(false);
      await fetchDiscussions();
      setMessage({ text: '✅ Discussion posted successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      console.error('Error posting discussion:', err);
      setMessage({ text: 'Failed to post discussion', type: 'danger' });
    }
  };

  // Handle Reply Submit
  const handleReplySubmit = async (discussionId) => {
    try {
      await API.post(`/discussions/${discussionId}/answers`, {
        content: replyContent
      });
      setReplyContent('');
      setReplyingTo(null);
      await fetchDiscussions();
      setMessage({ text: '✅ Reply posted successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      console.error('Error posting reply:', err);
      setMessage({ text: 'Failed to post reply', type: 'danger' });
    }
  };

  // Handle Review Submit
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingReview(true);
      await API.post('/reviews', {
        courseId: course._id,
        rating: newReview.rating,
        comment: newReview.comment
      });
      setNewReview({ rating: 5, comment: '' });
      setShowReviewModal(false);
      await fetchReviews();
      setMessage({ text: '✅ Review submitted successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      console.error('Error submitting review:', err);
      setMessage({ text: err.response?.data?.error || 'Failed to submit review', type: 'danger' });
    } finally {
      setSubmittingReview(false);
    }
  };

  // RENDER NOTES WITH FILE HANDLING
  const renderNotesContent = (module) => {
    return (
      <div>
        {/* Display text notes */}
        {module.notesText ? (
          <div className="p-3 bg-light rounded mb-3" style={{ whiteSpace: 'pre-wrap' }}>
            {module.notesText}
          </div>
        ) : (
          <Alert variant="info">No text content available</Alert>
        )}
        
        {/* Display uploaded file */}
        {module.notesFile && (
          <div className="mt-3">
            <Card className="border">
              <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                <div>
                  <i className="bi bi-file-earmark me-2"></i>
                  <strong>📎 Attached File</strong>
                </div>
                <Badge bg="secondary">
                  {getFileExtension(module.notesFile).toUpperCase() || 'FILE'}
                </Badge>
              </Card.Header>
              <Card.Body>
                <div className="text-center p-3">
                  <div style={{ fontSize: '3rem' }}>
                    {getFileExtension(module.notesFile) === 'pdf' ? (
                      <i className="bi bi-file-earmark-pdf" style={{ color: '#dc3545' }}></i>
                    ) : ['doc', 'docx'].includes(getFileExtension(module.notesFile)) ? (
                      <i className="bi bi-file-earmark-word" style={{ color: '#2b579a' }}></i>
                    ) : ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(getFileExtension(module.notesFile)) ? (
                      <i className="bi bi-file-earmark-image" style={{ color: '#28a745' }}></i>
                    ) : ['mp4', 'avi', 'mov', 'wmv'].includes(getFileExtension(module.notesFile)) ? (
                      <i className="bi bi-file-earmark-play" style={{ color: '#dc3545' }}></i>
                    ) : (
                      <i className="bi bi-file-earmark-text" style={{ color: '#6c757d' }}></i>
                    )}
                  </div>
                  
                  <h6 className="mt-2">{getFileName(module.notesFile)}</h6>
                  <p className="text-muted small">
                    {module.notesFile.includes('cloudinary') ? '📤 Hosted on Cloudinary' : '📁 Uploaded file'}
                  </p>
                  
                  <div className="d-flex flex-wrap gap-2 justify-content-center mt-3">
                    <Button 
                      variant="primary"
                      onClick={() => handleViewFile(module.notesFile, getFileName(module.notesFile))}
                    >
                      <i className="bi bi-eye me-2"></i>
                      View File
                    </Button>
                    
                    <a 
                      href={module.notesFile} 
                      download
                      className="btn btn-outline-secondary"
                    >
                      <i className="bi bi-download me-2"></i>
                      Download
                    </a>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        )}
      </div>
    );
  };

  // Render Discussions
  const renderDiscussions = () => {
    if (loadingDiscussions) {
      return <div className="text-center"><Spinner animation="border" size="sm" /></div>;
    }

    if (discussions.length === 0) {
      return (
        <Alert variant="info">
          No discussions yet. Be the first to start a discussion!
        </Alert>
      );
    }

    return (
      <div>
        {discussions.map((discussion) => (
          <Card key={discussion._id} className="mb-3">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <h5>{discussion.title}</h5>
                <div>
                  <Badge bg="secondary" className="me-1">
                    {discussion.userRole}
                  </Badge>
                  <small className="text-muted">
                    by {discussion.userName}
                  </small>
                </div>
              </div>
              <p className="mt-2">{discussion.content}</p>
              
              {/* Answers */}
              {discussion.answers && discussion.answers.length > 0 && (
                <div className="mt-3 ms-4">
                  {discussion.answers.map((answer, idx) => (
                    <div key={idx} className="border-start border-3 border-primary ps-3 mb-2">
                      <div className="d-flex justify-content-between">
                        <strong>
                          {answer.userName}
                          {answer.isTeacher && (
                            <Badge bg="success" className="ms-2">Teacher</Badge>
                          )}
                        </strong>
                        <small className="text-muted">
                          {new Date(answer.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                      <p className="mb-0">{answer.content}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Reply Section */}
              {replyingTo === discussion._id ? (
                <div className="mt-3">
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write your reply..."
                  />
                  <div className="mt-2">
                    <Button 
                      size="sm" 
                      variant="primary"
                      onClick={() => handleReplySubmit(discussion._id)}
                    >
                      Submit Reply
                    </Button>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      className="ms-2"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyContent('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button 
                  size="sm" 
                  variant="outline-primary"
                  className="mt-2"
                  onClick={() => setReplyingTo(discussion._id)}
                >
                  <i className="bi bi-reply me-1"></i>
                  Reply
                </Button>
              )}
            </Card.Body>
          </Card>
        ))}
      </div>
    );
  };

  // Render Reviews
  const renderReviews = () => {
    const renderStars = (rating) => {
      return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
    };

    if (reviews.length === 0) {
      return (
        <Alert variant="info">
          No reviews yet. Be the first to review this course!
        </Alert>
      );
    }

    return (
      <div>
        <div className="text-center mb-4">
          <h3>{avgRating} / 5</h3>
          <p>{renderStars(Math.round(avgRating))}</p>
          <p className="text-muted">{totalReviews} reviews</p>
        </div>
        {reviews.map((review) => (
          <Card key={review._id} className="mb-2">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <strong>{review.userName}</strong>
                  <span className="ms-2">{renderStars(review.rating)}</span>
                </div>
                <small className="text-muted">
                  {new Date(review.createdAt).toLocaleDateString()}
                </small>
              </div>
              <p className="mt-1">{review.comment}</p>
            </Card.Body>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading course content...</p>
      </div>
    );
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>{course?.title || 'Course'}</h2>
          <p className="text-muted">{course?.description}</p>
          {progress && (
            <Badge bg="success" className="me-2">
              Progress: {progress.overallProgress}%
            </Badge>
          )}
          {content && (
            <Badge bg="secondary">
              {content.modules?.length || 0} Modules
            </Badge>
          )}
          {/* Course Rating */}
          {avgRating > 0 && (
            <Badge bg="warning" className="ms-2">
              ⭐ {avgRating} ({totalReviews} reviews)
            </Badge>
          )}
        </div>
        <div>
          <Button 
            variant="outline-primary" 
            className="me-2"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
          </Button>
          {isTeacher && (
            <Button 
              variant="outline-primary" 
              className="me-2"
              onClick={() => navigate(`/teacher/content/${courseId}`)}
            >
              📝 Manage Content
            </Button>
          )}
          <Button variant="outline-secondary" onClick={() => navigate('/courses')}>
            ← Back to Courses
          </Button>
        </div>
      </div>

      {/* Certificate Section */}
      {canGenerateCertificate && (
        <Alert variant="success" className="d-flex justify-content-between align-items-center">
          <div>
            <i className="bi bi-award me-2"></i>
            <strong>Congratulations! You've completed this course!</strong>
          </div>
          <Button variant="success" onClick={handleGenerateCertificate}>
            🏆 Get Certificate
          </Button>
        </Alert>
      )}

      {message.text && (
        <Alert variant={message.type} onClose={() => setMessage({ text: '', type: '' })} dismissible>
          {message.text}
        </Alert>
      )}

      {/* Tabs for Content, Discussions, Reviews */}
      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
        <Nav variant="tabs" className="mb-3">
          <Nav.Item>
            <Nav.Link eventKey="content">📚 Content</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="discussions">
              💬 Discussions ({discussions.length})
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="reviews">
              ⭐ Reviews ({totalReviews})
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          {/* Content Tab */}
          <Tab.Pane eventKey="content">
            {!content || !content.modules || content.modules.length === 0 ? (
              <Alert variant="info" className="text-center">
                <h5>📚 No Content Available</h5>
                <p>This course doesn't have any content yet.</p>
                {isTeacher && (
                  <Button 
                    variant="primary" 
                    onClick={() => navigate(`/teacher/content/${courseId}`)}
                  >
                    📝 Add Content Now
                  </Button>
                )}
                {!isTeacher && (
                  <div>
                    <p className="mt-2">
                      <small className="text-muted">Check back later when the teacher adds content.</small>
                    </p>
                    <Button variant="outline-primary" size="sm" onClick={handleRefresh}>
                      🔄 Refresh
                    </Button>
                  </div>
                )}
              </Alert>
            ) : (
              <Row>
                <Col md={4}>
                  <Card className="shadow-sm">
                    <Card.Header>
                      <h5 className="mb-0">📚 Modules ({content.modules.length})</h5>
                    </Card.Header>
                    <ListGroup variant="flush">
                      {content.modules.map((module, index) => (
                        <ListGroup.Item 
                          key={module._id || index}
                          action
                          active={selectedModule?._id === module._id}
                          onClick={() => setSelectedModule(module)}
                          className="d-flex justify-content-between align-items-center"
                        >
                          <div>
                            <span className="me-2">{getModuleIcon(module.type)}</span>
                            {module.title}
                            <small className="text-muted d-block">
                              {module.duration > 0 && `⏱️ ${module.duration} min`}
                              {module.type === 'quiz' && module.quizQuestions?.length > 0 && 
                                ` • ${module.quizQuestions.length} questions`
                              }
                            </small>
                          </div>
                          {isModuleCompleted(module._id) && (
                            <Badge bg="success">✅</Badge>
                          )}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </Card>
                </Col>

                <Col md={8}>
                  {selectedModule ? (
                    <Card className="shadow-sm">
                      <Card.Header>
                        <div className="d-flex justify-content-between align-items-center">
                          <h5 className="mb-0">
                            {getModuleIcon(selectedModule.type)} {selectedModule.title}
                          </h5>
                          <Badge bg={getModuleTypeColor(selectedModule.type)}>
                            {selectedModule.type}
                          </Badge>
                        </div>
                      </Card.Header>
                      <Card.Body>
                        {selectedModule.description && (
                          <p className="text-muted">{selectedModule.description}</p>
                        )}

                        {/* Video Content */}
                        {selectedModule.type === 'video' && (
                          <div>
                            {selectedModule.videoType === 'link' && selectedModule.videoLink ? (
                              <div className="ratio ratio-16x9 mb-3">
                                <iframe 
                                  src={selectedModule.videoLink}
                                  title={selectedModule.title}
                                  allowFullScreen
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                />
                              </div>
                            ) : selectedModule.videoUrl ? (
                              <div>
                                <video 
                                  src={selectedModule.videoUrl} 
                                  controls 
                                  style={{ width: '100%', maxHeight: '400px' }}
                                  className="rounded"
                                />
                                <div className="mt-2">
                                  <Button 
                                    variant="outline-primary" 
                                    size="sm"
                                    onClick={() => handleViewFile(selectedModule.videoUrl, selectedModule.title)}
                                  >
                                    <i className="bi bi-eye me-2"></i>
                                    View in Full Screen
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Alert variant="warning">No video content available</Alert>
                            )}
                          </div>
                        )}

                        {/* Notes Content */}
                        {selectedModule.type === 'notes' && renderNotesContent(selectedModule)}

                        {/* Quiz Content */}
                        {selectedModule.type === 'quiz' && (
                          <QuizComponent 
                            courseId={courseId}
                            module={selectedModule}
                            onComplete={() => {
                              fetchData();
                              setMessage({ text: '✅ Quiz completed! Great job!', type: 'success' });
                              setTimeout(() => setMessage({ text: '', type: '' }), 3000);
                            }}
                          />
                        )}

                        {/* Assignment Content */}
                        {selectedModule.type === 'assignment' && (
                          <div>
                            <div className="p-3 bg-light rounded">
                              <p>{selectedModule.content || 'No assignment details provided'}</p>
                            </div>
                            <Alert variant="info" className="mt-3">
                              <i className="bi bi-info-circle me-2"></i>
                              Complete this assignment and submit it to your teacher.
                            </Alert>
                          </div>
                        )}

                        {/* Resource Content */}
                        {selectedModule.type === 'resource' && (
                          <div>
                            {selectedModule.content && <p>{selectedModule.content}</p>}
                            {selectedModule.resources?.length > 0 && (
                              <div className="mt-3">
                                <h6>📎 Resources</h6>
                                <ListGroup>
                                  {selectedModule.resources.map((resource, idx) => (
                                    <ListGroup.Item key={idx}>
                                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                        {resource.title || resource.url}
                                      </a>
                                      <Badge bg="info" className="ms-2">{resource.type}</Badge>
                                    </ListGroup.Item>
                                  ))}
                                </ListGroup>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Module Complete Button */}
                        {selectedModule.type !== 'quiz' && (
                          <div className="mt-4">
                            {!isModuleCompleted(selectedModule._id) ? (
                              <Button 
                                variant="success" 
                                className="w-100"
                                onClick={() => handleModuleComplete(selectedModule._id)}
                              >
                                ✅ Mark as Complete
                              </Button>
                            ) : (
                              <Alert variant="success" className="mb-0">
                                <i className="bi bi-check-circle-fill me-2"></i>
                                ✅ You've completed this module!
                              </Alert>
                            )}
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  ) : (
                    <Alert variant="info">
                      <h5>📖 Select a module to start learning</h5>
                      <p>Choose a module from the left sidebar to begin.</p>
                    </Alert>
                  )}
                </Col>
              </Row>
            )}
          </Tab.Pane>

          {/* Discussions Tab */}
          <Tab.Pane eventKey="discussions">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5>💬 Course Discussions</h5>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => setShowDiscussionModal(true)}
              >
                <i className="bi bi-plus-circle me-1"></i>
                Start Discussion
              </Button>
            </div>
            {renderDiscussions()}
          </Tab.Pane>

          {/* Reviews Tab */}
          <Tab.Pane eventKey="reviews">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5>⭐ Course Reviews</h5>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => setShowReviewModal(true)}
              >
                <i className="bi bi-plus-circle me-1"></i>
                Write Review
              </Button>
            </div>
            {renderReviews()}
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      {/* File Viewer Modal */}
      {selectedFile && (
        <FileViewer
          show={showFileViewer}
          onHide={() => {
            setShowFileViewer(false);
            setSelectedFile(null);
          }}
          fileUrl={selectedFile.url}
          fileName={selectedFile.name}
        />
      )}

      {/* Discussion Modal */}
      <Modal show={showDiscussionModal} onHide={() => setShowDiscussionModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>💬 Start a Discussion</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleDiscussionSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                value={newDiscussion.title}
                onChange={(e) => setNewDiscussion({ ...newDiscussion, title: e.target.value })}
                placeholder="Enter discussion title"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Content *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={newDiscussion.content}
                onChange={(e) => setNewDiscussion({ ...newDiscussion, content: e.target.value })}
                placeholder="Describe your question or topic"
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDiscussionModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Post Discussion
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Review Modal */}
      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>⭐ Write a Review</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleReviewSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Rating *</Form.Label>
              <Form.Select
                value={newReview.rating}
                onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
              >
                <option value={5}>⭐⭐⭐⭐⭐ - Excellent</option>
                <option value={4}>⭐⭐⭐⭐ - Good</option>
                <option value={3}>⭐⭐⭐ - Average</option>
                <option value={2}>⭐⭐ - Poor</option>
                <option value={1}>⭐ - Very Poor</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Comment *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                placeholder="Share your experience with this course..."
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowReviewModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submittingReview}>
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default CourseView;