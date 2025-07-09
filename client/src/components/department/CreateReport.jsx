import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { jsPDF } from 'jspdf';
import '../../styles/CreateReport.css';
import logo from '../../assets/logo.png'; // Adjust the path as necessary

function CreateReport() {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    department: user?.department || '',
    academicYear: '2024-25',
    organizedBy: '',
    eventName: '',
    tenure: '1 Day',
    date: '',
    dateFrom: '',
    dateTo: '',
    timeFrom: '',
    timeTo: '',
    venue: '',
    poster: null,
    objectives: [''],
    outcomes: [''],
    totalParticipants: '',
    femaleParticipants: '',
    maleParticipants: '',
    eventType: 'Session',
    summary: '',
    attendance: [],
    permissionImage: null,
    speakers: [{ name: '', background: '' }],
    feedback: [{ question: '', answer: '', analytics: null }],
    photographs: [],
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [reportId, setReportId] = useState(null);

  useEffect(() => {
    console.log('Component mounted, user:', user, 'token:', localStorage.getItem('token'));
    setIsSubmitted(false);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSingleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file && ['image/jpeg', 'image/png'].includes(file.type)) {
      setFormData({ ...formData, [field]: file });
      console.log(`Selected ${field}: ${file.name}, size: ${file.size} bytes`);
    } else {
      setError(`Invalid file type for ${field}. Please select JPEG or PNG.`);
    }
  };

  const handleMultipleFileChange = (e, field) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => ['image/jpeg', 'image/png'].includes(file.type));
    if (validFiles.length !== files.length) {
      setError(`Some files for ${field} are invalid. Only JPEG or PNG allowed.`);
    }
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ...validFiles],
    }));
    console.log(`Selected ${field}: ${validFiles.map(f => `${f.name} (${f.size} bytes)`).join(', ')}`);
  };

  const handleDynamicChange = (e, index, field, subField) => {
    const updatedArray = [...formData[field]];
    if (subField) {
      updatedArray[index] = { ...updatedArray[index], [subField]: e.target.value };
    } else {
      updatedArray[index] = e.target.value;
    }
    setFormData({ ...formData, [field]: updatedArray });
  };

  const addDynamicField = (field) => {
    if (field === 'feedback') {
      setFormData({ ...formData, feedback: [...formData.feedback, { question: '', answer: '', analytics: null }] });
    } else if (field === 'speakers') {
      setFormData({ ...formData, speakers: [...formData.speakers, { name: '', background: '' }] });
    } else {
      setFormData({ ...formData, [field]: [...formData[field], ''] });
    }
  };

  const removeDynamicField = (index, field) => {
    const updatedArray = [...formData[field]];
    updatedArray.splice(index, 1);
    setFormData({ ...formData, [field]: updatedArray });
  };

  const handleFeedbackAnalytics = (e, index) => {
    const file = e.target.files[0];
    if (file && ['image/jpeg', 'image/png'].includes(file.type)) {
      const updatedFeedback = [...formData.feedback];
      updatedFeedback[index].analytics = file;
      setFormData({ ...formData, feedback: updatedFeedback });
      console.log(`Selected feedback analytics[${index}]: ${file.name}, size: ${file.size} bytes`);
    } else {
      setError('Invalid file type for feedback analytics. Please select JPEG or PNG.');
    }
  };

  const handleButtonClick = (e) => {
    console.log('Submit button clicked');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!formData.eventName || !formData.venue || !formData.totalParticipants || !formData.organizedBy || !formData.date || !formData.timeFrom || !formData.timeTo) {
      const errorMsg = 'Missing required fields. Please fill: Event Name, Venue, Organized By, Total Participants, Date, Time.';
      console.log('Validation failed:', errorMsg);
      setError(errorMsg);
      return;
    }

    console.log('Form validated, preparing FormData');
    const submissionData = new FormData();
    try {
      Object.keys(formData).forEach((key) => {
        if (key === 'poster' || key === 'permissionImage') {
          if (formData[key] instanceof File) {
            submissionData.append(key, formData[key]);
            console.log(`Appended ${key}: ${formData[key].name}, size: ${formData[key].size} bytes`);
          }
        } else if (key === 'attendance' || key === 'photographs') {
          if (Array.isArray(formData[key])) {
            formData[key].forEach((file, index) => {
              if (file instanceof File) {
                submissionData.append(key, file);
                console.log(`Appended ${key}[${index}]: ${file.name}, size: ${file.size} bytes`);
              }
            });
          }
        } else if (key === 'feedback') {
          const feedbackWithAnalytics = formData.feedback.map((item, index) => ({
            ...item,
            analytics: item.analytics ? `feedbackAnalytics-${index}` : null,
          }));
          submissionData.append('feedback', JSON.stringify(feedbackWithAnalytics));
          formData.feedback.forEach((item, index) => {
            if (item.analytics instanceof File) {
              submissionData.append(`feedbackAnalytics-${index}`, item.analytics);
              console.log(`Appended feedbackAnalytics-${index}: ${item.analytics.name}, size: ${item.analytics.size} bytes`);
            }
          });
        } else if (Array.isArray(formData[key])) {
          submissionData.append(key, JSON.stringify(formData[key]));
        } else {
          submissionData.append(key, formData[key] || '');
        }
      });
    } catch (err) {
      console.error('Error building FormData:', err.message);
      setError('Failed to prepare form data.');
      return;
    }

    try {
      console.log('Sending POST request to http://localhost:3001/api/reports/create');
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found.');
      }
      const res = await axios.post('http://localhost:3001/api/reports/create', submissionData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });
      console.log('Submission successful:', res.data);
      setSuccess('Report submitted successfully!');
      setIsSubmitted(true);
      setReportId(res.data.reportId);
      setShowModal(true);
    } catch (error) {
      console.error('Submission error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      setError(`Failed to submit: ${error.response?.data?.error || error.message}`);
    }
  };

  const validateBase64 = (base64Data) => {
    if (!base64Data || typeof base64Data !== 'string') {
      console.warn('Invalid base64: not a string or empty');
      return null;
    }
    if (!base64Data.match(/^data:image\/(png|jpeg);base64,/)) {
      console.warn('Invalid base64: missing valid image data URI');
      return null;
    }
    return base64Data;
  };

  const handleDownload = async () => {
    if (!reportId) {
      setDownloadError('No report ID available.');
      return;
    }

    setDownloadError('');
    setIsDownloading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:3001/api/reports?reportId=${reportId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const reportData = res.data;
      console.log('Report data for PDF:', {
        poster: !!reportData.poster,
        permissionImage: !!reportData.permissionImage,
        attendanceCount: reportData.attendance?.length,
        photographsCount: reportData.photographs?.length,
        feedbackCount: reportData.feedback?.length,
      });

      const doc = new jsPDF();
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      const marginLeft = 15;
      const marginTop = 15;
      const marginBottom = 15;
      const maxWidth = pageWidth - 2 * marginLeft;
      const lineHeight = 6;
      const analyticsWidth = 110;
      const analyticsHeight = 100;
      const smallImageWidth = 90;
      const smallImageHeight = 100;
      const posterWidth = 120;
      const posterHeight = 150;
      const largeImageWidth = 180;
      const largeImageHeight = 240;
      const logoWidth = 25;
      let logoHeight = 50; // Default, adjusted below
      let currentY = marginTop;

      doc.setFont('times', 'normal');

      const addNewPageIfNeeded = (additionalHeight) => {
        if (currentY + additionalHeight > pageHeight - marginBottom) {
          doc.addPage();
          currentY = marginTop;
          doc.setFont('times', 'normal');
          doc.setFontSize(12);
          return true;
        }
        return false;
      };

      const addTextSection = (text, indent = 0, fontSize = 12, style = 'normal', align = 'left') => {
        doc.setFontSize(fontSize);
        doc.setFont('times', style);
        const lines = doc.splitTextToSize(text || 'N/A', maxWidth - indent);
        lines.forEach((line) => {
          if (addNewPageIfNeeded(lineHeight)) {
            doc.setFont('times', 'normal');
            doc.setFontSize(12);
          }
          doc.text(line, align === 'center' ? pageWidth / 2 : marginLeft + indent, currentY, { align });
          currentY += lineHeight;
        });
      };

      // Add logo
      try {
        const img = new Image();
        img.src = logo;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        logoHeight = (img.height / img.width) * logoWidth; // Maintain aspect ratio
        console.log(`Adding logo, format: PNG, width: ${logoWidth}, height: ${logoHeight}`);
        doc.addImage(logo, 'PNG', (pageWidth - logoWidth) / 2, currentY, logoWidth, logoHeight);
        currentY += logoHeight + 10;
      } catch (err) {
        console.error('Error adding logo to PDF:', err.message);
        currentY += 10; // Reserve space
      }

      addTextSection('S. A. P. D. Jain Pathashala’s', 0, 12, 'normal', 'center');
      currentY += 2;
      addTextSection('Walchand Institute of Technology, Solapur', 0, 14, 'bold', 'center');
      currentY += 2;
      addTextSection('An Autonomous Institute', 0, 12, 'normal', 'center');
      currentY += 2;
      addTextSection(`Department of ${reportData.department || 'N/A'}`, 0, 12, 'bold', 'center');
      currentY += 5;

      doc.setLineWidth(0.5);
      doc.line(marginLeft, currentY, pageWidth - marginLeft, currentY);
      currentY += 10;

      addTextSection(`Event: ${reportData.eventName || 'N/A'}`, 0, 12, 'bold', 'center');
      currentY += 2;
      addTextSection(`Organized by: ${reportData.organizedBy || 'N/A'}`, 0, 12, 'bold','center');
      currentY += 5;

      if (reportData.poster) {
        addNewPageIfNeeded(posterHeight + 15);
        addTextSection('Event Poster:', 0, 12, 'italic', 'center');
        currentY += 2;
        try {
          const validBase64 = validateBase64(reportData.poster);
          if (validBase64) {
            doc.addImage(validBase64, validBase64.startsWith('data:image/png') ? 'PNG' : 'JPEG', pageWidth / 2 - posterWidth / 2, currentY, posterWidth, posterHeight);
            currentY += posterHeight + 5;
          } else {
            addTextSection('Invalid poster data', 0, 10, 'normal', 'center');
            currentY += 5;
          }
        } catch (err) {
          console.error('Error adding poster:', err.message);
          addTextSection('Error loading poster', 0, 10, 'normal', 'center');
          currentY += 5;
        }
      } else {
        addTextSection('Poster Unavailable', 0, 10, 'normal', 'center');
        currentY += 5;
      }

      doc.addPage();
      currentY = marginTop;

      if (reportData.objectives?.length > 0) {
        addNewPageIfNeeded(20);
        addTextSection('Objectives:', 0, 14, 'bold');
        currentY += 5;
        reportData.objectives.forEach((obj, index) => {
          if (obj) addTextSection(`${index + 1}. ${obj}`, 5, 12, 'normal');
        });
        currentY += 10;
      }

      if (reportData.outcomes?.length > 0) {
        addNewPageIfNeeded(20);
        addTextSection('Outcomes:', 0, 14, 'bold');
        currentY += 5;
        reportData.outcomes.forEach((outcome, index) => {
          if (outcome) addTextSection(`${index + 1}. ${outcome}`, 5, 12, 'normal');
        });
        currentY += 10;
      }

      addNewPageIfNeeded(20);
      addTextSection('Detailed Report', 0, 16, 'bold', 'center');
      currentY += 10;

      addTextSection('Overview:', 0, 14, 'bold');
      currentY += 5;
      addTextSection(`Academic Year: ${reportData.academicYear || 'N/A'}`, 5, 12, 'bold');
      addTextSection(`Event Name: ${reportData.eventName || 'N/A'}`, 5, 12, 'bold');
      addTextSection(`Organized by: ${reportData.organizedBy || 'N/A'}`, 5, 12, 'bold');
      addTextSection(`Department: ${reportData.department || 'N/A'}`, 5, 12, 'bold');
      addTextSection(
        `Date: ${reportData.tenure === '1 Day' ? reportData.date || 'N/A' : `${reportData.dateFrom || 'N/A'} to ${reportData.dateTo || 'N/A'}`}`,
        5, 12, 'bold'
      );
      addTextSection(`Time: ${reportData.timeFrom || 'N/A'} to ${reportData.timeTo || 'N/A'}`, 5, 12, 'bold');
      addTextSection(`Venue: ${reportData.venue || 'N/A'}`, 5, 12, 'bold');
      currentY += 10;

      if (reportData.summary) {
        addNewPageIfNeeded(20);
        addTextSection(`${reportData.eventType || 'Event'} Summary:`, 0, 14, 'bold');
        currentY += 5;
        addTextSection(reportData.summary, 5, 12, 'normal');
        currentY += 10;
      }

      if (reportData.speakers?.length > 0) {
        addNewPageIfNeeded(20);
        addTextSection('Speakers:', 0, 14, 'bold');
        currentY += 5;
        reportData.speakers.forEach((speaker, index) => {
          if (speaker?.name) {
            addTextSection(`${index + 1}. ${speaker.name}`, 5, 12, 'bold');
            if (speaker.background) {
              addTextSection(`Background: ${speaker.background}`, 10, 12, 'normal');
              currentY += 2;
            }
          }
        });
        currentY += 10;
      }

      addNewPageIfNeeded(20);
      addTextSection('Participants:', 0, 14, 'bold');
      currentY += 5;
      addTextSection(`Total: ${reportData.totalParticipants || 'N/A'}`, 5, 12, 'normal');
      addTextSection(`Female: ${reportData.femaleParticipants || 'N/A'}`, 5, 12, 'normal');
      addTextSection(`Male: ${reportData.maleParticipants || 'N/A'}`, 5, 12, 'normal');
      addTextSection(`Type: ${reportData.eventType || 'N/A'}`, 5, 12, 'bold');
      currentY += 10;

      doc.addPage();
      currentY = marginTop;

      if (reportData.feedback) {
        console.log('Feedback data:', JSON.stringify(reportData.feedback, null, 2));
        addNewPageIfNeeded(20);
        addTextSection('Feedback:', 0, 14, 'bold','center');
        currentY += 10;
        if (!reportData.feedback || reportData.feedback.length === 0) {
          addTextSection('No feedback available', 5, 12, 'normal');
          currentY += 10;
        } else {
          for (const [index, fb] of reportData.feedback.entries()) {
            console.log(`Feedback[${index}]:`, {
              rawFeedback: JSON.stringify(fb, null, 2),
              rawFeedbackKeys: Object.keys(fb),
              question: fb.question,
              answer: fb.answer,
              analytics: fb.analytics ? 'Present' : 'Absent',
              validBase64: validateBase64(fb.analytics),
            });
            const feedbackData = fb.__parentArray && fb.__parentArray[0] ? fb.__parentArray[0] : fb;
            if (feedbackData.question != null || feedbackData.answer != null || fb.analytics) {
              addTextSection(`Question ${index + 1}: ${feedbackData.question != null ? feedbackData.question : 'N/A'}`, 5, 12, 'normal');
              addTextSection(`Answer: ${feedbackData.answer != null ? feedbackData.answer : 'N/A'}`, 5, 12, 'normal');
              if (fb.analytics) {
                addNewPageIfNeeded(smallImageHeight + 10);
                addTextSection(`Feedback Analytics ${index + 1}:`, 5, 12, 'italic');
                try {
                  const analyticsBase64 = validateBase64(fb.analytics);
                  if (analyticsBase64) {
                    const format = analyticsBase64.startsWith('data:image/png') ? 'PNG' : 'JPEG';
                    doc.addImage(analyticsBase64, format, pageWidth / 2 - analyticsWidth / 2, currentY, analyticsWidth, analyticsHeight);
                    currentY += analyticsHeight + 5;
                  } else {
                    addTextSection('No valid feedback analytics image available', 5, 10, 'normal');
                    currentY += 5;
                  }
                } catch (err) {
                  console.error(`Error adding feedback analytics image ${index + 1}:`, err.message);
                  addTextSection('Error loading feedback analytics image', 5, 10, 'normal');
                  currentY += 5;
                }
              }
              currentY += 5;
            }
          }
        }
        currentY += 10;
      } else {
        console.log('No feedback data in reportData');
        addNewPageIfNeeded(20);
        addTextSection('Feedback: None', 0, 14, 'bold');
        currentY += 10;
      }

      doc.addPage();
      currentY = marginTop;

    if (reportData.photographs?.length > 0) {
        addTextSection('Photographs:', 0, 14, 'bold', 'center');
        currentY += 5;
        let imagesOnPage = 0;
        for (const [index, img] of reportData.photographs.entries()) {
          if (imagesOnPage >= 3) {
            doc.addPage();
            currentY = marginTop;
            imagesOnPage = 0;
          }
          try {
            const validBase64 = validateBase64(img);
            if (validBase64) {
              const imgObj = new Image();
              imgObj.src = validBase64;
              await new Promise((resolve, reject) => {
                imgObj.onload = resolve;
                imgObj.onerror = reject;
              });
              const imgWidth = imgObj.width / 2.83465; // Convert pixels to mm (1 mm = 2.83465 points)
              const imgHeight = imgObj.height / 2.83465; // Convert pixels to mm
              if (addNewPageIfNeeded(imgHeight + 15)) {
                imagesOnPage = 0;
              }
              addTextSection(`Photograph ${index + 1}:`, 5, 12, 'italic');
              const xPosition = pageWidth / 2 - imgWidth / 2; // Center the image
              doc.addImage(validBase64, validBase64.startsWith('data:image/png') ? 'PNG' : 'JPEG', 
                xPosition, currentY, imgWidth, imgHeight);
              currentY += imgHeight + 5;
              imagesOnPage++;
            } else {
              addTextSection('Invalid photo data', 5, 10, 'normal');
              currentY += 5;
            }
          } catch (err) {
            console.error(`Error adding photo ${index + 1}:`, err.message);
            addTextSection('Error loading photo', 5, 10, 'normal');
            currentY += 5;
          }
        }
        currentY += 5;
      }

      if (reportData.permissionImage) {
        doc.addPage();
        currentY = marginTop;
        addTextSection('Permission Image:', 0, 14, 'bold', 'center');
        currentY += 5;
        try {
          const validBase64 = validateBase64(reportData.permissionImage);
          if (validBase64) {
            doc.addImage(validBase64, validBase64.startsWith('data:image/png') ? 'PNG' : 'JPEG', pageWidth / 2 - largeImageWidth / 2, currentY, largeImageWidth, largeImageHeight);
            currentY += largeImageHeight + 5;
          } else {
            addTextSection('Invalid permission image data', 5, 10, 'normal', 'center');
            currentY += 5;
          }
        } catch (err) {
          console.error('Error adding permission:', err.message);
          addTextSection('Error loading permission', 5, 10, 'normal', 'center');
          currentY += 5;
        }
      }

      if (reportData.attendance?.length > 0) {
        for (const [index, img] of reportData.attendance.entries()) {
          doc.addPage();
          currentY = marginTop;
          addTextSection(`Attendance Image ${index + 1}:`, 0, 14, 'bold', 'center');
          currentY += 5;
          try {
            const validBase64 = validateBase64(img);
            if (validBase64) {
              doc.addImage(validBase64, validBase64.startsWith('data:image/png') ? 'PNG' : 'JPEG', pageWidth / 2 - largeImageWidth / 2, currentY, largeImageWidth, largeImageHeight);
            } else {
              addTextSection('Invalid attendance image data', 5, 10, 'normal', 'center');
              currentY += 5;
            }
          } catch (err) {
            console.error(`Error adding attendance ${index + 1}:`, err.message);
            addTextSection('Error loading attendance', 5, 10, 'normal', 'center');
            currentY += 5;
          }
        }
      }

      doc.save(`${reportData.eventName?.replace(/\s/g, '_') || 'report'}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err.message);
      setDownloadError('Failed to generate PDF. Check console.');
    } finally {
      setIsDownloading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className='reportcreate'>  
    <div className="create-report">
      <h2>Create Report for {formData.department || 'Department'}</h2>
      {error && <div className="error" style={{ color: 'red', fontSize: '14px', marginBottom: '10px' }}>{error}</div>}
      {success && <div className="success" style={{ color: 'green', fontSize: '14px', marginBottom: '10px' }}>{success}</div>}
      {downloadError && <div className="error" style={{ color: 'red', fontSize: '14px', marginBottom: '10px' }}>{downloadError}</div>}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <p>Now you can download the PDF.</p>
            <button onClick={closeModal}>Close</button>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Department</label>
          <input type="text" value={formData.department} disabled style={{ fontFamily: 'Times New Roman', fontSize: '12px' }} />
        </div>
        <div className="form-group">
          <label>Academic Year *</label>
          <select name="academicYear" value={formData.academicYear} onChange={handleChange} required style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}>
            <option value="2024-25">2024-25</option>
            <option value="2025-26">2025-26</option>
            <option value="2026-27">2026-27</option>
          </select>
        </div>
        <div className="form-group">
          <label>Organized By *</label>
          <input
            type="text"
            name="organizedBy"
            value={formData.organizedBy}
            onChange={handleChange}
            required
            style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
          />
        </div>
        <div className="form-group">
          <label>Event Name *</label>
          <input
            type="text"
            name="eventName"
            value={formData.eventName}
            onChange={handleChange}
            required
            style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
          />
        </div>
        <div className="form-group">
          <label>Tenure *</label>
          <select name="tenure" value={formData.tenure} onChange={handleChange} style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}>
            <option value="1 Day">1 Day</option>
            <option value="Multiple Days">Multiple Days</option>
          </select>
        </div>
        <div className="form-group">
          <label>Date *</label>
          {formData.tenure === '1 Day' ? (
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
            />
          ) : (
            <div className="date-range">
              <input
                type="date"
                name="dateFrom"
                value={formData.dateFrom}
                onChange={handleChange}
                required
                style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
              />
              <input
                type="date"
                name="dateTo"
                value={formData.dateTo}
                onChange={handleChange}
                required
                style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
              />
            </div>
          )}
        </div>
        <div className="form-group">
          <label>Time *</label>
          <div className="time-range">
            <input
              type="time"
              name="timeFrom"
              value={formData.timeFrom}
              onChange={handleChange}
              required
              style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
            />
            <input
              type="time"
              name="timeTo"
              value={formData.timeTo}
              onChange={handleChange}
              required
              style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
            />
          </div>
        </div>
        <div className="form-group">
          <label>Venue *</label>
          <input
            type="text"
            name="venue"
            value={formData.venue}
            onChange={handleChange}
            required
            style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
          />
        </div>
        <div className="form-group">
          <label>Poster</label>
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={(e) => handleSingleFileChange(e, 'poster')}
            style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
          />
           <div>
            {formData.poster && <p>{formData.poster.name}</p>}
          </div>
        </div>
        <div className="form-group">
          <label>Speakers</label>
          {formData.speakers.map((speaker, index) => (
            <div key={index} className="dynamic-field">
              <input
                type="text"
                value={speaker.name || ''}
                onChange={(e) => handleDynamicChange(e, index, 'speakers', 'name')}
                placeholder="Speaker name"
                style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
              />
              <textarea
                value={speaker.background || ''}
                onChange={(e) => handleDynamicChange(e, index, 'speakers', 'background')}
                placeholder="Speaker background"
                rows="3"
                style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
              />
              {formData.speakers.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDynamicField(index, 'speakers')}
                  className="remove-btn"
                  style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addDynamicField('speakers')}
            className="add-btn"
            style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
          >
            Add Speaker
          </button>
        </div>
        <div className="form-group">
          <label>Objectives</label>
          {formData.objectives.map((objective, index) => (
            <div key={index} className="dynamic-field">
              <textarea
                value={objective || ''}
                onChange={(e) => handleDynamicChange(e, index, 'objectives')}
                placeholder={`Objective ${index + 1}`}
                rows="3"
                style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
              />
              {formData.objectives.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDynamicField(index, 'objectives')}
                  className="remove-btn"
                  style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addDynamicField('objectives')}
            className="add-btn"
            style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
          >
            Add
          </button>
        </div>
        <div className="form-group">
          <label>Outcomes</label>
          {formData.outcomes.map((outcome, index) => (
            <div key={index} className="dynamic-field">
              <textarea
                value={outcome || ''}
                onChange={(e) => handleDynamicChange(e, index, 'outcomes')}
                placeholder={`Outcome ${index + 1}`}
                rows="3"
                style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
              />
              {formData.outcomes.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDynamicField(index, 'outcomes')}
                  className="remove-btn"
                  style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addDynamicField('outcomes')}
            className="add-btn"
            style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
          >
            Add
          </button>
        </div>
        <div className="form-group">
          <label>Total Participants *</label>
          <input
            type="number"
            name="totalParticipants"
            value={formData.totalParticipants}
            onChange={handleChange}
            required
            min="0"
            style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
          />
        </div>
        <div className="form-group">
          <label>Female Participants</label>
          <input
            type="number"
            name="femaleParticipants"
            value={formData.femaleParticipants}
            onChange={handleChange}
            min="0"
            style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
          />
        </div>
        <div className="form-group">
          <label>Male Participants</label>
          <input
            type="number"
            name="maleParticipants"
            value={formData.maleParticipants}
            onChange={handleChange}
            min="0"
            style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
          />
        </div>
        <div className="form-group">
          <label>Event Type</label>
          <select name="eventType" value={formData.eventType} onChange={handleChange} style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}>
            <option value="Session">Session</option>
            <option value="Workshop">Workshop</option>
            <option value="Bootcamp">Bootcamp</option>
          </select>
        </div>
        <div className="form-group">
          <label>{formData.eventType || 'Event'} Summary</label>
          <textarea
            name="summary"
            value={formData.summary}
            onChange={handleChange}
            rows="5"
            style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
          />
        </div>
        <div className="form-group">
          <label>Attendance Images</label>
          <input
            type="file"
            accept="image/jpeg,image/png"
            multiple
            name="attendance[]"
            onChange={(e) => handleMultipleFileChange(e, 'attendance')}
            style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
          />
          <div>
            {formData.attendance.map((file, index) => (
              <p key={index}>{file.name}</p>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Permission Image</label>
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={(e) => handleSingleFileChange(e, 'permissionImage')}
            style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
          />
          <div>
            {formData.permissionImage && <p>{formData.permissionImage.name}</p>}
          </div>
        </div>
        <div className="form-group">
          <label>Feedback</label>
          {formData.feedback?.map((item, index) => (
            <div key={index} className="feedback-item">
              <input
                type="text"
                value={item.question || ''}
                onChange={(e) => handleDynamicChange(e, index, 'feedback', 'question')}
                placeholder={`Question ${index + 1}`}
                style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
              />
              <textarea
                value={item.answer || ''}
                onChange={(e) => handleDynamicChange(e, index, 'feedback', 'answer')}
                placeholder="Answer/Review"
                rows="3"
                style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
              />
              <input
                type="file"
                accept="image/jpeg,image/png"
                name={`feedbackAnalytics-${index}`}
                onChange={(e) => handleFeedbackAnalytics(e, index)}
                style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
              />
              <div>
              {item.analytics && <p>{item.analytics.name}</p>}
              </div>
              {formData.feedback.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDynamicField(index, 'feedback')}
                  className="remove-btn"
                  style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addDynamicField('feedback')}
            className="add-btn"
            style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
          >
            Add Feedback
          </button>
        </div>
        <div className="form-group">
          <label>Photographs</label>
          <input
            type="file"
            accept="image/jpeg,image/png"
            multiple
            name="photographs[]"
            onChange={(e) => handleMultipleFileChange(e, 'photographs')}
            style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
          />
          <div>
            {formData.photographs.map((file, index) => (
              <p key={index}>{file.name}</p>
            ))}
          </div>
        </div>
        <div className="button-group">
          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitted}
            onClick={handleButtonClick}
            style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
          >
            Submit Report
          </button>
          <button
            type="button"
            className="download-btn"
            disabled={!isSubmitted || isDownloading}
            onClick={handleDownload}
            style={{ fontFamily: 'Times New Roman', fontSize: '12px' }}
          >
            {isDownloading ? 'Generating PDF...' : 'Download PDF'}
          </button>
        </div>
      </form>
    </div>
     </div>
  );
}

export default CreateReport;
