import React, { useEffect, useState } from "react";
import "./ItemList.css";
import ItemDetailModal from "./ItemDetailModal";
import API_BASE_URL from "../api";

export default function ItemList({ searchQuery = '', selectedCategory = 'All', user }) {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  const tokenize = (text = '') =>
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .filter((token) => token.length > 2);

  const getSimilarity = (source, target) => {
    let score = 0;

    const sourceCategory = (source?.category || '').toLowerCase();
    const targetCategory = (target?.category || '').toLowerCase();
    if (sourceCategory && targetCategory && sourceCategory === targetCategory) {
      score += 35;
    }

    const sourceLocation = (source?.location || '').toLowerCase();
    const targetLocation = (target?.location || '').toLowerCase();
    if (sourceLocation && targetLocation && sourceLocation === targetLocation) {
      score += 25;
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
    }

    const sourceType = (source?.itemType || source?.type || '').toLowerCase();
    const targetType = (target?.itemType || target?.type || '').toLowerCase();
    if (sourceType && targetType && sourceType !== targetType) {
      score += 15;
    }

    return Math.min(100, score);
  };

  const getCardBadge = (item) => {
    if (item?.matchedItemId) {
      return { label: 'Matched', variant: 'matched' };
    }

    const itemType = (item?.itemType || item?.type || '').toLowerCase();
    const oppositeType = itemType === 'lost' ? 'found' : 'lost';
    const bestScore = items
      .filter((candidate) => candidate?._id !== item?._id)
      .filter((candidate) => (candidate.itemType || candidate.type || '').toLowerCase() === oppositeType)
      .filter((candidate) => !candidate.matchedItemId)
      .reduce((max, candidate) => Math.max(max, getSimilarity(item, candidate)), 0);

    if (bestScore <= 0) {
      return { label: 'No match', variant: 'neutral' };
    }

    return { label: `${bestScore}% match`, variant: 'score' };
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const normalizedPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${API_BASE_URL}/${normalizedPath}`;
  };

  const handleAuthFailure = async (res) => {
    if (res.status === 401 || res.status === 403) {
      let message = 'Authentication failed. Please login again.';
      try {
        const payload = await res.json();
        if (payload?.message) {
          message = payload.message.includes('expired') ? 'Session expired. Please login again.' : payload.message;
        }
      } catch (_) {}
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      alert(message);
      window.location.href = '/login';
      return true;
    }
    return false;
  };

  // UPDATE STATUS
  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/items/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status }),
      });

      if (await handleAuthFailure(res)) return;
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error('Update status failed:', data);
        alert(data?.message || 'Could not update item status.');
        return;
      }

      fetchItems();
    } catch (err) {
      console.log(err);
    }
  };

  // DELETE ITEM
  const deleteItem = async (id) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/api/items/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (await handleAuthFailure(res)) return;
      const data = await res.json();
      if (!res.ok) {
        console.error('Delete failed:', data);
        alert(data?.message || 'Could not delete item.');
        return;
      }

      console.log(data);

      // UI update
      setItems(prev => prev.filter(item => item._id !== id));

    } catch (err) {
      console.log("Delete error:", err);
    }
  };

  // MATCH ITEM
  const matchItem = async (id, matchedId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/items/${id}/match/${matchedId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (await handleAuthFailure(res)) return;
      const data = await res.json();
      if (!res.ok) {
        console.error('Match failed:', data);
        alert(data?.message || 'Could not match items.');
        return;
      }

      if (data?.smsConfigured) {
        const deliveredCount = Array.isArray(data?.smsNotifications)
          ? data.smsNotifications.filter((entry) => entry.sent).length
          : 0;
        alert(`Items matched successfully. SMS sent to ${deliveredCount} contact number(s).`);
      } else {
        alert(data?.message || 'Items matched successfully, but SMS provider is not configured.');
      }
      fetchItems();
    } catch (err) {
      console.log("Match error:", err);
    }
  };

  // FETCH ITEMS
  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`${API_BASE_URL}/api/items`, { headers });
      const data = await response.json();

      if (Array.isArray(data)) {
        setItems(data);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  },[]);

  // FILTER LOGIC
  const filteredItems = items.filter((item) => {
    const itemType = (item.itemType || item.type || '').toLowerCase();
    if (filter !== "all" && itemType !== filter) return false;

    if (selectedCategory && selectedCategory !== 'All' && item.category !== selectedCategory) {
      return false;
    }

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      const searchText = `${item.title || ''} ${item.description || ''} ${item.location || ''}`.toLowerCase();
      if (!searchText.includes(query)) return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading items...</p>
      </div>
    );
  }

  return (
    <div className="item-list-container">
      <div className="list-header">
        <h2 className="list-title">Recent Reports</h2>
        <div className="type-filters">
          <button
            className={`type-filter ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`type-filter ${filter === "lost" ? "active" : ""}`}
            onClick={() => setFilter("lost")}
          >
            🔍 Lost
          </button>
          <button
            className={`type-filter ${filter === "found" ? "active" : ""}`}
            onClick={() => setFilter("found")}
          >
            📦 Found
          </button>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No items found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="items-grid">
          {filteredItems.map((item, index) => {
            const itemType = (item.itemType || item.type || '').toLowerCase();
            const imageUrl = getImageUrl(item.image);
            const smartBadge = getCardBadge(item);
            return (
              <div
                className="item-card"
                key={item._id || item.id}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="card-image-wrap">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={item.title}
                      className="card-image"
                    />
                  ) : (
                    <div className="card-image-placeholder">
                      {itemType === 'lost' ? '🔍' : '📦'}
                    </div>
                  )}
                  <span className={`card-type-badge ${itemType}`}>
                    {itemType === 'lost' ? 'Lost' : 'Found'}
                  </span>
                  <span className={`card-smart-badge ${smartBadge.variant}`}>
                    {smartBadge.label}
                  </span>
                </div>

                <div className="card-body">
                  <div className="card-header-row">
                    <h3 className="card-title">{item.title}</h3>
                    <span className={`card-status ${item.status === "resolved" ? "resolved" : "open"}`}>
                      {item.status === "resolved" ? "Resolved" : "Open"}
                    </span>
                  </div>

                  <p className="card-location">📍 {item.location || 'Unknown location'}</p>
                  <p className="card-category">{item.category || 'General'}</p>

                  {user?.role === 'admin' && (
                    <p className="card-id">ID: {item._id}</p>
                  )}

                  <div className="card-actions">
                    <button
                      className="card-btn card-btn-primary"
                      onClick={() => setSelectedItem(item)}
                    >
                      View Details
                    </button>
                    {user?.role === 'admin' && (
                      <button
                        className="card-btn card-btn-danger"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this item?')) {
                            deleteItem(item._id);
                          }
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdateStatus={updateStatus}
          onMatch={matchItem}
          onDelete={deleteItem}
          user={user}
        />
      )}
    </div>
  );
}
