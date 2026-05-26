import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';
import API_BASE_URL from '../api';

function AdminDashboard({ token, onLogout }) {
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingItems, setPendingItems] = useState([]);
  const [approvedItems, setApprovedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [matchNotes, setMatchNotes] = useState('');

  // Messages state
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyModal, setReplyModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [messageFilter, setMessageFilter] = useState('all');

  useEffect(() => {
    fetchPendingItems();
    if (activeTab === 'match') {
      fetchApprovedItems();
    }
    if (activeTab === 'messages') {
      fetchMessages();
    }
  }, [activeTab]);

  const fetchPendingItems = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/items/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingItems(res.data);
    } catch (err) {
      console.error('Error fetching pending items:', err);
      if (err.response?.status === 403) {
        alert('Access denied. Admin only.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedItems = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/items`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const unmatched = res.data.filter(item => !item.matchedItemId);
      setApprovedItems(unmatched);
    } catch (err) {
      console.error('Error fetching approved items:', err);
    }
  };

  const fetchPotentialMatches = async (itemId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/items/${itemId}/potential-matches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPotentialMatches(res.data);
    } catch (err) {
      console.error('Error fetching potential matches:', err);
      setPotentialMatches([]);
    }
  };

  const handleApprove = async (itemId) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/items/${itemId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('✅ Item approved successfully!');
      fetchPendingItems();
    } catch (err) {
      console.error('Approve error:', err);
      alert('Failed to approve item');
    }
  };

  const handleReject = async () => {
    if (!selectedItem) return;
    const rejectionReason = adminNote.trim();

    if (!rejectionReason) {
      alert('Please enter a rejection reason.');
      return;
    }

    try {
      await axios.patch(`${API_BASE_URL}/api/items/${selectedItem._id}/reject`, 
        { adminNote: rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('❌ Item rejected');
      setRejectModal(false);
      setAdminNote('');
      setSelectedItem(null);
      fetchPendingItems();
    } catch (err) {
      console.error('Reject error:', err);
      alert('Failed to reject item');
    }
  };

  const openRejectModal = (item) => {
    setSelectedItem(item);
    setAdminNote('');
    setRejectModal(true);
  };

  const handleMatch = async (matchedItemId) => {
    if (!selectedItem) return;
    try {
      await axios.patch(
        `${API_BASE_URL}/api/items/${selectedItem._id}/match/${matchedItemId}`,
        { notes: matchNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('✅ Items matched successfully! Both users will be notified.');
      setSelectedItem(null);
      setPotentialMatches([]);
      setMatchNotes('');
      fetchApprovedItems();
    } catch (err) {
      console.error('Match error:', err);
      alert(err.response?.data?.message || 'Failed to match items');
    }
  };

  // Messages functions
  const fetchMessages = async () => {
    try {
      setMessagesLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/contact/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data.contacts || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleMarkRead = async (msgId) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/contact/${msgId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMessages();
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const openReplyModal = (msg) => {
    setReplyMessage(msg);
    setReplyText(msg.adminReply || '');
    setReplyModal(true);
  };

  const handleSendReply = async () => {
    if (!replyMessage || !replyText.trim()) return;
    try {
      setReplyLoading(true);
      await axios.post(`${API_BASE_URL}/api/contact/${replyMessage._id}/reply`,
        { reply: replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReplyModal(false);
      setReplyMessage(null);
      setReplyText('');
      fetchMessages();
    } catch (err) {
      console.error('Reply error:', err);
      alert('Failed to send reply');
    } finally {
      setReplyLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return { label: 'Pending', className: 'msg-status-pending' };
      case 'read': return { label: 'Read', className: 'msg-status-read' };
      case 'replied': return { label: 'Replied', className: 'msg-status-replied' };
      default: return { label: status, className: '' };
    }
  };

  const filteredMessages = messageFilter === 'all'
    ? messages
    : messages.filter(m => m.status === messageFilter);

  const messageCounts = {
    all: messages.length,
    pending: messages.filter(m => m.status === 'pending').length,
    read: messages.filter(m => m.status === 'read').length,
    replied: messages.filter(m => m.status === 'replied').length,
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const lostItems = approvedItems.filter(i => i.itemType === 'Lost');
  const foundItems = approvedItems.filter(i => i.itemType === 'Found');

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-title">
          <span className="admin-icon">⚙️</span>
          <h1>Admin Dashboard</h1>
        </div>
        <div className="header-tabs">
          <button 
            className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            📋 Pending ({pendingItems.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'match' ? 'active' : ''}`}
            onClick={() => setActiveTab('match')}
          >
            🔗 Match Items
          </button>
          <button 
            className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            📬 Messages {messageCounts.pending > 0 && <span className="msg-count-badge">{messageCounts.pending}</span>}
          </button>
        </div>
        <button className="back-btn" onClick={() => window.history.back()}>
          ← Back
        </button>
      </div>

      {/* PENDING TAB */}
      {activeTab === 'pending' && (
        <>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : pendingItems.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">✅</span>
              <h2>No Pending Items</h2>
              <p>All items have been reviewed!</p>
            </div>
          ) : (
            <div className="items-grid">
              {pendingItems.map((item) => (
                <div key={item._id} className="pending-card">
                  <div className="card-header">
                    <span className={`type-badge ${item.itemType?.toLowerCase()}`}>
                      {item.itemType}
                    </span>
                    <span className="category-badge">{item.category}</span>
                    <span className="time-badge">{timeAgo(item.createdAt)}</span>
                  </div>
                  {item.image && (
                    <div className="item-image">
                      <img src={`${API_BASE_URL}/${item.image}`} alt={item.title} />
                    </div>
                  )}
                  <h3 className="item-title">{item.title}</h3>
                  <p className="item-description">{item.description}</p>
                  <div className="item-details">
                    <div className="detail-row">
                      <span className="detail-label">📍 Location:</span>
                      <span>{item.location}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">📅 Date:</span>
                      <span>{item.dateLost}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">👤 Reported by:</span>
                      <span>{item.reportedBy?.username || 'Unknown'}</span>
                    </div>
                  </div>
                  <div className="card-actions">
                    <button className="approve-btn" onClick={() => handleApprove(item._id)}>
                      ✓ Approve
                    </button>
                    <button className="reject-btn" onClick={() => openRejectModal(item)}>
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* MATCH TAB */}
      {activeTab === 'match' && (
        <>
          {approvedItems.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📦</span>
              <h2>No Items to Match</h2>
              <p>Approve some items first to match lost and found items.</p>
            </div>
          ) : (
            <div className="match-section">
              <div className="match-instructions">
                <h3>🔗 Match Lost & Found Items</h3>
                <p>Click on a Lost item to see potential Found matches, or vice versa.</p>
              </div>
              
              <div className="match-grid">
                <div className="match-column">
                  <h4>🔍 Lost Items ({lostItems.length})</h4>
                  {lostItems.map(item => (
                    <div 
                      key={item._id} 
                      className={`match-card ${selectedItem?._id === item._id ? 'selected' : ''}`}
                      onClick={() => { setSelectedItem(item); fetchPotentialMatches(item._id); }}
                    >
                      {item.image && (
                        <div className="match-card-image">
                          <img src={`${API_BASE_URL}/${item.image}`} alt={item.title} />
                        </div>
                      )}
                      <span className="match-type lost">Lost</span>
                      <strong>{item.title}</strong>
                      <span className="match-location">📍 {item.location}</span>
                    </div>
                  ))}
                </div>

                <div className="match-column">
                  <h4>📦 Found Items ({foundItems.length})</h4>
                  {foundItems.map(item => (
                    <div 
                      key={item._id} 
                      className={`match-card ${selectedItem?._id === item._id ? 'selected' : ''}`}
                      onClick={() => { setSelectedItem(item); fetchPotentialMatches(item._id); }}
                    >
                      {item.image && (
                        <div className="match-card-image">
                          <img src={`${API_BASE_URL}/${item.image}`} alt={item.title} />
                        </div>
                      )}
                      <span className="match-type found">Found</span>
                      <strong>{item.title}</strong>
                      <span className="match-location">📍 {item.location}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedItem && (
                <div className="potential-matches-panel">
                  <h4>Potential Matches for: {selectedItem.title}</h4>
                  {potentialMatches.length === 0 ? (
                    <p className="no-matches">No potential matches found.</p>
                  ) : (
                    <div className="matches-list">
                      {potentialMatches.map(match => (
                        <div key={match._id} className="match-option">
                          {match.image && (
                            <div className="match-option-image">
                              <img src={`${API_BASE_URL}/${match.image}`} alt={match.title} />
                            </div>
                          )}
                          <div className="match-info">
                            <strong>{match.title}</strong>
                            <span>📍 {match.location} | 📅 {match.dateLost}</span>
                            <span>👤 {match.reportedBy?.username}</span>
                          </div>
                          <div className="match-notes-input">
                            <input
                              type="text"
                              placeholder="Add notes (optional)"
                              value={matchNotes}
                              onChange={(e) => setMatchNotes(e.target.value)}
                            />
                            <button className="match-btn" onClick={() => handleMatch(match._id)}>
                              🔗 Match
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* MESSAGES TAB */}
      {activeTab === 'messages' && (
        <>
          {/* Message Filter Chips */}
          <div className="msg-filter-bar">
            <button
              className={`msg-filter-chip ${messageFilter === 'all' ? 'active' : ''}`}
              onClick={() => setMessageFilter('all')}
            >
              📬 All ({messageCounts.all})
            </button>
            <button
              className={`msg-filter-chip pending ${messageFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setMessageFilter('pending')}
            >
              🕐 Pending ({messageCounts.pending})
            </button>
            <button
              className={`msg-filter-chip read ${messageFilter === 'read' ? 'active' : ''}`}
              onClick={() => setMessageFilter('read')}
            >
              👁️ Read ({messageCounts.read})
            </button>
            <button
              className={`msg-filter-chip replied ${messageFilter === 'replied' ? 'active' : ''}`}
              onClick={() => setMessageFilter('replied')}
            >
              ✅ Replied ({messageCounts.replied})
            </button>
          </div>

          {messagesLoading ? (
            <div className="loading">Loading messages...</div>
          ) : filteredMessages.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <h2>No Messages</h2>
              <p>{messageFilter === 'all' ? 'No messages from users yet.' : `No ${messageFilter} messages.`}</p>
            </div>
          ) : (
            <div className="messages-grid">
              {filteredMessages.map((msg) => {
                const statusBadge = getStatusBadge(msg.status);
                return (
                  <div key={msg._id} className={`msg-card ${msg.status}`}>
                    <div className="msg-card-top">
                      <div className="msg-user-info">
                        <div className="msg-user-avatar">
                          {(msg.userId?.username || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="msg-username">{msg.userId?.username || 'Unknown User'}</span>
                          <span className="msg-email">{msg.userId?.email || ''}</span>
                        </div>
                      </div>
                      <div className="msg-meta-right">
                        <span className={`msg-status-badge ${statusBadge.className}`}>
                          {statusBadge.label}
                        </span>
                        <span className="msg-time">{timeAgo(msg.createdAt)}</span>
                      </div>
                    </div>

                    <div className="msg-subject">📌 {msg.subject}</div>
                    <div className="msg-body">{msg.message}</div>

                    {msg.adminReply && (
                      <div className="msg-reply-box">
                        <div className="msg-reply-label">💬 Your Reply</div>
                        <p className="msg-reply-text">{msg.adminReply}</p>
                        <span className="msg-reply-time">
                          Replied {msg.repliedAt ? new Date(msg.repliedAt).toLocaleString() : ''}
                        </span>
                      </div>
                    )}

                    <div className="msg-card-actions">
                      {msg.status === 'pending' && (
                        <button className="msg-action-btn mark-read" onClick={() => handleMarkRead(msg._id)}>
                          👁️ Mark as Read
                        </button>
                      )}
                      <button className="msg-action-btn reply-btn" onClick={() => openReplyModal(msg)}>
                        {msg.adminReply ? '✏️ Edit Reply' : '💬 Reply'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Reject Item</h2>
            <p>Are you sure you want to reject this item?</p>
            <div className="modal-item-info">
              <strong>{selectedItem?.title}</strong>
            </div>
            <div className="form-group">
              <label>Reason for rejection:</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Explain why this item is being rejected..."
                rows={3}
                required
              />
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => { setRejectModal(false); setAdminNote(''); setSelectedItem(null); }}>
                Cancel
              </button>
              <button className="confirm-reject-btn" onClick={handleReject}>
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {replyModal && (
        <div className="modal-overlay">
          <div className="modal-content reply-modal">
            <div className="reply-modal-header">
              <h2>💬 Reply to Message</h2>
              <button className="modal-close-btn" onClick={() => { setReplyModal(false); setReplyText(''); }}>
                ✕
              </button>
            </div>

            <div className="reply-original-msg">
              <div className="reply-original-user">
                <div className="msg-user-avatar small">
                  {(replyMessage?.userId?.username || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <strong>{replyMessage?.userId?.username}</strong>
                  <span className="msg-email">{replyMessage?.userId?.email}</span>
                </div>
              </div>
              <div className="reply-original-subject">📌 {replyMessage?.subject}</div>
              <p className="reply-original-body">{replyMessage?.message}</p>
              <span className="reply-original-time">
                Sent on {replyMessage?.createdAt ? new Date(replyMessage.createdAt).toLocaleString() : ''}
              </span>
            </div>

            <div className="form-group">
              <label>Your Reply:</label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply to the user..."
                rows={5}
                className="reply-textarea"
              />
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => { setReplyModal(false); setReplyText(''); }}>
                Cancel
              </button>
              <button
                className="send-reply-btn"
                onClick={handleSendReply}
                disabled={!replyText.trim() || replyLoading}
              >
                {replyLoading ? 'Sending...' : '🚀 Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
