import type { CallLog, Lead, Booking, SmsTemplate } from '../data/mockData';
import {
  mockCalls,
  mockLeads,
  mockBookings,
  mockSmsTemplates,
  callVolumeData,
  serviceBreakdownData,
  revenueData
} from '../data/mockData';

const BASE_URL = 'http://localhost:8000/api';

// Auth API
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: AuthUser;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to login');
  }
  return res.json();
}

export async function registerUser(email: string, password: string, fullName: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, fullName }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to register account');
  }
  return res.json();
}

export async function getMe(token: string): Promise<AuthUser> {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Failed to get current user');
  return res.json();
}

export interface DashboardMetrics {
  stats: {
    totalCalls: number;
    completedCalls: number;
    emergencyCalls: number;
    missedCalls: number;
    totalLeads: number;
    hotLeads: number;
    totalBookings: number;
    bookedRevenue: number;
    bookingConversion: string;
  };
  serviceBreakdown: { name: string; value: number; color: string }[];
  callVolume: { day: string; calls: number; leads: number; bookings: number }[];
  revenueTrend: { month: string; revenue: number }[];
}

export interface AppSettings {
  voiceSettings: Record<string, any>;
  businessSettings: Record<string, any>;
  qualificationSettings: Record<string, any>;
}

// Calls API
export async function getCalls(filter?: string, search?: string): Promise<CallLog[]> {
  try {
    const params = new URLSearchParams();
    if (filter && filter !== 'all') params.append('status', filter);
    if (search) params.append('search', search);

    const res = await fetch(`${BASE_URL}/calls?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch calls');
    return await res.json();
  } catch (err) {
    console.warn('API unavailable, falling back to mock calls:', err);
    return mockCalls.filter(c => {
      const matchFilter = !filter || filter === 'all' || c.status === filter;
      const matchSearch = !search ||
        c.callerName.toLowerCase().includes(search.toLowerCase()) ||
        c.serviceType.toLowerCase().includes(search.toLowerCase()) ||
        c.callerPhone.includes(search);
      return matchFilter && matchSearch;
    });
  }
}

export async function createCall(call: Partial<CallLog>): Promise<CallLog> {
  const res = await fetch(`${BASE_URL}/calls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(call),
  });
  if (!res.ok) throw new Error('Failed to create call');
  return res.json();
}

// Leads API
export async function getLeads(tier?: string, status?: string, search?: string): Promise<Lead[]> {
  try {
    const params = new URLSearchParams();
    if (tier && tier !== 'all') params.append('tier', tier);
    if (status && status !== 'all') params.append('status', status);
    if (search) params.append('search', search);

    const res = await fetch(`${BASE_URL}/leads?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch leads');
    return await res.json();
  } catch (err) {
    console.warn('API unavailable, falling back to mock leads:', err);
    return mockLeads.filter(l => {
      const matchTier = !tier || tier === 'all' || l.tier === tier;
      const matchStatus = !status || status === 'all' || l.status === status;
      const matchSearch = !search ||
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.email.toLowerCase().includes(search.toLowerCase()) ||
        l.phone.includes(search);
      return matchTier && matchStatus && matchSearch;
    });
  }
}

export async function createLead(lead: Partial<Lead>): Promise<Lead> {
  const res = await fetch(`${BASE_URL}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lead),
  });
  if (!res.ok) throw new Error('Failed to create lead');
  return res.json();
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
  const res = await fetch(`${BASE_URL}/leads/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update lead');
  return res.json();
}

// Bookings API
export async function getBookings(status?: string): Promise<Booking[]> {
  try {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);

    const res = await fetch(`${BASE_URL}/bookings?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch bookings');
    return await res.json();
  } catch (err) {
    console.warn('API unavailable, falling back to mock bookings:', err);
    return mockBookings.filter(b => !status || status === 'all' || b.status === status);
  }
}

export async function createBooking(booking: Partial<Booking>): Promise<Booking> {
  const res = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking),
  });
  if (!res.ok) throw new Error('Failed to create booking');
  return res.json();
}

export async function updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
  const res = await fetch(`${BASE_URL}/bookings/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update booking');
  return res.json();
}

// SMS API
export async function getSmsTemplates(): Promise<SmsTemplate[]> {
  try {
    const res = await fetch(`${BASE_URL}/sms/templates`);
    if (!res.ok) throw new Error('Failed to fetch sms templates');
    return await res.json();
  } catch (err) {
    console.warn('API unavailable, falling back to mock templates:', err);
    return mockSmsTemplates;
  }
}

export async function createSmsTemplate(template: Partial<SmsTemplate>): Promise<SmsTemplate> {
  const res = await fetch(`${BASE_URL}/sms/templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(template),
  });
  if (!res.ok) throw new Error('Failed to create sms template');
  return res.json();
}

export async function deleteSmsTemplate(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/sms/templates/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete sms template');
}

export async function updateSmsTemplate(id: string, updates: Partial<SmsTemplate>): Promise<SmsTemplate> {
  const res = await fetch(`${BASE_URL}/sms/templates/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update sms template');
  return res.json();
}

export async function sendSms(to: string, message: string, templateId?: string) {
  const res = await fetch(`${BASE_URL}/sms/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, message, templateId }),
  });
  if (!res.ok) throw new Error('Failed to send sms');
  return res.json();
}

// Webhook & Voice AI API
export async function simulateIncomingCall(scenario: 'burst_pipe' | 'ac_repair' | 'roofing' = 'burst_pipe') {
  const res = await fetch(`${BASE_URL}/webhooks/simulate?scenario=${scenario}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to simulate call');
  return res.json();
}

export async function sendVoiceWebhook(payload: any) {
  const res = await fetch(`${BASE_URL}/webhooks/voice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to send voice webhook');
  return res.json();
}

// Settings API
export async function getSettings(): Promise<AppSettings> {
  try {
    const res = await fetch(`${BASE_URL}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return await res.json();
  } catch (err) {
    console.warn('API unavailable, returning default settings:', err);
    return {
      voiceSettings: {
        agentName: 'Sarah',
        voiceModel: 'nova',
        greeting: "Hi, you've reached HomeServe. I'm Sarah, your AI assistant. How can I help you today?",
        language: 'en-US',
        maxCallDuration: '15',
        enableTranscription: true,
        enableRecording: true,
        lowLatencyMode: true,
      },
      businessSettings: {
        businessName: 'Austin HomeServe',
        ownerPhone: '+1 (512) 800-1234',
        businessPhone: '+1 (512) 555-0100',
        timezone: 'America/Chicago',
        hoursStart: '08:00',
        hoursEnd: '18:00',
        emergencyAfterHours: true,
        calendarIntegration: 'google',
      },
      qualificationSettings: {
        minimumLeadScore: '60',
        emergencyKeywords: 'burst pipe, gas odor, flooding, smoke, fire, electrical fire, no heat, no AC',
        autoSchedule: true,
        requireAddress: true,
        requirePhone: true,
        routeEmergencies: true,
      }
    };
  }
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  const res = await fetch(`${BASE_URL}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to save settings');
  return res.json();
}

// Metrics API
export async function getMetrics(): Promise<DashboardMetrics> {
  try {
    const res = await fetch(`${BASE_URL}/metrics`);
    if (!res.ok) throw new Error('Failed to fetch metrics');
    return await res.json();
  } catch (err) {
    console.warn('API unavailable, falling back to mock metrics:', err);
    return {
      stats: {
        totalCalls: 47,
        completedCalls: 38,
        emergencyCalls: 4,
        missedCalls: 5,
        totalLeads: 38,
        hotLeads: 12,
        totalBookings: 18,
        bookedRevenue: 14250,
        bookingConversion: '38%',
      },
      serviceBreakdown: serviceBreakdownData,
      callVolume: callVolumeData,
      revenueTrend: revenueData,
    };
  }
}

