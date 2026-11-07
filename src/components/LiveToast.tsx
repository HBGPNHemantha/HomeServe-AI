import React from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { AlertTriangle, PhoneCall, Calendar, X, ArrowRight, Star } from 'lucide-react';

export const LiveToast: React.FC<{ onInspectCall?: (call: any) => void }> = ({ onInspectCall }) => {
  const { activeAlert, dismissAlert } = useWebSocket();

  if (!activeAlert) return null;

  const isEmergency = activeAlert.type === 'emergency';
  const isBooking = activeAlert.type === 'booking';

  const accentColor = isEmergency
    ? 'var(--accent-rose)'
    : isBooking
    ? 'var(--accent-emerald)'
    : 'var(--accent-cyan)';

  const bgColor = isEmergency
    ? 'rgba(244, 63, 94, 0.12)'
    : isBooking
    ? 'rgba(16, 185, 129, 0.12)'
    : 'rgba(6, 182, 212, 0.12)';

  const borderColor = isEmergency
    ? 'rgba(244, 63, 94, 0.4)'
    : isBooking
    ? 'rgba(16, 185, 129, 0.4)'
    : 'rgba(6, 182, 212, 0.4)';

  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 9999,
        width: 380,
        background: 'var(--bg-elevated)',
        border: `1.5px solid ${borderColor}`,
        borderRadius: 14,
        boxShadow: `0 12px 32px rgba(0, 0, 0, 0.45), 0 0 20px ${bgColor}`,
        padding: 16,
        animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: bgColor,
              color: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isEmergency ? <AlertTriangle size={16} /> : isBooking ? <Calendar size={16} /> : <PhoneCall size={16} />}
          </div>
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
            {activeAlert.title}
          </span>
        </div>
        <button
          className="icon-btn"
          style={{ width: 26, height: 26 }}
          onClick={dismissAlert}
        >
          <X size={14} />
        </button>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
            {activeAlert.callerName}
          </span>
          {activeAlert.leadScore != null && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: activeAlert.leadScore >= 80 ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                background: 'var(--bg-surface)',
                padding: '2px 8px',
                borderRadius: 99,
                border: '1px solid var(--border-subtle)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Star size={10} /> Score: {activeAlert.leadScore}
            </span>
          )}
        </div>
        {activeAlert.phone && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            {activeAlert.phone} · {activeAlert.serviceType}
          </div>
        )}
      </div>

      <div
        style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          background: 'var(--bg-surface)',
          padding: '8px 10px',
          borderRadius: 8,
          marginBottom: 12,
          borderLeft: `2px solid ${accentColor}`,
        }}
      >
        {activeAlert.message}
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost btn-xs" onClick={dismissAlert}>
          Dismiss
        </button>
        {activeAlert.rawCall && onInspectCall && (
          <button
            className="btn btn-primary btn-xs"
            onClick={() => {
              onInspectCall(activeAlert.rawCall);
              dismissAlert();
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            Inspect Call <ArrowRight size={11} />
          </button>
        )}
      </div>
    </div>
  );
};

