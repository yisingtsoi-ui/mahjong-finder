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
          <h2 className="text-xl font-black mb-3 bg-black text-white inline-block px-3 py-1">1. 收集的個人資料</h2>
          <p className="font-bold leading-relaxed mb-2">為了提供 Mahjong Finder（以下簡稱「本應用」）的核心功能，我們會收集以下資訊：</p>
          <ul className="list-disc pl-5 font-bold space-y-2">
            <li><span className="text-blue-600">帳號與個人檔案</span>：電子郵件地址、暱稱、頭像及您主動提供的個人簡介。</li>
            <li><span className="text-blue-600">位置資訊 (GPS)</span>：本應用的核心配對功能需要存取您的精確或大約位置資訊，以於地圖上顯示附近的使用者。您的位置座標會經過模糊化處理（不顯示確切地址），且僅在您使用地圖功能時進行存取。</li>
            <li><span className="text-blue-600">相機與相片庫</span>：僅用於掃描 QR Code 進行當面配對，或供您上傳個人頭像。我們不會在未經同意的情況下存取您的相片，亦不會將掃描過程的影像儲存或上傳至伺服器。</li>
            <li><span className="text-blue-600">評價資料</span>：您與其他使用者對局後產生的牌速、牌技、牌品等評價紀錄。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-black mb-3 bg-black text-white inline-block px-3 py-1">2. 資料的使用方式</h2>
          <p className="font-bold leading-relaxed">
            我們收集的資訊僅用於以下用途：建立並維護您的使用者帳號、在地圖上配對附近玩家、顯示個人名片與評價分數、以及提供客戶服務。我們<span className="text-red-600 font-black">絕對不會</span>將您的個人資料出售給任何第三方廣告商或資料仲介。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black mb-3 bg-black text-white inline-block px-3 py-1">3. 第三方服務供應商</h2>
          <p className="font-bold leading-relaxed">
            為了提供穩定與安全的服務，本應用會將部分資料交由受信任的第三方服務處理（如 Supabase 作為我們的雲端資料庫與身分驗證提供商）。這些第三方服務均受到嚴格的資料處理協議約束，不得將您的資料用於提供本應用服務以外的任何用途。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black mb-3 bg-black text-white inline-block px-3 py-1">4. 資料安全與保留</h2>
          <p className="font-bold leading-relaxed">
            我們採取了符合業界標準的安全措施（如傳輸層加密）來保護您的個人資料。我們將在您維持帳號有效期間保留您的資料。當您刪除帳號時，您的個人資料與相關關聯將會被永久移除或匿名化處理。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black mb-3 bg-black text-white inline-block px-3 py-1">5. 兒童隱私保護</h2>
          <p className="font-bold leading-relaxed">
            本應用不適合未滿 13 歲（或您所在司法管轄區的法定成年年齡）之兒童使用。我們不會在知情的情況下收集兒童的個人資料。若發現不慎收集，我們將立即採取步驟將其刪除。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black mb-3 bg-black text-white inline-block px-3 py-1">6. 使用者權利與資料刪除</h2>
          <p className="font-bold leading-relaxed">
            依據相關隱私權法規，您可以隨時在應用內的「個人名片」點擊「編輯名片」，然後選擇「刪除帳號」，系統將立即且不可逆地永久刪除您的帳號與所有相關個人資訊。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black mb-3 bg-black text-white inline-block px-3 py-1">7. 兒童安全與 CSAE 防範標準</h2>
          <p className="font-bold leading-relaxed">
            我們對任何形式的兒童性虐待與剝削 (CSAE) 採取零容忍政策。我們強烈禁止發布或分享任何相關內容。若發現違規，我們將立即封鎖帳號並通報相關執法單位。詳細政策請參閱我們的<a href="/safety" className="text-blue-600 underline">安全標準與防範政策</a>。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black mb-3 bg-black text-white inline-block px-3 py-1">8. 聯絡我們</h2>
          <p className="font-bold leading-relaxed">
            如果您對本隱私權政策或資料處理方式有任何疑問，請透過以下方式與我們聯繫：<br />
            <span className="text-blue-600 mt-2 inline-block">電子郵件：mahjongfinder@gmail.com</span><br />
          </p>
        </section>
        
        <div className="text-sm font-bold text-gray-500 text-center mt-8 pt-4 border-t-2 border-black border-dashed">
          最後更新日期：2026年3月29日
        </div>
      </div>
    </div>
  );
}
