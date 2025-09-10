import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Convert Buffer-like objects (e.g., {type:"Buffer", data:[...]}) to base64 string in browser
function bufferToBase64(input) {
  if (!input) return null;
  if (typeof input === "string") return input; // Already string
  if (typeof input === "object" && input.data && Array.isArray(input.data)) {
    const binaryString = input.data.map(byte => String.fromCharCode(byte)).join('');
    return btoa(binaryString);
  }
  return null;
}

// Ensures a string is a data:image base64 URL and adds prefix if missing
export const validateBase64 = (str, mime = "image/jpeg") => {
  if (!str || typeof str !== "string") return null;
  if (str.startsWith("data:image")) return str;
  return `data:${mime};base64,${str}`;
};

// Fetch static image (logo) from url and convert to base64 data URL
export const fetchBase64FromUrl = async (url, mime = "image/png") => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Detect image type by base64 prefix
const detectImageType = (base64String) => {
  if (!base64String) return null;
  if (base64String.startsWith("data:image/png")) return "PNG";
  if (base64String.startsWith("data:image/jpeg")) return "JPEG";
  return "JPEG"; // fallback
};

export const generateAnnualPDF = async (clubName, academicYear, reports) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 15;
  const marginTop = 20;
  const marginBottom = 20;
  const lineHeight = 7;
  let currentY = marginTop;

  const indexEntries = [];

  const addNewPageIfNeeded = (additionalHeight) => {
    if (currentY + additionalHeight > pageHeight - marginBottom) {
      doc.addPage();
      currentY = marginTop;
      return true;
    }
    return false;
  };

  const addTextSection = (text, indent = 0, fontSize = 12, style = 'normal', align = 'left') => {
    doc.setFontSize(fontSize);
    doc.setFont('times', style);
    const lines = doc.splitTextToSize(text || 'N/A', pageWidth - 2 * marginLeft - indent);
    lines.forEach((line) => {
      addNewPageIfNeeded(lineHeight);
      doc.text(line, align === 'center' ? pageWidth / 2 : marginLeft + indent, currentY, { align });
      currentY += lineHeight;
    });
  };

 
// --- COVER (draw logo and headings) ---
let logoY = marginTop;
let logoHeight = 0;

try {
  const logoBase64 = await fetchBase64FromUrl('/WITlogo.png', 'image/png');
  const logoWidth = 40; // in doc units
  const img = new window.Image();
  img.src = logoBase64;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  // remember where we place the image
  logoY = currentY;
  logoHeight = (img.height / img.width) * logoWidth;
  doc.addImage(logoBase64, 'PNG', (pageWidth - logoWidth) / 2, logoY, logoWidth, logoHeight);

  // move cursor below the image
  currentY = logoY + logoHeight + 15;
} catch (err) {
  console.warn('Logo load failed:', err?.message || err);
  // still leave some room for the heading if logo fails
  currentY += 10;
}

// Cover text
addTextSection("S. A. P. D. Jain Pathashala’s", 0, 12, 'normal', 'center');
addTextSection("Walchand Institute of Technology, Solapur", 0, 16, 'bold', 'center');
addTextSection("An Autonomous Institute", 0, 12, 'normal', 'center');
addTextSection(`${reports[0]?.department || "Department Name Not Provided"}`, 0, 14, "bold", "center");
addTextSection(`${clubName} ${academicYear}`, 0, 20, 'bold', 'center');

// Separator line (below the cover text)
currentY += 8;
doc.setLineWidth(0.5);
doc.line(marginLeft, currentY, pageWidth - marginLeft, currentY);
currentY += 12; // space after line

// Index heading on same page
addTextSection('Index', 0, 18, 'bold', 'center');
currentY += 8;

// capture where Index should start on this page (safeStartY computed next)
const indexStartPage = doc.internal.getNumberOfPages();
const indexHeadingBottom = currentY; // bottom of the "Index" heading

// compute safeStartY (force it to be below the logo image and below the heading)
const paddingAfterLogo = 10; // extra space after logo
const logoBottom = (typeof logoHeight === 'number' && logoHeight > 0) ? (logoY + logoHeight + paddingAfterLogo) : 0;
const safeStartY = Math.max(indexHeadingBottom, logoBottom) + 6; // final padding before table


  // ===== 3. EVENT DETAILS =====
  for (let i = 0; i < reports.length; i++) {
    const report = reports[i];
    doc.addPage();
    currentY = marginTop;

    const eventStartPage = doc.internal.getNumberOfPages();
    
indexEntries.push([
  i + 1,                                // Sr.No.
  { content: report.eventName || 'Untitled', styles: { fontStyle: 'bold' } }, // Event in bold
  report.date || report.dateFrom || '-', // Date
  eventStartPage,                       // Page No.
]);


    addTextSection(`Event: ${report.eventName || 'Untitled'}`, 0, 14, 'bold');
    addTextSection(`Organized by: ${report.organizedBy || 'N/A'}`, 0, 12, 'bold');
    addTextSection(`Academic Year: ${report.academicYear || 'N/A'}`, 0, 12, 'bold');

    // Poster (may be Buffer-like)
    if (report.poster) {
      const base64Str = bufferToBase64(report.poster);
      const validBase64 = validateBase64(base64Str, "image/jpeg");
      console.log(`Poster for ${report.eventName} base64 preview:`, validBase64?.substring(0, 50));
      if (validBase64) {
        try {
          const imgType = detectImageType(validBase64);
          doc.addImage(validBase64, imgType, marginLeft, currentY, 120, 120);
          console.log("Poster image added at Y:", currentY);
          currentY += 135;
        } catch (err) {
          console.error("Failed to add poster image:", err);
        }
      }
    }
     if (report.objectives?.length > 0) {
      addNewPageIfNeeded(20);
      addTextSection('Objectives:', 0, 14, 'bold', 'left');
      currentY += 5;
      report.objectives.forEach((obj, index) => {
        if (obj) addTextSection(`${index + 1}. ${obj}`, 5, 12, 'normal', 'justify');
      });
      currentY += 10;
    }

    // Outcomes
    if (report.outcomes?.length > 0) {
      addNewPageIfNeeded(20);
      addTextSection('Outcomes:', 0, 14, 'bold', 'left');
      currentY += 5;
      report.outcomes.forEach((outcome, index) => {
        if (outcome) addTextSection(`${index + 1}. ${outcome}`, 5, 12, 'normal', 'justify');
      });
      currentY += 10;
    }
   // Detailed Report
    addNewPageIfNeeded(20);
    addTextSection('Detailed Report', 0, 16, 'bold', 'center');
    currentY += 10;

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

    // Summary
    if (report.summary) {
      addNewPageIfNeeded(20);
      //addTextSection(`${effectiveEventType || 'Event'} Summary:`, 0, 14, 'bold', 'left');
      currentY += 5;
      addTextSection(report.summary, 5, 12, 'normal', 'justify');
      currentY += 10;
    }
    // Speakers
    if (report.speakers?.length > 0) {
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
    //addTextSection(`Type: ${effectiveEventType || 'N/A'}`, 5, 12, 'bold', 'left');
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
          
              addTextSection(`Feedback Analytics ${index + 1}:`, 5, 12, 'italic', 'center');
              try {
                const analyticsBase64 = validateBase64(fb.analytics);
                if (analyticsBase64) {
                  const format = analyticsBase64.startsWith('data:image/png') ? 'PNG' : 'JPEG';
                  doc.addImage(analyticsBase64, format, pageWidth / 2 - analyticsWidth / 2, currentY, analyticsWidth, analyticsHeight);
                  currentY += analyticsHeight + 5;
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


    // Photographs (array)
    if (report.photographs?.length) {
      for (const [idx, imgData] of report.photographs.entries()) {
        const base64Str = bufferToBase64(imgData);
        const validBase64 = validateBase64(base64Str, "image/jpeg");
        console.log(`Photograph ${idx + 1} for event ${report.eventName} preview:`, validBase64?.substring(0, 50));
        if (validBase64) {
          try {
            const imgType = detectImageType(validBase64);
            doc.addImage(validBase64, imgType, marginLeft, currentY, 120, 80);
            console.log(`Photograph ${idx + 1} added at Y:`, currentY);
            currentY += 90;
          } catch (err) {
            console.error(`Failed to add photograph ${idx + 1}:`, err);
          }
        }
      }
    }

    // Attendance images
    if (report.attendance?.length) {
      addTextSection('Attendance:', 0, 14, 'bold');
      for (const [idx, imgData] of report.attendance.entries()) {
        const base64Str = bufferToBase64(imgData);
        const validBase64 = validateBase64(base64Str, "image/jpeg");
        console.log(`Attendance image ${idx + 1} for event ${report.eventName} preview:`, validBase64?.substring(0, 50));
        if (validBase64) {
          try {
            addNewPageIfNeeded(240);
            const imgType = detectImageType(validBase64);
            doc.addImage(validBase64, imgType, marginLeft, currentY, 180, 230);
            console.log(`Attendance image ${idx + 1} added at Y:`, currentY);
            currentY += 240;
          } catch (err) {
            console.error(`Failed to add attendance image ${idx + 1}:`, err);
          }
        }
      }
    }

    // Permission image
    if (report.permissionImage) {
      const base64Str = bufferToBase64(report.permissionImage);
      const validBase64 = validateBase64(base64Str, "image/jpeg");
      console.log(`Permission image for event ${report.eventName} preview:`, validBase64?.substring(0, 50));
      if (validBase64) {
        try {
          addNewPageIfNeeded(240);
          const imgType = detectImageType(validBase64);
          doc.addImage(validBase64, imgType, marginLeft, currentY, 180, 230);
          console.log("Permission image added at Y:", currentY);
          currentY += 240;
        } catch (err) {
          console.error("Failed to add permission image:", err);
        }
      }
    }
  }



// ===== 4. FINALIZE INDEX =====
doc.setPage(indexStartPage);
autoTable(doc, {
  head: [['S.No.', 'Event Name', 'Date', 'Page No.']],
  body: indexEntries,
  startY: safeStartY,
  margin: { left: marginLeft, right: marginLeft },
  theme: 'grid',   // ensure borders for all cells
  styles: { 
    fontStyle: 'bold',
    textColor: 'black',
    fontSize: 12,
    lineWidth: 0.2,        // border thickness
    lineColor: 'black',    // border color
    halign: 'center'
  },
  headStyles: { 
    fillColor: [240, 240, 240], // light gray header bg
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



doc.save(`${clubName}_${academicYear}_Annual_Report.pdf`);
};