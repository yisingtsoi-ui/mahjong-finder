import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Trophy, Crown, Medal, User } from 'lucide-react'
import MahjongLoading from '../components/MahjongLoading'

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      // 從我們剛剛建立的 view 中讀取前 100 名
      const { data, error } = await supabase
        .from('leaderboard_stats')
        .select('*')
        .order('rank', { ascending: true })

      if (error) throw error
      setLeaders(data || [])
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#F5F4EE]">
        <MahjongLoading text="計算排名中..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F4EE] pb-24 px-4 pt-6 font-sans text-black overflow-x-hidden">
      <div className="flex flex-col items-center mb-8 border-b-4 border-black pb-6 relative z-10">
        <Trophy size={48} strokeWidth={2} className="mb-2 text-yellow-500" />
        <h1 className="text-3xl font-black tracking-widest uppercase">雀林高手榜</h1>
        <p className="font-bold mt-2 bg-black text-white px-3 py-1 text-sm shadow-brutal-sm">
          每週更新 · 百大傳奇
        </p>
      </div>

      <div className="space-y-8 max-w-lg mx-auto relative z-10">
        {leaders.length === 0 ? (
          <div className="text-center py-10 border-4 border-black border-dashed bg-white shadow-tile rounded-md">
            <span className="text-4xl block mb-2">🀄</span>
            <p className="font-black tracking-widest">目前尚無排名數據</p>
          </div>
        ) : (
          leaders.map((leader) => {
            const r = leader.rank;
            
            // RANK 1-3: 神
            if (r >= 1 && r <= 3) {
              const titles = {1: '雀神', 2: '雀聖', 3: '雀王'};
              return (
                <div key={leader.user_id} className="relative mt-8">
                  {/* Floating Elements */}
                  <div className="absolute -top-6 -left-4 text-3xl animate-float" style={{ animationDelay: '0s' }}>🀄</div>
                  <div className="absolute -bottom-4 -right-2 text-2xl animate-float" style={{ animationDelay: '1.5s' }}>🎲</div>
                  
                  <div className="relative bg-white border-4 border-black p-1 shadow-[8px_8px_0_0_#000]">
                    <div className="border-4 border-dashed border-black p-4 bg-[#FACC15] relative overflow-hidden">
                      <div className="absolute inset-0 bg-polka-dot opacity-20 pointer-events-none"></div>
                      
                      <div className="relative z-10 flex justify-between items-center">
                        <div className="flex-1">
                          <div className="inline-block bg-black text-yellow-400 font-black text-xs px-2 py-1 mb-2 tracking-widest shadow-brutal-sm">
                            {titles[r]}
                          </div>
                          <h2 className="text-3xl font-black uppercase tracking-tight break-all">{leader.username}</h2>
                          {leader.motto && (
                            <p className="font-bold italic text-sm mt-2 border-l-4 border-black pl-2 bg-white/60">
                              "{leader.motto}"
                            </p>
                          )}
                        </div>
                        
                        <div className="text-right ml-4 flex flex-col items-end">
                          <div className="absolute -top-8 -right-4 text-8xl font-black text-white" 
                               style={{ textShadow: '4px 4px 0 #A855F7, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000' }}>
                            {r}
                          </div>
                          <div className="mt-16 bg-white border-2 border-black px-3 py-1 shadow-brutal-sm rounded-sm z-10">
                            <div className="text-[10px] font-black tracking-widest leading-none mb-1">大分</div>
                            <div className="text-2xl font-black leading-none text-purple-600">{Number(leader.overall_score).toFixed(1)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
            
            // RANK 4-20: 雀將
            if (r >= 4 && r <= 20) {
              const isRed = r % 2 === 0;
              const bgColor = isRed ? 'bg-red-500' : 'bg-orange-500';
              return (
                <div key={leader.user_id} className="relative mt-6">
                  <div className={`relative ${bgColor} border-4 border-black p-4 shadow-[4px_4px_0_0_#FACC15,8px_8px_0_0_#000] overflow-hidden`}>
                    <div className="absolute top-0 right-0 bottom-0 w-8 bg-danger-stripes opacity-30"></div>
                    
                    <div className="relative z-10 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-black text-white font-black text-[10px] px-1 py-0.5">雀將</span>
                          <span className="text-3xl font-black text-white" style={{ textShadow: '2px 2px 0 #000' }}>#{r}</span>
                        </div>
                        <h2 className="text-2xl font-black italic text-black break-all">{leader.username}</h2>
                      </div>
                      
                      <div className="text-right">
                        <div className="bg-white border-2 border-black px-2 py-1 shadow-brutal-sm transform rotate-3">
                          <div className="text-[10px] font-black tracking-widest">大分</div>
                          <div className="text-xl font-black">{Number(leader.overall_score).toFixed(1)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
            
            // RANK 21-60: 雀豪
            if (r >= 21 && r <= 60) {
              const isBlue = r % 2 === 0;
              const bgColor = isBlue ? 'bg-indigo-950' : 'bg-emerald-900';
              return (
                <div key={leader.user_id} className="relative mt-4 group">
                  <div className={`relative ${bgColor} border-2 border-black p-3 shadow-brutal-sm outline outline-1 outline-white/50 -outline-offset-4 overflow-hidden transition-transform group-hover:animate-glitch`}>
                    <div className="absolute inset-0 bg-scanlines opacity-20 pointer-events-none"></div>
                    <div className="absolute top-0 bottom-0 left-0 w-16 bg-halftone opacity-30 pointer-events-none"></div>
                    
                    <div className="relative z-10 flex justify-between items-center text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 text-center">
                          <div className="text-xs font-bold text-gray-400">雀豪</div>
                          <div className="text-xl font-black text-green-400">#{r}</div>
                        </div>
                        <div className="w-[1px] h-8 bg-white/30"></div>
                        <h2 className="text-lg font-bold tracking-wide break-all">{leader.username}</h2>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-green-400 font-mono font-bold text-lg">
                          {Number(leader.overall_score).toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }

            // RANK 61-100: 雀俠
            if (r >= 61 && r <= 100) {
              const isGray = r % 2 === 0;
              const bgColor = isGray ? 'bg-gray-700' : 'bg-teal-700';
              return (
                <div key={leader.user_id} className="relative mt-3">
                  <div className={`relative ${bgColor} border border-black p-3 shadow-[2px_2px_0_0_#000] scanner-corners overflow-hidden`}>
                    <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
                    
                    <div className="relative z-10 flex justify-between items-center text-white">
                      <div className="flex items-center gap-3">
                        <div className="font-mono text-lg font-bold w-12 opacity-80">
                          {r.toString().padStart(3, '0')}
                        </div>
                        <h2 className="text-sm font-bold tracking-wide text-gray-100 break-all">
                          [雀俠] {leader.username}
                        </h2>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-mono text-sm opacity-90">
                          {Number(leader.overall_score).toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }

            return null;
          })
        )}
      </div>
    </div>
  )
}
