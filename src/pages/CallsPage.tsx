import React, { useState, useEffect } from 'react';
import { Phone, Search, Download, Check, AlertTriangle, CheckCircle, Clock, MessageSquare, ArrowUpRight, Zap, X } from 'lucide-react';
import { getCalls, simulateIncomingCall } from '../api/client';
import { CallDetailModal } from '../components/CallDetailModal';
import type { CallLog } from '../data/mockData';
import { useWebSocket } from '../context/WebSocketContext';

const SimulateCallModal: React.FC<{
  onClose: () => void;
  onCallSimulated: (newCall: CallLog | null) => void;
}> = ({ onClose, onCallSimulated }) => {
  const [scenario, setScenario] = useState<'burst_pipe' | 'ac_repair' | 'roofing'>('burst_pipe');
  const [simulating, setSimulating] = useState(false);

  const scenarios = [
    {
      id: 'burst_pipe',
      title: '🚨 Kitchen Flooding (Emergency Plumbing)',
      caller: 'Jennifer Vance · 3409 Shadow Ridge Pass',
      desc: 'Active pipe burst causing water flooding. High urgency, triggers emergency classification & hot lead scoring.',
      scoreTag: 'Lead Score ~95',
      color: 'var(--accent-rose)'
    },
    {
      id: 'ac_repair',
      title: '❄️ AC Unit Blowing Hot Air (HVAC)',
      caller: 'Marcus Sterling · 1410 East 6th St',
      desc: 'Compressor buzzing in 98°F heat. Customer requests diagnostic inspection for tomorrow morning.',
      scoreTag: 'Lead Score ~85',
      color: 'var(--accent-cyan)'
    },
    {
      id: 'roofing',
      title: '🏠 Hail Storm Shingle Damage (Roofing)',
      caller: 'Amanda Rodriguez · 7203 Great Hills Trail',
      desc: 'Shingles torn off after hail storm. Customer needs roof insurance inspection estimate.',
      scoreTag: 'Lead Score ~80',
      color: 'var(--accent-amber)'
    }
  ];

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const res = await simulateIncomingCall(scenario);
      // Fetch latest call to open detail
      const calls = await getCalls();
      const created = calls.find(c => c.id === res.call_id) || calls[0] || null;
      onCallSimulated(created);
      onClose();
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 560 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} color="var(--accent-cyan)" />
            <div className="modal-title">Simulate Voice AI Inbound Call</div>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={15} /></button>
        </div>

        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Choose a scenario to simulate an incoming AI phone call handled by Sarah. The webhook will receive the audio transcript, analyze it with AI, compute a lead score, and auto-qualify a lead!
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {scenarios.map(s => (
            <div
              key={s.id}
              onClick={() => setScenario(s.id as any)}
              style={{
                border: scenario === s.id ? '2px solid var(--accent-cyan)' : '1px solid var(--border-default)',
                background: scenario === s.id ? 'rgba(6,182,212,0.08)' : 'var(--bg-elevated)',
                borderRadius: 10,
                padding: '12px 16px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{s.title}</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'var(--bg-surface)', color: s.color, fontWeight: 600 }}>
                  {s.scoreTag}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{s.caller}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{s.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSimulate} disabled={simulating}>
            {simulating ? 'Processing AI Call...' : '⚡ Trigger Voice Webhook'}
          </button>
        </div>
      </div>
    </div>
  );
};

const CallsPage: React.FC = () => {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [exported, setExported] = useState(false);
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const { subscribe } = useWebSocket();

  const fetchCallsList = async () => {
    try {
      const data = await getCalls(filter, search);
      setCalls(data);
    } catch (err) {
      console.error('Failed to load calls:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCallsList();
  }, [filter, search]);

  useEffect(() => {
    const unsubscribe = subscribe((payload) => {
      if (payload.type === 'NEW_CALL') {
        const newCall = payload.data.call;
        setCalls(prev => [newCall, ...prev.filter(c => c.id !== newCall.id)]);
      }
    });
    return () => unsubscribe();
  }, [subscribe]);

  const handleExportCsv = () => {
    if (calls.length === 0) return;
    const headers = ['ID', 'Caller Name', 'Caller Phone', 'Service Type', 'Time', 'Duration', 'Lead Score', 'Status', 'Urgency', 'Address', 'Summary'];
    const rows = calls.map(c => [
      `"${c.id}"`,
      `"${c.callerName.replace(/"/g, '""')}"`,
      `"${c.callerPhone}"`,
      `"${c.serviceType}"`,
      `"${c.time}"`,
      `"${c.duration}"`,
      `"${c.leadScore ?? ''}"`,
      `"${c.status}"`,
      `"${c.urgency}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      `"${(c.summary || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `homeserve-calls-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2500);
  };

  const stats = {
    total: calls.length,
    completed: calls.filter(c => c.status === 'completed').length,
    emergency: calls.filter(c => c.status === 'emergency').length,
    missed: calls.filter(c => c.status === 'missed').length,
  };

  return (
    <div className="page-content">
      {/* Mini Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Calls', value: stats.total, icon: <Phone size={15} />, color: 'var(--accent-blue)', bg: 'rgba(59,130,246,0.15)', filter: 'all' },
          { label: 'Completed', value: stats.completed, icon: <CheckCircle size={15} />, color: 'var(--accent-emerald)', bg: 'rgba(16,185,129,0.15)', filter: 'completed' },
          { label: 'Emergencies', value: stats.emergency, icon: <AlertTriangle size={15} />, color: 'var(--accent-rose)', bg: 'rgba(244,63,94,0.15)', filter: 'emergency' },
          { label: 'Missed', value: stats.missed, icon: <Clock size={15} />, color: 'var(--accent-amber)', bg: 'rgba(245,158,11,0.15)', filter: 'missed' },
        ].map(s => (
          <div
            key={s.label}
            className="stat-card"
            style={{ padding: 16, cursor: 'pointer', borderColor: filter === s.filter ? 'var(--border-active)' : undefined }}
            onClick={() => setFilter(s.filter)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</span>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
            </div>
            <div style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ width: 280 }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              id="call-search-input"
              placeholder="Search calls, names, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'completed', 'emergency', 'missed', 'scheduled'].map(f => (
              <button
                key={f}
                id={`filter-${f}`}
                className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <button
              className="btn btn-primary btn-sm"
              id="btn-simulate-call"
              onClick={() => setIsSimulateOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Zap size={13} /> Simulate Inbound Call
            </button>
            <button
              className="btn btn-secondary btn-sm"
              id="btn-export-calls"
              onClick={handleExportCsv}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {exported ? (
                <>
                  <Check size={13} color="var(--accent-emerald)" />
                  <span style={{ color: 'var(--accent-emerald)' }}>Exported!</span>
                </>
              ) : (
                <>
                  <Download size={13} /> Export CSV
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Calls Table */}
      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Caller</th>
              <th>Phone</th>
              <th>Service Type</th>
              <th>Time</th>
              <th>Duration</th>
              <th>Lead Score</th>
              <th>Status</th>
              <th>SMS</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {calls.map((call, i) => (
              <tr key={call.id} onClick={() => setSelectedCall(call)}>
                <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 12 }}>{i + 1}</td>
                <td className="td-primary">{call.callerName}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{call.callerPhone}</td>
                <td>
                  <span style={{
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                    borderRadius: 6, padding: '3px 9px', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500
                  }}>
                    {call.serviceType}
                  </span>
                </td>
                <td>{call.time}</td>
                <td><span className="font-mono">{call.duration || '—'}</span></td>
                <td>
                  {call.leadScore != null ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-bar" style={{ width: 48 }}>
                        <div className="progress-fill" style={{ width: `${call.leadScore}%` }} />
                      </div>
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        color: call.leadScore >= 85 ? 'var(--accent-emerald)' : call.leadScore >= 65 ? 'var(--accent-amber)' : 'var(--text-muted)'
                      }}>{call.leadScore}</span>
                    </div>
                  ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                </td>
                <td>
                  <span className={`badge ${call.status}`}>
                    {call.status === 'emergency' && <AlertTriangle size={10} />}
                    {call.status === 'completed' && <CheckCircle size={10} />}
                    {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                  </span>
                </td>
                <td>
                  <span className={`badge ${call.smseSent ? 'completed' : 'pending'}`}>
                    <MessageSquare size={9} />
                    {call.smseSent ? 'Sent' : 'Pending'}
                  </span>
                </td>
                <td onClick={e => e.stopPropagation()}>
                  <button
                    className="btn btn-ghost btn-xs"
                    id={`view-call-${call.id}`}
                    onClick={() => setSelectedCall(call)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    View <ArrowUpRight size={11} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {calls.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-icon"><Phone size={22} /></div>
            <div className="empty-title">No calls found</div>
            <div className="empty-desc">Try adjusting your search or filter criteria</div>
          </div>
        )}
      </div>

      {selectedCall && <CallDetailModal call={selectedCall} onClose={() => setSelectedCall(null)} />}

      {isSimulateOpen && (
        <SimulateCallModal
          onClose={() => setIsSimulateOpen(false)}
          onCallSimulated={(newCall) => {
            fetchCallsList();
            if (newCall) setSelectedCall(newCall);
          }}
        />
      )}
    </div>
  );
};

export default CallsPage;
