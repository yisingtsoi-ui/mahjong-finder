import React, { useState } from 'react';
import { X, Zap, Handshake, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ReviewModal({ match, currentUser, targetUser, onClose, onSubmit }) {
  const [speedRating, setSpeedRating] = useState(5);
  const [skillRating, setSkillRating] = useState(5);
  const [mannerRating, setMannerRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    
    try {
      const { error } = await supabase.from('reviews').insert([{
        reviewer_id: currentUser.id,
        reviewee_id: targetUser.id,
        match_id: match.id,
        speed_rating: speedRating,
        skill_rating: skillRating,
        manner_rating: mannerRating,
        comment
      }]);

      if (error) throw error;
      
      alert('感謝您的評分！');
      onSubmit();
    } catch (error) {
      console.error('Submit review error:', error);
      alert('提交失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 font-sans text-black">
      <div className="bg-[#F5F4EE] border-4 border-black rounded-xl w-full max-w-sm p-6 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <button onClick={onClose} className="absolute right-4 top-4 text-black hover:scale-110 transition-transform">
          <X size={24} strokeWidth={3} />
        </button>
        
        <h2 className="text-2xl font-black text-center mb-2 tracking-widest">牌局結束</h2>
        <p className="text-center text-black font-bold text-sm mb-6 border-b-2 border-black pb-4">
          請為雀友 <span className="text-xl mx-1 underline decoration-2 underline-offset-4">{targetUser?.username || '神秘雀友'}</span> 留下評價
        </p>
        
        <div className="space-y-6 mb-8">
          <div className="flex items-center justify-between">
            <span className="font-black flex items-center gap-2 text-lg"><Zap size={20} /> 牌速</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={`speed-${star}`} onClick={() => setSpeedRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                  <Star size={24} strokeWidth={star <= speedRating ? 0 : 2} className={`${star <= speedRating ? 'fill-black text-black' : 'text-black'}`} />
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="font-black flex items-center gap-2 text-lg">
              <span className="font-black leading-none flex items-center justify-center w-5 h-5 text-[20px]">中</span> 牌技
            </span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={`skill-${star}`} onClick={() => setSkillRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                  <Star size={24} strokeWidth={star <= skillRating ? 0 : 2} className={`${star <= skillRating ? 'fill-black text-black' : 'text-black'}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-black flex items-center gap-2 text-lg"><Handshake size={20} /> 牌品</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={`manner-${star}`} onClick={() => setMannerRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                  <Star size={24} strokeWidth={star <= mannerRating ? 0 : 2} className={`${star <= mannerRating ? 'fill-black text-black' : 'text-black'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-black mb-2 tracking-widest">其他評價 (選填)</label>
          <textarea 
            className="w-full bg-white border-2 border-black rounded-lg p-3 text-black font-medium focus:ring-0 focus:outline-none resize-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            rows="3"
            placeholder="這位雀友打牌風格如何？"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          ></textarea>
        </div>
        
        <button 
          onClick={handleSubmit}
          disabled={submitting}
          className={`w-full py-4 rounded-xl font-black text-lg tracking-widest border-2 border-black transition-all active:translate-y-[2px] active:shadow-none ${submitting ? 'bg-gray-300 text-gray-500 shadow-none' : 'bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white'}`}
        >
          {submitting ? '提交中...' : '提交評價'}
        </button>
      </div>
    </div>
  );
}