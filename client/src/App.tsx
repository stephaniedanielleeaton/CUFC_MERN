import { Routes, Route } from 'react-router-dom'
import { MemberProfileProvider } from './context/ProfileContext'
import Navbar from './components/navbar/Navbar'
import HomePage from './pages/HomePage'
import AttendancePage from './pages/AttendancePage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import AdminLayout from './components/admin/AdminLayout'
import AdminMembersPage from './pages/admin/AdminMembersPage'
import AdminAttendancePage from './pages/admin/AdminAttendancePage'
import AdminEmailPage from './pages/admin/AdminEmailPage'

function App() {
  return (
    <MemberProfileProvider>
      <Navbar />
      <div>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminMembersPage />} />
            <Route path="members" element={<AdminMembersPage />} />
            <Route path="attendance" element={<AdminAttendancePage />} />
            <Route path="email" element={<AdminEmailPage />} />
          </Route>
        </Routes>
      </div>
    </MemberProfileProvider>
  )
}

export default App
