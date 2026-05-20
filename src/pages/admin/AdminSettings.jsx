import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2 } from 'lucide-react';
import './AdminPages.css';

const AdminSettings = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const venueId = userInfo?.owned_venues?.[0];
  const [venue, setVenue] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [sportType, setSportType] = useState('');
  const [numberOfPitches, setNumberOfPitches] = useState(1);
  const [courts, setCourts] = useState([]);
  const [amenities, setAmenities] = useState({
    parking: true,
    'backup generator': false,
    washrooms: true,
    'bibs provided': false,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!venueId) return;
    const fetchData = async () => {
      try {
        setError(null);
        const [venueRes, courtsRes] = await Promise.all([
          axios.get(`/api/venues/${venueId}`),
          axios.get('/api/courts/search?q='),
        ]);
        setVenue(venueRes.data);
        setName(venueRes.data.name || '');
        setAddress(venueRes.data.address || '');
        setSportType(venueRes.data.sport_type || '');
        setDescription(venueRes.data.description || '');
        setContact(venueRes.data.contact || '');
        setNumberOfPitches(venueRes.data.number_of_pitches || 1);
        if (Array.isArray(venueRes.data.amenities) && venueRes.data.amenities.length > 0) {
          const amenitiesMap = {};
          venueRes.data.amenities.forEach((a) => { amenitiesMap[a] = true; });
          setAmenities(prev => ({ ...prev, ...amenitiesMap }));
        }
        // Filter courts for this venue
        const venueCourts = courtsRes.data.filter(c => {
          const vid = typeof c.venue_id === 'object' ? c.venue_id?._id : c.venue_id;
          return vid === venueId;
        });
        setCourts(venueCourts.map((court) => ({
          ...court,
          slot_pricing: Array.isArray(court.slot_pricing) && court.slot_pricing.length > 0
            ? court.slot_pricing
            : [{
              start_time: court.open_time || '08:00',
              end_time: court.close_time || '22:00',
              price: court.price_per_hour || 1500,
            }],
        })));
      } catch (err) {
        console.error(err);
        if (err.response?.status === 404) {
          setError('VENUE_NOT_FOUND');
        } else {
          setError('FETCH_ERROR');
        }
      }
    };
    fetchData();
  }, [venueId]);

  const updateCourt = (index, field, value) => {
    setCourts(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const addCourt = () => {
    setCourts(prev => [...prev, {
      _id: null,
      venue_id: venueId,
      name: `Pitch ${String.fromCharCode(65 + prev.length)}`,
      sport_type: sportType || 'Futsal',
      price_per_hour: 1500,
      open_time: '08:00',
      close_time: '22:00',
      slot_pricing: [{ start_time: '08:00', end_time: '22:00', price: 1500 }],
      isNew: true,
    }]);
    setNumberOfPitches((prev) => prev + 1);
  };

  const removeCourt = (index) => {
    if (courts.length <= 1) return;
    setCourts(prev => prev.filter((_, i) => i !== index));
    setNumberOfPitches((prev) => Math.max(1, prev - 1));
  };

  const addSlotPrice = (courtIndex) => {
    setCourts(prev => prev.map((court, i) => {
      if (i !== courtIndex) return court;
      const existing = Array.isArray(court.slot_pricing) ? court.slot_pricing : [];
      return {
        ...court,
        slot_pricing: [...existing, {
          start_time: court.open_time || '08:00',
          end_time: court.close_time || '22:00',
          price: Number(court.price_per_hour) || 1500,
        }],
      };
    }));
  };

  const removeSlotPrice = (courtIndex, priceIndex) => {
    setCourts(prev => prev.map((court, i) => {
      if (i !== courtIndex) return court;
      const existing = Array.isArray(court.slot_pricing) ? court.slot_pricing : [];
      if (existing.length <= 1) return court;
      return {
        ...court,
        slot_pricing: existing.filter((_, idx) => idx !== priceIndex),
      };
    }));
  };

  const updateSlotPrice = (courtIndex, priceIndex, field, value) => {
    setCourts(prev => prev.map((court, i) => {
      if (i !== courtIndex) return court;
      return {
        ...court,
        slot_pricing: (court.slot_pricing || []).map((sp, idx) => (
          idx === priceIndex ? { ...sp, [field]: value } : sp
        )),
      };
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      // Save venue info
      await axios.put(`/api/admin/venue/${venueId}/settings`, {
        name,
        address,
        sport_type: sportType,
        description,
        contact,
        amenities: Object.entries(amenities).filter(([, v]) => v).map(([k]) => k),
        number_of_pitches: numberOfPitches,
      }, { headers: { Authorization: `Bearer ${userInfo.token}` } });

      // Save courts
      await axios.put(`/api/admin/venue/${venueId}/courts`, {
        courts: courts.map(c => ({
          _id: c._id,
          name: c.name,
          sport_type: c.sport_type,
          price_per_hour: Number(c.price_per_hour),
          open_time: c.open_time,
          close_time: c.close_time,
          slot_pricing: Array.isArray(c.slot_pricing)
            ? c.slot_pricing.map((sp) => ({
              start_time: sp.start_time,
              end_time: sp.end_time,
              price: Number(sp.price),
            }))
            : [],
        })),
      }, { headers: { Authorization: `Bearer ${userInfo.token}` } });

      setMsg('✅ All changes saved instantly!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || 'Failed to save'));
    } finally { setSaving(false); }
  };

  if (!venueId) return <div className="ap-empty">Claim a venue first.</div>;
  
  if (error === 'VENUE_NOT_FOUND') {
    return (
      <div className="ap-empty">
        <h2 style={{color: 'var(--red-primary)'}}>⚠️ Venue Not Found</h2>
        <p>Your venue data seems to be out of sync (possibly due to a database reset).</p>
        <button className="ap-action-btn" onClick={() => navigate('/apply-admin')}>
          Re-Claim / Register Venue
        </button>
      </div>
    );
  }

  if (error) return <div className="ap-empty">Error loading settings. Please try again.</div>;
  if (!venue) return <div className="ap-loading">Loading settings...</div>;

  return (
    <div className="ap-page">
      <h2 className="ap-title">Venue Settings</h2>

      {/* Section 1: Basic Info */}
      <div className="ap-settings-section">
        <h3 className="ap-settings-heading">📝 Basic Information</h3>
        <div className="ap-field">
          <label>Venue Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Spirit Field Arena" />
        </div>
        <div className="ap-field">
          <label>Description</label>
          <textarea className="ap-textarea" value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Describe your venue..." rows={3} />
        </div>
        <div className="ap-field">
          <label>Address</label>
          <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Main University Road, Karachi" />
        </div>
        <div className="ap-field">
          <label>Contact Number</label>
          <input type="text" value={contact} onChange={e => setContact(e.target.value)} placeholder="03XX-XXXXXXX" />
        </div>
        <div className="ap-field">
          <label>Number Of Pitches</label>
          <input type="number" min="1" value={numberOfPitches} onChange={e => setNumberOfPitches(Number(e.target.value || 1))} />
        </div>
      </div>

      {/* Section 2: Pitches / Courts */}
      <div className="ap-settings-section">
        <h3 className="ap-settings-heading">🏟️ Pitches / Courts</h3>

        {courts.map((court, i) => (
          <div className="ap-court-card" key={court._id || i}>
            <div className="ap-court-header">
              <span className="ap-court-num">Pitch {i + 1}</span>
              {courts.length > 1 && (
                <button className="ap-court-remove" onClick={() => removeCourt(i)}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <div className="ap-court-fields">
              <div className="ap-field">
                <label>Pitch Name</label>
                <input type="text" value={court.name} onChange={e => updateCourt(i, 'name', e.target.value)} />
              </div>
              <div className="ap-field">
                <label>Sport Type</label>
                <select value={court.sport_type} onChange={e => updateCourt(i, 'sport_type', e.target.value)}
                  className="ap-select">
                  <option>Futsal</option>
                  <option>Cricket</option>
                  <option>Football</option>
                  <option>Basketball</option>
                  <option>Paddle</option>
                  <option>Box Cricket</option>
                </select>
              </div>
              <div className="ap-field-row">
                <div className="ap-field">
                  <label>Open Time</label>
                  <input type="time" value={court.open_time || ''} onChange={e => updateCourt(i, 'open_time', e.target.value)} />
                </div>
                <div className="ap-field">
                  <label>Close Time</label>
                  <input type="time" value={court.close_time || ''} onChange={e => updateCourt(i, 'close_time', e.target.value)} />
                </div>
              </div>
              <div className="ap-field">
                <label>Price Per Hour (PKR)</label>
                <input type="number" value={court.price_per_hour} onChange={e => updateCourt(i, 'price_per_hour', e.target.value)} />
              </div>

              <div className="ap-field">
                <label>Different Prices For Time Slots</label>
              </div>

              {(court.slot_pricing || [{ start_time: court.open_time || '08:00', end_time: court.close_time || '22:00', price: court.price_per_hour || 1500 }]).map((sp, spIndex) => (
                <div className="ap-field-row" key={`${i}-${spIndex}`}>
                  <div className="ap-field">
                    <label>From</label>
                    <input type="time" value={sp.start_time} onChange={e => updateSlotPrice(i, spIndex, 'start_time', e.target.value)} />
                  </div>
                  <div className="ap-field">
                    <label>To</label>
                    <input type="time" value={sp.end_time} onChange={e => updateSlotPrice(i, spIndex, 'end_time', e.target.value)} />
                  </div>
                  <div className="ap-field">
                    <label>Price</label>
                    <input type="number" value={sp.price} onChange={e => updateSlotPrice(i, spIndex, 'price', e.target.value)} />
                  </div>
                  <div className="ap-field" style={{ alignSelf: 'flex-end' }}>
                    <button className="ap-court-remove" onClick={() => removeSlotPrice(i, spIndex)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              <button className="ap-add-court-btn" onClick={() => addSlotPrice(i)}>
                <Plus size={14} /> Add Slot Price Range
              </button>
            </div>
          </div>
        ))}

        <button className="ap-add-court-btn" onClick={addCourt}>
          <Plus size={16} /> Add Another Pitch
        </button>
      </div>

      {/* Section 3: Amenities */}
      <div className="ap-settings-section">
        <h3 className="ap-settings-heading">✨ Amenities</h3>
        {Object.entries(amenities).map(([key, val]) => (
          <div className="ap-toggle-row" key={key}>
            <span className="ap-toggle-label">{key.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}</span>
            <button className={`ap-toggle-switch ${val ? 'active' : ''}`}
              onClick={() => setAmenities(prev => ({ ...prev, [key]: !prev[key] }))}>
              <span className="ap-toggle-knob" />
            </button>
          </div>
        ))}
      </div>

      {msg && <div className={`ap-msg ${msg.startsWith('✅') ? 'success' : 'error'}`}>{msg}</div>}

      <button className="ap-save-btn" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : '💾 Save All Changes'}
      </button>
    </div>
  );
};

export default AdminSettings;
