import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronDown, User, Lock } from 'lucide-react';
import './AdminPages.css';

const getNext7Dates = () => {
  const dates = [];
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    dates.push({
      label: i === 0 ? 'Today' : dayNames[d.getDay()],
      sub: `${d.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]}`,
      value: d.toISOString().split('T')[0],
    });
  }
  return dates;
};

const AdminCalendar = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const venueId = userInfo?.owned_venues?.[0];
  const [courts, setCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [dates] = useState(getNext7Dates());
  const [selectedDate, setSelectedDate] = useState(getNext7Dates()[0].value);
  const [slotData, setSlotData] = useState(null);
  const [allBookings, setAllBookings] = useState([]);
  const [showCourtDrop, setShowCourtDrop] = useState(false);
  const [modal, setModal] = useState(null); // { type: 'block' | 'detail', time, booking? }
  const [blocking, setBlocking] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [paymentPaid, setPaymentPaid] = useState('');

  useEffect(() => {
    if (!venueId) return;
    const fetchCourts = async () => {
      try {
        const res = await axios.get('/api/courts/search?q=');
        const vc = res.data.filter(c => {
          const vid = typeof c.venue_id === 'object' ? c.venue_id?._id : c.venue_id;
          return vid === venueId;
        });
        setCourts(vc);
        if (vc.length > 0) setSelectedCourt(vc[0]);
      } catch (err) { console.error(err); }
    };
    fetchCourts();
  }, [venueId]);

  useEffect(() => {
    if (!selectedCourt || !venueId) return;
    const fetchSlots = async () => {
      try {
        const [slotsRes, bookingsRes] = await Promise.all([
          axios.get(`/api/courts/${selectedCourt._id}/slots?date=${selectedDate}`),
          axios.get(`/api/admin/bookings/${venueId}`, {
            headers: { Authorization: `Bearer ${userInfo.token}` },
          }),
        ]);
        setSlotData(slotsRes.data);
        setAllBookings(bookingsRes.data);
      } catch (err) { console.error(err); }
    };
    fetchSlots();
  }, [selectedCourt, selectedDate, venueId]);

  // Build slot info for the grid
  const getSlotInfo = (time) => {
    if (!slotData) return { status: 'loading' };

    const dateBookings = allBookings.filter(b => {
      const bDate = new Date(b.booking_date).toISOString().split('T')[0];
      const courtMatch = (typeof b.court_id === 'object' ? b.court_id?._id : b.court_id) === selectedCourt?._id;
      return bDate === selectedDate && courtMatch && b.start_time === time;
    });

    if (dateBookings.length > 0) {
      const booking = dateBookings[0];
      const isOffline = booking.user_id?._id === userInfo._id;
      return {
        status: isOffline ? 'offline' : 'online',
        playerName: isOffline 
          ? (booking.customer_name || 'Walk-in') 
          : (booking.user_id?.name || 'Walk-in'),
        booking,
      };
    }

    if (slotData.bookedSlots?.includes(time)) {
      return { status: 'offline', playerName: 'Blocked' };
    }

    return { status: 'available' };
  };

  const handleBlockSlot = async (time) => {
    setBlocking(true);
    try {
      const [h] = time.split(':').map(Number);
      const endTime = `${(h + 1).toString().padStart(2, '0')}:00`;
      await axios.post('/api/admin/block-slot', {
        court_id: selectedCourt._id,
        booking_date: selectedDate,
        start_time: time,
        end_time: endTime,
        customer_name: customerName,
        amount_paid: Number(paymentPaid) || 0,
      }, { headers: { Authorization: `Bearer ${userInfo.token}` } });

      // Refresh slots
      const slotsRes = await axios.get(`/api/courts/${selectedCourt._id}/slots?date=${selectedDate}`);
      setSlotData(slotsRes.data);
      const bookingsRes = await axios.get(`/api/admin/bookings/${venueId}`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      setAllBookings(bookingsRes.data);
      setModal(null);
      setCustomerName('');
      setPaymentPaid('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to block slot');
    } finally {
      setBlocking(false);
    }
  };

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    return `${h > 12 ? h - 12 : h || 12}:${(m || 0).toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  if (!venueId) return <div className="ap-empty">Claim a venue first.</div>;

  const allSlots = slotData?.allSlots || [];

  return (
    <div className="ap-page">
      <h2 className="ap-title">Slot Calendar</h2>

      {/* Court Selector Dropdown */}
      <div className="ap-dropdown-wrap">
        <button className="ap-dropdown-btn" onClick={() => setShowCourtDrop(!showCourtDrop)}>
          <span>{selectedCourt ? `${selectedCourt.name} — ${selectedCourt.sport_type}` : 'Select Court / Pitch'}</span>
          <ChevronDown size={14} />
        </button>
        {showCourtDrop && (
          <div className="ap-dropdown-list">
            {courts.length === 0 ? (
              <div className="ap-dropdown-item" style={{color:'#94a3b8'}}>No courts found</div>
            ) : courts.map(c => (
              <div key={c._id} className={`ap-dropdown-item ${selectedCourt?._id === c._id ? 'active' : ''}`}
                onClick={() => { setSelectedCourt(c); setShowCourtDrop(false); }}>
                {c.name} — {c.sport_type}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Date Scroller */}
      <div className="ap-date-row">
        {dates.map(d => (
          <button key={d.value} className={`ap-date-btn ${selectedDate === d.value ? 'active' : ''}`}
            onClick={() => setSelectedDate(d.value)}>
            <span className="ap-date-label">{d.label}</span>
            <span className="ap-date-sub">{d.sub}</span>
          </button>
        ))}
      </div>

      {/* Interactive Slot Grid */}
      <div className="ap-slot-legend">
        <span className="ap-legend-item"><span className="ap-legend-dot available"></span> Available</span>
        <span className="ap-legend-item"><span className="ap-legend-dot online"></span> Online Booking</span>
        <span className="ap-legend-item"><span className="ap-legend-dot offline"></span> Offline / Blocked</span>
      </div>

      <div className="ap-slot-grid">
        {allSlots.map(time => {
          const info = getSlotInfo(time);
          return (
            <button key={time}
              className={`ap-slot-cell ${info.status}`}
              onClick={() => {
                if (info.status === 'available') setModal({ type: 'block', time });
                else if (info.status === 'online') setModal({ type: 'detail', time, booking: info.booking });
              }}
            >
              <span className="ap-slot-time">{formatTime(time)}</span>
              {info.status === 'available' && <span className="ap-slot-status">Available</span>}
              {info.status === 'online' && (
                <>
                  <span className="ap-slot-player"><User size={10} /> {info.playerName}</span>
                  <span className="ap-slot-status">Online</span>
                </>
              )}
              {info.status === 'offline' && (
                <>
                  <span className="ap-slot-player"><Lock size={10} /> {info.playerName}</span>
                  <span className="ap-slot-status">Blocked</span>
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Block Modal */}
      {modal?.type === 'block' && (
        <div className="ap-modal-overlay" onClick={() => setModal(null)}>
          <div className="ap-modal" onClick={e => e.stopPropagation()}>
            <h3>⚡ Block Slot for Offline Booking</h3>
            <p>Block <strong>{formatTime(modal.time)}</strong> on <strong>{selectedDate}</strong>?</p>
            
            <div className="ap-field" style={{marginTop:16}}>
              <label>Customer Name</label>
              <input type="text" placeholder="e.g. Ali Ahmed" value={customerName} onChange={e => setCustomerName(e.target.value)} />
            </div>

            <div className="ap-field">
              <label>Payment Paid (PKR)</label>
              <input type="number" placeholder="e.g. 1500" value={paymentPaid} onChange={e => setPaymentPaid(e.target.value)} />
            </div>

            <div className="ap-modal-actions">
              <button className="ap-btn-cancel" onClick={() => setModal(null)}>Cancel</button>
              <button className="ap-btn-confirm" onClick={() => handleBlockSlot(modal.time)} disabled={blocking}>
                {blocking ? 'Blocking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Detail Modal */}
      {modal?.type === 'detail' && (
        <div className="ap-modal-overlay" onClick={() => setModal(null)}>
          <div className="ap-modal" onClick={e => e.stopPropagation()}>
            <h3>📋 Booking Details</h3>
            <div className="ap-detail-grid">
              <div className="ap-detail-row">
                <span>Customer:</span>
                <strong>
                  {modal.booking?.user_id?._id === userInfo._id 
                    ? (modal.booking?.customer_name || 'Walk-in') 
                    : (modal.booking?.user_id?.name || 'Walk-in')}
                </strong>
              </div>
              <div className="ap-detail-row"><span>Email:</span><strong>{modal.booking?.user_id?.email || '—'}</strong></div>
              <div className="ap-detail-row"><span>Time:</span><strong>{formatTime(modal.booking?.start_time)} - {formatTime(modal.booking?.end_time)}</strong></div>
              <div className="ap-detail-row"><span>Court:</span><strong>{modal.booking?.court_id?.name || '—'}</strong></div>
              <div className="ap-detail-row"><span>Status:</span><strong>{modal.booking?.status}</strong></div>
              <div className="ap-detail-row"><span>Payment Status:</span><strong>{modal.booking?.payment_status}</strong></div>
              <div className="ap-detail-row"><span>Amount Paid:</span><strong>PKR {modal.booking?.amount_paid || 0}</strong></div>
            </div>
            <button className="ap-btn-confirm" style={{width:'100%',marginTop:12}} onClick={() => setModal(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCalendar;
