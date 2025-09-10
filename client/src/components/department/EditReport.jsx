import { useEffect, useState, useContext } from "react";
import React from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "../../styles/CreateReport.css";
import "../../styles/EditReport.css";




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
    timeFrom: "",
    timeTo: "",
    venue: "",
    poster: null,
    objectives: [""],
    outcomes: [""],
    totalParticipants: "",
    femaleParticipants: "",
    maleParticipants: "",
    eventType: "Session",
    summary: "",
    attendance: [],
    permissionImage: null,
    speakers: [emptySpeaker],
    feedback: [emptyFeedback],
    photographs: [],
  });

  const [previews, setPreviews] = useState({});
  const [existingFiles, setExistingFiles] = useState({});

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchReport() {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://localhost:3001/api/reports?reportId=${reportId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = res.data;

        setFormData({
          department: data.department || "",
          academicYear: data.academicYear || "2024-25",
          organizedBy: data.organizedBy || "",
          eventName: data.eventName || "",
          tenure: data.tenure || "1 Day",
          date: data.date || "",
          timeFrom: data.timeFrom || "",
          timeTo: data.timeTo || "",
          venue: data.venue || "",
          poster: null,
          objectives: Array.isArray(data.objectives) && data.objectives.length ? data.objectives : [""],
          outcomes: Array.isArray(data.outcomes) && data.outcomes.length ? data.outcomes : [""],
          totalParticipants: data.totalParticipants || "",
          femaleParticipants: data.femaleParticipants || "",
          maleParticipants: data.maleParticipants || "",
          eventType: data.eventType || "Session",
          summary: data.summary || "",
          attendance: [],
          permissionImage: null,
          speakers: Array.isArray(data.speakers) && data.speakers.length
            ? data.speakers
            : [emptySpeaker],
          feedback: Array.isArray(data.feedback) && data.feedback.length
            ? data.feedback.map(f => ({ ...emptyFeedback, ...f }))
            : [emptyFeedback],
          photographs: [],
        });

        setExistingFiles({
          poster: data.poster || null,
          permissionImage: data.permissionImage || null,
          attendance: data.attendance || [],
          photographs: data.photographs || [],
          feedback: (Array.isArray(data.feedback) && data.feedback.length)
            ? data.feedback.map(f => f.analytics || null)
            : [],
        });
      } catch (err) {
        setError("Failed to load report data.");
      }
    }
    fetchReport();
  }, [reportId]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

const handleSingleFileChange = (e, field) => {
  const file = e.target.files[0];
  if (file && ["image/jpeg", "image/png"].includes(file.type)) {
    // Handle multiple files - add to array
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), file]
    }));
    
    // Handle multiple previews - add to array
    setPreviews(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), URL.createObjectURL(file)]
    }));
    
    // Handle existing files - add placeholder for new file
    setExistingFiles(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), null] // null placeholder for new file
    }));
  } else {
    setError(`Invalid file type for ${field}. Please select JPEG or PNG.`);
  }
};

  const handleFile = (e, field) => {
  const file = e.target.files[0];
  if (file && ["image/jpeg", "image/png"].includes(file.type)) {
    // Store single file
    setFormData(prev => ({
      ...prev,
      [field]: file
    }));
    
    // Store single preview
    setPreviews(prev => ({
      ...prev,
      [field]: URL.createObjectURL(file)
    }));
    
    // Clear existing file since we're replacing it
    setExistingFiles(prev => ({
      ...prev,
      [field]: null
    }));
  } else {
    setError(`Invalid file type for ${field}. Please select JPEG or PNG.`);
  }
};

  const handleDynamicChange = (e, idx, field, subField = undefined) => {
    const updated = [...formData[field]];
    if (subField) {
      updated[idx] = { ...updated[idx], [subField]: e.target.value };
    } else {
      updated[idx] = e.target.value;
    }
    setFormData(prev => ({ ...prev, [field]: updated }));
  };

  const addDynamicField = field => {
    const emptyMap = {
      feedback: { ...emptyFeedback },
      speakers: { ...emptySpeaker },
    };
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], emptyMap[field] || ""],
    }));
    if(field === "feedback") {
      setExistingFiles(prev => ({
        ...prev,
        feedback: [...(prev.feedback || []), null],
      }));
    }
  };

  const removeDynamicField = (idx, field) => {
    const updated = [...formData[field]];
    updated.splice(idx, 1);
    setFormData(prev => ({
      ...prev,
      [field]: updated.length ? updated : [field === "speakers" ? { ...emptySpeaker } : field === "feedback" ? { ...emptyFeedback } : ""],
    }));
    if(field === "feedback") {
      setExistingFiles(prev => {
        const newArr = [...(prev.feedback || [])];
        newArr.splice(idx, 1);
        return { ...prev, feedback: newArr };
      });
    }
  };

  const handleFeedbackAnalytics = (e, idx) => {
    const file = e.target.files[0];
    if (file && ["image/jpeg", "image/png"].includes(file.type)) {
      const newFeedback = [...formData.feedback];
      newFeedback[idx].analytics = file;
      setFormData(prev => ({ ...prev, feedback: newFeedback }));
      setPreviews(prev => ({ ...prev, [`feedback-${idx}`]: URL.createObjectURL(file) }));
      setExistingFiles(prev => {
        const arr = Array.isArray(prev.feedback) ? [...prev.feedback] : [];
        arr[idx] = null;
        return { ...prev, feedback: arr };
      });
    } else {
      setError("Invalid file type for feedback analytics. Please select JPEG or PNG.");
    }
  };

  const validateForm = () => {
    if (
      !formData.eventName ||
      !formData.venue ||
      !formData.totalParticipants ||
      !formData.organizedBy ||
      !formData.date ||
      !formData.timeFrom ||
      !formData.timeTo
    ) {
      setError("Missing required fields. Please fill: Event Name, Venue, Organized By, Total Participants, Date, Time.");
      return false;
    }
    return true;
  };
const handleDeleteImage = async (reportId, field, imageUrl = null, index = null) => {
  try {
    const token = localStorage.getItem("token");
    await axios.patch(
  `http://localhost:3001/api/reports/${reportId}/remove-image`,
  field === "attendance" || field === "photographs"
    ? { field, index }  // send index for multi-image fields
    : { field, imageUrl },
  { headers: { Authorization: `Bearer ${token}` } }
);
    // ✅ Update frontend state immediately
    setExistingFiles(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  } catch (error) {
    console.error("Error deleting image:", error);
  }
};
  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!validateForm()) return;
    setIsSubmitting(true);

    const submissionData = new FormData();
    try {
      Object.keys(formData).forEach(key => {
        if (key === "poster" || key === "permissionImage") {
          if (formData[key] instanceof File) {
            submissionData.append(key, formData[key]);
          }
        } else if (["attendance", "photographs"].includes(key)) {
  if (Array.isArray(formData[key])) {
    const existingUrls = formData[key].filter(item => typeof item === "string");
    const newFiles = formData[key].filter(item => item instanceof File);

    // Send existing URLs as JSON so backend knows to keep them
    submissionData.append(`${key}Existing`, JSON.stringify(existingUrls));

    // Send new files
    newFiles.forEach(file => {
      submissionData.append(key, file);
    });}

        } else if (key === "feedback") {
          const feedbackWithAnalytics = formData.feedback.map((item, idx) => ({
            ...item,
            analytics: item.analytics instanceof File ? `feedbackAnalytics-${idx}` : null,
          }));
          submissionData.append("feedback", JSON.stringify(feedbackWithAnalytics));
          formData.feedback.forEach((item, idx) => {
            if (item.analytics instanceof File) {
              submissionData.append(`feedbackAnalytics-${idx}`, item.analytics);
            }
          });
        } else if (Array.isArray(formData[key])) {
          submissionData.append(key, JSON.stringify(formData[key]));
        } else {
          submissionData.append(key, formData[key] || "");
        }
      });

      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:3001/api/reports/${reportId}`,
        submissionData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccess("Successfully updated report!");
      setTimeout(() => navigate("/dashboard-dept/view-report"), 1500);
    } catch (err) {
      setError("Failed to update: " + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  // CSS styles for fixed height, consistent image preview
  const imgPreviewStyle = {
    height: 80,
    width: "auto",
    objectFit: "contain",
    border: "1px solid #aaa",
    marginRight: 8,
  };
  

  return (
    <div className="create-report">
    <div className="reportcreate"  style={{ backgroundColor: "beige", minHeight: "100vh" }}>
      <div className="edit-report">


        
        <h2>Edit Report for {formData.department || "Department"}</h2>
        {error && <div className="error" style={{ color: "red", fontSize: 14, marginBottom: 10 }}>{error}</div>}
        {success && <div className="success" style={{ color: "green", fontSize: 14, marginBottom: 10 }}>{success}</div>}
        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Department</label>
            <input type="text" value={formData.department} disabled style={{ fontFamily: "Times New Roman", fontSize: 12 }} />
          </div>

          <div className="form-group">
            <label>Academic Year *</label>
            <select name="academicYear" value={formData.academicYear} onChange={handleChange} required style={{ fontFamily: "Times New Roman", fontSize: 12 }}>
              <option value="2024-25">2024-25</option>
              <option value="2025-26">2025-26</option>
              <option value="2026-27">2026-27</option>
            </select>
          </div>

          <div className="form-group">
            <label>Organized By *</label>
            <input type="text" name="organizedBy" value={formData.organizedBy} onChange={handleChange} required style={{ fontFamily: "Times New Roman", fontSize: 12 }} />
          </div>

          <div className="form-group">
            <label>Event Name *</label>
            <input type="text" name="eventName" value={formData.eventName} onChange={handleChange} required style={{ fontFamily: "Times New Roman", fontSize: 12 }} />
          </div>

          <div className="form-group">
            <label>Tenure *</label>
            <select name="tenure" value={formData.tenure} onChange={handleChange} style={{ fontFamily: "Times New Roman", fontSize: 12 }}>
              <option value="1 Day">1 Day</option>
              <option value="Multiple Days">Multiple Days</option>
            </select>
          </div>

          <div className="form-group">
            <label>Date *</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} required style={{ fontFamily: "Times New Roman", fontSize: 12 }} />
          </div>

          <div className="form-group">
            <label>Time *</label>
            <div className="time-range">
              <input type="time" name="timeFrom" value={formData.timeFrom} onChange={handleChange} required style={{ fontFamily: "Times New Roman", fontSize: 12, marginRight: 8 }} />
              <input type="time" name="timeTo" value={formData.timeTo} onChange={handleChange} required style={{ fontFamily: "Times New Roman", fontSize: 12 }} />
            </div>
          </div>

          <div className="form-group">
            <label>Venue *</label>
            <input type="text" name="venue" value={formData.venue} onChange={handleChange} required style={{ fontFamily: "Times New Roman", fontSize: 12 }} />
          </div>

          {/* Poster preview */}
          <div className="form-group">
            <label>Poster</label>
            {(previews.poster || existingFiles.poster) && (
              <div>
                <img src={previews.poster || existingFiles.poster} alt="Poster Preview" style={{ maxWidth: 200, maxHeight: 120, marginBottom: 8, border: "1px solid #aaa" }} />
               <button
  type="button"
  onClick={async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:3001/api/reports/${reportId}/remove-image`,
        { field: "poster" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFormData(prev => ({ ...prev, poster: null }));
      setPreviews(prev => ({ ...prev, poster: null }));
      setExistingFiles(prev => ({ ...prev, poster: null }));
    } catch (err) {
      setError("Failed to remove poster image");
    }
  }}
>
  Remove
</button> </div> )}
 <input type="file" accept="image/jpeg,image/png" onChange={e => handleFile(e, "poster")}  style={{ fontFamily: "Times New Roman", fontSize: 12 }} />
          </div>

          {/* Speakers */}
          <div className="form-group">
            <label>Speakers</label>
            {formData.speakers.map((speaker, idx) => (
              <div key={idx} className="dynamic-field">
                <input
                  type="text"
                  value={speaker.name || ""}
                  onChange={e => handleDynamicChange(e, idx, "speakers", "name")}
                  placeholder="Speaker name"
                  style={{ fontFamily: "Times New Roman", fontSize: 12 }}
                />
                <textarea
                  value={speaker.background || ""}
                  onChange={e => handleDynamicChange(e, idx, "speakers", "background")}
                  placeholder="Speaker background"
                  rows={3}
                  style={{ fontFamily: "Times New Roman", fontSize: 12 }}
                />
                {formData.speakers.length > 1 && (
                  <button type="button" onClick={() => removeDynamicField(idx, "speakers")} className="remove-btn" style={{ fontFamily: "Times New Roman", fontSize: 12 }}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => addDynamicField("speakers")} className="add-btn" style={{ fontFamily: "Times New Roman", fontSize: 12 }}>
              Add Speaker
            </button>
          </div>

          {/* Objectives */}
          <div className="form-group">
            <label>Objectives</label>
            {formData.objectives.map((objective, idx) => (
              <div key={idx} className="dynamic-field">
                <textarea
                  value={objective || ""}
                  onChange={e => handleDynamicChange(e, idx, "objectives")}
                  placeholder={`Objective ${idx + 1}`}
                  rows={3}
                  style={{ fontFamily: "Times New Roman", fontSize: 12 }}
                />
                {formData.objectives.length > 1 && (
                  <button type="button" onClick={() => removeDynamicField(idx, "objectives")} className="remove-btn" style={{ fontFamily: "Times New Roman", fontSize: 12 }}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => addDynamicField("objectives")} className="add-btn" style={{ fontFamily: "Times New Roman", fontSize: 12 }}>
              Add
            </button>
          </div>

          {/* Outcomes */}
          <div className="form-group">
            <label>Outcomes</label>
            {formData.outcomes.map((outcome, idx) => (
              <div key={idx} className="dynamic-field">
                <textarea
                  value={outcome || ""}
                  onChange={e => handleDynamicChange(e, idx, "outcomes")}
                  placeholder={`Outcome ${idx + 1}`}
                  rows={3}
                  style={{ fontFamily: "Times New Roman", fontSize: 12 }}
                />
                {formData.outcomes.length > 1 && (
                  <button type="button" onClick={() => removeDynamicField(idx, "outcomes")} className="remove-btn" style={{ fontFamily: "Times New Roman", fontSize: 12 }}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => addDynamicField("outcomes")} className="add-btn" style={{ fontFamily: "Times New Roman", fontSize: 12 }}>
              Add
            </button>
          </div>

          <div className="form-group">
            <label>Total Participants *</label>
            <input type="number" name="totalParticipants" value={formData.totalParticipants} onChange={handleChange} required min="0" style={{ fontFamily: "Times New Roman", fontSize: 12 }} />
          </div>

          <div className="form-group">
            <label>Female Participants</label>
            <input type="number" name="femaleParticipants" value={formData.femaleParticipants} onChange={handleChange} min="0" style={{ fontFamily: "Times New Roman", fontSize: 12 }} />
          </div>

          <div className="form-group">
            <label>Male Participants</label>
            <input type="number" name="maleParticipants" value={formData.maleParticipants} onChange={handleChange} min="0" style={{ fontFamily: "Times New Roman", fontSize: 12 }} />
          </div>

          <div className="form-group">
            <label>Event Type</label>
            <select name="eventType" value={formData.eventType} onChange={handleChange} style={{ fontFamily: "Times New Roman", fontSize: 12 }}>
              <option value="Session">Session</option>
              <option value="Workshop">Workshop</option>
              <option value="Bootcamp">Bootcamp</option>
            </select>
          </div>

          <div className="form-group">
            <label>{formData.eventType || "Event"} Summary</label>
            <textarea name="summary" value={formData.summary} onChange={handleChange} rows={5} style={{ fontFamily: "Times New Roman", fontSize: 12 }} />
          </div>

          {/* Attendance Images */}
<div className="form-group">
  <label>Attendance</label>

  
  {(existingFiles.attendance || []).length > 0 && (
    <div className="image-preview">
      {existingFiles.attendance.map((img, index) => (
        <div key={index} className="image-item">
          <img 
            src={img || previews.attendance?.[index]} 
            alt={`Attendance ${index}`} 
          />
          <button
            type="button"
            onClick={() => handleDeleteImage(reportId, "attendance", null, index)}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  )}

  {/* Add button always available */}
  <input
    type="file"
    accept="image/jpeg,image/png"
    onChange={(e) => handleSingleFileChange(e, "attendance")}
  />
</div>






          {/* Permission Image */}
          <div className="form-group">
            <label>Permission Image</label>
            {(previews.permissionImage || existingFiles.permissionImage) && (
              <div>
                <img src={previews.permissionImage || existingFiles.permissionImage} alt="Permission Preview" style={{ maxWidth: 200, maxHeight: 120, marginBottom: 8, border: "1px solid #aaa" }} />
               <button
  type="button"
  onClick={async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:3001/api/reports/${reportId}/remove-image`,
        { field: "permissionImage" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFormData(prev => ({ ...prev, permissionImage: null }));
      setPreviews(prev => ({ ...prev, permissionImage: null }));
      setExistingFiles(prev => ({ ...prev, permissionImage: null }));
    } catch (err) {
      setError("Failed to remove permission image");
    }
  }}
>
  Remove
</button>

              </div>
            )}
            <input type="file" accept="image/jpeg,image/png" onChange={e => handleFile(e,  "permissionImage")} style={{ fontFamily: "Times New Roman", fontSize: 12 }} />
          </div>

          {/* Feedback */}
          <div className="form-group">
            <label>Feedback</label>
            {formData.feedback.map((item, idx) => (
              <div key={idx} className="feedback-item" style={{ marginBottom: 12 }}>
                <input
                  type="text"
                  value={item.question || ""}
                  onChange={e => handleDynamicChange(e, idx, "feedback", "question")}
                  placeholder={`Question ${idx + 1}`}
                  style={{ fontFamily: "Times New Roman", fontSize: 12, marginBottom: 4, width: "100%" }}
                />
                <textarea
                  value={item.answer || ""}
                  onChange={e => handleDynamicChange(e, idx, "feedback", "answer")}
                  placeholder="Answer/Review"
                  rows={3}
                  style={{ fontFamily: "Times New Roman", fontSize: 12, marginBottom: 4, width: "100%" }}
                />
                {(previews[`feedback-${idx}`] || (Array.isArray(existingFiles.feedback) && existingFiles.feedback[idx])) && (
                  <img
                    src={previews[`feedback-${idx}`] || existingFiles.feedback[idx]}
                    alt={`Feedback Analytics Preview ${idx + 1}`}
                    style={{ ...imgPreviewStyle, marginBottom: 4 }}
                  />
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  name={`feedbackAnalytics-${idx}`}
                  onChange={e => handleFeedbackAnalytics(e, idx)}
                  style={{ fontFamily: "Times New Roman", fontSize: 12, marginBottom: 4 }}
                />
                {formData.feedback.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDynamicField(idx, "feedback")}
                    className="remove-btn"
                    style={{ fontFamily: "Times New Roman", fontSize: 12 }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => addDynamicField("feedback")} className="add-btn" style={{ fontFamily: "Times New Roman", fontSize: 12 }}>
              Add Feedback
            </button>
          </div>
          {/* ===== Photographs Section ===== */}
<div className="form-group">
  <label>Photographs</label>
  {(existingFiles.photographs || []).length > 0 && (
    <div className="image-preview">
      {existingFiles.photographs.map((img, index) => (
        <div key={index} className="image-item">
          <img
            src={img || previews.photographs?.[index]}
            alt={`Photograph ${index}`}
            className="preview-img"
          />
          <button
            type="button"
            onClick={() => handleDeleteImage(reportId, "photographs", img, index)}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  )}

  {/* Add new file */}
  <input
    type="file"
    accept="image/jpeg,image/png"
    onChange={(e) => handleSingleFileChange(e, "photographs")}
  />
</div>


          <div className="button-group" style={{ marginTop: 20 }}>
            <button type="submit" className="submit-btn" disabled={isSubmitting} style={{ fontFamily: "Times New Roman", fontSize: 12 }}>
              {isSubmitting ? "Saving..." : "Update Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
}

export default EditReport;
