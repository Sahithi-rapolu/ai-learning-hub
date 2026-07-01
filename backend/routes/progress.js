const router = require('express').Router();
const auth = require('../middleware/auth');

// Get progress
router.get('/', auth, async (req, res) => {
  try {
    // Example progress data
    const progress = [
      { course: 'AI Fundamentals', completed: 70 },
      { course: 'Python for AI', completed: 45 },
      { course: 'Machine Learning', completed: 20 }
    ];
    res.json(progress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;