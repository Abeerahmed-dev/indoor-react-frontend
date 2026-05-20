import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DollarSign, Calendar, Clock, Users, AlertTriangle, Zap } from 'lucide-react';
import './AdminPages.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const venueId = userInfo?.owned_venues?.[0];

  useEffect(() => {
    if (!venueId) { setLoading(false); return; }
    const fetchStats = async () => {
      try {
        setError(null);
        const res = await axios.get(`/api/admin/stats/${venueId}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        setStats(res.data);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 404) {
          setError('VENUE_NOT_FOUND');
        }
      }
      finally { setLoading(false); }
    };
    fetchStats();
  }, [venueId]);

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    return `${h > 12 ? h - 12 : h || 12}:${(m || 0).toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  if (!venueId || error === 'VENUE_NOT_FOUND') {
    return (
      <div className="ap-empty">
        <p>{error === 'VENUE_NOT_FOUND' ? '⚠️ Your venue data is out of sync.' : "You haven't claimed a venue yet."}</p>
        <button className="ap-action-btn" onClick={() => navigate('/apply-admin')}>
          {error === 'VENUE_NOT_FOUND' ? 'Re-Claim / Register Venue' : 'Claim Your Turf'}
        </button>
      </div>
    );
  }
  if (loading) return <div className="ap-loading">Loading dashboard...</div>;

  return (
    <div className="ap-page">
      <h2 className="ap-title">Dashboard Overview</h2>

      {/* Top Stats Row — 4 summary cards */}
      <div className="ap-stats-grid">
        <div className="ap-stat-card green">
          <DollarSign size={20} />
          <span className="ap-stat-num">PKR {stats?.todaysRevenue || 0}</span>
          <span className="ap-stat-label">Today's Revenue</span>
        </div>
        <div className="ap-stat-card blue">
          <Calendar size={20} />
          <span className="ap-stat-num">{stats?.bookingsToday || 0}</span>
          <span className="ap-stat-label">Bookings Today</span>
        </div>
        <div className="ap-stat-card purple">
          <Clock size={20} />
          <span className="ap-stat-num">{stats?.availableSlots || 0}</span>
          <span className="ap-stat-label">Available Slots</span>
        </div>
        <div className="ap-stat-card orange">
          <AlertTriangle size={20} />
          <span className="ap-stat-num">{stats?.pendingPayments || 0}</span>
          <span className="ap-stat-label">Pending Clearances</span>
        </div>
      </div>

      {/* Quick Block Slot */}
      <button className="ap-quick-block-btn" onClick={() => navigate('/admin/calendar')}>
        <Zap size={18} />
        Quick Block Slot (Walk-in)
      </button>

      {/* Live Timeline — today's matches */}
      <h3 className="ap-section-title">Live Timeline — Today's Matches</h3>
      {stats?.todaysBookings?.length > 0 ? (
        <div className="ap-timeline">
          {stats.todaysBookings
            .sort((a, b) => a.start_time.localeCompare(b.start_time))
            .map((b, i) => (
            <div className="ap-timeline-item" key={i}>
              <div className="ap-timeline-time">{formatTime(b.start_time)}</div>
              <div className="ap-timeline-dot" />
              <div className="ap-timeline-info">
                <span className="ap-timeline-sport">{b.court_id?.sport_type || 'Sport'}</span>
                <span className="ap-timeline-player">{b.user_id?.name || 'Walk-in Customer'}</span>
                <span className="ap-timeline-court">{b.court_id?.name || 'Court'}</span>
              </div>
              <span className={`ap-pay-badge-sm ${b.payment_status?.toLowerCase()}`}>
                {b.payment_status === 'PAID' ? '✅ Paid' : b.payment_status === 'PARTIAL' ? '⚠️ 50%' : '❌ Unpaid'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="ap-empty-small">No matches scheduled for today.</div>
      )}
    </div>
  );
};

export default AdminDashboard;
