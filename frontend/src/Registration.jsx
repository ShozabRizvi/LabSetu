import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './Registration.css';
import logo from './assets/logo.png';
import { 
  UserIcon, 
  ShieldCheckIcon, 
  ArrowLeftIcon, 
  CheckCircleIcon,
  InformationCircleIcon,
  HomeIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardDocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

export default function Registration({ initialMode }) {
  const { login, signup, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getPathMode = () => {
    if (initialMode) return initialMode;
    if (location.pathname === '/signup') return 'signup';
    if (location.pathname === '/forgot-password') return 'forgot';
    return 'signin';
  };

  const getInitialRole = () => {
    const params = new URLSearchParams(location.search);
    const queryRole = params.get('role');
    if (queryRole === 'authority' || queryRole === 'citizen') return queryRole;
    if (location.state?.defaultRole) return location.state.defaultRole;
    return 'citizen';
  };

  // Mode: 'signin' | 'signup' | 'forgot'
  const [mode, setMode] = useState(getPathMode());
  // Role: 'citizen' | 'authority'
  const [role, setRole] = useState(getInitialRole);

  useEffect(() => {
    setMode(getPathMode());
    const params = new URLSearchParams(location.search);
    const queryRole = params.get('role');
    if (queryRole === 'authority' || queryRole === 'citizen') {
      setRole(queryRole);
    } else if (location.state?.defaultRole) {
      setRole(location.state.defaultRole);
    }
  }, [location.pathname, location.search, location.state, initialMode]);

  // Sign in state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Sign up state - expanded
  const [signUpForm, setSignUpForm] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    address: '',
    centerName: '',
    designation: '',
    password: '',
    confirmPassword: ''
  });
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);
  const [copiedSignupPassword, setCopiedSignupPassword] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState(1);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Feedback states
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Switch modes cleanly & update URL
  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
    setForgotStep(1);
    if (newMode === 'signin') navigate('/login');
    else if (newMode === 'signup') navigate('/signup');
    else if (newMode === 'forgot') navigate('/forgot-password');
  };

  // Password strength checker
  const getPasswordStrength = (pw) => {
    if (!pw) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { level: 1, label: 'Weak', color: '#ef4444' };
    if (score <= 2) return { level: 2, label: 'Fair', color: '#f59e0b' };
    if (score <= 3) return { level: 3, label: 'Good', color: '#3b82f6' };
    return { level: 4, label: 'Strong', color: '#15803d' };
  };

  // Email/phone validation helper
  const isValidEmailOrPhone = (value) => {
    if (!value) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;
    return emailRegex.test(value) || phoneRegex.test(value.replace(/\D/g, ''));
  };

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleCopyPassword = () => {
    if (!loginPassword) return;
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(loginPassword);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = loginPassword;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    } catch {
      // ignore copy errors
    }
  };

  const handleCopySignupPassword = () => {
    if (!signUpForm.password) return;
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(signUpForm.password);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = signUpForm.password;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedSignupPassword(true);
      setTimeout(() => setCopiedSignupPassword(false), 2000);
    } catch {
      // ignore copy errors
    }
  };

  // Sign in handler
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const trimmedEmail = loginEmail.trim();
    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      setError('Please enter a valid email address with an @ symbol and domain (e.g. name@domain.com).');
      return;
    }
    if (!loginPassword || loginPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(trimmedEmail, loginPassword, role);
    setIsSubmitting(false);

    if (result.success) {
      const fromPath = location.state?.from?.pathname;
      if (fromPath && (
        (result.user.role === 'citizen' && fromPath.startsWith('/portal')) ||
        (result.user.role === 'authority' && fromPath.startsWith('/app'))
      )) {
        navigate(fromPath);
      } else if (result.user.role === 'citizen') {
        navigate('/portal/dashboard');
      } else {
        navigate('/app/getting-started');
      }
    } else {
      setError(result.error || 'Authentication failed. Please check your credentials.');
    }
  };

  // Sign up handler - does NOT auto-login, redirects to login
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!signUpForm.name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!signUpForm.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signUpForm.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    const cleanPhone = signUpForm.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    // Role-specific validation
    if (role === 'citizen') {
      if (!signUpForm.dob) {
        setError('Please enter your date of birth.');
        return;
      }
    }
    if (role === 'authority') {
      if (!signUpForm.centerName.trim()) {
        setError('Please provide your organization or lab name.');
        return;
      }
      if (!signUpForm.designation.trim()) {
        setError('Please provide your designation.');
        return;
      }
    }

    if (!signUpForm.password || signUpForm.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    const strength = getPasswordStrength(signUpForm.password);
    if (strength.level < 2) {
      setError('Password is too weak. Include uppercase letters, numbers, or special characters.');
      return;
    }
    if (signUpForm.password !== signUpForm.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const result = await signup({
      name: signUpForm.name,
      email: signUpForm.email,
      phone: cleanPhone,
      dob: signUpForm.dob || '',
      gender: signUpForm.gender || '',
      address: signUpForm.address || '',
      centerName: signUpForm.centerName,
      designation: signUpForm.designation || '',
      password: signUpForm.password,
      role
    });
    setIsSubmitting(false);

    if (result.success) {
      // Do NOT auto-login — redirect to sign in with success message
      setSignUpForm({ name: '', email: '', phone: '', dob: '', gender: '', address: '', centerName: '', designation: '', password: '', confirmPassword: '' });
      setSuccessMsg('Account created successfully! Please sign in with your credentials.');
      setTimeout(() => {
        switchMode('signin');
      }, 1500);
    } else {
      setError(result.error || 'Registration failed.');
    }
  };

  // Forgot password - Step 1: Send demo reset code
  const handleRequestResetCode = (e) => {
    e.preventDefault();
    setError('');
    if (!forgotEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    setForgotStep(2);
    setSuccessMsg('If an account with this email exists, a recovery code has been sent. Please check your inbox.');
  };

  // Forgot password - Step 2: Verify code and set new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (resetCode !== '123456') {
      setError('Invalid recovery code. For this demo flow, use OTP: 123456');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }

    const result = await resetPassword(forgotEmail, newPassword);
    if (result.success) {
      setForgotStep(3);
      setSuccessMsg('Your password has been successfully reset! You can now sign in with your new password.');
    } else {
      setError(result.error || 'Password reset failed.');
    }
  };

  const signupPasswordStrength = getPasswordStrength(signUpForm.password);


  return (
    <div className="registration-container">
      <div className="registration-card">
        {/* Brand Logo in the middle */}
        <div className="registration-logo-wrapper">
          <Link to="/" title="LabSetu Home">
            <img src={logo} alt="LabSetu Logo" className="registration-logo" />
          </Link>
        </div>

        {/* Role Selector Tabs (Only on Sign In and Sign Up) */}
        {mode !== 'forgot' && (
          <div className="role-selector" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={role === 'citizen'}
              className={`role-tab ${role === 'citizen' ? 'active' : ''}`}
              onClick={() => { setRole('citizen'); setError(''); }}
            >
              <UserIcon className="role-icon" />
              <span>Patient / Citizen</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={role === 'authority'}
              className={`role-tab ${role === 'authority' ? 'active' : ''}`}
              onClick={() => { setRole('authority'); setError(''); }}
            >
              <ShieldCheckIcon className="role-icon" />
              <span>Authority / Staff</span>
            </button>
          </div>
        )}

        {/* Global Notifications */}
        {error && (
          <div className="registration-error" role="alert">
            <InformationCircleIcon style={{ width: '18px', height: '18px', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="registration-success" role="status">
            <CheckCircleIcon style={{ width: '18px', height: '18px', flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* VIEW 1: SIGN IN */}
        {mode === 'signin' && (
          <form className="registration-form" onSubmit={handleSignIn}>
            <div className="registration-input-group">
              <label htmlFor="login-email">
                {role === 'authority' ? 'Official Email' : 'Email Address'}
              </label>
              <input
                type="email"
                id="login-email"
                placeholder={role === 'authority' ? 'admin@labsetu.com' : 'patient@labsetu.com'}
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="registration-input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="login-password">Password (min. 6 characters)</label>
                <button
                  type="button"
                  className="registration-link-btn"
                  onClick={() => switchMode('forgot')}
                >
                  Forgot password?
                </button>
              </div>
              <div className="password-input-wrapper">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  id="login-password"
                  placeholder="Enter password (min. 6 characters)"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <div className="password-actions">
                  <button 
                    type="button" 
                    className="password-action-btn" 
                    onClick={handleCopyPassword} 
                    title={copiedPassword ? "Password copied to clipboard!" : "Copy password to clipboard"}
                    aria-label="Copy password to clipboard"
                  >
                    {copiedPassword ? (
                      <CheckIcon className="pw-toggle-icon" style={{ color: '#15803d' }} />
                    ) : (
                      <ClipboardDocumentIcon className="pw-toggle-icon" />
                    )}
                  </button>
                  <button 
                    type="button" 
                    className="password-action-btn" 
                    onClick={() => setShowLoginPassword(!showLoginPassword)} 
                    tabIndex={-1} 
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeSlashIcon className="pw-toggle-icon" /> : <EyeIcon className="pw-toggle-icon" />}
                  </button>
                </div>
                {copiedPassword && (
                  <span className="password-copied-badge">Copied!</span>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              className="registration-button primary" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing In...' : `Sign In as ${role === 'authority' ? 'Authority' : 'Patient'}`}
            </button>

            <div className="registration-footer-text">
              Don't have an account?{' '}
              <button
                type="button"
                className="registration-link-bold"
                onClick={() => switchMode('signup')}
              >
                Sign Up
              </button>
            </div>
          </form>
        )}

        {/* VIEW 2: SIGN UP */}
        {mode === 'signup' && (
          <form className="registration-form" onSubmit={handleSignUp}>
            <div className="registration-input-group">
              <label htmlFor="signup-name">Full Name <span className="req">*</span></label>
              <input
                type="text"
                id="signup-name"
                placeholder={role === 'authority' ? 'Dr. Name or Staff Name' : 'Patient Full Name'}
                value={signUpForm.name}
                onChange={(e) => setSignUpForm({ ...signUpForm, name: e.target.value })}
                required
              />
            </div>

            <div className="registration-input-group">
              <label htmlFor="signup-email">{role === 'authority' ? 'Official Email' : 'Email Address'} <span className="req">*</span></label>
              <input
                type="email"
                id="signup-email"
                placeholder="name@example.com"
                value={signUpForm.email}
                onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })}
                required
              />
            </div>

            <div className="registration-input-group">
              <label htmlFor="signup-phone">Mobile Number (10 digits) <span className="req">*</span></label>
              <input
                type="tel"
                id="signup-phone"
                placeholder="e.g. 9876543210"
                maxLength={10}
                value={signUpForm.phone}
                onChange={(e) => setSignUpForm({ ...signUpForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                required
              />
            </div>

            {/* Patient-specific fields */}
            {role === 'citizen' && (
              <>
                <div className="registration-row-2col">
                  <div className="registration-input-group">
                    <label htmlFor="signup-dob">Date of Birth <span className="req">*</span></label>
                    <input
                      type="date"
                      id="signup-dob"
                      value={signUpForm.dob}
                      onChange={(e) => setSignUpForm({ ...signUpForm, dob: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="registration-input-group">
                    <label htmlFor="signup-gender">Gender</label>
                    <select
                      id="signup-gender"
                      value={signUpForm.gender}
                      onChange={(e) => setSignUpForm({ ...signUpForm, gender: e.target.value })}
                    >
                      <option value="">Prefer not to say</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="registration-input-group">
                  <label htmlFor="signup-address">Address</label>
                  <input
                    type="text"
                    id="signup-address"
                    placeholder="Street, City, State"
                    value={signUpForm.address}
                    onChange={(e) => setSignUpForm({ ...signUpForm, address: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* Authority-specific fields */}
            {role === 'authority' && (
              <>
                <div className="registration-input-group">
                  <label htmlFor="signup-center">Organization / Lab Name <span className="req">*</span></label>
                  <input
                    type="text"
                    id="signup-center"
                    placeholder="e.g. Metro Diagnostic Lab"
                    value={signUpForm.centerName}
                    onChange={(e) => setSignUpForm({ ...signUpForm, centerName: e.target.value })}
                    required
                  />
                </div>
                <div className="registration-input-group">
                  <label htmlFor="signup-designation">Designation <span className="req">*</span></label>
                  <input
                    type="text"
                    id="signup-designation"
                    placeholder="e.g. Lab Director, Pathologist, Technician"
                    value={signUpForm.designation}
                    onChange={(e) => setSignUpForm({ ...signUpForm, designation: e.target.value })}
                    required
                  />
                </div>
              </>
            )}

            <div className="registration-input-group">
              <label htmlFor="signup-password">Password (min. 6 characters) <span className="req">*</span></label>
              <div className="password-input-wrapper">
                <input
                  type={showSignupPassword ? 'text' : 'password'}
                  id="signup-password"
                  placeholder="Create password"
                  value={signUpForm.password}
                  onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
                  required
                />
                <div className="password-actions">
                  <button 
                    type="button" 
                    className="password-action-btn" 
                    onClick={handleCopySignupPassword} 
                    title={copiedSignupPassword ? "Password copied to clipboard!" : "Copy password to clipboard"}
                    aria-label="Copy password to clipboard"
                  >
                    {copiedSignupPassword ? (
                      <CheckIcon className="pw-toggle-icon" style={{ color: '#15803d' }} />
                    ) : (
                      <ClipboardDocumentIcon className="pw-toggle-icon" />
                    )}
                  </button>
                  <button 
                    type="button" 
                    className="password-action-btn" 
                    onClick={() => setShowSignupPassword(!showSignupPassword)} 
                    tabIndex={-1} 
                    aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                  >
                    {showSignupPassword ? <EyeSlashIcon className="pw-toggle-icon" /> : <EyeIcon className="pw-toggle-icon" />}
                  </button>
                </div>
                {copiedSignupPassword && (
                  <span className="password-copied-badge">Copied!</span>
                )}
              </div>
              {signUpForm.password && (
                <div className="password-strength-bar">
                  <div className="password-strength-track">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="strength-segment" style={{
                        backgroundColor: i <= signupPasswordStrength.level ? signupPasswordStrength.color : '#e2e8f0'
                      }} />
                    ))}
                  </div>
                  <span className="password-strength-label" style={{ color: signupPasswordStrength.color }}>
                    {signupPasswordStrength.label}
                  </span>
                </div>
              )}
            </div>

            <div className="registration-input-group">
              <label htmlFor="signup-confirm-password">Confirm Password <span className="req">*</span></label>
              <div className="password-input-wrapper">
                <input
                  type={showSignupConfirm ? 'text' : 'password'}
                  id="signup-confirm-password"
                  placeholder="Confirm password"
                  value={signUpForm.confirmPassword}
                  onChange={(e) => setSignUpForm({ ...signUpForm, confirmPassword: e.target.value })}
                  required
                />
                <button type="button" className="password-toggle-btn" onClick={() => setShowSignupConfirm(!showSignupConfirm)} tabIndex={-1} aria-label={showSignupConfirm ? 'Hide password' : 'Show password'}>
                  {showSignupConfirm ? <EyeSlashIcon className="pw-toggle-icon" /> : <EyeIcon className="pw-toggle-icon" />}
                </button>
              </div>
              {signUpForm.confirmPassword && signUpForm.password !== signUpForm.confirmPassword && (
                <span className="inline-field-error">Passwords do not match</span>
              )}
            </div>

            <button 
              type="submit" 
              className="registration-button primary" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Account...' : `Register as ${role === 'authority' ? 'Authority' : 'Patient'}`}
            </button>

            <div className="registration-footer-text">
              Already have an account?{' '}
              <button
                type="button"
                className="registration-link-bold"
                onClick={() => switchMode('signin')}
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* VIEW 3: FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <div className="forgot-password-flow">
            {forgotStep === 1 && (
              <form className="registration-form" onSubmit={handleRequestResetCode}>
                <p className="forgot-description">
                  Enter the email address associated with your account. If an account exists, a recovery code will be sent.
                </p>

                <div className="registration-input-group">
                  <label htmlFor="forgot-email">Account Email</label>
                  <input
                    type="email"
                    id="forgot-email"
                    placeholder="name@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="registration-button primary">
                  Send Recovery Code
                </button>

                <button
                  type="button"
                  className="registration-button secondary back-button"
                  onClick={() => switchMode('signin')}
                >
                  <ArrowLeftIcon style={{ width: '16px' }} />
                  Back to Sign In
                </button>
              </form>
            )}

            {forgotStep === 2 && (
              <form className="registration-form" onSubmit={handleResetPassword}>
                <div className="demo-notice-box">
                  <strong>Frontend Demo Notice:</strong> Use OTP code <strong>123456</strong> to verify and update your password.
                </div>

                <div className="registration-input-group">
                  <label htmlFor="reset-code">6-digit Verification Code</label>
                  <input
                    type="text"
                    id="reset-code"
                    placeholder="Enter 6-digit code"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                  />
                </div>

                <div className="registration-input-group">
                  <label htmlFor="new-password">New Password (min 6 chars)</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      id="new-password"
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button type="button" className="password-toggle-btn" onClick={() => setShowNewPassword(!showNewPassword)} tabIndex={-1} aria-label={showNewPassword ? 'Hide password' : 'Show password'}>
                      {showNewPassword ? <EyeSlashIcon className="pw-toggle-icon" /> : <EyeIcon className="pw-toggle-icon" />}
                    </button>
                  </div>
                </div>

                <div className="registration-input-group">
                  <label htmlFor="confirm-new-password">Confirm New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmNewPassword ? 'text' : 'password'}
                      id="confirm-new-password"
                      placeholder="Confirm new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                    />
                    <button type="button" className="password-toggle-btn" onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)} tabIndex={-1} aria-label={showConfirmNewPassword ? 'Hide password' : 'Show password'}>
                      {showConfirmNewPassword ? <EyeSlashIcon className="pw-toggle-icon" /> : <EyeIcon className="pw-toggle-icon" />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="registration-button primary">
                  Update Password
                </button>

                <button
                  type="button"
                  className="registration-button secondary back-button"
                  onClick={() => setForgotStep(1)}
                >
                  <ArrowLeftIcon style={{ width: '16px' }} />
                  Back
                </button>
              </form>
            )}

            {forgotStep === 3 && (
              <div className="forgot-success-state">
                <CheckCircleIcon className="success-big-icon" />
                <h3 className="success-heading">Password Reset Successful</h3>
                <p className="success-sub">
                  Your password has been securely updated. You can now log into your account with the new credentials.
                </p>
                <button
                  type="button"
                  className="registration-button primary"
                  onClick={() => {
                    setLoginEmail(forgotEmail);
                    setLoginPassword('');
                    switchMode('signin');
                  }}
                >
                  Proceed to Sign In
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
