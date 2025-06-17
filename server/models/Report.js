const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  department: { type: String, required: true },
  academicYear: { type: String, required: true },
  organizedBy: { type: String, required: true },
  eventName: { type: String, required: true },
  tenure: { type: String, enum: ['1 Day', 'Multiple Days'], required: true },
  date: { type: String },
  dateFrom: { type: String },
  dateTo: { type: String },
  timeFrom: { type: String, required: true },
  timeTo: { type: String, required: true },
  venue: { type: String, required: true },
  poster: { type: Buffer },
  objectives: [{ type: String }],
  outcomes: [{ type: String }],
  totalParticipants: { type: Number, required: true },
  femaleParticipants: { type: Number },
  maleParticipants: { type: Number },
  eventType: { type: String, enum: ['Session', 'Workshop', 'Bootcamp'], required: true },
  summary: { type: String },
  attendance: [{ type: Buffer }],
  permissionImage: { type: Buffer }, // Added
  speakers: [{ name: String, background: String }], // Added
  feedback: [{
    question: { type: String },
    answer: { type: String },
    analytics: { type: Buffer },
  }],
  photographs: [{ type: Buffer }],
  createdBy: { type: String, required: true }, // Added
  createdAt: { type: Date, default: Date.now },
});

const ReportModel = mongoose.model('Report', reportSchema);
module.exports = ReportModel;