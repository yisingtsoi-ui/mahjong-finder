import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { X, QrCode, ScanLine } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function QRCodeModal({ user, onClose, onMatchStarted }) {
  const [tab, setTab] = useState('show'); // 'show' 或 'scan'
  const [loading, setLoading] = useState(false);

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
        alert("不能掃描自己的 QR Code！");
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

      // 3. 更新雙方狀態為「牌局中」，時間設為 2 分鐘後 (測試用)
      const playUntil = new Date();
      playUntil.setMinutes(playUntil.getMinutes() + 2); // 將 getHours 改為 getMinutes，並設為 2 分鐘

      await supabase.from('profiles').update({
        play_status: 'playing',
        play_until: playUntil.toISOString(),
      }).in('id', [user.id, scannedUserId]);

      alert("成功確認到達！已進入牌局狀態，兩分鐘後將自動結束 (測試模式)。");
      onMatchStarted();
    } catch (error) {
      console.error('Error starting match:', error);
      const rawText = scannedData && scannedData[0] ? scannedData[0].rawValue : JSON.stringify(scannedData);
      alert(`掃描失敗，請確定這是一個有效的雀友 QR Code。\n錯誤內容: ${error.message}\n掃描資料: ${rawText}`);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold">確認到達</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b">
          <button 
            className={`flex-1 py-3 font-medium flex items-center justify-center gap-2 ${tab === 'show' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'}`}
            onClick={() => setTab('show')}
          >
            <QrCode size={18} /> 我的 QR Code
          </button>
          <button 
            className={`flex-1 py-3 font-medium flex items-center justify-center gap-2 ${tab === 'scan' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'}`}
            onClick={() => setTab('scan')}
          >
            <ScanLine size={18} /> 掃描對方
          </button>
        </div>

        <div className="p-6 flex flex-col items-center justify-center min-h-[300px]">
          {tab === 'show' ? (
            <div className="flex flex-col items-center text-center">
              <div className="bg-white p-4 rounded-xl shadow-inner border">
                <QRCodeSVG value={JSON.stringify({ userId: user.id })} size={200} />
              </div>
              <p className="mt-4 text-sm text-gray-500">請讓已經到達的雀友掃描此 QR Code</p>
            </div>
          ) : (
            <div className="w-full relative rounded-xl overflow-hidden bg-black aspect-square flex items-center justify-center">
              {loading ? (
                <div className="text-white">處理中...</div>
              ) : (
                <Scanner 
                  onScan={handleScan} 
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