import React, { useState } from 'react';
import { Zap, Lock, Mail, User, ArrowRight, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!fullName.trim()) {
          setError('Please enter your full name');
          setLoading(false);
          return;
        }
        await register(email, password, fullName);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('owner@homeserve.com');
    setPassword('password123');
    setError(null);
    setLoading(true);
    try {
      await login('owner@homeserve.com', 'password123');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% -20%, rgba(59, 130, 246, 0.18) 0%, var(--bg-body) 65%)',
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background ambient decorative glow */}
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 20,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.1)',
          padding: '36px 32px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(59, 130, 246, 0.35)',
              marginBottom: 14,
            }}
          >
            <Zap size={26} color="white" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Space Grotesk', color: 'var(--text-primary)', marginBottom: 6 }}>
            HomeServe AI
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {isRegister ? 'Create your business receptionist account' : 'Sign in to access your Voice AI receptionist'}
          </p>
        </div>

        {/* Mode Toggle Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-elevated)',
            padding: 4,
            borderRadius: 10,
            marginBottom: 22,
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(null); }}
            style={{
              flex: 1,
              padding: '8px 0',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              background: !isRegister ? 'var(--bg-surface)' : 'transparent',
              color: !isRegister ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: !isRegister ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(null); }}
            style={{
              flex: 1,
              padding: '8px 0',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              background: isRegister ? 'var(--bg-surface)' : 'transparent',
              color: isRegister ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: isRegister ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: 'var(--accent-rose)',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 12,
              marginBottom: 18,
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="input-group" style={{ marginBottom: 16 }}>
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={12} color="var(--accent-cyan)" /> Full Name
              </label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="e.g. Jake Russo"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>
          )}

          <div className="input-group" style={{ marginBottom: 16 }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail size={12} color="var(--accent-blue)" /> Email Address
            </label>
            <input
              type="email"
              required
              className="input-field"
              placeholder="owner@homeserve.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group" style={{ marginBottom: 22 }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={12} color="var(--accent-purple)" /> Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              className="input-field"
              placeholder="••••••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '12px 0',
              fontSize: 14,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              borderRadius: 10,
            }}
            disabled={loading}
          >
            {loading ? (
              'Authenticating...'
            ) : isRegister ? (
              <>Create Account <ArrowRight size={15} /></>
            ) : (
              <>Sign In to Dashboard <ArrowRight size={15} /></>
            )}
          </button>
        </form>

        {/* Demo Quick Login */}
        {!isRegister && (
          <div style={{ marginTop: 20 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: 'var(--text-muted)',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                marginBottom: 12,
              }}
            >
              <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
              <span>Or 1-Click Access</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleDemoLogin}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderRadius: 10,
                borderColor: 'rgba(6, 182, 212, 0.3)',
                background: 'rgba(6, 182, 212, 0.06)',
                color: 'var(--accent-cyan)',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <Sparkles size={14} /> Quick Demo Login (Jake Russo)
            </button>
          </div>
        )}

        {/* Security Footer Note */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginTop: 24,
            paddingTop: 16,
            borderTop: '1px solid var(--border-subtle)',
            fontSize: 11,
            color: 'var(--text-muted)',
          }}
        >
          <ShieldCheck size={14} color="var(--accent-emerald)" />
          <span>Secured with JWT Token & PBKDF2 Password Hashing</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

