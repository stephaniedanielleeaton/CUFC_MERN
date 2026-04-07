import { Routes, Route, Navigate } from 'react-router-dom'
import { MemberProfileProvider } from './context/ProfileContext'
import Navbar from './components/navbar/Navbar'
import { Footer } from './components/layout/Footer'
import { SubFooter } from './components/layout/SubFooter'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import SchedulePage from './pages/SchedulePage'
import AttendancePage from './pages/AttendancePage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import PaymentHistoryPage from './pages/PaymentHistoryPage'
import AttendanceHistoryPage from './pages/AttendanceHistoryPage'
import AdminLayout from './components/admin/AdminLayout'
import AdminMembersPage from './pages/admin/AdminMembersPage'
import AdminAttendancePage from './pages/admin/AdminAttendancePage'
import AdminEmailPage from './pages/admin/AdminEmailPage'
import NotificationsPage from './pages/NotificationsPage'
import UnsubscribePage from './pages/UnsubscribePage'

function App() {
  return (
    <MemberProfileProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow bg-gray-50">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/unsubscribe" element={<UnsubscribePage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/checkin" element={<Navigate to="/attendance" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/payments" element={<PaymentHistoryPage />} />
            <Route path="/dashboard/attendance" element={<AttendanceHistoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminMembersPage />} />
              <Route path="members" element={<AdminMembersPage />} />
              <Route path="attendance" element={<AdminAttendancePage />} />
              <Route path="email" element={<AdminEmailPage />} />
            </Route>
          </Routes>
        </main>
        <Footer />
        <SubFooter />
      </div>
    </MemberProfileProvider>
  )
}

export default App
