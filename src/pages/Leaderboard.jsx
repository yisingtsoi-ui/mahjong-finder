import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Trophy, Crown, Medal, User } from 'lucide-react'

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
      <div className="flex flex-col h-screen items-center justify-center bg-[#F5F4EE] space-y-4">
        <span className="text-5xl animate-spin">🀄</span>
        <span className="font-black tracking-widest text-xl">計算排名中...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F4EE] pb-24 px-4 pt-6 font-sans text-black">
      <div className="flex flex-col items-center mb-8 border-b-4 border-black pb-6">
        <Trophy size={48} strokeWidth={2} className="mb-2 text-yellow-500" />
        <h1 className="text-3xl font-black tracking-widest uppercase">雀林高手榜</h1>
        <p className="font-bold mt-2 bg-black text-white px-3 py-1 text-sm shadow-[2px_2px_0px_0px_rgba(255,215,0,1)]">
          每週更新 · 百大傳奇
        </p>
      </div>

      <div className="space-y-4">
        {leaders.length === 0 ? (
          <div className="text-center py-10 border-4 border-black border-dashed bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-4xl block mb-2">🀄</span>
            <p className="font-black tracking-widest">目前尚無排名數據</p>
          </div>
        ) : (
          leaders.map((leader) => {
            const isTop3 = leader.rank <= 3;
            const isGold = true; // 所有上榜者卡片都是金色的
            
            return (
              <div 
                key={leader.user_id} 
                className={`relative p-5 border-4 border-black transition-transform ${
                  isGold ? 'bg-gradient-to-br from-yellow-200 to-yellow-500' : 'bg-white'
                } ${isTop3 ? 'shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]' : 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}
              >
                {/* 排名標籤 */}
                <div className="absolute -top-4 -left-2 bg-black text-white w-10 h-10 flex items-center justify-center font-black text-xl border-2 border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rotate-[-5deg]">
                  #{leader.rank}
                </div>

                <div className="flex items-start justify-between ml-8">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {leader.rank === 1 && <Crown size={20} className="text-white fill-white" />}
                      {leader.rank === 2 && <Medal size={20} className="text-gray-200 fill-gray-200" />}
                      {leader.rank === 3 && <Medal size={20} className="text-amber-700 fill-amber-700" />}
                      <h2 className="text-2xl font-black">{leader.username}</h2>
                    </div>
                    
                    {/* 雀王格言 */}
                    <div className="mt-2 mb-3">
                      {leader.motto ? (
                        <p className="font-bold italic text-sm border-l-4 border-black pl-2 py-1 bg-white/40">
                          "{leader.motto}"
                        </p>
                      ) : (
                        <p className="font-bold text-sm text-black/50 italic">
                          這位高手很低調，還沒留下格言
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <div className="bg-white border-2 border-black px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-2">
                      <div className="text-[10px] font-black tracking-widest leading-none mb-1">大分</div>
                      <div className="text-xl font-black leading-none">{Number(leader.overall_score).toFixed(1)}</div>
                    </div>
                    <div className="text-xs font-bold bg-black text-white px-2 py-1">
                      對戰 {leader.match_count} 局
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
