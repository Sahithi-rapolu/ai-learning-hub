import React, { useState } from 'react';
import { Card, Button, ProgressBar, Alert } from 'react-bootstrap';

function AITest() {
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState([]);

  const questions = [
    {
      question: "What does 'API' stand for?",
      options: ["Application Programming Interface", "Advanced Programming Interface", "Applied Program Interface"],
      correct: 0
    },
    {
      question: "Which is a supervised learning task?",
      options: ["Clustering", "Classification", "Dimensionality reduction"],
      correct: 1
    },
    {
      question: "What is the main purpose of neural networks?",
      options: ["Pattern recognition", "Data storage", "Web development"],
      correct: 0
    }
  ];

  const handleAnswer = (index) => {
    const isCorrect = index === questions[currentQ].correct;
    if (isCorrect) setScore(score + 1);
    
    setAnswers([...answers, { question: currentQ, correct: isCorrect }]);
    
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setShowResult(true);
    }
  };

  const getAIAnalysis = () => {
    const percentage = (score / questions.length) * 100;
    if (percentage >= 80) return "🌟 Excellent! You're AI-ready!";
    if (percentage >= 60) return "💪 Good foundation! Keep learning!";
    if (percentage >= 40) return "📚 Keep going! Review the basics.";
    return "🔄 Try again! Start with beginner modules.";
  };

  if (showResult) {
    return (
      <Card className="p-4">
        <h3>🎯 AI Eligibility Test Results</h3>
        <h1 className="display-4">{score}/{questions.length}</h1>
        <ProgressBar now={(score/questions.length)*100} className="my-3" />
        <Alert variant={score >= 2 ? "success" : "warning"}>
          {getAIAnalysis()}
        </Alert>
        <Button onClick={() => {
          setCurrentQ(0);
          setScore(0);
          setShowResult(false);
          setAnswers([]);
        }}>
          Retake Test
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h4>AI Eligibility Test</h4>
      <p className="text-muted">Question {currentQ + 1} of {questions.length}</p>
      <ProgressBar now={((currentQ)/questions.length)*100} className="mb-3" />
      
      <h5>{questions[currentQ].question}</h5>
      <div className="mt-3">
        {questions[currentQ].options.map((option, idx) => (
          <Button 
            key={idx}
            variant="outline-primary" 
            className="d-block w-100 mb-2"
            onClick={() => handleAnswer(idx)}
          >
            {option}
          </Button>
        ))}
      </div>
    </Card>
  );
}

export default AITest;