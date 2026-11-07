import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Phone, Users, Calendar, DollarSign,
  AlertTriangle, PhoneCall, Clock, Zap, ArrowRight,
  MessageSquare, Star, BarChart2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { getMetrics, getCalls, type DashboardMetrics } from '../api/client';
import { CallDetailModal } from '../components/CallDetailModal';
import type { CallLog } from '../data/mockData';
import { useWebSocket } from '../context/WebSocketContext';

const StatCard: React.FC<{
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
  iconClass: string;
  cardClass?: string;
}> = ({ label, value, change, positive, icon, iconClass, cardClass = '' }) => (
  <div className={`stat-card ${cardClass}`}>
    <div className="stat-card-top">
      <span className="stat-label">{label}</span>
      <div className={`stat-icon ${iconClass}`}>{icon}</div>
    </div>
    <div className="stat-value">{value}</div>
    <div className={`stat-change ${positive ? 'pos' : 'neg'}`}>
      {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {change}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
        borderRadius: '10px', padding: '10px 14px', fontSize: '12px'
      }}>
        <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 6 }}>{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} style={{ color: p.color, display: 'flex', gap: 8 }}>
            <span style={{ color: 'var(--text-muted)' }}>{p.name}:</span>
            <span style={{ fontWeight: 600 }}>{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const DashboardPage: React.FC = () => {
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { subscribe } = useWebSocket();
  const [activeEmergency, setActiveEmergency] = useState<{ name: string; address: string; summary: string } | null>({
    name: 'Emily Rosenberg',
    address: '4821 Maple Creek Dr',
    summary: 'Burst pipe detected at 4821 Maple Creek Dr. Owner transfer in progress.'
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedCalls, fetchedMetrics] = await Promise.all([
          getCalls(),
          getMetrics(),
        ]);
        setCalls(fetchedCalls);
        setMetrics(fetchedMetrics);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribe((payload) => {
      if (payload.type === 'NEW_CALL') {
        const newCall = payload.data.call;
        setCalls(prev => [newCall, ...prev.filter(c => c.id !== newCall.id)]);
        setMetrics(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            stats: {
              ...prev.stats,
              totalCalls: (prev.stats.totalCalls || 0) + 1,
              totalLeads: payload.data.lead ? (prev.stats.totalLeads || 0) + 1 : prev.stats.totalLeads,
            }
          };
        });

        if (payload.data.isEmergency || newCall.urgency === 'emergency') {
          setActiveEmergency({
            name: newCall.callerName,
            address: newCall.address,
            summary: newCall.summary || 'Emergency call routed to owner.'
          });
        }
      } else if (payload.type === 'NEW_BOOKING') {
        const booking = payload.data;
        setMetrics(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            stats: {
              ...prev.stats,
              totalBookings: (prev.stats.totalBookings || 0) + 1,
              bookedRevenue: (prev.stats.bookedRevenue || 0) + (booking.estimatedValue || 0),
            }
          };
        });
      }
    });

    return () => unsubscribe();
  }, [subscribe]);

  const stats = metrics?.stats || {
    totalCalls: 47,
    totalLeads: 23,
    totalBookings: 18,
    bookedRevenue: 12400,
    bookingConversion: '38%',
  };

  const callVolumeData = metrics?.callVolume || [];
  const serviceBreakdownData = metrics?.serviceBreakdown || [];

  const activityItems = [
    { text: <><strong>Emily Rosenberg</strong> — Emergency call routed to owner</>, time: '2 min ago', color: 'var(--accent-rose)' },
    { text: <><strong>David Chen</strong> — Booked HVAC inspection for Thu 2pm</>, time: '14 min ago', color: 'var(--accent-emerald)' },
    { text: <><strong>SMS sent</strong> — Booking confirmation to David Chen</>, time: '15 min ago', color: 'var(--accent-cyan)' },
    { text: <><strong>Missed call</strong> — Auto SMS sent to +1 (512) 334-7721</>, time: '27 min ago', color: 'var(--accent-amber)' },
    { text: <><strong>Sarah Mitchell</strong> — Roofing estimate scheduled for Sat</>, time: '42 min ago', color: 'var(--accent-blue)' },
    { text: <><strong>Review request</strong> — Sent to Robert Walters (yesterday's job)</>, time: '1 hr ago', color: 'var(--accent-purple)' },
  ];

  return (
    <div className="page-content">
      {/* Emergency Banner */}
      {activeEmergency && (
        <div className="emergency-banner">
          <AlertTriangle size={22} className="emergency-icon" />
          <div className="emergency-text">
            <div className="em-title">⚡ Active Emergency — {activeEmergency.name}</div>
            <div className="em-desc">{activeEmergency.summary} ({activeEmergency.address})</div>
          </div>
          <button className="btn btn-danger btn-sm" style={{ marginLeft: 'auto', flexShrink: 0 }}>
            <PhoneCall size={13} /> Handle Now
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          label="Total Calls Today"
          value={String(stats.totalCalls)}
          change="+5% vs yesterday"
          positive={true}
          icon={<Phone size={16} />}
          iconClass="blue"
        />
        <StatCard
          label="Active Leads"
          value={String(stats.totalLeads)}
          change="4 new today"
          positive={true}
          icon={<Users size={16} />}
          iconClass="cyan"
          cardClass="card-cyan"
        />
        <StatCard
          label="Bookings This Week"
          value={String(stats.totalBookings)}
          change="5 confirmed"
          positive={true}
          icon={<Calendar size={16} />}
          iconClass="purple"
          cardClass="card-purple"
        />
        <StatCard
          label="Revenue Pipeline"
          value={`$${stats.bookedRevenue.toLocaleString()}`}
          change="+18% growth"
          positive={true}
          icon={<DollarSign size={16} />}
          iconClass="emerald"
          cardClass="card-emerald"
        />
      </div>

      {/* Charts Row */}
      <div className="grid-2-3" style={{ marginBottom: 24 }}>
        {/* Call Volume Chart */}
        <div className="card">
          <div className="card-header">
            <div className="section-header" style={{ marginBottom: 0 }}>
              <div>
                <div className="section-title">Call Volume (7 days)</div>
                <div className="section-sub">Calls, leads & bookings by day</div>
              </div>
              <BarChart2 size={16} color="var(--text-muted)" />
            </div>
          </div>
          <div className="card-body" style={{ paddingTop: 16 }}>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={callVolumeData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gradCalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="calls" name="Calls" stroke="#3B82F6" fill="url(#gradCalls)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="leads" name="Leads" stroke="#06B6D4" fill="url(#gradLeads)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Breakdown */}
        <div className="card">
          <div className="card-header">
            <div className="section-title">Service Breakdown</div>
            <div className="section-sub" style={{ marginTop: 2, fontSize: 12, color: 'var(--text-secondary)' }}>By call type</div>
          </div>
          <div className="card-body" style={{ paddingTop: 8 }}>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={serviceBreakdownData} cx="50%" cy="50%" innerRadius={48} outerRadius={70} paddingAngle={3} dataKey="value">
                  {serviceBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, '']} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px' }}>
              {serviceBreakdownData.map(s => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                  <span style={{ color: 'var(--text-muted)' }}>{s.name} <strong style={{ color: 'var(--text-secondary)' }}>{s.value}%</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        {/* Recent Calls Table */}
        <div className="card">
          <div className="card-header" style={{ paddingBottom: 0 }}>
            <div className="section-header">
              <div>
                <div className="section-title">Recent Calls</div>
                <div className="section-sub">Live AI-handled inbound calls</div>
              </div>
              <button className="btn btn-ghost btn-sm" style={{ gap: 4 }}>
                View All <ArrowRight size={12} />
              </button>
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Caller</th>
                <th>Service</th>
                <th>Time</th>
                <th>Duration</th>
                <th>Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {calls.slice(0, 5).map(call => (
                <tr key={call.id} onClick={() => setSelectedCall(call)}>
                  <td className="td-primary">{call.callerName}</td>
                  <td>{call.serviceType}</td>
                  <td>{call.time}</td>
                  <td><span className="font-mono">{call.duration || '—'}</span></td>
                  <td>
                    {call.leadScore != null ? (
                      <span style={{
                        color: call.leadScore >= 85 ? 'var(--accent-emerald)' : call.leadScore >= 65 ? 'var(--accent-amber)' : 'var(--text-muted)',
                        fontWeight: 700, fontSize: 13
                      }}>
                        {call.leadScore}
                      </span>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td>
                    <span className={`badge ${call.status}`}>
                      {call.status === 'emergency' && <AlertTriangle size={10} />}
                      {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
              {calls.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No recent calls
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Activity Feed */}
        <div className="card">
          <div className="card-header">
            <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={15} color="var(--accent-cyan)" />
              Live Activity
            </div>
          </div>
          <div className="card-body" style={{ paddingTop: 12 }}>
            {activityItems.map((item, i) => (
              <div key={i} className="activity-item">
                <div className="activity-dot" style={{ background: item.color }} />
                <div className="activity-content">
                  <div className="activity-text">{item.text}</div>
                  <div className="activity-time"><Clock size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats Bottom */}
      <div className="grid-3" style={{ marginTop: 24 }}>
        {[
          { label: 'AI Qualification Rate', value: '91%', desc: 'Calls fully processed by AI', icon: <Zap size={16} />, color: 'var(--accent-cyan)' },
          { label: 'Avg Lead Score', value: '78', desc: 'Across all qualified leads today', icon: <Star size={16} />, color: 'var(--accent-amber)' },
          { label: 'SMS Sent Today', value: '54', desc: '100% delivery rate', icon: <MessageSquare size={16} />, color: 'var(--accent-purple)' },
        ].map((item, i) => (
          <div key={i} className="stat-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `${item.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
                {item.icon}
              </div>
              <span className="stat-label">{item.label}</span>
            </div>
            <div style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{item.desc}</div>
          </div>
        ))}
      </div>

      {selectedCall && (
        <CallDetailModal call={selectedCall} onClose={() => setSelectedCall(null)} />
      )}
    </div>
  );
};

export default DashboardPage;
