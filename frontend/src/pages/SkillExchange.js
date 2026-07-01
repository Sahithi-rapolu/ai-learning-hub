import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Badge, Alert, Spinner, Modal, Tab, Nav } from 'react-bootstrap';
import API from '../services/api';

function SkillExchange() {
  // ✅ Removed unused 'requests' variable
  const [myRequests, setMyRequests] = useState([]);
  const [otherRequests, setOtherRequests] = useState([]);
  const [newRequest, setNewRequest] = useState({
    skillOffered: '',
    skillWanted: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('available');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get user info
      const userRes = await API.get('/users/profile');
      setUser(userRes.data);
      
      // Get all skill exchanges
      const response = await API.get('/skills');
      const allRequests = response.data;
      
      // Separate requests: My requests vs Others' requests
      const myReqs = allRequests.filter(req => 
        req.requesterId?._id === userRes.data._id || req.requesterId === userRes.data._id
      );
      
      const otherReqs = allRequests.filter(req => 
        req.requesterId?._id !== userRes.data._id && req.requesterId !== userRes.data._id
      );
      
      setMyRequests(myReqs);
      setOtherRequests(otherReqs);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching skill requests:', err);
      setMessage({ text: 'Error loading skill exchanges', type: 'danger' });
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!newRequest.skillOffered || !newRequest.skillWanted) {
        setMessage({ text: 'Please fill in both fields', type: 'warning' });
        return;
      }
      
      await API.post('/skills', newRequest);
      await fetchData(); // Refresh the list
      setNewRequest({ skillOffered: '', skillWanted: '' });
      setShowForm(false);
      setMessage({ text: '✅ Skill request posted successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      console.error('Error creating skill request:', err);
      setMessage({ text: err.response?.data?.error || 'Failed to create request', type: 'danger' });
    }
  };

  const handleConnect = (request) => {
    // Check if user is trying to connect with themselves
    if (request.requesterId?._id === user?._id || request.requesterId === user?._id) {
      setMessage({ text: '⚠️ You cannot connect with yourself!', type: 'warning' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      return;
    }
    
    setSelectedRequest(request);
    setShowConnectModal(true);
  };

  const handleConfirmConnect = async () => {
    try {
      setConnecting(true);
      
      await API.put(`/skills/${selectedRequest._id}/connect`, {
        matchedWith: user._id,
        status: 'accepted'
      });
      
      await fetchData();
      
      setMessage({ 
        text: `✅ Connected with ${selectedRequest.requesterId?.name || 'user'}!`, 
        type: 'success' 
      });
      setShowConnectModal(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      console.error('Error connecting:', err);
      setMessage({ text: err.response?.data?.error || 'Failed to connect', type: 'danger' });
    } finally {
      setConnecting(false);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      try {
        await API.delete(`/skills/${requestId}`);
        await fetchData();
        setMessage({ text: '✅ Request deleted successfully!', type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      } catch (err) {
        console.error('Error deleting request:', err);
        setMessage({ text: 'Failed to delete request', type: 'danger' });
      }
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'pending': 'warning',
      'accepted': 'success',
      'completed': 'info'
    };
    return variants[status] || 'secondary';
  };

  // Render individual request card
  const renderRequestCard = (request, isOwn = false) => {
    const isConnected = request.status === 'accepted';
    const isPending = request.status === 'pending';
    
    return (
      <Card className="shadow-sm mb-3" key={request._id}>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h5>
                Offers: <Badge bg="primary">{request.skillOffered}</Badge>
              </h5>
              <h5>
                Wants: <Badge bg="success">{request.skillWanted}</Badge>
              </h5>
              <div className="mt-2">
                <small className="text-muted">
                  <i className="bi bi-person me-1"></i>
                  {request.requesterId?.name || 'Unknown User'}
                  {isOwn && (
                    <Badge bg="info" className="ms-2">Your Request</Badge>
                  )}
                  {request.matchedWith && (
                    <Badge bg="success" className="ms-2">
                      <i className="bi bi-check-circle me-1"></i>
                      Connected with {request.matchedWith?.name || 'someone'}
                    </Badge>
                  )}
                </small>
              </div>
              <div className="mt-1">
                <Badge bg={getStatusBadge(request.status)}>
                  {request.status.toUpperCase()}
                </Badge>
                {isConnected && (
                  <Badge bg="success" className="ms-2">
                    <i className="bi bi-handshake me-1"></i>
                    Connected
                  </Badge>
                )}
              </div>
            </div>
            <div>
              {/* Actions for own requests */}
              {isOwn && isPending && (
                <Button 
                  variant="outline-danger" 
                  size="sm"
                  onClick={() => handleDeleteRequest(request._id)}
                >
                  <i className="bi bi-trash me-1"></i>
                  Delete
                </Button>
              )}
              
              {/* Actions for others' requests */}
              {!isOwn && isPending && (
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => handleConnect(request)}
                  disabled={connecting}
                >
                  <i className="bi bi-handshake me-1"></i>
                  Connect
                </Button>
              )}
              
              {!isOwn && isConnected && (
                <Button 
                  variant="outline-success" 
                  size="sm"
                  disabled
                >
                  <i className="bi bi-check-circle me-1"></i>
                  Connected
                </Button>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading skill exchanges...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>🔄 Skills Exchange</h2>
        <Button onClick={() => setShowForm(!showForm)} variant="primary">
          {showForm ? 'Cancel' : '➕ Request Skill'}
        </Button>
      </div>

      {message.text && (
        <Alert variant={message.type} onClose={() => setMessage({ text: '', type: '' })} dismissible>
          {message.text}
        </Alert>
      )}

      {showForm && (
        <Card className="mb-4 p-3 shadow-sm">
          <Card.Body>
            <h5>📝 Post a Skill Request</h5>
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={5}>
                  <Form.Group>
                    <Form.Label>Skill You Offer</Form.Label>
                    <Form.Control
                      value={newRequest.skillOffered}
                      onChange={(e) => setNewRequest({ ...newRequest, skillOffered: e.target.value })}
                      placeholder="e.g., Python"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={5}>
                  <Form.Group>
                    <Form.Label>Skill You Want</Form.Label>
                    <Form.Control
                      value={newRequest.skillWanted}
                      onChange={(e) => setNewRequest({ ...newRequest, skillWanted: e.target.value })}
                      placeholder="e.g., React"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={2} className="d-flex align-items-end">
                  <Button type="submit" variant="success" className="w-100">
                    Submit
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>
      )}

      {/* Tabs for separating views */}
      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
        <Nav variant="tabs" className="mb-3">
          <Nav.Item>
            <Nav.Link eventKey="available">
              <i className="bi bi-people me-1"></i>
              Available ({otherRequests.filter(r => r.status === 'pending').length})
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="my-requests">
              <i className="bi bi-person me-1"></i>
              My Requests ({myRequests.length})
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="connections">
              <i className="bi bi-handshake me-1"></i>
              Connections ({myRequests.filter(r => r.status === 'accepted').length + otherRequests.filter(r => r.status === 'accepted').length})
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          {/* Available Requests Tab - Only show other users' pending requests */}
          <Tab.Pane eventKey="available">
            {otherRequests.filter(r => r.status === 'pending').length === 0 ? (
              <Alert variant="info">No available skill exchange requests from other users.</Alert>
            ) : (
              otherRequests.filter(r => r.status === 'pending').map(request => renderRequestCard(request, false))
            )}
          </Tab.Pane>

          {/* My Requests Tab - Show only user's own requests */}
          <Tab.Pane eventKey="my-requests">
            {myRequests.length === 0 ? (
              <Alert variant="info">You haven't posted any skill requests yet.</Alert>
            ) : (
              myRequests.map(request => renderRequestCard(request, true))
            )}
          </Tab.Pane>

          {/* Connections Tab - Show all accepted connections */}
          <Tab.Pane eventKey="connections">
            {myRequests.filter(r => r.status === 'accepted').length === 0 && 
             otherRequests.filter(r => r.status === 'accepted').length === 0 ? (
              <Alert variant="info">No connections yet. Connect with someone to start learning!</Alert>
            ) : (
              <>
                {/* My accepted connections */}
                {myRequests.filter(r => r.status === 'accepted').map(request => renderRequestCard(request, true))}
                {/* Others' accepted connections */}
                {otherRequests.filter(r => r.status === 'accepted').map(request => renderRequestCard(request, false))}
              </>
            )}
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      {/* Connect Confirmation Modal */}
      <Modal show={showConnectModal} onHide={() => setShowConnectModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>🤝 Confirm Connection</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>You are about to connect with <strong>{selectedRequest?.requesterId?.name}</strong>.</p>
          <p><strong>They offer:</strong> {selectedRequest?.skillOffered}</p>
          <p><strong>They want:</strong> {selectedRequest?.skillWanted}</p>
          <Alert variant="info">
            <i className="bi bi-info-circle me-2"></i>
            This will send a connection request and you can start learning together!
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConnectModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleConfirmConnect}
            disabled={connecting}
          >
            {connecting ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Connecting...
              </>
            ) : (
              'Confirm Connection'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default SkillExchange;