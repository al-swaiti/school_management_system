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
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3003;

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
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/content-service', {
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

const fileFilter = (req, file, cb) => {
  // Accept images, documents, and videos
  if (file.mimetype.startsWith('image/') || 
      file.mimetype.startsWith('video/') || 
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'application/vnd.ms-powerpoint' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'text/plain') {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Define ContentItem Schema
const contentItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['document', 'video', 'image', 'link', 'assignment'],
    required: true
  },
  content: {
    type: String, // HTML/Markdown for documents, URL for others
    required: function() {
      return this.type === 'document' || this.type === 'link';
    }
  },
  authorId: {
    type: String,
    required: true
  },
  classId: {
    type: String,
    required: true
  },
  tags: [String],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  publishDate: Date,
  dueDate: Date, // For assignments
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    content: String,
    updatedAt: Date,
    updatedBy: String
  }],
  attachments: [{
    name: String,
    fileType: String,
    fileSize: Number,
    url: String
  }],
  metadata: {
    duration: Number, // For videos
    pageCount: Number, // For documents
    dimensions: String // For images
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Define ContentModule Schema
const contentModuleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  classId: {
    type: String,
    required: true
  },
  contentItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContentItem'
  }],
  order: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  createdBy: {
    type: String,
    required: true
  },
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
contentItemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

contentModuleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create models
const ContentItem = mongoose.model('ContentItem', contentItemSchema);
const ContentModule = mongoose.model('ContentModule', contentModuleSchema);

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
const contentItemSchema_joi = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  type: Joi.string().valid('document', 'video', 'image', 'link', 'assignment').required(),
  content: Joi.string().when('type', {
    is: Joi.string().valid('document', 'link'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  classId: Joi.string().required(),
  tags: Joi.array().items(Joi.string()),
  status: Joi.string().valid('draft', 'published', 'archived'),
  publishDate: Joi.date(),
  dueDate: Joi.date(),
  metadata: Joi.object({
    duration: Joi.number(),
    pageCount: Joi.number(),
    dimensions: Joi.string()
  })
});

const contentModuleSchema_joi = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  classId: Joi.string().required(),
  contentItems: Joi.array().items(Joi.string()),
  order: Joi.number().required(),
  status: Joi.string().valid('draft', 'published', 'archived')
});

// Routes
// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Create a new content item (teachers and admins only)
app.post('/content-items', authenticateToken, async (req, res) => {
  try {
    // Check if user is teacher or admin
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only teachers and admins can create content.' });
    }
    
    // Validate request body
    const { error } = contentItemSchema_joi.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    // Create new content item
    const newContentItem = new ContentItem({
      ...req.body,
      authorId: req.user.id
    });
    
    await newContentItem.save();
    
    res.status(201).json({
      message: 'Content item created successfully',
      contentItem: newContentItem
    });
  } catch (error) {
    logger.error('Create content item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload attachment for content item
app.post('/content-items/:id/attachments', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    // Check if user is teacher or admin
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only teachers and admins can upload attachments.' });
    }
    
    const contentItem = await ContentItem.findById(req.params.id);
    if (!contentItem) {
      return res.status(404).json({ message: 'Content item not found' });
    }
    
    // Check if user is the author of this content or an admin
    if (req.user.role !== 'admin' && contentItem.authorId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Only the author of this content or an admin can upload attachments.' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Process image if it's an image file
    if (req.file.mimetype.startsWith('image/')) {
      const resizedFilename = `resized-${req.file.filename}`;
      const resizedPath = path.join(uploadsDir, resizedFilename);
      
      await sharp(req.file.path)
        .resize(1200) // Resize to max width of 1200px
        .toFile(resizedPath);
      
      // Add the resized image as an attachment
      contentItem.attachments.push({
        name: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        url: `/uploads/${resizedFilename}`
      });
    } else {
      // Add the original file as an attachment
      contentItem.attachments.push({
        name: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        url: `/uploads/${req.file.filename}`
      });
    }
    
    await contentItem.save();
    
    res.status(201).json({
      message: 'Attachment uploaded successfully',
      contentItem
    });
  } catch (error) {
    logger.error('Upload attachment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all content items for a class
app.get('/content-items/class/:classId', authenticateToken, async (req, res) => {
  try {
    let query = { classId: req.params.classId };
    
    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Filter by type if provided
    if (req.query.type) {
      query.type = req.query.type;
    }
    
    // Filter by tags if provided
    if (req.query.tags) {
      const tags = req.query.tags.split(',');
      query.tags = { $in: tags };
    }
    
    // Students can only see published content
    if (req.user.role === 'student') {
      query.status = 'published';
      
      // If there's a publishDate, only show content that has been published
      query.publishDate = { $lte: new Date() };
    }
    
    const contentItems = await ContentItem.find(query).sort({ createdAt: -1 });
    res.json(contentItems);
  } catch (error) {
    logger.error('Get content items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get content item by ID
app.get('/content-items/:id', authenticateToken, async (req, res) => {
  try {
    const contentItem = await ContentItem.findById(req.params.id);
    if (!contentItem) {
      return res.status(404).json({ message: 'Content item not found' });
    }
    
    // Students can only see published content
    if (req.user.role === 'student' && 
        (contentItem.status !== 'published' || 
         (contentItem.publishDate && contentItem.publishDate > new Date()))) {
      return res.status(403).json({ message: 'Access denied. This content is not published yet.' });
    }
    
    res.json(contentItem);
  } catch (error) {
    logger.error('Get content item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update content item (author of the content or admin only)
app.put('/content-items/:id', authenticateToken, async (req, res) => {
  try {
    const contentItem = await ContentItem.findById(req.params.id);
    if (!contentItem) {
      return res.status(404).json({ message: 'Content item not found' });
    }
    
    // Check if user is the author of this content or an admin
    if (req.user.role !== 'admin' && contentItem.authorId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Only the author of this content or an admin can update it.' });
    }
    
    // If content is being updated, store the previous version
    if (req.body.content && req.body.content !== contentItem.content) {
      contentItem.previousVersions.push({
        content: contentItem.content,
        updatedAt: contentItem.updatedAt,
        updatedBy: contentItem.authorId
      });
      contentItem.version += 1;
    }
    
    // Update fields
    const updateFields = ['title', 'description', 'type', 'content', 'tags', 'status', 'publishDate', 'dueDate', 'metadata'];
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        contentItem[field] = req.body[field];
      }
    });
    
    await contentItem.save();
    
    res.json({
      message: 'Content item updated successfully',
      contentItem
    });
  } catch (error) {
    logger.error('Update content item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete content item (author of the content or admin only)
app.delete('/content-items/:id', authenticateToken, async (req, res) => {
  try {
    const contentItem = await ContentItem.findById(req.params.id);
    if (!contentItem) {
      return res.status(404).json({ message: 'Content item not found' });
    }
    
    // Check if user is the author of this content or an admin
    if (req.user.role !== 'admin' && contentItem.authorId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Only the author of this content or an admin can delete it.' });
    }
    
    // Delete attachments from filesystem
    for (const attachment of contentItem.attachments) {
      const filePath = path.join(__dirname, attachment.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Remove content item from any modules that reference it
    await ContentModule.updateMany(
      { contentItems: req.params.id },
      { $pull: { contentItems: req.params.id } }
    );
    
    // Delete the content item
    await ContentItem.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Content item deleted successfully' });
  } catch (error) {
    logger.error('Delete content item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new content module (teachers and admins only)
app.post('/content-modules', authenticateToken, async (req, res) => {
  try {
    // Check if user is teacher or admin
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only teachers and admins can create content modules.' });
    }
    
    // Validate request body
    const { error } = contentModuleSchema_joi.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    // Create new content module
    const newContentModule = new ContentModule({
      ...req.body,
      createdBy: req.user.id
    });
    
    await newContentModule.save();
    
    res.status(201).json({
      message: 'Content module created successfully',
      contentModule: newContentModule
    });
  } catch (error) {
    logger.error('Create content module error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all content modules for a class
app.get('/content-modules/class/:classId', authenticateToken, async (req, res) => {
  try {
    let query = { classId: req.params.classId };
    
    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Students can only see published modules
    if (req.user.role === 'student') {
      query.status = 'published';
    }
    
    const contentModules = await ContentModule.find(query)
      .populate('contentItems')
      .sort({ order: 1 });
    
    // If student, filter out unpublished content items
    if (req.user.role === 'student') {
      contentModules.forEach(module => {
        module.contentItems = module.contentItems.filter(item => 
          item.status === 'published' && 
          (!item.publishDate || item.publishDate <= new Date())
        );
      });
    }
    
    res.json(contentModules);
  } catch (error) {
    logger.error('Get content modules error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get content module by ID
app.get('/content-modules/:id', authenticateToken, async (req, res) => {
  try {
    const contentModule = await ContentModule.findById(req.params.id)
      .populate('contentItems');
    
    if (!contentModule) {
      return res.status(404).json({ message: 'Content module not found' });
    }
    
    // Students can only see published modules
    if (req.user.role === 'student' && contentModule.status !== 'published') {
      return res.status(403).json({ message: 'Access denied. This module is not published yet.' });
    }
    
    // If student, filter out unpublished content items
    if (req.user.role === 'student') {
      contentModule.contentItems = contentModule.contentItems.filter(item => 
        item.status === 'published' && 
        (!item.publishDate || item.publishDate <= new Date())
      );
    }
    
    res.json(contentModule);
  } catch (error) {
    logger.error('Get content module error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update content module (creator of the module or admin only)
app.put('/content-modules/:id', authenticateToken, async (req, res) => {
  try {
    const contentModule = await ContentModule.findById(req.params.id);
    if (!contentModule) {
      return res.status(404).json({ message: 'Content module not found' });
    }
    
    // Check if user is the creator of this module or an admin
    if (req.user.role !== 'admin' && contentModule.createdBy !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Only the creator of this module or an admin can update it.' });
    }
    
    // Update fields
    const updateFields = ['title', 'description', 'contentItems', 'order', 'status'];
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        contentModule[field] = req.body[field];
      }
    });
    
    await contentModule.save();
    
    res.json({
      message: 'Content module updated successfully',
      contentModule
    });
  } catch (error) {
    logger.error('Update content module error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete content module (creator of the module or admin only)
app.delete('/content-modules/:id', authenticateToken, async (req, res) => {
  try {
    const contentModule = await ContentModule.findById(req.params.id);
    if (!contentModule) {
      return res.status(404).json({ message: 'Content module not found' });
    }
    
    // Check if user is the creator of this module or an admin
    if (req.user.role !== 'admin' && contentModule.createdBy !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Only the creator of this module or an admin can delete it.' });
    }
    
    // Delete the content module (but not the content items it references)
    await ContentModule.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Content module deleted successfully' });
  } catch (error) {
    logger.error('Delete content module error:', error);
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
  logger.info(`Content Service running on port ${PORT}`);
  console.log(`Content Service running on port ${PORT}`);
});

module.exports = app; // For testing
