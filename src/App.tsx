import { useState } from 'react'
import './index.css'
import Sidebar, { TopBar } from './components/Layout'
import type { PageId } from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import CallsPage from './pages/CallsPage'
import LeadsPage from './pages/LeadsPage'
import CalendarPage from './pages/CalendarPage'
import SmsPage from './pages/SmsPage'
import SettingsPage from './pages/SettingsPage'
import LoginPage from './pages/LoginPage'
import { WebSocketProvider } from './context/WebSocketContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LiveToast } from './components/LiveToast'
import { CallDetailModal } from './components/CallDetailModal'
import type { CallLog } from './data/mockData'

const pageMeta: Record<PageId, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Real-time overview of your AI receptionist activity' },
  calls:     { title: 'Call Logs', subtitle: 'All inbound calls processed by the AI agent' },
  leads:     { title: 'Lead Management', subtitle: 'Qualified leads with AI scoring and pipeline status' },
  calendar:  { title: 'Booking Calendar', subtitle: 'Scheduled appointments from AI-handled calls' },
  sms:       { title: 'SMS Workflows', subtitle: 'Automated messaging templates and delivery tracking' },
  settings:  { title: 'Settings', subtitle: 'Configure voice AI, business rules, and integrations' },
}

function AppContent() {
  const [activePage, setActivePage] = useState<PageId>('dashboard')
  const [inspectedCall, setInspectedCall] = useState<CallLog | null>(null)
  const meta = pageMeta[activePage]

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="main-content">
        <TopBar title={meta.title} subtitle={meta.subtitle} />
        {activePage === 'dashboard' && <DashboardPage />}
        {activePage === 'calls'     && <CallsPage />}
        {activePage === 'leads'     && <LeadsPage />}
        {activePage === 'calendar'  && <CalendarPage />}
        {activePage === 'sms'       && <SmsPage />}
        {activePage === 'settings'  && <SettingsPage />}
      </div>

      {/* Floating Live Alert Toast */}
      <LiveToast onInspectCall={(call) => setInspectedCall(call)} />

      {/* Live inspected call modal */}
      {inspectedCall && (
        <CallDetailModal call={inspectedCall} onClose={() => setInspectedCall(null)} />
      )}
    </div>
  )
}

function AppRoot() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-body)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: 'var(--accent-cyan)',
              boxShadow: '0 0 14px var(--accent-cyan)',
              margin: '0 auto 12px auto',
              animation: 'pulse 1.5s infinite',
            }}
          />
          <div style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: 'Space Grotesk' }}>
            Initializing HomeServe AI...
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <WebSocketProvider>
      <AppContent />
    </WebSocketProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoot />
    </AuthProvider>
  )
}

export default App
