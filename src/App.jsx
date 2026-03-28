import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Leaderboard from './pages/Leaderboard'
import GameHistory from './pages/GameHistory'
import { supabase } from './lib/supabase'

window.customAlert = (message, title = '系統提示', onClose = null) => {
  window.dispatchEvent(new CustomEvent('custom-alert', { detail: { message, title, onClose } }));
};

const GlobalAlert = () => {
  const [alertData, setAlertData] = useState(null);

  useEffect(() => {
    const handleAlert = (e) => setAlertData(e.detail);
    window.addEventListener('custom-alert', handleAlert);
    return () => window.removeEventListener('custom-alert', handleAlert);
  }, []);

  if (!alertData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex items-center justify-center p-4 font-sans text-black">
      <div className="bg-[#F5F4EE] border-4 border-black rounded-md w-full max-w-sm p-6 relative shadow-brutal">
        <h3 className="text-xl font-black mb-4 tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 bg-black rounded-full block"></span>
          {alertData.title}
        </h3>
        <p className="text-md font-bold mb-6 whitespace-pre-wrap leading-relaxed">{alertData.message}</p>
        <button 
          onClick={() => {
            setAlertData(null);
            if (alertData.onClose) alertData.onClose();
          }}
          className="w-full py-3 bg-white text-black font-black tracking-widest border-2 border-black shadow-brutal active:shadow-brutal-active hover:bg-gray-50 transition-all"
        >
          確定
        </button>
      </div>
    </div>
  );
};

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#F5F4EE] space-y-4">
        <span className="text-5xl animate-spin">🀄</span>
        <span className="font-black tracking-widest text-xl">MAHJONG FINDER</span>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <GlobalAlert />
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        <Route path="/" element={session ? <Home /> : <Navigate to="/login" />} />
        <Route path="/profile" element={session ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/history" element={session ? <GameHistory /> : <Navigate to="/login" />} />
        <Route
          path="/leaderboard"
          element={session ? <Leaderboard /> : <Navigate to="/login" />}
        />
      </Routes>
      {session && <Navbar />}
    </BrowserRouter>
  )
}

export default App
