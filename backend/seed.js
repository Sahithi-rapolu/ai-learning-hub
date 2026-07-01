const mongoose = require('mongoose');
const User = require('./models/User');
const Course = require('./models/Course');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_learning_hub');

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});

    // Create sample users
    const teacher = await User.create({
      name: 'Dr. Smith',
      email: 'teacher@example.com',
      password: 'password123',
      role: 'teacher',
      skills: ['Python', 'AI', 'Machine Learning']
    });

    const student = await User.create({
      name: 'John Doe',
      email: 'student@example.com',
      password: 'password123',
      role: 'student',
      skills: ['JavaScript'],
      learningGoals: ['AI', 'Python']
    });

    // Create sample courses
    await Course.create([
      {
        title: 'AI Fundamentals',
        description: 'Learn the basics of Artificial Intelligence',
        category: 'AI',
        level: 'beginner',
        teacherId: teacher._id,
        modules: [
          { title: 'Introduction to AI', content: 'What is AI?', duration: 30, order: 1 },
          { title: 'Machine Learning Basics', content: 'Types of ML', duration: 45, order: 2 }
        ],
        enrolledStudents: [student._id]
      },
      {
        title: 'Python for Data Science',
        description: 'Master Python for data analysis',
        category: 'Programming',
        level: 'intermediate',
        teacherId: teacher._id,
        modules: [
          { title: 'Python Basics', content: 'Variables and loops', duration: 40, order: 1 },
          { title: 'Data Analysis with Pandas', content: 'Working with dataframes', duration: 60, order: 2 }
        ]
      }
    ]);

    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedData();