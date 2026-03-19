import { useState, useEffect } from 'react'
import { Users, Zap, QrCode, Star, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import QRCodeModal from '../components/QRCodeModal'
import ReviewModal from '../components/ReviewModal'
import { isAfter } from 'date-fns'

export default function Home() {
  const [isOnline, setIsOnline] = useState(false)
  const [playStatus, setPlayStatus] = useState('none') // 'none' or 'playing'
  const [playUntil, setPlayUntil] = useState(null)
  const [nearbyUsers, setNearbyUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  
  // Modals state
  const [showQRModal, setShowQRModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [pendingReviewMatch, setPendingReviewMatch] = useState(null)
  const [pendingReviewTarget, setPendingReviewTarget] = useState(null)

  const checkUserStatus = async (currentUserId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_online, latitude, longitude, play_status, play_until')
        .eq('id', currentUserId)
        .single()
        
      if (error) throw error
      
      if (data) {
        setIsOnline(data.is_online)
        
        // 檢查是否還在牌局中
        if (data.play_status === 'playing' && data.play_until) {
          const untilDate = new Date(data.play_until)
          if (isAfter(new Date(), untilDate)) {
            // 牌局已過期，自動轉為離線，並檢查是否需要評價
            await supabase.from('profiles').update({ 
              play_status: 'none',
              is_online: false 
            }).eq('id', currentUserId)
            setPlayStatus('none')
            setIsOnline(false)
            checkPendingReviews(currentUserId)
          } else {
            // 還在牌局中
            setPlayStatus('playing')
            setPlayUntil(untilDate)
          }
        } else {
          setPlayStatus('none')
        }

        if (data.is_online && data.latitude && data.longitude && data.play_status !== 'playing') {
          fetchNearbyUsers(data.latitude, data.longitude, currentUserId)
        }
      }
    } catch (err) {
      console.error('Error checking status:', err)
    }
  }

  // 檢查是否有剛結束且尚未評價的牌局
  const fetchNearbyUsers = async (lat, long, currentUserId) => {
    const { data, error } = await supabase.rpc('get_nearby_users', {
      lat,
      long,
      radius_meters: 5000,
    })

    if (error) {
      console.error('Error fetching nearby users:', error)
    } else {
      let users = data || []
      if (currentUserId) {
        users = users.filter(u => u.id !== currentUserId)
      }
      users.sort((a, b) => a.distance_meters - b.distance_meters)
      setNearbyUsers(users.slice(0, 10))
    }
    setLoading(false)
  }
  const checkPendingReviews = async (currentUserId) => {
    try {
      // 找最近結束的牌局，且自己是參與者
      const { data: recentMatches, error: matchError } = await supabase
        .from('match_players')
        .select('match_id, matches(end_time)')
        .eq('user_id', currentUserId)
        .order('match_id', { ascending: false })
        .limit(1)

      if (matchError || !recentMatches || recentMatches.length === 0) return

      const matchId = recentMatches[0].match_id
      
      // 找出這場牌局的對方玩家
      const { data: otherPlayers, error: playersError } = await supabase
        .from('match_players')
        .select('user_id, profiles(id, username)')
        .eq('match_id', matchId)
        .neq('user_id', currentUserId)
        .single()
        
      if (playersError || !otherPlayers) return
      
      // 檢查是否已經評價過
      const { count, error: reviewError } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('match_id', matchId)
        .eq('reviewer_id', currentUserId)
        
      if (reviewError) return
      
      // 如果還沒評價，彈出評價視窗
      if (count === 0) {
        setPendingReviewMatch({ id: matchId })
        setPendingReviewTarget(otherPlayers.profiles)
        setShowReviewModal(true)
      }
    } catch (err) {
      console.error('Error checking reviews:', err)
    }
  }

  useEffect(() => {
    let intervalId;
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        checkUserStatus(user.id)
        
        // 定期檢查狀態 (每分鐘)
        intervalId = setInterval(() => {
          checkUserStatus(user.id)
        }, 60000)
      }
    })
    
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [])

  const updateLocation = async (status) => {
    if (!user) return

    setLoading(true)
    try {
      if (status) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords
            
            // 位置模糊化處理：加上隨機偏移量，保護用戶真實位置 (約偏移 ±200-300 米)
            const fuzzOffset = () => (Math.random() - 0.5) * 0.005
            const fuzzedLat = latitude + fuzzOffset()
            const fuzzedLong = longitude + fuzzOffset()

            const { error } = await supabase
              .from('profiles')
              .update({
                is_online: true,
                latitude: fuzzedLat,
                longitude: fuzzedLong,
                last_seen: new Date().toISOString(),
              })
              .eq('id', user.id)

            if (error) throw error
            setIsOnline(true)
            fetchNearbyUsers(latitude, longitude, user.id)
          },
          (error) => {
            console.error('Error getting location:', error)
            alert('無法獲取位置，請允許定位權限')
            setLoading(false)
          }
        )
      } else {
        const { error } = await supabase
          .from('profiles')
          .update({ is_online: false })
          .eq('id', user.id)

        if (error) throw error
        setIsOnline(false)
        setNearbyUsers([])
        setLoading(false)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      setLoading(false)
    }
  }



  const toggleOnline = () => {
    updateLocation(!isOnline)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 pb-20 px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-green-700 mb-2">揾腳神器</h1>
        <p className="text-gray-500">三缺一？即刻上線搵雀友！</p>
      </div>

      {playStatus === 'playing' ? (
        <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center border-4 border-green-500">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <span className="text-5xl">🀄</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">牌局進行中</h2>
          <p className="text-gray-500 text-center mb-6">您目前正在牌局中，地圖已將您隱藏。</p>
          
          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg text-gray-600 font-medium w-full justify-center">
            <Clock size={18} />
            自動結束時間：
            <span className="text-black">
              {playUntil ? playUntil.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '計算中...'}
            </span>
          </div>
        </div>
      ) : (
        <>
          <button
            onClick={toggleOnline}
            disabled={loading}
            className={`w-48 h-48 rounded-full border-8 flex flex-col items-center justify-center transition-all duration-300 shadow-xl ${
              isOnline
                ? 'bg-green-500 border-green-600 text-white scale-105 shadow-green-200'
                : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
            } ${loading ? 'opacity-70 cursor-wait' : ''}`}
          >
            <Zap size={64} className={`mb-2 ${isOnline ? 'fill-current' : ''}`} />
            <span className="text-2xl font-bold">
              {loading ? '處理中...' : isOnline ? '在線中' : '點擊上線'}
            </span>
          </button>

          {isOnline && (
            <button 
              onClick={() => setShowQRModal(true)}
              className="mt-6 bg-white text-green-600 font-bold py-3 px-6 rounded-full shadow-md flex items-center gap-2 border border-green-200 hover:bg-green-50 transition-colors"
            >
              <QrCode size={20} />
              到達對局 (掃描/顯示 QR)
            </button>
          )}

          {isOnline && (
            <div className="mt-8 bg-white p-6 rounded-2xl shadow-lg w-full max-w-sm animate-fade-in">
              <div className="flex items-center justify-between mb-4">
            <div className="flex items-center text-gray-700">
              <Users className="mr-2" size={20} />
              <span className="font-medium">附近雀友</span>
            </div>
            <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
              {nearbyUsers.length} 人在線
            </span>
          </div>
          {nearbyUsers.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-sm">
              附近暫時無人在線...
            </div>
          ) : (
            <div className="space-y-3">
              {nearbyUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl">
                      🀄
                    </div>
                    <div>
                      <div className="font-bold text-sm">{u.username || '神秘雀友'}</div>
                      <div className="text-xs text-gray-500">
                        {u.mahjong_styles?.[0] || '一般'} • {Math.round(u.distance_meters)}m
                      </div>
                    </div>
                  </div>
                  {/* Future: Add View Profile Button */}
                </div>
              ))}
            </div>
          )}
        </div>
        )}
        </>
      )}

      {showQRModal && user && (
        <QRCodeModal 
          user={user} 
          onClose={() => setShowQRModal(false)} 
          onMatchStarted={() => {
            setShowQRModal(false);
            checkUserStatus(user.id);
          }}
        />
      )}

      {showReviewModal && pendingReviewMatch && pendingReviewTarget && user && (
        <ReviewModal 
          match={pendingReviewMatch}
          currentUser={user}
          targetUser={pendingReviewTarget}
          onClose={() => setShowReviewModal(false)}
          onSubmit={() => {
            setShowReviewModal(false);
            setPendingReviewMatch(null);
            setPendingReviewTarget(null);
          }}
        />
      )}
    </div>
  )
}
