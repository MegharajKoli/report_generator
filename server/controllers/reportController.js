const mongoose = require('mongoose');
const Report = require('../models/Report');

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
      sdgs,
      studentCoordinators,
      facultyCoordinators,
      totalParticipants,
      femaleParticipants,
      maleParticipants,
      eventType,
      customEventType,
      summary,
      speakers,
      feedback
    } = req.body;

    // Validate required fields
    if (!eventName || !venue || !organizedBy || !totalParticipants || !timeFrom || !timeTo || !sdgs) {
      throw new Error('Missing required fields: Event Name, Venue, Organized By, Total Participants, Time From, Time To, Sustainable Development Goals');
    }
    if (tenure === '1 Day' && !date) {
      throw new Error('Date is required for single-day events');
    }
    if (tenure === 'Multiple Days' && (!dateFrom || !dateTo)) {
      throw new Error('Date From and Date To are required for multiple-day events');
    }

    console.log('Parsing JSON fields');
    let parsedObjectives, parsedOutcomes, parsedSdgs, parsedStudentCoordinators, parsedFacultyCoordinators, parsedSpeakers, parsedFeedback;
    try {
      parsedObjectives = objectives ? JSON.parse(objectives) : [];
      parsedOutcomes = outcomes ? JSON.parse(outcomes) : [];
      parsedSdgs = sdgs ? JSON.parse(sdgs) : [];
      parsedStudentCoordinators = studentCoordinators ? JSON.parse(studentCoordinators) : [];
      parsedFacultyCoordinators = facultyCoordinators ? JSON.parse(facultyCoordinators) : [];
      parsedSpeakers = speakers ? JSON.parse(speakers) : [];
      parsedFeedback = feedback ? JSON.parse(feedback) : [];
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      throw new Error(`Invalid JSON in form data: ${parseError.message}`);
    }

    // Validate SDGs
    if (!Array.isArray(parsedSdgs) || parsedSdgs.length === 0) {
      throw new Error('At least one Sustainable Development Goal must be selected');
    }

    console.log('Parsed fields:', {
      objectives: parsedObjectives,
      outcomes: parsedOutcomes,
      sdgs: parsedSdgs,
      studentCoordinators: parsedStudentCoordinators,
      facultyCoordinators: parsedFacultyCoordinators,
      speakers: parsedSpeakers,
      feedback: JSON.stringify(parsedFeedback, null, 2)
    });

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
      feedback: feedbackWithAnalytics,
      studentCoordinators: parsedStudentCoordinators,
      facultyCoordinators: parsedFacultyCoordinators,
      customEventType
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
      sdgs: parsedSdgs,
      studentCoordinators: parsedStudentCoordinators,
      facultyCoordinators: parsedFacultyCoordinators,
      totalParticipants,
      femaleParticipants,
      maleParticipants,
      eventType,
      customEventType,
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
  console.log('Received GET /api/reports', { 
    reportId: req.query.reportId, 
    userId: req.user?.userId, 
    role: req.user?.role 
  });
  try {
    const { reportId } = req.query;

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
        const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8;
        const mimeType = isJpeg ? 'image/jpeg' : 'image/png';
        console.log(`Converted buffer to base64 for ${fieldName}, MIME: ${mimeType}, length: ${base64.length}`);
        return `data:${mimeType};base64,${base64}`;
      } catch (err) {
        console.error(`Error converting buffer to base64 for ${fieldName}:`, err.message);
        return null;
      }
    };

    if (reportId) {
      // Fetch single report by ID
      if (!mongoose.isValidObjectId(reportId)) {
        console.error('Invalid report ID:', reportId);
        return res.status(400).json({ message: 'Invalid report ID' });
      }
      let query = { _id: reportId };
      if (req.user?.role !== 'office') {
        query.createdBy = req.user.userId;
      }
      const report = await Report.findOne(query)
        .populate('department', 'name')
        .select('-__v');
      if (!report) {
        console.error('Report not found or unauthorized:', { reportId, userId: req.user?.userId });
        return res.status(404).json({ message: 'Report not found or unauthorized' });
      }
      const reportData = {
        ...report.toObject(),
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
      console.log('Sending single report:', { reportId, eventName: reportData.eventName });
      return res.status(200).json(reportData);
    } else {
      // Fetch reports based on user role
      let reports;
      if (req.user.role === 'office') {
        reports = await Report.find({})
          .populate('department', 'name')
          .select('-__v');
        console.log('Office user fetched all reports:', { count: reports.length, userId: req.user.userId });
      } else {
        reports = await Report.find({ createdBy: req.user.userId })
          .populate('department', 'name')
          .select('-__v');
        console.log('Non-office user fetched their reports:', { count: reports.length, userId: req.user.userId });
      }
      const reportsData = reports.map(report => ({
        ...report.toObject(),
        poster: bufferToBase64(report.poster, 'poster'),
        attendance: report.attendance.map((img, i) => bufferToBase64(img, `attendance[${i}]`)),
        permissionImage: bufferToBase64(report.permissionImage, 'permissionImage'),
        feedback: report.feedback.map((fb, i) => ({
          question: String(fb.question || ''),
          answer: String(fb.answer || ''),
          analytics: bufferToBase64(fb.analytics, `feedback[${i}].analytics`)
        })),
        photographs: report.photographs.map((img, i) => bufferToBase64(img, `photographs[${i}]`))
      }));
      console.log('Sending reports:', { count: reportsData.length, userId: req.user.userId, role: req.user.role });
      return res.status(200).json(reportsData);
    }
  } catch (error) {
    console.error('Error fetching reports:', {
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
      .populate('department', 'name')
      .select("eventName academicYear organizedBy createdAt")
      .sort({ createdAt: -1 });
    console.log("Found reports:", reports.length);

    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching department reports:", error);
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

const deleteReport = async (req, res) => {
  try {
    const reportId = req.params.id;

    if (!mongoose.isValidObjectId(reportId)) {
      return res.status(400).json({ message: "Invalid report ID" });
    }

    const deletedReport = await Report.findOneAndDelete({
      _id: reportId,
      createdBy: req.user.userId,
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
      dateFrom,
      dateTo,
      timeFrom,
      timeTo,
      venue,
      objectives,
      outcomes,
      sdgs,
      studentCoordinators,
      facultyCoordinators,
      totalParticipants,
      femaleParticipants,
      maleParticipants,
      eventType,
      customEventType,
      summary,
      speakers,
      feedback
    } = req.body;

    // Validate required fields
    if (!eventName || !venue || !organizedBy || !totalParticipants || !timeFrom || !timeTo || !sdgs) {
      throw new Error('Missing required fields: Event Name, Venue, Organized By, Total Participants, Time From, Time To, Sustainable Development Goals');
    }
    if (tenure === '1 Day' && !date) {
      throw new Error('Date is required for single-day events');
    }
    if (tenure === 'Multiple Days' && (!dateFrom || !dateTo)) {
      throw new Error('Date From and Date To are required for multiple-day events');
    }

    // Parse JSON fields
    const parsedFeedback = feedback ? JSON.parse(feedback || "[]") : [];
    const parsedObjectives = objectives ? JSON.parse(objectives || "[]") : [];
    const parsedOutcomes = outcomes ? JSON.parse(outcomes || "[]") : [];
    const parsedSdgs = sdgs ? JSON.parse(sdgs || "[]") : [];
    const parsedStudentCoordinators = studentCoordinators ? JSON.parse(studentCoordinators || "[]") : [];
    const parsedFacultyCoordinators = facultyCoordinators ? JSON.parse(facultyCoordinators || "[]") : [];
    const parsedSpeakers = speakers ? JSON.parse(speakers || "[]") : [];

    // Validate SDGs
    if (!Array.isArray(parsedSdgs) || parsedSdgs.length === 0) {
      throw new Error('At least one Sustainable Development Goal must be selected');
    }

    // Preserve existing feedback entries, updating only provided ones
    const mergedFeedback = existingReport.feedback.map((existingFb, index) => {
      const newFb = parsedFeedback[index];
      if (newFb) {
        return {
          question: newFb.question || existingFb.question || '',
          answer: newFb.answer || existingFb.answer || '',
          analytics: existingFb.analytics // Preserve existing analytics
        };
      }
      return existingFb; // Keep unchanged feedback entries
    });

    // Append any new feedback entries beyond existing length
    if (parsedFeedback.length > existingReport.feedback.length) {
      for (let i = existingReport.feedback.length; i < parsedFeedback.length; i++) {
        mergedFeedback.push({
          question: parsedFeedback[i].question || '',
          answer: parsedFeedback[i].answer || '',
          analytics: null
        });
      }
    }

    // Update report fields
    existingReport.academicYear = academicYear;
    existingReport.organizedBy = organizedBy;
    existingReport.eventName = eventName;
    existingReport.tenure = tenure;
    existingReport.date = tenure === '1 Day' ? date : null;
    existingReport.dateFrom = tenure === 'Multiple Days' ? dateFrom : null;
    existingReport.dateTo = tenure === 'Multiple Days' ? dateTo : null;
    existingReport.timeFrom = timeFrom;
    existingReport.timeTo = timeTo;
    existingReport.venue = venue;
    existingReport.objectives = parsedObjectives;
    existingReport.outcomes = parsedOutcomes;
    existingReport.sdgs = parsedSdgs;
    existingReport.studentCoordinators = parsedStudentCoordinators;
    existingReport.facultyCoordinators = parsedFacultyCoordinators;
    existingReport.totalParticipants = totalParticipants;
    existingReport.femaleParticipants = femaleParticipants;
    existingReport.maleParticipants = maleParticipants;
    existingReport.eventType = eventType;
    existingReport.customEventType = customEventType || '';
    existingReport.summary = summary;
    existingReport.speakers = parsedSpeakers;
    existingReport.feedback = mergedFeedback;

    // Handle optional file updates
    if (req.files && req.files.length > 0) {
      const feedbackAnalytics = {};
      for (const file of req.files) {
        const { fieldname, buffer } = file;
        if (fieldname === "poster") {
          existingReport.poster = buffer;
        } else if (fieldname === "permissionImage") {
          existingReport.permissionImage = buffer;
        } else if (fieldname === "attendance" || fieldname === "attendance[]") {
          existingReport.attendance.push(buffer);
        } else if (fieldname === "photographs" || fieldname === "photographs[]") {
          existingReport.photographs.push(buffer);
        } else if (fieldname.startsWith('feedbackAnalytics-')) {
          const index = parseInt(fieldname.split('-')[1], 10);
          feedbackAnalytics[index] = buffer;
        }
      }
      // Update feedback analytics only for specified indices
      if (Object.keys(feedbackAnalytics).length > 0) {
        existingReport.feedback = existingReport.feedback.map((fb, i) => ({
          ...fb,
          analytics: feedbackAnalytics[i] !== undefined ? feedbackAnalytics[i] : fb.analytics
        }));
      }
    }

    console.log('Updating report:', {
      reportId,
      studentCoordinators: existingReport.studentCoordinators,
      facultyCoordinators: existingReport.facultyCoordinators,
      customEventType: existingReport.customEventType,
      sdgs: existingReport.sdgs,
      feedback: existingReport.feedback.map(fb => ({
        question: fb.question,
        answer: fb.answer,
        hasAnalytics: !!fb.analytics
      }))
    });

    await existingReport.save();
    res.status(200).json({ message: "Report updated successfully" });
  } catch (error) {
    console.error("Error updating report:", error.message);
    res.status(500).json({ message: "Server error while updating report" });
  }
};

const removeImage = async (req, res) => {
  try {
    const { reportId, field, index } = req.body;

    // Validate report ID
    if (!mongoose.isValidObjectId(reportId)) {
      console.error("Invalid report ID:", reportId);
      return res.status(400).json({ message: "Invalid report ID" });
    }

    // Find the report
    const report = await Report.findOne({
      _id: reportId,
      createdBy: req.user.userId,
    });

    if (!report) {
      console.error("Report not found or unauthorized:", { reportId, userId: req.user?.userId });
      return res.status(404).json({ message: "Report not found or unauthorized" });
    }

    // Handle image removal based on field
    if (field === "poster" || field === "permissionImage") {
      report[field] = null;
      console.log(`Removed ${field} from report ${reportId}`);
    } else if (field === "attendance" || field === "photographs") {
      if (index < 0 || index >= report[field].length) {
        console.error(`Invalid index ${index} for ${field} in report ${reportId}`);
        return res.status(400).json({ message: `Invalid index for ${field}` });
      }
      report[field].splice(index, 1);
      console.log(`Removed ${field}[${index}] from report ${reportId}`);
    } else if (field === "feedback") {
      if (index < 0 || index >= report.feedback.length) {
        console.error(`Invalid index ${index} for feedback in report ${reportId}`);
        return res.status(400).json({ message: "Invalid index for feedback" });
      }
      report.feedback[index].analytics = null;
      console.log(`Removed feedback[${index}].analytics from report ${reportId}`);
    } else {
      console.error(`Invalid field ${field} for report ${reportId}`);
      return res.status(400).json({ message: "Invalid field specified" });
    }

    // Save the updated report
    await report.save();
    console.log(`Report ${reportId} updated successfully after removing ${field}`);

    res.status(200).json({ message: "Image removed successfully" });
  } catch (error) {
    console.error("Error removing image:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: "Server error while removing image" });
  }
};

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
    console.error("Error searching minimal reports:", err.message);
    res.status(500).json({ message: "Failed to search reports", error: err.message });
  }
};

const getAnnualReports = async (req, res) => {
  try {
    const { academicYear, organizedBy } = req.query;

    // Build query dynamically
    const query = {};
    if (academicYear) query.academicYear = academicYear;
    if (organizedBy) query.organizedBy = organizedBy;

    // Create indexes if not already present
    await Report.createIndexes([
      { key: { academicYear: 1 } },
      { key: { organizedBy: 1 } },
      { key: { academicYear: -1, eventName: 1 } }
    ]);

    const reports = await Report.find(query)
      .populate('department', 'name')
      .select('-__v')
      .sort({ academicYear: -1, eventName: 1 })
      .lean();

    // Convert buffers to base64 for images
    const reportsWithBase64 = reports.map(r => ({
      reportId: r._id,
      eventName: r.eventName,
      academicYear: r.academicYear,
      organizedBy: r.organizedBy,
      department: r.department?.name || r.department,
      date: r.date,
      dateFrom: r.dateFrom,
      dateTo: r.dateTo,
      tenure: r.tenure,
      timeFrom: r.timeFrom,
      timeTo: r.timeTo,
      venue: r.venue,
      objectives: r.objectives,
      outcomes: r.outcomes,
      sdgs: r.sdgs,
      studentCoordinators: r.studentCoordinators,
      facultyCoordinators: r.facultyCoordinators,
      totalParticipants: r.totalParticipants,
      femaleParticipants: r.femaleParticipants,
      maleParticipants: r.maleParticipants,
      eventType: r.eventType,
      customEventType: r.customEventType,
      summary: r.summary,
      speakers: r.speakers,
      createdBy: r.createdBy,
      createdAt: r.createdAt,
      poster: r.poster
        ? `data:image/jpeg;base64,${r.poster.toString("base64")}`
        : null,
      photographs: r.photographs?.map(
        buf => `data:image/png;base64,${buf.toString("base64")}`
      ) || [],
      permissionImage: r.permissionImage
        ? `data:image/jpeg;base64,${r.permissionImage.toString("base64")}`
        : null,
      attendance: r.attendance?.map(
        buf => `data:image/png;base64,${buf.toString("base64")}`
      ) || [],
      feedback: r.feedback?.map(fb => ({
        question: fb.question,
        answer: fb.answer,
        analytics: fb.analytics
          ? `data:image/png;base64,${fb.analytics.toString("base64")}`
          : null
      })) || []
    }));

    res.status(200).json(reportsWithBase64);
  } catch (err) {
    console.error("Error fetching annual reports:", err.message);
    res.status(500).json({ message: "Failed to fetch annual reports", error: err.message });
  }
};

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