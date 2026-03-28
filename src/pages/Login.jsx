import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { LogIn, UserPlus } from 'lucide-react'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          }
        })
        if (error) throw error
        setMessage('註冊成功！請檢查您的電子郵件進行驗證。')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        // Redirect handled by App.jsx session listener
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F4EE] px-4 font-sans text-black">
      <div className="text-center mb-10">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-white border-4 border-black rounded-2xl flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-3">
            <span className="text-5xl font-black text-green-600">發</span>
          </div>
        </div>
        <h1 className="text-4xl font-black tracking-widest uppercase mt-4 mb-2">Mahjong Finder</h1>
        <p className="font-bold border-2 border-black inline-block px-4 py-1 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          尋找你的完美雀友
        </p>
      </div>

      <div className="bg-white border-4 border-black p-6 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-sm">
        
        {/* Tabs */}
        <div className="flex mb-6 border-b-4 border-black">
          <button
            onClick={() => { setIsSignUp(false); setMessage(''); }}
            className={`flex-1 py-3 font-black text-lg flex items-center justify-center gap-2 transition-colors ${!isSignUp ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
          >
            <LogIn size={20} strokeWidth={3} /> 登入
          </button>
          <div className="w-1 bg-black"></div>
          <button
            onClick={() => { setIsSignUp(true); setMessage(''); }}
            className={`flex-1 py-3 font-black text-lg flex items-center justify-center gap-2 transition-colors ${isSignUp ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
          >
            <UserPlus size={20} strokeWidth={3} /> 註冊
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-sm font-black tracking-widest mb-2">電子郵件</label>
            <input
              type="email"
              required
              className="w-full p-4 border-2 border-black rounded-xl font-bold bg-[#F5F4EE] focus:bg-white focus:ring-0 outline-none transition-colors shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-black tracking-widest mb-2">密碼</label>
            <input
              type="password"
              required
              className="w-full p-4 border-2 border-black rounded-xl font-bold bg-[#F5F4EE] focus:bg-white focus:ring-0 outline-none transition-colors shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {message && (
            <div className={`p-4 rounded-xl border-2 border-black font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${message.includes('成功') ? 'bg-green-400' : 'bg-red-400'}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 mt-2 rounded-xl font-black text-lg tracking-widest border-2 border-black transition-all ${
              loading 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' 
                : 'bg-[#C3FF4D] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#b0f522] active:translate-y-1 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)]'
            }`}
          >
            {loading ? '處理中...' : isSignUp ? '立即註冊' : '進入牌局'}
          </button>
        </form>
      </div>
    </div>
  )
}
