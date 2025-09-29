import { NavLink } from 'react-router-dom'

const navigationItems = [
  { name: 'Projects', path: '/projects' },
  { name: 'People', path: '/people' },
  { name: 'Products', path: '/products' },
  { name: 'Perspective', path: '/perspective' },
]

export default function Navigation() {
  return (
    <nav className="flex space-x-8">
      {navigationItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              isActive
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`
          }
        >
          {item.name}
        </NavLink>
      ))}
    </nav>
  )
}