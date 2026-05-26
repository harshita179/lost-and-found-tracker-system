import React, { useState, useEffect, useMemo } from 'react';
import ItemList from './ItemList';
import ItemForm from './ItemForm';
import ContactForm from './ContactForm';
import './Dashboard.css';
import API_BASE_URL from '../api';

function Dashboard({ token, user, onLogout }) {
  const [activeTab, setActiveTab] = useState('list');
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [allItems, setAllItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, lost: 0, found: 0, resolved: 0 });

  const categories = [
    { label: 'All', icon: '📦' },
    { label: 'Electronics', icon: '🔌' },
    { label: 'Wallet', icon: '👛' },
    { label: 'Keys', icon: '🗝️' },
    { label: 'Books', icon: '📚' },
    { label: 'Documents', icon: '📄' },
    { label: 'Accessories', icon: '💎' },
  ];

  // Dark mode toggle
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Good morning';
    if (hour < 17) return '☀️ Good afternoon';
    if (hour < 21) return '🌆 Good evening';
    return '🌙 Good night';
  }, []);

  // Fetch all items (for stats, feed, top locations)
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`${API_BASE_URL}/api/items`, { headers });
        const data = await res.json();
        if (Array.isArray(data)) {
          setAllItems(data);
          setStats({
            total: data.length,
            lost: data.filter(i => (i.itemType || i.type || '').toLowerCase() === 'lost').length,
            found: data.filter(i => (i.itemType || i.type || '').toLowerCase() === 'found').length,
            resolved: data.filter(i => i.status === 'resolved').length,
          });
        }
      } catch (err) {
        console.error('Stats fetch error:', err);
      }
    };
    fetchItems();
  }, [refreshKey]);

  // Time-ago helper
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

  // Recent activity feed (last 5 items sorted by date)
  const recentActivity = useMemo(() => {
    return [...allItems]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  }, [allItems]);

  // Top locations (most frequent)
  const topLocations = useMemo(() => {
    const locationMap = {};
    allItems.forEach(item => {
      const loc = (item.location || 'Unknown').trim();
      if (!locationMap[loc]) locationMap[loc] = { count: 0, lost: 0, found: 0 };
      locationMap[loc].count++;
      if ((item.itemType || item.type || '').toLowerCase() === 'lost') locationMap[loc].lost++;
      else locationMap[loc].found++;
    });
    return Object.entries(locationMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [allItems]);

  const handleItemAdded = () => {
    setRefreshKey(refreshKey + 1);
    setActiveTab('list');
  };

  return (
    <div className={`app-layout ${darkMode ? 'dark-mode' : ''}`}>
      {/* Mobile hamburger */}
      <button
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        <span className={`hamburger ${sidebarOpen ? 'open' : ''}`}>
          <span></span><span></span><span></span>
        </span>
      </button>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <div className="sidebar-logo-icon">🏛️</div>
            <div>
              <h3>Medicaps University</h3>
              <span className="sidebar-subtitle">Lost & Found</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => { setActiveTab('list'); setSidebarOpen(false); }}
            >
              <span className="nav-icon">🏠</span>
              <span>Dashboard</span>
            </button>
            <button
              className={`nav-item ${activeTab === 'report' ? 'active' : ''}`}
              onClick={() => { setActiveTab('report'); setSidebarOpen(false); }}
            >
              <span className="nav-icon">📝</span>
              <span>Report Item</span>
            </button>
            {user?.role !== 'admin' && (
              <button
                className={`nav-item ${activeTab === 'contact' ? 'active' : ''}`}
                onClick={() => { setActiveTab('contact'); setSidebarOpen(false); }}
              >
                <span className="nav-icon">💬</span>
                <span>Contact Admin</span>
              </button>
            )}
            {user?.role === 'admin' && (
              <button
                className="nav-item admin-nav-item"
                onClick={() => { window.location.href = '/admin'; }}
              >
                <span className="nav-icon">⚙️</span>
                <span>Admin Panel</span>
              </button>
            )}
          </nav>

          {/* Dark mode toggle */}
          <div className="theme-toggle-wrap">
            <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)} title="Toggle dark mode">
              <span className="theme-toggle-track">
                <span className={`theme-toggle-thumb ${darkMode ? 'dark' : ''}`}>
                  {darkMode ? '🌙' : '☀️'}
                </span>
              </span>
              <span className="theme-toggle-label">{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
          </div>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="user-avatar">
              {(user?.username || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.username}</span>
              <span className="user-role-badge">
                {user?.role === 'admin' ? '🛡️ Admin' : '👤 User'}
              </span>
            </div>
          </div>
          <button className="sidebar-logout" onClick={onLogout}>
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {/* Top bar with greeting */}
        <header className="top-bar">
          <div className="top-bar-left">
            <h1 className="page-title">
              {activeTab === 'list'
                ? <>{greeting}, <span className="greeting-name">{user?.username?.split(' ')[0]}</span></>
                : activeTab === 'report' ? 'Report Item' : 'Contact Admin'}
            </h1>
            <p className="page-subtitle">
              {activeTab === 'list'
                ? 'Here\'s what\'s happening on campus today'
                : activeTab === 'report' 
                  ? 'Submit a new lost or found item report'
                  : 'Send a message to the admin'}
            </p>
          </div>
          <div className="top-bar-right">
            <div className="user-pill">
              <div className="user-pill-avatar">
                {(user?.username || 'U').charAt(0).toUpperCase()}
              </div>
              <span>{user?.username}</span>
            </div>
          </div>
        </header>

        {activeTab === 'list' && (
          <>
            {/* Stats cards */}
            <div className="stats-row">
              <div className="stat-card stat-total">
                <div className="stat-icon-wrap">
                  <span>📊</span>
                </div>
                <div className="stat-info">
                  <span className="stat-number">{stats.total}</span>
                  <span className="stat-label">Total Items</span>
                </div>
              </div>
              <div className="stat-card stat-lost">
                <div className="stat-icon-wrap stat-icon-amber">
                  <span>🔍</span>
                </div>
                <div className="stat-info">
                  <span className="stat-number">{stats.lost}</span>
                  <span className="stat-label">Lost</span>
                </div>
              </div>
              <div className="stat-card stat-found">
                <div className="stat-icon-wrap stat-icon-emerald">
                  <span>📦</span>
                </div>
                <div className="stat-info">
                  <span className="stat-number">{stats.found}</span>
                  <span className="stat-label">Found</span>
                </div>
              </div>
              <div className="stat-card stat-resolved">
                <div className="stat-icon-wrap stat-icon-primary">
                  <span>✅</span>
                </div>
                <div className="stat-info">
                  <span className="stat-number">{stats.resolved}</span>
                  <span className="stat-label">Resolved</span>
                </div>
              </div>
            </div>

            {/* Live Activity Feed + Top Locations */}
            <div className="widgets-row">
              {/* Live Activity Feed */}
              <div className="widget activity-feed">
                <div className="widget-header">
                  <h3><span className="pulse-dot"></span> Live Activity</h3>
                </div>
                <div className="feed-list">
                  {recentActivity.length === 0 ? (
                    <p className="feed-empty">No recent activity</p>
                  ) : (
                    recentActivity.map((item) => {
                      const itemType = (item.itemType || item.type || '').toLowerCase();
                      return (
                        <div className="feed-item" key={item._id}>
                          <div className={`feed-dot ${itemType}`}></div>
                          <div className="feed-info">
                            <span className="feed-text">
                              <strong>{item.reportedBy?.username || 'Someone'}</strong>
                              {itemType === 'lost' ? ' reported lost ' : ' found '}
                              <strong>{item.title}</strong>
                              {item.location ? ` near ${item.location}` : ''}
                            </span>
                            <span className="feed-time">{timeAgo(item.createdAt)}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Top Locations */}
              <div className="widget top-locations">
                <div className="widget-header">
                  <h3>📍 Hotspot Locations</h3>
                </div>
                <div className="locations-list">
                  {topLocations.length === 0 ? (
                    <p className="feed-empty">No location data yet</p>
                  ) : (
                    topLocations.map((loc, i) => (
                      <div className="location-item" key={loc.name}>
                        <div className="location-rank">#{i + 1}</div>
                        <div className="location-info">
                          <span className="location-name">{loc.name}</span>
                          <div className="location-bar-track">
                            <div
                              className="location-bar-fill"
                              style={{ width: `${(loc.count / (topLocations[0]?.count || 1)) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="location-stats">
                          <span className="loc-lost">{loc.lost} lost</span>
                          <span className="loc-found">{loc.found} found</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Search + filter bar */}
            <div className="filter-bar">
              <div className="search-input-wrap">
                <span className="search-icon">🔎</span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search items, location, or description..."
                  className="search-input"
                  id="dashboard-search"
                />
              </div>

              <div className="category-chips">
                {categories.map(({ label, icon }) => (
                  <button
                    key={label}
                    className={`chip ${selectedCategory === label ? 'chip--active' : ''}`}
                    onClick={() => setSelectedCategory(label)}
                  >
                    <span>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Content */}
        <div className="content-area">
          {activeTab === 'list' && (
            <ItemList
              key={refreshKey}
              token={token}
              user={user}
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              allItems={allItems}
            />
          )}
          {activeTab === 'report' && (
            <ItemForm token={token} onItemAdded={handleItemAdded} />
          )}
          {activeTab === 'contact' && (
            <ContactForm token={token} />
          )}
        </div>

        {/* Floating add button */}
        {activeTab === 'list' && (
          <button
            className="fab"
            onClick={() => setActiveTab('report')}
            title="Report an item"
            id="fab-report"
          >
            <span>+</span>
          </button>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
