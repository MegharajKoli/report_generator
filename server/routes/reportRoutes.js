const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Report = require("../models/Report");

const {
  createReport,
  getReports,
  getReportsByDepartment,
  deleteReport,
  updateReport,
  getAllReports,
  removeImage,
  getMinimalReports,       // ✅ add this
  searchMinimalReports,
  getAnnualReports,
} = require('../controllers/reportController');  // No .default here
console.log("getAnnualReports is:", getAnnualReports);



const multer = require('multer');

// Setup multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, 
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


router.get("/all", authMiddleware, getAllReports);
router.get("/annual", getAnnualReports);

// POST: Remove an image from a report
router.post("/remove-image", authMiddleware, removeImage);

// POST: Remove feedback
router.post('/remove-feedback', async (req, res) => {
  const { reportId, index } = req.body;
  const report = await Report.findById(reportId);
  if (report.feedback[index] && report.feedback[index].analytics) {
    // Delete analytics file from storage
  }
  report.feedback.splice(index, 1);
  await report.save();
  res.send('Feedback removed');
});


router.get('/minimal', authMiddleware, getMinimalReports);

// ✅ Search/filter minimal reports
router.get('/minimal/search', authMiddleware, searchMinimalReports);




router.get('/annual/unique/orgs', async (req, res) => {
  try {
    const { department } = req.query;
    const query = department ? { department } : {};
    const orgs = await Report.distinct('organizedBy', query);
    res.json(orgs.filter(Boolean).sort());
  } catch (error) {
    console.error("Error fetching unique organizations:", error.message);
    res.status(500).json({ error: error.message });
  }
});


console.log("getAnnualReports is:", getAnnualReports);

module.exports = router;
