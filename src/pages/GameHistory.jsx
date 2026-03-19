import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { History, Star, Clock } from 'lucide-react';
import ReviewModal from '../components/ReviewModal';

export default function GameHistory() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  const [reviewMatch, setReviewMatch] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchHistory(user.id);
      }
    });
  }, []);

  const fetchHistory = async (userId) => {
    try {
      setLoading(true);
      // 1. 獲取用戶參與過的所有牌局
      const { data: myMatches, error: matchError } = await supabase
        .from('match_players')
        .select('match_id, matches(created_at)')
        .eq('user_id', userId)
        .order('match_id', { ascending: false });

      if (matchError) throw matchError;
      
      if (!myMatches || myMatches.length === 0) {
        setMatches([]);
        setLoading(false);
        return;
      }

      const matchIds = myMatches.map(m => m.match_id);

      // 2. 獲取這些牌局中的對手玩家
      const { data: opponents, error: opponentsError } = await supabase
        .from('match_players')
        .select('match_id, user_id, profiles(id, username)')
        .in('match_id', matchIds)
        .neq('user_id', userId);

      if (opponentsError) throw opponentsError;

      // 3. 獲取我對這些牌局的評價記錄
      const { data: myReviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('match_id, id')
        .eq('reviewer_id', userId)
        .in('match_id', matchIds);

      if (reviewsError) throw reviewsError;

      // 組合數據
      const historyData = myMatches.map(m => {
        const matchOpponents = opponents.filter(o => o.match_id === m.match_id);
        const opponent = matchOpponents.length > 0 ? matchOpponents[0].profiles : null;
        const matchReviews = myReviews.filter(r => r.match_id === m.match_id);
        
        return {
          id: m.match_id,
          created_at: m.matches?.created_at,
          opponent: opponent,
          reviewCount: matchReviews.length // 計算已評價次數
        };
      });

      setMatches(historyData);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = (match, opponent) => {
    setReviewMatch({ id: match.id });
    setReviewTarget(opponent);
  };

  const handleReviewSubmit = () => {
    // 提交評價後重新整理列表
    setReviewMatch(null);
    setReviewTarget(null);
    if (user) {
      fetchHistory(user.id);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 pb-20 px-4 pt-8">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <History className="text-green-600" size={28} />
          <h1 className="text-2xl font-bold text-gray-800">歷史牌局</h1>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-8">載入中...</div>
        ) : matches.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🀄</span>
            </div>
            <p className="text-gray-500">尚未有任何牌局紀錄</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map(match => (
              <div key={match.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                      <Clock size={14} />
                      {new Date(match.created_at).toLocaleDateString()} {new Date(match.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="font-medium text-lg">
                      雀友：{match.opponent?.username || '神秘雀友'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-2">
                  <div className="text-sm text-gray-500">
                    評價次數：{match.reviewCount} / 2
                  </div>
                  
                  <button
                    onClick={() => handleReviewClick(match, match.opponent)}
                    disabled={match.reviewCount >= 2 || !match.opponent}
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1 transition-colors ${
                      match.reviewCount >= 2 || !match.opponent
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    <Star size={16} className={match.reviewCount < 2 && match.opponent ? 'fill-current' : ''} />
                    {match.reviewCount >= 2 ? '已達評價上限' : '留下評價'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {reviewMatch && reviewTarget && user && (
        <ReviewModal 
          match={reviewMatch}
          currentUser={user}
          targetUser={reviewTarget}
          onClose={() => {
            setReviewMatch(null);
            setReviewTarget(null);
          }}
          onSubmit={handleReviewSubmit}
        />
      )}
    </div>
  );
}
