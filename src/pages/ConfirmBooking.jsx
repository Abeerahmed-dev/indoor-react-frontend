import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, MapPin, Target, Calendar, Clock, User,
  Image as ImageIcon, Home as HomeIcon, Users, UserCircle, LogOut
} from 'lucide-react';
import '../App.css';
import './ConfirmBooking.css';

const ConfirmBooking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingData = location.state || {};

  const {
    venue,
    court,
    selectedSlots = {},
    totalPrice = 0,
    userInfo,
  } = bookingData;

  const [opponentToggle, setOpponentToggle] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState('');

  // Calculate dates & slots for display
  const allDates = Object.keys(selectedSlots);
  const allSlotsList = [];
  allDates.forEach((date) => {
    selectedSlots[date].forEach((time) => {
      allSlotsList.push({ date, time });
    });
  });

  const totalSlots = allSlotsList.length;
  const groundFee = totalPrice;
  const serviceFee = Math.round(totalPrice * 0.05);
  const totalAmount = groundFee + serviceFee;
  const payNow = Math.round(totalAmount * 0.5);

  // Format slot time as range
  const formatTimeRange = (startTime) => {
    const [h, m] = startTime.split(':').map(Number);
    const endH = (h + 1) % 24;
    const startFormatted = `${h > 12 ? h - 12 : h || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
    const endFormatted = `${endH > 12 ? endH - 12 : endH || 12}:${m.toString().padStart(2, '0')} ${endH >= 12 ? 'PM' : 'AM'}`;
    return `${startFormatted} - ${endFormatted}`;
  };

  const formatDateShort = (dateStr) => {
    const d = new Date(dateStr);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[d.getMonth()]} ${d.getDate()}`;
  };

  const handleConfirmPay = async () => {
    setConfirming(true);
    setConfirmMsg('');

    try {
      // Create booking(s) for each slot
      for (const { date, time } of allSlotsList) {
        const [h, m] = time.split(':').map(Number);
        const endH = (h + 1) % 24;
        const endTime = `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

        await axios.post('/api/bookings', {
          court_id: court?._id,
          user_id: userInfo?._id,
          booking_date: date,
          start_time: time,
          end_time: endTime,
        });
      }

      // If opponent toggle is on, also create a match request
      if (opponentToggle && venue) {
        await axios.post('/api/matches', {
          title: `Match at ${venue.name}`,
          sport_type: court?.sport_type || venue.sport_type || 'Football',
          venue_id: venue._id,
          date: new Date(allDates[0]),
          time: allSlotsList[0]?.time || '18:00',
          team_size: '5v5',
          slots_left: 5,
          is_urgent: false,
          description: `Looking for opponents at ${venue.name}`,
        });
      }

      setConfirmMsg('✅ Booking confirmed successfully!');
      setTimeout(() => navigate('/user/home'), 2000);
    } catch (err) {
      setConfirmMsg('❌ ' + (err.response?.data?.message || 'Booking failed'));
    } finally {
      setConfirming(false);
    }
  };

  // Display data for first slot (primary display)
  const primaryDate = allDates[0] || '';
  const primaryTime = allSlotsList[0]?.time || '';

  return (
    <>
      <div className="cb-wrapper" style={{ paddingTop: '40px' }}>
        <div className="desktop-container" style={{ maxWidth: '700px' }}>
          <div className="cb-header">
            <button className="cb-back-btn" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
            </button>
            <h1 className="cb-header-title">Confirm Reservation</h1>
          </div>

        {/* ====== VENUE INFO CARD ====== */}
        <div className="cb-card">
          <div className="cb-venue-row">
            <div className="cb-venue-img">
              {venue?.image ? (
                <img src={venue.image} alt={venue?.name} />
              ) : (
                <ImageIcon size={28} color="#94a3b8" />
              )}
            </div>
            <div className="cb-venue-info">
              <div className="cb-venue-name">{venue?.name || 'Spirit Field Arena'}</div>
              <div className="cb-venue-meta">
                <MapPin size={13} color="#94a3b8" />
                <span>{venue?.address || 'University Road'}</span>
              </div>
              <div className="cb-venue-meta">
                <Target size={13} color="#94a3b8" />
                <span>{court?.sport_type || venue?.sport_type || 'Futsal'}</span>
              </div>
              <div className="cb-venue-ph-bar"></div>
            </div>
          </div>
        </div>

        {/* ====== BOOKING DETAILS CARD ====== */}
        <div className="cb-card">
          <h3 className="cb-card-title">Booking Details</h3>

          <div className="cb-detail-row">
            <div className="cb-detail-left">
              <Calendar size={16} color="#64748b" />
              <span>Date</span>
            </div>
            <span className="cb-detail-right">
              {allDates.length > 1
                ? `${formatDateShort(allDates[0])} + ${allDates.length - 1} more`
                : formatDateShort(primaryDate)}
            </span>
          </div>

          <div className="cb-detail-row">
            <div className="cb-detail-left">
              <Clock size={16} color="#64748b" />
              <span>Timing</span>
            </div>
            <span className="cb-detail-right">
              {totalSlots > 1
                ? `${formatTimeRange(primaryTime)} + ${totalSlots - 1} more`
                : formatTimeRange(primaryTime)}
            </span>
          </div>

          <div className="cb-detail-row">
            <div className="cb-detail-left">
              <User size={16} color="#64748b" />
              <span>Players</span>
            </div>
            <span className="cb-detail-right">10</span>
          </div>

          {/* Expanded slot list */}
          {totalSlots > 1 && (
            <div className="cb-slots-expanded">
              {allDates.map((date) => (
                <div key={date} className="cb-slot-date-group">
                  <span className="cb-slot-date-label">{formatDateShort(date)}</span>
                  {selectedSlots[date].map((time) => (
                    <span key={`${date}-${time}`} className="cb-slot-chip">
                      {formatTimeRange(time)}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ====== PAYMENT SUMMARY CARD ====== */}
        <div className="cb-card">
          <h3 className="cb-card-title">Payment Summary</h3>

          <div className="cb-pay-row">
            <span>Ground Fee</span>
            <span className="cb-pay-value">PKR {groundFee.toLocaleString()}</span>
          </div>

          <div className="cb-pay-row">
            <span>Service Fee</span>
            <span className="cb-pay-value">PKR {serviceFee.toLocaleString()}</span>
          </div>

          <div className="cb-pay-row cb-pay-total">
            <span>Total</span>
            <span className="cb-pay-value">PKR {totalAmount.toLocaleString()}</span>
          </div>

          <div className="cb-pay-row cb-pay-advance">
            <span>Pay Now <span className="cb-pay-light">(50% Advance)</span></span>
            <span className="cb-pay-value cb-pay-highlight">PKR {payNow.toLocaleString()}</span>
          </div>
        </div>

        {/* ====== OPPONENT TOGGLE CARD ====== */}
        <div className="cb-card cb-toggle-card">
          <span className="cb-toggle-text">Post Opponent Request After Booking</span>
          <button
            className={`cb-toggle-switch ${opponentToggle ? 'active' : ''}`}
            onClick={() => setOpponentToggle(!opponentToggle)}
          >
            <span className="cb-toggle-knob"></span>
          </button>
        </div>

        {/* ====== CANCEL NOTE ====== */}
        <p className="cb-cancel-note">
          You Can Cancel Booking upto 3 hours before Play
        </p>

        {/* ====== CONFIRM MESSAGE ====== */}
        {confirmMsg && (
          <div className={`cb-msg ${confirmMsg.startsWith('✅') ? 'success' : 'error'}`}>
            {confirmMsg}
          </div>
        )}

        {/* ====== CTA BUTTON ====== */}
        <button
          className="cb-cta-btn"
          onClick={handleConfirmPay}
          disabled={confirming}
        >
          {confirming ? 'Processing...' : 'Confirm & Pay'}
        </button>
      </div>
    </div>
    </>
  );
};

export default ConfirmBooking;
