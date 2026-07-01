const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
  modules: [{
    title: String,
    content: String,
    duration: Number, // in minutes
    order: Number
  }],
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  rating: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', CourseSchema);