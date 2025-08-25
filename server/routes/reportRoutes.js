const express = require('express');
const router = express.Router();
const {
  createReport,
  getReports,             // For viewing 1 report by ID (?reportId=...)
  getReportsByDepartment ,
  deleteReport,
  updateReport,
  getAllReports
} = require('../controllers/reportController');

const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');

// Setup multer
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

// ========== ROUTES ==========

// ✅ Create a new report with file uploads
router.post('/create', authMiddleware, upload.any(), (req, res, next) => {
  console.log('Multer processed files:', req.files?.map(file => ({
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  })) || 'No files');
  next();
}, createReport);

// ✅ Get a specific report by ID (detailed view)
router.get('/', authMiddleware, getReports);

// ✅ NEW: Get all reports for logged-in user's department
router.get('/department', authMiddleware, getReportsByDepartment);
//Delete Report
router.delete("/:id", authMiddleware, deleteReport);

//Update Report
// PUT: Update a report by ID
router.put("/:id", authMiddleware, upload.any(), updateReport);

router.get('/all', authMiddleware, getAllReports);



module.exports = router;
