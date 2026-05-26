import React, { useState } from "react";
import axios from "axios";
import "./ItemForm.css";
import API_BASE_URL from "../api";

const ItemForm = ({ token, onItemAdded }) => {
  const [form, setForm] = useState({
    title: "",
    type: "Lost",
    category: "Electronics",
    description: "",
    location: "",
    date: "",
    image: null,
    contact: "",
    sentiments: "",
    rewards: ""
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [imagePreview, setImagePreview] = useState(null);

  const steps = [
    { num: 1, label: 'Type & Category', icon: '📋' },
    { num: 2, label: 'Item Details', icon: '📝' },
    { num: 3, label: 'Description & Upload', icon: '📸' },
  ];

  // Today's date in YYYY-MM-DD format for max date validation
  const today = new Date().toISOString().split('T')[0];

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setForm({ ...form, [name]: files[0] });
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(files[0]);
    } else if (name === 'contact') {
      // Only allow digits, max 10
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setForm({ ...form, [name]: digitsOnly });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.title || !form.location || !form.date || !form.description) {
      alert('Please fill in all required fields');
      return;
    }

    const authToken = token || localStorage.getItem('token');
    if (!authToken) {
      alert('You must be logged in to submit a report');
      return;
    }

    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('location', form.location);
    formData.append('category', form.category);
    formData.append('itemType', form.type);
    formData.append('dateLost', form.date);
    formData.append('contact', form.contact);
    if (form.type === 'Lost') {
      formData.append('sentiments', form.sentiments);
      formData.append('rewards', form.rewards);
    }
    if (form.image) {
      formData.append('image', form.image);
    }

    console.log('=== ItemForm Submit Debug ===');
    console.log('Token exists:', !!token);
    console.log('Token:', token);
    console.log('Form data:', {
      title: form.title,
      description: form.description,
      location: form.location,
      category: form.category,
      itemType: form.type,
      dateLost: form.date,
    });

    try {
      const response = await axios.post(`${API_BASE_URL}/api/items`, formData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      console.log('Success response:', response.data);
      alert('Report submitted successfully! It will appear on the dashboard after admin verification. ✅');
      setForm({
        title: "",
        type: "Lost",
        category: "Electronics",
        description: "",
        location: "",
        date: "",
        image: null,
        sentiments: "",
        rewards: ""
      });
      setImagePreview(null);
      setCurrentStep(1);
      if (onItemAdded) onItemAdded();
    } catch (error) {
      console.error('=== Error submitting report ===');
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      console.error('Auth header value:', `Bearer ${authToken}`);
      console.error('Full error:', error);

      const message = error.response?.data?.message || 'Failed to submit report. Please try again.';
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        alert(message.includes('expired') ? 'Session expired. Please login again.' : 'Authentication failed. Please login again.');
        window.location.href = '/login';
        return;
      }

      alert(message);
    }
  };

  const validateStep = (step) => {
    const errors = [];
    
    if (step === 1) {
      // Step 1: Type & Category - these have defaults so usually filled
      if (!form.type) errors.push('Please select report type (Lost/Found)');
      if (!form.category) errors.push('Please select a category');
    }
    
    if (step === 2) {
      // Step 2: Item Details
      if (!form.title || form.title.trim() === '') {
        errors.push('Item Title is required');
      }
      if (!form.location || form.location.trim() === '') {
        errors.push('Location is required');
      } else if (form.location.trim().length < 3) {
        errors.push('Location must be at least 3 characters');
      } else if (!/^[a-zA-Z0-9\s,.-]+$/.test(form.location.trim())) {
        errors.push('Location can only contain letters, numbers, spaces, commas, dots and hyphens');
      }
      if (!form.date) {
        errors.push('Date is required');
      } else if (form.date > today) {
        errors.push('Date cannot be in the future');
      }
      if (form.contact && form.contact.length !== 10) {
        errors.push('Contact number must be exactly 10 digits');
      }
    }
    
    if (step === 3) {
      // Step 3: Description & Upload
      if (!form.description || form.description.trim() === '') {
        errors.push('Description is required');
      }
    }
    
    return errors;
  };

  const handleNext = (e) => {
    e.preventDefault();
    
    // Validate current step before moving to next
    const errors = validateStep(currentStep);
    
    if (errors.length > 0) {
      alert('Please complete all required fields:\n• ' + errors.join('\n• '));
      return;
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="form-container">
      <div className="form-card">
        {/* Header with gradient */}
        <div className="form-header-banner">
          <div className="form-header-content">
            <span className="form-badge">✏️ New Report</span>
            <h1>Report an Item</h1>
            <p>Help the campus community by reporting a lost or found item</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="step-progress">
          {steps.map((step, i) => (
            <div key={step.num} className={`step-item ${currentStep >= step.num ? 'active' : ''} ${currentStep === step.num ? 'current' : ''}`}>
              <div className="step-dot">
                {currentStep > step.num ? '✓' : step.icon}
              </div>
              <span className="step-label">{step.label}</span>
              {i < steps.length - 1 && <div className={`step-line ${currentStep > step.num ? 'filled' : ''}`}></div>}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {currentStep === 1 && (
            <div className="step-content">
              <h3 className="step-title">What type of report is this?</h3>
              <div className="type-cards">
                {[
                  { value: 'Lost', icon: '🔍', desc: 'I lost something', color: 'amber' },
                  { value: 'Found', icon: '📦', desc: 'I found something', color: 'emerald' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`type-card ${form.type === option.value ? `type-card--active type-card--${option.color}` : ''}`}
                    onClick={() => setForm({ ...form, type: option.value })}
                  >
                    <span className="type-card-icon">{option.icon}</span>
                    <span className="type-card-title">{option.value}</span>
                    <span className="type-card-desc">{option.desc}</span>
                  </button>
                ))}
              </div>

              <div className="form-group">
                <label>Category</label>
                <div className="category-grid">
                  {[
                    { val: 'Electronics', icon: '💻' },
                    { val: 'Documents', icon: '📄' },
                    { val: 'Accessories', icon: '💎' },
                    { val: 'Books', icon: '📚' },
                    { val: 'Keys', icon: '🔑' },
                  ].map(({ val, icon }) => (
                    <button
                      key={val}
                      type="button"
                      className={`cat-btn ${form.category === val ? 'cat-btn--active' : ''}`}
                      onClick={() => setForm({ ...form, category: val })}
                    >
                      <span>{icon}</span>
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="step-content">
              <h3 className="step-title">Tell us about the item</h3>
              <div className="form-group">
                <label>Item Title *</label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g. Blue Samsung Galaxy S24"
                  value={form.title}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="split-row">
                <div className="form-group">
                  <label>📍 Location *</label>
                  <input
                    type="text"
                    name="location"
                    placeholder="e.g. Library, Block A"
                    value={form.location}
                    onChange={handleChange}
                    minLength={3}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>📅 Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    max={today}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>📞 Contact Number</label>
                <input
                  type="tel"
                  name="contact"
                  placeholder="Enter 10 digit mobile number"
                  value={form.contact}
                  onChange={handleChange}
                  maxLength={10}
                  pattern="[0-9]{10}"
                />
                <span className="field-hint">
                  {form.contact ? `${form.contact.length}/10 digits` : 'Must be exactly 10 digits'}
                </span>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="step-content">
              <h3 className="step-title">Additional details</h3>
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  placeholder="Describe the item, its color, size, any identifying marks..."
                  value={form.description}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Upload Image</label>
                <div className="file-upload-area">
                  <input
                    type="file"
                    name="image"
                    id="image-upload"
                    onChange={handleChange}
                    accept="image/*"
                  />
                  <label htmlFor="image-upload" className="file-upload-label">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="image-preview" />
                    ) : (
                      <>
                        <span className="upload-icon">📷</span>
                        <span>Click to upload an image</span>
                        <span className="upload-hint">JPG, PNG up to 5MB</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
              {form.type === 'Lost' && (
                <>
                  <div className="form-group">
                    <label>💭 Sentiments</label>
                    <textarea
                      name="sentiments"
                      placeholder="Share your feelings about losing this item"
                      value={form.sentiments}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label>🎁 Rewards (Optional)</label>
                    <input
                      type="text"
                      name="rewards"
                      placeholder="Any reward for returning the item?"
                      value={form.rewards}
                      onChange={handleChange}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <div className="form-actions">
            {currentStep > 1 && (
              <button type="button" className="secondary-btn" onClick={handleBack}>
                ← Back
              </button>
            )}

            {currentStep < 3 ? (
              <button type="button" className="primary-btn" onClick={handleNext}>
                Continue →
              </button>
            ) : (
              <button type="submit" className="submit-btn">
                🚀 Submit Report
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemForm;