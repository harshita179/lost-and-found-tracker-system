import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import API_BASE_URL from '../api';
import './ItemLookupPage.css';

function ItemLookupPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await fetch(`${API_BASE_URL}/api/items/${id}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.message || 'Unable to load item details');
          return;
        }

        setItem(data);
      } catch (err) {
        setError('Unable to reach the item service');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  const imageUrl = item?.image
    ? `${API_BASE_URL}/${item.image.startsWith('/') ? item.image.slice(1) : item.image}`
    : null;

  return (
    <div className="item-lookup-page">
      <div className="item-lookup-shell">
        <div className="item-lookup-header">
          <p className="item-lookup-kicker">Lost & Found</p>
          <h1>Scanned Item Details</h1>
          <p>Use this page to verify the item information after scanning the QR code.</p>
        </div>

        {loading && <div className="item-lookup-card"><p>Loading item details...</p></div>}

        {!loading && error && (
          <div className="item-lookup-card item-lookup-error">
            <p>{error}</p>
          </div>
        )}

        {!loading && item && (
          <div className="item-lookup-card">
            {imageUrl && <img src={imageUrl} alt={item.title} className="item-lookup-image" />}

            <div className="item-lookup-meta">
              <span className={`item-lookup-badge ${(item.itemType || '').toLowerCase()}`}>
                {item.itemType || 'Item'}
              </span>
              <span className={`item-lookup-status ${item.status || 'open'}`}>
                {item.status || 'open'}
              </span>
            </div>

            <h2>{item.title}</h2>
            <p className="item-lookup-description">{item.description || 'No description available.'}</p>

            <div className="item-lookup-grid">
              <div>
                <span className="item-lookup-label">Item ID</span>
                <strong>{item._id}</strong>
              </div>
              <div>
                <span className="item-lookup-label">Category</span>
                <strong>{item.category || 'General'}</strong>
              </div>
              <div>
                <span className="item-lookup-label">Location</span>
                <strong>{item.location || 'Unknown'}</strong>
              </div>
              <div>
                <span className="item-lookup-label">Date</span>
                <strong>{item.dateLost || 'N/A'}</strong>
              </div>
              <div>
                <span className="item-lookup-label">Reported By</span>
                <strong>{item.reportedBy?.username || 'Anonymous'}</strong>
              </div>
              <div>
                <span className="item-lookup-label">Contact</span>
                <strong>{item.contact || 'Not provided'}</strong>
              </div>
            </div>
          </div>
        )}

        <div className="item-lookup-actions">
          <Link to="/dashboard" className="item-lookup-link">Open dashboard</Link>
          <Link to="/login" className="item-lookup-link secondary">Login</Link>
        </div>
      </div>
    </div>
  );
}

export default ItemLookupPage;
