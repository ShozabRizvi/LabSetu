import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Registration.css';
import logo from './assets/logo.png';

export default function Registration() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignIn = (e) => {
    e.preventDefault();
    if (email && email.includes('@') && password) {
      localStorage.setItem('userEmail', email);
      navigate('/app/getting-started');
    } else {
      setError('Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="registration-container">
      <div className="registration-card">
        <div className="registration-header">
          <img src={logo} alt="LabSetu Logo" className="registration-logo" />
          <h1 className="registration-title">Welcome to LabSetu</h1>
          <p className="registration-subtitle">Enter your details to continue</p>
        </div>
        <form className="registration-form" onSubmit={handleSignIn}>
          <div className="registration-input-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="registration-input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="registration-error">{error}</p>}
          <button type="submit" className="registration-button">Sign In</button>
        </form>
      </div>
    </div>
  );
}
