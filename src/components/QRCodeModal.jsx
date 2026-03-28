import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { X, QrCode as QrIcon, ScanLine } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { LocalNotifications } from '@capacitor/local-notifications';

export default function QRCodeModal({ user, onClose, onMatchStarted }) {
  const [tab, setTab] = useState('show'); // 'show' 或 'scan'
  const [loading, setLoading] = useState(false);
  const [isClashing, setIsClashing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const scannerContainerRef = useRef(null);

  // 監聽相機載入狀態並隱藏 Android WebView 預設的播放按鈕
  useEffect(() => {
    if (tab !== 'scan' || loading) {
      setCameraReady(false);
      return;
    }

    const handlePlaying = () => setCameraReady(true);

    const patchVideo = (video) => {
      if (!video || video.dataset.patched) return;
      video.dataset.patched = 'true';
      // 設置透明 poster 以覆蓋 Android WebView 預設的播放按鈕
      video.setAttribute('poster', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
      video.addEventListener('playing', handlePlaying);
      if (!video.paused && video.readyState > 2) {
        setCameraReady(true);
      }
    };

    const observer = new MutationObserver(() => {
      if (scannerContainerRef.current) {
        patchVideo(scannerContainerRef.current.querySelector('video'));
      }
    });

    if (scannerContainerRef.current) {
      observer.observe(scannerContainerRef.current, { childList: true, subtree: true });
      patchVideo(scannerContainerRef.current.querySelector('video'));
    }

    return () => {
      observer.disconnect();
      if (scannerContainerRef.current) {
        const video = scannerContainerRef.current.querySelector('video');
        if (video) {
          video.removeEventListener('playing', handlePlaying);
          // 清除 patched 標記，以便下次重新綁定
          delete video.dataset.patched;
        }
      }
    };
  }, [tab, loading]);

  // 監聽自己的狀態變化，如果被別人掃描並進入「playing」狀態，也觸發動畫和成功提示
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`public:profiles:id=eq.${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new.play_status === 'playing' && payload.old.play_status !== 'playing') {
            // 被別人掃描並開局成功！
            setIsClashing(true);
            if (window.navigator && window.navigator.vibrate) {
              window.navigator.vibrate([200, 100, 200]); // 震動回饋
            }
            
            setTimeout(() => {
              window.customAlert("成功確認到達！已進入牌局狀態，兩分鐘後將自動結束。", '系統提示', () => {
                onMatchStarted();
              });
            }, 800);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, onMatchStarted]);

  const handleScan = async (scannedData) => {
    if (!scannedData || loading) return;
    
    try {
      // 兼容不同版本的 scanner 回傳格式
      const result = Array.isArray(scannedData) ? scannedData[0] : scannedData;
      const rawValue = result?.rawValue || result?.text;
      
      if (!rawValue) return;
      
      setLoading(true);
      
      let scannedUserId;
      try {
        // 嘗試解析 JSON 格式
        const parsedData = JSON.parse(rawValue);
        scannedUserId = parsedData.userId || parsedData.id || parsedData;
      } catch (_e) {
        // 如果不是 JSON，則假設整個字串就是 userId (舊版或純文字格式)
        scannedUserId = rawValue;
      }
      
      if (typeof scannedUserId !== 'string' || scannedUserId.trim() === '') {
        throw new Error('無法取得有效的用戶 ID');
      }

      if (scannedUserId === user.id) {
        window.customAlert("不能掃描自己的 QR Code！");
        setLoading(false);
        return;
      }

      // 1. 建立牌局
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .insert([{}])
        .select()
        .single();
      
      if (matchError) throw matchError;

      // 2. 加入雙方玩家
      const { error: playersError } = await supabase
        .from('match_players')
        .insert([
          { match_id: matchData.id, user_id: user.id },
          { match_id: matchData.id, user_id: scannedUserId }
        ]);

      if (playersError) throw playersError;

      // 3. 更新雙方狀態為「牌局中」，時間設為 2 分鐘後
      const playUntil = new Date();
      playUntil.setMinutes(playUntil.getMinutes() + 2);

      await supabase.from('profiles').update({
        play_status: 'playing',
        play_until: playUntil.toISOString(),
      }).in('id', [user.id, scannedUserId]);

      // 預約 2 分鐘後的本地通知
      try {
        const permStatus = await LocalNotifications.checkPermissions();
        if (permStatus.display === 'granted') {
          await LocalNotifications.schedule({
            notifications: [
              {
                title: "已退出對局狀態",
                body: "別忘了到歷史對局為雀友留下評價哦！",
                id: Math.floor(Date.now() / 1000), // id must be integer
                schedule: { at: playUntil },
              }
            ]
          });
        }
      } catch(e) {
        console.warn('Local notifications not supported or failed', e);
      }

      // 觸發碰撞動畫
      setIsClashing(true);
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([200, 100, 200]); // 震動回饋
      }
      
      setTimeout(() => {
        window.customAlert("成功確認到達！已進入牌局狀態，兩分鐘後將自動結束。", '系統提示', () => {
          onMatchStarted();
        });
      }, 800);
      
    } catch (error) {
      console.error('Error starting match:', error);
      const rawText = scannedData && scannedData[0] ? scannedData[0].rawValue : JSON.stringify(scannedData);
      window.customAlert(`掃描失敗，請確定這是一個有效的雀友 QR Code。\n錯誤內容: ${error.message}\n掃描資料: ${rawText}`);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className={`bg-[#F5F4EE] border-4 border-black rounded-md w-full max-w-sm overflow-hidden shadow-brutal transition-transform ${isClashing ? 'animate-clash' : ''}`}>
        <div className="flex justify-between items-center p-4 border-b-4 border-black bg-white">
          <h2 className="text-xl font-black tracking-widest">確認到達</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-200 border-2 border-transparent hover:border-black transition-all">
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        <div className="flex border-b-4 border-black bg-white">
          <button 
            className={`flex-1 py-4 font-black tracking-widest flex items-center justify-center gap-2 ${tab === 'show' ? 'text-green-600 bg-green-50 border-b-4 border-green-600' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setTab('show')}
          >
            <QrIcon size={20} /> 我的 QR
          </button>
          <button 
            className={`flex-1 py-4 font-black tracking-widest flex items-center justify-center gap-2 ${tab === 'scan' ? 'text-green-600 bg-green-50 border-b-4 border-green-600' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setTab('scan')}
          >
            <ScanLine size={20} /> 掃描對方
          </button>
        </div>

        <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
          {isClashing ? (
            <div className="w-full relative rounded-md border-4 border-black overflow-hidden bg-black aspect-square flex items-center justify-center shadow-brutal-sm">
              <div className="text-green-400 font-black text-2xl animate-neon flex flex-col items-center gap-4">
                <div className="flex gap-2">
                  <span className="text-5xl">🀄</span>
                  <span className="text-5xl">🀄</span>
                </div>
                開局成功！
              </div>
            </div>
          ) : tab === 'show' ? (
            <div className="flex flex-col items-center text-center">
              <div className="bg-white p-4 rounded-md border-4 border-black shadow-brutal-sm">
                <QRCodeSVG value={JSON.stringify({ userId: user.id })} size={200} />
              </div>
              <p className="mt-6 text-sm font-bold tracking-widest text-gray-600">請讓已經到達的雀友掃描此 QR Code</p>
            </div>
          ) : (
            <div ref={scannerContainerRef} className="w-full relative rounded-md border-4 border-black overflow-hidden bg-black aspect-square flex items-center justify-center shadow-brutal-sm">
              {loading ? (
                <div className="text-white font-black tracking-widest animate-pulse">處理中...</div>
              ) : (
                <>
                  {!cameraReady && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black">
                      <div className="animate-spin text-5xl mb-4">🀄</div>
                      <div className="text-white font-black tracking-widest animate-pulse">相機啟動中...</div>
                    </div>
                  )}
                  <Scanner 
                    onScan={handleScan} 
                    onError={(error) => {
                      console.error('Scanner error:', error);
                      if (error?.message?.includes('Permission') || error?.name === 'NotAllowedError') {
                        window.customAlert('無法開啟相機，請確保您已允許瀏覽器或應用程式使用相機權限！');
                      }
                    }}
                    components={{ audio: false, finder: false }}
                    allowMultiple={true}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}