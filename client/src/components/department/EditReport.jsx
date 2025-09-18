import { useEffect, useState, useContext } from "react";
import React from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "../../styles/CreateReport.css";




const emptySpeaker = { name: "", background: "" };
const emptyFeedback = { question: "", answer: "", analytics: null };

function EditReport() {
  const { user } = useContext(AuthContext) || {};
  const { reportId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    department: user?.department || "",
    academicYear: "2024-25",
    organizedBy: "",
    eventName: "",
    tenure: "1 Day",
    date: "",
    dateFrom: "",
    dateTo: "",
    timeFrom: "",
    timeTo: "",
    venue: "",
    poster: null,
    objectives: [""],
    outcomes: [""],
    studentCoordinators: [""],
    facultyCoordinators: [""],
    totalParticipants: "",
    femaleParticipants: "",
    maleParticipants: "",
    eventType: "Session",
    customEventType: "",
    summary: "",
    attendance: [],
    permissionImage: null,
    speakers: [emptySpeaker],
    feedback: [emptyFeedback],
    photographs: [],
  });

  const [previews, setPreviews] = useState({
    poster: null,
    permissionImage: null,
    attendance: [],
    photographs: [],
    feedback: [],
  });
  const [existingFiles, setExistingFiles] = useState({
    poster: null,
    permissionImage: null,
    attendance: [],
    photographs: [],
    feedback: [],
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found.");
        console.log("Fetching report with ID:", reportId);
        const res = await axios.get(
          `http://localhost:3001/api/reports?reportId=${reportId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = res.data;

        if (!data || Object.keys(data).length === 0) {
          throw new Error("Empty or invalid report data received.");
        }

        setFormData({
          department: data.department?._id || user?.department || "",
          academicYear: data.academicYear || "2024-25",
          organizedBy: data.organizedBy || "",
          eventName: data.eventName || "",
          tenure: data.tenure || "1 Day",
          date: data.date || "",
          dateFrom: data.dateFrom || "",
          dateTo: data.dateTo || "",
          timeFrom: data.timeFrom || "",
          timeTo: data.timeTo || "",
          venue: data.venue || "",
          poster: null,
          objectives: Array.isArray(data.objectives) && data.objectives.length ? data.objectives : [""],
          outcomes: Array.isArray(data.outcomes) && data.outcomes.length ? data.outcomes : [""],
          studentCoordinators: Array.isArray(data.studentCoordinators) && data.studentCoordinators.length ? data.studentCoordinators : [""],
          facultyCoordinators: Array.isArray(data.facultyCoordinators) && data.facultyCoordinators.length ? data.facultyCoordinators : [""],
          totalParticipants: data.totalParticipants || "",
          femaleParticipants: data.femaleParticipants || "",
          maleParticipants: data.maleParticipants || "",
          eventType: data.eventType || "Session",
          customEventType: data.customEventType || "",
          summary: data.summary || "",
          attendance: [],
          permissionImage: null,
          speakers: Array.isArray(data.speakers) && data.speakers.length ? data.speakers : [emptySpeaker],
          feedback: Array.isArray(data.feedback) && data.feedback.length
            ? data.feedback.map(f => ({ question: f.question || "", answer: f.answer || "", analytics: null }))
            : [emptyFeedback],
          photographs: [],
        });

        setExistingFiles({
          poster: data.poster || null,
          permissionImage: data.permissionImage || null,
          attendance: Array.isArray(data.attendance) ? data.attendance : [],
          photographs: Array.isArray(data.photographs) ? data.photographs : [],
          feedback: Array.isArray(data.feedback) ? data.feedback.map(f => f.analytics || null) : [],
        });

        setPreviews({
          poster: data.poster || null,
          permissionImage: data.permissionImage || null,
          attendance: [],
          photographs: [],
          feedback: Array.isArray(data.feedback) ? data.feedback.map(f => f.analytics || null) : [],
        });

        console.log("Fetched report data:", {
          reportId,
          dataKeys: Object.keys(data),
          poster: !!data.poster,
          attendanceCount: data.attendance?.length || 0,
          photographsCount: data.photographs?.length || 0,
          feedbackCount: data.feedback?.length || 0,
        });
      } catch (err) {
        console.error("Error fetching report:", err.message, err.response?.data);
        setError(`Failed to load report data: ${err.response?.data?.error || err.message}`);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReport();
  }, [reportId, user]);

  const handleChange = e => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    if (name === "maleParticipants" || name === "femaleParticipants") {
      const male = name === "maleParticipants" ? value : formData.maleParticipants;
      const female = name === "femaleParticipants" ? value : formData.femaleParticipants;
      newFormData.totalParticipants = (parseInt(male) || 0) + (parseInt(female) || 0);
    }
    setFormData(newFormData);
  };

  const handleSingleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file && ["image/jpeg", "image/png"].includes(file.type)) {
      setFormData(prev => ({ ...prev, [field]: file }));
      setPreviews(prev => ({ ...prev, [field]: URL.createObjectURL(file) }));
      setExistingFiles(prev => ({ ...prev, [field]: null }));
      console.log(`Selected ${field}: ${file.name}, size: ${file.size} bytes`);
    } else {
      setError(`Invalid file type for ${field}. Please select JPEG or PNG.`);
    }
  };

  const handleMultipleFileChange = (e, field) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => ["image/jpeg", "image/png"].includes(file.type));
    if (validFiles.length !== files.length) {
      setError(`Some files for ${field} are invalid. Only JPEG or PNG allowed.`);
    }
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ...validFiles],
    }));
    setPreviews(prev => ({
      ...prev,
      [field]: [...prev[field], ...validFiles.map(f => URL.createObjectURL(f))],
    }));
    console.log(`Selected ${field}: ${validFiles.map(f => `${f.name} (${f.size} bytes)`).join(", ")}`);
  };

  const handleFeedbackAnalytics = (e, index) => {
    const file = e.target.files[0];
    if (file && ["image/jpeg", "image/png"].includes(file.type)) {
      const updatedFeedback = [...formData.feedback];
      updatedFeedback[index] = { ...updatedFeedback[index], analytics: file };
      setFormData({ ...formData, feedback: updatedFeedback });
      setPreviews(prev => ({
        ...prev,
        feedback: [
          ...prev.feedback.slice(0, index),
          URL.createObjectURL(file),
          ...prev.feedback.slice(index + 1),
        ],
      }));
      setExistingFiles(prev => ({
        ...prev,
        feedback: [
          ...prev.feedback.slice(0, index),
          null,
          ...prev.feedback.slice(index + 1),
        ],
      }));
      console.log(`Selected feedback analytics[${index}]: ${file.name}, size: ${file.size} bytes`);
    } else {
      setError("Invalid file type for feedback analytics. Please select JPEG or PNG.");
    }
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

  const addDynamicField = field => {
    if (field === "feedback") {
      setFormData({ ...formData, feedback: [...formData.feedback, { ...emptyFeedback }] });
      setPreviews(prev => ({ ...prev, feedback: [...prev.feedback, null] }));
      setExistingFiles(prev => ({ ...prev, feedback: [...prev.feedback, null] }));
    } else if (field === "speakers") {
      setFormData({ ...formData, speakers: [...formData.speakers, { ...emptySpeaker }] });
    } else {
      setFormData({ ...formData, [field]: [...formData[field], ""] });
    }
  };

  const removeDynamicField = (index, field) => {
    const updatedArray = [...formData[field]];
    updatedArray.splice(index, 1);
    if (field === "feedback") {
      const updatedPreviews = [...previews.feedback];
      updatedPreviews.splice(index, 1);
      const updatedExistingFiles = [...existingFiles.feedback];
      updatedExistingFiles.splice(index, 1);
      setPreviews({ ...previews, feedback: updatedPreviews });
      setExistingFiles({ ...existingFiles, feedback: updatedExistingFiles });
      try {
      const token = localStorage.getItem("token");
      if (token) {
        axios.post(
          "http://localhost:3001/api/reports/remove-feedback",
          { reportId, index },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(`Removed feedback[${index}] from DB`);
      }
    } catch (err) {
      setError(`Failed to remove feedback from DB: ${err.message}`);
    }
    }
    setFormData({
      ...formData,
      [field]: updatedArray.length ? updatedArray : [field === "speakers" ? { ...emptySpeaker } : field === "feedback" ? { ...emptyFeedback } : ""],
    });
  };

  const removeFile = async (field, index = null, isExisting = false) => {
    try {
      // Local state updates
      if (field === "poster" || field === "permissionImage") {
        setFormData(prev => ({ ...prev, [field]: null }));
        setPreviews(prev => {
          if (prev[field]) URL.revokeObjectURL(prev[field]);
          return { ...prev, [field]: null };
        });
        setExistingFiles(prev => ({ ...prev, [field]: null }));
        console.log(`Removed ${field} locally`);
      } else if (field === "feedback") {
        const updatedFeedback = [...formData.feedback];
        updatedFeedback[index] = { ...updatedFeedback[index], analytics: null };
        setFormData({ ...formData, feedback: updatedFeedback });
        setPreviews(prev => {
          const updatedFeedbackPreviews = [...prev.feedback];
          if (updatedFeedbackPreviews[index]) URL.revokeObjectURL(updatedFeedbackPreviews[index]);
          updatedFeedbackPreviews[index] = null;
          return { ...prev, feedback: updatedFeedbackPreviews };
        });
        setExistingFiles(prev => ({
          ...prev,
          feedback: [
            ...prev.feedback.slice(0, index),
            null,
            ...prev.feedback.slice(index + 1),
          ],
        }));
        console.log(`Removed feedback analytics[${index}] locally`);
      } else {
        // Handle multiple file fields (attendance, photographs)
        if (isExisting) {
          setExistingFiles(prev => {
            const updatedFiles = [...prev[field]];
            updatedFiles.splice(index, 1);
            return { ...prev, [field]: updatedFiles };
          });
          console.log(`Removed existing ${field}[${index}] locally`);
        } else {
          const adjustedIndex = index - existingFiles[field].length;
          if (adjustedIndex >= 0 && adjustedIndex < formData[field].length) {
            setFormData(prev => {
              const updatedFiles = [...prev[field]];
              updatedFiles.splice(adjustedIndex, 1);
              return { ...prev, [field]: updatedFiles };
            });
            setPreviews(prev => {
              const updatedPreviews = [...prev[field]];
              if (updatedPreviews[adjustedIndex]) URL.revokeObjectURL(updatedPreviews[adjustedIndex]);
              updatedPreviews.splice(adjustedIndex, 1);
              return { ...prev, [field]: updatedPreviews };
            });
            console.log(`Removed new ${field}[${adjustedIndex}] locally`);
          } else {
            console.warn(`Invalid index ${index} for new ${field} removal`);
            return;
          }
        }
      }

      // Send request to backend if the image is in existingFiles
      const isExistingImage = isExisting || (
        (field === 'poster' && existingFiles.poster) ||
        (field === 'permissionImage' && existingFiles.permissionImage) ||
        (['attendance', 'photographs'].includes(field) && index < existingFiles[field].length) ||
        (field === 'feedback' && existingFiles.feedback[index])
      );

      if (isExistingImage) {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No authentication token found.");
          return;
        }

        const response = await axios.post(
          "http://localhost:3001/api/reports/remove-image",
          { reportId, field, index: field === "poster" || field === "permissionImage" ? null : index },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log(`Successfully removed ${field}${index !== null ? `[${index}]` : ""} from backend:`, response.data);
      } else {
        console.log(`No backend request needed for ${field}${index !== null ? `[${index}]` : ""} (new image)`);
      }
    } catch (error) {
      console.error(`Error removing ${field}${index !== null ? `[${index}]` : ""}:`, {
        message: error.message,
        response: error.response?.data,
      });
      setError(`Failed to remove ${field}: ${error.response?.data?.message || error.message}`);
    }
  };

const sanitizeFormData = (data) => {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.replace(/\s+/g, " ").trim()]; // collapse inner spaces + trim
      }
      return [key, value];
    })
  );
};

const handleSubmit = async e => {
  e.preventDefault();
  setIsSubmitting(true);
  setError("");
  setSuccess("");

  // 🔑 Clean up spaces in all string fields
  const cleanedFormData = sanitizeFormData(formData);
  setFormData(cleanedFormData); // optional: update local state

  const missingFields = [];
  if (!cleanedFormData.eventName) missingFields.push("Event Name");
  if (!cleanedFormData.venue) missingFields.push("Venue");
  if (!cleanedFormData.organizedBy) missingFields.push("Organized By");
  if (!cleanedFormData.totalParticipants || isNaN(cleanedFormData.totalParticipants) || cleanedFormData.totalParticipants <= 0) missingFields.push("Total Participants");
  if (!cleanedFormData.timeFrom) missingFields.push("Time From");
  if (!cleanedFormData.timeTo) missingFields.push("Time To");
  if (cleanedFormData.tenure === "1 Day" && !cleanedFormData.date) missingFields.push("Date");
  if (cleanedFormData.tenure === "Multiple Days" && (!cleanedFormData.dateFrom || !cleanedFormData.dateTo)) {
    if (!cleanedFormData.dateFrom) missingFields.push("Date From");
    if (!cleanedFormData.dateTo) missingFields.push("Date To");
  }
  if (cleanedFormData.eventType === "Other" && !cleanedFormData.customEventType) missingFields.push("Custom Event Type");

  if (missingFields.length > 0) {
    const errorMsg = `Missing required fields: ${missingFields.join(", ")}.`;
    console.log("Validation failed:", errorMsg);
    setError(errorMsg);
    setIsSubmitting(false);
    return;
  }

  const submissionData = new FormData();
  try {
    Object.keys(cleanedFormData).forEach(key => {
      if (key === "poster" || key === "permissionImage") {
        if (formData[key] instanceof File) {
          submissionData.append(key, formData[key]);
          console.log(`Appended ${key}: ${formData[key].name}, size: ${formData[key].size} bytes`);
        }
      } else if (key === "attendance" || key === "photographs") {
        if (Array.isArray(formData[key])) {
          formData[key].forEach((file, index) => {
            if (file instanceof File) {
              submissionData.append(key, file);
              console.log(`Appended ${key}[${index}]: ${file.name}, size: ${file.size} bytes`);
            }
          });
        }
      } else if (key === "feedback") {
        submissionData.append("feedback", JSON.stringify(formData.feedback.map(item => ({
          question: item.question || "",
          answer: item.answer || ""
        }))));
        formData.feedback.forEach((item, index) => {
          if (item.analytics instanceof File) {
            submissionData.append(`feedbackAnalytics-${index}`, item.analytics);
            console.log(`Appended feedbackAnalytics-${index}: ${item.analytics.name}, size: ${item.analytics.size} bytes`);
          }
        });
      } else if (Array.isArray(formData[key])) {
        submissionData.append(key, JSON.stringify(formData[key]));
      } else {
        submissionData.append(key, cleanedFormData[key] || "");
      }
    });

    console.log("FormData entries:", [...submissionData.entries()]);
  } catch (err) {
    console.error("Error building FormData:", err.message);
    setError("Failed to prepare form data.");
    setIsSubmitting(false);
    return;
  }

  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No authentication token found.");
    const res = await axios.put(
      `http://localhost:3001/api/reports/${reportId}`,
      submissionData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("Submission successful:", res.data);
    setSuccess("Report updated successfully!");
    setIsSubmitted(true);
    setShowModal(true);
  } catch (error) {
    console.error("Submission error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    setError(`Failed to update: ${error.response?.data?.error || error.message}`);
  } finally {
    setIsSubmitting(false);
  }
};

  const closeModal = () => {
    setShowModal(false);
    navigate("/dashboard-dept/view-report");
  };

   if (isLoading) {
    return (
      <div className="loading-spinner" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
        <p style={{ fontFamily: "Times New Roman", fontSize: "14px", marginBottom: "10px" }}>Loading report data...</p>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="reportcreate">
      <div className="create-report">
        <h2>Edit Your Report</h2>
        {error && <div className="error" style={{ color: "red", fontSize: "14px", marginBottom: "10px" }}>{error}</div>}
        {success && <div className="success" style={{ color: "green", fontSize: "14px", marginBottom: "10px" }}>{success}</div>}
        {showModal && (
          <div className="modal">
            <div className="modal-content">
              <p>Report Updated Successfully.</p>
              <button onClick={closeModal} style={{ fontFamily: "Times New Roman", fontSize: "12px" }}>
                Close
              </button>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Department</label>
            <input type="text" value={formData.department} disabled style={{ fontFamily: "Times New Roman", fontSize: "12px" }} />
          </div>
          <div className="form-group">
            <label>Academic Year *</label>
            <select name="academicYear" value={formData.academicYear} onChange={handleChange} required style={{ fontFamily: "Times New Roman", fontSize: "12px" }}>
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
              style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
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
              style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
            />
          </div>
          <div className="form-group">
            <label>Tenure *</label>
            <select name="tenure" value={formData.tenure} onChange={handleChange} style={{ fontFamily: "Times New Roman", fontSize: "12px" }}>
              <option value="1 Day">1 Day</option>
              <option value="Multiple Days">Multiple Days</option>
            </select>
          </div>
          <div className="form-group">
            <label>Date *</label>
            {formData.tenure === "1 Day" ? (
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
              />
            ) : (
              <div className="date-range">
                <input
                  type="date"
                  name="dateFrom"
                  value={formData.dateFrom}
                  onChange={handleChange}
                  required
                  style={{ fontFamily: "Times New Roman", fontSize: "12px", marginRight: 8 }}
                />
                <input
                  type="date"
                  name="dateTo"
                  value={formData.dateTo}
                  onChange={handleChange}
                  required
                  style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
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
                style={{ fontFamily: "Times New Roman", fontSize: "12px", marginRight: 8 }}
              />
              <input
                type="time"
                name="timeTo"
                value={formData.timeTo}
                onChange={handleChange}
                required
                style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
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
              style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
            />
          </div>
          <div className="form-group">
            <label>Poster / Circular</label>
            {(previews.poster || existingFiles.poster) && (
              <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                <img
                  src={previews.poster || existingFiles.poster}
                  alt="Poster Preview"
                  style={{ height: 80, width: "auto", objectFit: "contain", border: "1px solid #aaa", marginRight: 8, paddingTop: 0}}
                />
                <button
                  type="button"
                  onClick={() => removeFile("poster", null, !!existingFiles.poster)}
                  style={{ fontFamily: "Times New Roman", fontSize: "12px", color: "red", background: "none", border: "none", cursor: "pointer" }}
                >
                  &times;
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={e => handleSingleFileChange(e, "poster")}
              style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
            />
            <h6 style={{color : "grey"}}>(Choose only png/jpeg file)</h6>
          </div>
          <div className="form-group">
            <label>Speakers</label>
            {formData.speakers.map((speaker, index) => (
              <div key={index} className="dynamic-field">
                <input
                  type="text"
                  value={speaker.name || ""}
                  onChange={e => handleDynamicChange(e, index, "speakers", "name")}
                  placeholder="Speaker name"
                  style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
                />
                <textarea
                  value={speaker.background || ""}
                  onChange={e => handleDynamicChange(e, index, "speakers", "background")}
                  placeholder="Speaker background"
                  rows="3"
                  style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
                />
                {formData.speakers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDynamicField(index, "speakers")}
                    className="remove-btn"
                    style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addDynamicField("speakers")}
              className="add-btn"
              style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
            >
              Add Speaker
            </button>
          </div>
          <div className="form-group">
            <label>Objectives</label>
            {formData.objectives.map((objective, index) => (
              <div key={index} className="dynamic-field">
                <textarea
                  value={objective || ""}
                  onChange={e => handleDynamicChange(e, index, "objectives")}
                  placeholder={`Objective ${index + 1}`}
                  rows="3"
                  style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
                />
                {formData.objectives.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDynamicField(index, "objectives")}
                    className="remove-btn"
                    style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addDynamicField("objectives")}
              className="add-btn"
              style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
            >
              Add Objective
            </button>
          </div>
          <div className="form-group">
            <label>Outcomes</label>
            {formData.outcomes.map((outcome, index) => (
              <div key={index} className="dynamic-field">
                <textarea
                  value={outcome || ""}
                  onChange={e => handleDynamicChange(e, index, "outcomes")}
                  placeholder={`Outcome ${index + 1}`}
                  rows="3"
                  style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
                />
                {formData.outcomes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDynamicField(index, "outcomes")}
                    className="remove-btn"
                    style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addDynamicField("outcomes")}
              className="add-btn"
              style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
            >
              Add Outcome
            </button>
          </div>
          <div className="form-group">
            <label>Student Coordinators</label>
            {formData.studentCoordinators.map((coordinator, index) => (
              <div key={index} className="dynamic-field">
                <textarea
                  value={coordinator || ""}
                  onChange={e => handleDynamicChange(e, index, "studentCoordinators")}
                  placeholder={`Student Coordinator ${index + 1}`}
                  rows="3"
                  style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
                />
                {formData.studentCoordinators.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDynamicField(index, "studentCoordinators")}
                    className="remove-btn"
                    style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addDynamicField("studentCoordinators")}
              className="add-btn"
              style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
            >
              Add Student Coordinator
            </button>
          </div>
          <div className="form-group">
            <label>Faculty Coordinators</label>
            {formData.facultyCoordinators.map((coordinator, index) => (
              <div key={index} className="dynamic-field">
                <textarea
                  value={coordinator || ""}
                  onChange={e => handleDynamicChange(e, index, "facultyCoordinators")}
                  placeholder={`Faculty Coordinator ${index + 1}`}
                  rows="3"
                  style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
                />
                {formData.facultyCoordinators.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDynamicField(index, "facultyCoordinators")}
                    className="remove-btn"
                    style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addDynamicField("facultyCoordinators")}
              className="add-btn"
              style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
            >
              Add Faculty Coordinator
            </button>
          </div>
          <div className="form-group">
            <label>Male Participants</label>
            <input
              type="number"
              name="maleParticipants"
              value={formData.maleParticipants}
              onChange={handleChange}
              min="0"
              style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
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
              style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
            />
          </div>
          <div className="form-group">
            <label>Total Participants *</label>
            <input
              type="number"
              name="totalParticipants"
              value={formData.totalParticipants}
              disabled
              min="0"
              style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
            />
          </div>
          <div className="form-group">
            <label>Event Type</label>
            <select name="eventType" value={formData.eventType} onChange={handleChange} style={{ fontFamily: "Times New Roman", fontSize: "12px" }}>
              <option value="Session">Session</option>
              <option value="Workshop">Workshop</option>
              <option value="Bootcamp">Bootcamp</option>
              <option value="Other">Other</option>
            </select>
          </div>
          {formData.eventType === "Other" && (
            <div className="form-group">
              <label>Other</label>
              <input
                type="text"
                name="customEventType"
                value={formData.customEventType}
                onChange={handleChange}
                style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
              />
            </div>
          )}
          <div className="form-group">
            <label>{formData.eventType !== "Other" ? formData.eventType || "Event" : formData.customEventType || "Event"} Summary</label>
            <textarea
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              rows="5"
              style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
            />
          </div>
          <div className="form-group">
            <label>Attendance Images</label>
            <input
              type="file"
              accept="image/jpeg,image/png"
              multiple
              name="attendance[]"
              onChange={e => handleMultipleFileChange(e, "attendance")}
              style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
            />
            <h6 style={{color : "grey"}}>(Choose only png/jpeg file)</h6>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {[...existingFiles.attendance, ...previews.attendance].map((url, index) => (
                <div key={`attendance-${index}`} style={{ position: "relative" }}>
                  <img
                    src={url}
                    alt={`Attendance ${index + 1}`}
                    style={{ height: 80, width: "auto", objectFit: "contain", border: "1px solid #aaa" ,paddingTop: 0}}
                  />
                  <button
                    type="button"
                    onClick={() => removeFile("attendance", index, index < existingFiles.attendance.length)}
                    style={{ position: "absolute", top: 0, right: 0, color: "red", background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Permission Image</label>
            {(previews.permissionImage || existingFiles.permissionImage) && (
              <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                <img
                  src={previews.permissionImage || existingFiles.permissionImage}
                  alt="Permission Preview"
                  style={{ height: 80, width: "auto", objectFit: "contain", border: "1px solid #aaa", marginRight: 8 ,paddingTop: 0}}
                />
                <button
                  type="button"
                  onClick={() => removeFile("permissionImage", null, !!existingFiles.permissionImage)}
                  style={{ fontFamily: "Times New Roman", fontSize: "12px", color: "red", background: "none", border: "none", cursor: "pointer" }}
                >
                  &times;
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={e => handleSingleFileChange(e, "permissionImage")}
              style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
            />
            <h6 style={{color : "grey"}}>(Choose only png/jpeg file)</h6>
          </div>
          <div className="form-group">
            <label>Feedback</label>
            {formData.feedback?.map((item, index) => (
              <div key={index} className="feedback-item" style={{ marginBottom: 12 }}>
                <input
                  type="text"
                  value={item.question || ""}
                  onChange={e => handleDynamicChange(e, index, "feedback", "question")}
                  placeholder={`Question ${index + 1}`}
                  style={{ fontFamily: "Times New Roman", fontSize: "12px", marginBottom: 4, width: "100%" }}
                />
                <textarea
                  value={item.answer || ""}
                  onChange={e => handleDynamicChange(e, index, "feedback", "answer")}
                  placeholder="Answer/Review"
                  rows="3"
                  style={{ fontFamily: "Times New Roman", fontSize: "12px", marginBottom: 4, width: "100%" }}
                />
                {(previews.feedback[index] || existingFiles.feedback[index]) && (
                  <div style={{ position: "relative", marginBottom: 4 }}>
                    <img
                      src={previews.feedback[index] || existingFiles.feedback[index]}
                      alt={`Feedback Analytics Preview ${index + 1}`}
                      style={{ height: 80, width: "auto", objectFit: "contain", border: "1px solid #aaa",paddingTop: 0 }}
                    />
                    <button
                      type="button"
                      onClick={() => removeFile("feedback", index, !!existingFiles.feedback[index])}
                      style={{ position: "absolute", top: 0, right: 0, color: "red", background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}
                    >
                      &times;
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  name={`feedbackAnalytics-${index}`}
                  onChange={e => handleFeedbackAnalytics(e, index)}
                  style={{ fontFamily: "Times New Roman", fontSize: "12px", marginBottom: 4 }}
                />
                <h6 style={{color : "grey"}}>(Choose only png/jpeg file)</h6>
                {formData.feedback.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDynamicField(index, "feedback")}
                    className="remove-btn"
                    style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addDynamicField("feedback")}
              className="add-btn"
              style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
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
              onChange={e => handleMultipleFileChange(e, "photographs")}
              style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
            />
            <h6 style={{color : "grey"}}>(Choose only png/jpeg file)</h6>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {[...existingFiles.photographs, ...previews.photographs].map((url, index) => (
                <div key={`photograph-${index}`} style={{ position: "relative" }}>
                  <img
                    src={url}
                    alt={`Photograph ${index + 1}`}
                    style={{ height: 80, width: "auto", objectFit: "contain", border: "1px solid #aaa",paddingTop: 0 }}
                  />
                  <button
                    type="button"
                    onClick={() => removeFile("photographs", index, index < existingFiles.photographs.length)}
                    style={{ position: "absolute", top: 0, right: 0, color: "red", background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="button-group" style={{ marginTop: 20 }}>
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
              style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
            >
              {isSubmitting ? "Updating..." : "Update Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditReport;
