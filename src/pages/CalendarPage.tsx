import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, User, Wrench, Plus, CheckCircle, X } from 'lucide-react';
import { getBookings, updateBooking, createBooking } from '../api/client';
import type { Booking, ServiceType } from '../data/mockData';
import { useWebSocket } from '../context/WebSocketContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';

const NewBookingModal: React.FC<{
  initialDate?: string | null;
  onClose: () => void;
  onCreated: () => void;
}> = ({ initialDate, onClose, onCreated }) => {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('Plumbing');
  const [date, setDate] = useState(initialDate || '2026-10-22');
  const [time, setTime] = useState('10:00');
  const [address, setAddress] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('2 hours');
  const [technicianAssigned, setTechnicianAssigned] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('650');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || !address) return;
    setSubmitting(true);
    try {
      await createBooking({
        customerName,
        phone,
        serviceType,
        date,
        time,
        address,
        estimatedDuration,
        technicianAssigned: technicianAssigned || null,
        estimatedValue: parseFloat(estimatedValue) || 500,
        status: 'confirmed',
      });
      onCreated();
      onClose();
    } catch (err) {
      console.error('Failed to create booking:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 540 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Book New Appointment</div>
          <button className="icon-btn" onClick={onClose}><X size={15} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div className="input-group">
              <label className="input-label">Customer Name</label>
              <input
                className="input-field"
                required
                placeholder="e.g. John Smith"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Phone Number</label>
              <input
                className="input-field"
                required
                placeholder="+1 (512) 555-0199"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div className="input-group">
              <label className="input-label">Date</label>
              <input
                type="date"
                required
                className="input-field"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Time</label>
              <select
                className="input-field"
                value={time}
                onChange={e => setTime(e.target.value)}
              >
                <option value="08:00">08:00 AM</option>
                <option value="09:00">09:00 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="11:30">11:30 AM</option>
                <option value="13:00">01:00 PM</option>
                <option value="14:00">02:00 PM</option>
                <option value="15:30">03:30 PM</option>
                <option value="17:00">05:00 PM</option>
              </select>
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 14 }}>
            <label className="input-label">Service Address</label>
            <input
              required
              className="input-field"
              placeholder="e.g. 1204 South Congress Ave, Austin TX"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
            <div className="input-group">
              <label className="input-label">Assigned Technician</label>
              <input
                className="input-field"
                placeholder="e.g. Jake Torres (Optional)"
                value={technicianAssigned}
                onChange={e => setTechnicianAssigned(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Duration</label>
              <select
                className="input-field"
                value={estimatedDuration}
                onChange={e => setEstimatedDuration(e.target.value)}
              >
                <option value="1 hour">1 hour</option>
                <option value="1.5 hours">1.5 hours</option>
                <option value="2 hours">2 hours</option>
                <option value="3 hours">3 hours</option>
                <option value="4 hours">4 hours</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Booking...' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RescheduleModal: React.FC<{
  booking: Booking;
  onClose: () => void;
  onSaved: () => void;
}> = ({ booking, onClose, onSaved }) => {
  const [date, setDate] = useState(booking.date);
  const [time, setTime] = useState(booking.time);
  const [submitting, setSubmitting] = useState(false);

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateBooking(booking.id, { date, time, status: 'confirmed' });
      onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to reschedule booking:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 440 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Reschedule Appointment</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{booking.customerName} · {booking.serviceType}</div>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={15} /></button>
        </div>

        <form onSubmit={handleReschedule}>
          <div className="input-group" style={{ marginBottom: 14 }}>
            <label className="input-label">New Date</label>
            <input
              type="date"
              required
              className="input-field"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          <div className="input-group" style={{ marginBottom: 20 }}>
            <label className="input-label">New Time</label>
            <select
              className="input-field"
              value={time}
              onChange={e => setTime(e.target.value)}
            >
              <option value="08:00">08:00 AM</option>
              <option value="09:00">09:00 AM</option>
              <option value="10:00">10:00 AM</option>
              <option value="11:30">11:30 AM</option>
              <option value="13:00">01:00 PM</option>
              <option value="14:00">02:00 PM</option>
              <option value="15:30">03:30 PM</option>
              <option value="17:00">05:00 PM</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Update Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CalendarPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 9, 1)); // Oct 2026
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [reschedulingBooking, setReschedulingBooking] = useState<Booking | null>(null);
  const { subscribe } = useWebSocket();

  const fetchBookingsList = async () => {
    try {
      const data = await getBookings();
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingsList();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribe((payload) => {
      if (payload.type === 'NEW_BOOKING' || payload.type === 'UPDATE_BOOKING') {
        fetchBookingsList();
      }
    });
    return () => unsubscribe();
  }, [subscribe]);

  const handleMarkDone = async (bookingId: string) => {
    try {
      await updateBooking(bookingId, { status: 'completed' });
      fetchBookingsList();
    } catch (err) {
      console.error('Failed to update booking status:', err);
    }
  };

  const bookingDates = bookings.map(b => b.date);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startPadding = getDay(monthStart); // 0=Sun
  const emptyBefore = Array(startPadding).fill(null);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const bookingsForSelectedDate = selectedDate
    ? bookings.filter(b => b.date === selectedDate)
    : bookings;

  const statusColor = (status: string) => {
    if (status === 'confirmed') return 'var(--accent-emerald)';
    if (status === 'pending') return 'var(--accent-amber)';
    if (status === 'completed') return 'var(--accent-blue)';
    return 'var(--accent-rose)';
  };

  return (
    <div className="page-content">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
        {/* Calendar Panel */}
        <div className="card">
          <div className="card-header" style={{ paddingBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="section-title">{format(currentMonth, 'MMMM yyyy')}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="icon-btn" id="btn-prev-month" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={{ width: 32, height: 32 }}>
                  <ChevronLeft size={15} />
                </button>
                <button className="btn btn-secondary btn-sm" id="btn-today" onClick={() => setCurrentMonth(new Date(2026, 9, 1))}>Today</button>
                <button className="icon-btn" id="btn-next-month" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ width: 32, height: 32 }}>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>

          <div className="card-body" style={{ paddingTop: 0 }}>
            {/* Day labels */}
            <div className="calendar-grid">
              {dayLabels.map(d => (
                <div key={d} className="cal-header">{d}</div>
              ))}
              {/* Empty cells */}
              {emptyBefore.map((_, i) => (
                <div key={`empty-${i}`} className="cal-day other-month"></div>
              ))}
              {/* Days */}
              {daysInMonth.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const hasEvent = bookingDates.includes(dateStr);
                const isSelected = selectedDate === dateStr;
                const isCurrentMonth = isSameMonth(day, currentMonth);
                return (
                  <div
                    key={dateStr}
                    id={`cal-day-${dateStr}`}
                    className={`cal-day ${isToday(day) ? 'today' : ''} ${hasEvent ? 'has-events' : ''} ${!isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  >
                    {format(day, 'd')}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
              {[
                { label: 'Has bookings', color: 'var(--accent-cyan)', dot: true },
                { label: 'Today', color: 'var(--accent-blue)', bg: true },
                { label: 'Selected', color: 'white', bg2: true },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                  <div style={{
                    width: l.dot ? 6 : 14,
                    height: l.dot ? 6 : 14,
                    borderRadius: l.dot ? '50%' : 4,
                    background: l.dot ? l.color : l.bg ? 'rgba(59,130,246,0.2)' : 'var(--accent-blue)',
                    border: l.bg ? '1px solid var(--accent-blue)' : 'none'
                  }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bookings Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="section-title">{selectedDate ? format(new Date(selectedDate + 'T12:00:00'), 'EEEE, MMM d') : 'All Bookings'}</div>
              <div className="section-sub">{bookingsForSelectedDate.length} appointment{bookingsForSelectedDate.length !== 1 ? 's' : ''}</div>
            </div>
            <button
              className="btn btn-primary btn-sm"
              id="btn-new-booking"
              onClick={() => setIsNewBookingOpen(true)}
            >
              <Plus size={13} /> Book
            </button>
          </div>

          {bookingsForSelectedDate.map(booking => (
            <div key={booking.id} className="card" style={{ padding: 18 }} id={`booking-${booking.id}`}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: `${statusColor(booking.status)}22`,
                    color: statusColor(booking.status),
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Wrench size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{booking.customerName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{booking.serviceType}</div>
                  </div>
                </div>
                <span className={`badge ${booking.status}`}>
                  {booking.status === 'confirmed' && <CheckCircle size={9} />}
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>

              {/* Details */}
              {[
                { icon: <Clock size={12} />, text: `${format(new Date(booking.date + 'T12:00:00'), 'EEE MMM d')} at ${booking.time} · ${booking.estimatedDuration}` },
                { icon: <MapPin size={12} />, text: booking.address },
                { icon: <User size={12} />, text: booking.technicianAssigned ? `Technician: ${booking.technicianAssigned}` : 'No technician assigned' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--text-muted)', marginTop: 1, flexShrink: 0 }}>{item.icon}</span>
                  {item.text}
                </div>
              ))}

              {/* Value */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-subtle)'
              }}>
                <span style={{ fontSize: 13, color: 'var(--accent-emerald)', fontWeight: 700 }}>${booking.estimatedValue.toLocaleString()}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-ghost btn-xs"
                    id={`reschedule-${booking.id}`}
                    onClick={() => setReschedulingBooking(booking)}
                  >
                    Reschedule
                  </button>
                  <button className="btn btn-secondary btn-xs" id={`complete-${booking.id}`} onClick={() => handleMarkDone(booking.id)}>
                    Mark Done
                  </button>
                </div>
              </div>
            </div>
          ))}

          {bookingsForSelectedDate.length === 0 && !loading && (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon"><Calendar size={22} /></div>
                <div className="empty-title">No bookings</div>
                <div className="empty-desc">No appointments for this day. Click a day with a dot to view bookings.</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isNewBookingOpen && (
        <NewBookingModal
          initialDate={selectedDate}
          onClose={() => setIsNewBookingOpen(false)}
          onCreated={fetchBookingsList}
        />
      )}

      {reschedulingBooking && (
        <RescheduleModal
          booking={reschedulingBooking}
          onClose={() => setReschedulingBooking(null)}
          onSaved={fetchBookingsList}
        />
      )}
    </div>
  );
};

export default CalendarPage;
