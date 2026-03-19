import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Star } from 'lucide-react'

export default function Profile() {
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [profile, setProfile] = useState({
    username: '',
    contact_info: '',
    styles: [],
    bio: '',
  })
  const [reviews, setReviews] = useState([])
  const [userId, setUserId] = useState(null)

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
        })
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

    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async () => {
    try {
      setLoading(true)
      const updates = {
        id: userId,
        username: profile.username,
        contact_info: profile.contact_info,
        mahjong_styles: profile.styles,
        bio: profile.bio,
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

  if (loading && !userId) return <div className="p-8 text-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 pb-20 p-4">
      <div className="flex justify-between items-center mb-6 mt-4">
        <h1 className="text-2xl font-bold text-gray-800">個人名片</h1>
        <button onClick={handleSignOut} className="text-sm text-red-500 font-bold">
          登出
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-4xl mb-3">
            🀄
          </div>
          {editing ? (
            <input
              className="text-xl font-bold text-center border-b border-gray-300 focus:outline-none focus:border-green-500 w-full"
              value={profile.username}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              placeholder="輸入暱稱"
            />
          ) : (
            <h2 className="text-xl font-bold">{profile.username || '未設定暱稱'}</h2>
          )}
          
          {editing ? (
             <textarea
              className="text-gray-500 text-sm text-center border rounded p-2 mt-2 w-full"
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="輸入簡介"
            />
          ) : (
            <p className="text-gray-500 text-sm mt-1">{profile.bio || '這人很懶，什麼都沒寫'}</p>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
              聯絡方式
            </label>
            {editing ? (
              <input
                className="bg-gray-50 p-3 rounded-lg text-gray-700 font-medium w-full border focus:border-green-500 outline-none"
                value={profile.contact_info}
                onChange={(e) => setProfile({ ...profile, contact_info: e.target.value })}
                placeholder="例如: Telegram ID"
              />
            ) : (
              <div className="bg-gray-50 p-3 rounded-lg text-gray-700 font-medium break-all">
                {profile.contact_info || '未設定'}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
              常打牌種
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {profile.styles.map((style) => (
                <span
                  key={style}
                  className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                >
                  {style}
                  {editing && (
                    <button
                      onClick={() => removeStyle(style)}
                      className="text-green-900 hover:text-red-500 font-bold px-1"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
            {editing && (
              <select
                className="w-full p-2 border rounded-lg text-sm bg-white"
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
        className={`w-full py-4 rounded-xl font-bold shadow-lg text-white transition-all mb-8 ${
          editing
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-gray-900 hover:bg-gray-800'
        }`}
      >
        {loading ? '處理中...' : editing ? '儲存變更' : '編輯名片'}
      </button>

      {/* Reviews Section */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Star className="text-yellow-400 fill-yellow-400" size={20} />
          雀友評價 ({reviews.length})
        </h3>
        
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">目前還沒有評價</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review, index) => (
              <div key={index} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-sm">{review.reviewer_name || '神秘雀友'}</span>
                  <div className="flex gap-3 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <span>牌速</span>
                      <span className="flex">
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        <span className="ml-0.5">{review.speed_rating || '-'}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>牌技</span>
                      <span className="flex">
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        <span className="ml-0.5">{review.skill_rating || '-'}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>牌品</span>
                      <span className="flex">
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        <span className="ml-0.5">{review.manner_rating || '-'}</span>
                      </span>
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">"{review.comment}"</p>
                )}
                <div className="text-xs text-gray-400 mt-2">
                  {new Date(review.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
