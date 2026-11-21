import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, Mail, Sprout, UserRound } from 'lucide-react';
import { authApi } from '../../services/api';
import { useAuth } from './useAuth';
import './AuthPages.css';

function getErrorMessage(error) {
  const detail = error.response?.data?.detail;
  return typeof detail === 'string' ? detail : error.message || 'Something went wrong. Please try again.';
}

export function AuthPages() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const mode = location.pathname === '/register'
    ? 'register'
    : location.pathname === '/forgot-password'
      ? 'forgot'
      : 'login';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsSubmitting(true);

    try {
      if (mode === 'forgot') {
        await authApi.forgotPassword({ email });
        setNotice('If an account exists for this email, password reset instructions will be sent.');
      } else {
        const credentials = { email, password };
        if (mode === 'register') await register({ ...credentials, name });
        else await login(credentials);
        navigate(location.state?.from?.pathname || '/', { replace: true });
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = mode === 'register' ? 'Create your account' : mode === 'forgot' ? 'Reset your password' : 'Welcome back';
  const description = mode === 'register'
    ? 'Join a growing community of connected farmers.'
    : mode === 'forgot'
      ? 'Enter your email and we’ll help you get back in.'
      : 'Sign in to continue to your farming dashboard.';

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <section className="auth-form-panel" aria-labelledby="auth-title">
          <div className="auth-form-wrap">
            <div className="auth-brand">
              <span className="auth-brand-mark"><Sprout size={22} strokeWidth={2.2} /></span>
              <span>AgriConnect <b>AI</b></span>
            </div>
            <h2 id="auth-title">{title}</h2>
            <p className="auth-description">{description}</p>

            <form className="auth-form" onSubmit={handleSubmit}>
              {mode === 'register' && (
                <label className="auth-field">
                  <span>Full name</span>
                  <span className="auth-input-wrap">
                    <UserRound size={18} aria-hidden="true" />
                    <input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" required minLength={2} maxLength={80} />
                  </span>
                </label>
              )}

              <label className="auth-field">
                <span>Email address</span>
                <span className="auth-input-wrap">
                  <Mail size={18} aria-hidden="true" />
                  <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
                </span>
              </label>

              {mode !== 'forgot' && (
                <label className="auth-field">
                  <span>Password</span>
                  <span className="auth-input-wrap">
                    <LockKeyhole size={18} aria-hidden="true" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={mode === 'register' ? 'At least 8 characters' : 'Enter your password'}
                      required
                      minLength={mode === 'register' ? 8 : undefined}
                      maxLength={128}
                    />
                    <button className="auth-password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </span>
                </label>
              )}

              {mode === 'login' && <div className="auth-forgot"><Link to="/forgot-password">Forgot password?</Link></div>}
              {error && <p className="auth-message auth-error" role="alert">{error}</p>}
              {notice && <p className="auth-message auth-notice" role="status">{notice}</p>}

              <button className="auth-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Please wait...' : mode === 'register' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Sign in'}
              </button>
            </form>

            <p className="auth-switch">
              {mode === 'register' ? <>Already have an account? <Link to="/login">Sign in</Link></> : mode === 'forgot' ? <Link to="/login">Back to sign in</Link> : <>New to AgriConnect? <Link to="/register">Create an account</Link></>}
            </p>
            <p className="auth-legal">By continuing, you agree to use AgriConnect AI responsibly.</p>
          </div>
        </section>
      </div>
    </main>
  );
}