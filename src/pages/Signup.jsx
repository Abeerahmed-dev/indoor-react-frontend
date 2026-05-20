import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authMode, setAuthMode] = useState('USER'); // 'USER' or 'ADMIN'
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const config = {
        headers: { 'Content-Type': 'application/json' },
      };

      const { data } = await axios.post(
        '/api/users',
        { name, email, password, role: authMode === 'ADMIN' ? 'USER' : 'USER' }, // Initially everyone is a USER until approval
        config
      );

      localStorage.setItem('userInfo', JSON.stringify(data));
      
      if (authMode === 'ADMIN') {
        navigate('/user/apply-admin');
      } else {
        navigate('/user/home');
      }
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
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
            Player
          </button>
          <button 
            className={`toggle-btn ${authMode === 'ADMIN' ? 'active' : ''}`}
            onClick={() => setAuthMode('ADMIN')}
          >
            Admin
          </button>
        </div>

        <p className="subtitle">
          {authMode === 'USER' ? 'Create an account for exclusive access' : 'Register your arena and start earning'}
        </p>

        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={submitHandler}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Enter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-btn">
            {authMode === 'USER' ? 'Sign Up' : 'Continue to Application'}
          </button>
        </form>
        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
