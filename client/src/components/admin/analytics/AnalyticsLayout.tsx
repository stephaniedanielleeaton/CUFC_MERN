import { NavLink, Outlet } from 'react-router-dom'

const SUB_TABS = [
  { label: 'Daily', to: '/admin/analytics' },
  { label: 'Quarterly', to: '/admin/analytics/quarterly' },
]

export default function AnalyticsLayout() {
  return (
    <section>
      <h1 className="text-3xl font-bold mb-6">Attendance Analytics</h1>
      <nav className="flex gap-1 border-b border-gray-200 mb-6">
        {SUB_TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/admin/analytics'}
            className={({ isActive }) =>
              `px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                isActive
                  ? 'border-medium-pink text-medium-pink'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </section>
  )
}
