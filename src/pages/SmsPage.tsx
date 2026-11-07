import React, { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle, Clock, Zap, Edit3, Plus, Send, Star, DollarSign, Bell, PhoneOff, Trash2, X } from 'lucide-react';
import { getSmsTemplates, updateSmsTemplate, createSmsTemplate, deleteSmsTemplate, sendSms } from '../api/client';
import type { SmsTemplate } from '../data/mockData';

const triggerIcons: Record<string, React.ReactNode> = {
  'On booking created': <CheckCircle size={13} />,
  'After call ends': <PhoneOff size={13} />,
  '2h after job marked complete': <Star size={13} />,
  'Day 3 overdue (manual)': <DollarSign size={13} />,
  'On missed call event': <Bell size={13} />,
  '24h before appointment': <Clock size={13} />,
};

const EditTemplateModal: React.FC<{ template: SmsTemplate; onClose: () => void; onSave: (newContent: string) => void }> = ({ template, onClose, onSave }) => {
  const [content, setContent] = useState(template.content);
  const [testSent, setTestSent] = useState(false);
  const variables = ['{{name}}', '{{service}}', '{{date}}', '{{time}}', '{{address}}', '{{phone}}', '{{tech}}', '{{amount}}', '{{payment_link}}', '{{review_link}}', '{{invoice_id}}', '{{score}}', '{{urgency}}'];

  const handleTestSms = async () => {
    try {
      await sendSms('+1 (512) 800-1234', content, template.id);
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } catch (err) {
      console.error('Failed to send test sms:', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 620 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Edit Template: {template.name}</div>
          <button className="icon-btn" id="close-sms-modal" onClick={onClose}>✕</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6, fontWeight: 600 }}>Trigger</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
            {triggerIcons[template.trigger] || <Zap size={13} />}
            {template.trigger}
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Message Body</label>
          <textarea
            id="sms-template-body"
            className="input-field"
            style={{ minHeight: 120, fontFamily: 'monospace', fontSize: 13 }}
            value={content}
            onChange={e => setContent(e.target.value)}
          />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
            {content.length} characters · Est. {Math.ceil(content.length / 160)} SMS segment{Math.ceil(content.length / 160) !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Variable chips */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8, fontWeight: 600 }}>Available Variables</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {variables.map(v => (
              <button
                key={v}
                className="btn btn-secondary btn-xs"
                id={`var-${v.replace(/[{}]/g, '')}`}
                style={{ fontFamily: 'monospace', cursor: 'copy' }}
                onClick={() => setContent(c => c + v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8, fontWeight: 600 }}>Preview</div>
          <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
            borderRadius: 12, padding: 14, fontSize: 13, color: 'var(--text-secondary)',
            lineHeight: 1.7, fontFamily: 'monospace', borderLeft: '3px solid var(--accent-cyan)'
          }}>
            {content
              .replace('{{name}}', 'John Smith')
              .replace('{{service}}', 'HVAC')
              .replace('{{date}}', 'Thursday, Oct 19')
              .replace('{{time}}', '2:00 PM')
              .replace('{{tech}}', 'Jake Torres')
              .replace('{{address}}', '1102 Ridgeline Blvd')
              .replace('{{amount}}', '850.00')
              .replace('{{score}}', '88')
              .replace('{{urgency}}', 'Standard')
              .replace('{{review_link}}', 'g.page/homeserve-review')
              .replace('{{payment_link}}', 'pay.homeserve.com/inv123')
              .replace('{{invoice_id}}', 'INV-10234')
              .replace('{{phone}}', '+1 (737) 205-9981')}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
          <button className="btn btn-primary" id="btn-save-template" style={{ flex: 1 }} onClick={() => onSave(content)}>
            <CheckCircle size={13} /> Save Template
          </button>
          <button className="btn btn-secondary" id="btn-test-sms" onClick={handleTestSms}>
            <Send size={13} /> {testSent ? 'Sent!' : 'Send Test'}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const NewTemplateModal: React.FC<{
  onClose: () => void;
  onCreated: () => void;
}> = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('After call ends');
  const [content, setContent] = useState('Hi {{name}}! Thank you for contacting HomeServe. We will be in touch shortly.');
  const [submitting, setSubmitting] = useState(false);
  const variables = ['{{name}}', '{{service}}', '{{date}}', '{{time}}', '{{address}}', '{{phone}}', '{{tech}}', '{{amount}}', '{{payment_link}}', '{{review_link}}'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !content) return;
    setSubmitting(true);
    try {
      await createSmsTemplate({
        name,
        trigger,
        content,
        active: true,
        sentCount: 0,
      });
      onCreated();
      onClose();
    } catch (err) {
      console.error('Failed to create template:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 620 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Create New SMS Template</div>
          <button className="icon-btn" onClick={onClose}><X size={15} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div className="input-group">
              <label className="input-label">Template Name</label>
              <input
                className="input-field"
                required
                placeholder="e.g. 24h Satisfaction Check"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Trigger Event</label>
              <select
                className="input-field"
                value={trigger}
                onChange={e => setTrigger(e.target.value)}
              >
                <option value="On booking created">On booking created</option>
                <option value="After call ends">After call ends</option>
                <option value="2h after job marked complete">2h after job marked complete</option>
                <option value="Day 3 overdue (manual)">Day 3 overdue (manual)</option>
                <option value="On missed call event">On missed call event</option>
                <option value="24h before appointment">24h before appointment</option>
              </select>
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 12 }}>
            <label className="input-label">Message Content</label>
            <textarea
              required
              className="input-field"
              style={{ minHeight: 110, fontFamily: 'monospace', fontSize: 13 }}
              value={content}
              onChange={e => setContent(e.target.value)}
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              {content.length} characters · Est. {Math.ceil(content.length / 160)} SMS segment{Math.ceil(content.length / 160) !== 1 ? 's' : ''}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6, fontWeight: 600 }}>Insert Variables</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {variables.map(v => (
                <button
                  type="button"
                  key={v}
                  className="btn btn-secondary btn-xs"
                  style={{ fontFamily: 'monospace' }}
                  onClick={() => setContent(c => c + ' ' + v)}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SmsPage: React.FC = () => {
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null);
  const [isNewTemplateOpen, setIsNewTemplateOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTemplatesList = async () => {
    try {
      const data = await getSmsTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load sms templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplatesList();
  }, []);

  const toggleTemplate = async (id: string) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;
    try {
      await updateSmsTemplate(id, { active: !template.active });
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));
    } catch (err) {
      console.error('Failed to toggle template:', err);
    }
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the "${name}" template?`)) return;
    try {
      await deleteSmsTemplate(id);
      fetchTemplatesList();
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  const handleSaveTemplateContent = async (newContent: string) => {
    if (!editingTemplate) return;
    try {
      await updateSmsTemplate(editingTemplate.id, { content: newContent });
      setEditingTemplate(null);
      fetchTemplatesList();
    } catch (err) {
      console.error('Failed to save template:', err);
    }
  };

  const totalSent = templates.reduce((a, t) => a + (t.sentCount || 0), 0);

  return (
    <div className="page-content">
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Active Templates', value: templates.filter(t => t.active).length, icon: <Zap size={15} />, color: 'cyan' },
          { label: 'Total SMS Sent', value: totalSent.toLocaleString(), icon: <Send size={15} />, color: 'blue' },
          { label: 'Delivery Rate', value: '99.7%', icon: <CheckCircle size={15} />, color: 'emerald' },
          { label: 'Reviews Collected', value: '47', icon: <Star size={15} />, color: 'amber' },
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

      {/* Workflow Diagram */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="section-title">Automation Workflow</div>
              <div className="section-sub">How SMS triggers chain from call to review</div>
            </div>
            <Zap size={16} color="var(--accent-cyan)" />
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: 4 }}>
            {[
              { label: 'Call Received', color: 'var(--accent-blue)', icon: '📞' },
              { label: 'AI Qualifies Lead', color: 'var(--accent-cyan)', icon: '🤖' },
              { label: 'Owner Notified', color: 'var(--accent-purple)', icon: '📲' },
              { label: 'Booking Confirmed', color: 'var(--accent-emerald)', icon: '📅' },
              { label: 'Reminder Sent', color: 'var(--accent-amber)', icon: '⏰' },
              { label: 'Job Complete', color: 'var(--accent-blue)', icon: '✅' },
              { label: 'Review Requested', color: 'var(--accent-rose)', icon: '⭐' },
            ].map((step, i, arr) => (
              <React.Fragment key={step.label}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0, minWidth: 100 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%', border: `2px solid ${step.color}`,
                    background: `${step.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                  }}>
                    {step.icon}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', fontWeight: 500, maxWidth: 80, lineHeight: 1.3 }}>
                    {step.label}
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ flex: 1, minWidth: 20, height: 2, background: `linear-gradient(90deg, ${step.color}60, ${arr[i+1].color}60)`, margin: '0 4px', marginBottom: 24 }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Templates */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div className="section-title">SMS Templates</div>
          <div className="section-sub">{templates.filter(t => t.active).length} of {templates.length} active</div>
        </div>
        <button
          className="btn btn-primary btn-sm"
          id="btn-new-template"
          onClick={() => setIsNewTemplateOpen(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
        >
          <Plus size={13} /> New Template
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {templates.map(template => (
          <div key={template.id} className="sms-template-card" id={`template-${template.id}`}>
            <div className="sms-template-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8, fontSize: 14,
                  background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {triggerIcons[template.trigger] || <MessageSquare size={13} />}
                </div>
                <span className="sms-template-name">{template.name}</span>
                {template.sentCount > 0 && (
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '2px 7px', borderRadius: 99, border: '1px solid var(--border-subtle)' }}>
                    {template.sentCount.toLocaleString()} sent
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="sms-template-trigger">{template.trigger}</span>
                <label className="toggle">
                  <input
                    type="checkbox"
                    id={`toggle-${template.id}`}
                    checked={template.active}
                    onChange={() => toggleTemplate(template.id)}
                  />
                  <span className="toggle-slider" />
                </label>
                <button
                  className="icon-btn"
                  id={`edit-${template.id}`}
                  style={{ width: 30, height: 30 }}
                  onClick={() => setEditingTemplate(template)}
                  title="Edit Template"
                >
                  <Edit3 size={13} />
                </button>
                <button
                  className="icon-btn"
                  style={{ width: 30, height: 30, color: 'var(--accent-rose)' }}
                  onClick={() => handleDeleteTemplate(template.id, template.name)}
                  title="Delete Template"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <div className="sms-template-preview">{template.content}</div>
          </div>
        ))}
        {templates.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
            No SMS templates found.
          </div>
        )}
      </div>

      {editingTemplate && (
        <EditTemplateModal
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSave={handleSaveTemplateContent}
        />
      )}

      {isNewTemplateOpen && (
        <NewTemplateModal
          onClose={() => setIsNewTemplateOpen(false)}
          onCreated={fetchTemplatesList}
        />
      )}
    </div>
  );
};

export default SmsPage;
