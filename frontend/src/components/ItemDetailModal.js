import React, { useState, useEffect } from 'react';
import './ItemDetailModal.css';
import API_BASE_URL from '../api';

const tokenize = (text = '') =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length > 2);

const computeSimilarity = (source, target) => {
  const reasons = [];
  let score = 0;

  const sourceCategory = (source?.category || '').toLowerCase();
  const targetCategory = (target?.category || '').toLowerCase();
  if (sourceCategory && targetCategory && sourceCategory === targetCategory) {
    score += 35;
    reasons.push('Same category');
  }

  const sourceLocation = (source?.location || '').toLowerCase();
  const targetLocation = (target?.location || '').toLowerCase();
  if (sourceLocation && targetLocation && sourceLocation === targetLocation) {
    score += 25;
    reasons.push('Same location');
  }

  const sourceTokens = new Set([
    ...tokenize(source?.title),
    ...tokenize(source?.description),
    ...tokenize(source?.category)
  ]);
  const targetTokens = tokenize(`${target?.title || ''} ${target?.description || ''} ${target?.category || ''}`);
  const overlap = targetTokens.filter((token) => sourceTokens.has(token));
  if (overlap.length > 0) {
    score += Math.min(25, overlap.length * 8);
    reasons.push(`Shared words: ${overlap.slice(0, 3).join(', ')}`);
  }

  const sourceType = (source?.itemType || source?.type || '').toLowerCase();
  const targetType = (target?.itemType || target?.type || '').toLowerCase();
  if (sourceType && targetType && sourceType !== targetType) {
    score += 15;
    reasons.push('Opposite report type');
  }

  return {
    score: Math.min(100, score),
    reasons
  };
};

const ItemDetailModal = ({ item, onClose, onUpdateStatus, onMatch, onDelete, user }) => {
  const [matchedItem, setMatchedItem] = useState(null);
  const [matchedItemLoading, setMatchedItemLoading] = useState(false);
  const [suggestedMatches, setSuggestedMatches] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
//eslint-disable-next-line
  useEffect(() => {
    const matchedId =
      typeof item?.matchedItemId === 'string'
        ? item.matchedItemId
        : item?.matchedItemId?._id;

    if (!matchedId) {
      setMatchedItem(null);
      return;
    }

    let isActive = true;

    const fetchMatchedItem = async () => {
      try {
        setMatchedItemLoading(true);
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`${API_BASE_URL}/api/items/${matchedId}`, { headers });
        const data = await res.json();

        if (res.ok && isActive) {
          setMatchedItem(data);
        }
      } catch (err) {
        console.error('Error fetching matched item:', err);
      } finally {
        if (isActive) {
          setMatchedItemLoading(false);
        }
      }
    };

    fetchMatchedItem();

    return () => {
      isActive = false;
    };
  }, [item?.matchedItemId]);

  useEffect(() => {
    if (!item?._id) {
      setSuggestedMatches([]);
      return;
    }

    let isActive = true;

    const fetchSuggestedMatches = async () => {
      try {
        setSuggestionsLoading(true);
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`${API_BASE_URL}/api/items`, { headers });
        const data = await res.json();

        if (!res.ok || !Array.isArray(data)) {
          return;
        }

        const currentType = (item.itemType || item.type || '').toLowerCase();
        const oppositeType = currentType === 'lost' ? 'found' : 'lost';

        const ranked = data
          .filter((candidate) => candidate?._id !== item._id)
          .filter((candidate) => (candidate.itemType || candidate.type || '').toLowerCase() === oppositeType)
          .filter((candidate) => !candidate.matchedItemId)
          .map((candidate) => ({
            ...candidate,
            ...computeSimilarity(item, candidate)
          }))
          .filter((candidate) => candidate.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);

        if (isActive) {
          setSuggestedMatches(ranked);
        }
      } catch (err) {
        console.error('Error fetching suggested matches:', err);
      } finally {
        if (isActive) {
          setSuggestionsLoading(false);
        }
      }
    };

    fetchSuggestedMatches();

    return () => {
      isActive = false;
    };
  }, [item?._id, item?.title, item?.description, item?.category, item?.location, item?.itemType, item?.type]);

  if (!item) return null;

  const itemType = (item.itemType || item.type || '').toLowerCase();
  const imageUrl = item.image
    ? item.image.startsWith('http')
      ? item.image
      : `${API_BASE_URL}/${item.image.startsWith('/') ? item.image.slice(1) : item.image}`
    : null;

  const otherPartyName = matchedItem?.reportedBy?.username || matchedItem?.title || 'Loading...';
  const otherPartyContact = matchedItem?.contact || matchedItem?.reportedBy?.phone || '';
  const matchedSimilarity = matchedItem ? computeSimilarity(item, matchedItem) : { score: 0, reasons: [] };
  const matchScore = matchedSimilarity.score;
  const matchReasons = matchedSimilarity.reasons;

  const handleCopyContact = async () => {
    if (!otherPartyContact) return;

    try {
      await navigator.clipboard.writeText(otherPartyContact);
      setCopyMessage('Copied');
      window.setTimeout(() => setCopyMessage(''), 1500);
    } catch (err) {
      console.error('Copy failed:', err);
      setCopyMessage('Copy failed');
      window.setTimeout(() => setCopyMessage(''), 1500);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="modal-body">
          {imageUrl && (
            <img src={imageUrl} alt={item.title} className="modal-image" />
          )}

          <h2>{item.title}</h2>

          <div className="detail-section">
            <p><strong>Type:</strong> {itemType === 'lost' ? 'Lost' : 'Found'}</p>
            <p><strong>Category:</strong> {item.category || 'General'}</p>
            <p><strong>Location:</strong> {item.location || 'Unknown'}</p>
            <p><strong>Date:</strong> {item.dateLost || 'N/A'}</p>
            <p><strong>Status:</strong> <span className={`status ${item.status}`}>{item.status || 'Open'}</span></p>
            <p className="item-id"><strong>Item ID:</strong> {item._id}</p>
          </div>

          <div className="detail-section">
            <h3>Description</h3>
            <p>{item.description || 'No description available.'}</p>
          </div>

          {item.sentiments ? (
            <div className="detail-section">
              <h3>Sentiments</h3>
              <p>{item.sentiments || 'Not provided'}</p>
            </div>
          ) : null}

          {item.rewards ? (
            <div className="detail-section">
              <h3>Rewards</h3>
              <p>{item.rewards || 'Not provided'}</p>
            </div>
          ) : null}

          {item.contact ? (
            <div className="detail-section">
              <h3>Contact Number</h3>
              <p>{item.contact}</p>
            </div>
          ) : null}

          {item.matchedItemId && (
            <div className="detail-section matched-contact-section">
              <h3>Contact Information</h3>
              <p className="match-notice">
                This item has been matched. Contact the other party below:
              </p>
              <div className="contact-card">
                <div className="contact-info">
                  <p><strong>Other Party:</strong> {otherPartyName}</p>
                  <p><strong>Contact:</strong> {otherPartyContact || 'Not provided'}</p>
                  {matchedItemLoading && <p>Loading matched contact...</p>}
                </div>
                {otherPartyContact && (
                  <button className="contact-copy-btn" onClick={handleCopyContact}>
                    Copy Contact
                  </button>
                )}
              </div>
              {copyMessage && <p className="copy-status">{copyMessage}</p>}
            </div>
          )}

          {matchedItem && (
            <div className="detail-section insights-section">
              <h3>Smart Match Insights</h3>
              <div className="insights-score">
                <span className="score-pill">{matchScore}% match</span>
                <p>Similarity-based score for the matched item.</p>
              </div>
              {matchReasons.length > 0 && (
                <ul className="insights-list">
                  {matchReasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="detail-section insights-section">
            <h3>Suggested Matches</h3>
            {suggestionsLoading ? (
              <p>Finding similar reports...</p>
            ) : suggestedMatches.length > 0 ? (
              <div className="suggestion-list">
                {suggestedMatches.map((candidate) => (
                  <div className="suggestion-card" key={candidate._id}>
                    <div className="suggestion-topline">
                      <strong>{candidate.title}</strong>
                      <span className="score-pill score-pill-soft">{candidate.score}%</span>
                    </div>
                    <p>{candidate.location || 'Unknown location'} · {candidate.category || 'General'}</p>
                    <p className="suggestion-reason">
                      {candidate.reasons?.length ? candidate.reasons.join(' · ') : 'High similarity'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No strong suggestions found for this report.</p>
            )}
          </div>

          <div className="detail-section">
            <p><strong>Reported by:</strong> {item.reportedBy?.username || item.reportedBy || 'Anonymous'}</p>
          </div>

          <div className="modal-actions">
            <button
              className="btn-status"
              onClick={() => onUpdateStatus(item._id, item.status === 'open' ? 'resolved' : 'open')}
            >
              {item.status === 'open' ? 'Mark Resolved' : 'Mark Open'}
            </button>
            {user?.role === 'admin' && (
              <button
                className="btn-match"
                onClick={() => {
                  const matchedId = prompt('Enter the matching item ID');
                  if (!matchedId) return;
                  if (matchedId === item._id) {
                    alert('Please enter a different item ID to match.');
                    return;
                  }
                  onMatch(item._id, matchedId);
                }}
              >
                Confirm Match
              </button>
            )}
            <button
              className="btn-delete"
              onClick={() => onDelete(item._id)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailModal;
