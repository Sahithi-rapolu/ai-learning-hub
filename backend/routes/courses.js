const router = require('express').Router();
const Course = require('../models/Course');
const auth = require('../middleware/auth');

// Get all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().populate('teacherId', 'name');
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create course (teacher only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can create courses' });
    }
    const course = new Course({ ...req.body, teacherId: req.user.id });
    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;