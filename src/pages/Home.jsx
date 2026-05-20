import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Search, MapPin, Bell, LayoutGrid, Clock, Users, ChevronDown,
  Home as HomeIcon, Calendar, UserCircle, LogOut, X
} from 'lucide-react';
import '../App.css';

import useGeolocation from '../hooks/useGeolocation';

const SPORTS = [
  { name: 'Football', icon: '⚽' },
  { name: 'Basketball', icon: '🏀' },
  { name: 'Cricket', icon: '🏏' },
  { name: 'Paddle', icon: '🏸' },
];

const Home = () => {
  const [venues, setVenues] = useState([]);
  const [nearbyVenues, setNearbyVenues] = useState([]);
  const [courts, setCourts] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const { location, error: geoError, loading: geoLoading } = useGeolocation();
  const [activeSport, setActiveSport] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [budget, setBudget] = useState('');
  const [radius, setRadius] = useState(5); // Default 5km
  
  // Join Match State
  const [joinMatch, setJoinMatch] = useState(null);
  const [playersBrought, setPlayersBrought] = useState(1);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  const navigate = useNavigate();

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [venuesRes, matchesRes, courtsRes] = await Promise.all([
          axios.get('/api/venues'),
          axios.get('/api/matches'),
          axios.get('/api/courts/search?q='),
        ]);
        setVenues(venuesRes.data);
        setMatches(matchesRes.data);
        setCourts(courtsRes.data);
      } catch (err) {
        console.error('Error fetching data', err);
      } finally {
        setLoading(false);
      }
    };
    if (userInfo) fetchData();
  }, []);

  const fetchNearby = async () => {
    if (location && userInfo) {
      try {
        setNearbyLoading(true);
        const res = await axios.get(`/api/venues/nearby?lat=${location.latitude}&lng=${location.longitude}&radius=${radius}`);
        setNearbyVenues(res.data);
      } catch (err) {
        console.error('Error fetching nearby venues', err);
      } finally {
        setNearbyLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchNearby();
  }, [location, radius]);

  const handleJoinClick = (match) => {
    setJoinMatch(match);
    setPlayersBrought(1);
    setJoinError('');
  };

  const handleJoinSubmit = async () => {
    if (!joinMatch) return;
    try {
      setJoinLoading(true);
      setJoinError('');
      const res = await axios.put(`/api/matches/${joinMatch._id}/join`, {
        players_brought: playersBrought
      });
      setMatches((prev) => 
        prev.map(m => m._id === joinMatch._id ? res.data : m).filter(m => m.slots_left > 0)
      );
      setJoinMatch(null);
    } catch (err) {
      setJoinError(err.response?.data?.message || 'Failed to join match');
    } finally {
      setJoinLoading(false);
    }
  };

  const logoutHandler = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderStars = (rating) => {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    let stars = '★'.repeat(full);
    if (half) stars += '½';
    return stars;
  };

  if (!userInfo) return null;

  const query = searchQuery.trim().toLowerCase();
  
  const budgetValue = parseFloat(budget);
  let budgetCourts = [];
  if (!isNaN(budgetValue) && budgetValue > 0) {
    budgetCourts = [...courts]
      .filter(c => c.price_per_hour !== undefined && c.price_per_hour !== null)
      .sort((a, b) => Math.abs(a.price_per_hour - budgetValue) - Math.abs(b.price_per_hour - budgetValue))
      .slice(0, 5);
  }

  const filteredVenues = venues
    .filter((v) => !activeSport || v.sport_type.toLowerCase() === activeSport.toLowerCase())
    .filter((v) => {
      if (!query) return true;

      const venueId = String(v._id);
      const venueCourts = courts.filter((c) => {
        const cid = typeof c.venue_id === 'object' ? c.venue_id?._id : c.venue_id;
        return String(cid) === venueId;
      });

      const courtNameMatch = venueCourts.some((c) => c.name?.toLowerCase().includes(query));

      return (
        v.name?.toLowerCase().includes(query) ||
        v.address?.toLowerCase().includes(query) ||
        v.sport_type?.toLowerCase().includes(query) ||
        courtNameMatch
      );
    });

  return (
    <>
      {/* ====== HERO SECTION ====== */}
      <section className="hero-section">
        <div className="desktop-container">
          <h1 className="hero-title">Discover Luxury Venues</h1>
          <p className="hero-subtitle">Book exclusive sporting facilities, premium pitches, and elegant arenas for your next game or event.</p>
          
          <div className="search-container">
            <div className="search-bar">
              <Search className="search-icon-input" size={18} />
              <input
                type="text"
                placeholder="Search Luxury Venues & Courts..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
            </div>
            <div className="budget-bar">
              <span className="budget-icon-input">$</span>
              <input
                type="number"
                placeholder="Max Budget"
                value={budget}
                onChange={(e) => {
                  setBudget(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
            </div>
            
            {/* Suggestions Dropdown */}
            {(showSuggestions && (query || (budget && !isNaN(budgetValue)))) && (
              <div className="autocomplete-dropdown" style={{width: 'calc(100% - 220px)', left: 0}}>
                {!isNaN(budgetValue) && budgetCourts.length > 0 && (
                  <>
                    <div className="autocomplete-category">Courts Near Your Budget: ${budgetValue}</div>
                    {budgetCourts.map((court) => {
                      const venueId = typeof court.venue_id === 'object' ? court.venue_id?._id : court.venue_id;
                      return (
                        <div
                          key={court._id}
                          className="autocomplete-item"
                          onClick={() => navigate(`/user/venue/${venueId}`)}
                        >
                          <MapPin size={14} className="autocomplete-icon" />
                          <div>
                            <span>{court.name} - <b style={{color: 'var(--gold-primary)'}}>${court.price_per_hour}/hr</b></span>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
                {query && filteredVenues.length > 0 && (
                  <>
                    <div className="autocomplete-category">Venues & Facilities</div>
                    {filteredVenues.map((venue) => (
                      <div
                        key={venue._id}
                        className="autocomplete-item"
                        onClick={() => navigate(`/user/venue/${venue._id}`)}
                      >
                        <MapPin size={14} className="autocomplete-icon" />
                        <span>{venue.name}</span>
                      </div>
                    ))}
                  </>
                )}
                {((query && filteredVenues.length === 0) && (!budget || budgetCourts.length === 0)) && (
                  <div className="autocomplete-no-results">No results found</div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ====== MAIN CONTENT ====== */}
      <main className="desktop-container">
        {loading ? (
          <div className="loader">Loading Premium Facilities...</div>
        ) : (
          <>
            {/* Nearby Venues Section */}
            <div className="section-header nearby-header" style={{ marginBottom: 20 }}>
              <div className="nearby-title-group">
                <h2>Nearby Indoor Arenas</h2>
                <p className="nearby-subtitle">Discover climate-controlled arenas within your reach</p>
              </div>
              <div className="nearby-controls">
                <div className="radius-input-wrapper">
                  <input 
                    type="number" 
                    min="1" 
                    max="50"
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value) || 1)}
                    className="radius-input"
                  />
                  <span className="radius-unit">km radius</span>
                </div>
              </div>
            </div>

            {geoLoading || nearbyLoading ? (
              <div className="loader-small">Locating closest arenas...</div>
            ) : geoError ? (
              <div className="location-error">
                <span className="error-icon">📍</span>
                <span>{geoError === 'User denied the request for Geolocation' 
                  ? 'Enable location to find venues near you.' 
                  : geoError}</span>
              </div>
            ) : nearbyVenues.length > 0 ? (
              <div className="facility-cards nearby">
                {nearbyVenues.map((venue) => (
                  <div className="facility-card nearby-card" key={venue._id} onClick={() => navigate(`/user/venue/${venue._id}`)}>
                    <div className="distance-badge">{venue.distanceKm} km away</div>
                    <img 
                      className="facility-image" 
                      src={venue.image || `/images/venues/${venue.sport_type?.toLowerCase() || 'football'}.png`} 
                      alt={venue.name} 
                      onError={(e) => { e.target.src = '/images/venues/football.png' }}
                    />
                    <div className="facility-info">
                      <div className="facility-top">
                        <div className="facility-name">{venue.name}</div>
                        <div className="proximity-tag">
                          <MapPin size={12} />
                          <span>{venue.distanceKm} km away</span>
                        </div>
                      </div>
                      <div className="facility-details">
                        <div className="facility-detail">
                          <MapPin size={12} />
                          <span>{venue.address}</span>
                        </div>
                        <div className="facility-detail">
                          <span>⭐ {venue.rating} • {venue.sport_type}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="nearby-empty-state">
                <div className="empty-icon">📍</div>
                <h3>No venues found within {radius}km</h3>
                <p>Try expanding your search radius to find more facilities nearby.</p>
                <div className="empty-actions">
                  {[10, 15, 25].filter(r => r > radius).map(r => (
                    <button key={r} onClick={() => setRadius(r)} className="suggested-radius">
                      Search within {r}km
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Filters */}
            <div className="filter-pills" style={{ justifyContent: 'center', marginTop: '40px' }}>
              {['All', 'Football', 'Cricket', 'Basketball', 'Paddle'].map((pill) => (
                <button
                  key={pill}
                  className={`filter-pill ${(!activeSport && pill === 'All') || activeSport === pill ? 'active' : ''}`}
                  onClick={() => setActiveSport(pill === 'All' ? null : pill)}
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Featured Venues */}
            <div className="section-header">
              <h2>Featured Venues</h2>
              <span className="see-all">Explore Collection &gt;</span>
            </div>
            <div className="facility-cards">
              {filteredVenues.map((venue) => (
                <div className="facility-card" key={venue._id} onClick={() => navigate(`/user/venue/${venue._id}`)}>
                  <img
                    className="facility-image"
                    src={venue.image || `/images/venues/${venue.sport_type?.toLowerCase() || 'football'}.png`}
                    alt={venue.name}
                    onError={(e) => { e.target.src = '/images/venues/football.png' }}
                  />
                  <div className="facility-info">
                    <div className="facility-name">{venue.name}</div>
                    <div className="facility-rating">
                      <span className="stars">{renderStars(venue.rating)}</span>
                      <span className="rating-text">{venue.rating} ({venue.rating_count} Reviews)</span>
                    </div>
                    <div className="facility-details">
                      <div className="facility-detail">
                        <MapPin size={14} />
                        <span>{venue.address}</span>
                      </div>
                      <div className="facility-detail">
                        <span>🏆 {venue.sport_type}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Match Finding / Browse By Sport */}
            <div className="section-header">
              <h2>Browse By Category</h2>
            </div>
            <div className="sport-grid">
              {SPORTS.map((sport) => (
                <div
                  key={sport.name}
                  className={`sport-card ${activeSport === sport.name ? 'active' : ''}`}
                  onClick={() => setActiveSport(activeSport === sport.name ? null : sport.name)}
                >
                  <span className="sport-icon">{sport.icon}</span>
                  <span>{sport.name}</span>
                </div>
              ))}
            </div>

            {/* Play Nearby Now */}
            <div className="section-header">
              <h2>Open Matches & Groups</h2>
              <span className="see-all">Find Players &gt;</span>
            </div>
            <div className="match-cards">
              {matches
                .filter((m) => !activeSport || m.sport_type.toLowerCase() === activeSport.toLowerCase())
                .map((match) => (
                  <div className="match-card" key={match._id}>
                    <div className="match-card-top">
                      <div>
                        <div className="match-sport-title">{match.sport_type}</div>
                        <div className="match-title">{match.title}</div>
                      </div>
                      {match.is_urgent && <span className="urgent-tag">Urgent</span>}
                    </div>
                    <div className="match-details">
                      <div className="match-detail">
                        <MapPin size={16} />
                        <span>{match.venue_id?.name || 'TBD'}</span>
                      </div>
                      <div className="match-detail">
                        <Clock size={16} />
                        <span>{match.time} • {formatDate(match.date)}</span>
                      </div>
                      <div className="match-detail">
                        <Users size={16} />
                        <span>{match.team_size} • {match.slots_left} Openings</span>
                      </div>
                    </div>
                    {match.description && (
                      <div className="match-description">{match.description}</div>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleJoinClick(match); }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        marginTop: '12px',
                        borderRadius: '8px',
                        border: '1px solid var(--gold-primary)',
                        backgroundColor: 'transparent',
                        color: 'var(--gold-primary)',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => { e.target.style.backgroundColor = 'var(--gold-primary)'; e.target.style.color = '#000'; }}
                      onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'var(--gold-primary)'; }}
                    >
                      Join Match
                    </button>
                  </div>
                ))}
            </div>
          </>
        )}
      </main>

      {/* Join Match Modal */}
      {joinMatch && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-content join-modal" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '16px', position: 'relative', margin: '20px' }}>
            <button 
              className="modal-close" 
              onClick={() => setJoinMatch(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px', marginTop: 0 }}>Join Match</h2>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Joining <b>{joinMatch.title}</b> • {joinMatch.slots_left} openings left
              </p>
              <label style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>How many players are you bringing?</label>
              <input
                type="number"
                min="1"
                max={joinMatch.slots_left}
                value={playersBrought}
                onChange={(e) => {
                  let val = parseInt(e.target.value);
                  if (isNaN(val)) val = '';
                  else if (val < 1) val = 1;
                  else if (val > joinMatch.slots_left) val = joinMatch.slots_left;
                  setPlayersBrought(val);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-dark)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontSize: '16px'
                }}
              />
            </div>
            {joinError && <div style={{ color: '#ff4d4d', marginBottom: '16px', fontSize: '14px' }}>{joinError}</div>}
            <button 
              onClick={handleJoinSubmit}
              disabled={joinLoading || !playersBrought}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--gold-primary)',
                color: '#000',
                fontWeight: 'bold',
                cursor: joinLoading || !playersBrought ? 'not-allowed' : 'pointer',
                opacity: joinLoading || !playersBrought ? 0.7 : 1,
                transition: 'opacity 0.2s'
              }}
            >
              {joinLoading ? 'Joining...' : 'Confirm Join'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Home;
