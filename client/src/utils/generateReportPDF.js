import jsPDF from "jspdf";

export const validateBase64 = (str) => {
  return /^data:image\/(jpeg|png);base64,/.test(str) ? str : null;
};

export const generateReportPDF = async (reportData) => {
  const doc = new jsPDF();

  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 15;
  const marginTop = 15;
  const marginBottom = 15;
  const maxWidth = pageWidth - 2 * marginLeft;
  const lineHeight = 6;
  const logoWidth = 25;
  const posterWidth = 120;
  const posterHeight = 150;
  const largeImageWidth = 180;
  const largeImageHeight = 240;
  const analyticsWidth = 110;
  const analyticsHeight = 100;

  let currentY = marginTop;

  const addNewPageIfNeeded = (additionalHeight) => {
    if (currentY + additionalHeight > pageHeight - marginBottom) {
      doc.addPage();
      currentY = marginTop;
      doc.setFont("times", "normal");
      doc.setFontSize(12);
      return true;
    }
    return false;
  };

  const addTextSection = (text, indent = 0, fontSize = 12, style = "normal", align = "left") => {
    doc.setFontSize(fontSize);
    doc.setFont("times", style);
    const lines = doc.splitTextToSize(text || "N/A", maxWidth - indent);
    lines.forEach((line) => {
      addNewPageIfNeeded(lineHeight);
      doc.text(line, align === "center" ? pageWidth / 2 : marginLeft + indent, currentY, { align });
      currentY += lineHeight;
    });
  };

  // ✅ Load logo image from public folder
  const logoImg = new Image();
  logoImg.src = "/WITlogo.png";

  try {
    await new Promise((resolve, reject) => {
      logoImg.onload = resolve;
      logoImg.onerror = reject;
    });

    const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
    doc.addImage(logoImg, "PNG", (pageWidth - logoWidth) / 2, currentY, logoWidth, logoHeight);
    currentY += logoHeight + 10;
  } catch (err) {
    console.error("Failed to load logo:", err);
    currentY += 10;
  }

  addTextSection("S. A. P. D. Jain Pathashala’s", 0, 12, "normal", "center");
  addTextSection("Walchand Institute of Technology, Solapur", 0, 14, "bold", "center");
  addTextSection("An Autonomous Institute", 0, 12, "normal", "center");
  addTextSection(`Department of ${reportData.department || "N/A"}`, 0, 12, "bold", "center");

  doc.setLineWidth(0.5);
  addNewPageIfNeeded(10);
  doc.line(marginLeft, currentY, pageWidth - marginLeft, currentY);
  currentY += 10;

  addTextSection(`Event: ${reportData.eventName || "N/A"}`, 0, 12, "bold", "center");
  addTextSection(`Organized by: ${reportData.organizedBy || "N/A"}`, 0, 12, "bold", "center");
  currentY += 5;

  if (reportData.poster) {
    addNewPageIfNeeded(posterHeight + 20);
    addTextSection("Event Poster:", 0, 12, "italic", "center");
    try {
      const validBase64 = validateBase64(reportData.poster);
      if (validBase64) {
        doc.addImage(validBase64, validBase64.startsWith("data:image/png") ? "PNG" : "JPEG", (pageWidth - posterWidth) / 2, currentY, posterWidth, posterHeight);
        currentY += posterHeight + 10;
      }
    } catch {
      addTextSection("Unable to load poster image", 0, 10, "normal", "center");
      currentY += 10;
    }
  } else {
    addTextSection("Poster Unavailable", 0, 10, "normal", "center");
    currentY += 10;
  }

  doc.addPage();
  currentY = marginTop;

  if (reportData.objectives?.length) {
    addTextSection("Objectives:", 0, 14, "bold");
    reportData.objectives.forEach((obj, idx) => {
      addTextSection(`${idx + 1}. ${obj}`, 5);
    });
    currentY += 10;
  }

  if (reportData.outcomes?.length) {
    addTextSection("Outcomes:", 0, 14, "bold");
    reportData.outcomes.forEach((out, idx) => {
      addTextSection(`${idx + 1}. ${out}`, 5);
    });
    currentY += 10;
  }

  addTextSection("Detailed Report", 0, 16, "bold", "center");
  currentY += 10;

  addTextSection("Overview:", 0, 14, "bold");
  addTextSection(`Academic Year: ${reportData.academicYear || "N/A"}`, 5, 12, "bold");
  addTextSection(`Event Name: ${reportData.eventName || "N/A"}`, 5, 12, "bold");
  addTextSection(`Organized by: ${reportData.organizedBy || "N/A"}`, 5, 12, "bold");
  addTextSection(`Department: ${reportData.department || "N/A"}`, 5, 12, "bold");
  addTextSection(`Date: ${reportData.date || "N/A"}`, 5, 12, "bold");
  addTextSection(`Time: ${reportData.timeFrom || "N/A"} to ${reportData.timeTo || "N/A"}`, 5, 12, "bold");
  addTextSection(`Venue: ${reportData.venue || "N/A"}`, 5, 12, "bold");
  currentY += 10;

  if (reportData.summary) {
    addTextSection(`${reportData.eventType || "Event"} Summary:`, 0, 14, "bold");
    addTextSection(reportData.summary, 5);
    currentY += 10;
  }

  if (reportData.speakers?.length) {
    addTextSection("Speakers:", 0, 14, "bold");
    reportData.speakers.forEach((sp, idx) => {
      if (sp.name) {
        addTextSection(`${idx + 1}. ${sp.name}`, 5, 12, "bold");
        if (sp.background) {
          addTextSection(`Background: ${sp.background}`, 10);
        }
      }
    });
    currentY += 10;
  }

  addTextSection("Participants:", 0, 14, "bold");
  addTextSection(`Total: ${reportData.totalParticipants || "N/A"}`, 5);
  addTextSection(`Female: ${reportData.femaleParticipants || "N/A"}`, 5);
  addTextSection(`Male: ${reportData.maleParticipants || "N/A"}`, 5);
  addTextSection(`Type: ${reportData.eventType || "N/A"}`, 5);
  currentY += 10;

  doc.addPage();
  currentY = marginTop;

  if (reportData.feedback?.length) {
    addTextSection("Feedback:", 0, 14, "bold", "center");
    currentY += 10;

    for (const [idx, fb] of reportData.feedback.entries()) {
      addTextSection(`Question ${idx + 1}: ${fb.question || "N/A"}`, 5);
      addTextSection(`Answer: ${fb.answer || "N/A"}`, 5);

      if (fb.analytics) {
        addNewPageIfNeeded(analyticsHeight + 15);
        addTextSection(`Feedback Analytics ${idx + 1}:`, 5, 12, "italic");
        try {
          const validBase64 = validateBase64(fb.analytics);
          if (validBase64) {
            doc.addImage(validBase64, validBase64.startsWith("data:image/png") ? "PNG" : "JPEG", (pageWidth - analyticsWidth) / 2, currentY, analyticsWidth, analyticsHeight);
            currentY += analyticsHeight + 10;
          } else {
            addTextSection("No valid feedback analytics image available", 5, 10);
            currentY += 10;
          }
        } catch {
          addTextSection("Error loading feedback analytics image", 5, 10);
          currentY += 10;
        }
      }

      currentY += 5;
    }
  } else {
    addTextSection("Feedback: None", 0, 14, "bold");
  }

  if (reportData.photographs?.length) {
    doc.addPage();
    currentY = marginTop;
    addTextSection("Photographs:", 0, 14, "bold", "center");
    currentY += 5;

    let imagesOnPage = 0;
    for (const [idx, photo] of reportData.photographs.entries()) {
      try {
        const validBase64 = validateBase64(photo);
        if (validBase64) {
          const tempImg = new Image();
          tempImg.src = validBase64;

          await new Promise((resolve, reject) => {
            tempImg.onload = resolve;
            tempImg.onerror = reject;
          });

          const imgWidth = tempImg.width / 2.83465;
          const imgHeight = tempImg.height / 2.83465;

          if (addNewPageIfNeeded(imgHeight + 15)) imagesOnPage = 0;

          addTextSection(`Photograph ${idx + 1}:`, 5, 12, "italic");
          doc.addImage(validBase64, validBase64.startsWith("data:image/png") ? "PNG" : "JPEG", (pageWidth - imgWidth) / 2, currentY, imgWidth, imgHeight);

          currentY += imgHeight + 10;
          imagesOnPage++;
          if (imagesOnPage >= 3) {
            doc.addPage();
            currentY = marginTop;
            imagesOnPage = 0;
          }
        }
      } catch {
        addTextSection(`Error loading photograph ${idx + 1}`, 5, 10);
        currentY += 10;
      }
    }
  }

  if (reportData.permissionImage) {
    doc.addPage();
    currentY = marginTop;
    addTextSection("Permission Image:", 0, 14, "bold", "center");
    currentY += 5;
    try {
      const validBase64 = validateBase64(reportData.permissionImage);
      if (validBase64) {
        doc.addImage(validBase64, validBase64.startsWith("data:image/png") ? "PNG" : "JPEG", (pageWidth - largeImageWidth) / 2, currentY, largeImageWidth, largeImageHeight);
        currentY += largeImageHeight + 10;
      } else {
        addTextSection("Invalid permission image data", 5, 10);
        currentY += 10;
      }
    } catch {
      addTextSection("Error loading permission image", 5, 10);
      currentY += 10;
    }
  }

  if (reportData.attendance?.length) {
    for (const [idx, att] of reportData.attendance.entries()) {
      doc.addPage();
      currentY = marginTop;
      addTextSection(`Attendance Image ${idx + 1}:`, 0, 14, "bold", "center");
      currentY += 5;
      try {
        const validBase64 = validateBase64(att);
        if (validBase64) {
          doc.addImage(validBase64, validBase64.startsWith("data:image/png") ? "PNG" : "JPEG", (pageWidth - largeImageWidth) / 2, currentY, largeImageWidth, largeImageHeight);
          currentY += largeImageHeight + 10;
        } else {
          addTextSection("Invalid attendance image data", 5, 10);
          currentY += 10;
        }
      } catch {
        addTextSection("Error loading attendance image", 5, 10);
        currentY += 10;
      }
    }
  }

  const filename = `${(reportData.eventName || "report").replace(/\s+/g, "_")}.pdf`;
  doc.save(filename);
};
