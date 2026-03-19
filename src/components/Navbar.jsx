import { NavLink } from 'react-router-dom'
import { MapPin, User, Home, History } from 'lucide-react'

export default function Navbar() {
  const linkClass = ({ isActive }) =>
    `flex flex-col items-center ${
      isActive ? 'text-green-600' : 'text-gray-600'
    } hover:text-green-600`

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-6 flex justify-around items-center z-50">
      <NavLink to="/" className={linkClass}>
        <Home size={24} />
        <span className="text-xs mt-1">首頁</span>
      </NavLink>
      <NavLink to="/map" className={linkClass}>
        <MapPin size={24} />
        <span className="text-xs mt-1">地圖</span>
      </NavLink>
      <NavLink to="/history" className={linkClass}>
        <History size={24} />
        <span className="text-xs mt-1">歷史</span>
      </NavLink>
      <NavLink to="/profile" className={linkClass}>
        <User size={24} />
        <span className="text-xs mt-1">我的</span>
      </NavLink>
    </nav>
  )
}
