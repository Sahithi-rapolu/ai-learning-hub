const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ============ LOCAL FILE STORAGE ============
// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for local storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadDir));

// ============ MONGODB CONNECTION ============
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_learning_hub';

mongoose.connect(MONGODB_URI)
.then(() => console.log('✅ MongoDB connected successfully!'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
});

// ============ SCHEMAS ============

// User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher'], default: 'student' },
  skills: [String],
  learningGoals: [String],
  progress: [{
    course: String,
    completed: { type: Number, default: 0 }
  }],
  inventory: [{
    item: String,
    quantity: { type: Number, default: 1 }
  }],
  createdAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', async function() {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

const User = mongoose.model('User', UserSchema);

// Course Schema
const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  rating: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const Course = mongoose.model('Course', CourseSchema);

// Module Schema
const ModuleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  order: { type: Number, default: 0 },
  type: { 
    type: String, 
    enum: ['video', 'notes', 'quiz', 'assignment', 'resource'],
    default: 'notes'
  },
  content: { type: String },
  duration: Number,
  videoType: { type: String, enum: ['link', 'upload'] },
  videoUrl: String,
  videoLink: String,
  notesFile: String,
  notesText: String,
  quizQuestions: [{
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true },
    explanation: String
  }],
  quizTimeLimit: { type: Number, default: 0 },
  resources: [{
    title: String,
    url: String,
    type: String
  }],
  completed: { type: Boolean, default: false }
});

// Course Content Schema
const CourseContentSchema = new mongoose.Schema({
  courseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  teacherId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  modules: [ModuleSchema],
  totalDuration: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

const CourseContent = mongoose.model('CourseContent', CourseContentSchema);

// Quiz Attempt Schema
const QuizAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  moduleId: { type: String, required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  answers: [{
    questionIndex: Number,
    selectedOption: Number,
    isCorrect: Boolean
  }],
  score: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  timeTaken: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now }
});

const QuizAttempt = mongoose.model('QuizAttempt', QuizAttemptSchema);

// Student Progress Schema
const StudentProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  moduleProgress: [{
    moduleId: { type: String, required: true },
    completed: { type: Boolean, default: false },
    completedAt: Date,
    timeSpent: { type: Number, default: 0 }
  }],
  overallProgress: { type: Number, default: 0 },
  lastAccessed: { type: Date, default: Date.now }
});

const StudentProgress = mongoose.model('StudentProgress', StudentProgressSchema);

// Skill Exchange Schema
const SkillExchangeSchema = new mongoose.Schema({
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  skillOffered: String,
  skillWanted: String,
  status: { type: String, enum: ['pending', 'accepted', 'completed'], default: 'pending' },
  matchedWith: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const SkillExchange = mongoose.model('SkillExchange', SkillExchangeSchema);

// ============ NOTIFICATION SCHEMA ============
const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  courseTitle: { type: String, required: true },
  moduleTitle: { type: String, required: true },
  moduleType: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', NotificationSchema);

// ============ CERTIFICATE SCHEMA ============
const CertificateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  userName: { type: String, required: true },
  courseTitle: { type: String, required: true },
  certificateId: { type: String, unique: true, required: true },
  issueDate: { type: Date, default: Date.now },
  completionPercentage: { type: Number, default: 100 },
  downloadCount: { type: Number, default: 0 }
});

const Certificate = mongoose.model('Certificate', CertificateSchema);

// ============ DISCUSSION FORUM SCHEMA ============
const DiscussionSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userRole: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  answers: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String },
    userRole: { type: String },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    isTeacher: { type: Boolean, default: false }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Discussion = mongoose.model('Discussion', DiscussionSchema);

// ============ REVIEW SCHEMA ============
const ReviewSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Review = mongoose.model('Review', ReviewSchema);

// ============ AUTH MIDDLEWARE ============
const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

// ============ FILE UPLOAD ROUTE ============

app.post('/api/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const user = await User.findById(req.user.id);
    if (user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can upload files' });
    }
    
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    console.log('✅ File uploaded successfully:');
    console.log('   URL:', fileUrl);
    console.log('   Original Name:', req.file.originalname);
    console.log('   Size:', req.file.size);
    
    res.json({
      message: 'File uploaded successfully!',
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============ COURSE ROUTES ============

// Get all courses
app.get('/api/courses', auth, async (req, res) => {
  try {
    const courses = await Course.find().populate('teacherId', 'name');
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get enrolled courses for a user
app.get('/api/courses/my-courses', auth, async (req, res) => {
  try {
    const enrolledCourses = await Course.find({
      enrolledStudents: req.user.id
    }).populate('teacherId', 'name');
    
    res.json(enrolledCourses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create course (teacher only)
app.post('/api/courses', auth, async (req, res) => {
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

// Enroll in a course
app.post('/api/courses/enroll/:courseId', auth, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.enrolledStudents.includes(userId)) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    course.enrolledStudents.push(userId);
    await course.save();

    const user = await User.findById(userId);
    if (user) {
      user.progress.push({
        course: course.title,
        completed: 0
      });
      await user.save();
    }

    res.json({ 
      message: '✅ Successfully enrolled in the course!',
      course: course
    });
  } catch (err) {
    console.error('Enrollment error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============ COURSE CONTENT ROUTES ============

// Create or update course content (Teacher only) - WITH NOTIFICATIONS
app.post('/api/courses/:courseId/content', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { modules } = req.body;
    
    console.log('📝 Saving content for course:', courseId);
    console.log('📝 Modules received:', modules ? modules.length : 0);
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    if (req.user.role !== 'teacher' || course.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only the course teacher can add content' });
    }

    // Process modules - remove temporary _id
    const processedModules = modules ? modules.map(module => {
      const { _id, ...moduleWithoutId } = module;
      return moduleWithoutId;
    }) : [];

    // Calculate total duration
    let totalDuration = 0;
    processedModules.forEach(module => {
      if (module.duration) totalDuration += parseInt(module.duration) || 0;
    });

    // Find or create content
    let content = await CourseContent.findOne({ courseId });
    
    // Track what's new for notifications
    let newModules = [];
    
    if (content) {
      // Check for new modules (compare lengths and titles)
      const oldModuleTitles = content.modules.map(m => m.title);
      const newModuleTitles = processedModules.map(m => m.title);
      const addedModules = processedModules.filter(m => !oldModuleTitles.includes(m.title));
      newModules = addedModules;
      
      content.modules = processedModules;
      content.totalDuration = totalDuration;
      content.lastUpdated = new Date();
      console.log('✅ Updated existing content with', processedModules.length, 'modules');
    } else {
      // All modules are new
      newModules = processedModules;
      content = new CourseContent({
        courseId,
        teacherId: req.user.id,
        modules: processedModules,
        totalDuration
      });
      console.log('✅ Created new content with', processedModules.length, 'modules');
    }
    
    await content.save();
    
    // Send notifications for new modules
    if (newModules.length > 0) {
      const enrolledStudents = course.enrolledStudents || [];
      
      if (enrolledStudents.length > 0) {
        // Get teacher name
        const teacher = await User.findById(req.user.id);
        const teacherName = teacher?.name || 'Teacher';
        
        // Create notifications for each enrolled student
        for (const studentId of enrolledStudents) {
          for (const module of newModules) {
            const notification = new Notification({
              userId: studentId,
              courseId: course._id,
              courseTitle: course.title,
              moduleTitle: module.title,
              moduleType: module.type,
              message: `📚 New ${module.type} module "${module.title}" added to "${course.title}" by ${teacherName}`,
              read: false,
              createdAt: new Date()
            });
            await notification.save();
          }
        }
        
        console.log(`✅ Sent ${newModules.length} notifications to ${enrolledStudents.length} students`);
      } else {
        console.log('⚠️ No enrolled students to notify');
      }
    }
    
    const savedContent = await CourseContent.findOne({ courseId });
    console.log('✅ Verified content saved with', savedContent.modules.length, 'modules');
    
    res.json({ 
      message: '✅ Course content saved successfully!',
      content: savedContent,
      moduleCount: savedContent.modules.length,
      newModulesCount: newModules.length,
      notificationsSent: newModules.length > 0 ? 'Notifications sent to enrolled students' : 'No notifications sent'
    });
  } catch (err) {
    console.error('❌ Content save error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get course content - returns empty content instead of 404
app.get('/api/courses/:courseId/content', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const isEnrolled = course.enrolledStudents.includes(req.user.id);
    const isTeacher = req.user.role === 'teacher' && course.teacherId.toString() === req.user.id;
    
    if (!isEnrolled && !isTeacher) {
      return res.status(403).json({ error: 'Please enroll in the course to access content' });
    }
    
    let content = await CourseContent.findOne({ courseId });
    
    if (!content) {
      return res.json({ 
        content: {
          courseId: courseId,
          teacherId: course.teacherId,
          modules: [],
          totalDuration: 0,
          lastUpdated: new Date()
        },
        progress: null
      });
    }
    
    let progress = null;
    if (req.user.role === 'student') {
      progress = await StudentProgress.findOne({ 
        userId: req.user.id, 
        courseId 
      });
    }
    
    res.json({ 
      content,
      progress: progress || null
    });
  } catch (err) {
    console.error('Get content error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============ NOTIFICATION ROUTES ============

// Get all notifications for a user
app.get('/api/notifications', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('courseId', 'title');
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get unread notification count
app.get('/api/notifications/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      userId: req.user.id, 
      read: false 
    });
    res.json({ count });
  } catch (err) {
    console.error('Error fetching unread count:', err);
    res.status(500).json({ error: err.message });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json(notification);
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ error: err.message });
  }
});

// Mark all notifications as read
app.put('/api/notifications/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking all as read:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a notification
app.delete('/api/notifications/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============ CERTIFICATE ROUTES ============

// Generate certificate when course is completed
app.post('/api/certificates/generate', auth, async (req, res) => {
  try {
    const { courseId } = req.body;
    
    // Check if user completed the course (100% progress)
    const progress = await StudentProgress.findOne({ 
      userId: req.user.id, 
      courseId 
    });
    
    if (!progress || progress.overallProgress < 100) {
      return res.status(400).json({ 
        error: 'You need to complete 100% of the course to get a certificate' 
      });
    }
    
    // Get user and course details
    const user = await User.findById(req.user.id);
    const course = await Course.findById(courseId);
    
    // Check if certificate already exists
    const existingCert = await Certificate.findOne({ 
      userId: req.user.id, 
      courseId 
    });
    
    if (existingCert) {
      return res.json({ 
        message: 'Certificate already exists',
        certificate: existingCert 
      });
    }
    
    // Generate unique certificate ID
    const certificateId = 'CERT-' + Date.now().toString(36).toUpperCase() + 
                         '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    
    const certificate = new Certificate({
      userId: req.user.id,
      courseId: courseId,
      userName: user.name,
      courseTitle: course.title,
      certificateId: certificateId,
      issueDate: new Date(),
      completionPercentage: progress.overallProgress
    });
    
    await certificate.save();
    
    res.status(201).json({ 
      message: '✅ Certificate generated successfully!',
      certificate 
    });
  } catch (err) {
    console.error('Certificate generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all certificates for a user
app.get('/api/certificates', auth, async (req, res) => {
  try {
    const certificates = await Certificate.find({ userId: req.user.id })
      .populate('courseId', 'title')
      .sort({ issueDate: -1 });
    res.json(certificates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get certificate by ID
app.get('/api/certificates/:id', auth, async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ 
      _id: req.params.id,
      userId: req.user.id 
    }).populate('courseId', 'title description');
    
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    
    res.json(certificate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Increment download count
app.put('/api/certificates/:id/download', auth, async (req, res) => {
  try {
    const certificate = await Certificate.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $inc: { downloadCount: 1 } },
      { new: true }
    );
    
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    
    res.json(certificate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ DISCUSSION FORUM ROUTES ============

// Get all discussions for a course
app.get('/api/discussions/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const discussions = await Discussion.find({ courseId })
      .sort({ createdAt: -1 });
    res.json(discussions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new discussion
app.post('/api/discussions', auth, async (req, res) => {
  try {
    const { courseId, title, content } = req.body;
    const user = await User.findById(req.user.id);
    
    const discussion = new Discussion({
      courseId,
      userId: req.user.id,
      userName: user.name,
      userRole: user.role,
      title,
      content
    });
    
    await discussion.save();
    res.status(201).json(discussion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add an answer to a discussion
app.post('/api/discussions/:id/answers', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const user = await User.findById(req.user.id);
    
    const discussion = await Discussion.findById(id);
    if (!discussion) {
      return res.status(404).json({ error: 'Discussion not found' });
    }
    
    discussion.answers.push({
      userId: req.user.id,
      userName: user.name,
      userRole: user.role,
      content,
      isTeacher: user.role === 'teacher'
    });
    
    discussion.updatedAt = new Date();
    await discussion.save();
    
    res.json(discussion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ REVIEW ROUTES ============

// Get all reviews for a course
app.get('/api/reviews/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const reviews = await Review.find({ courseId }).sort({ createdAt: -1 });
    
    // Calculate average rating
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;
    
    res.json({ reviews, avgRating, totalReviews: reviews.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a review
app.post('/api/reviews', auth, async (req, res) => {
  try {
    const { courseId, rating, comment } = req.body;
    const user = await User.findById(req.user.id);
    
    // Check if user is enrolled
    const course = await Course.findById(courseId);
    if (!course.enrolledStudents.includes(req.user.id)) {
      return res.status(403).json({ error: 'You must be enrolled to review this course' });
    }
    
    // Check if already reviewed
    const existingReview = await Review.findOne({ 
      courseId, 
      userId: req.user.id 
    });
    
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this course' });
    }
    
    const review = new Review({
      courseId,
      userId: req.user.id,
      userName: user.name,
      rating,
      comment
    });
    
    await review.save();
    
    // Update course rating
    const allReviews = await Review.find({ courseId });
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / allReviews.length;
    
    course.rating = avgRating;
    await course.save();
    
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ QUIZ ROUTES ============

// Submit quiz answers
app.post('/api/courses/:courseId/modules/:moduleId/quiz/submit', auth, async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    const { answers, timeTaken } = req.body;
    
    const content = await CourseContent.findOne({ courseId });
    if (!content) {
      return res.status(404).json({ error: 'Course content not found' });
    }
    
    const module = content.modules.find(m => m._id.toString() === moduleId);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    
    if (module.type !== 'quiz') {
      return res.status(400).json({ error: 'This module is not a quiz' });
    }
    
    let score = 0;
    const quizResults = module.quizQuestions.map((question, index) => {
      const userAnswer = answers.find(a => a.questionIndex === index);
      const isCorrect = userAnswer && userAnswer.selectedOption === question.correctAnswer;
      if (isCorrect) score++;
      return {
        questionIndex: index,
        selectedOption: userAnswer ? userAnswer.selectedOption : -1,
        isCorrect: isCorrect || false,
        correctAnswer: question.correctAnswer,
        question: question.question,
        options: question.options,
        explanation: question.explanation
      };
    });
    
    const totalQuestions = module.quizQuestions.length;
    const percentage = Math.round((score / totalQuestions) * 100);
    
    const quizAttempt = new QuizAttempt({
      userId: req.user.id,
      moduleId,
      courseId,
      answers: quizResults.map(r => ({
        questionIndex: r.questionIndex,
        selectedOption: r.selectedOption,
        isCorrect: r.isCorrect
      })),
      score,
      totalQuestions,
      percentage,
      timeTaken: timeTaken || 0
    });
    
    await quizAttempt.save();
    
    if (percentage >= 70) {
      let progress = await StudentProgress.findOne({ 
        userId: req.user.id, 
        courseId 
      });
      
      if (!progress) {
        progress = new StudentProgress({
          userId: req.user.id,
          courseId,
          moduleProgress: []
        });
      }
      
      const moduleIndex = progress.moduleProgress.findIndex(
        mp => mp.moduleId === moduleId
      );
      
      if (moduleIndex > -1) {
        if (!progress.moduleProgress[moduleIndex].completed) {
          progress.moduleProgress[moduleIndex].completed = true;
          progress.moduleProgress[moduleIndex].completedAt = new Date();
        }
      } else {
        progress.moduleProgress.push({
          moduleId,
          completed: true,
          completedAt: new Date()
        });
      }
      
      const totalModules = content.modules.length;
      const completedModules = progress.moduleProgress.filter(mp => mp.completed).length;
      progress.overallProgress = Math.round((completedModules / totalModules) * 100);
      
      await progress.save();
    }
    
    res.json({
      message: 'Quiz submitted successfully!',
      score,
      totalQuestions,
      percentage,
      results: quizResults,
      passed: percentage >= 70
    });
  } catch (err) {
    console.error('Quiz submission error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get quiz results
app.get('/api/courses/:courseId/modules/:moduleId/quiz/results', auth, async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    
    const attempts = await QuizAttempt.find({
      userId: req.user.id,
      courseId,
      moduleId
    }).sort({ submittedAt: -1 });
    
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ MARK MODULE COMPLETE ============

app.post('/api/courses/:courseId/modules/:moduleId/complete', auth, async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    
    const course = await Course.findById(courseId);
    if (!course.enrolledStudents.includes(req.user.id)) {
      return res.status(403).json({ error: 'You are not enrolled in this course' });
    }
    
    let progress = await StudentProgress.findOne({ 
      userId: req.user.id, 
      courseId 
    });
    
    if (!progress) {
      progress = new StudentProgress({
        userId: req.user.id,
        courseId,
        moduleProgress: []
      });
    }
    
    const content = await CourseContent.findOne({ courseId });
    if (!content) {
      return res.status(404).json({ error: 'Course content not found' });
    }
    
    const moduleExists = content.modules.some(m => m._id.toString() === moduleId);
    if (!moduleExists) {
      return res.status(404).json({ error: 'Module not found' });
    }
    
    const moduleIndex = progress.moduleProgress.findIndex(
      mp => mp.moduleId === moduleId
    );
    
    if (moduleIndex > -1) {
      if (!progress.moduleProgress[moduleIndex].completed) {
        progress.moduleProgress[moduleIndex].completed = true;
        progress.moduleProgress[moduleIndex].completedAt = new Date();
      }
    } else {
      progress.moduleProgress.push({
        moduleId,
        completed: true,
        completedAt: new Date()
      });
    }
    
    const totalModules = content.modules.length;
    const completedModules = progress.moduleProgress.filter(mp => mp.completed).length;
    progress.overallProgress = Math.round((completedModules / totalModules) * 100);
    
    await User.findOneAndUpdate(
      { _id: req.user.id, 'progress.course': course.title },
      { $set: { 'progress.$.completed': progress.overallProgress } }
    );
    
    await progress.save();
    
    res.json({ 
      message: '✅ Module marked as complete!',
      progress: progress.overallProgress
    });
  } catch (err) {
    console.error('Module completion error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============ USER ROUTES ============

app.get('/api/users/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const stats = {
      courses: user.progress?.length || 0,
      skills: user.skills?.length || 0,
      xp: 120,
      streak: 5
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/progress', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const progress = user.progress || [
      { course: 'AI Fundamentals', completed: 70 },
      { course: 'Python for AI', completed: 45 }
    ];
    res.json(progress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ SKILLS EXCHANGE ROUTES ============

// Get all skill exchanges
app.get('/api/skills', auth, async (req, res) => {
  try {
    const exchanges = await SkillExchange.find()
      .populate('requesterId', 'name')
      .populate('matchedWith', 'name');
    res.json(exchanges);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create skill exchange request
app.post('/api/skills', auth, async (req, res) => {
  try {
    const { skillOffered, skillWanted } = req.body;
    const exchange = new SkillExchange({
      requesterId: req.user.id,
      skillOffered,
      skillWanted,
      status: 'pending'
    });
    await exchange.save();
    const populatedExchange = await exchange.populate('requesterId', 'name');
    res.status(201).json(populatedExchange);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Connect to a skill exchange request
app.put('/api/skills/:id/connect', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { matchedWith, status } = req.body;
    
    const exchange = await SkillExchange.findById(id);
    if (!exchange) {
      return res.status(404).json({ error: 'Exchange request not found' });
    }
    
    // Check if user is trying to connect with themselves
    if (exchange.requesterId.toString() === req.user.id) {
      return res.status(400).json({ error: 'You cannot connect with yourself' });
    }
    
    // Update the exchange
    exchange.matchedWith = matchedWith || req.user.id;
    exchange.status = status || 'accepted';
    await exchange.save();
    
    const updatedExchange = await SkillExchange.findById(id)
      .populate('requesterId', 'name')
      .populate('matchedWith', 'name');
    
    res.json({ 
      message: '✅ Connected successfully!',
      exchange: updatedExchange
    });
  } catch (err) {
    console.error('Connect error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a skill exchange request (Only the owner can delete)
app.delete('/api/skills/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const exchange = await SkillExchange.findById(id);
    if (!exchange) {
      return res.status(404).json({ error: 'Exchange request not found' });
    }
    
    // Check if user is the owner
    if (exchange.requesterId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own requests' });
    }
    
    await SkillExchange.findByIdAndDelete(id);
    res.json({ message: '✅ Request deleted successfully!' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============ AUTH ROUTES ============

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = new User({ name, email, password, role: role || 'student' });
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET || 'secret123'
    );
    
    res.status(201).json({ 
      token, 
      user: { id: user._id, name, email, role: user.role, skills: user.skills } 
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET || 'secret123'
    );
    
    res.json({ 
      token, 
      user: { id: user._id, name: user.name, email, role: user.role, skills: user.skills } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============ TEST ROUTE ============

app.get('/api/test', (req, res) => {
  res.json({ message: '✅ API is working!' });
});

// ============ SEED DATABASE ============

app.post('/api/seed', async (req, res) => {
  try {
    await User.deleteMany({});
    await Course.deleteMany({});
    await CourseContent.deleteMany({});
    await SkillExchange.deleteMany({});
    await Notification.deleteMany({});
    await Certificate.deleteMany({});
    await Discussion.deleteMany({});
    await Review.deleteMany({});

    const teacher = await User.create({
      name: 'Dr. Smith',
      email: 'teacher@example.com',
      password: 'password123',
      role: 'teacher',
      skills: ['Python', 'AI', 'Machine Learning'],
      inventory: [{ item: 'AI Book', quantity: 5 }]
    });

    const student = await User.create({
      name: 'John Doe',
      email: 'student@example.com',
      password: 'password123',
      role: 'student',
      skills: ['JavaScript', 'HTML', 'CSS'],
      learningGoals: ['AI', 'Python'],
      progress: [{ course: 'AI Fundamentals', completed: 70 }],
      inventory: [{ item: 'Quiz Token', quantity: 5 }]
    });

    await Course.create([
      {
        title: 'AI Fundamentals',
        description: 'Learn the basics of Artificial Intelligence',
        category: 'AI',
        level: 'beginner',
        teacherId: teacher._id,
        enrolledStudents: [student._id]
      },
      {
        title: 'Python for Data Science',
        description: 'Master Python for data analysis and machine learning',
        category: 'Programming',
        level: 'intermediate',
        teacherId: teacher._id,
        enrolledStudents: [student._id]
      },
      {
        title: 'Machine Learning Basics',
        description: 'Introduction to ML algorithms and their applications',
        category: 'AI',
        level: 'beginner',
        teacherId: teacher._id
      }
    ]);

    res.json({ 
      message: '✅ Database seeded successfully!',
      users: {
        student: { email: 'student@example.com', password: 'password123' },
        teacher: { email: 'teacher@example.com', password: 'password123' }
      }
    });
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============ START SERVER ============

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Available endpoints:`);
  console.log(`   ✅ GET  /api/test - Test server`);
  console.log(`   📝 POST /api/auth/register - Register user`);
  console.log(`   🔑 POST /api/auth/login - Login user`);
  console.log(`   📚 GET  /api/courses - Get all courses`);
  console.log(`   📤 POST /api/upload - Upload file`);
  console.log(`   📁 Files stored in: ${uploadDir}`);
  console.log(`   📁 File URL: http://localhost:${PORT}/uploads/filename`);
  console.log(`   📝 POST /api/courses/:courseId/content - Save course content (with notifications)`);
  console.log(`   📖 GET  /api/courses/:courseId/content - Get course content`);
  console.log(`   🎯 POST /api/courses/:courseId/modules/:moduleId/quiz/submit - Submit quiz`);
  console.log(`   ✅ POST /api/courses/:courseId/modules/:moduleId/complete - Mark module complete`);
  console.log(`   📊 GET  /api/users/profile - Get user profile`);
  console.log(`   📊 GET  /api/users/stats - Get user stats`);
  console.log(`   🔄 GET  /api/skills - Get skill exchanges`);
  console.log(`   🤝 PUT  /api/skills/:id/connect - Connect to skill exchange`);
  console.log(`   🗑️ DELETE /api/skills/:id - Delete skill exchange request`);
  console.log(`   🔔 GET  /api/notifications - Get user notifications`);
  console.log(`   🔔 GET  /api/notifications/unread-count - Get unread count`);
  console.log(`   🔔 PUT  /api/notifications/:id/read - Mark notification as read`);
  console.log(`   🔔 PUT  /api/notifications/read-all - Mark all as read`);
  console.log(`   🔔 DELETE /api/notifications/:id - Delete notification`);
  console.log(`   🏆 POST /api/certificates/generate - Generate certificate`);
  console.log(`   🏆 GET  /api/certificates - Get all certificates`);
  console.log(`   🏆 GET  /api/certificates/:id - Get certificate by ID`);
  console.log(`   🏆 PUT  /api/certificates/:id/download - Increment download count`);
  console.log(`   💬 GET  /api/discussions/:courseId - Get course discussions`);
  console.log(`   💬 POST /api/discussions - Create new discussion`);
  console.log(`   💬 POST /api/discussions/:id/answers - Add answer to discussion`);
  console.log(`   ⭐ GET  /api/reviews/:courseId - Get course reviews`);
  console.log(`   ⭐ POST /api/reviews - Add a review`);
  console.log(`   🌱 POST /api/seed - Seed database`);
});