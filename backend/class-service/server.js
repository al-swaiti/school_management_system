require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const winston = require('winston');
const Joi = require('joi');
const axios = require('axios');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3002;

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/class-service', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  logger.info('Connected to MongoDB');
  console.log('Connected to MongoDB');
})
.catch(err => {
  logger.error('MongoDB connection error:', err);
  console.error('MongoDB connection error:', err);
});

// Define Class Schema
const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  gradeLevel: {
    type: String,
    required: true
  },
  teacherId: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  schedule: [{
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6
    },
    startTime: String,
    endTime: String,
    location: String
  }],
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  enrollmentCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'upcoming', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Define Enrollment Schema
const enrollmentSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  studentId: {
    type: String,
    required: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'dropped', 'completed'],
    default: 'active'
  },
  grade: String,
  attendance: [{
    date: Date,
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused']
    },
    notes: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hooks to update the updatedAt field
classSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

enrollmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create models
const Class = mongoose.model('Class', classSchema);
const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(morgan('combined')); // HTTP request logging

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });
    
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Validation schemas
const classSchema_joi = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  subject: Joi.string().required(),
  gradeLevel: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required(),
  schedule: Joi.array().items(
    Joi.object({
      dayOfWeek: Joi.number().min(0).max(6).required(),
      startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      location: Joi.string().required()
    })
  ),
  capacity: Joi.number().min(1).required(),
  tags: Joi.array().items(Joi.string())
});

const enrollmentSchema_joi = Joi.object({
  classId: Joi.string().required(),
  studentId: Joi.string().required()
});

// Routes
// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Create a new class (teachers and admins only)
app.post('/classes', authenticateToken, async (req, res) => {
  try {
    // Check if user is teacher or admin
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only teachers and admins can create classes.' });
    }
    
    // Validate request body
    const { error } = classSchema_joi.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    // Create new class
    const newClass = new Class({
      ...req.body,
      teacherId: req.user.role === 'teacher' ? req.user.id : req.body.teacherId
    });
    
    await newClass.save();
    
    res.status(201).json({
      message: 'Class created successfully',
      class: newClass
    });
  } catch (error) {
    logger.error('Create class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all classes
app.get('/classes', authenticateToken, async (req, res) => {
  try {
    let query = {};
    
    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Filter by subject if provided
    if (req.query.subject) {
      query.subject = req.query.subject;
    }
    
    // Filter by grade level if provided
    if (req.query.gradeLevel) {
      query.gradeLevel = req.query.gradeLevel;
    }
    
    // Filter by teacher if provided
    if (req.query.teacherId) {
      query.teacherId = req.query.teacherId;
    }
    
    // Filter by tags if provided
    if (req.query.tags) {
      const tags = req.query.tags.split(',');
      query.tags = { $in: tags };
    }
    
    const classes = await Class.find(query).sort({ startDate: 1 });
    res.json(classes);
  } catch (error) {
    logger.error('Get classes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get class by ID
app.get('/classes/:id', authenticateToken, async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    res.json(classItem);
  } catch (error) {
    logger.error('Get class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update class (teacher of the class or admin only)
app.put('/classes/:id', authenticateToken, async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Check if user is the teacher of this class or an admin
    if (req.user.role !== 'admin' && classItem.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Only the teacher of this class or an admin can update it.' });
    }
    
    // Update fields
    const updateFields = ['name', 'description', 'subject', 'gradeLevel', 'startDate', 'endDate', 'schedule', 'capacity', 'status', 'tags'];
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        classItem[field] = req.body[field];
      }
    });
    
    await classItem.save();
    
    res.json({
      message: 'Class updated successfully',
      class: classItem
    });
  } catch (error) {
    logger.error('Update class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete class (admin only)
app.delete('/classes/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only admins can delete classes.' });
    }
    
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Delete all enrollments for this class
    await Enrollment.deleteMany({ classId: req.params.id });
    
    // Delete the class
    await Class.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Class and all related enrollments deleted successfully' });
  } catch (error) {
    logger.error('Delete class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Enroll in a class (students only)
app.post('/enrollments', authenticateToken, async (req, res) => {
  try {
    // Check if user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Only students can enroll in classes.' });
    }
    
    // Validate request body
    const { error } = enrollmentSchema_joi.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    const { classId } = req.body;
    const studentId = req.user.id;
    
    // Check if class exists
    const classItem = await Class.findById(classId);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Check if class is full
    if (classItem.enrollmentCount >= classItem.capacity) {
      return res.status(400).json({ message: 'Class is full' });
    }
    
    // Check if student is already enrolled
    const existingEnrollment = await Enrollment.findOne({ classId, studentId });
    if (existingEnrollment) {
      return res.status(400).json({ message: 'Student is already enrolled in this class' });
    }
    
    // Create enrollment
    const newEnrollment = new Enrollment({
      classId,
      studentId
    });
    
    await newEnrollment.save();
    
    // Update class enrollment count
    classItem.enrollmentCount += 1;
    await classItem.save();
    
    res.status(201).json({
      message: 'Enrolled successfully',
      enrollment: newEnrollment
    });
  } catch (error) {
    logger.error('Enrollment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get enrollments for a student
app.get('/enrollments/student', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Get all enrollments for this student
    const enrollments = await Enrollment.find({ studentId });
    
    // Get class details for each enrollment
    const enrollmentDetails = await Promise.all(
      enrollments.map(async (enrollment) => {
        const classItem = await Class.findById(enrollment.classId);
        return {
          enrollment,
          class: classItem
        };
      })
    );
    
    res.json(enrollmentDetails);
  } catch (error) {
    logger.error('Get student enrollments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get enrollments for a class (teacher of the class or admin only)
app.get('/enrollments/class/:classId', authenticateToken, async (req, res) => {
  try {
    const classId = req.params.classId;
    
    // Check if class exists
    const classItem = await Class.findById(classId);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Check if user is the teacher of this class or an admin
    if (req.user.role !== 'admin' && classItem.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Only the teacher of this class or an admin can view enrollments.' });
    }
    
    // Get all enrollments for this class
    const enrollments = await Enrollment.find({ classId });
    
    // Get student details for each enrollment from user service
    const enrollmentDetails = await Promise.all(
      enrollments.map(async (enrollment) => {
        try {
          // In a real implementation, this would call the user service API
          // For now, we'll just return the enrollment with the student ID
          return {
            enrollment,
            student: { id: enrollment.studentId }
          };
        } catch (error) {
          return {
            enrollment,
            student: { id: enrollment.studentId, error: 'Failed to fetch student details' }
          };
        }
      })
    );
    
    res.json(enrollmentDetails);
  } catch (error) {
    logger.error('Get class enrollments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update enrollment status (drop class, etc.)
app.put('/enrollments/:id', authenticateToken, async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    // Check if user is the enrolled student, the teacher of the class, or an admin
    const classItem = await Class.findById(enrollment.classId);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    const isStudent = req.user.id === enrollment.studentId;
    const isTeacher = req.user.id === classItem.teacherId;
    const isAdmin = req.user.role === 'admin';
    
    if (!isStudent && !isTeacher && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Students can only drop classes
    if (isStudent && req.body.status !== 'dropped') {
      return res.status(403).json({ message: 'Students can only drop classes' });
    }
    
    // Update enrollment status
    enrollment.status = req.body.status;
    
    // If dropping the class, update the class enrollment count
    if (req.body.status === 'dropped' && enrollment.status === 'active') {
      classItem.enrollmentCount -= 1;
      await classItem.save();
    }
    
    await enrollment.save();
    
    res.json({
      message: 'Enrollment updated successfully',
      enrollment
    });
  } catch (error) {
    logger.error('Update enrollment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Record attendance (teacher of the class or admin only)
app.post('/enrollments/:id/attendance', authenticateToken, async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    // Check if user is the teacher of the class or an admin
    const classItem = await Class.findById(enrollment.classId);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    if (req.user.role !== 'admin' && classItem.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Only the teacher of this class or an admin can record attendance.' });
    }
    
    // Validate attendance data
    if (!req.body.date || !req.body.status) {
      return res.status(400).json({ message: 'Date and status are required' });
    }
    
    if (!['present', 'absent', 'late', 'excused'].includes(req.body.status)) {
      return res.status(400).json({ message: 'Invalid status. Must be one of: present, absent, late, excused' });
    }
    
    // Add attendance record
    enrollment.attendance.push({
      date: new Date(req.body.date),
      status: req.body.status,
      notes: req.body.notes || ''
    });
    
    await enrollment.save();
    
    res.json({
      message: 'Attendance recorded successfully',
      enrollment
    });
  } catch (error) {
    logger.error('Record attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// Start the server
app.listen(PORT, () => {
  logger.info(`Class Service running on port ${PORT}`);
  console.log(`Class Service running on port ${PORT}`);
});

module.exports = app; // For testing
