import { NavLink } from 'react-router'

const TABS = [
  { to: '/', label: 'Liste', icon: '🛒' },
  { to: '/settings', label: 'Réglages', icon: '⚙️' },
]

/** Bottom tab bar: reachable with the thumb, padded above the iPhone home indicator. */
export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="flex">
        {TABS.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              end
              className={({ isActive }) =>
                `flex h-16 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                  isActive ? 'text-green-700' : 'text-stone-500'
                }`
              }
            >
              <span className="text-xl" aria-hidden="true">
                {tab.icon}
              </span>
              {tab.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
