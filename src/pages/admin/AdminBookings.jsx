import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, User, Calendar, Clock, CreditCard } from 'lucide-react';
import './AdminPages.css';

const AdminBookings = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const venueId = userInfo?.owned_venues?.[0];
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDate, setSearchDate] = useState('');

  useEffect(() => {
    if (!venueId) { setLoading(false); return; }
    const fetchBookings = async () => {
      try {
        const res = await axios.get(`/api/admin/bookings/${venueId}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        setBookings(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchBookings();
  }, [venueId]);

  const handleMarkPaid = async (id) => {
    try {
      await axios.put(`/api/admin/bookings/${id}/mark-paid`, {}, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      setBookings(prev => prev.map(b => b._id === id ? { ...b, payment_status: 'PAID' } : b));
    } catch (err) { alert('Failed to mark paid'); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    return `${h > 12 ? h - 12 : h || 12}:${(m || 0).toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  // Filter bookings
  const filtered = bookings.filter(b => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = b.user_id?.name?.toLowerCase().includes(q);
      const emailMatch = b.user_id?.email?.toLowerCase().includes(q);
      const idMatch = b._id.toLowerCase().includes(q);
      if (!nameMatch && !emailMatch && !idMatch) return false;
    }
    if (searchDate) {
      const bDate = new Date(b.booking_date).toISOString().split('T')[0];
      if (bDate !== searchDate) return false;
    }
    return true;
  });

  // Group by user for summary card
  const getSearchSummary = () => {
    if (!searchQuery || filtered.length === 0) return null;

    const userMap = {};
    filtered.forEach(b => {
      const uid = b.user_id?._id || 'walk-in';
      const isOffline = b.user_id?._id === userInfo._id;
      if (!userMap[uid]) {
        userMap[uid] = {
          name: isOffline ? (b.customer_name || 'Walk-in') : (b.user_id?.name || 'Walk-in'),
          email: b.user_id?.email || '—',
          bookings: [],
          totalFee: 0,
          paid: 0,
          pending: 0,
        };
      }
      const fee = b.court_id?.price_per_hour || 0;
      userMap[uid].bookings.push(b);
      userMap[uid].totalFee += fee;
      if (b.payment_status === 'PAID') userMap[uid].paid += fee;
      else userMap[uid].pending += fee;
    });

    return Object.values(userMap);
  };

  const summary = getSearchSummary();

  if (!venueId) return <div className="ap-empty">Claim a venue first.</div>;

  return (
    <div className="ap-page">
      <h2 className="ap-title">Bookings Ledger</h2>

      {/* Search Bar */}
      <div className="ap-search-bar">
        <Search size={16} className="ap-search-icon" />
        <input type="text" placeholder="🔍 Search by Player Name, Email or Booking ID..."
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>

      {/* Date Filter */}
      <div className="ap-filter-row">
        <Calendar size={14} className="ap-filter-icon" />
        <input type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)} className="ap-date-input" />
        {searchDate && (
          <button className="ap-clear-filter" onClick={() => setSearchDate('')}>✕ Clear</button>
        )}
      </div>

      {/* User Summary Card — appears when searching */}
      {summary && summary.map((user, idx) => (
        <div className="ap-user-summary" key={idx}>
          <div className="ap-user-summary-header">
            <div className="ap-user-summary-avatar">
              <User size={16} />
            </div>
            <div className="ap-user-summary-info">
              <span className="ap-user-summary-name">{user.name}</span>
              <span className="ap-user-summary-email">{user.email}</span>
            </div>
          </div>
          <div className="ap-user-summary-stats">
            <div className="ap-summary-stat">
              <Calendar size={12} />
              <span><strong>{user.bookings.length}</strong> slots booked</span>
            </div>
            <div className="ap-summary-stat">
              <CreditCard size={12} />
              <span>Total: <strong>PKR {user.totalFee}</strong></span>
            </div>
            <div className="ap-summary-stat paid">
              <span>✅ Paid: <strong>PKR {user.paid}</strong></span>
            </div>
            {user.pending > 0 && (
              <div className="ap-summary-stat pending">
                <span>⚠️ Pending: <strong>PKR {user.pending}</strong></span>
              </div>
            )}
          </div>
          <div className="ap-user-summary-slots">
            <span className="ap-slots-label">Booked Slots:</span>
            {user.bookings.map((b, i) => (
              <div className="ap-slot-chip" key={i}>
                <span>{formatDate(b.booking_date)}</span>
                <span className="ap-slot-chip-time">{formatTime(b.start_time)} → {formatTime(b.end_time)}</span>
                <span className="ap-slot-chip-court">{b.court_id?.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {loading ? <div className="ap-loading">Loading bookings...</div> : (
        <div className="ap-table-wrap">
          {/* Results count */}
          <div className="ap-results-count">
            Showing <strong>{filtered.length}</strong> of {bookings.length} bookings
          </div>

          {filtered.length === 0 ? (
            <div className="ap-empty-small">No bookings found matching your search.</div>
          ) : (
            filtered.map(b => {
              const fee = b.court_id?.price_per_hour || 0;
              const advancePaid = Math.round(fee * 0.5);
              const isPending = b.payment_status !== 'PAID' && b.status === 'CONFIRMED';
              const isOffline = b.user_id?._id === userInfo._id;

              return (
                <div className="ap-booking-row" key={b._id}>
                  <div className="ap-booking-row-top">
                    <div className="ap-booking-row-left">
                      <span className="ap-booking-player">{isOffline ? (b.customer_name || 'Walk-in') : (b.user_id?.name || 'Walk-in')}</span>
                      <span className="ap-booking-email">{b.user_id?.email || '—'}</span>
                    </div>
                    <span className={`ap-pay-badge ${b.payment_status?.toLowerCase()}`}>
                      {b.payment_status === 'PAID' ? 'Fully Paid' : b.payment_status === 'PARTIAL' ? '50% Advance' : 'Unpaid'}
                    </span>
                  </div>

                  <div className="ap-booking-row-details">
                    <span>📅 {formatDate(b.booking_date)}</span>
                    <span>🕐 {formatTime(b.start_time)} - {formatTime(b.end_time)}</span>
                    <span>🏟️ {b.court_id?.name || '—'}</span>
                  </div>

                  <div className="ap-booking-fee-row">
                    <div className="ap-fee-info">
                      <span>Total: <strong>PKR {fee}</strong></span>
                      <span>Paid: <strong>PKR {b.amount_paid || 0}</strong></span>
                      {isPending && <span>Remaining: <strong>PKR {fee - (b.amount_paid || 0)}</strong></span>}
                    </div>
                    <div className="ap-booking-actions">
                      <span className={`ap-status-badge ${b.status?.toLowerCase()}`}>{b.status}</span>
                      {isPending && (
                        <button className="ap-mark-paid-btn" onClick={() => handleMarkPaid(b._id)}>
                          ✅ Mark Fully Paid
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
