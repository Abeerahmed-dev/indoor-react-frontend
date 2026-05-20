import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Share2, Heart, MapPin, Star, Check,
  Image as ImageIcon, ChevronDown, ChevronUp, Home as HomeIcon, Users, UserCircle, LogOut
} from 'lucide-react';
import '../App.css';
import './VenueDetail.css';

const SPORT_ICONS = {
  Football: '⚽',
  Basketball: '🏀',
  Cricket: '🏏',
  Paddle: '🏸',
  Tennis: '🎾',
};

const getNext5Dates = () => {
  const dates = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push({
      label: i === 0 ? 'Today' : dayNames[d.getDay()],
      sub: `${d.getDate()} ${monthNames[d.getMonth()]}`,
      value: d.toISOString().split('T')[0],
    });
  }
  return dates;
};

const getEndTime = (startTime) => {
  const [h, m] = startTime.split(':').map(Number);
  const endH = (h + 1) % 24;
  return `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const toMinutes = (timeStr = '00:00') => {
  const [h, m] = timeStr.split(':').map(Number);
  return (h * 60) + m;
};

const getSlotPriceForCourt = (court, slotStart) => {
  if (!court) return 0;
  if (!Array.isArray(court.slot_pricing) || court.slot_pricing.length === 0) {
    return Number(court.price_per_hour) || 0;
  }

  const startMins = toMinutes(slotStart);
  const matched = court.slot_pricing.find((sp) => {
    let s = toMinutes(sp.start_time);
    let e = toMinutes(sp.end_time);
    let t = startMins;

    if (e <= s) {
      e += 24 * 60;
      if (t < s) t += 24 * 60;
    }

    return t >= s && t < e;
  });

  return matched ? Number(matched.price) : Number(court.price_per_hour) || 0;
};

const VenueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venue, setVenue] = useState(null);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  // Slot dropdown state
  const [dates] = useState(getNext5Dates());
  const [selectedDate, setSelectedDate] = useState(getNext5Dates()[0].value);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [slotsData, setSlotsData] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Multi-slot, multi-date selections: { "2026-03-13": ["18:00","19:00"] }
  const [selectedSlots, setSelectedSlots] = useState({});

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
      return;
    }

    const fetchVenue = async () => {
      try {
        setLoading(true);
        const [venueRes, courtsRes] = await Promise.all([
          axios.get(`/api/venues/${id}`),
          axios.get(`/api/courts/search?q=`),
        ]);
        setVenue(venueRes.data);
        const venueCourts = courtsRes.data.filter(
          (c) => c.venue_id?._id === id || c.venue_id === id
        );
        setCourts(venueCourts);
        if (venueCourts.length > 0) {
          setSelectedCourt(venueCourts[0]);
        }
      } catch (err) {
        console.error('Error fetching venue:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVenue();
  }, [id, navigate]);

  useEffect(() => {
    if (!selectedCourt) return;

    const fetchSlots = async () => {
      setSlotsLoading(true);
      try {
        const res = await axios.get(
          `/api/courts/${selectedCourt._id}/slots?date=${selectedDate}`
        );
        setSlotsData(res.data);
      } catch (err) {
        console.error('Error fetching slots:', err);
        setSlotsData(null);
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [selectedCourt, selectedDate]);

  const handleSlotToggle = (time) => {
    setSelectedSlots((prev) => {
      const dateSlots = prev[selectedDate] || [];
      if (dateSlots.includes(time)) {
        const filtered = dateSlots.filter((t) => t !== time);
        const updated = { ...prev };
        if (filtered.length === 0) {
          delete updated[selectedDate];
        } else {
          updated[selectedDate] = filtered;
        }
        return updated;
      } else {
        return { ...prev, [selectedDate]: [...dateSlots, time].sort() };
      }
    });
  };

  const logoutHandler = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const totalSelectedSlots = Object.values(selectedSlots).reduce(
    (sum, arr) => sum + arr.length, 0
  );

  const totalPrice = Object.values(selectedSlots).reduce(
    (sum, slots) => sum + slots.reduce((inner, slot) => inner + getSlotPriceForCourt(selectedCourt, slot), 0),
    0
  );

  const handleProceed = () => {
    navigate('/user/confirm-booking', {
      state: {
        venue,
        court: selectedCourt,
        selectedSlots,
        totalPrice,
        userInfo,
      },
    });
  };

  if (loading) {
    return <div className="loader">Loading Luxury Venue Details...</div>;
  }

  if (!venue) {
    return <div className="loader">Venue not found</div>;
  }

  const sportTypes = [...new Set(courts.map((c) => c.sport_type))];
  if (sportTypes.length === 0 && venue.sport_type) {
    sportTypes.push(venue.sport_type);
  }

  const facilities = [
    { name: 'Valet Parking', icon: <Check size={20} /> },
    { name: 'Locker Rooms', icon: <Check size={20} /> },
    { name: 'Lounge Area', icon: <Check size={20} /> },
    { name: 'Refreshments', icon: <Check size={20} /> },
  ];

  const currentDateSlots = selectedSlots[selectedDate] || [];

  return (
    <>
      <div className="vd-wrapper" style={{ paddingTop: '40px' }}>
        <div className="desktop-container" style={{ padding: '40px 24px' }}>
          
          <button className="vd-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} /> Back to Listings
          </button>

          <div className="vd-grid">
            {/* Left Column: Images & Details */}
            <div className="vd-main-content">
              <div className="vd-image-gallery">
                {venue.image ? (
                  <img 
                    src={venue.image || `/images/venues/${venue.sport_type?.toLowerCase() || 'football'}.png`} 
                    alt={venue.name} 
                    className="vd-hero-img" 
                    onError={(e) => { e.target.src = '/images/venues/football.png' }}
                  />
                ) : (
                  <div className="vd-image-placeholder">
                    <ImageIcon size={64} color="var(--gold-dark)" />
                    <span>Exclusive Venue View Not Available</span>
                  </div>
                )}
                <button
                  className={`vd-like-btn ${liked ? 'liked' : ''}`}
                  onClick={() => setLiked(!liked)}
                >
                  <Heart size={24} fill={liked ? 'var(--gold-primary)' : 'none'} color={liked ? 'var(--gold-primary)' : 'white'} />
                </button>
              </div>

              <div className="vd-header-info">
                <h1 className="vd-title">{venue.name}</h1>
                <div className="vd-location">
                  <MapPin size={18} color="var(--gold-primary)" />
                  <span>{venue.address}</span>
                </div>
                <div className="vd-rating-row">
                  <Star size={18} fill="var(--gold-primary)" color="var(--gold-primary)" />
                  <span className="vd-rating-num">{venue.rating}</span>
                  <span className="vd-reviews-link">({venue.rating_count} Reviews)</span>
                </div>
              </div>

              <hr className="vd-divider" />

              <div className="vd-section">
                <h3 className="vd-section-title">Premium Facilities</h3>
                <div className="vd-facilities-grid">
                  {facilities.map((fac, i) => (
                    <div className="vd-facility-item" key={i}>
                      <div className="vd-facility-icon-box">{fac.icon}</div>
                      <span className="vd-facility-label">{fac.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="vd-section">
                <h3 className="vd-section-title">Available Sports</h3>
                <div className="vd-sport-grid">
                  {sportTypes.map((sport, i) => (
                    <div className="vd-sport-item" key={i}>
                      <span className="vd-sport-icon">{SPORT_ICONS[sport] || '🏅'}</span>
                      <span className="vd-sport-name">{sport}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Booking Widget */}
            <div className="vd-booking-widget">
              <div className="vd-booking-card">
                <h3 className="vd-widget-title">Reserve Your Slot</h3>
                {courts.length > 0 && (
                  <div className="vd-price-text">
                    From <span className="highlight-price">${Math.min(...courts.map((c) => c.price_per_hour))}</span> / hour
                  </div>
                )}

                {courts.length > 1 && (
                  <div className="vd-court-selector">
                    <span className="vd-court-label">Select Court Area:</span>
                    <div className="vd-court-pills">
                      {courts.map((court) => (
                        <button
                          key={court._id}
                          className={`vd-court-pill ${selectedCourt?._id === court._id ? 'active' : ''}`}
                          onClick={() => setSelectedCourt(court)}
                        >
                          {court.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="vd-date-row">
                  {dates.map((d) => (
                    <button
                      key={d.value}
                      className={`vd-date-btn ${selectedDate === d.value ? 'active' : ''}`}
                      onClick={() => setSelectedDate(d.value)}
                    >
                      <span className="vd-date-label">{d.label}</span>
                      <span className="vd-date-sub">{d.sub}</span>
                      {selectedSlots[d.value]?.length > 0 && (
                        <span className="vd-date-badge">{selectedSlots[d.value].length}</span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="vd-slots-container">
                  {slotsLoading ? (
                    <div className="vd-slots-loading">Accessing schedule...</div>
                  ) : slotsData ? (
                    <div className="vd-slots-grid">
                      {slotsData.allSlots.map((time) => {
                        const isBooked = slotsData.bookedSlots.includes(time);
                        const isSelected = currentDateSlots.includes(time);
                        return (
                          <button
                            key={time}
                            className={`vd-slot-pill ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''}`}
                            disabled={isBooked}
                            onClick={() => handleSlotToggle(time)}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="vd-slots-loading">No availability</div>
                  )}
                </div>

                {totalSelectedSlots > 0 && (
                  <div className="vd-selection-summary">
                    <div className="vd-summary-header">Reservation Summary</div>
                    {Object.entries(selectedSlots).map(([date, slots]) => (
                      <div className="vd-summary-date-group" key={date}>
                        <span className="vd-summary-date">{date}</span>
                        <div className="vd-summary-slots">
                          {slots.map((s) => (
                            <span className="vd-summary-slot-chip" key={`${date}-${s}`}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="vd-summary-total">
                      Total: ${totalPrice}
                    </div>
                  </div>
                )}

                <button
                  className="vd-book-now-btn"
                  disabled={totalSelectedSlots === 0}
                  onClick={handleProceed}
                >
                  {totalSelectedSlots > 0 ? 'Proceed to Checkout' : 'Select a Slot'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VenueDetail;
