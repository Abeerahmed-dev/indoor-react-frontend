import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Calendar, Clock, ChevronDown, Home as HomeIcon, Users, UserCircle, LogOut } from 'lucide-react';
import '../App.css';
import './PostRequest.css';

const SPORTS = [
  { name: 'Football', icon: '⚽' },
  { name: 'Basket Ball', icon: '🏀' },
  { name: 'Cricket', icon: '🏏' },
  { name: 'Paddle', icon: '🏸' },
];

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Any Level'];

const PostRequest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingData = location.state;

  const [venues, setVenues] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedVenue, setSelectedVenue] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [playersRequired, setPlayersRequired] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [description, setDescription] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [showVenueDropdown, setShowVenueDropdown] = useState(false);
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
      return;
    }

    // Pre-fill from booking data if available
    if (bookingData) {
      if (bookingData.venue) setSelectedVenue(bookingData.venue.name);
      if (bookingData.court?.sport_type) {
        const match = SPORTS.find(
          (s) => s.name.toLowerCase() === bookingData.court.sport_type.toLowerCase()
        );
        if (match) setSelectedSport(match.name);
      }
      if (bookingData.selectedSlots) {
        const dates = Object.keys(bookingData.selectedSlots);
        if (dates.length > 0) {
          setSelectedDate(dates[0]);
          const slots = bookingData.selectedSlots[dates[0]];
          if (slots.length > 0) {
            const [h, m] = slots[0].split(':').map(Number);
            const endH = (h + 1) % 24;
            setSelectedTime(
              `${slots[0]}-${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
            );
          }
        }
      }
    }

    // Fetch venues
    const fetchData = async () => {
      try {
        const [venuesRes, bookingsRes] = await Promise.all([
          axios.get('/api/venues'),
          axios.get(`/api/bookings/user/${userInfo._id}`),
        ]);
        
        const upcomingBookings = bookingsRes.data.filter(booking => {
          const bookingDate = new Date(booking.booking_date);
          if (booking.end_time) {
            const [h, m] = booking.end_time.split(':').map(Number);
            bookingDate.setHours(h, m, 0, 0);
          } else {
            bookingDate.setHours(23, 59, 59, 999);
          }
          return new Date() <= bookingDate;
        });

        setVenues(venuesRes.data);
        setUserBookings(upcomingBookings);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, [navigate]);

  // Build available date/time options from user's bookings
  const bookedDates = [...new Set(userBookings.map((b) => {
    const d = new Date(b.booking_date);
    return d.toISOString().split('T')[0];
  }))].sort();

  const bookedTimesForDate = (date) => {
    return userBookings
      .filter((b) => {
        const d = new Date(b.booking_date);
        return d.toISOString().split('T')[0] === date;
      })
      .map((b) => `${b.start_time}-${b.end_time}`);
  };

  const formatTimeRange = (timeStr) => {
    const [start, end] = timeStr.split('-');
    const fmt = (t) => {
      const [h, m] = t.split(':').map(Number);
      return `${h > 12 ? h - 12 : h || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
    };
    return `${fmt(start)} - ${fmt(end)}`;
  };

  const handleSubmit = async () => {
    if (!selectedSport || !selectedVenue || !selectedDate || !selectedTime) {
      setSubmitMsg('❌ Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setSubmitMsg('');

    try {
      const venueObj = venues.find((v) => v.name === selectedVenue);

      await axios.post('/api/matches', {
        title: `${selectedSport} Match`,
        sport_type: selectedSport.replace('Basket Ball', 'Basketball'),
        venue_id: venueObj?._id,
        date: new Date(selectedDate),
        time: selectedTime.split('-')[0],
        team_size: playersRequired ? `${playersRequired}v${playersRequired}` : '5v5',
        slots_left: parseInt(playersRequired) || 5,
        is_urgent: isUrgent,
        description: description || '',
      });

      setSubmitMsg('✅ Request posted successfully!');
      setTimeout(() => navigate('/user/home'), 1500);
    } catch (err) {
      setSubmitMsg('❌ ' + (err.response?.data?.message || 'Failed to post request'));
    } finally {
      setSubmitting(false);
    }
  };

  const currentDateTimes = selectedDate ? bookedTimesForDate(selectedDate) : [];

  return (
    <>
      <div className="pr-wrapper" style={{ paddingTop: '40px' }}>
        <div className="desktop-container" style={{ maxWidth: '800px' }}>
          <div className="pr-card">
            {/* Header */}
            <div className="pr-header">
              <button className="pr-back-btn" onClick={() => navigate(-1)}>
                <ArrowLeft size={20} />
              </button>
              <h1 className="pr-header-title">Post Request</h1>
            </div>

        {/* Intro */}
        <div className="pr-intro">
          <p className="pr-intro-heading">
            ⚡ Need players for your game? Post a request and let nearby players join the action!
          </p>
          <p className="pr-intro-sub">Fill Out the Form to Post your request.</p>
          <hr className="pr-intro-divider" />
        </div>

        {/* Sports Category */}
        <div className="pr-field">
          <label className="pr-label">Sports Category</label>
          <div className="pr-sport-grid">
            {SPORTS.map((sport) => (
              <button
                key={sport.name}
                className={`pr-sport-card ${selectedSport === sport.name ? 'active' : ''}`}
                onClick={() => setSelectedSport(sport.name)}
              >
                <span className="pr-sport-icon">{sport.icon}</span>
                <span className="pr-sport-name">{sport.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Select Booking */}
        <div className="pr-field">
          <label className="pr-label">Select Your Booking</label>
          {userBookings.length === 0 ? (
            <div className="pr-no-bookings-msg">
              You have no active bookings. Book a slot first to post a player request.
            </div>
          ) : (
            <div className="pr-dropdown-wrapper">
              <button
                className="pr-dropdown-btn"
                onClick={() => { setShowVenueDropdown(!showVenueDropdown); setShowSkillDropdown(false); setShowTimeDropdown(false); }}
              >
                <span className={selectedVenue && selectedDate ? 'pr-dropdown-value' : 'pr-dropdown-placeholder'}>
                  {selectedVenue && selectedDate
                    ? `${selectedVenue} - ${new Date(selectedDate).toLocaleDateString()} at ${selectedTime ? formatTimeRange(selectedTime) : ''}`
                    : 'Choose an upcoming booking'}
                </span>
                <ChevronDown size={16} />
              </button>
              {showVenueDropdown && (
                <div className="pr-dropdown-list">
                  {userBookings.map((b) => {
                    const court = b.court_id;
                    const venue = court?.venue_id;
                    const bDate = new Date(b.booking_date).toISOString().split('T')[0];
                    const tRange = `${b.start_time}-${b.end_time}`;
                    const label = `${venue?.name || 'Venue'} - ${court?.name || 'Court'} | ${new Date(b.booking_date).toLocaleDateString()} ${formatTimeRange(tRange)}`;
                    return (
                      <div
                        key={b._id}
                        className="pr-dropdown-item"
                        onClick={() => {
                          setSelectedVenue(venue?.name);
                          setSelectedDate(bDate);
                          setSelectedTime(tRange);
                          if (court?.sport_type && !selectedSport) {
                            const match = SPORTS.find(
                              (s) => s.name.toLowerCase() === court.sport_type.toLowerCase()
                            );
                            if (match) setSelectedSport(match.name);
                          }
                          setShowVenueDropdown(false);
                        }}
                      >
                        {label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Players Required */}
        <div className="pr-field">
          <label className="pr-label">Players Required</label>
          <input
            type="number"
            className="pr-input-full"
            placeholder="Enter No of Players Required"
            value={playersRequired}
            onChange={(e) => setPlayersRequired(e.target.value)}
            min="1"
          />
        </div>

        {/* Skill Level */}
        <div className="pr-field">
          <label className="pr-label">Skill Level</label>
          <div className="pr-dropdown-wrapper">
            <button
              className="pr-dropdown-btn"
              onClick={() => { setShowSkillDropdown(!showSkillDropdown); setShowVenueDropdown(false); setShowTimeDropdown(false); }}
            >
              <span className={skillLevel ? 'pr-dropdown-value' : 'pr-dropdown-placeholder'}>
                {skillLevel || 'Choose Player Skill Level'}
              </span>
              <ChevronDown size={16} />
            </button>
            {showSkillDropdown && (
              <div className="pr-dropdown-list">
                {SKILL_LEVELS.map((lvl) => (
                  <div
                    key={lvl}
                    className={`pr-dropdown-item ${skillLevel === lvl ? 'active' : ''}`}
                    onClick={() => { setSkillLevel(lvl); setShowSkillDropdown(false); }}
                  >
                    {lvl}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="pr-field">
          <label className="pr-label">Description/Extra:</label>
          <textarea
            className="pr-textarea"
            placeholder="Write Something about your request."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
          <div className="pr-urgent-row">
            <input
              type="checkbox"
              id="urgent-check"
              className="pr-checkbox"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
            />
            <label htmlFor="urgent-check" className="pr-urgent-label">Mark as Urgent</label>
          </div>
        </div>

        {submitMsg && (
          <div className={`pr-msg ${submitMsg.startsWith('✅') ? 'success' : 'error'}`}>
            {submitMsg}
          </div>
        )}

          <button className="pr-submit-btn" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Posting...' : 'Post Request'}
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default PostRequest;
