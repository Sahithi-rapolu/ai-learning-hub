const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher'], default: 'student' },
  skills: [String],
  learningGoals: [String],
  progress: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    completed: { type: Number, default: 0 },
    lastAccessed: { type: Date, default: Date.now }
  }],
  inventory: [{
    item: String,
    quantity: { type: Number, default: 1 }
  }],
  createdAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('User', UserSchema);