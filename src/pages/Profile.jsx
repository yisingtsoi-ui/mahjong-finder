import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Star, Zap, Handshake } from 'lucide-react'

export default function Profile() {
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [profile, setProfile] = useState({
    username: '',
    contact_info: '',
    styles: [],
    bio: '',
    motto: '',
    motto_set: false
  })
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState({ speed: 0, skill: 0, manner: 0, count: 0, overall: 0 })
  const [userId, setUserId] = useState(null)
  const [isTopPlayer, setIsTopPlayer] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        fetchProfile(user.id)
      }
    })
  }, [])

  const fetchProfile = async (id) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      if (data) {
        setProfile({
          username: data.username || '',
          contact_info: data.contact_info || '',
          styles: data.mahjong_styles || [],
          bio: data.bio || '',
          motto: data.motto || '',
          motto_set: data.motto_set || false
        })
      }

      // 檢查是否在排行榜內
      const { data: leaderboardData } = await supabase
        .from('leaderboard_stats')
        .select('user_id')
        .eq('user_id', id)
        .single()
        
      if (leaderboardData) {
        setIsTopPlayer(true)
      }

      // Fetch recent reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('user_recent_reviews')
        .select('*')
        .eq('reviewee_id', id)
        .limit(10)

      if (!reviewsError && reviewsData) {
        setReviews(reviewsData)
      }

      // Fetch all reviews for stats
      const { data: statsData, error: statsError } = await supabase
        .from('reviews')
        .select('speed_rating, skill_rating, manner_rating')
        .eq('reviewee_id', id)

      if (!statsError && statsData) {
        const count = statsData.length
        if (count > 0) {
          const sum = statsData.reduce((acc, curr) => ({
            speed: acc.speed + (curr.speed_rating || 0),
            skill: acc.skill + (curr.skill_rating || 0),
            manner: acc.manner + (curr.manner_rating || 0)
          }), { speed: 0, skill: 0, manner: 0 })
          
          const avgSpeed = (sum.speed / count);
          const avgSkill = (sum.skill / count);
          const avgManner = (sum.manner / count);
          
          setStats({
            speed: avgSpeed.toFixed(1),
            skill: avgSkill.toFixed(1),
            manner: avgManner.toFixed(1),
            overall: ((avgSpeed + avgSkill + avgManner) / 3).toFixed(1),
            count
          })
        }
      }

    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async () => {
    if (!profile.username.trim()) {
      alert('名稱不能為空！')
      return
    }

    try {
      setLoading(true)
      
      // 名稱查重
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', profile.username.trim())
        .neq('id', userId)
        .single()

      if (existingUser) {
        alert('這個名稱已經有人使用了，請換一個專屬名稱！')
        setLoading(false)
        return
      }

      const updates = {
        id: userId,
        username: profile.username.trim(),
        contact_info: profile.contact_info,
        mahjong_styles: profile.styles,
        bio: profile.bio,
        motto: profile.motto,
        motto_set: profile.motto_set || (profile.motto ? true : false),
        updated_at: new Date(),
      }

      const { error } = await supabase.from('profiles').upsert(updates)
      if (error) throw error
      setEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('更新失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleStyleChange = (e) => {
    const val = e.target.value
    if (val && !profile.styles.includes(val)) {
      setProfile({ ...profile, styles: [...profile.styles, val] })
    }
    e.target.value = ''
  }

  const removeStyle = (style) => {
    setProfile({ ...profile, styles: profile.styles.filter((s) => s !== style) })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  if (loading && !userId) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#F5F4EE] space-y-4">
        <span className="text-5xl animate-spin">🀄</span>
        <span className="font-bold tracking-widest text-lg">理牌中...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F4EE] pb-24 p-4 font-sans text-black">
      <div className="flex justify-between items-center mb-6 mt-4 border-b-2 border-black pb-4">
        <h1 className="text-2xl font-black tracking-widest">個人名片</h1>
        <button onClick={handleSignOut} className="text-sm text-red-600 font-bold border-2 border-red-600 px-3 py-1 rounded hover:bg-red-50 active:translate-y-[1px]">
          登出
        </button>
      </div>

      <div className={`bg-white rounded-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 mb-8 ${isTopPlayer ? 'bg-gradient-to-br from-yellow-100 to-yellow-300' : ''}`}>
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 bg-[#F5F4EE] border-4 border-black rounded-full flex items-center justify-center text-4xl mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            🀄
          </div>
          {editing ? (
            <input
              className="text-2xl font-black text-center border-b-4 border-black focus:outline-none w-full bg-transparent placeholder:text-black/50"
              value={profile.username}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              placeholder="輸入專屬名稱"
            />
          ) : (
            <h2 className="text-3xl font-black">{profile.username || '未設定名稱'}</h2>
          )}
          
          {/* 大分顯示 */}
          {stats.count > 0 && !editing && (
            <div className="mt-3 bg-black text-white px-4 py-1 rounded-full border-2 border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="font-bold text-sm mr-2">大分</span>
              <span className="font-black text-xl">{stats.overall}</span>
            </div>
          )}
          
          {editing ? (
             <textarea
              className="text-black font-medium text-center border-4 border-black rounded-xl p-3 mt-4 w-full bg-white outline-none resize-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="輸入簡介"
              rows="2"
            />
          ) : (
            <p className="text-black font-medium mt-4 bg-white/50 px-4 py-2 rounded-lg border-2 border-black border-dashed">{profile.bio || '這人很懶，什麼都沒寫'}</p>
          )}

          {/* 雀王格言區塊 */}
          {isTopPlayer && (
            <div className="mt-6 w-full p-4 border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
              <div className="text-xs font-black tracking-widest bg-black text-white inline-block px-2 py-1 mb-2 absolute -top-3 -left-2 rotate-3">雀王格言</div>
              {editing && !profile.motto_set ? (
                <div>
                  <textarea
                    className="w-full text-sm font-bold border-b-2 border-black focus:outline-none resize-none"
                    value={profile.motto}
                    onChange={(e) => setProfile({ ...profile, motto: e.target.value })}
                    placeholder="寫下你的傳奇格言 (儲存後將無法修改！)"
                    rows="2"
                  />
                  <p className="text-[10px] text-red-600 font-bold mt-1">⚠️ 注意：格言一旦儲存就無法再次修改</p>
                </div>
              ) : (
                <p className="text-sm font-bold italic text-center">
                  {profile.motto ? `"${profile.motto}"` : '尚未留下格言'}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-black uppercase tracking-wider block mb-2 border-l-4 border-black pl-2">
              聯絡方式
            </label>
            {editing ? (
              <input
                className="bg-white p-3 rounded-lg text-black font-bold w-full border-2 border-black outline-none"
                value={profile.contact_info}
                onChange={(e) => setProfile({ ...profile, contact_info: e.target.value })}
                placeholder="例如: Telegram ID"
              />
            ) : (
              <div className="bg-[#F5F4EE] p-3 rounded-lg text-black font-bold break-all border-2 border-black">
                {profile.contact_info || '未設定'}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-black uppercase tracking-wider block mb-2 border-l-4 border-black pl-2">
              常打牌種
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {profile.styles.map((style) => (
                <span
                  key={style}
                  className="bg-white border-2 border-black text-black px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  {style}
                  {editing && (
                    <button
                      onClick={() => removeStyle(style)}
                      className="text-black hover:text-red-600 font-black px-1 ml-1"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
            {editing && (
              <select
                className="w-full p-3 border-2 border-black rounded-lg text-sm font-bold bg-white outline-none"
                onChange={handleStyleChange}
                defaultValue=""
              >
                <option value="" disabled>新增牌種...</option>
                <option value="廣東牌">廣東牌</option>
                <option value="港式台灣牌">港式台灣牌</option>
                <option value="跑馬仔">跑馬仔</option>
                <option value="日本麻雀">日本麻雀</option>
                <option value="國標麻雀">國標麻雀</option>
              </select>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={editing ? updateProfile : () => setEditing(true)}
        disabled={loading}
        className={`w-full py-4 rounded-xl font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all mb-10 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 ${
          editing
            ? 'bg-black text-white'
            : 'bg-white text-black hover:bg-gray-50'
        }`}
      >
        {loading ? '處理中...' : editing ? '儲存變更' : '編輯名片'}
      </button>

      {/* Reviews Section */}
      <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-6">
        <h3 className="text-xl font-black mb-6 flex items-center gap-2 border-b-2 border-black pb-3">
          雀友評價 ({stats.count > 0 ? stats.count : reviews.length})
        </h3>
        
        {stats.count > 0 && (
          <div className="flex justify-between items-center mb-8 pb-6 border-b-2 border-dashed border-gray-300">
            <div className="flex-1 text-center">
              <div className="flex justify-center mb-2"><Zap size={24} /></div>
              <div className="text-xs font-bold tracking-widest mb-1">牌速</div>
              <div className="text-xl font-black">{stats.speed}</div>
            </div>
            <div className="w-[2px] h-12 bg-black"></div>
            <div className="flex-1 text-center">
              <div className="flex justify-center mb-2">
                <span className="font-black text-2xl leading-none" style={{height: '24px'}}>中</span>
              </div>
              <div className="text-xs font-bold tracking-widest mb-1">牌技</div>
              <div className="text-xl font-black">{stats.skill}</div>
            </div>
            <div className="w-[2px] h-12 bg-black"></div>
            <div className="flex-1 text-center">
              <div className="flex justify-center mb-2"><Handshake size={24} /></div>
              <div className="text-xs font-bold tracking-widest mb-1">牌品</div>
              <div className="text-xl font-black">{stats.manner}</div>
            </div>
          </div>
        )}

        {reviews.length === 0 ? (
          <p className="text-black font-bold text-center py-6 border-2 border-black border-dashed rounded-lg">目前還沒有評價</p>
        ) : (
          <div className="space-y-6">
            {reviews.map((review, index) => (
              <div key={index} className="border-b-2 border-black last:border-0 pb-6 last:pb-0">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-bold text-lg">{review.reviewer_name || '神秘雀友'}</span>
                  <div className="text-sm font-bold text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex gap-4 mb-3">
                  <div className="flex items-center gap-1 font-bold text-sm">
                    <Zap size={14} /> <span>{review.speed_rating || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-sm">
                    <span className="font-black leading-none text-[14px]">中</span> <span>{review.skill_rating || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-sm">
                    <Handshake size={14} /> <span>{review.manner_rating || '-'}</span>
                  </div>
                </div>

                {review.comment && (
                  <p className="text-black font-medium bg-[#F5F4EE] border-2 border-black p-3 rounded-lg text-sm leading-relaxed">
                    "{review.comment}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
