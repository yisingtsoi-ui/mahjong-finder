import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { X, QrCode as QrIcon, ScanLine } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { LocalNotifications } from '@capacitor/local-notifications';

export default function QRCodeModal({ user, onClose, onMatchStarted }) {
  const [tab, setTab] = useState('show'); // 'show' 或 'scan'
  const [loading, setLoading] = useState(false);
  const [isClashing, setIsClashing] = useState(false);

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
                title: "牌局已結束",
                body: "別忘了到「歷史牌局」為剛才的雀友留下評價喔！",
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
            <QrCode size={20} /> 我的 QR
          </button>
          <button 
            className={`flex-1 py-4 font-black tracking-widest flex items-center justify-center gap-2 ${tab === 'scan' ? 'text-green-600 bg-green-50 border-b-4 border-green-600' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setTab('scan')}
          >
            <ScanLine size={20} /> 掃描對方
          </button>
        </div>

        <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
          {tab === 'show' ? (
            <div className="flex flex-col items-center text-center">
              <div className="bg-white p-4 rounded-md border-4 border-black shadow-brutal-sm">
                <QRCodeSVG value={JSON.stringify({ userId: user.id })} size={200} />
              </div>
              <p className="mt-6 text-sm font-bold tracking-widest text-gray-600">請讓已經到達的雀友掃描此 QR Code</p>
            </div>
          ) : (
            <div className="w-full relative rounded-md border-4 border-black overflow-hidden bg-black aspect-square flex items-center justify-center shadow-brutal-sm">
              {isClashing ? (
                <div className="text-green-400 font-black text-2xl animate-neon flex flex-col items-center gap-4">
                  <div className="flex gap-2">
                    <span className="text-5xl">🀄</span>
                    <span className="text-5xl">🀄</span>
                  </div>
                  開局成功！
                </div>
              ) : loading ? (
                <div className="text-white font-black tracking-widest animate-pulse">處理中...</div>
              ) : (
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
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}