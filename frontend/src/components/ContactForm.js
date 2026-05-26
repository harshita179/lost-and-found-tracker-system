import React, { useState } from 'react';
import './ContactForm.css';
import API_BASE_URL from '../api';

function ContactForm({ token }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [myMessages, setMyMessages] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const fetchMyMessages = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/contact/my-messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.contacts) {
        setMyMessages(data.contacts);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ subject, message })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Message sent to admin successfully!');
        setSubject('');
        setMessage('');
        if (showHistory) {
          fetchMyMessages();
        }
      } else {
        setError(data.message || 'Failed to send message');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleHistory = () => {
    if (!showHistory) {
      fetchMyMessages();
    }
    setShowHistory(!showHistory);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'read': return '#3b82f6';
      case 'replied': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div className="contact-form-container">
      <div className="contact-form-header">
        <h2>📬 Contact Admin</h2>
        <p>Have a question or need help? Send a message to the admin.</p>
      </div>

      {success && <div className="alert-success">{success}</div>}
      {error && <div className="alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="contact-form">
        <div className="form-group">
          <label htmlFor="subject">Subject</label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g., Question about my item"
            maxLength={100}
            required
          />
          <span className="char-count">{subject.length}/100</span>
        </div>

        <div className="form-group">
          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your question or issue in detail..."
            rows={6}
            maxLength={2000}
            required
          />
          <span className="char-count">{message.length}/2000</span>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Sending...' : '🚀 Send Message'}
        </button>
      </form>

      <button className="toggle-history-btn" onClick={toggleHistory}>
        {showHistory ? 'Hide My Messages' : '📋 View My Messages'}
      </button>

      {showHistory && (
        <div className="messages-history">
          <h3>Your Messages</h3>
          {myMessages.length === 0 ? (
            <p className="no-messages">No messages yet.</p>
          ) : (
            <div className="messages-list">
              {myMessages.map((msg) => (
                <div key={msg._id} className="message-card">
                  <div className="message-header">
                    <span className="message-subject">{msg.subject}</span>
                    <span 
                      className="message-status"
                      style={{ backgroundColor: getStatusColor(msg.status) }}
                    >
                      {msg.status}
                    </span>
                  </div>
                  <p className="message-text">{msg.message}</p>
                  <div className="message-meta">
                    <span className="message-date">
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {msg.adminReply && (
                    <div className="admin-reply">
                      <strong>💬 Admin Reply:</strong>
                      <p>{msg.adminReply}</p>
                      <span className="reply-date">
                        {new Date(msg.repliedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ContactForm;