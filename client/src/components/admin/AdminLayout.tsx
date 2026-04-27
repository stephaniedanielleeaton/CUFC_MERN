import { Outlet } from 'react-router-dom'
import AdminTabs from './AdminTabs'
import { RequireAuth } from '../auth/RequireAuth'

export default function AdminLayout() {
  return (
    <RequireAuth requiredRoles={['club-admin']}>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-2">
        <div className="w-full max-w-7xl">
          <AdminTabs />
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6 p-8 min-h-[300px]">
            <Outlet />
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}
