const express = require('express');
const router = express.Router();
const { createReport, getReports } = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type for ${file.originalname}. Only JPEG/PNG allowed.`), false);
    }
  }
});

// Temporary: Use upload.any() to debug field names
router.post('/create', authMiddleware, upload.any(), (req, res, next) => {
  console.log('Multer processed files:', req.files ? req.files.map(file => ({
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  })) : 'No files');
  next();
}, createReport);

// Revert to this once field names are confirmed
/*
router.post(
  '/create',
  authMiddleware,
  upload.fields([
    { name: 'poster', maxCount: 1 },
    { name: 'attendance[]', maxCount: 10 },
    { name: 'photographs[]', maxCount: 10 },
    { name: 'permissionImage', maxCount: 1 },
    { name: 'feedbackAnalytics-0', maxCount: 1 },
    { name: 'feedbackAnalytics-1', maxCount: 1 },
    { name: 'feedbackAnalytics-2', maxCount: 1 },
    { name: 'feedbackAnalytics-3', maxCount: 1 },
    { name: 'feedbackAnalytics-4', maxCount: 1 },
  ]),
  createReport
);
*/

router.get('/', authMiddleware, getReports);

module.exports = router;