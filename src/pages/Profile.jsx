import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, MapPin, Calendar, Clock, X, UserCircle, LogOut, Settings, ChevronRight, Home as HomeIcon, Users
} from 'lucide-react';
import '../App.css';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
      return;
    }
    fetchBookings();
  }, [navigate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/bookings/user/${userInfo._id}`);
      
      const upcomingBookings = res.data.filter(booking => {
        const bookingDate = new Date(booking.booking_date);
        const [h, m] = booking.end_time.split(':').map(Number);
        bookingDate.setHours(h, m, 0, 0);
        return new Date() <= bookingDate;
      });
      
      setBookings(upcomingBookings);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? The slot will become available again.')) return;

    setCancellingId(bookingId);
    try {
      await axios.put(`/api/bookings/${bookingId}/cancel`);
      // Remove from list
      setBookings((prev) => prev.filter((b) => b._id !== bookingId));
    } catch (err) {
      alert('Failed to cancel: ' + (err.response?.data?.message || err.message));
    } finally {
      setCancellingId(null);
    }
  };

  const logoutHandler = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const formatTimeRange = (start, end) => {
    const fmt = (t) => {
      const [h, m] = t.split(':').map(Number);
      return `${h > 12 ? h - 12 : h || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
    };
    return `${fmt(start)} - ${fmt(end)}`;
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Check if booking can be cancelled (3 hours before play)
  const canCancel = (booking) => {
    const bookingDate = new Date(booking.booking_date);
    const [h, m] = booking.start_time.split(':').map(Number);
    bookingDate.setHours(h, m, 0, 0);
    const cutoff = new Date(bookingDate.getTime() - 3 * 60 * 60 * 1000);
    return new Date() < cutoff;
  };

  if (!userInfo) return null;

  return (
    <>
      <div className="pf-wrapper" style={{ paddingTop: '40px' }}>
        <div className="desktop-container" style={{ maxWidth: '800px' }}>

          {/* Header */}
          <div className="pf-header">
            <button className="pf-back-btn" onClick={() => navigate('/user/home')}>
              <ArrowLeft size={20} />
            </button>
            <h1 className="pf-header-title">My Profile</h1>
          </div>

        {/* Profile Info */}
        <div className="pf-card pf-user-card">
          <div className="pf-avatar">{getInitials(userInfo.name)}</div>
          <div className="pf-user-info">
            <div className="pf-user-name">{userInfo.name}</div>
            <div className="pf-user-email">{userInfo.email}</div>
          </div>
          <button className="pf-logout-btn" onClick={logoutHandler}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>

        {/* Venue Admin Dashboard Link */}
        {(userInfo.role === 'VENUE_ADMIN' || userInfo.role === 'ADMIN') && (
          <button className="pf-admin-card" onClick={() => navigate('/admin/dashboard')}>
            <div className="pf-admin-left">
              <Settings size={22} color="#fff" />
              <div>
                <div className="pf-admin-title">Venue Admin Dashboard</div>
                <div className="pf-admin-desc">Manage slots, bookings & settings</div>
              </div>
            </div>
            <ChevronRight size={18} color="rgba(255,255,255,0.6)" />
          </button>
        )}

        {/* Bookings Section */}
        <div className="pf-section-header">
          <h2>My Bookings</h2>
          <span className="pf-badge">{bookings.length}</span>
        </div>

        {loading ? (
          <div className="pf-loading">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="pf-empty">
            <Calendar size={40} color="#d1d5db" />
            <p>No active bookings yet</p>
            <button className="pf-explore-btn" onClick={() => navigate('/user/home')}>
              Explore Venues
            </button>
          </div>
        ) : (
          <div className="pf-bookings-list">
            {bookings.map((booking) => {
              const court = booking.court_id;
              const venue = court?.venue_id;
              const cancellable = canCancel(booking);

              return (
                <div className="pf-card pf-booking-card" key={booking._id}>
                  <div className="pf-booking-top">
                    <div className="pf-booking-venue">
                      <div className="pf-booking-name">
                        {venue?.name || court?.name || 'Court'}
                      </div>
                      <div className="pf-booking-sport">
                        {court?.sport_type || 'Sport'}
                      </div>
                    </div>
                    <span className={`pf-status ${booking.status.toLowerCase()}`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="pf-booking-details">
                    <div className="pf-booking-detail">
                      <Calendar size={14} color="#64748b" />
                      <span>{formatDate(booking.booking_date)}</span>
                    </div>
                    <div className="pf-booking-detail">
                      <Clock size={14} color="#64748b" />
                      <span>{formatTimeRange(booking.start_time, booking.end_time)}</span>
                    </div>
                    <div className="pf-booking-detail">
                      <MapPin size={14} color="#64748b" />
                      <span>{venue?.address || 'Venue'}</span>
                    </div>
                  </div>

                  {court?.price_per_hour && (
                    <div className="pf-booking-price">
                      Rs. {court.price_per_hour}
                    </div>
                  )}

                  {cancellable ? (
                    <button
                      className="pf-cancel-btn"
                      onClick={() => handleCancel(booking._id)}
                      disabled={cancellingId === booking._id}
                    >
                      <X size={14} />
                      {cancellingId === booking._id ? 'Cancelling...' : 'Cancel Booking'}
                    </button>
                  ) : (
                    <div className="pf-no-cancel">
                      Cannot cancel within 3 hours of play
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default Profile;
