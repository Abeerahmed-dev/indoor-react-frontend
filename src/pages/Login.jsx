import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css'; // We'll create a shared CSS for Auth

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState('USER'); // 'USER' or 'ADMIN'
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Clear any stale login data when on login page
  useEffect(() => {
    localStorage.removeItem('userInfo');
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const { data } = await axios.post(
        '/api/users/login',
        { email, password },
        { headers: { 'Content-Type': 'application/json' } }
      );

      // Exclusive Role Check
      const isRoleAdmin = data.role === 'VENUE_ADMIN' || data.role === 'ADMIN';
      if (authMode === 'ADMIN' && !isRoleAdmin) {
        throw new Error('This account is not registered as an Admin. Please use Player mode.');
      }
      if (authMode === 'USER' && isRoleAdmin) {
        throw new Error('This is an Admin account. Please use Admin mode to sign in.');
      }

      localStorage.setItem('userInfo', JSON.stringify(data));
      navigate(isRoleAdmin ? '/admin/dashboard' : '/user/home');
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>VENUE RESERVE</h2>
        
        <div className="auth-toggle">
          <button 
            className={`toggle-btn ${authMode === 'USER' ? 'active' : ''}`}
            onClick={() => setAuthMode('USER')}
          >
            Player Mode
          </button>
          <button 
            className={`toggle-btn ${authMode === 'ADMIN' ? 'active' : ''}`}
            onClick={() => setAuthMode('ADMIN')}
          >
            Admin Mode
          </button>
        </div>

        <p className="subtitle">
          {authMode === 'USER' ? 'Sign in to book exclusive facilities' : 'Manage your arena and bookings'}
        </p>

        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={submitHandler}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-btn">
            Sign In
          </button>
        </form>
        <div className="auth-footer">
          New Customer? <Link to="/signup">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
