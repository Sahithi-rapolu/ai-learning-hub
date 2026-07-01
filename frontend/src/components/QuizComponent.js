import React, { useState, useEffect, useCallback } from 'react';
import { Card, Form, Button, ProgressBar, Alert, Badge } from 'react-bootstrap';
import API from '../services/api';

const QuizComponent = ({ courseId, module, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime] = useState(Date.now());
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasQuestions, setHasQuestions] = useState(false);

  // ✅ Check if there are questions
  useEffect(() => {
    if (module?.quizQuestions && module.quizQuestions.length > 0) {
      setHasQuestions(true);
      setAnswers(module.quizQuestions.map(() => -1));
      setTimeLeft(module.quizTimeLimit * 60 || 0);
    }
  }, [module]);

  // ✅ Submit quiz function - wrapped in useCallback to fix dependency warning
  const handleSubmitQuiz = useCallback(async () => {
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    setLoading(true);
    
    try {
      const response = await API.post(
        `/courses/${courseId}/modules/${module._id}/quiz/submit`,
        {
          answers: answers.map((answer, index) => ({
            questionIndex: index,
            selectedOption: answer
          })),
          timeTaken
        }
      );
      
      setResults(response.data);
      setSubmitted(true);
      setShowResults(true);
      
      if (response.data.passed) {
        onComplete();
      }
    } catch (err) {
      alert('Failed to submit quiz: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }, [courseId, module?._id, answers, startTime, onComplete]);

  // ✅ Timer effect with proper dependencies
  useEffect(() => {
    if (!hasQuestions || module?.quizTimeLimit === 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [hasQuestions, module?.quizTimeLimit, handleSubmitQuiz]);

  // ✅ If no quiz questions, show message (after hooks are called)
  if (!hasQuestions) {
    return (
      <Alert variant="info">
        <h5>📝 No quiz questions available</h5>
        <p>The teacher hasn't added any questions to this quiz yet.</p>
      </Alert>
    );
  }

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[questionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ✅ Show Results
  if (showResults && results) {
    return (
      <Card className="shadow-sm">
        <Card.Header>
          <h5>📝 Quiz Results</h5>
        </Card.Header>
        <Card.Body>
          <div className="text-center mb-4">
            <h1 className="display-4">{results.percentage}%</h1>
            <Badge bg={results.passed ? 'success' : 'danger'} className="fs-6">
              {results.passed ? '✅ Passed!' : '❌ Try Again'}
            </Badge>
            <p className="mt-2">
              Score: {results.score} / {results.totalQuestions}
            </p>
          </div>

          <ProgressBar 
            now={results.percentage} 
            variant={results.percentage >= 70 ? 'success' : 'warning'}
            className="mb-4"
          />

          <h6>📋 Detailed Results</h6>
          {results.results.map((result, index) => (
            <Card key={index} className={`mb-2 ${result.isCorrect ? 'border-success' : 'border-danger'}`}>
              <Card.Body>
                <div className="d-flex justify-content-between">
                  <strong>Q{index + 1}: {result.question}</strong>
                  <Badge bg={result.isCorrect ? 'success' : 'danger'}>
                    {result.isCorrect ? 'Correct ✅' : 'Incorrect ❌'}
                  </Badge>
                </div>
                <div className="mt-2">
                  {result.options.map((opt, optIdx) => (
                    <div 
                      key={optIdx}
                      className={`
                        p-1 rounded mb-1
                        ${optIdx === result.correctAnswer ? 'bg-success text-white' : ''}
                        ${optIdx === result.selectedOption && optIdx !== result.correctAnswer ? 'bg-danger text-white' : ''}
                      `}
                    >
                      {optIdx === result.selectedOption && '👉 '}
                      {optIdx === result.correctAnswer && '✅ '}
                      {opt}
                    </div>
                  ))}
                </div>
                {result.explanation && (
                  <Alert variant="info" className="mt-2 mb-0">
                    💡 {result.explanation}
                  </Alert>
                )}
              </Card.Body>
            </Card>
          ))}

          <Button variant="primary" onClick={() => setShowResults(false)}>
            Close Results
          </Button>
        </Card.Body>
      </Card>
    );
  }

  // ✅ Quiz Submitted
  if (submitted) {
    return (
      <Alert variant="info">
        <h5>📝 Quiz Submitted!</h5>
        <p>Your answers have been submitted. Click below to see your results.</p>
        <Button variant="primary" onClick={() => setShowResults(true)}>
          View Results
        </Button>
      </Alert>
    );
  }

  const totalQuestions = module.quizQuestions.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  // ✅ Main Quiz
  return (
    <Card className="shadow-sm">
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">📝 Quiz: {module.title}</h5>
          <div>
            {module.quizTimeLimit > 0 && (
              <Badge bg={timeLeft < 60 ? 'danger' : 'secondary'}>
                ⏱️ {formatTime(timeLeft)}
              </Badge>
            )}
            <Badge bg="primary" className="ms-2">
              {currentQuestion + 1} / {totalQuestions}
            </Badge>
          </div>
        </div>
        <ProgressBar now={progress} className="mt-2" />
      </Card.Header>
      <Card.Body>
        <h6>Question {currentQuestion + 1} of {totalQuestions}</h6>
        <p className="fs-5">{module.quizQuestions[currentQuestion].question}</p>
        
        <Form>
          {module.quizQuestions[currentQuestion].options.map((option, idx) => (
            <Form.Check
              key={idx}
              type="radio"
              label={option}
              name="quizOption"
              id={`option-${idx}`}
              checked={answers[currentQuestion] === idx}
              onChange={() => handleAnswerSelect(currentQuestion, idx)}
              className="mb-2 p-2 border rounded"
            />
          ))}
        </Form>

        <div className="d-flex justify-content-between mt-4">
          <Button
            variant="secondary"
            onClick={() => setCurrentQuestion(prev => prev - 1)}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          <div>
            {currentQuestion === totalQuestions - 1 ? (
              <Button 
                variant="success" 
                onClick={handleSubmitQuiz}
                disabled={loading || answers.some(a => a === -1)}
              >
                {loading ? 'Submitting...' : 'Submit Quiz 📤'}
              </Button>
            ) : (
              <Button 
                variant="primary"
                onClick={() => setCurrentQuestion(prev => prev + 1)}
                disabled={answers[currentQuestion] === -1}
              >
                Next Question
              </Button>
            )}
          </div>
        </div>

        <div className="mt-3">
          <small className="text-muted">
            {answers.filter(a => a !== -1).length} of {totalQuestions} answered
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default QuizComponent;