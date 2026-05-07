import { Link, useLocation } from 'react-router-dom'

const tabs = [
  {
    name: "Members",
    href: "/admin/members",
    icon: (
      <svg aria-hidden="true" focusable="false" className="mr-2 w-5 h-5" fill="currentColor" viewBox="0 0 640 512"><path d="M144 0a80 80 0 1 1 0 160A80 80 0 1 1 144 0zM512 0a80 80 0 1 1 0 160A80 80 0 1 1 512 0zM0 298.7C0 239.8 47.8 192 106.7 192h42.7c15.9 0 31 3.5 44.6 9.7c-1.3 7.2-1.9 14.7-1.9 22.3c0 38.2 16.8 72.5 43.3 96c-.2 0-.4 0-.7 0H21.3C9.6 320 0 310.4 0 298.7zM405.3 320c-.2 0-.4 0-.7 0c26.6-23.5 43.3-57.8 43.3-96c0-7.6-.7-15-1.9-22.3c13.6-6.3 28.7-9.7 44.6-9.7h42.7C592.2 192 640 239.8 640 298.7c0 11.8-9.6 21.3-21.3 21.3H405.3zM224 224a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zM128 485.3C128 411.7 187.7 352 261.3 352H378.7C452.3 352 512 411.7 512 485.3c0 14.7-11.9 26.7-26.7 26.7H154.7c-14.7 0-26.7-11.9-26.7-26.7z"/></svg>
    ),
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: (
      <svg aria-hidden="true" focusable="false" className="mr-2 w-5 h-5" fill="currentColor" viewBox="0 0 512 512"><path d="M64 64c0-17.7-14.3-32-32-32S0 46.3 0 64V400c0 44.2 35.8 80 80 80H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H80c-8.8 0-16-7.2-16-16V64zm406.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L320 210.7l-57.4-57.4c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L240 221.3l57.4 57.4c12.5 12.5 32.8 12.5 45.3 0l128-128z"/></svg>
    ),
  },
  {
    name: "Email",
    href: "/admin/email",
    icon: (
      <svg aria-hidden="true" focusable="false" className="mr-2 w-5 h-5" fill="currentColor" viewBox="0 0 512 512"><path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48H48zM0 176V384c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V176L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z"/></svg>
    ),
  },
]

export default function AdminTabs() {
  const location = useLocation()
  return (
    <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2">
      <nav className="flex gap-2" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.href || location.pathname.startsWith(tab.href + '/')
          return (
            <Link
              key={tab.href}
              to={tab.href}
              className={`flex-1 flex items-center justify-center h-10 rounded-md text-sm font-medium transition-colors 
                ${isActive ? "bg-white shadow text-medium-pink" : "bg-transparent text-gray-600 hover:text-medium-pink"}`}
              style={{ minWidth: 0 }}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.icon}
              {tab.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
