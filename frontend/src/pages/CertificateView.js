import React, { useState, useEffect, useCallback } from 'react';
import { Container, Spinner, Alert, Button, Card } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';

function CertificateView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [certificate, setCertificate] = useState(null);

  // ✅ Wrap fetchCertificate in useCallback
  const fetchCertificate = useCallback(async () => {
    try {
      setLoading(true);
      const response = await API.get(`/certificates/${id}`);
      setCertificate(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching certificate:', err);
      setError('Certificate not found or access denied');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // ✅ Add fetchCertificate to dependency array
  useEffect(() => {
    fetchCertificate();
  }, [fetchCertificate]);

  const handleDownload = async () => {
    try {
      await API.put(`/certificates/${id}/download`);
      // Trigger print
      window.print();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading certificate...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={() => navigate('/certificates')}>
          Back to Certificates
        </Button>
      </Container>
    );
  }

  return (
    <Container className="mt-5 mb-5">
      <Card className="shadow-lg">
        <Card.Body className="p-5">
          {/* Certificate Design */}
          <div className="certificate-container text-center border border-success rounded p-5" 
               style={{ backgroundColor: '#f8f9fa' }}>
            
            {/* Decorative border */}
            <div className="border border-success border-3 p-4">
              <h1 className="text-success mb-4">🏆 Certificate of Completion</h1>
              
              <div className="border-bottom border-success pb-3">
                <h4>This Certificate is Presented To</h4>
                <h2 className="text-primary display-4">{certificate?.userName}</h2>
              </div>
              
              <div className="my-4">
                <p className="lead">For successfully completing the course</p>
                <h3 className="text-success">{certificate?.courseTitle}</h3>
                <p className="text-muted">
                  Completion: {certificate?.completionPercentage}%
                </p>
              </div>
              
              <div className="border-top border-success pt-3">
                <p className="text-muted">
                  <strong>Certificate ID:</strong> {certificate?.certificateId}
                </p>
                <p className="text-muted">
                  <strong>Issued on:</strong> {new Date(certificate?.issueDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              {/* Signature */}
              <div className="mt-4">
                <div className="d-flex justify-content-around">
                  <div>
                    <div className="border-top pt-2" style={{ width: '200px' }}>
                      <small>Instructor Signature</small>
                    </div>
                  </div>
                  <div>
                    <div className="border-top pt-2" style={{ width: '200px' }}>
                      <small>Date</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="text-center mt-4">
            <Button 
              variant="success" 
              className="me-2"
              onClick={handleDownload}
            >
              <i className="bi bi-download me-2"></i>
              Download Certificate
            </Button>
            <Button 
              variant="primary"
              onClick={() => navigate('/certificates')}
            >
              Back to Certificates
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default CertificateView;