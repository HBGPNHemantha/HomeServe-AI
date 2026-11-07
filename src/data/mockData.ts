// Mock Data for HomeServe AI Dashboard

export type CallStatus = 'completed' | 'emergency' | 'missed' | 'transferred' | 'scheduled';
export type LeadTier = 'hot' | 'warm' | 'cold' | 'new';
export type ServiceType = 'Plumbing' | 'HVAC' | 'Electrical' | 'Roofing' | 'Cleaning' | 'Emergency';

export interface CallLog {
  id: string;
  callerName: string;
  callerPhone: string;
  serviceType: ServiceType;
  time: string;
  duration: string;
  status: CallStatus;
  leadScore: number | null;
  summary: string;
  address: string;
  urgency: 'standard' | 'emergency';
  transcriptSnippet: { speaker: 'AI' | 'Caller'; text: string }[];
  smseSent: boolean;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  serviceType: ServiceType;
  address: string;
  tier: LeadTier;
  score: number;
  lastContact: string;
  estimatedValue: number;
  notes: string;
  status: 'new' | 'qualified' | 'scheduled' | 'closed' | 'lost';
  callId: string;
}

export interface Booking {
  id: string;
  customerName: string;
  serviceType: ServiceType;
  date: string;
  time: string;
  address: string;
  phone: string;
  estimatedDuration: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  technicianAssigned: string | null;
  estimatedValue: number;
}

export interface SmsTemplate {
  id: string;
  name: string;
  trigger: string;
  content: string;
  active: boolean;
  sentCount: number;
}

export const mockCalls: CallLog[] = [
  {
    id: 'call-001',
    callerName: 'Emily Rosenberg',
    callerPhone: '+1 (512) 890-4412',
    serviceType: 'Plumbing',
    time: '14:32',
    duration: '5:48',
    status: 'emergency',
    leadScore: 96,
    summary: 'Burst pipe in kitchen causing active flooding. Caller confirmed water shutoff valve found. Emergency transfer attempted.',
    address: '4821 Maple Creek Dr, Austin TX 78723',
    urgency: 'emergency',
    transcriptSnippet: [
      { speaker: 'AI', text: 'Thank you for calling HomeServe. I\'m Sarah, your AI assistant. Can you tell me what\'s going on today?' },
      { speaker: 'Caller', text: 'There\'s water everywhere — the pipe under my kitchen sink just burst. It\'s flooding the cabinet.' },
      { speaker: 'AI', text: 'I understand, this sounds like an emergency. Have you been able to shut off the main water valve?' },
      { speaker: 'Caller', text: 'Yes I just did that but there\'s already water on the floor.' },
      { speaker: 'AI', text: 'Great thinking. I\'m connecting you directly with the owner right now. Your address on file — is it 4821 Maple Creek Drive?' },
    ],
    smseSent: true,
  },
  {
    id: 'call-002',
    callerName: 'David Chen',
    callerPhone: '+1 (737) 205-9981',
    serviceType: 'HVAC',
    time: '14:18',
    duration: '3:15',
    status: 'completed',
    leadScore: 88,
    summary: 'AC unit not cooling below 78°F. Unit is 7 years old. Booked for Thursday 2pm inspection slot.',
    address: '1102 Ridgeline Blvd, Austin TX 78741',
    urgency: 'standard',
    transcriptSnippet: [
      { speaker: 'AI', text: 'Hi! This is Sarah with HomeServe. How can I help you today?' },
      { speaker: 'Caller', text: 'Yeah my AC isn\'t cooling right. It\'s been running all day and it just can\'t get below 78.' },
      { speaker: 'AI', text: 'I\'m sorry to hear that — especially with this heat. How old is the unit, if you know?' },
      { speaker: 'Caller', text: 'About 7 years I think. We\'ve had it since we bought the house.' },
      { speaker: 'AI', text: 'Understood. I have Thursday at 2pm available for a diagnostic inspection. Does that work for you?' },
    ],
    smseSent: true,
  },
  {
    id: 'call-003',
    callerName: 'Unknown',
    callerPhone: '+1 (512) 334-7721',
    serviceType: 'Electrical',
    time: '13:55',
    duration: '0:00',
    status: 'missed',
    leadScore: null,
    summary: 'Call dropped before intake. SMS follow-up sent automatically.',
    address: 'Unknown',
    urgency: 'standard',
    transcriptSnippet: [],
    smseSent: true,
  },
  {
    id: 'call-004',
    callerName: 'Sarah Mitchell',
    callerPhone: '+1 (512) 441-6623',
    serviceType: 'Roofing',
    time: '13:30',
    duration: '4:22',
    status: 'completed',
    leadScore: 79,
    summary: 'Missing shingles after storm last week. No active leaking reported. Booked Saturday estimate.',
    address: '7753 Barton Springs Rd, Austin TX 78704',
    urgency: 'standard',
    transcriptSnippet: [
      { speaker: 'AI', text: 'HomeServe, this is Sarah. What can I help you with?' },
      { speaker: 'Caller', text: 'We had a bad storm last week and I noticed a few shingles are missing from the front.' },
      { speaker: 'AI', text: 'Oh no, sorry about that. Have you noticed any water intrusion inside the home yet?' },
      { speaker: 'Caller', text: 'Not yet, thank goodness. But I want to get it fixed before it rains again.' },
    ],
    smseSent: true,
  },
  {
    id: 'call-005',
    callerName: 'Marcus Johnson',
    callerPhone: '+1 (737) 992-0043',
    serviceType: 'Cleaning',
    time: '11:05',
    duration: '2:48',
    status: 'completed',
    leadScore: 71,
    summary: 'Deep clean for 4-bedroom home. Move-out situation. Booked for next Monday 9am.',
    address: '903 South Congress Ave, Austin TX 78704',
    urgency: 'standard',
    transcriptSnippet: [
      { speaker: 'AI', text: 'HomeServe, how can I assist you today?' },
      { speaker: 'Caller', text: 'Hi, I need a full deep clean. We\'re moving out of our place next week.' },
      { speaker: 'AI', text: 'Absolutely, I can get that scheduled. How many bedrooms and bathrooms in the property?' },
    ],
    smseSent: true,
  },
  {
    id: 'call-006',
    callerName: 'Lisa Tremblay',
    callerPhone: '+1 (512) 774-9921',
    serviceType: 'Plumbing',
    time: '10:12',
    duration: '3:55',
    status: 'scheduled',
    leadScore: 84,
    summary: 'Low water pressure throughout the house. Possible PRV issue. Appointment set for Wednesday 10am.',
    address: '2240 E Oltorf St, Austin TX 78741',
    urgency: 'standard',
    transcriptSnippet: [
      { speaker: 'AI', text: 'Hi, you\'ve reached HomeServe. I\'m Sarah. What\'s happening?' },
      { speaker: 'Caller', text: 'The water pressure in my house is really low everywhere. It\'s been like this for a few days.' },
      { speaker: 'AI', text: 'Got it. Is it low in one fixture or throughout the whole house?' },
      { speaker: 'Caller', text: 'Everywhere. Kitchen, bathrooms, all of it.' },
    ],
    smseSent: true,
  },
];

export const mockLeads: Lead[] = [
  {
    id: 'lead-001',
    name: 'Emily Rosenberg',
    phone: '+1 (512) 890-4412',
    email: 'emily.r@email.com',
    serviceType: 'Plumbing',
    address: '4821 Maple Creek Dr, Austin TX',
    tier: 'hot',
    score: 96,
    lastContact: '2 hours ago',
    estimatedValue: 1200,
    notes: 'Emergency burst pipe. High urgency. Pre-qualified for premium service.',
    status: 'qualified',
    callId: 'call-001',
  },
  {
    id: 'lead-002',
    name: 'David Chen',
    phone: '+1 (737) 205-9981',
    email: 'dchen@gmail.com',
    serviceType: 'HVAC',
    address: '1102 Ridgeline Blvd, Austin TX',
    tier: 'hot',
    score: 88,
    lastContact: '3 hours ago',
    estimatedValue: 850,
    notes: 'AC system 7 years old. Likely needs refrigerant + full diagnostic.',
    status: 'scheduled',
    callId: 'call-002',
  },
  {
    id: 'lead-003',
    name: 'Sarah Mitchell',
    phone: '+1 (512) 441-6623',
    email: 'sarahm@outlook.com',
    serviceType: 'Roofing',
    address: '7753 Barton Springs Rd, Austin TX',
    tier: 'warm',
    score: 79,
    lastContact: '4 hours ago',
    estimatedValue: 3400,
    notes: 'Storm damage. Multiple shingles missing. High ticket potential.',
    status: 'scheduled',
    callId: 'call-004',
  },
  {
    id: 'lead-004',
    name: 'Lisa Tremblay',
    phone: '+1 (512) 774-9921',
    email: 'lisa.t@yahoo.com',
    serviceType: 'Plumbing',
    address: '2240 E Oltorf St, Austin TX',
    tier: 'warm',
    score: 84,
    lastContact: '6 hours ago',
    estimatedValue: 650,
    notes: 'PRV replacement suspected. Property owner, likely to approve work.',
    status: 'scheduled',
    callId: 'call-006',
  },
  {
    id: 'lead-005',
    name: 'Marcus Johnson',
    phone: '+1 (737) 992-0043',
    email: 'marcusj@gmail.com',
    serviceType: 'Cleaning',
    address: '903 South Congress Ave, Austin TX',
    tier: 'warm',
    score: 71,
    lastContact: '5 hours ago',
    estimatedValue: 480,
    notes: 'Move-out clean. Mentioned potential recurring service if satisfied.',
    status: 'qualified',
    callId: 'call-005',
  },
  {
    id: 'lead-006',
    name: 'Brandon Okafor',
    phone: '+1 (512) 991-3300',
    email: 'bokafor@work.com',
    serviceType: 'Electrical',
    address: '6601 N Lamar Blvd, Austin TX',
    tier: 'cold',
    score: 42,
    lastContact: 'Yesterday',
    estimatedValue: 280,
    notes: 'Wanted a quote only. No urgency. May follow up.',
    status: 'new',
    callId: 'call-003',
  },
];

export const mockBookings: Booking[] = [
  {
    id: 'book-001',
    customerName: 'David Chen',
    serviceType: 'HVAC',
    date: '2026-10-19',
    time: '14:00',
    address: '1102 Ridgeline Blvd, Austin TX 78741',
    phone: '+1 (737) 205-9981',
    estimatedDuration: '2 hours',
    status: 'confirmed',
    technicianAssigned: 'Jake Torres',
    estimatedValue: 850,
  },
  {
    id: 'book-002',
    customerName: 'Lisa Tremblay',
    serviceType: 'Plumbing',
    date: '2026-10-21',
    time: '10:00',
    address: '2240 E Oltorf St, Austin TX 78741',
    phone: '+1 (512) 774-9921',
    estimatedDuration: '1.5 hours',
    status: 'confirmed',
    technicianAssigned: 'Mike Sanchez',
    estimatedValue: 650,
  },
  {
    id: 'book-003',
    customerName: 'Sarah Mitchell',
    serviceType: 'Roofing',
    date: '2026-10-18',
    time: '09:00',
    address: '7753 Barton Springs Rd, Austin TX 78704',
    phone: '+1 (512) 441-6623',
    estimatedDuration: '3 hours',
    status: 'pending',
    technicianAssigned: null,
    estimatedValue: 3400,
  },
  {
    id: 'book-004',
    customerName: 'Marcus Johnson',
    serviceType: 'Cleaning',
    date: '2026-10-20',
    time: '09:00',
    address: '903 South Congress Ave, Austin TX 78704',
    phone: '+1 (737) 992-0043',
    estimatedDuration: '4 hours',
    status: 'confirmed',
    technicianAssigned: 'Team A',
    estimatedValue: 480,
  },
];

export const mockSmsTemplates: SmsTemplate[] = [
  {
    id: 'sms-001',
    name: 'Booking Confirmation',
    trigger: 'On booking created',
    content: 'Hi {{name}}! Your {{service}} appointment is confirmed for {{date}} at {{time}}. Our tech will arrive at {{address}}. Questions? Reply to this message. — HomeServe',
    active: true,
    sentCount: 847,
  },
  {
    id: 'sms-002',
    name: 'Owner Call Summary',
    trigger: 'After call ends',
    content: '📞 New lead from {{name}} ({{phone}}). Service: {{service}}. Score: {{score}}/100. Address: {{address}}. Urgency: {{urgency}}. View full transcript in dashboard.',
    active: true,
    sentCount: 1243,
  },
  {
    id: 'sms-003',
    name: 'Google Review Request',
    trigger: '2h after job marked complete',
    content: 'Hi {{name}}, thanks for choosing HomeServe! We hope {{tech}} did a great job today. Would you mind leaving us a quick Google review? It helps us a ton ⭐ {{review_link}}',
    active: true,
    sentCount: 312,
  },
  {
    id: 'sms-004',
    name: 'Invoice Payment Reminder',
    trigger: 'Day 3 overdue (manual)',
    content: 'Hi {{name}}, friendly reminder that invoice #{{invoice_id}} for ${{amount}} is due. Pay securely here: {{payment_link}} — HomeServe Team',
    active: true,
    sentCount: 89,
  },
  {
    id: 'sms-005',
    name: 'Missed Call Follow-up',
    trigger: 'On missed call event',
    content: 'Hi! We missed your call at HomeServe. We\'d love to help — what service do you need? You can reply here or call us back at {{business_phone}}. We\'re available 24/7.',
    active: true,
    sentCount: 204,
  },
  {
    id: 'sms-006',
    name: 'Appointment Reminder',
    trigger: '24h before appointment',
    content: '⏰ Reminder: Your {{service}} appointment is tomorrow at {{time}}. Your tech {{tech}} will arrive at {{address}}. Reply CONFIRM to confirm or CANCEL to cancel.',
    active: false,
    sentCount: 0,
  },
];

export const callVolumeData = [
  { day: 'Mon', calls: 23, leads: 14, bookings: 8 },
  { day: 'Tue', calls: 31, leads: 19, bookings: 11 },
  { day: 'Wed', calls: 27, leads: 16, bookings: 9 },
  { day: 'Thu', calls: 38, leads: 24, bookings: 14 },
  { day: 'Fri', calls: 44, leads: 28, bookings: 18 },
  { day: 'Sat', calls: 29, leads: 17, bookings: 10 },
  { day: 'Sun', calls: 17, leads: 9, bookings: 5 },
];

export const serviceBreakdownData = [
  { name: 'Plumbing', value: 34, color: '#3B82F6' },
  { name: 'HVAC', value: 28, color: '#06B6D4' },
  { name: 'Electrical', value: 18, color: '#8B5CF6' },
  { name: 'Roofing', value: 12, color: '#F59E0B' },
  { name: 'Cleaning', value: 8, color: '#10B981' },
];

export const revenueData = [
  { month: 'Jul', revenue: 18400 },
  { month: 'Aug', revenue: 22100 },
  { month: 'Sep', revenue: 19800 },
  { month: 'Oct', revenue: 26500 },
];
