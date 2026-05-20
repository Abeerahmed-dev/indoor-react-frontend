import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Home as HomeIcon, Users, UserCircle, LogOut, LayoutDashboard } from 'lucide-react';
import '../App.css';

const UserLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const isVenueAdmin = userInfo?.role === 'VENUE_ADMIN';

  return (
    <>
      <nav className="top-nav-bar">
        <div className="top-nav-content">
          <div className="nav-brand" onClick={() => navigate('/user/home')}>
            Venue Reserve
          </div>
          <div className="nav-links">
            <button 
              className={`nav-item ${location.pathname === '/user/home' ? 'active' : ''}`} 
              onClick={() => navigate('/user/home')}
            >
              <HomeIcon size={18} /> Home
            </button>
            <button 
              className={`nav-item ${location.pathname === '/user/post-request' ? 'active' : ''}`} 
              onClick={() => navigate('/user/post-request')}
            >
              <Users size={18} /> Find Players
            </button>
            <button 
              className={`nav-item ${location.pathname === '/user/profile' ? 'active' : ''}`} 
              onClick={() => navigate('/user/profile')}
            >
              <UserCircle size={18} /> Profile
            </button>
            
            {!isVenueAdmin && (
              <button 
                className={`nav-item claim-pill ${location.pathname === '/user/apply-admin' ? 'active' : ''}`} 
                onClick={() => navigate('/user/apply-admin')}
              >
                Register Venue
              </button>
            )}

            {isVenueAdmin && (
              <button className="nav-item admin-badge" onClick={() => navigate('/admin/dashboard')}>
                <LayoutDashboard size={18} /> Admin Panel
              </button>
            )}

            {userInfo ? (
              <button className="logout-btn" onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </button>
            ) : (
              <button className="nav-item" onClick={() => navigate('/login')}>
                Login
              </button>
            )}
            
            {userInfo && (
              <div className="profile-avatar">
                {userInfo.name ? userInfo.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'}
              </div>
            )}
          </div>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>
    </>
  );
};

export default UserLayout;
