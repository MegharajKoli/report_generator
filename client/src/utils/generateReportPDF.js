import { jsPDF } from 'jspdf';
import logo from '../assets/logo.png'; // Adjust the path as necessary relative to utils folder

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

export const generateReportPDF = async (reportData) => {
  if (!reportData || typeof reportData !== 'object') {
    console.error('Invalid reportData: ', reportData);
    throw new Error('Invalid or missing report data');
  }

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

  const effectiveEventType = reportData.eventType === 'Other' ? (reportData.customEventType || 'Other') : (reportData.eventType || 'N/A');

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
      const textAlign = align === 'justify' && lines.length > 1 ? 'justify' : align;
      doc.text(line, textAlign === 'center' ? pageWidth / 2 : marginLeft + indent, currentY, { align: textAlign });
      currentY += lineHeight;
    });
  };

  // Add logo
  try {
    const img = new Image();
    img.src = logo;
    await new Promise((resolve, reject) => {
      img.onload = () => {
        logoHeight = (img.height / img.width) * logoWidth; // Maintain aspect ratio
        console.log(`Adding logo, format: PNG, width: ${logoWidth}, height: ${logoHeight}`);
        doc.addImage(logo, 'PNG', (pageWidth - logoWidth) / 2, currentY, logoWidth, logoHeight);
        currentY += logoHeight + 10;
        resolve();
      };
      img.onerror = reject;
    });

    // Header
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

    addTextSection(`Event: ${reportData.eventName || 'N/A'}`, 0, 12, 'bold', 'left');
    currentY += 2;
    addTextSection(`Organized by: ${reportData.organizedBy || 'N/A'}`, 0, 12, 'bold', 'left');
    currentY += 5;

    // Poster
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

    // Objectives
    if (reportData.objectives?.length > 0) {
      addNewPageIfNeeded(20);
      addTextSection('Objectives:', 0, 14, 'bold', 'left');
      currentY += 5;
      reportData.objectives.forEach((obj, index) => {
        if (obj) addTextSection(`${index + 1}. ${obj}`, 5, 12, 'normal', 'justify');
      });
      currentY += 10;
    }

    // Outcomes
    if (reportData.outcomes?.length > 0) {
      addNewPageIfNeeded(20);
      addTextSection('Outcomes:', 0, 14, 'bold', 'left');
      currentY += 5;
      reportData.outcomes.forEach((outcome, index) => {
        if (outcome) addTextSection(`${index + 1}. ${outcome}`, 5, 12, 'normal', 'justify');
      });
      currentY += 10;
    }

    // Student Coordinators
    if (reportData.studentCoordinators?.length > 0) {
      addNewPageIfNeeded(20);
      addTextSection('Student Coordinators:', 0, 14, 'bold', 'left');
      currentY += 5;
      reportData.studentCoordinators.forEach((coordinator, index) => {
        if (coordinator) addTextSection(`${index + 1}. ${coordinator}`, 5, 12, 'normal', 'justify');
      });
      currentY += 10;
    }

    // Faculty Coordinators
    if (reportData.facultyCoordinators?.length > 0) {
      addNewPageIfNeeded(20);
      addTextSection('Faculty Coordinators:', 0, 14, 'bold', 'left');
      currentY += 5;
      reportData.facultyCoordinators.forEach((coordinator, index) => {
        if (coordinator) addTextSection(`${index + 1}. ${coordinator}`, 5, 12, 'normal', 'justify');
      });
      currentY += 10;
    }

    // Detailed Report
    addNewPageIfNeeded(20);
    addTextSection('Detailed Report', 0, 16, 'bold', 'center');
    currentY += 10;

    addTextSection('Overview:', 0, 14, 'bold', 'left');
    currentY += 5;
    addTextSection(`Academic Year: ${reportData.academicYear || 'N/A'}`, 5, 12, 'bold', 'left');
    addTextSection(`Event Name: ${reportData.eventName || 'N/A'}`, 5, 12, 'bold', 'left');
    addTextSection(`Organized by: ${reportData.organizedBy || 'N/A'}`, 5, 12, 'bold', 'left');
    addTextSection(`Department: ${reportData.department || 'N/A'}`, 5, 12, 'bold', 'left');
    addTextSection(
      `Date: ${reportData.tenure === '1 Day' ? reportData.date || 'N/A' : `${reportData.dateFrom || 'N/A'} to ${reportData.dateTo || 'N/A'}`}`,
      5, 12, 'bold', 'left'
    );
    addTextSection(`Time: ${reportData.timeFrom || 'N/A'} to ${reportData.timeTo || 'N/A'}`, 5, 12, 'bold', 'left');
    addTextSection(`Venue: ${reportData.venue || 'N/A'}`, 5, 12, 'bold', 'left');
    currentY += 10;

    // Summary
    if (reportData.summary) {
      addNewPageIfNeeded(20);
      addTextSection(`${effectiveEventType || 'Event'} Summary:`, 0, 14, 'bold', 'left');
      currentY += 5;
      addTextSection(reportData.summary, 5, 12, 'normal', 'justify');
      currentY += 10;
    }

    // Speakers
    if (reportData.speakers?.length > 0) {
      addNewPageIfNeeded(20);
      addTextSection('Speakers:', 0, 14, 'bold', 'left');
      currentY += 5;
      reportData.speakers.forEach((speaker, index) => {
        if (speaker?.name) {
          addTextSection(`${index + 1}. ${speaker.name}`, 5, 12, 'bold', 'left');
          if (speaker.background) {
            addTextSection(`Background: ${speaker.background}`, 10, 12, 'normal', 'justify');
            currentY += 2;
          }
        }
      });
      currentY += 10;
    }

    // Participants
    addNewPageIfNeeded(20);
    addTextSection('Participants:', 0, 14, 'bold', 'left');
    currentY += 5;
    addTextSection(`Total: ${reportData.totalParticipants || 'N/A'}`, 5, 12, 'normal', 'left');
    addTextSection(`Female: ${reportData.femaleParticipants || 'N/A'}`, 5, 12, 'normal', 'left');
    addTextSection(`Male: ${reportData.maleParticipants || 'N/A'}`, 5, 12, 'normal', 'left');
    addTextSection(`Type: ${effectiveEventType || 'N/A'}`, 5, 12, 'bold', 'left');
    currentY += 10;

    doc.addPage();
    currentY = marginTop;

    // Feedback
    if (reportData.feedback) {
      console.log('Feedback data:', JSON.stringify(reportData.feedback, null, 2));
      addNewPageIfNeeded(20);
      addTextSection('Feedback:', 0, 14, 'bold', 'center');
      currentY += 10;
      if (!reportData.feedback || reportData.feedback.length === 0) {
        addTextSection('No feedback available', 5, 12, 'normal', 'justify');
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
            addTextSection(`Question ${index + 1}: ${feedbackData.question != null ? feedbackData.question : 'N/A'}`, 5, 12, 'normal', 'justify');
            addTextSection(`Answer: ${feedbackData.answer != null ? feedbackData.answer : 'N/A'}`, 5, 12, 'normal', 'justify');
            if (fb.analytics) {
              addNewPageIfNeeded(smallImageHeight + 10);
              addTextSection(`Feedback Analytics ${index + 1}:`, 5, 12, 'italic', 'center');
              try {
                const analyticsBase64 = validateBase64(fb.analytics);
                if (analyticsBase64) {
                  const format = analyticsBase64.startsWith('data:image/png') ? 'PNG' : 'JPEG';
                  doc.addImage(analyticsBase64, format, pageWidth / 2 - analyticsWidth / 2, currentY, analyticsWidth, analyticsHeight);
                  currentY += analyticsHeight + 5;
                } else {
                  addTextSection('No valid feedback analytics image available', 5, 10, 'normal', 'center');
                  currentY += 5;
                }
              } catch (err) {
                console.error(`Error adding feedback analytics image ${index + 1}:`, err.message);
                addTextSection('Error loading feedback analytics image', 5, 10, 'normal', 'center');
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
      addTextSection('Feedback: None', 0, 14, 'bold', 'center');
      currentY += 10;
    }

    doc.addPage();
    currentY = marginTop;

    // Photographs
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
              imgObj.onload = () => {
                const imgWidth = imgObj.width / 2.83465; // Convert pixels to mm (1 mm = 2.83465 points)
                const imgHeight = imgObj.height / 2.83465; // Convert pixels to mm
                if (addNewPageIfNeeded(imgHeight + 15)) {
                  imagesOnPage = 0;
                }
                addTextSection(`Photograph ${index + 1}:`, 5, 12, 'italic', 'center');
                const xPosition = pageWidth / 2 - imgWidth / 2; // Center the image
                doc.addImage(validBase64, validBase64.startsWith('data:image/png') ? 'PNG' : 'JPEG', 
                  xPosition, currentY, imgWidth, imgHeight);
                currentY += imgHeight + 5;
                imagesOnPage++;
                resolve();
              };
              imgObj.onerror = reject;
            });
          } else {
            addTextSection('Invalid photo data', 5, 10, 'normal', 'center');
            currentY += 5;
          }
        } catch (err) {
          console.error(`Error adding photo ${index + 1}:`, err.message);
          addTextSection('Error loading photo', 5, 10, 'normal', 'center');
          currentY += 5;
        }
      }
      currentY += 5;
    }

    // Permission Image
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

    // Attendance Images
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
    throw err;
  }
};