import React, { useState, useEffect } from 'react';
import { 
  Card, Form, Button, Row, Col, Badge, 
  Modal, Alert, Spinner, ListGroup, Container 
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';

function TeacherContent() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    type: 'notes',
    duration: 0,
    notesText: '',
    notesFile: '',
    videoType: 'link',
    videoLink: '',
    videoUrl: '',
    quizQuestions: [],
    quizTimeLimit: 0
  });

  const [quizQuestionForm, setQuizQuestionForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: ''
  });

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const coursesRes = await API.get('/courses');
      const currentCourse = coursesRes.data.find(c => c._id === courseId);
      setCourse(currentCourse);

      try {
        const contentRes = await API.get(`/courses/${courseId}/content`);
        console.log('📖 Content response:', contentRes.data);
        
        if (contentRes.data.content) {
          setContent(contentRes.data.content);
        } else {
          setContent({
            courseId: courseId,
            teacherId: '',
            modules: [],
            totalDuration: 0
          });
        }
      } catch (err) {
        console.error('Error fetching content:', err);
        setContent({
          courseId: courseId,
          teacherId: '',
          modules: [],
          totalDuration: 0
        });
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setMessage({ text: 'Error loading content', type: 'danger' });
      setLoading(false);
    }
  };

  // ✅ FIXED: File upload handler
  const handleFileUpload = async (file, type) => {
    try {
      setUploading(true);
      setMessage({ text: '📤 Uploading file...', type: 'info' });
      
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('📤 Uploading file:', file.name, 'Type:', file.type, 'Size:', file.size);
      
      const response = await API.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('✅ Upload response:', response.data);
      
      if (response.data.url) {
        if (type === 'notes') {
          setModuleForm({ ...moduleForm, notesFile: response.data.url });
          setMessage({ text: `✅ Notes file uploaded: ${file.name}`, type: 'success' });
        } else if (type === 'video') {
          setModuleForm({ ...moduleForm, videoUrl: response.data.url });
          setMessage({ text: `✅ Video uploaded: ${file.name}`, type: 'success' });
        }
      } else {
        setMessage({ text: '❌ Upload failed - no URL returned', type: 'danger' });
      }
    } catch (err) {
      console.error('❌ Upload error:', err);
      setMessage({ 
        text: '❌ File upload failed: ' + (err.response?.data?.error || err.message), 
        type: 'danger' 
      });
    } finally {
      setUploading(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  const handleAddQuizQuestion = () => {
    if (!quizQuestionForm.question || quizQuestionForm.options.some(opt => !opt)) {
      setMessage({ text: 'Please fill in the question and all options', type: 'warning' });
      return;
    }
    
    setModuleForm({
      ...moduleForm,
      quizQuestions: [...moduleForm.quizQuestions, { ...quizQuestionForm }]
    });
    
    setQuizQuestionForm({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: ''
    });
    
    setMessage({ text: '✅ Question added!', type: 'success' });
    setTimeout(() => setMessage({ text: '', type: '' }), 2000);
  };

  const handleRemoveQuizQuestion = (index) => {
    const updatedQuestions = moduleForm.quizQuestions.filter((_, i) => i !== index);
    setModuleForm({ ...moduleForm, quizQuestions: updatedQuestions });
  };

  const handleSaveContent = async () => {
    try {
      setSaving(true);
      setMessage({ text: 'Saving content...', type: 'info' });
      
      if (!content) {
        setContent({
          courseId: courseId,
          teacherId: '',
          modules: [],
          totalDuration: 0
        });
      }
      
      const modules = content?.modules || [];
      
      const cleanModules = modules.map(module => {
        const { _id, ...moduleWithoutId } = module;
        return moduleWithoutId;
      });
      
      const response = await API.post(`/courses/${courseId}/content`, {
        modules: cleanModules
      });
      
      console.log('✅ Save response:', response.data);
      
      setMessage({ 
        text: `✅ Course content saved! ${response.data.moduleCount || 0} modules saved.`, 
        type: 'success' 
      });
      
      if (response.data.content) {
        setContent(response.data.content);
      }
      
      await fetchData();
      
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      console.error('❌ Save error:', err);
      setMessage({ 
        text: err.response?.data?.error || 'Error saving content', 
        type: 'danger' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddModule = () => {
    if (!content) {
      setContent({
        courseId: courseId,
        teacherId: '',
        modules: [],
        totalDuration: 0
      });
      setTimeout(() => {
        setMessage({ text: 'Content initialized. Please try adding the module again.', type: 'info' });
      }, 100);
      return;
    }
    
    if (!moduleForm.title.trim()) {
      setMessage({ text: 'Please enter a module title', type: 'warning' });
      return;
    }
    
    let newModule = {
      title: moduleForm.title.trim(),
      description: moduleForm.description || '',
      type: moduleForm.type || 'notes',
      duration: parseInt(moduleForm.duration) || 0,
      resources: []
    };

    if (moduleForm.type === 'notes') {
      newModule.notesText = moduleForm.notesText || '';
      newModule.notesFile = moduleForm.notesFile || '';
    } else if (moduleForm.type === 'video') {
      newModule.videoType = moduleForm.videoType || 'link';
      newModule.videoLink = moduleForm.videoLink || '';
      newModule.videoUrl = moduleForm.videoUrl || '';
    } else if (moduleForm.type === 'quiz') {
      if (moduleForm.quizQuestions.length === 0) {
        setMessage({ text: 'Please add at least one question to the quiz', type: 'warning' });
        return;
      }
      newModule.quizQuestions = moduleForm.quizQuestions;
      newModule.quizTimeLimit = parseInt(moduleForm.quizTimeLimit) || 0;
    }

    const currentModules = content.modules || [];
    let updatedModules;
    
    if (editingModule) {
      const moduleToUpdate = { ...newModule };
      if (editingModule._id) {
        moduleToUpdate._id = editingModule._id;
      }
      updatedModules = currentModules.map(m => 
        m._id === editingModule._id ? moduleToUpdate : m
      );
      setMessage({ text: `✅ Module "${moduleForm.title}" updated!`, type: 'success' });
    } else {
      updatedModules = [...currentModules, newModule];
      setMessage({ text: `✅ Module "${moduleForm.title}" added!`, type: 'success' });
    }
    
    setContent({ 
      ...content, 
      modules: updatedModules,
      totalDuration: updatedModules.reduce((sum, m) => sum + (m.duration || 0), 0)
    });

    setShowModuleModal(false);
    resetForm();
    
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleDeleteModule = (moduleId) => {
    if (window.confirm('Are you sure you want to delete this module?')) {
      const updatedModules = (content?.modules || []).filter(m => m._id !== moduleId);
      setContent({ 
        ...content, 
        modules: updatedModules,
        totalDuration: updatedModules.reduce((sum, m) => sum + (m.duration || 0), 0)
      });
      setMessage({ text: '✅ Module deleted. Click "Save All Content" to save changes.', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  const handleEditModule = (module) => {
    setEditingModule(module);
    setModuleForm({
      title: module.title || '',
      description: module.description || '',
      type: module.type || 'notes',
      duration: module.duration || 0,
      notesText: module.notesText || '',
      notesFile: module.notesFile || '',
      videoType: module.videoType || 'link',
      videoLink: module.videoLink || '',
      videoUrl: module.videoUrl || '',
      quizQuestions: module.quizQuestions || [],
      quizTimeLimit: module.quizTimeLimit || 0
    });
    setShowModuleModal(true);
  };

  const resetForm = () => {
    setModuleForm({
      title: '',
      description: '',
      type: 'notes',
      duration: 0,
      notesText: '',
      notesFile: '',
      videoType: 'link',
      videoLink: '',
      videoUrl: '',
      quizQuestions: [],
      quizTimeLimit: 0
    });
    setEditingModule(null);
    setQuizQuestionForm({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: ''
    });
  };

  const getModuleTypeIcon = (type) => {
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

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading content...</p>
      </div>
    );
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>📝 Course Content</h2>
          <p className="text-muted">Manage modules for: <strong>{course?.title || 'Loading...'}</strong></p>
          <small className="text-muted">
            {content?.modules?.length || 0} modules • {content?.totalDuration || 0} min total
          </small>
        </div>
        <div>
          <Button 
            variant="success" 
            onClick={handleSaveContent}
            className="me-2"
            disabled={saving}
          >
            {saving ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              '💾 Save All Content'
            )}
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              resetForm();
              setShowModuleModal(true);
            }}
          >
            <i className="bi bi-plus-circle me-2"></i>Add Module
          </Button>
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

      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h5>📚 Total Modules</h5>
              <h2>{content?.modules?.length || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h5>⏱️ Total Duration</h5>
              <h2>{content?.totalDuration || 0} min</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h5>🎬 Videos</h5>
              <h2>{content?.modules?.filter(m => m.type === 'video').length || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h5>📝 Quizzes</h5>
              <h2>{content?.modules?.filter(m => m.type === 'quiz').length || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {!content || content?.modules?.length === 0 ? (
        <Alert variant="info">
          <h5>📚 No modules yet</h5>
          <p>Click "Add Module" to start creating content for this course!</p>
          <Button 
            variant="primary" 
            onClick={() => {
              resetForm();
              setShowModuleModal(true);
            }}
          >
            <i className="bi bi-plus-circle me-2"></i>Add Your First Module
          </Button>
        </Alert>
      ) : (
        <ListGroup>
          {content?.modules?.map((module, index) => (
            <ListGroup.Item key={module._id || index} className="mb-2">
              <div className="d-flex justify-content-between align-items-center">
                <div className="flex-grow-1">
                  <div>
                    <Badge bg={getModuleTypeColor(module.type)} className="me-2">
                      {getModuleTypeIcon(module.type)} {module.type}
                    </Badge>
                    <strong>{module.title}</strong>
                    {module.duration > 0 && (
                      <Badge bg="secondary" className="ms-2">
                        ⏱️ {module.duration} min
                      </Badge>
                    )}
                    {module.type === 'quiz' && (
                      <Badge bg="warning" className="ms-2">
                        {module.quizQuestions?.length || 0} questions
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1">
                    <small className="text-muted">{module.description}</small>
                  </div>
                  {module.type === 'video' && (
                    <div className="mt-1">
                      <small className="text-muted">
                        {module.videoType === 'link' ? '🔗 Link' : '📤 Uploaded'} 
                        {module.videoLink && `: ${module.videoLink.substring(0, 30)}...`}
                        {module.videoUrl && `: Video uploaded`}
                      </small>
                    </div>
                  )}
                  {module.type === 'notes' && module.notesFile && (
                    <div className="mt-1">
                      <small className="text-muted">
                        📎 File attached: {module.notesFile.split('/').pop()}
                      </small>
                    </div>
                  )}
                  {module.type === 'notes' && module.notesText && (
                    <div className="mt-1">
                      <small className="text-muted">
                        📝 Text content: {module.notesText.substring(0, 50)}...
                      </small>
                    </div>
                  )}
                </div>
                <div>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="me-2"
                    onClick={() => handleEditModule(module)}
                  >
                    ✏️ Edit
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={() => handleDeleteModule(module._id)}
                  >
                    🗑️ Delete
                  </Button>
                </div>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}

      {content?.modules?.length > 0 && (
        <div className="mt-3">
          <Alert variant="info" className="d-flex justify-content-between align-items-center">
            <span>
              <i className="bi bi-info-circle me-2"></i>
              {content.modules.length} module(s) ready. Click "Save All Content" to save changes to the database.
            </span>
            <Button 
              variant="success" 
              size="sm" 
              onClick={handleSaveContent}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Now'}
            </Button>
          </Alert>
        </div>
      )}

      {/* Add/Edit Module Modal */}
      <Modal show={showModuleModal} onHide={() => {
        setShowModuleModal(false);
        resetForm();
      }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingModule ? '✏️ Edit Module' : '📝 Add New Module'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Module Title *</Form.Label>
                  <Form.Control
                    value={moduleForm.title}
                    onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                    placeholder="e.g., Introduction to Python"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Module Type *</Form.Label>
                  <Form.Select
                    value={moduleForm.type}
                    onChange={(e) => setModuleForm({ ...moduleForm, type: e.target.value })}
                  >
                    <option value="notes">📝 Notes</option>
                    <option value="video">🎬 Video</option>
                    <option value="quiz">📝 Quiz</option>
                    <option value="assignment">📋 Assignment</option>
                    <option value="resource">📚 Resource</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={moduleForm.description}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                placeholder="Brief description of this module"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Duration (minutes)</Form.Label>
              <Form.Control
                type="number"
                value={moduleForm.duration}
                onChange={(e) => setModuleForm({ ...moduleForm, duration: e.target.value })}
                placeholder="e.g., 30"
              />
            </Form.Group>

            {/* Notes Content */}
            {moduleForm.type === 'notes' && (
              <div className="border p-3 rounded mb-3">
                <h6>📝 Notes Content</h6>
                <Form.Group className="mb-3">
                  <Form.Label>Text Content</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    value={moduleForm.notesText}
                    onChange={(e) => setModuleForm({ ...moduleForm, notesText: e.target.value })}
                    placeholder="Write your notes here..."
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Upload Notes File</Form.Label>
                  <Form.Control
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        handleFileUpload(e.target.files[0], 'notes');
                      }
                    }}
                    disabled={uploading}
                  />
                  {uploading && <Spinner animation="border" size="sm" className="ms-2" />}
                  {moduleForm.notesFile && (
                    <div className="mt-2">
                      <Badge bg="success">✅ File uploaded</Badge>
                      <small className="ms-2 text-muted">
                        {moduleForm.notesFile.split('/').pop()}
                      </small>
                      <a href={moduleForm.notesFile} target="_blank" rel="noopener noreferrer" className="ms-2">
                        View File
                      </a>
                    </div>
                  )}
                </Form.Group>
              </div>
            )}

            {/* Video Content */}
            {moduleForm.type === 'video' && (
              <div className="border p-3 rounded mb-3">
                <h6>🎬 Video Content</h6>
                <Form.Group className="mb-3">
                  <Form.Label>Video Source</Form.Label>
                  <Form.Select
                    value={moduleForm.videoType}
                    onChange={(e) => setModuleForm({ ...moduleForm, videoType: e.target.value })}
                  >
                    <option value="link">🔗 Video Link (YouTube, Vimeo, etc.)</option>
                    <option value="upload">📤 Upload Video File</option>
                  </Form.Select>
                </Form.Group>

                {moduleForm.videoType === 'link' ? (
                  <Form.Group>
                    <Form.Label>Video URL</Form.Label>
                    <Form.Control
                      value={moduleForm.videoLink}
                      onChange={(e) => setModuleForm({ ...moduleForm, videoLink: e.target.value })}
                      placeholder="https://www.youtube.com/embed/VIDEO_ID"
                    />
                    <small className="text-muted">
                      For YouTube: Use embed URL like https://www.youtube.com/embed/VIDEO_ID
                    </small>
                  </Form.Group>
                ) : (
                  <Form.Group>
                    <Form.Label>Upload Video File</Form.Label>
                    <Form.Control
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          handleFileUpload(e.target.files[0], 'video');
                        }
                      }}
                      disabled={uploading}
                    />
                    {uploading && <Spinner animation="border" size="sm" className="ms-2" />}
                    {moduleForm.videoUrl && (
                      <div className="mt-2">
                        <Badge bg="success">✅ Video uploaded</Badge>
                        <video 
                          src={moduleForm.videoUrl} 
                          controls 
                          style={{ width: '100%', maxHeight: '200px' }}
                          className="mt-2 rounded"
                        />
                      </div>
                    )}
                  </Form.Group>
                )}
              </div>
            )}

            {/* Quiz Content */}
            {moduleForm.type === 'quiz' && (
              <div className="border p-3 rounded mb-3">
                <h6>📝 Quiz Questions</h6>
                <Form.Group className="mb-3">
                  <Form.Label>Time Limit (minutes, 0 for no limit)</Form.Label>
                  <Form.Control
                    type="number"
                    value={moduleForm.quizTimeLimit}
                    onChange={(e) => setModuleForm({ ...moduleForm, quizTimeLimit: e.target.value })}
                    placeholder="e.g., 10"
                  />
                </Form.Group>

                <div className="border p-2 rounded mb-3">
                  <h6>Add Question</h6>
                  <Form.Group className="mb-2">
                    <Form.Label>Question *</Form.Label>
                    <Form.Control
                      value={quizQuestionForm.question}
                      onChange={(e) => setQuizQuestionForm({ ...quizQuestionForm, question: e.target.value })}
                      placeholder="Enter your question"
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Options *</Form.Label>
                    {quizQuestionForm.options.map((opt, idx) => (
                      <Form.Control
                        key={idx}
                        className="mb-1"
                        value={opt}
                        onChange={(e) => {
                          const newOptions = [...quizQuestionForm.options];
                          newOptions[idx] = e.target.value;
                          setQuizQuestionForm({ ...quizQuestionForm, options: newOptions });
                        }}
                        placeholder={`Option ${idx + 1}`}
                      />
                    ))}
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Correct Answer *</Form.Label>
                    <Form.Select
                      value={quizQuestionForm.correctAnswer}
                      onChange={(e) => setQuizQuestionForm({ ...quizQuestionForm, correctAnswer: parseInt(e.target.value) })}
                    >
                      {quizQuestionForm.options.map((opt, idx) => (
                        <option key={idx} value={idx}>
                          Option {idx + 1}: {opt || 'Empty'}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Explanation (Optional)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={quizQuestionForm.explanation}
                      onChange={(e) => setQuizQuestionForm({ ...quizQuestionForm, explanation: e.target.value })}
                      placeholder="Explain why this is the correct answer"
                    />
                  </Form.Group>
                  <Button variant="primary" size="sm" onClick={handleAddQuizQuestion}>
                    Add Question
                  </Button>
                </div>

                {moduleForm.quizQuestions.length > 0 && (
                  <div>
                    <h6>Questions Added ({moduleForm.quizQuestions.length})</h6>
                    {moduleForm.quizQuestions.map((q, idx) => (
                      <div key={idx} className="border p-2 mb-2 rounded">
                        <div className="d-flex justify-content-between">
                          <strong>Q{idx + 1}: {q.question}</strong>
                          <Button variant="outline-danger" size="sm" onClick={() => handleRemoveQuizQuestion(idx)}>
                            Remove
                          </Button>
                        </div>
                        <div className="mt-1">
                          {q.options.map((opt, optIdx) => (
                            <div key={optIdx} className={optIdx === q.correctAnswer ? 'text-success fw-bold' : ''}>
                              {optIdx === q.correctAnswer && '✅ '}
                              {opt}
                            </div>
                          ))}
                        </div>
                        {q.explanation && (
                          <small className="text-muted">💡 {q.explanation}</small>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowModuleModal(false);
            resetForm();
          }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddModule}>
            {editingModule ? 'Update Module' : 'Add Module'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default TeacherContent;