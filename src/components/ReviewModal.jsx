import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-bold text-center mb-2">牌局結束</h2>
        <p className="text-center text-gray-500 text-sm mb-6">請為雀友 <span className="font-bold text-black">{targetUser?.username || '神秘雀友'}</span> 留下評價</p>
        
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700">牌速</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={`speed-${star}`} onClick={() => setSpeedRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                  <Star size={24} className={`${star <= speedRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700">牌技</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={`skill-${star}`} onClick={() => setSkillRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                  <Star size={24} className={`${star <= skillRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700">牌品</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={`manner-${star}`} onClick={() => setMannerRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                  <Star size={24} className={`${star <= mannerRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">其他評價 (選填)</label>
          <textarea 
            className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
            rows="3"
            placeholder="這位雀友打牌風格如何？"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          ></textarea>
        </div>
        
        <button 
          onClick={handleSubmit}
          disabled={submitting}
          className={`w-full py-3 rounded-xl font-bold text-white shadow-md transition-colors ${submitting ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'}`}
        >
          {submitting ? '提交中...' : '提交評價'}
        </button>
      </div>
    </div>
  );
}