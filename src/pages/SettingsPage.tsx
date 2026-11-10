import React, { useState, useEffect } from 'react';
import { Mic, Globe, Key, Shield, Zap, Save, RefreshCw, CheckCircle, Copy, Check, X, Send, AlertCircle } from 'lucide-react';
import { getSettings, saveSettings, testTwilio } from '../api/client';

const TwilioModal: React.FC<{
  currentConfig?: any;
  onClose: () => void;
  onSaved: (cfg: any) => void;
}> = ({ currentConfig, onClose, onSaved }) => {
  const [accountSid, setAccountSid] = useState(currentConfig?.accountSid || '');
  const [authToken, setAuthToken] = useState(currentConfig?.authToken || '');
  const [fromPhone, setFromPhone] = useState(currentConfig?.fromPhone || '+1 (512) 555-0199');
  const [testPhone, setTestPhone] = useState('+1 (512) 800-1234');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testTwilio({
        accountSid,
        authToken,
        fromPhone,
        toPhone: testPhone,
        testMessage: 'Hello from HomeServe AI! Your Twilio integration is active and verified.'
      });
      if (res.status === 'failed') {
        setTestResult({ success: false, msg: res.error || 'Twilio test failed' });
      } else {
        setTestResult({
          success: true,
          msg: `SMS ${res.status === 'sent' ? 'Delivered via Twilio API' : 'Dispatched (Simulated)'}! SID: ${res.sid}`
        });
      }
    } catch (err: any) {
      setTestResult({ success: false, msg: err.message || 'Failed to dispatch test SMS' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSaved({ accountSid, authToken, fromPhone });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 540 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(244,63,94,0.15)', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
              TW
            </div>
            <div>
              <div className="modal-title">Twilio SMS Gateway Configuration</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Send automated emergency alerts & booking confirmations</div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={15} /></button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div className="input-group" style={{ marginBottom: 12 }}>
            <label className="input-label">Twilio Account SID</label>
            <input
              className="input-field"
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={accountSid}
              onChange={e => setAccountSid(e.target.value)}
            />
          </div>

          <div className="input-group" style={{ marginBottom: 12 }}>
            <label className="input-label">Twilio Auth Token</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••••••••••••••••••••••••••"
              value={authToken}
              onChange={e => setAuthToken(e.target.value)}
            />
          </div>

          <div className="input-group" style={{ marginBottom: 14 }}>
            <label className="input-label">Twilio Sender Phone Number</label>
            <input
              className="input-field"
              placeholder="+1 (512) 555-0199"
              value={fromPhone}
              onChange={e => setFromPhone(e.target.value)}
            />
          </div>

          {/* Test Dispatch Box */}
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              Test Live SMS Delivery
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input-field"
                placeholder="Recipient Phone (+1...)"
                value={testPhone}
                onChange={e => setTestPhone(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleTest}
                disabled={testing}
                style={{ flexShrink: 0, gap: 6 }}
              >
                <Send size={12} /> {testing ? 'Sending...' : 'Send Test'}
              </button>
            </div>
            {testResult && (
              <div style={{
                marginTop: 10,
                fontSize: 12,
                color: testResult.success ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                {testResult.success ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                <span>{testResult.msg}</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save Twilio Settings</button>
        </div>
      </div>
    </div>
  );
};

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('voice');
  const [copiedWebhook, setCopiedWebhook] = useState<string | null>(null);
  const [isTwilioModalOpen, setIsTwilioModalOpen] = useState(false);

  const [voiceSettings, setVoiceSettings] = useState({
    agentName: 'Sarah',
    voiceModel: 'nova',
    greeting: "Hi, you've reached HomeServe. I'm Sarah, your AI assistant. How can I help you today?",
    language: 'en-US',
    maxCallDuration: '15',
    enableTranscription: true,
    enableRecording: true,
    lowLatencyMode: true,
  });

  const [businessSettings, setBusinessSettings] = useState({
    businessName: 'Austin HomeServe',
    ownerPhone: '+1 (512) 800-1234',
    businessPhone: '+1 (512) 555-0100',
    timezone: 'America/Chicago',
    hoursStart: '08:00',
    hoursEnd: '18:00',
    emergencyAfterHours: true,
    calendarIntegration: 'google',
  });

  const [qualificationSettings, setQualificationSettings] = useState({
    minimumLeadScore: '60',
    emergencyKeywords: 'burst pipe, gas odor, flooding, smoke, fire, electrical fire, no heat, no AC',
    autoSchedule: true,
    requireAddress: true,
    requirePhone: true,
    routeEmergencies: true,
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSettings();
        if (data.voiceSettings) setVoiceSettings(prev => ({ ...prev, ...data.voiceSettings }));
        if (data.businessSettings) setBusinessSettings(prev => ({ ...prev, ...data.businessSettings }));
        if (data.qualificationSettings) setQualificationSettings(prev => ({ ...prev, ...data.qualificationSettings }));
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      await saveSettings({
        voiceSettings,
        businessSettings,
        qualificationSettings,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const tabs = [
    { id: 'voice', label: 'Voice & AI', icon: <Mic size={14} /> },
    { id: 'business', label: 'Business', icon: <Globe size={14} /> },
    { id: 'qualification', label: 'Qualification', icon: <Zap size={14} /> },
    { id: 'integrations', label: 'Integrations', icon: <Key size={14} /> },
    { id: 'security', label: 'Security', icon: <Shield size={14} /> },
  ];

  return (
    <div className="page-content">
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
        {/* Settings Nav */}
        <div className="card" style={{ padding: 12, alignSelf: 'start' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              id={`settings-tab-${tab.id}`}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 2 }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div>
          {activeTab === 'voice' && (
            <div className="card">
              <div className="card-header" style={{ paddingBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div className="stat-icon cyan"><Mic size={15} /></div>
                  <div>
                    <div className="section-title">Voice & AI Configuration</div>
                    <div className="section-sub">Configure the AI voice agent personality and behavior</div>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" htmlFor="agent-name">Agent Name</label>
                    <input id="agent-name" className="input-field" value={voiceSettings.agentName}
                      onChange={e => setVoiceSettings(p => ({ ...p, agentName: e.target.value }))} />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" htmlFor="voice-model">Voice Model</label>
                    <select id="voice-model" className="input-field select-field" value={voiceSettings.voiceModel}
                      onChange={e => setVoiceSettings(p => ({ ...p, voiceModel: e.target.value }))}>
                      <option value="nova">Nova (Female, Warm)</option>
                      <option value="alloy">Alloy (Neutral, Clear)</option>
                      <option value="echo">Echo (Male, Deep)</option>
                      <option value="shimmer">Shimmer (Female, Bright)</option>
                      <option value="onyx">Onyx (Male, Professional)</option>
                    </select>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="greeting-msg">Opening Greeting</label>
                  <textarea id="greeting-msg" className="input-field" value={voiceSettings.greeting}
                    onChange={e => setVoiceSettings(p => ({ ...p, greeting: e.target.value }))} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" htmlFor="language-select">Language</label>
                    <select id="language-select" className="input-field select-field" value={voiceSettings.language}
                      onChange={e => setVoiceSettings(p => ({ ...p, language: e.target.value }))}>
                      <option value="en-US">English (US)</option>
                      <option value="en-GB">English (UK)</option>
                      <option value="es-US">Spanish (US)</option>
                      <option value="fr-CA">French (CA)</option>
                    </select>
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" htmlFor="max-call-duration">Max Call Duration (min)</label>
                    <input id="max-call-duration" type="number" className="input-field" value={voiceSettings.maxCallDuration}
                      onChange={e => setVoiceSettings(p => ({ ...p, maxCallDuration: e.target.value }))} />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
                  {[
                    { key: 'enableTranscription', label: 'Live Transcription', desc: 'Store full transcript for every call' },
                    { key: 'enableRecording', label: 'Call Recording', desc: 'Record and archive all calls (GDPR compliant)' },
                    { key: 'lowLatencyMode', label: 'Low Latency Mode', desc: 'Prioritize response speed (<1200ms target)' },
                  ].map(item => (
                    <div key={item.key} className="toggle-row">
                      <div className="toggle-info">
                        <div className="toggle-name">{item.label}</div>
                        <div className="toggle-desc">{item.desc}</div>
                      </div>
                      <label className="toggle">
                        <input type="checkbox" id={`toggle-${item.key}`}
                          checked={voiceSettings[item.key as keyof typeof voiceSettings] as boolean}
                          onChange={e => setVoiceSettings(p => ({ ...p, [item.key]: e.target.checked }))} />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'business' && (
            <div className="card">
              <div className="card-header" style={{ paddingBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div className="stat-icon blue"><Globe size={15} /></div>
                  <div>
                    <div className="section-title">Business Configuration</div>
                    <div className="section-sub">Set your hours, contact info, and calendar sync</div>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" htmlFor="business-name">Business Name</label>
                    <input id="business-name" className="input-field" value={businessSettings.businessName}
                      onChange={e => setBusinessSettings(p => ({ ...p, businessName: e.target.value }))} />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" htmlFor="business-phone">AI Receptionist Number</label>
                    <input id="business-phone" className="input-field" value={businessSettings.businessPhone}
                      onChange={e => setBusinessSettings(p => ({ ...p, businessPhone: e.target.value }))} />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" htmlFor="owner-phone">Owner Mobile (Emergency)</label>
                    <input id="owner-phone" className="input-field" value={businessSettings.ownerPhone}
                      onChange={e => setBusinessSettings(p => ({ ...p, ownerPhone: e.target.value }))} />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" htmlFor="timezone">Timezone</label>
                    <select id="timezone" className="input-field select-field" value={businessSettings.timezone}
                      onChange={e => setBusinessSettings(p => ({ ...p, timezone: e.target.value }))}>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" htmlFor="hours-start">Business Hours Start</label>
                    <input id="hours-start" type="time" className="input-field" value={businessSettings.hoursStart}
                      onChange={e => setBusinessSettings(p => ({ ...p, hoursStart: e.target.value }))} />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" htmlFor="hours-end">Business Hours End</label>
                    <input id="hours-end" type="time" className="input-field" value={businessSettings.hoursEnd}
                      onChange={e => setBusinessSettings(p => ({ ...p, hoursEnd: e.target.value }))} />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
                  <div className="toggle-row">
                    <div className="toggle-info">
                      <div className="toggle-name">24/7 Emergency Routing</div>
                      <div className="toggle-desc">Route emergency calls to owner mobile after business hours</div>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" id="emergency-after-hours" checked={businessSettings.emergencyAfterHours}
                        onChange={e => setBusinessSettings(p => ({ ...p, emergencyAfterHours: e.target.checked }))} />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                </div>

                {/* Calendar Integration */}
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Calendar Integration</div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {[
                      { id: 'google', label: 'Google Calendar', icon: '🗓️' },
                      { id: 'jobber', label: 'Jobber', icon: '🔧' },
                      { id: 'housecall', label: 'Housecall Pro', icon: '🏠' },
                    ].map(cal => (
                      <div
                        key={cal.id}
                        id={`cal-${cal.id}`}
                        onClick={() => setBusinessSettings(p => ({ ...p, calendarIntegration: cal.id }))}
                        style={{
                          flex: 1, padding: '12px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                          border: `2px solid ${businessSettings.calendarIntegration === cal.id ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                          background: businessSettings.calendarIntegration === cal.id ? 'rgba(59,130,246,0.08)' : 'var(--bg-elevated)',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ fontSize: 22, marginBottom: 6 }}>{cal.icon}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: businessSettings.calendarIntegration === cal.id ? 'var(--accent-blue)' : 'var(--text-secondary)' }}>{cal.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'qualification' && (
            <div className="card">
              <div className="card-header" style={{ paddingBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div className="stat-icon purple"><Zap size={15} /></div>
                  <div>
                    <div className="section-title">Lead Qualification Engine</div>
                    <div className="section-sub">Configure AI scoring rules and emergency detection</div>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="input-group">
                  <label className="input-label" htmlFor="min-lead-score">Minimum Lead Score for Scheduling</label>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <input id="min-lead-score" type="range" min="0" max="100" value={qualificationSettings.minimumLeadScore}
                      onChange={e => setQualificationSettings(p => ({ ...p, minimumLeadScore: e.target.value }))}
                      style={{ flex: 1, accentColor: 'var(--accent-blue)' }} />
                    <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: 'var(--accent-blue)', width: 40, textAlign: 'right' }}>
                      {qualificationSettings.minimumLeadScore}
                    </span>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="emergency-keywords">Emergency Detection Keywords</label>
                  <textarea id="emergency-keywords" className="input-field" style={{ minHeight: 80 }}
                    value={qualificationSettings.emergencyKeywords}
                    onChange={e => setQualificationSettings(p => ({ ...p, emergencyKeywords: e.target.value }))} />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
                    Comma-separated keywords that trigger immediate owner call transfer
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
                  {[
                    { key: 'autoSchedule', label: 'Auto-Schedule Qualified Leads', desc: 'Automatically offer time slots to qualified leads during the call' },
                    { key: 'requireAddress', label: 'Require Job Address', desc: 'Always collect the job site address during intake' },
                    { key: 'requirePhone', label: 'Require Callback Number', desc: 'Confirm caller phone number at start of call' },
                    { key: 'routeEmergencies', label: 'Auto-Route Emergencies', desc: 'Immediately transfer emergency calls to owner mobile' },
                  ].map(item => (
                    <div key={item.key} className="toggle-row">
                      <div className="toggle-info">
                        <div className="toggle-name">{item.label}</div>
                        <div className="toggle-desc">{item.desc}</div>
                      </div>
                      <label className="toggle">
                        <input type="checkbox" id={`qual-${item.key}`}
                          checked={qualificationSettings[item.key as keyof typeof qualificationSettings] as boolean}
                          onChange={e => setQualificationSettings(p => ({ ...p, [item.key]: e.target.checked }))} />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="card">
              <div className="card-header" style={{ paddingBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div className="stat-icon amber"><Key size={15} /></div>
                  <div>
                    <div className="section-title">API & Webhook Integrations</div>
                    <div className="section-sub">Connect Voice AI assistants, telephony, and calendar webhooks</div>
                  </div>
                </div>
              </div>
              <div className="card-body">
                {/* Inbound Voice Webhook Box */}
                <div style={{
                  background: 'rgba(6,182,212,0.06)',
                  border: '1px solid rgba(6,182,212,0.25)',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--accent-cyan)', fontWeight: 700, fontSize: 13 }}>
                    <Zap size={15} /> Inbound Voice AI Webhook Endpoint
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                    Provide this webhook URL to your Voice AI provider (<strong>Vapi.ai</strong>, <strong>Retell AI</strong>, <strong>Twilio Voice</strong>, or <strong>Bland AI</strong>). Upon call completion, audio transcripts are automatically parsed, summarized with AI, scored for lead qualification, and logged to your dashboard.
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { label: 'Universal / Retell / Bland Webhook', url: 'http://localhost:8000/api/webhooks/voice', key: 'voice' },
                      { label: 'Native Vapi.ai Webhook', url: 'http://localhost:8000/api/webhooks/vapi', key: 'vapi' },
                    ].map(w => (
                      <div key={w.key} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '8px 12px' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 180, fontWeight: 600 }}>{w.label}</span>
                        <code style={{ flex: 1, fontFamily: 'monospace', fontSize: 12, color: 'var(--accent-cyan)' }}>{w.url}</code>
                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={() => {
                            navigator.clipboard.writeText(w.url);
                            setCopiedWebhook(w.key);
                            setTimeout(() => setCopiedWebhook(null), 2000);
                          }}
                          style={{ gap: 4 }}
                        >
                          {copiedWebhook === w.key ? <><Check size={11} color="var(--accent-emerald)" /> Copied</> : <><Copy size={11} /> Copy</>}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                {[
                  { name: 'Vapi AI', desc: 'Voice AI orchestration platform', color: 'var(--accent-blue)', connected: true, key: 'vapi_••••••••••••3f2a' },
                  { name: 'Twilio', desc: 'Telephony & SMS gateway', color: 'var(--accent-rose)', connected: true, key: 'AC••••••••••••••••7d8e' },
                  { name: 'OpenAI', desc: 'GPT-4o LLM backend', color: 'var(--accent-emerald)', connected: true, key: 'sk-proj-••••••••••••••••••••9x2k' },
                  { name: 'Google Calendar', desc: 'Live booking & scheduling', color: 'var(--accent-cyan)', connected: true, key: 'OAuth 2.0 — Connected' },
                  { name: 'Supabase', desc: 'PostgreSQL database & storage', color: 'var(--accent-purple)', connected: true, key: 'eyJhbGciOiJI••••••••••' },
                  { name: 'Housecall Pro', desc: 'Field service management', color: 'var(--accent-amber)', connected: false, key: 'Not configured' },
                ].map(integration => (
                  <div key={integration.name} style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0',
                    borderBottom: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: `${integration.color}18`, border: `1px solid ${integration.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: integration.color, fontSize: 12, fontWeight: 700, fontFamily: 'Space Grotesk'
                    }}>
                      {integration.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>{integration.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{integration.desc}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{integration.key}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className={`badge ${integration.connected ? 'completed' : 'pending'}`}>
                        {integration.connected ? <CheckCircle size={9} /> : null}
                        {integration.connected ? 'Connected' : 'Not Connected'}
                      </span>
                      <button
                        className="btn btn-secondary btn-xs"
                        id={`config-${integration.name.replace(/\s+/g, '-')}`}
                        onClick={() => integration.name === 'Twilio' && setIsTwilioModalOpen(true)}
                      >
                        {integration.connected ? 'Reconfigure' : 'Connect'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card">
              <div className="card-header" style={{ paddingBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div className="stat-icon emerald"><Shield size={15} /></div>
                  <div>
                    <div className="section-title">Security & Compliance</div>
                    <div className="section-sub">Data privacy settings and access controls</div>
                  </div>
                </div>
              </div>
              <div className="card-body">
                {[
                  { label: 'AES-256 Encryption at Rest', desc: 'All customer PII encrypted with AES-256', enabled: true },
                  { label: 'TLS 1.3 in Transit', desc: 'All API calls secured with TLS 1.3', enabled: true },
                  { label: 'GDPR Data Deletion on Request', desc: 'Automated deletion of customer data on request', enabled: true },
                  { label: 'Call Recording Consent Prompt', desc: 'Announce recording at start of every call', enabled: true },
                  { label: 'Two-Factor Authentication', desc: 'Require 2FA for dashboard login', enabled: false },
                  { label: 'Audit Logging', desc: 'Log all admin actions with timestamps', enabled: true },
                ].map(item => (
                  <div key={item.label} className="toggle-row">
                    <div className="toggle-info">
                      <div className="toggle-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {item.enabled && <CheckCircle size={12} color="var(--accent-emerald)" />}
                        {item.label}
                      </div>
                      <div className="toggle-desc">{item.desc}</div>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" defaultChecked={item.enabled} id={`sec-${item.label.replace(/\s+/g, '-')}`} />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                ))}

                <div style={{
                  marginTop: 20, padding: '14px', background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10,
                  fontSize: 13, color: 'var(--accent-emerald)', display: 'flex', gap: 10, alignItems: 'center'
                }}>
                  <CheckCircle size={16} />
                  <span>System is compliant with TCPA, GDPR, and CCPA regulations.</span>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button className="btn btn-secondary" id="btn-reset-settings">
              <RefreshCw size={13} /> Reset
            </button>
            <button className="btn btn-primary" id="btn-save-settings" onClick={handleSave}>
              {saved ? <><CheckCircle size={13} /> Saved!</> : <><Save size={13} /> Save Changes</>}
            </button>
          </div>
        </div>
      </div>

      {isTwilioModalOpen && (
        <TwilioModal
          currentConfig={(businessSettings as any).twilioSettings}
          onClose={() => setIsTwilioModalOpen(false)}
          onSaved={cfg => {
            const updated = { ...businessSettings, twilioSettings: cfg };
            setBusinessSettings(updated as any);
            saveSettings({ voiceSettings, businessSettings: updated as any, qualificationSettings });
          }}
        />
      )}
    </div>
  );
};

export default SettingsPage;
