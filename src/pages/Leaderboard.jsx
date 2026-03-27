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
                    <div className="border-4 border-dashed border-black p-4 bg-gold-foil relative overflow-hidden">
                      <div className="absolute inset-0 bg-polka-dot opacity-30 mix-blend-multiply pointer-events-none"></div>
                      
                      <div className="relative z-10 flex justify-between items-center">
                        <div className="flex-1">
                          <div className="inline-block bg-black text-yellow-300 font-black text-xs px-2 py-1 mb-2 tracking-widest shadow-brutal-sm border border-yellow-500/30">
                            {titles[r]}
                          </div>
                          <h2 className="text-3xl font-black uppercase tracking-tight break-all text-black drop-shadow-md">{leader.username}</h2>
                          {leader.motto && (
                            <p className="font-bold italic text-sm mt-2 border-l-4 border-black pl-2 bg-black/10 text-black">
                              "{leader.motto}"
                            </p>
                          )}
                        </div>
                        
                        <div className="text-right ml-4 flex flex-col items-end">
                          <div className="absolute -top-8 -right-4 text-8xl font-black text-gold-foil" 
                               style={{ filter: 'drop-shadow(4px 4px 0px #A855F7) drop-shadow(-2px -2px 0px #000) drop-shadow(2px -2px 0px #000) drop-shadow(-2px 2px 0px #000) drop-shadow(2px 2px 0px #000)' }}>
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
              const bgColor = isRed ? 'bg-red-foil' : 'bg-orange-foil';
              return (
                <div key={leader.user_id} className="relative mt-6">
                  <div className={`relative ${bgColor} border-4 border-black p-4 shadow-[4px_4px_0_0_#FACC15,8px_8px_0_0_#000] overflow-hidden`}>
                    <div className="absolute top-0 right-0 bottom-0 w-8 bg-danger-stripes opacity-40 mix-blend-color-burn"></div>
                    
                    <div className="relative z-10 flex justify-between items-center pr-[70px]">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-black text-white font-black text-[10px] px-1 py-0.5 shadow-[1px_1px_0_0_#FFF]">雀將</span>
                          <span className="text-3xl font-black text-white" style={{ filter: 'drop-shadow(2px 2px 0px #000) drop-shadow(-1px -1px 0px rgba(255,255,255,0.5))' }}>#{r}</span>
                        </div>
                        <h2 className="text-2xl font-black italic text-white break-all" style={{ filter: 'drop-shadow(2px 2px 0px #000)' }}>{leader.username}</h2>
                      </div>
                      
                      <div className="text-right absolute right-0 top-1/2 -translate-y-1/2">
                        <div className="bg-black/80 backdrop-blur-md border border-white/20 text-white px-2 py-1 shadow-[4px_4px_0_0_#000] transform rotate-3">
                          <div className="text-[10px] font-black tracking-widest text-gray-400">大分</div>
                          <div className="text-xl font-black" style={{ textShadow: '0 0 5px rgba(255,255,255,0.5)' }}>{Number(leader.overall_score).toFixed(1)}</div>
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
              const bgColor = isBlue ? 'bg-blue-foil' : 'bg-green-foil';
              return (
                <div key={leader.user_id} className="relative mt-4 group">
                  <div className={`relative ${bgColor} border-2 border-black shadow-brutal-sm outline outline-1 outline-white/30 -outline-offset-4 overflow-hidden transition-transform group-hover:animate-glitch`}>
                    <div className="absolute inset-0 bg-scanlines opacity-40 mix-blend-color-burn pointer-events-none"></div>
                    <div className="absolute top-0 bottom-0 left-0 w-16 bg-halftone opacity-40 mix-blend-color-burn pointer-events-none"></div>
                    
                    <div className="relative z-10 flex justify-between items-center text-white min-h-[70px] pr-[80px]">
                      <div className="flex items-center gap-3 py-3 pl-3">
                        <div className="w-10 text-center">
                          <div className="text-[10px] font-black text-black bg-white/80 px-1 py-0.5 mb-1 inline-block shadow-[1px_1px_0_0_#000]">雀豪</div>
                          <div className="text-2xl font-black text-white" style={{ filter: 'drop-shadow(2px 2px 0px #000) drop-shadow(0 0 2px rgba(255,255,255,0.8))' }}>#{r}</div>
                        </div>
                        <div className="w-[2px] h-10 bg-white/50 shadow-[1px_1px_0_0_#000]"></div>
                        <h2 className="text-lg font-black tracking-wide break-all" style={{ filter: 'drop-shadow(2px 2px 0px #000)' }}>{leader.username}</h2>
                      </div>
                      
                      <div className="text-right bg-black/40 px-4 border-l border-white/20 backdrop-blur-md shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] flex flex-col justify-center absolute right-0 top-0 bottom-0">
                        <div className="text-[10px] text-gray-300 font-bold mb-0.5 tracking-widest">大分</div>
                        <div className="text-white font-mono font-bold text-xl" style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.6)) drop-shadow(1px 1px 0px #000)' }}>
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
              const bgColor = isGray ? 'bg-gray-foil' : 'bg-teal-foil';
              return (
                <div key={leader.user_id} className="relative mt-3">
                  <div className={`relative ${bgColor} border border-black shadow-[2px_2px_0_0_#000] scanner-corners overflow-hidden`} style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))' }}>
                    <div className="absolute inset-0 bg-grid-pattern opacity-30 mix-blend-color-burn pointer-events-none"></div>
                    
                    <div className="relative z-10 flex justify-between items-center text-white py-2 px-3">
                      <div className="flex items-center gap-3">
                        <div className="font-mono text-xl font-black w-12 text-white" style={{ filter: 'drop-shadow(1px 1px 0px #000)' }}>
                          {r.toString().padStart(3, '0')}
                        </div>
                        <h2 className="text-sm font-bold tracking-wide text-white break-all flex items-center gap-2">
                          <span className="text-[9px] bg-black text-white px-1 py-0.5 font-black border border-white/30 shadow-[1px_1px_0_0_#FFF]">雀俠</span> 
                          <span style={{ filter: 'drop-shadow(1px 1px 0px #000)' }}>{leader.username}</span>
                        </h2>
                      </div>
                      
                      <div className="text-right z-10 relative">
                        <div className="font-mono text-sm font-bold bg-black/60 backdrop-blur-sm px-2 py-1 border border-white/20 shadow-[1px_1px_0_0_#000]" style={{ filter: 'drop-shadow(1px 1px 0px #000)' }}>
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
