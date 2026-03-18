import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { supabase } from '../lib/supabase'
import L from 'leaflet'

// Fix default marker icon issue with Leaflet and Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom Mahjong Icon
const mahjongIcon = L.divIcon({
  html: '<div style="font-size: 24px; line-height: 1; text-align: center; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">🀄</div>',
  className: 'custom-mahjong-icon',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
})

// Component to recenter map when location changes
function ChangeView({ center }) {
  const map = useMap()
  if (center) map.setView(center)
  return null
}

export default function Map() {
  const [users, setUsers] = useState([])
  const [center, setCenter] = useState([22.3193, 114.1694]) // Default to Hong Kong
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get current user location first
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCenter([latitude, longitude])
        fetchUsers()
      },
      (error) => {
        console.error('Error getting location:', error)
        // Fallback to default center but still fetch users
        fetchUsers()
      }
    )
  }, [])

  const fetchUsers = async () => {
    try {
      // Get all online users with coordinates
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_online', true)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-20">
      <div className="p-4 bg-white shadow-sm z-10 relative">
        <h1 className="text-xl font-bold text-center text-gray-800">附近雀友地圖</h1>
        <p className="text-xs text-center text-gray-500 mt-1">
          {loading ? '載入中...' : `共發現 ${users.length} 位在線雀友`}
        </p>
      </div>

      <div className="flex-1 w-full relative z-0">
        <MapContainer
          center={center}
          zoom={13}
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ChangeView center={center} />
          
          {users.map((user) => (
            <Marker
              key={user.id}
              position={[user.latitude, user.longitude]}
              icon={mahjongIcon}
            >
              <Popup className="rounded-xl">
                <div className="text-center p-1">
                  <div className="font-bold text-lg mb-1">{user.username || '神秘雀友'}</div>
                  {user.mahjong_styles && user.mahjong_styles.length > 0 && (
                    <div className="text-xs text-gray-600 mb-2">
                      玩法: {user.mahjong_styles.join(', ')}
                    </div>
                  )}
                  {user.contact_info && (
                    <div className="text-sm bg-green-50 text-green-700 p-2 rounded-lg break-all">
                      {user.contact_info}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}