import { NavLink } from 'react-router-dom'
import { Trophy, User, Home, History } from 'lucide-react'

export default function Navbar() {
  const linkClass = ({ isActive }) =>
    `flex flex-col items-center ${
      isActive ? 'text-black font-black' : 'text-gray-400 font-bold'
    } hover:text-black transition-colors`

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-black py-3 px-6 flex justify-around items-center z-50">
      <NavLink to="/" className={linkClass}>
        <Home size={24} strokeWidth={2.5} />
        <span className="text-[10px] mt-1 tracking-widest">首頁</span>
      </NavLink>
      <NavLink to="/leaderboard" className={linkClass}>
        <Trophy size={24} strokeWidth={2.5} />
        <span className="text-[10px] mt-1 tracking-widest">高手榜</span>
      </NavLink>
      <NavLink to="/history" className={linkClass}>
        <History size={24} strokeWidth={2.5} />
        <span className="text-[10px] mt-1 tracking-widest">歷史</span>
      </NavLink>
      <NavLink to="/profile" className={linkClass}>
        <User size={24} strokeWidth={2.5} />
        <span className="text-[10px] mt-1 tracking-widest">名片</span>
      </NavLink>
    </nav>
  )
}
