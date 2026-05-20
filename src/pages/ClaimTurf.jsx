import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Upload, MapPin, Shield, CheckCircle, ChevronDown, Plus, Trash2, Home as HomeIcon, Users, UserCircle, LogOut
} from 'lucide-react';
import './ClaimTurf.css';

const createDefaultPitch = (index = 0) => ({
  name: `Pitch ${String.fromCharCode(65 + index)}`,
  sport_type: 'Futsal',
  price_per_hour: '1500',
  open_time: '08:00',
  close_time: '22:00',
  slot_pricing: [
    { start_time: '08:00', end_time: '22:00', price: '1500' },
  ],
});

const ClaimTurf = () => {
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [venueName, setVenueName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [numberOfPitches, setNumberOfPitches] = useState(1);
  const [ownerPhone, setOwnerPhone] = useState('');

  const [cnicFile, setCnicFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [resultMsg, setResultMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const [pitches, setPitches] = useState([createDefaultPitch(0)]);

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const isVenueAdmin = userInfo?.role === 'VENUE_ADMIN' && userInfo?.owned_venues?.length > 0;
  const ownedVenueId = userInfo?.owned_venues?.[0] || '';

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      try {
        if (isVenueAdmin && ownedVenueId) {
          const [venueRes, courtsRes] = await Promise.all([
            axios.get(`/api/venues/${ownedVenueId}`),
            axios.get('/api/courts/search?q='),
          ]);

          const venue = venueRes.data;
          const venueCourts = courtsRes.data
            .filter((c) => {
              const vid = typeof c.venue_id === 'object' ? c.venue_id?._id : c.venue_id;
              return vid === ownedVenueId;
            })
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

          setSelectedVenueId(venue._id);
          setVenueName(venue.name || '');
          setAddress(venue.address || '');
          setDescription(venue.description || '');
          setContact(venue.contact || '');
          setNumberOfPitches(venue.number_of_pitches || Math.max(venueCourts.length, 1));

          if (venueCourts.length > 0) {
            setPitches(venueCourts.map((court, index) => ({
              _id: court._id,
              name: court.name || `Pitch ${String.fromCharCode(65 + index)}`,
              sport_type: court.sport_type || venue.sport_type || 'Futsal',
              price_per_hour: String(court.price_per_hour ?? '1500'),
              open_time: court.open_time || '08:00',
              close_time: court.close_time || '22:00',
              slot_pricing: Array.isArray(court.slot_pricing) && court.slot_pricing.length > 0
                ? court.slot_pricing.map((sp) => ({
                  start_time: sp.start_time,
                  end_time: sp.end_time,
                  price: String(sp.price),
                }))
                : [{
                  start_time: court.open_time || '08:00',
                  end_time: court.close_time || '22:00',
                  price: String(court.price_per_hour ?? '1500'),
                }],
            })));
          }
        } else {
          const res = await axios.get('/api/venues/unclaimed');
          setVenues(res.data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadData();
  }, [navigate, isVenueAdmin, ownedVenueId]);

  useEffect(() => {
    if (numberOfPitches < 1) {
      setNumberOfPitches(1);
      return;
    }

    setPitches((prev) => {
      if (prev.length === numberOfPitches) return prev;
      if (prev.length > numberOfPitches) return prev.slice(0, numberOfPitches);

      const next = [...prev];
      while (next.length < numberOfPitches) {
        next.push(createDefaultPitch(next.length));
      }
      return next;
    });
  }, [numberOfPitches]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCnicFile(file);
      setFileName(file.name);
    }
  };

  const selectedVenue = venues.find((v) => v._id === selectedVenueId);

  const addPitch = () => {
    setPitches((prev) => [...prev, createDefaultPitch(prev.length)]);
    setNumberOfPitches((prev) => prev + 1);
  };

  const removePitch = (index) => {
    if (pitches.length <= 1) return;
    setPitches((prev) => prev.filter((_, i) => i !== index));
    setNumberOfPitches((prev) => Math.max(1, prev - 1));
  };

  const updatePitch = (index, field, value) => {
    setPitches((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const addSlotPrice = (pitchIndex) => {
    setPitches((prev) => prev.map((p, i) => {
      if (i !== pitchIndex) return p;
      return {
        ...p,
        slot_pricing: [
          ...(p.slot_pricing || []),
          {
            start_time: p.open_time || '08:00',
            end_time: p.close_time || '22:00',
            price: p.price_per_hour || '1500',
          },
        ],
      };
    }));
  };

  const removeSlotPrice = (pitchIndex, pricingIndex) => {
    setPitches((prev) => prev.map((p, i) => {
      if (i !== pitchIndex) return p;
      if ((p.slot_pricing || []).length <= 1) return p;
      return {
        ...p,
        slot_pricing: p.slot_pricing.filter((_, idx) => idx !== pricingIndex),
      };
    }));
  };

  const updateSlotPrice = (pitchIndex, pricingIndex, field, value) => {
    setPitches((prev) => prev.map((p, i) => {
      if (i !== pitchIndex) return p;
      return {
        ...p,
        slot_pricing: (p.slot_pricing || []).map((sp, idx) => (
          idx === pricingIndex ? { ...sp, [field]: value } : sp
        )),
      };
    }));
  };

  const normalizePitches = () => pitches.map((p) => ({
    _id: p._id,
    name: p.name,
    sport_type: p.sport_type,
    price_per_hour: Number(p.price_per_hour),
    open_time: p.open_time,
    close_time: p.close_time,
    slot_pricing: (p.slot_pricing || []).map((sp) => ({
      start_time: sp.start_time,
      end_time: sp.end_time,
      price: Number(sp.price),
    })),
  }));

  const validatePitches = () => {
    for (const p of pitches) {
      if (!p.name || !p.price_per_hour || !p.open_time || !p.close_time) return false;
      if (!Array.isArray(p.slot_pricing) || p.slot_pricing.length === 0) return false;
      for (const sp of p.slot_pricing) {
        if (!sp.start_time || !sp.end_time || !sp.price) return false;
      }
    }
    return true;
  };

  const handleClaim = async () => {
    if (!selectedVenueId) {
      setResultMsg('❌ Please select a venue.');
      return;
    }
    if (!cnicFile) {
      setResultMsg('❌ Please upload your CNIC or utility bill.');
      return;
    }
    if (!validatePitches()) {
      setResultMsg('❌ Please fill in all pitch and slot pricing details.');
      return;
    }

    setLoading(true);
    setResultMsg('');

    try {
      const formData = new FormData();
      formData.append('venueId', selectedVenueId);
      formData.append('ownerPhone', ownerPhone);
      if (selectedVenueId === 'NEW_VENUE') {
        formData.append('venueName', venueName);
        formData.append('address', address);
        formData.append('description', description);
        formData.append('contact', contact);
      }
      formData.append('cnicFile', cnicFile);
      formData.append('pitches', JSON.stringify(normalizePitches()));

      const res = await axios.post('/api/venues/claim', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${userInfo.token}`,
        },
      });

      localStorage.setItem('userInfo', JSON.stringify(res.data.user));
      setSuccess(true);
      setResultMsg('🎉 Your application has been approved! You are now a Venue Admin.');
      setTimeout(() => navigate('/admin/dashboard'), 2000);
    } catch (err) {
      setResultMsg('❌ ' + (err.response?.data?.message || 'Failed to claim venue.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAdminSettings = async () => {
    if (!selectedVenueId) return;
    if (!validatePitches()) {
      setResultMsg('❌ Please fill in all pitch and slot pricing details.');
      return;
    }

    setLoading(true);
    setResultMsg('');

    try {
      await axios.put(`/api/admin/venue/${selectedVenueId}/settings`, {
        name: venueName,
        address,
        description,
        contact,
        number_of_pitches: numberOfPitches,
      }, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });

      await axios.put(`/api/admin/venue/${selectedVenueId}/courts`, {
        courts: normalizePitches(),
      }, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });

      setSuccess(true);
      setResultMsg('✅ Arena settings updated instantly. Users can search and book now.');
      setTimeout(() => setSuccess(false), 1200);
    } catch (err) {
      setResultMsg('❌ ' + (err.response?.data?.message || 'Failed to save settings.'));
    } finally {
      setLoading(false);
    }
  };

  const ctaLabel = isVenueAdmin
    ? (loading ? 'Saving...' : '💾 Save Arena Settings')
    : (loading ? 'Setting up...' : success ? '✅ Application Submitted!' : 'Submit Application & Claim Turf');

  return (
    <>
      <div className="ct-wrapper" style={{ paddingTop: '40px' }}>
        <div className="desktop-container" style={{ maxWidth: '800px' }}>

          <div className="ct-header">
            <button className="ct-back-btn" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
            </button>
            <h1 className="ct-header-title">{isVenueAdmin ? 'Manage Arena Settings' : 'Partner with Us'}</h1>
          </div>

        <div className="ct-hero">
          <div className="ct-hero-icon"><Shield size={44} color="#667eea" /></div>
          <h2 className="ct-hero-title">Own & Manage Your Venue</h2>
          <p className="ct-hero-desc">Set name, timings, pitches, and time-slot prices from one page.</p>
        </div>

        {!isVenueAdmin && (
          <div className="ct-card">
            <div className="ct-step-badge">P</div>
            <h3 className="ct-card-title">Personal Information</h3>
            <p className="ct-card-desc">Your details will be used for official venue management.</p>
            <div className="ct-field">
              <label>Full Name</label>
              <input type="text" defaultValue={userInfo?.name} placeholder="Your full name" />
            </div>
            <div className="ct-field">
              <label>Phone Number</label>
              <input 
                type="text" 
                value={ownerPhone} 
                onChange={(e) => setOwnerPhone(e.target.value)} 
                placeholder="03XX-XXXXXXX" 
              />
            </div>
          </div>
        )}

        <div className="ct-card">
          <div className="ct-step-badge">1</div>
          <h3 className="ct-card-title">{isVenueAdmin ? 'Arena Information' : 'Venue Information'}</h3>
          {!isVenueAdmin ? (
            <>
              <p className="ct-card-desc">Choose the venue you want to claim ownership of.</p>
              <div className="ct-dropdown-wrapper">
                <button className="ct-dropdown-btn" onClick={() => setShowDropdown(!showDropdown)}>
                  {selectedVenueId === 'NEW_VENUE' ? (
                    <div className="ct-selected-venue">
                      <span className="ct-venue-name">{venueName || 'New Arena'}</span>
                      <span className="ct-venue-addr"><MapPin size={12} /> {address || 'New Address'}</span>
                    </div>
                  ) : selectedVenue ? (
                    <div className="ct-selected-venue">
                      <span className="ct-venue-name">{selectedVenue.name}</span>
                      <span className="ct-venue-addr"><MapPin size={12} /> {selectedVenue.address}</span>
                    </div>
                  ) : (
                    <span className="ct-dropdown-placeholder">Choose a venue...</span>
                  )}
                  <ChevronDown size={16} />
                </button>
                {showDropdown && (
                  <div className="ct-dropdown-list">
                    <div
                      className={`ct-dropdown-item ${selectedVenueId === 'NEW_VENUE' ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedVenueId('NEW_VENUE');
                        setVenueName('');
                        setAddress('');
                        setShowDropdown(false);
                      }}
                      style={{ fontWeight: 'bold', color: '#667eea', borderBottom: '1px solid #e2e8f0', marginBottom: '8px' }}
                    >
                      <Plus size={14} style={{ marginRight: 6 }} />
                      <span>Add New Arena</span>
                    </div>
                    {venues.length === 0 ? (
                      <div className="ct-dropdown-item" style={{ color: '#94a3b8' }}>No unclaimed venues</div>
                    ) : venues.map((v) => (
                      <div
                        key={v._id}
                        className={`ct-dropdown-item ${selectedVenueId === v._id ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedVenueId(v._id);
                          setVenueName(v.name || '');
                          setAddress(v.address || '');
                          setShowDropdown(false);
                        }}
                      >
                        <span className="ct-item-name">{v.name}</span>
                        <span className="ct-item-addr">{v.address}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedVenueId === 'NEW_VENUE' && (
                <div style={{ marginTop: 24 }}>
                  <div className="ct-field">
                    <label>Arena Name</label>
                    <input type="text" value={venueName} onChange={(e) => setVenueName(e.target.value)} placeholder="Arena name" />
                  </div>
                  <div className="ct-field">
                    <label>Address</label>
                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Arena address" />
                  </div>
                  <div className="ct-field">
                    <label>Description</label>
                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your arena" />
                  </div>
                  <div className="ct-field">
                    <label>Contact</label>
                    <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="03XX-XXXXXXX" />
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="ct-field">
                <label>Arena Name</label>
                <input type="text" value={venueName} onChange={(e) => setVenueName(e.target.value)} placeholder="Arena name" />
              </div>
              <div className="ct-field">
                <label>Address</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Arena address" />
              </div>
              <div className="ct-field">
                <label>Description</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your arena" />
              </div>
              <div className="ct-field">
                <label>Contact</label>
                <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="03XX-XXXXXXX" />
              </div>
            </>
          )}
        </div>

        <div className="ct-card">
          <div className="ct-step-badge">2</div>
          <h3 className="ct-card-title">Setup Your Pitches</h3>
          <p className="ct-card-desc">Add number of pitches, start/end timings, and different prices for each slot range.</p>

          <div className="ct-field">
            <label>Number of Pitches</label>
            <input
              type="number"
              min="1"
              value={numberOfPitches}
              onChange={(e) => setNumberOfPitches(Number(e.target.value || 1))}
            />
          </div>

          {pitches.map((pitch, i) => (
            <div className="ct-pitch-card" key={pitch._id || i}>
              <div className="ct-pitch-header">
                <span className="ct-pitch-num">Pitch {i + 1}</span>
                {pitches.length > 1 && (
                  <button className="ct-pitch-remove" onClick={() => removePitch(i)}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="ct-pitch-fields">
                <div className="ct-field">
                  <label>Pitch Name</label>
                  <input
                    type="text"
                    value={pitch.name}
                    onChange={(e) => updatePitch(i, 'name', e.target.value)}
                    placeholder="e.g. Indoor Arena A"
                  />
                </div>
                <div className="ct-field">
                  <label>Sport Type / Pitch Name</label>
                  <input 
                    type="text" 
                    list="sports-list"
                    value={pitch.sport_type} 
                    onChange={(e) => updatePitch(i, 'sport_type', e.target.value)}
                    placeholder="e.g. Futsal, Box Cricket..."
                  />
                  <datalist id="sports-list">
                    <option value="Futsal" />
                    <option value="Cricket" />
                    <option value="Football" />
                    <option value="Basketball" />
                    <option value="Paddle" />
                    <option value="Box Cricket" />
                  </datalist>
                </div>
                <div className="ct-field-row">
                  <div className="ct-field">
                    <label>Start Time</label>
                    <input type="time" value={pitch.open_time} onChange={(e) => updatePitch(i, 'open_time', e.target.value)} />
                  </div>
                  <div className="ct-field">
                    <label>End Time</label>
                    <input type="time" value={pitch.close_time} onChange={(e) => updatePitch(i, 'close_time', e.target.value)} />
                  </div>
                </div>
                <div className="ct-field">
                  <label>Default Price Per Hour (PKR)</label>
                  <input
                    type="number"
                    value={pitch.price_per_hour}
                    onChange={(e) => updatePitch(i, 'price_per_hour', e.target.value)}
                    placeholder="1500"
                  />
                </div>

                <div className="ct-field" style={{ marginTop: 12 }}>
                  <label>Different Prices For Time Slots</label>
                </div>

                {(pitch.slot_pricing || []).map((sp, spIndex) => (
                  <div className="ct-field-row" key={`${i}-${spIndex}`}>
                    <div className="ct-field">
                      <label>From</label>
                      <input
                        type="time"
                        value={sp.start_time}
                        onChange={(e) => updateSlotPrice(i, spIndex, 'start_time', e.target.value)}
                      />
                    </div>
                    <div className="ct-field">
                      <label>To</label>
                      <input
                        type="time"
                        value={sp.end_time}
                        onChange={(e) => updateSlotPrice(i, spIndex, 'end_time', e.target.value)}
                      />
                    </div>
                    <div className="ct-field">
                      <label>Price</label>
                      <input
                        type="number"
                        value={sp.price}
                        onChange={(e) => updateSlotPrice(i, spIndex, 'price', e.target.value)}
                      />
                    </div>
                    <div className="ct-field" style={{ alignSelf: 'flex-end' }}>
                      <button className="ct-pitch-remove" onClick={() => removeSlotPrice(i, spIndex)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                <button className="ct-add-pitch-btn" onClick={() => addSlotPrice(i)}>
                  <Plus size={16} /> Add Slot Price Range
                </button>
              </div>
            </div>
          ))}

          <button className="ct-add-pitch-btn" onClick={addPitch}>
            <Plus size={16} /> Add Another Pitch
          </button>
        </div>

        {!isVenueAdmin && (
          <div className="ct-card">
            <div className="ct-step-badge">3</div>
            <h3 className="ct-card-title">Upload CNIC or Utility Bill</h3>
            <p className="ct-card-desc">Upload a clear photo for verification.</p>
            <label className="ct-upload-area" htmlFor="cnic-upload">
              {fileName ? (
                <div className="ct-file-selected">
                  <CheckCircle size={24} color="#10b981" />
                  <span className="ct-file-name">{fileName}</span>
                  <span className="ct-file-change">Change file</span>
                </div>
              ) : (
                <div className="ct-upload-placeholder">
                  <Upload size={32} color="#94a3b8" />
                  <span className="ct-upload-text">Click to upload</span>
                  <span className="ct-upload-hint">.jpg, .png, or .pdf (max 5MB)</span>
                </div>
              )}
              <input
                id="cnic-upload"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        )}

        <div className="ct-card ct-submit-card">
          <div className="ct-step-badge">{isVenueAdmin ? '3' : '4'}</div>
          <h3 className="ct-card-title">{isVenueAdmin ? 'Save Changes' : 'Submit & Go Live'}</h3>
          {resultMsg && (
            <div className={`ct-msg ${success ? 'success' : 'error'}`}>{resultMsg}</div>
          )}
          <button
            className="ct-submit-btn"
            onClick={isVenueAdmin ? handleSaveAdminSettings : handleClaim}
            disabled={loading}
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default ClaimTurf;
