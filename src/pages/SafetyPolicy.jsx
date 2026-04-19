import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SafetyPolicy() {
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
        <h1 className="text-2xl font-black tracking-widest">安全標準與防範政策</h1>
      </div>

      <div className="bg-white rounded-md border-2 border-black shadow-tile p-6 space-y-6">
        <section>
          <h2 className="text-xl font-black mb-3 bg-black text-white inline-block px-3 py-1">1. 零容忍政策 (Zero Tolerance)</h2>
          <p className="font-bold leading-relaxed">
            Mahjong Finder（以下簡稱「本應用」）對於任何形式的兒童性虐待與剝削 (CSAE) 採取嚴格的<span className="text-red-600 font-black">零容忍政策</span>。我們堅決反對並禁止使用者在平台上發布、分享、或宣傳任何涉及未成年人不當、色情、或剝削的內容。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black mb-3 bg-black text-white inline-block px-3 py-1">2. 內容監控與處置</h2>
          <p className="font-bold leading-relaxed">
            若我們發現或接獲舉報，指出任何帳號涉嫌違反兒童安全標準，我們將立即採取以下行動：
          </p>
          <ul className="list-disc pl-5 font-bold space-y-2 mt-2">
            <li>立即永久停權並刪除該違規帳號。</li>
            <li>保留相關證據與紀錄。</li>
            <li>依法向相關執法機關通報並全力配合調查。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-black mb-3 bg-black text-white inline-block px-3 py-1">3. 使用者檢舉機制</h2>
          <p className="font-bold leading-relaxed">
            保護社群安全是我們的首要任務。如果您在本應用中發現任何可疑或違反兒童安全的行為，請立即透過以下方式向我們舉報。我們將在 24 小時內優先處理您的檢舉。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black mb-3 bg-black text-white inline-block px-3 py-1">4. 聯絡與舉報管道</h2>
          <p className="font-bold leading-relaxed">
            負責團隊：Mahjong Finder 信任與安全團隊<br />
            <span className="text-blue-600 mt-2 inline-block">檢舉與聯絡信箱：mahjongfinder@gmail.com</span><br />
          </p>
        </section>
      </div>
    </div>
  );
}