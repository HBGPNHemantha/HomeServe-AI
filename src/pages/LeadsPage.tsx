import React, { useState, useEffect } from 'react';
import { Users, Phone, DollarSign, Search, ArrowUpRight, Flame, Star, Mail, MapPin, FileText, Plus, X } from 'lucide-react';
import { getLeads, updateLead, createLead } from '../api/client';
import type { Lead, ServiceType, LeadTier } from '../data/mockData';
import { useWebSocket } from '../context/WebSocketContext';

const ScoreRing: React.FC<{ score: number; tier: string }> = ({ score, tier }) => {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;
  const color = tier === 'hot' ? '#F43F5E' : tier === 'warm' ? '#F59E0B' : tier === 'cold' ? '#8B5CF6' : '#06B6D4';

  return (
    <svg width="44" height="44" viewBox="0 0 44 44" style={{ flexShrink: 0 }}>
      <circle cx="22" cy="22" r={radius} fill="none" stroke="var(--bg-elevated)" strokeWidth="4" />
      <circle
        cx="22" cy="22" r={radius} fill="none"
        stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
        transform="rotate(-90 22 22)"
      />
      <text x="22" y="27" textAnchor="middle" fill="white" fontSize="10" fontWeight="700" fontFamily="Space Grotesk">{score}</text>
    </svg>
  );
};

const LeadCard: React.FC<{ lead: Lead; onClick: () => void }> = ({ lead, onClick }) => (
  <div
    className="card"
    style={{ padding: 18, cursor: 'pointer', transition: 'all 0.2s' }}
    onClick={onClick}
    id={`lead-card-${lead.id}`}
    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-active)')}
    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
      <ScoreRing score={lead.score} tier={lead.tier} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name}</span>
          <span className={`badge ${lead.tier}`} style={{ flexShrink: 0 }}>
            {lead.tier === 'hot' && <Flame size={9} />}
            {lead.tier.charAt(0).toUpperCase() + lead.tier.slice(1)}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{lead.phone}</div>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
      <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 10px' }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Service</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{lead.serviceType}</div>
      </div>
      <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 10px' }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Est. Value</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-emerald)' }}>${lead.estimatedValue.toLocaleString()}</div>
      </div>
    </div>

    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
      <MapPin size={11} /> {lead.address}
    </div>

    <div style={{
      fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6,
      background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 10px', borderLeft: '2px solid var(--accent-blue)'
    }}>
      {lead.notes}
    </div>

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
      <span className={`badge ${lead.status}`}>{lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}</span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lead.lastContact}</span>
    </div>
  </div>
);

const LeadDetailModal: React.FC<{
  lead: Lead;
  onClose: () => void;
  onLeadUpdated: (updated: Lead) => void;
}> = ({ lead, onClose, onLeadUpdated }) => {
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const handleCall = () => {
    window.location.href = `tel:${lead.phone}`;
  };

  const handleEmail = () => {
    window.location.href = `mailto:${lead.email}`;
  };

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    const updatedNotes = lead.notes
      ? `${lead.notes}\n[User Note]: ${noteText.trim()}`
      : `[User Note]: ${noteText.trim()}`;
    try {
      const updated = await updateLead(lead.id, { notes: updatedNotes });
      onLeadUpdated(updated);
      setNoteText('');
      setShowAddNote(false);
    } catch (err) {
      console.error('Failed to update note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ScoreRing score={lead.score} tier={lead.tier} />
            <div>
              <div className="modal-title">{lead.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{lead.serviceType} · {lead.address}</div>
            </div>
          </div>
          <button className="icon-btn" id="close-lead-modal" onClick={onClose} style={{ alignSelf: 'flex-start' }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 18 }}>
          {[
            { label: 'Phone', value: lead.phone, icon: <Phone size={13} /> },
            { label: 'Email', value: lead.email, icon: <Mail size={13} /> },
            { label: 'Est. Value', value: `$${lead.estimatedValue.toLocaleString()}`, icon: <DollarSign size={13} /> },
            { label: 'Last Contact', value: lead.lastContact, icon: <Star size={13} /> },
          ].map(item => (
            <div key={item.label} style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>
                {item.icon} {item.label}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Qualification pipeline */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>Qualification Pipeline</div>
          <div className="pipeline-steps">
            {[
              { label: 'Intake', done: true },
              { label: 'Qualified', done: lead.status !== 'new' },
              { label: 'Scheduled', done: lead.status === 'scheduled' || lead.status === 'closed' },
              { label: 'Closed', done: lead.status === 'closed' },
            ].map((step, i) => (
              <div key={step.label} className={`pipeline-step ${!step.done ? 'inactive' : ''}`}>
                <div className="step-circle">{i + 1}</div>
                <div className="step-label">{step.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Notes</div>
            <button
              className="btn btn-ghost btn-xs"
              style={{ fontSize: 11, gap: 4 }}
              onClick={() => setShowAddNote(!showAddNote)}
            >
              <FileText size={11} /> {showAddNote ? 'Hide' : '+ Add Note'}
            </button>
          </div>

          <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
            borderLeft: '3px solid var(--accent-cyan)', borderRadius: 'var(--radius-sm)',
            padding: '12px 14px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7,
            whiteSpace: 'pre-line'
          }}>{lead.notes}</div>

          {showAddNote && (
            <div style={{ marginTop: 10, background: 'var(--bg-surface)', padding: 10, borderRadius: 8, border: '1px solid var(--border-default)' }}>
              <textarea
                className="input-field"
                style={{ minHeight: 60, fontSize: 12, marginBottom: 8 }}
                placeholder="Type your note here..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost btn-xs" onClick={() => setShowAddNote(false)}>Cancel</button>
                <button className="btn btn-primary btn-xs" onClick={handleSaveNote} disabled={savingNote}>
                  {savingNote ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
          <button className="btn btn-primary" id="btn-call-lead" style={{ flex: 1 }} onClick={handleCall}>
            <Phone size={13} /> Call Now ({lead.phone})
          </button>
          <button className="btn btn-secondary" id="btn-email-lead" onClick={handleEmail}>
            <Mail size={13} /> Email
          </button>
          <button className="btn btn-secondary" id="btn-notes-lead" onClick={() => setShowAddNote(true)}>
            <FileText size={13} /> Add Note
          </button>
        </div>
      </div>
    </div>
  );
};

const NewLeadModal: React.FC<{
  onClose: () => void;
  onCreated: () => void;
}> = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('Plumbing');
  const [address, setAddress] = useState('');
  const [tier, setTier] = useState<LeadTier>('warm');
  const [score, setScore] = useState('75');
  const [estimatedValue, setEstimatedValue] = useState('850');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    setSubmitting(true);
    try {
      await createLead({
        name,
        phone,
        email: email || `${name.toLowerCase().replace(/\s+/g, '')}@example.com`,
        serviceType,
        address: address || 'Austin, TX',
        tier,
        score: parseInt(score, 10) || 70,
        lastContact: 'Just now',
        estimatedValue: parseFloat(estimatedValue) || 500,
        notes: notes || 'Lead entered manually via dashboard.',
        status: 'qualified',
      });
      onCreated();
      onClose();
    } catch (err) {
      console.error('Failed to create lead:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Create New Lead</div>
          <button className="icon-btn" onClick={onClose}><X size={15} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div className="input-group">
              <label className="input-label">Lead Name</label>
              <input
                className="input-field"
                required
                placeholder="e.g. Michael Scott"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Phone</label>
              <input
                className="input-field"
                required
                placeholder="+1 (512) 555-0144"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div className="input-group">
              <label className="input-label">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="client@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Service Type</label>
              <select
                className="input-field"
                value={serviceType}
                onChange={e => setServiceType(e.target.value as ServiceType)}
              >
                <option value="Plumbing">Plumbing</option>
                <option value="HVAC">HVAC</option>
                <option value="Electrical">Electrical</option>
                <option value="Roofing">Roofing</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div className="input-group">
              <label className="input-label">Tier</label>
              <select
                className="input-field"
                value={tier}
                onChange={e => setTier(e.target.value as LeadTier)}
              >
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
                <option value="new">New</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Score (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="input-field"
                value={score}
                onChange={e => setScore(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Est. Value ($)</label>
              <input
                type="number"
                className="input-field"
                value={estimatedValue}
                onChange={e => setEstimatedValue(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 14 }}>
            <label className="input-label">Address</label>
            <input
              className="input-field"
              placeholder="e.g. 504 Lavaca St, Austin TX"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>

          <div className="input-group" style={{ marginBottom: 20 }}>
            <label className="input-label">Initial Notes</label>
            <textarea
              className="input-field"
              style={{ minHeight: 70 }}
              placeholder="Customer needs water heater replacement quote..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const { subscribe } = useWebSocket();

  const fetchLeadsList = async () => {
    try {
      const data = await getLeads(tierFilter, undefined, search);
      setLeads(data);
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadsList();
  }, [tierFilter, search]);

  useEffect(() => {
    const unsubscribe = subscribe((payload) => {
      if (payload.type === 'NEW_LEAD' || payload.type === 'UPDATE_LEAD' || payload.type === 'NEW_CALL') {
        fetchLeadsList();
      }
    });
    return () => unsubscribe();
  }, [subscribe]);

  const handleLeadUpdated = (updated: Lead) => {
    setSelectedLead(updated);
    fetchLeadsList();
  };

  const totalValue = leads.reduce((acc, l) => acc + l.estimatedValue, 0);

  return (
    <div className="page-content">
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Leads', value: leads.length, icon: <Users size={15} />, color: 'blue' },
          { label: 'Hot Leads', value: leads.filter(l => l.tier === 'hot').length, icon: <Flame size={15} />, color: 'rose' },
          { label: 'Pipeline Value', value: `$${totalValue.toLocaleString()}`, icon: <DollarSign size={15} />, color: 'emerald' },
          { label: 'Avg Score', value: leads.length ? Math.round(leads.reduce((a, l) => a + l.score, 0) / leads.length) : 0, icon: <Star size={15} />, color: 'amber' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</span>
              <div className={`stat-icon ${s.color}`}>{s.icon}</div>
            </div>
            <div style={{ fontFamily: 'Space Grotesk', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="search-bar">
            <Search size={14} color="var(--text-muted)" />
            <input id="lead-search" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'hot', 'warm', 'cold', 'new'].map(f => (
              <button key={f} id={`leads-filter-${f}`} className={`btn btn-sm ${tierFilter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTierFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary btn-sm"
              id="btn-create-lead"
              onClick={() => setIsNewLeadOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <Plus size={13} /> New Lead
            </button>
            <button className={`btn btn-sm ${view === 'grid' ? 'btn-primary' : 'btn-secondary'}`} id="btn-grid-view" onClick={() => setView('grid')}>Grid</button>
            <button className={`btn btn-sm ${view === 'table' ? 'btn-primary' : 'btn-secondary'}`} id="btn-table-view" onClick={() => setView('table')}>Table</button>
          </div>
        </div>
      </div>

      {/* Grid / Table */}
      {view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {leads.map(lead => (
            <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />
          ))}
          {leads.length === 0 && !loading && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
              No leads found.
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Score</th>
                <th>Name</th>
                <th>Service</th>
                <th>Tier</th>
                <th>Est. Value</th>
                <th>Status</th>
                <th>Last Contact</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead.id} onClick={() => setSelectedLead(lead)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-bar" style={{ width: 44 }}>
                        <div className="progress-fill" style={{ width: `${lead.score}%` }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: lead.tier === 'hot' ? 'var(--accent-rose)' : 'var(--accent-amber)' }}>{lead.score}</span>
                    </div>
                  </td>
                  <td className="td-primary">{lead.name}</td>
                  <td>{lead.serviceType}</td>
                  <td><span className={`badge ${lead.tier}`}>{lead.tier.charAt(0).toUpperCase() + lead.tier.slice(1)}</span></td>
                  <td style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>${lead.estimatedValue.toLocaleString()}</td>
                  <td><span className={`badge ${lead.status}`}>{lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}</span></td>
                  <td>{lead.lastContact}</td>
                  <td>
                    <button className="btn btn-ghost btn-xs" id={`lead-view-${lead.id}`} onClick={e => { e.stopPropagation(); setSelectedLead(lead); }}>
                      View <ArrowUpRight size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onLeadUpdated={handleLeadUpdated}
        />
      )}

      {isNewLeadOpen && (
        <NewLeadModal
          onClose={() => setIsNewLeadOpen(false)}
          onCreated={fetchLeadsList}
        />
      )}
    </div>
  );
};

export default LeadsPage;
