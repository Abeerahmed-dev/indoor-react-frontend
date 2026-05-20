import React, { useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import axios from 'axios';
import { Home, Calendar, List, Settings, LogOut, ArrowLeft } from 'lucide-react';
import '../../App.css'; // Make sure global app styles are loaded
import './AdminLayout.css';
import './AdminPages.css';

const NAV_ITEMS = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: Home },
  { path: '/admin/calendar', label: 'Calendar', icon: Calendar },
  { path: '/admin/bookings', label: 'Bookings', icon: List },
  { path: '/admin/settings', label: 'Arena Settings', icon: Settings },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    const checkVenue = async () => {
      const venueId = userInfo?.owned_venues?.[0];
      if (venueId) {
        try {
          await axios.get(`/api/venues/${venueId}`);
        } catch (err) {
          if (err.response?.status === 404) {
            // Venue missing from DB, clear owned_venues in localStorage
            const newUserInfo = { ...userInfo, owned_venues: [] };
            localStorage.setItem('userInfo', JSON.stringify(newUserInfo));
            navigate('/'); // Force back to player site to re-register
          }
        }
      }
    };
    checkVenue();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const venueName = userInfo?.owned_venues?.length > 0 ? 'My Venue' : 'Venue Dashboard';

  return (
    <>
      <nav className="top-nav-bar admin-top-nav">
        <div className="top-nav-content">
          <div className="nav-brand" onClick={() => navigate('/admin/dashboard')}>
            <span style={{ color: 'var(--gold-primary)', marginRight: 8 }}>💎</span>
            VenuePro
          </div>
          <div className="nav-links">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <item.icon size={16} /> {item.label}
              </button>
            ))}
            <div className="nav-divider" style={{ width: '1px', height: '24px', background: 'var(--border-subtle)', margin: '0 12px' }}></div>
            <button className="nav-item" onClick={() => navigate('/user/home')} title="View as Customer">
              <ArrowLeft size={16} /> Player View
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={16} /> Logout
            </button>
            <div className="profile-avatar" style={{ background: 'var(--gold-gradient)', color: '#000' }}>
              {userInfo?.name ? userInfo.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'A'}
            </div>
          </div>
        </div>
      </nav>

      <div className="al-wrapper">
        <div className="desktop-container" style={{ maxWidth: '1200px' }}>
          <div className="al-content">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLayout;
