import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Alert, Badge } from 'react-bootstrap';

function FileViewer({ show, onHide, fileUrl, fileName }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileType, setFileType] = useState('');

  useEffect(() => {
    if (show && fileUrl) {
      setLoading(true);
      setError(null);
      
      const ext = fileUrl.split('.').pop().toLowerCase();
      const typeMap = {
        'pdf': 'pdf',
        'doc': 'word',
        'docx': 'word',
        'xls': 'excel',
        'xlsx': 'excel',
        'ppt': 'powerpoint',
        'pptx': 'powerpoint',
        'txt': 'text',
        'md': 'text',
        'png': 'image',
        'jpg': 'image',
        'jpeg': 'image',
        'gif': 'image',
        'webp': 'image',
        'svg': 'image',
        'mp4': 'video',
        'avi': 'video',
        'mov': 'video',
        'wmv': 'video',
        'webm': 'video',
        'zip': 'archive',
        'rar': 'archive',
        'mp3': 'audio',
        'wav': 'audio'
      };
      setFileType(typeMap[ext] || 'unknown');
      setLoading(false);
    }
  }, [show, fileUrl]);

  const handleDownload = () => {
    window.open(fileUrl, '_blank');
  };

  const getFileIcon = (type) => {
    const icons = {
      'pdf': 'bi-file-earmark-pdf text-danger',
      'word': 'bi-file-earmark-word text-primary',
      'excel': 'bi-file-earmark-excel text-success',
      'powerpoint': 'bi-file-earmark-ppt text-warning',
      'text': 'bi-file-earmark-text text-secondary',
      'image': 'bi-file-earmark-image text-info',
      'video': 'bi-file-earmark-play text-danger',
      'archive': 'bi-file-earmark-zip text-secondary',
      'audio': 'bi-file-earmark-music text-success',
      'unknown': 'bi-file-earmark-text text-secondary'
    };
    return icons[type] || 'bi-file-earmark-text text-secondary';
  };

  const getFileTypeLabel = (type) => {
    const labels = {
      'pdf': 'PDF Document',
      'word': 'Word Document',
      'excel': 'Excel Spreadsheet',
      'powerpoint': 'PowerPoint Presentation',
      'text': 'Text File',
      'image': 'Image',
      'video': 'Video',
      'archive': 'Archive',
      'audio': 'Audio',
      'unknown': 'File'
    };
    return labels[type] || 'File';
  };

  const renderFileContent = () => {
    if (loading) {
      return (
        <div className="text-center p-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading file...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4">
          <Alert variant="danger">
            <h5>❌ Failed to Load File</h5>
            <p>{error}</p>
          </Alert>
        </div>
      );
    }

    // ✅ SIMPLIFIED PDF VIEW - Just show the file with buttons
    return (
      <div className="text-center p-5">
        <div style={{ fontSize: '4rem' }}>
          <i className={getFileIcon(fileType)}></i>
        </div>
        <h5 className="mt-3">{fileName || 'File'}</h5>
        <p className="text-muted">{getFileTypeLabel(fileType)}</p>
        
        <div className="d-flex flex-wrap gap-2 justify-content-center mt-4">
          <Button 
            variant="primary" 
            onClick={() => window.open(fileUrl, '_blank')}
            size="lg"
          >
            <i className="bi bi-eye me-2"></i>
            Open in New Tab
          </Button>
          <Button 
            variant="success" 
            onClick={handleDownload}
            size="lg"
          >
            <i className="bi bi-download me-2"></i>
            Download
          </Button>
        </div>
        
        {fileType === 'pdf' && (
          <Alert variant="info" className="mt-4">
            <i className="bi bi-info-circle me-2"></i>
            <strong>Tip:</strong> Click "Open in New Tab" to view the PDF directly in your browser.
          </Alert>
        )}
      </div>
    );
  };

  const fileNameDisplay = fileName || fileUrl?.split('/').pop() || 'File';

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className={`bi ${getFileIcon(fileType)} me-2`}></i>
          <span>{fileNameDisplay}</span>
          <Badge bg="secondary" className="ms-2">
            {getFileTypeLabel(fileType)}
          </Badge>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ minHeight: '300px' }}>
        {renderFileContent()}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button variant="success" onClick={handleDownload}>
          <i className="bi bi-download me-2"></i>
          Download
        </Button>
        <Button variant="primary" onClick={() => window.open(fileUrl, '_blank')}>
          <i className="bi bi-box-arrow-up-right me-2"></i>
          Open in New Tab
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default FileViewer;