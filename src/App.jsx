import { Routes, Route, Navigate } from 'react-router-dom';
import UserLayout from './layouts/UserLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VenueDetail from './pages/VenueDetail';
import PostRequest from './pages/PostRequest';
import ConfirmBooking from './pages/ConfirmBooking';
import Profile from './pages/Profile';
import ClaimTurf from './pages/ClaimTurf';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCalendar from './pages/admin/AdminCalendar';
import AdminBookings from './pages/admin/AdminBookings';
import AdminSettings from './pages/admin/AdminSettings';
import './App.css';

const ProtectedRoute = ({ children, adminOnly = false, userOnly = false }) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }

  const isRoleAdmin = userInfo.role === 'VENUE_ADMIN' || userInfo.role === 'ADMIN';

  if (adminOnly && !isRoleAdmin) {
    return <Navigate to="/user/home" replace />;
  }

  if (userOnly && isRoleAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

const RootRedirect = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  if (!userInfo) return <Navigate to="/login" replace />;
  const isRoleAdmin = userInfo.role === 'VENUE_ADMIN' || userInfo.role === 'ADMIN';
  return <Navigate to={isRoleAdmin ? "/admin/dashboard" : "/user/home"} replace />;
};

function App() {
  return (
    <Routes>
      {/* Root Path */}
      <Route path="/" element={<RootRedirect />} />
      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* User / Player Website Routes */}
      <Route 
        path="/user" 
        element={
          <ProtectedRoute userOnly>
            <UserLayout />
          </ProtectedRoute>
        }
      >
        <Route path="home" element={<Home />} />
        <Route path="venue/:id" element={<VenueDetail />} />
        <Route path="post-request" element={<PostRequest />} />
        <Route path="confirm-booking" element={<ConfirmBooking />} />
        <Route path="profile" element={<Profile />} />
        <Route path="apply-admin" element={<ClaimTurf />} />
        <Route index element={<Navigate to="home" replace />} />
      </Route>

      {/* Admin Website Routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute adminOnly>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="calendar" element={<AdminCalendar />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
