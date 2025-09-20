import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SDG_DEFINITIONS } from './sdgDefinitions';

// Convert Buffer-like objects (e.g., {type:"Buffer", data:[...]}) to base64 string
function bufferToBase64(input) {
  if (!input) return null;
  if (typeof input === "string") return input;
  if (typeof input === "object" && input.data && Array.isArray(input.data)) {
    const binaryString = input.data.map(byte => String.fromCharCode(byte)).join('');
    return btoa(binaryString);
  }
  return null;
}

// Ensures a string is a data:image base64 URL and adds prefix if missing
const validateBase64 = (str, mime = "image/jpeg") => {
  if (!str || typeof str !== "string") {
    console.warn('Invalid base64: not a string or empty', str);
    return null;
  }
  if (str.startsWith("data:image")) return str;
  return `data:${mime};base64,${str}`;
};

// Fetch static image (logo) from URL and convert to base64 data URL
const fetchBase64FromUrl = async (url, mime = "image/png") => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('Error fetching image from URL:', err.message);
    return null;
  }
};

// Detect image type by base64 prefix
const detectImageType = (base64String) => {
  if (!base64String) return null;
  if (base64String.startsWith("data:image/png")) return "PNG";
  if (base64String.startsWith("data:image/jpeg")) return "JPEG";
  return "JPEG"; // Fallback
};

export const generateAnnualPDF = async (clubName, academicYear, reports) => {
  if (!reports || !Array.isArray(reports)) {
    console.error('Invalid reports: not an array', reports);
    throw new Error('Invalid or missing reports data');
  }

  console.log('Input reports:', JSON.stringify(reports, null, 2));

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
  const posterWidth = 120;
  const posterHeight = 150;
  const largeImageWidth = 180;
  const largeImageHeight = 240;
  const logoWidth = 25;
  let logoHeight = 50;
  let currentY = marginTop;

  const indexEntries = [];

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
  let logoY = marginTop;
  try {
    const logoBase64 = await fetchBase64FromUrl('/WITlogo.png', 'image/png');
    const img = new window.Image();
    img.src = logoBase64;
    await new Promise((resolve, reject) => {
      img.onload = () => {
        logoHeight = (img.height / img.width) * logoWidth;
        console.log(`Adding logo, format: PNG, width: ${logoWidth}, height: ${logoHeight}`);
        doc.addImage(logoBase64, 'PNG', (pageWidth - logoWidth) / 2, logoY, logoWidth, logoHeight);
        currentY = logoY + logoHeight + 10;
        resolve();
      };
      img.onerror = () => {
        console.error('Failed to load logo');
        currentY = logoY + 10;
        resolve();
      };
    });
  } catch (err) {
    console.error('Error adding logo:', err.message);
    currentY = logoY + 10;
  }

  // Cover text
  addTextSection('S. A. P. D. Jain Pathashala’s', 0, 12, 'normal', 'center');
  currentY += 2;
  addTextSection('Walchand Institute of Technology, Solapur', 0, 14, 'bold', 'center');
  currentY += 2;
  addTextSection('An Autonomous Institute', 0, 12, 'normal', 'center');
  currentY += 2;
  addTextSection(`Department of ${reports[0]?.department || 'N/A'}`, 0, 12, 'bold', 'center');
  currentY += 5;
  addTextSection(`${clubName} ${academicYear}`, 0, 20, 'bold', 'center');

  // Separator line
  currentY += 8;
  doc.setLineWidth(0.5);
  doc.line(marginLeft, currentY, pageWidth - marginLeft, currentY);
  currentY += 12;

  // Index heading
  addTextSection('Index', 0, 18, 'bold', 'center');
  currentY += 8;

  const indexStartPage = doc.internal.getNumberOfPages();
  const indexHeadingBottom = currentY;
  const paddingAfterLogo = 10;
  const logoBottom = (typeof logoHeight === 'number' && logoHeight > 0) ? (logoY + logoHeight + paddingAfterLogo) : 0;
  const safeStartY = Math.max(indexHeadingBottom, logoBottom) + 6;

  // Process each report
  for (let i = 0; i < reports.length; i++) {
    const report = reports[i];
    const effectiveEventType = report.eventType === 'Other' ? (report.customEventType || 'Other') : (report.eventType || 'N/A');
    doc.addPage();
    currentY = marginTop;

    const eventStartPage = doc.internal.getNumberOfPages();
    indexEntries.push([
      i + 1,
      { content: report.eventName || 'Untitled', styles: { fontStyle: 'bold' } },
      report.date || report.dateFrom || '-',
      eventStartPage,
    ]);

    addTextSection(`Event: ${report.eventName || 'N/A'}`, 0, 18, 'bold', 'center');
    currentY += 8;
  doc.setLineWidth(0.5);
  doc.line(marginLeft, currentY, pageWidth - marginLeft, currentY);
  currentY += 8;

    // Poster
    if (report.poster) {
      addNewPageIfNeeded(posterHeight + 15);
      addTextSection('Event Poster:', 0, 12, 'italic', 'center');
      currentY += 2;
      try {
        const base64Str = bufferToBase64(report.poster);
        const validBase64 = validateBase64(base64Str, "image/jpeg");
        console.log(`Poster for ${report.eventName} base64:`, validBase64?.substring(0, 50));
        if (validBase64) {
          const imgType = detectImageType(validBase64);
          doc.addImage(validBase64, imgType, pageWidth / 2 - posterWidth / 2, currentY, posterWidth, posterHeight);
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

    currentY += 10;
    // Detailed Report
    addNewPageIfNeeded(20);
    addTextSection('Detailed Report', 0, 16, 'bold', 'center');
    currentY += 5;

    addTextSection('Overview:', 0, 14, 'bold', 'left');
    currentY += 5;
    addTextSection(`Academic Year: ${report.academicYear || 'N/A'}`, 5, 12, 'bold', 'left');
    addTextSection(`Event Name: ${report.eventName || 'N/A'}`, 5, 12, 'bold', 'left');
    addTextSection(`Organized by: ${report.organizedBy || 'N/A'}`, 5, 12, 'bold', 'left');
    addTextSection(`Department: ${report.department || 'N/A'}`, 5, 12, 'bold', 'left');
    addTextSection(
      `Date: ${report.tenure === '1 Day' ? report.date || 'N/A' : `${report.dateFrom || 'N/A'} to ${report.dateTo || 'N/A'}`}`,
      5, 12, 'bold', 'left'
    );
    addTextSection(`Time: ${report.timeFrom || 'N/A'} to ${report.timeTo || 'N/A'}`, 5, 12, 'bold', 'left');
    addTextSection(`Venue: ${report.venue || 'N/A'}`, 5, 12, 'bold', 'left');
    currentY += 10;

    doc.addPage();
    currentY = marginTop;

    // Objectives
    if (report.objectives && report.objectives?.length > 0) {
      addNewPageIfNeeded(20);
      addTextSection('Objectives:', 0, 14, 'bold', 'left');
      currentY += 5;
      report.objectives.forEach((obj, index) => {
        if (obj) addTextSection(`${index + 1}. ${obj}`, 5, 12, 'normal', 'justify');
      });
      currentY += 10;
    }

    // Outcomes
    if (report.outcomes && report.outcomes?.length > 0) {
      addNewPageIfNeeded(20);
      addTextSection('Outcomes:', 0, 14, 'bold', 'left');
      currentY += 5;
      report.outcomes.forEach((outcome, index) => {
        if (outcome) addTextSection(`${index + 1}. ${outcome}`, 5, 12, 'normal', 'justify');
      });
      currentY += 10;
    }

        if (report.sdgs && report.sdgs.length > 0) {
          addNewPageIfNeeded(20);
          addTextSection('Sustainable Development Goals:', 0, 14, 'bold', 'left');
          currentY += 5;
    
          report.sdgs.forEach((sdgTitle, index) => {
            const definition = SDG_DEFINITIONS[sdgTitle] || 'No definition available.';
            addTextSection(`${index + 1}. ${sdgTitle}`, 5, 12, 'bold', 'left');
            addTextSection(definition, 10, 12, 'normal', 'justify');
            currentY += 5; // Extra space between SDGs
          });
        }

    // Student Coordinators
    if (report.studentCoordinators && report.studentCoordinators?.length > 0) {
      addNewPageIfNeeded(20);
      addTextSection('Student Coordinators:', 0, 14, 'bold', 'left');
      currentY += 5;
      report.studentCoordinators.forEach((coordinator, index) => {
        if (coordinator) addTextSection(`${index + 1}. ${coordinator}`, 5, 12, 'normal', 'justify');
      });
      currentY += 10;
    }

    // Faculty Coordinators
    if (report.facultyCoordinators && report.facultyCoordinators?.length > 0) {
      addNewPageIfNeeded(20);
      addTextSection('Faculty Coordinators:', 0, 14, 'bold', 'left');
      currentY += 5;
      report.facultyCoordinators.forEach((coordinator, index) => {
        if (coordinator) addTextSection(`${index + 1}. ${coordinator}`, 5, 12, 'normal', 'justify');
      });
      currentY += 10;
    }


    // Summary
    if (report.summary) {
      addNewPageIfNeeded(20);
      addTextSection(`${effectiveEventType} Summary:`, 0, 14, 'bold', 'left');
      currentY += 5;
      addTextSection(report.summary, 5, 12, 'normal', 'justify');
      currentY += 10;
    }

    // Speakers
    if (report.speakers && report.speakers?.length > 0) {
      addNewPageIfNeeded(20);
      addTextSection('Speakers:', 0, 14, 'bold', 'left');
      currentY += 5;
      report.speakers.forEach((speaker, index) => {
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
    addTextSection(`Total: ${report.totalParticipants || 'N/A'}`, 5, 12, 'normal', 'left');
    addTextSection(`Female: ${report.femaleParticipants || 'N/A'}`, 5, 12, 'normal', 'left');
    addTextSection(`Male: ${report.maleParticipants || 'N/A'}`, 5, 12, 'normal', 'left');
    addTextSection(`Type: ${effectiveEventType}`, 5, 12, 'bold', 'left');
    currentY += 10;

    doc.addPage();
    currentY = marginTop;

    // Feedback
    if (report.feedback) {
      console.log('Feedback data:', JSON.stringify(report.feedback, null, 2));
      addNewPageIfNeeded(20);
      addTextSection('Feedback:', 0, 14, 'bold', 'center');
      currentY += 10;
      if (!report.feedback || report.feedback.length === 0) {
        addTextSection('No feedback available', 5, 12, 'normal', 'justify');
        currentY += 10;
      } else {
        for (const [index, fb] of report.feedback.entries()) {
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
              addNewPageIfNeeded(analyticsHeight + 10);
              addTextSection(`Feedback Analytics ${index + 1}:`, 5, 12, 'italic', 'center');
              try {
                const base64Str = bufferToBase64(fb.analytics);
                const analyticsBase64 = validateBase64(base64Str, "image/png");
                console.log(`Analytics image ${index + 1} base64:`, analyticsBase64?.substring(0, 50));
                if (analyticsBase64) {
                    const imgType = detectImageType(analyticsBase64);

                    // Create Image object to get natural size
                    const img = new Image();
                    img.src = analyticsBase64;

                    await new Promise((resolve, reject) => {
                      img.onload = () => {
                        const naturalWidth = img.width;
                        const naturalHeight = img.height;

                        // Maintain aspect ratio within given bounds
                        let drawWidth = analyticsWidth;
                        let drawHeight = (naturalHeight / naturalWidth) * drawWidth;

                        if (drawHeight > analyticsHeight) {
                          drawHeight = analyticsHeight;
                          drawWidth = (naturalWidth / naturalHeight) * drawHeight;
                        }

                        // Center horizontally
                        const xPos = pageWidth / 2 - drawWidth / 2;

                        doc.addImage(analyticsBase64, imgType, xPos, currentY, drawWidth, drawHeight);
                        currentY += drawHeight + 5;

                        resolve();
                      };
                      img.onerror = reject;
                    });
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
      console.log('No feedback data in report');
      addNewPageIfNeeded(20);
      addTextSection('Feedback: None', 0, 14, 'bold', 'center');
      currentY += 10;
    }


    
    // Photographs
    if (reports.photographs && report.photographs?.length > 0) {
       doc.addPage();
       currentY = marginTop;
      addNewPageIfNeeded(20);
      addTextSection('Photographs:', 0, 14, 'bold', 'center');
      currentY += 5;
      let imagesOnPage = 0;
      for (const [index, img] of report.photographs.entries()) {
        if (imagesOnPage >= 3) {
          doc.addPage();
          currentY = marginTop;
          imagesOnPage = 0;
        }
        try {
          const base64Str = bufferToBase64(img);
          const validBase64 = validateBase64(base64Str, "image/jpeg");
          console.log(`Photograph ${index + 1} base64:`, validBase64?.substring(0, 50));
          if (validBase64) {
            const imgObj = new Image();
            imgObj.src = validBase64;
            await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => reject(new Error(`Photograph ${index + 1} load timeout`)), 5000);
              imgObj.onload = () => {
                clearTimeout(timeout);
                let imgWidth = imgObj.width / 2.83465;
                let imgHeight = imgObj.height / 2.83465;
                const maxWidth = 60;
                const maxHeight = 80;
                if (imgWidth > maxWidth || imgHeight > maxHeight) {
                  const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
                  imgWidth *= ratio;
                  imgHeight *= ratio;
                }
                console.log(`Photograph ${index + 1} dimensions: ${imgWidth}x${imgHeight} mm`);
                if (addNewPageIfNeeded(imgHeight + 15)) {
                  imagesOnPage = 0;
                }
                addTextSection(`Photograph ${index + 1}:`, 5, 12, 'italic', 'center');
                const xPosition = pageWidth / 2 - imgWidth / 2;
                const imgType = detectImageType(validBase64);
                doc.addImage(validBase64, imgType, xPosition, currentY, imgWidth, imgHeight);
                currentY += imgHeight + 5;
                imagesOnPage++;
                resolve();
              };
              imgObj.onerror = () => {
                clearTimeout(timeout);
                reject(new Error(`Photograph ${index + 1} load error`));
              };
            });
          } else {
            addTextSection('Invalid photo data', 5, 10, 'normal', 'center');
            currentY += 5;
          }
        } catch (err) {
          console.error(`Error adding photo ${index + 1}:`, err.message);
          addTextSection(`Error loading photo ${index + 1}: ${err.message}`, 5, 10, 'normal', 'center');
          currentY += 5;
        }
      }
      currentY += 5;
    }

    // Permission Image
    if (report.permissionImage) {
      doc.addPage();
      currentY = marginTop;
      addTextSection('Permission Image:', 0, 14, 'bold', 'center');
      currentY += 5;
      try {
        const base64Str = bufferToBase64(report.permissionImage);
        const validBase64 = validateBase64(base64Str, "image/jpeg");
        console.log(`Permission image base64:`, validBase64?.substring(0, 50));
        if (validBase64) {
          const imgType = detectImageType(validBase64);
          doc.addImage(validBase64, imgType, pageWidth / 2 - largeImageWidth / 2, currentY, largeImageWidth, largeImageHeight);
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
    if (report.attendance && report.attendance?.length > 0) {
      for (const [index, img] of report.attendance.entries()) {
        doc.addPage();
        currentY = marginTop;
        addTextSection(`Attendance Image ${index + 1}:`, 0, 14, 'bold', 'center');
        currentY += 5;
        try {
          const base64Str = bufferToBase64(img);
          const validBase64 = validateBase64(base64Str, "image/jpeg");
          console.log(`Attendance image ${index + 1} base64:`, validBase64?.substring(0, 50));
          if (validBase64) {
            const imgType = detectImageType(validBase64);
            doc.addImage(validBase64, imgType, pageWidth / 2 - largeImageWidth / 2, currentY, largeImageWidth, largeImageHeight);
            currentY += largeImageHeight + 5;
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
  }

  // Finalize Index
  doc.setPage(indexStartPage);
  autoTable(doc, {
    head: [['S.No.', 'Event Name', 'Date', 'Page No.']],
    body: indexEntries,
    startY: safeStartY,
    margin: { left: marginLeft, right: marginLeft },
    theme: 'grid',
    styles: {
      fontStyle: 'bold',
      textColor: 'black',
      fontSize: 12,
      lineWidth: 0.2,
      lineColor: 'black',
      halign: 'center'
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: 'black',
      fontStyle: 'bold',
      halign: 'center',
      lineWidth: 0.2,
      lineColor: 'black'
    },
    bodyStyles: {
      fontStyle: 'bold',
      textColor: 'black',
      lineWidth: 0.2,
      lineColor: 'black'
    },
  });

   // Add page numbers to all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  try {
    doc.save(`${clubName.replace(/\s/g, '_')}_${academicYear}_Annual_Report.pdf`);
  } catch (err) {
    console.error('Error saving PDF:', err.message);
    throw err;
  }
};