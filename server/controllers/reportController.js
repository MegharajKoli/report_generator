const Report = require('../models/Report');
const { isValidObjectId } = require('mongoose');

const createReport = async (req, res) => {
  console.log('Received POST /api/reports/create', {
    bodyKeys: Object.keys(req.body),
    files: req.files ? req.files.map(file => ({
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    })) : 'No files',
    userId: req.user?.userId,
  });

  try {
    const {
      department,
      academicYear,
      organizedBy,
      eventName,
      tenure,
      date,
      dateFrom,
      dateTo,
      timeFrom,
      timeTo,
      venue,
      objectives,
      outcomes,
      totalParticipants,
      femaleParticipants,
      maleParticipants,
      eventType,
      summary,
      speakers,
      feedback
    } = req.body;

    console.log('Parsing JSON fields');
    let parsedObjectives = [], parsedOutcomes = [], parsedSpeakers = [], parsedFeedback = [];
    try {
      parsedObjectives = objectives ? JSON.parse(objectives) : [];
      parsedOutcomes = outcomes ? JSON.parse(outcomes) : [];
      parsedSpeakers = speakers ? JSON.parse(speakers) : [];
      parsedFeedback = feedback ? JSON.parse(feedback) : [];
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      throw new Error(`Invalid JSON in form data: ${parseError.message}`);
    }

    console.log('Parsed feedback:', JSON.stringify(parsedFeedback, null, 2));

    const validateImage = async (file) => {
      if (!file) {
        console.warn('No file provided');
        return null;
      }
      const allowedTypes = ['image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.mimetype)) {
        console.error(`Invalid file type for ${file.originalname}: ${file.mimetype}`);
        throw new Error(`Invalid file type for ${file.originalname}. Only JPEG/PNG allowed.`);
      }
      console.log(`Validated file: ${file.originalname}, size: ${file.size} bytes`);
      return { buffer: file.buffer };
    };

    console.log('Processing images');
    let poster = null, attendance = [], photographs = [], permissionImage = null;
    const feedbackAnalytics = {};

    if (req.files) {
      for (const file of req.files) {
        const validated = await validateImage(file);
        if (!validated) continue;
        if (file.fieldname === 'poster') {
          poster = validated;
        } else if (file.fieldname === 'attendance[]' || file.fieldname === 'attendance') {
          attendance.push(validated);
        } else if (file.fieldname === 'photographs[]' || file.fieldname === 'photographs') {
          photographs.push(validated);
        } else if (file.fieldname === 'permissionImage') {
          permissionImage = validated;
        } else if (file.fieldname.startsWith('feedbackAnalytics-')) {
          const index = file.fieldname.split('-')[1];
          feedbackAnalytics[index] = validated;
        }
      }
    }

    console.log('Feedback analytics files:', Object.keys(feedbackAnalytics));

    console.log('Processing feedback analytics');
    const feedbackWithAnalytics = [];
    const seen = new Set();
    for (let index = 0; index < parsedFeedback.length; index++) {
      const item = parsedFeedback[index];
      const key = `${item.question || ''}|${item.answer || ''}`;
      if (seen.has(key)) {
        console.warn(`Duplicate feedback detected at index ${index}:`, { question: item.question, answer: item.answer });
        continue;
      }
      seen.add(key);
      console.log(`Feedback ${index}:`, { question: item.question, answer: item.answer, hasAnalytics: !!feedbackAnalytics[index] });
      feedbackWithAnalytics.push({
        question: item.question || '',
        answer: item.answer || '',
        analytics: feedbackAnalytics[index]?.buffer || null
      });
    }

    console.log('Feedback with analytics:', JSON.stringify(feedbackWithAnalytics, null, 2));

    console.log('Creating new report', {
      hasPoster: !!poster,
      attendanceCount: attendance.length,
      photographsCount: photographs.length,
      hasPermissionImage: !!permissionImage,
      feedbackAnalyticsCount: Object.keys(feedbackAnalytics).length,
      feedback: feedbackWithAnalytics
    });

    const newReport = new Report({
      department,
      academicYear,
      organizedBy,
      eventName,
      tenure,
      date: tenure === '1 Day' ? date : null,
      dateFrom: tenure === 'Multiple Days' ? dateFrom : null,
      dateTo: tenure === 'Multiple Days' ? dateTo : null,
      timeFrom,
      timeTo,
      venue,
      poster: poster?.buffer,
      objectives: parsedObjectives,
      outcomes: parsedOutcomes,
      totalParticipants,
      femaleParticipants,
      maleParticipants,
      eventType,
      summary,
      attendance: attendance.map(item => item.buffer),
      permissionImage: permissionImage?.buffer,
      speakers: parsedSpeakers,
      feedback: feedbackWithAnalytics,
      photographs: photographs.map(item => item.buffer),
      createdBy: req.user?.userId || 'unknown',
      createdAt: new Date()
    });

    console.log('Saving report to MongoDB');
    await newReport.save();
    console.log('Report saved, ID:', newReport._id);

    res.status(201).json({ message: 'Report created successfully', reportId: newReport._id });
  } catch (error) {
    console.error('Error creating report:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(400).json({ error: error.message });
  }
};

const getReports = async (req, res) => {
  console.log('Received GET /api/reports', { reportId: req.query.reportId });
  try {
    const { reportId } = req.query;

    if (!reportId || !isValidObjectId(reportId)) {
      console.error('Invalid report ID:', reportId);
      return res.status(400).json({ message: 'Invalid or missing report ID' });
    }

    // Office role: can view ANY report; department: only reports they created
    let query = { _id: reportId };
    if (req.user?.role !== 'office') {
      query.createdBy = req.user.userId;
    }

    console.log('Querying report, userId:', req.user?.userId, 'role:', req.user?.role);
    const report = await Report.findOne(query)
      .populate('department', 'name') // populate only the "name" field from Department model
      .select('-__v');

    if (!report) {
      console.error('Report not found or unauthorized:', { reportId, userId: req.user?.userId });
      return res.status(404).json({ message: 'Report not found or unauthorized' });
    }

    const bufferToBase64 = (buffer, fieldName) => {
      if (!buffer) {
        console.warn(`No buffer for ${fieldName}:`, buffer);
        return null;
      }
      if (!(buffer instanceof Buffer)) {
        console.warn(`Invalid buffer type for ${fieldName}:`, typeof buffer, buffer);
        return null;
      }
      try {
        const base64 = buffer.toString('base64');
        // Heuristic MIME type detection
        const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8;
        const mimeType = isJpeg ? 'image/jpeg' : 'image/png';
        console.log(`Converted buffer to base64 for ${fieldName}, MIME: ${mimeType}, length: ${base64.length}, startsWith: ${base64.substring(0, 20)}`);
        return `data:${mimeType};base64,${base64}`;
      } catch (err) {
        console.error(`Error converting buffer to base64 for ${fieldName}:`, err.message);
        return null;
      }
    };

    console.log('Raw feedback from MongoDB:', JSON.stringify(report.feedback, null, 2));
    const reportData = {
      ...report.toObject(), // Convert Mongoose document to plain object
      poster: bufferToBase64(report.poster, 'poster'),
      attendance: report.attendance.map((img, i) => bufferToBase64(img, `attendance[${i}]`)),
      permissionImage: bufferToBase64(report.permissionImage, 'permissionImage'),
      feedback: report.feedback.map((fb, i) => ({
        question: String(fb.question || ''),
        answer: String(fb.answer || ''),
        analytics: bufferToBase64(fb.analytics, `feedback[${i}].analytics`)
      })),
      photographs: report.photographs.map((img, i) => bufferToBase64(img, `photographs[${i}]`))
    };

    console.log('Sending report data:', {
      reportId,
      poster: !!reportData.poster,
      attendanceCount: reportData.attendance.length,
      photographsCount: reportData.photographs.length,
      permissionImage: !!reportData.permissionImage,
      feedbackCount: reportData.feedback.length,
      feedbackDetails: reportData.feedback.map(fb => ({
        question: fb.question,
        answer: fb.answer,
        hasAnalytics: !!fb.analytics
      }))
    });

    res.status(200).json(reportData);
  } catch (error) {
    console.error('Error fetching report:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Server error' });
  }
};

const getReportsByDepartment = async (req, res) => {
  try {
    const department = req.user?.department;
    console.log("User department:", department);
    if (!department) {
      console.error("User department not found in request");
      return res.status(400).json({ message: "User department not found" });
    }

    const reports = await Report.find({ department })
      .select("eventName academicYear organizedBy createdAt") // only necessary fields
      .sort({ createdAt: -1 });

    console.log("Found reports:", reports.length);

    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching department reports:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteReport = async (req, res) => {
  try {
    const reportId = req.params.id;

    if (!isValidObjectId(reportId)) {
      return res.status(400).json({ message: "Invalid report ID" });
    }

    let query = { _id: reportId };
    if (req.user.role !== 'office') {
      query.createdBy = req.user.userId;
    }
    const deletedReport = await Report.findOneAndDelete(query);

    if (!deletedReport) {
      return res.status(404).json({ message: "Report not found or unauthorized" });
    }

    res.status(200).json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Error deleting report:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllReports = async (req, res) => {
  try {
    // Security check: Only allow office accounts
    if (req.user.role !== 'office') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Fetch all reports, with department name and key fields for listing
    const reports = await Report.find({})
      .select("eventName academicYear organizedBy department createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching all reports:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const updateReport = async (req, res) => {
  const reportId = req.params.id;

  try {
    const existingReport = await Report.findOne({
      _id: reportId,
      createdBy: req.user.userId,
    });

    if (!existingReport) {
      return res.status(404).json({ message: "Report not found or unauthorized" });
    }

    const {
      academicYear,
      organizedBy,
      eventName,
      tenure,
      date,
      timeFrom,
      timeTo,
      venue,
      objectives,
      outcomes,
      totalParticipants,
      femaleParticipants,
      maleParticipants,
      eventType,
      summary,
      speakers,
      feedback,
     posterBase64,
      permissionImageBase64,
      attendanceBase64,
      photographsBase64,...otherFields  // array of base64 strings for photographs to keep
    } = req.body;

    // Update simple fields
    existingReport.academicYear = academicYear;
    existingReport.organizedBy = organizedBy;
    existingReport.eventName = eventName;
    existingReport.tenure = tenure;
    existingReport.date = date;
    existingReport.timeFrom = timeFrom;
    existingReport.timeTo = timeTo;
    existingReport.venue = venue;
    existingReport.totalParticipants = totalParticipants;
    existingReport.femaleParticipants = femaleParticipants;
    existingReport.maleParticipants = maleParticipants;
    existingReport.eventType = eventType;
    existingReport.summary = summary;

    // Parse JSON fields safely
    existingReport.objectives = JSON.parse(objectives || "[]");
    existingReport.outcomes = JSON.parse(outcomes || "[]");
    existingReport.speakers = speakers ? JSON.parse(speakers) : [];
    existingReport.feedback = feedback ? JSON.parse(feedback) : [];

   
if (posterBase64) {
      existingReport.poster = Buffer.from(posterBase64.split(",")[1], "base64");
    }

    // Update permission image
    if (permissionImageBase64) {
      existingReport.permissionImage = Buffer.from(permissionImageBase64.split(",")[1], "base64");
    }

    // ===== Modified Attendance Logic =====
    if (Array.isArray(attendanceBase64)) {
      const existingAttendanceBase64 = existingReport.attendance.map(buf =>
        `data:image/png;base64,${buf.toString("base64")}`
      );

      // Keep only the files still in attendanceBase64
      existingReport.attendance = existingAttendanceBase64
        .filter(b64 => attendanceBase64.includes(b64))
        .map(b64 => Buffer.from(b64.split(",")[1], "base64"));
    }

    // ===== Modified Photographs Logic =====
    if (Array.isArray(photographsBase64)) {
      const existingPhotographsBase64 = existingReport.photographs.map(buf =>
        `data:image/png;base64,${buf.toString("base64")}`
      );

      // Keep only the files still in photographsBase64
      existingReport.photographs = existingPhotographsBase64
        .filter(b64 => photographsBase64.includes(b64))
        .map(b64 => Buffer.from(b64.split(",")[1], "base64"));
    }

    // ===== Append new uploaded files =====
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const { fieldname, buffer } = file;

        if (fieldname === "attendance" || fieldname === "attendance[]") {
          existingReport.attendance.push(buffer);
        } else if (fieldname === "photographs" || fieldname === "photographs[]") {
          existingReport.photographs.push(buffer);
        } else if (fieldname.startsWith("feedbackAnalytics-")) {
          const idx = parseInt(fieldname.split("-")[1], 10);
          if (!isNaN(idx) && existingReport.feedback[idx]) {
            existingReport.feedback[idx].analytics = buffer;
          }
        }
      }
    }
    if (posterBase64) {
  existingReport.poster = Buffer.from(posterBase64.split(",")[1], "base64");
} else if (req.files && req.files.length > 0) {
  const posterFile = req.files.find(f => f.fieldname === "poster");
  if (posterFile) {
    existingReport.poster = posterFile.buffer;
  }
}

// Handle Permission Image
if (permissionImageBase64) {
  existingReport.permissionImage = Buffer.from(permissionImageBase64.split(",")[1], "base64");
} else if (req.files && req.files.length > 0) {
  const permissionFile = req.files.find(f => f.fieldname === "permissionImage");
  if (permissionFile) {
    existingReport.permissionImage = permissionFile.buffer;
  }
}

    // ===== Keep your rest logic unchanged =====
    Object.keys(otherFields).forEach(key => {
      existingReport[key] = otherFields[key];
    });

    await existingReport.save();
    res.json({ message: "Report updated successfully", report: existingReport });

  } catch (error) {
    console.error("Error updating report:", error);
    res.status(500).json({ error: "Failed to update report" });
  }
};

const removeImage = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { field, imageUrl, index } = req.body; 
    // field can be: "poster", "permissionImage", "attendance", "photographs"
     console.log("🛠 Remove image request:", { reportId, field, imageUrl, index }); // 🔹

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
     console.log("Before delete:", report[field]);

    if (["poster", "permissionImage"].includes(field)) {
      // Single image field (string)
      report[field] = null;
    } 
    else if (["attendance", "photographs"].includes(field)) {
  const { index } = req.body; // expect index from frontend
  if (index === undefined) {
    return res.status(400).json({ error: "Index is required for multi-image fields" });
  }
  if (index < 0 || index >= report[field].length) {
    return res.status(400).json({ error: "Invalid index" });
  }
  report[field].splice(index, 1); // remove by index
}

    else {
      return res.status(400).json({ message: "Invalid field name" });
    }
     console.log("After delete:", report[field]);

    // Optional: delete file from local storage (only for disk storage)
    if (imageUrl && typeof imageUrl === "string" && 
        !imageUrl.startsWith("data:") && !imageUrl.includes("http")) {
      const filePath = path.join(__dirname, "../uploads", path.basename(imageUrl));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await report.save();
    const updated = await Report.findById(reportId);
    console.log(`Updated ${field} length:`, updated[field]?.length);


    res.status(200).json({ message: "Image removed successfully", report });
  } catch (err) {
    console.error("Error removing image:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMinimalReports = async (req, res) => {
  try {
    const reports = await Report.find({}, "eventName department eventDate")
                                .sort({ eventDate: -1 }); // Latest first
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reports", error: err.message });
  }
};
// ✅ Search/filter minimal reports
// 🔎 Search reports (by eventName, department, academicYear)
const searchMinimalReports = async (req, res) => {
  try {
    const { search, year } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { eventName: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } }
      ];
    }

    if (year) {
      query.academicYear = year;
    }

    const reports = await Report.find(query, "eventName department date academicYear organizedBy")
      .sort({ date: -1 });

    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: "Failed to search reports", error: err.message });
  }
};

// 📜 Annual Reports
const getAnnualReports = async (req, res) => {
  try {
    const reports = await Report.find({}, "eventName department date academicYear organizedBy")
      .sort({ date: -1 });

    res.status(200).json(reports);
  } catch (err) {
    console.error("Error fetching annual reports:", err);
    res.status(500).json({ message: "Failed to fetch annual reports" });
  }
};

// 📋 Minimal Reports (for frontend table)
const getMinimalReports = async (req, res) => {
  try {
    const reports = await Report.find({}, "eventName department date academicYear organizedBy")
      .sort({ date: -1 });

    res.status(200).json(reports);
  } catch (error) {
    console.error("Error in getMinimalReports:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};




module.exports = {
  createReport,
  getReports,
  getReportsByDepartment,
  deleteReport,
  updateReport,
  getAllReports,
  removeImage,
  getMinimalReports,
  searchMinimalReports,
  getAnnualReports,
};
