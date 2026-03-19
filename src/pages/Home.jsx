import { useState, useEffect } from 'react'
import { Users, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [isOnline, setIsOnline] = useState(false)
  const [nearbyUsers, setNearbyUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)

  const fetchNearbyUsers = async (lat, long, currentUserId) => {
    // Call the secure RPC function instead of querying the table directly
    const { data, error } = await supabase.rpc('get_nearby_users', {
      lat,
      long,
      radius_meters: 5000, // 5km radius
    })

    if (error) {
      console.error('Error fetching nearby users:', error)
    } else {
      let users = data || []
      
      // Filter out current user if currentUserId is provided
      if (currentUserId) {
        users = users.filter(u => u.id !== currentUserId)
      }

      // Sort by distance (nearest first) and limit to 10
      users.sort((a, b) => a.distance_meters - b.distance_meters)
      const top10Users = users.slice(0, 10)
      
      setNearbyUsers(top10Users)
    }
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        // Check current status
        supabase
          .from('profiles')
          .select('is_online, latitude, longitude')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setIsOnline(data.is_online)
              if (data.is_online && data.latitude && data.longitude) {
                fetchNearbyUsers(data.latitude, data.longitude, user.id)
              }
            }
          })
      }
    })
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
    </div>
  )
}
