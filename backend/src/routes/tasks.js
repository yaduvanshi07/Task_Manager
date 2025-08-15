const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const { pool } = require('../models/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 3 // Maximum 3 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Enhanced validation rules with better error messages
const taskValidation = [
  body('title')
    .notEmpty().withMessage('Title is required')
    .trim()
    .isLength({ min: 1, max: 255 }).withMessage('Title must be between 1-255 characters'),
  body('description').optional().trim(),
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed']).withMessage('Invalid status value'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('Invalid priority value'),
  body('due_date')
    .optional()
    .isISO8601().withMessage('Invalid date format (YYYY-MM-DD)')
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error('Due date cannot be in the past');
      }
      return true;
    }),
  body('assigned_to').optional().isInt().withMessage('Invalid user ID')
];

// Create task with enhanced error handling
router.post('/', 
  authenticateToken,
  upload.array('documents', 3),
  taskValidation,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Clean up any uploaded files if validation fails
        if (req.files && req.files.length > 0) {
          req.files.forEach(file => {
            try {
              fs.unlinkSync(file.path);
            } catch (err) {
              console.error('Error cleaning up file:', err);
            }
          });
        }

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().reduce((acc, err) => {
            acc[err.param] = err.msg;
            return acc;
          }, {})
        });
      }

      // Format and prepare data
      const {
        title,
        description,
        status = 'pending',
        priority = 'medium',
        due_date,
        assigned_to
      } = req.body;

      // Verify assigned user exists if provided
      if (assigned_to) {
        const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [assigned_to]);
        if (userCheck.rows.length === 0) {
          return res.status(400).json({ 
            success: false,
            message: 'Assigned user not found' 
          });
        }
      }

      // Start transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Insert task
        const taskResult = await client.query(`
          INSERT INTO tasks (title, description, status, priority, due_date, assigned_to, created_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [title, description, status, priority, due_date, assigned_to, req.user.id]);

        const task = taskResult.rows[0];

        // Process documents if any
        let documents = [];
        if (req.files && req.files.length > 0) {
          for (const file of req.files) {
            const docResult = await client.query(`
              INSERT INTO task_documents (task_id, filename, original_name, file_path)
              VALUES ($1, $2, $3, $4)
              RETURNING *
            `, [task.id, file.filename, file.originalname, file.path]);
            documents.push(docResult.rows[0]);
          }
        }

        await client.query('COMMIT');

        res.status(201).json({
          success: true,
          message: 'Task created successfully',
          task: {
            ...task,
            documents
          }
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      // Clean up any uploaded files on error
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (err) {
            console.error('Error cleaning up file:', err);
          }
        });
      }

      console.error('Task creation error:', error);
      
      // Handle specific error types
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({
          success: false,
          message: 'Task with similar attributes already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create task',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// [Keep all your other existing routes: GET, PUT, DELETE, etc.]
// They can remain mostly the same, just ensure they use the same error handling pattern

module.exports = router;