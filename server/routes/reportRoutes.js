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


router.get("/annual", async (req, res) => {
  try {
    const { academicYear, organizedBy } = req.query;
    const query = {};
    if (academicYear) query.academicYear = academicYear;
    if (organizedBy) query.organizedBy = organizedBy;

    const reports = await Report.find(query).sort({ academicYear: -1, eventName: 1 });

    // Convert Buffers to base64
    const reportsWithBase64 = reports.map(r => ({
      reportId: r._id,
      eventName: r.eventName,
      academicYear: r.academicYear,
      organizedBy: r.organizedBy,

      poster: r.poster
        ? `data:image/jpeg;base64,${r.poster.toString("base64")}`
        : null,

      photographs: r.photographs?.map(
        buf => `data:image/png;base64,${buf.toString("base64")}`
      ) || [],

      permissionImage: r.permissionImage
        ? `data:image/jpeg;base64,${r.permissionImage.toString("base64")}`
        : null,

      feedback: r.feedback?.map(fb => ({
        question: fb.question,
        answer: fb.answer,
        analytics: fb.analytics
          ? `data:image/png;base64,${fb.analytics.toString("base64")}`
          : null
      })) || []
    }));

    res.json(reportsWithBase64);  // ✅ send converted data
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



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



router.get('/minimal', authMiddleware, getMinimalReports);

// ✅ Search/filter minimal reports
router.get('/minimal/search', authMiddleware, searchMinimalReports);



console.log("getAnnualReports is:", getAnnualReports);

module.exports = router;
