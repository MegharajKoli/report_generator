const Report = require('../models/Report');
const mongoose = require('mongoose');

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
    let parsedObjectives, parsedOutcomes, parsedSpeakers, parsedFeedback;
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

    if (!reportId || !mongoose.isValidObjectId(reportId)) {
      console.error('Invalid report ID:', reportId);
      return res.status(400).json({ message: 'Invalid or missing report ID' });
    }

    console.log('Querying report, userId:', req.user?.userId);
    const report = await Report.findOne({ _id: reportId, createdBy: req.user.userId }).select('-__v');
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
    const department = req.user.department;
     console.log("User department:", department); 

    const reports = await Report.find({ department })
    

      .select("eventName academicYear organizedBy createdAt") // only necessary fields
      .sort({ createdAt: -1 });
       console.log("Found reports:", reports.length);

    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching department reports:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
// DELETE /api/reports/:id
const deleteReport = async (req, res) => {
  try {
    const reportId = req.params.id;

    if (!mongoose.isValidObjectId(reportId)) {
      return res.status(400).json({ message: "Invalid report ID" });
    }

    const deletedReport = await Report.findOneAndDelete({
      _id: reportId,
      createdBy: req.user.userId, // Optional: enforce only creator can delete
    });

    if (!deletedReport) {
      return res.status(404).json({ message: "Report not found or unauthorized" });
    }

    res.status(200).json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Error deleting report:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};


//Update reports
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
    } = req.body;

    // Parse JSON arrays safely
    existingReport.academicYear = academicYear;
    existingReport.organizedBy = organizedBy;
    existingReport.eventName = eventName;
    existingReport.tenure = tenure;
    existingReport.date = date;
    existingReport.timeFrom = timeFrom;
    existingReport.timeTo = timeTo;
    existingReport.venue = venue;
    existingReport.objectives = JSON.parse(objectives || "[]");
    existingReport.outcomes = JSON.parse(outcomes || "[]");
    existingReport.totalParticipants = totalParticipants;
    existingReport.femaleParticipants = femaleParticipants;
    existingReport.maleParticipants = maleParticipants;
    existingReport.eventType = eventType;
    existingReport.summary = summary;
    existingReport.speakers = speakers ? JSON.parse(speakers) : [];
    existingReport.feedback = feedback ? JSON.parse(feedback) : [];

    // Handle optional file updates
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const { fieldname, buffer } = file;
        if (fieldname === "poster") {
          existingReport.poster = buffer;
        } else if (fieldname === "permissionImage") {
          existingReport.permissionImage = buffer;
        } else if (fieldname === "attendance" || fieldname === "attendance[]") {
          existingReport.attendance.push(buffer); // append new
        } else if (fieldname === "photographs" || fieldname === "photographs[]") {
          existingReport.photographs.push(buffer); // append new
        }
        // OPTIONAL: feedback analytics files (feedbackAnalytics-0, feedbackAnalytics-1, etc.)
        else if (fieldname.startsWith('feedbackAnalytics-')) {
          const idx = parseInt(fieldname.split('-')[1], 10);
          if (!isNaN(idx) && existingReport.feedback[idx]) {
            existingReport.feedback[idx].analytics = buffer;
          }
        }
      }
    }

    await existingReport.save();
    res.status(200).json({ message: "Report updated successfully" });
  } catch (error) {
    console.error("Error updating report:", error.message);
    res.status(500).json({ message: "Server error while updating report" });
  
}};




module.exports = { createReport, getReports,getReportsByDepartment,deleteReport ,updateReport};