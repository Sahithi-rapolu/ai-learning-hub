import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

function Certificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await API.get('/certificates');
      setCertificates(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching certificates:', err);
      setError('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading certificates...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>🏆 My Certificates</h2>
        <Button variant="primary" onClick={() => navigate('/courses')}>
          <i className="bi bi-plus-circle me-2"></i>
          Complete More Courses
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {certificates.length === 0 ? (
        <Card className="text-center p-5">
          <i className="bi bi-award" style={{ fontSize: '4rem', color: '#ccc' }}></i>
          <h5 className="mt-3">No Certificates Yet</h5>
          <p className="text-muted">
            Complete a course with 100% progress to earn a certificate!
          </p>
          <Button variant="primary" onClick={() => navigate('/courses')}>
            Browse Courses
          </Button>
        </Card>
      ) : (
        <Row>
          {certificates.map((cert) => (
            <Col md={4} key={cert._id} className="mb-4">
              <Card className="h-100 shadow-sm border-success">
                <Card.Header className="bg-success text-white text-center">
                  <i className="bi bi-award" style={{ fontSize: '2rem' }}></i>
                </Card.Header>
                <Card.Body className="text-center">
                  <h5>{cert.courseTitle}</h5>
                  <p className="text-muted small">
                    Issued to: <strong>{cert.userName}</strong>
                  </p>
                  <p className="text-muted small">
                    Date: {formatDate(cert.issueDate)}
                  </p>
                  <Badge bg="success" className="mb-2">
                    Certificate ID: {cert.certificateId}
                  </Badge>
                </Card.Body>
                <Card.Footer className="bg-white">
                  <Button 
                    variant="primary" 
                    className="w-100"
                    onClick={() => navigate(`/certificate-view/${cert._id}`)}
                  >
                    <i className="bi bi-eye me-2"></i>
                    View Certificate
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}

export default Certificates;