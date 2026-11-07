import React from 'react';
import { X, Phone, MapPin, Clock, MessageSquare, Mic, AlertTriangle, CheckCircle } from 'lucide-react';
import type { CallLog } from '../data/mockData';

interface Props {
  call: CallLog;
  onClose: () => void;
}

const WaveBar: React.FC<{ height: number; delay: number }> = ({ height, delay }) => (
  <div
    className="wave-bar"
    style={{
      height: `${height}%`,
      '--d': `${delay}s`,
      animationDuration: `${delay}s`,
    } as React.CSSProperties}
  />
);

export const CallDetailModal: React.FC<Props> = ({ call, onClose }) => {
  const waveHeights = [30, 55, 80, 45, 90, 60, 35, 70, 50, 85, 40, 65, 75, 30, 55, 90, 45, 70, 35, 60, 80, 50, 40, 75, 65, 55, 85, 30, 70, 45];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-title">{call.callerName}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              {call.callerPhone} · {call.serviceType}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`badge ${call.status}`}>
              {call.status === 'emergency' && <AlertTriangle size={10} />}
              {call.status === 'completed' && <CheckCircle size={10} />}
              {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
            </span>
            <button className="icon-btn" id="modal-close-btn" onClick={onClose}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Call Info Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { icon: <Clock size={13} />, label: 'Time', value: call.time },
            { icon: <Phone size={13} />, label: 'Duration', value: call.duration || 'Missed' },
            { icon: <MessageSquare size={13} />, label: 'Lead Score', value: call.leadScore ? `${call.leadScore}/100` : '—' },
          ].map(item => (
            <div key={item.label} style={{
              background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
              padding: '12px 14px', border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: 'var(--text-muted)' }}>
                {item.icon}
                <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Address */}
        {call.address !== 'Unknown' && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8, background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)',
            padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)'
          }}>
            <MapPin size={14} style={{ marginTop: 1, flexShrink: 0, color: 'var(--accent-blue)' }} />
            <span>{call.address}</span>
          </div>
        )}

        {/* AI Summary */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
            AI Summary
          </div>
          <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
            borderLeft: '3px solid var(--accent-blue)', borderRadius: 'var(--radius-sm)',
            padding: '12px 14px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7
          }}>
            {call.summary}
          </div>
        </div>

        {/* Audio Player */}
        {call.duration !== '0:00' && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
              Recording
            </div>
            <div className="audio-player">
              <button className="icon-btn" id="btn-play-recording" style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-blue)', border: 'none', color: 'white', flexShrink: 0 }}>
                <Mic size={13} />
              </button>
              <div className="audio-waveform">
                {waveHeights.map((h, i) => (
                  <WaveBar key={i} height={h} delay={0.3 + (i % 8) * 0.07} />
                ))}
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace', flexShrink: 0 }}>{call.duration}</span>
            </div>
          </div>
        )}

        {/* Transcript */}
        {call.transcriptSnippet.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
              Transcript Snippet
            </div>
            <div style={{ maxHeight: 200, overflowY: 'auto', paddingRight: 4 }}>
              {call.transcriptSnippet.map((line, i) => (
                <div key={i} className="transcript-bubble">
                  <div className={`bubble-label ${line.speaker.toLowerCase()}`}>{line.speaker}</div>
                  <div className="bubble-text">{line.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
          <button className="btn btn-primary" id="btn-call-back" style={{ flex: 1 }}>
            <Phone size={13} /> Call Back
          </button>
          <button className="btn btn-secondary" id="btn-send-sms">
            <MessageSquare size={13} /> Send SMS
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
