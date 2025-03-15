require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const winston = require('winston');
const Joi = require('joi');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
const PORT = process.env.PORT || 3004;

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
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/communication-service', {
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

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Define Message Schema
const messageSchema = new mongoose.Schema({
  senderId: {
    type: String,
    required: true
  },
  recipientId: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  attachments: [{
    name: String,
    fileType: String,
    fileSize: Number,
    url: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Define Announcement Schema
const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  authorId: {
    type: String,
    required: true
  },
  targetAudience: {
    type: {
      type: String,
      enum: ['all', 'class', 'role'],
      required: true
    },
    classId: String,
    role: {
      type: String,
      enum: ['admin', 'teacher', 'student']
    }
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date,
  attachments: [{
    name: String,
    fileType: String,
    fileSize: Number,
    url: String
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

// Define Notification Schema
const notificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'error', 'success'],
    default: 'info'
  },
  relatedTo: {
    type: {
      type: String,
      enum: ['message', 'announcement', 'content', 'class'],
      required: true
    },
    id: {
      type: String,
      required: true
    }
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to update the updatedAt field
announcementSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create models
const Message = mongoose.model('Message', messageSchema);
const Announcement = mongoose.model('Announcement', announcementSchema);
const Notification = mongoose.model('Notification', notificationSchema);

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(morgan('combined')); // HTTP request logging
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve static files

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
const messageSchema_joi = Joi.object({
  recipientId: Joi.string().required(),
  subject: Joi.string().required(),
  content: Joi.string().required()
});

const announcementSchema_joi = Joi.object({
  title: Joi.string().required(),
  content: Joi.string().required(),
  targetAudience: Joi.object({
    type: Joi.string().valid('all', 'class', 'role').required(),
    classId: Joi.string().when('type', {
      is: 'class',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    role: Joi.string().valid('admin', 'teacher', 'student').when('type', {
      is: 'role',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  }).required(),
  priority: Joi.string().valid('low', 'medium', 'high'),
  startDate: Joi.date(),
  endDate: Joi.date()
});

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);
  
  // Authenticate socket connection
  socket.on('authenticate', (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      socket.userId = decoded.id;
      socket.role = decoded.role;
      
      // Join user-specific room
      socket.join(`user:${decoded.id}`);
      
      // Join role-specific room
      socket.join(`role:${decoded.role}`);
      
      logger.info(`User authenticated: ${decoded.id}, role: ${decoded.role}`);
      socket.emit('authenticated', { success: true });
    } catch (error) {
      logger.error('Socket authentication error:', error);
      socket.emit('authenticated', { success: false, message: 'Authentication failed' });
    }
  });
  
  // Handle private messages
  socket.on('private-message', async (data) => {
    try {
      if (!socket.userId) {
        return socket.emit('error', { message: 'Not authenticated' });
      }
      
      const { recipientId, subject, content } = data;
      
      // Create new message
      const newMessage = new Message({
        senderId: socket.userId,
        recipientId,
        subject,
        content
      });
      
      await newMessage.save();
      
      // Create notification for recipient
      const notification = new Notification({
        userId: recipientId,
        title: 'New Message',
        message: `You have a new message from ${socket.userId}: ${subject}`,
        type: 'info',
        relatedTo: {
          type: 'message',
          id: newMessage._id
        }
      });
      
      await notification.save();
      
      // Send message to recipient if online
      io.to(`user:${recipientId}`).emit('new-message', {
        message: newMessage,
        notification
      });
      
      socket.emit('message-sent', { success: true, messageId: newMessage._id });
    } catch (error) {
      logger.error('Private message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

// Routes
// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Send a message
app.post('/messages', authenticateToken, async (req, res) => {
  try {
    // Validate request body
    const { error } = messageSchema_joi.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    const { recipientId, subject, content } = req.body;
    
    // Create new message
    const newMessage = new Message({
      senderId: req.user.id,
      recipientId,
      subject,
      content
    });
    
    await newMessage.save();
    
    // Create notification for recipient
    const notification = new Notification({
      userId: recipientId,
      title: 'New Message',
      message: `You have a new message from ${req.user.id}: ${subject}`,
      type: 'info',
      relatedTo: {
        type: 'message',
        id: newMessage._id
      }
    });
    
    await notification.save();
    
    // Notify recipient via socket if online
    io.to(`user:${recipientId}`).emit('new-message', {
      message: newMessage,
      notification
    });
    
    res.status(201).json({
      message: 'Message sent successfully',
      messageId: newMessage._id
    });
  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload attachment for message
app.post('/messages/:id/attachments', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Check if user is the sender of this message
    if (message.senderId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Only the sender can add attachments.' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Add the file as an attachment
    message.attachments.push({
      name: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      url: `/uploads/${req.file.filename}`
    });
    
    await message.save();
    
    res.status(201).json({
      message: 'Attachment uploaded successfully',
      messageId: message._id
    });
  } catch (error) {
    logger.error('Upload attachment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for current user (inbox)
app.get('/messages/inbox', authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find({ recipientId: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json(messages);
  } catch (error) {
    logger.error('Get inbox error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages sent by current user (outbox)
app.get('/messages/outbox', authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find({ senderId: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json(messages);
  } catch (error) {
    logger.error('Get outbox error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get message by ID
app.get('/messages/:id', authenticateToken, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Check if user is the sender or recipient
    if (message.senderId !== req.user.id && message.recipientId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Mark as read if recipient is viewing
    if (message.recipientId === req.user.id && !message.read) {
      message.read = true;
      message.readAt = new Date();
      await message.save();
    }
    
    res.json(message);
  } catch (error) {
    logger.error('Get message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete message
app.delete('/messages/:id', authenticateToken, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Check if user is the sender or recipient
    if (message.senderId !== req.user.id && message.recipientId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Delete attachments from filesystem
    for (const attachment of message.attachments) {
      const filePath = path.join(__dirname, attachment.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await Message.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    logger.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create announcement (teachers and admins only)
app.post('/announcements', authenticateToken, async (req, res) => {
  try {
    // Check if user is teacher or admin
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only teachers and admins can create announcements.' });
    }
    
    // Validate request body
    const { error } = announcementSchema_joi.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    // Create new announcement
    const newAnnouncement = new Announcement({
      ...req.body,
      authorId: req.user.id
    });
    
    await newAnnouncement.save();
    
    // Notify users based on target audience
    if (newAnnouncement.targetAudience.type === 'all') {
      // Notify all users via socket
      io.emit('new-announcement', { announcement: newAnnouncement });
    } else if (newAnnouncement.targetAudience.type === 'role') {
      // Notify users with specific role
      io.to(`role:${newAnnouncement.targetAudience.role}`).emit('new-announcement', { announcement: newAnnouncement });
    } else if (newAnnouncement.targetAudience.type === 'class') {
      // In a real implementation, we would query the class service to get all students
      // and then notify them individually
      // For now, we'll just emit to all users
      io.emit('new-announcement', { announcement: newAnnouncement });
    }
    
    res.status(201).json({
      message: 'Announcement created successfully',
      announcement: newAnnouncement
    });
  } catch (error) {
    logger.error('Create announcement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload attachment for announcement
app.post('/announcements/:id/attachments', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    // Check if user is teacher or admin
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only teachers and admins can add attachments.' });
    }
    
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    // Check if user is the author of this announcement or an admin
    if (req.user.role !== 'admin' && announcement.authorId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Only the author or an admin can add attachments.' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Add the file as an attachment
    announcement.attachments.push({
      name: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      url: `/uploads/${req.file.filename}`
    });
    
    await announcement.save();
    
    res.status(201).json({
      message: 'Attachment uploaded successfully',
      announcement
    });
  } catch (error) {
    logger.error('Upload attachment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all announcements for current user
app.get('/announcements', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    let query = {
      startDate: { $lte: now },
      $or: [
        { endDate: { $exists: false } },
        { endDate: { $gte: now } }
      ]
    };
    
    // Filter based on user role and target audience
    query.$or = [
      { 'targetAudience.type': 'all' },
      { 'targetAudience.type': 'role', 'targetAudience.role': req.user.role }
    ];
    
    // If user is in classes, add class-specific announcements
    // In a real implementation, we would query the class service to get user's classes
    // For now, we'll just include all class announcements
    if (req.user.role === 'student' || req.user.role === 'teacher') {
      query.$or.push({ 'targetAudience.type': 'class' });
    }
    
    const announcements = await Announcement.find(query)
      .sort({ priority: -1, createdAt: -1 });
    
    res.json(announcements);
  } catch (error) {
    logger.error('Get announcements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get announcement by ID
app.get('/announcements/:id', authenticateToken, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    // Check if user has access to this announcement
    const now = new Date();
    const isActive = announcement.startDate <= now && 
                    (!announcement.endDate || announcement.endDate >= now);
    
    if (!isActive && req.user.role !== 'admin' && announcement.authorId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. This announcement is not active.' });
    }
    
    const hasAccess = announcement.targetAudience.type === 'all' || 
                     (announcement.targetAudience.type === 'role' && announcement.targetAudience.role === req.user.role) ||
                     (announcement.targetAudience.type === 'class' && (req.user.role === 'student' || req.user.role === 'teacher'));
    
    if (!hasAccess && req.user.role !== 'admin' && announcement.authorId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. This announcement is not for your audience.' });
    }
    
    res.json(announcement);
  } catch (error) {
    logger.error('Get announcement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update announcement (author or admin only)
app.put('/announcements/:id', authenticateToken, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    // Check if user is the author of this announcement or an admin
    if (req.user.role !== 'admin' && announcement.authorId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Only the author or an admin can update this announcement.' });
    }
    
    // Update fields
    const updateFields = ['title', 'content', 'targetAudience', 'priority', 'startDate', 'endDate'];
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        announcement[field] = req.body[field];
      }
    });
    
    await announcement.save();
    
    // Notify users about the update
    if (announcement.targetAudience.type === 'all') {
      io.emit('announcement-updated', { announcement });
    } else if (announcement.targetAudience.type === 'role') {
      io.to(`role:${announcement.targetAudience.role}`).emit('announcement-updated', { announcement });
    } else if (announcement.targetAudience.type === 'class') {
      io.emit('announcement-updated', { announcement });
    }
    
    res.json({
      message: 'Announcement updated successfully',
      announcement
    });
  } catch (error) {
    logger.error('Update announcement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete announcement (author or admin only)
app.delete('/announcements/:id', authenticateToken, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    // Check if user is the author of this announcement or an admin
    if (req.user.role !== 'admin' && announcement.authorId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Only the author or an admin can delete this announcement.' });
    }
    
    // Delete attachments from filesystem
    for (const attachment of announcement.attachments) {
      const filePath = path.join(__dirname, attachment.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await Announcement.findByIdAndDelete(req.params.id);
    
    // Notify users about the deletion
    if (announcement.targetAudience.type === 'all') {
      io.emit('announcement-deleted', { announcementId: req.params.id });
    } else if (announcement.targetAudience.type === 'role') {
      io.to(`role:${announcement.targetAudience.role}`).emit('announcement-deleted', { announcementId: req.params.id });
    } else if (announcement.targetAudience.type === 'class') {
      io.emit('announcement-deleted', { announcementId: req.params.id });
    }
    
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    logger.error('Delete announcement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get notifications for current user
app.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json(notifications);
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read
app.put('/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check if notification belongs to current user
    if (notification.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    notification.read = true;
    notification.readAt = new Date();
    await notification.save();
    
    res.json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    logger.error('Mark notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all notifications as read
app.put('/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true, readAt: new Date() }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    logger.error('Mark all notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete notification
app.delete('/notifications/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check if notification belongs to current user
    if (notification.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await Notification.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    logger.error('Delete notification error:', error);
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
server.listen(PORT, () => {
  logger.info(`Communication Service running on port ${PORT}`);
  console.log(`Communication Service running on port ${PORT}`);
});

module.exports = { app, server }; // For testing
