import { useState, useEffect } from 'react'
import { Users, Zap, QrCode, Radio, User, Handshake, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import QRCodeModal from '../components/QRCodeModal'
import UserProfileModal from '../components/UserProfileModal'
import { isAfter } from 'date-fns'
import { Geolocation } from '@capacitor/geolocation'

export default function Home() {
  const [isOnline, setIsOnline] = useState(false)
  const [playStatus, setPlayStatus] = useState('none') // 'none' or 'playing'
  const [, setPlayUntil] = useState(null)
  const [nearbyUsers, setNearbyUsers] = useState([])
  const [loading, setLoading] = useState(true) // 預設為 true，等待首次檢查狀態
  const [user, setUser] = useState(null)
  
  // Modals state
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

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
            
            // 通知用戶留評價
            if ('Notification' in window) {
              Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                  new Notification('牌局已結束', { body: '別忘了到「歷史牌局」為剛才的雀友留下評價喔！' });
                } else {
                  alert('牌局已結束！別忘了到「歷史牌局」為剛才的雀友留下評價喔！');
                }
              });
            } else {
              alert('牌局已結束！別忘了到「歷史牌局」為剛才的雀友留下評價喔！');
            }
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
        } else {
          setLoading(false) // 如果沒上線，就結束 loading 狀態
        }
      }
    } catch (err) {
      console.error('Error checking status:', err)
      setLoading(false)
    }
  }

  const fetchNearbyUsers = async (lat, long, currentUserId) => {
    try {
      let users = [];
      
      // 直接取得所有在線且非遊玩中的玩家
      const { data: profiles, error: profileErr } = await supabase
        .from('profiles')
        .select('id, username, latitude, longitude, contact_info, play_status, is_online')
        .eq('is_online', true)
        .neq('play_status', 'playing');

      if (!profileErr && profiles) {
        const calcDist = (lat1, lon1, lat2, lon2) => {
          if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
          const R = 6371e3;
          const dLat = (lat2-lat1) * Math.PI/180;
          const dLon = (lon2-lon1) * Math.PI/180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        };
        users = profiles.map(u => ({
          ...u,
          distance_meters: calcDist(lat, long, u.latitude, u.longitude)
        }));
      }

      if (currentUserId) {
        users = users.filter(u => u.id !== currentUserId);
      }
      
      // 排序：距離近到遠 (未知的會因為 Infinity 排到最後)
      users.sort((a, b) => a.distance_meters - b.distance_meters);
      let topUsers = users; // 顯示全部在線的人

      // 2. 抓取真實評價與聯絡方式取代 Placeholder
      if (topUsers.length > 0) {
        const userIds = topUsers.map(u => u.id);
        const [ { data: reviewsData }, { data: contactsData } ] = await Promise.all([
          supabase.from('reviews').select('reviewee_id, speed_rating, skill_rating, manner_rating').in('reviewee_id', userIds),
          supabase.from('profiles').select('id, contact_info').in('id', userIds)
        ]);

        topUsers = topUsers.map(u => {
          let speed = '-', skill = '-', manner = '-';
          if (reviewsData) {
            const ur = reviewsData.filter(r => r.reviewee_id === u.id);
            if (ur.length > 0) {
              speed = (ur.reduce((s, r) => s + r.speed_rating, 0) / ur.length).toFixed(1);
              skill = (ur.reduce((s, r) => s + r.skill_rating, 0) / ur.length).toFixed(1);
              manner = (ur.reduce((s, r) => s + r.manner_rating, 0) / ur.length).toFixed(1);
            }
          }
          let contact = u.contact_info;
          if (!contact && contactsData) {
            const c = contactsData.find(c => c.id === u.id);
            if (c) contact = c.contact_info;
          }
          return { ...u, speed_rating: speed, skill_rating: skill, manner_rating: manner, contact_info: contact };
        });
      }

      setNearbyUsers(topUsers);
    } catch (err) {
      console.error('Error fetching nearby users:', err);
      setNearbyUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let intervalId;
    let subscription;

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        checkUserStatus(user.id)
        
        // 定期檢查狀態 (每分鐘)
        intervalId = setInterval(() => {
          checkUserStatus(user.id)
        }, 60000)

        // 訂閱資料庫變更 (即時同步對方掃描結果)
        subscription = supabase
          .channel('profile_changes')
          .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'profiles',
            filter: `id=eq.${user.id}` 
          }, (payload) => {
            if (payload.new.play_status === 'playing') {
              setShowQRModal(prev => {
                if (prev) {
                  // 如果被掃描方正開著 QR 視窗，顯示成功提示
                  alert('對方已成功掃描您的 QR Code！雙方已同步進入牌局。');
                }
                return false; // 關閉 QR 視窗
              });
            }
            // 重新抓取最新狀態以更新畫面
            checkUserStatus(user.id);
          })
          .subscribe();
      }
    })
    
    return () => {
      if (intervalId) clearInterval(intervalId)
      if (subscription) supabase.removeChannel(subscription)
    }
  }, [])

  const updateLocation = async (status) => {
    if (!user) return

    setLoading(true)
    try {
      if (status) {
        try {
          let latitude, longitude;
          
          // 1. 先嘗試 Capacitor Native 權限請求 (僅在 Native 環境有效，Web 會拋錯被忽略)
          try {
            const checkPerms = await Geolocation.checkPermissions();
            if (checkPerms.location !== 'granted') {
              await Geolocation.requestPermissions();
            }
          } catch (permErr) {
            console.warn('Capacitor permissions API not fully supported (likely Web), proceeding to browser prompt');
          }

          // 2. 建立原生瀏覽器 Geolocation Promise (這是最能穩定觸發網頁版彈窗的方法)
          const getWebPosition = () => new Promise((resolve, reject) => {
            if (navigator.geolocation) {
              // 網頁版需要給予足夠的時間讓用戶點擊「允許」，timeout 設為 15000 (15秒)
              navigator.geolocation.getCurrentPosition(resolve, reject, { 
                enableHighAccuracy: true, 
                timeout: 15000, 
                maximumAge: 0 
              });
            } else {
              reject(new Error('Browser does not support HTML5 geolocation'));
            }
          });

          try {
            // 優先使用原生 API (適用於網頁版與部分 PWA)
            const pos = await getWebPosition();
            latitude = pos.coords.latitude;
            longitude = pos.coords.longitude;
          } catch (webErr) {
            console.warn('Web geolocation failed or timed out, trying Capacitor API:', webErr);
            try {
              // 備用方案：使用 Capacitor API (適用於 APK 或原生環境)
              const capPos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
              latitude = capPos.coords.latitude;
              longitude = capPos.coords.longitude;
            } catch (posErr) {
              console.warn('Failed to get real position from both Web and Capacitor, trying IP fallback:', posErr)
              try {
                // 使用 IP 定位作為桌面版/無權限時的動態 Fallback，避免寫死單一城市
                const ipRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
                if (!ipRes.ok) throw new Error('IP Fetch failed');
                const ipData = await ipRes.json();
                if (ipData.latitude && ipData.longitude) {
                  latitude = parseFloat(ipData.latitude);
                  longitude = parseFloat(ipData.longitude);
                } else {
                  throw new Error('Invalid IP data');
                }
              } catch (ipErr) {
                console.error('IP fallback failed:', ipErr)
                throw new Error('無法獲取真實位置，請確保瀏覽器或設備已開啟定位權限。')
              }
            }
          }
          
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
        } catch (error) {
          console.error('Error getting location:', error)
          alert('無法獲取位置，請允許定位權限')
          setLoading(false)
        }
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
    <div className="flex flex-col min-h-screen bg-[#F5F4EE] pb-24 px-4 pt-6 font-sans text-gray-900">
      <div className="flex items-center justify-center mb-8 border-b-2 border-black pb-4">
        <div className="border-2 border-black rounded p-1 mr-3 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <span className="font-black text-xl leading-none block text-green-600">發</span>
        </div>
        <h1 className="text-2xl font-black tracking-widest">MAHJONG FINDER</h1>
      </div>

      {playStatus === 'playing' ? (
        <div className="w-full bg-white p-6 rounded-xl border-2 border-black flex flex-col items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="w-16 h-16 border-2 border-black bg-[#F5F4EE] rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl font-black text-red-600">中</span>
          </div>
          <h2 className="text-xl font-bold mb-2">牌局進行中</h2>
          <p className="text-sm text-center font-medium">您目前正在牌局中，地圖已將您隱藏。<br/>牌局結束後，系統會通知您為雀友留下評價。</p>
        </div>
      ) : (
        <>
          <button
            onClick={toggleOnline}
            disabled={loading}
            className={`w-full border-2 border-black rounded-xl py-5 flex items-center justify-center transition-all duration-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 ${
              isOnline
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-50'
            } ${loading ? 'opacity-70 cursor-wait' : ''}`}
          >
            {loading ? (
              <span className="text-2xl mr-2 animate-spin">🀄</span>
            ) : (
              <Radio size={24} className={`mr-2 ${isOnline ? 'animate-pulse' : ''}`} />
            )}
            <span className="text-xl font-bold tracking-wide">
              {loading ? '洗牌中...' : isOnline ? '已上線' : '((o)) 點擊上線'}
            </span>
          </button>
          
          <div className={`text-center mt-3 font-bold text-sm tracking-widest ${isOnline ? 'text-black' : 'text-red-600'}`}>
            {isOnline ? '目前在線' : '目前離線'}
          </div>

          {isOnline && (
            <button 
              onClick={() => setShowQRModal(true)}
              className="mt-6 w-full bg-white text-black font-bold py-3 px-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex justify-center items-center gap-2 hover:bg-gray-50 transition-all active:translate-y-1 active:shadow-none"
            >
              <QrCode size={20} />
              到達對局 (掃描/顯示 QR)
            </button>
          )}

          {isOnline && (
            <div className="mt-8 w-full">
              <h2 className="font-bold text-lg mb-4 flex items-center">
                在綫的人 ({nearbyUsers.length})
              </h2>

              {nearbyUsers.length === 0 ? (
                <div className="text-center py-8 font-bold text-gray-500 border-2 border-black border-dashed rounded-xl bg-white">
                  暫時無人在線...
                </div>
              ) : (
                <div className="space-y-4">
                  {nearbyUsers.map((u) => (
                    <div
                      key={u.id}
                      className="bg-white border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 border-2 border-black rounded-full flex items-center justify-center bg-[#F5F4EE]">
                            <User size={24} />
                          </div>
                          <div>
                            <div className="font-bold text-lg leading-tight">{u.username || '神秘雀友'}</div>
                            <div className="text-xs font-bold mt-1">
                              {u.distance_meters === Infinity ? '距離未知' : `距離 ${u.distance_meters > 1000 ? (u.distance_meters/1000).toFixed(1) + 'km' : Math.round(u.distance_meters) + 'm'}`}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 評價區塊 (真實數據) */}
                      <div className="flex justify-between items-center my-4 py-3 border-y-2 border-black">
                        <div className="flex-1 text-center">
                          <div className="flex justify-center mb-1"><Zap size={20} /></div>
                          <div className="text-[10px] font-bold tracking-wider">牌速: {u.speed_rating || '-'}</div>
                        </div>
                        <div className="w-[2px] h-8 bg-black"></div>
                        <div className="flex-1 text-center">
                          <div className="flex justify-center mb-1">
                            <span className="font-black text-lg leading-none text-red-600" style={{height: '20px'}}>中</span>
                          </div>
                          <div className="text-[10px] font-bold tracking-wider">牌技: {u.skill_rating || '-'}</div>
                        </div>
                        <div className="w-[2px] h-8 bg-black"></div>
                        <div className="flex-1 text-center">
                          <div className="flex justify-center mb-1"><Handshake size={20} /></div>
                          <div className="text-[10px] font-bold tracking-wider">牌品: {u.manner_rating || '-'}</div>
                        </div>
                      </div>

                      {/* 聯絡資訊直接顯示 */}
                      <div className="bg-[#F5F4EE] border-2 border-black rounded-lg p-3 mb-4 text-sm font-bold">
                        <div className="text-gray-500 text-xs mb-1">聯絡方式</div>
                        <div className="break-words">{u.contact_info || '尚未提供'}</div>
                      </div>

                      <button 
                        onClick={() => setSelectedUser(u)}
                        className="w-full border-2 border-black rounded-lg py-2 font-bold tracking-wider hover:bg-black hover:text-white transition-colors active:translate-y-[2px] bg-white"
                      >
                        查看玩家評價
                      </button>
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

      {selectedUser && (
        <UserProfileModal 
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

    </div>
  )
}