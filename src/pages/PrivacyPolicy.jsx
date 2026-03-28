import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5F4EE] pb-24 p-4 font-sans text-black">
      <div className="flex items-center mb-6 mt-4 border-b-2 border-black pb-4">
        <button 
          onClick={() => navigate(-1)} 
          className="mr-4 p-2 bg-white border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-black tracking-widest">隱私權政策</h1>
      </div>

      <div className="bg-white rounded-md border-2 border-black shadow-tile p-6 space-y-6">
        <section>
          <h2 className="text-xl font-black mb-3 bg-black text-white inline-block px-3 py-1">1. 資料收集</h2>
          <p className="font-bold leading-relaxed mb-2">為了提供更佳的配對體驗，Mahjong Finder (以下簡稱「本應用」) 會收集以下資訊：</p>
          <ul className="list-disc pl-5 font-bold space-y-2">
            <li><span className="text-blue-600">電子郵件地址</span>：用於帳號註冊與驗證。</li>
            <li><span className="text-blue-600">位置資訊 (GPS)</span>：用於在地圖上顯示附近的雀友。我們會對位置進行模糊化處理以保護您的隱私。</li>
            <li><span className="text-blue-600">相機權限</span>：僅用於掃描 QR Code 進行雀友配對，不會儲存或上傳任何影像。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-black mb-3 bg-black text-white inline-block px-3 py-1">2. 資料使用</h2>
          <p className="font-bold leading-relaxed">
            我們收集的資訊僅用於本應用內的功能運作，包含但不限於：尋找附近玩家、配對對局、顯示個人名片與評價。我們<span className="text-red-600 font-black">絕對不會</span>將您的個人資料出售給任何第三方。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black mb-3 bg-black text-white inline-block px-3 py-1">3. 資料刪除</h2>
          <p className="font-bold leading-relaxed">
            您有權隨時刪除您的帳號及相關資料。您可以在本應用的「個人名片」頁面中點擊「編輯名片」，然後選擇「刪除帳號」來永久移除您的所有記錄。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black mb-3 bg-black text-white inline-block px-3 py-1">4. 聯絡我們</h2>
          <p className="font-bold leading-relaxed">
            如果您對本隱私權政策有任何疑問，歡迎透過應用內的意見回饋功能與我們聯繫。
          </p>
        </section>
        
        <div className="text-sm font-bold text-gray-500 text-center mt-8 pt-4 border-t-2 border-black border-dashed">
          最後更新日期：2026年3月29日
        </div>
      </div>
    </div>
  );
}
