import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, MapPin, Users, Calendar, Clock, DollarSign,
  Settings, BarChart2, Plus
} from 'lucide-react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [ownedVenues, setOwnedVenues] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all venues and filter owned by user
        const venuesRes = await axios.get('/api/venues');
        const owned = venuesRes.data.filter((v) =>
          userInfo?.owned_venues?.includes(v._id)
        );
        setOwnedVenues(owned);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (!userInfo) return null;

  const formatTimeRange = (start, end) => {
    const fmt = (t) => {
      const [h, m] = t.split(':').map(Number);
      return `${h > 12 ? h - 12 : h || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
    };
    return `${fmt(start)} - ${fmt(end)}`;
  };

  return (
    <div className="ad-wrapper">
      <div className="ad-container">

        {/* Header */}
        <div className="ad-header">
          <button className="ad-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </button>
          <h1 className="ad-header-title">Venue Dashboard</h1>
          <div style={{ width: 40 }}></div>
        </div>

        {/* Welcome */}
        <div className="ad-welcome-card">
          <div className="ad-welcome-left">
            <span className="ad-welcome-role">VENUE ADMIN</span>
            <h2 className="ad-welcome-name">Welcome, {userInfo.name}!</h2>
            <p className="ad-welcome-desc">Manage your venues from here.</p>
          </div>
          <div className="ad-welcome-icon">
            <Settings size={36} color="#667eea" />
          </div>
        </div>

        {/* Stats */}
        <div className="ad-stats-row">
          <div className="ad-stat-card">
            <BarChart2 size={20} color="#667eea" />
            <span className="ad-stat-num">{ownedVenues.length}</span>
            <span className="ad-stat-label">Venues</span>
          </div>
          <div className="ad-stat-card">
            <Users size={20} color="#10b981" />
            <span className="ad-stat-num">—</span>
            <span className="ad-stat-label">Bookings</span>
          </div>
          <div className="ad-stat-card">
            <DollarSign size={20} color="#f59e0b" />
            <span className="ad-stat-num">—</span>
            <span className="ad-stat-label">Revenue</span>
          </div>
        </div>

        {/* My Venues Section Header */}
        <div className="ad-section-header">
          <h3>My Venues</h3>
          <button className="ad-claim-btn" onClick={() => navigate('/user/apply-admin')}>
            <Plus size={14} /> Claim More
          </button>
        </div>

        {loading ? (
          <div className="ad-loading">Loading...</div>
        ) : ownedVenues.length === 0 ? (
          <div className="ad-empty">
            <p>No venues claimed yet.</p>
            <button className="ad-explore-btn" onClick={() => navigate('/user/apply-admin')}>
              Claim Your First Turf
            </button>
          </div>
        ) : (
          <div className="ad-venues-list">
            {ownedVenues.map((venue) => (
              <div className="ad-venue-card" key={venue._id}>
                <div className="ad-venue-img">
                  {venue.image ? (
                    <img src={venue.image} alt={venue.name} />
                  ) : (
                    <MapPin size={24} color="#94a3b8" />
                  )}
                </div>
                <div className="ad-venue-info">
                  <div className="ad-venue-name">{venue.name}</div>
                  <div className="ad-venue-addr">
                    <MapPin size={12} color="#94a3b8" />
                    {venue.address}
                  </div>
                  <div className="ad-venue-status">
                    <span className="ad-claimed-badge">CLAIMED</span>
                    <span className="ad-sport-badge">{venue.sport_type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="ad-actions-grid">
          <button className="ad-action-card" onClick={() => navigate('/user/apply-admin')}>
            <Plus size={22} color="#667eea" />
            <span>Claim Venue</span>
          </button>
          <button className="ad-action-card" onClick={() => navigate('/admin/bookings')}>
            <Calendar size={22} color="#10b981" />
            <span>View Bookings</span>
          </button>
          <button className="ad-action-card" onClick={() => navigate('/user/profile')}>
            <Users size={22} color="#f59e0b" />
            <span>My Profile</span>
          </button>
          <button className="ad-action-card" onClick={() => navigate('/admin/settings')}>
            <Settings size={22} color="#ef4444" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
