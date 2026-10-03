const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('./models/User');
const Note = require('./models/Note');
const Post = require('./models/Post');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/secure_notes_app';
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Note.deleteMany({});
    await Post.deleteMany({});
    console.log('Existing collections cleared.');

    // 1. Create Users
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      interests: ['security', 'management', 'architecture', 'reading'],
    });

    const userAlice = await User.create({
      name: 'Alice Johnson',
      email: 'alice@example.com',
      password: 'password123',
      role: 'user',
      interests: ['chess', 'reading', 'cryptography', 'tech'],
    });

    const userBob = await User.create({
      name: 'Bob Miller',
      email: 'bob@example.com',
      password: 'password123',
      role: 'user',
      interests: ['chess', 'travel', 'photography', 'tech'],
    });

    const userCharlie = await User.create({
      name: 'Charlie Davis',
      email: 'charlie@example.com',
      password: 'password123',
      role: 'user',
      interests: ['reading', 'writing', 'fitness'],
    });

    console.log('Users created successfully.');

    // 2. Create Notes for Users
    await Note.create([
      {
        title: 'Project Roadmap Q4',
        content: 'Sprint 1: Complete database indexing and role-based access control. Sprint 2: Frontend integration with Next.js.',
        tags: ['work', 'planning'],
        userId: adminUser._id,
      },
      {
        title: 'Infrastructure Audit Notes',
        content: 'Check connection pooling, JWT expiration settings, and TLS encryption across all production nodes.',
        tags: ['security', 'devops'],
        userId: adminUser._id,
      },
      {
        title: 'Chess Opening Repertoire',
        content: 'Focus on Sicilian Defense and Queen\'s Gambit Declined for upcoming tournament preparation.',
        tags: ['hobby', 'chess'],
        userId: userAlice._id,
      },
      {
        title: 'Secure Coding Checklist',
        content: 'Always sanitize user inputs, avoid dynamic query generation, and ensure compound indexes are utilized.',
        tags: ['security', 'coding'],
        userId: userAlice._id,
      },
      {
        title: 'Travel Gear List 2026',
        content: 'Pack mirrorless camera, 24-70mm lens, compact tripod, lightweight raincoat, and power bank.',
        tags: ['travel', 'photography'],
        userId: userBob._id,
      },
      {
        title: 'Morning Workout Routine',
        content: '30 minutes stretching, 4x12 bodyweight squats, 3x15 push-ups, and 5km steady state run.',
        tags: ['fitness', 'health'],
        userId: userCharlie._id,
      },
    ]);

    console.log('Sample notes created successfully.');

    // 3. Create Posts for Users (For Scenario 2: $lookup)
    await Post.create([
      {
        title: 'Getting Started with Secure Web APIs',
        content: 'Building robust RESTful APIs requires disciplined authentication, parameterized queries, and careful indexing.',
        userId: userAlice._id,
      },
      {
        title: 'Mastering the Sicilian Defense in Chess',
        content: 'A detailed breakdown of key lines and strategic ideas for active piece counterplay.',
        userId: userAlice._id,
      },
      {
        title: 'Landscape Photography in the High Alps',
        content: 'Capturing golden hour light on rugged peaks using graduated neutral density filters.',
        userId: userBob._id,
      },
      {
        title: 'Platform Maintenance Notice',
        content: 'Scheduled maintenance this Sunday at 02:00 UTC for database performance tuning and index verification.',
        userId: adminUser._id,
      },
    ]);

    console.log('Sample posts created successfully.');
    console.log('\n--- SEED COMPLETE ---');
    console.log('Admin Account: admin@example.com / password123');
    console.log('User Account 1: alice@example.com / password123');
    console.log('User Account 2: bob@example.com / password123');
    console.log('User Account 3: charlie@example.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
