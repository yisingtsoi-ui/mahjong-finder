import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { History, Star, Clock } from 'lucide-react';
import ReviewModal from '../components/ReviewModal';

export default function GameHistory() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  
  const [reviewMatch, setReviewMatch] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [existingReview, setExistingReview] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        supabase.from('profiles').select('username').eq('id', user.id).single().then(({data}) => {
          setMyProfile(data);
        });
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
        .select('*')
        .eq('reviewer_id', userId)
        .in('match_id', matchIds);

      if (reviewsError) throw reviewsError;

      // 組合數據
      const historyData = myMatches.map(m => {
        const matchOpponents = opponents.filter(o => o.match_id === m.match_id);
        const opponent = matchOpponents.length > 0 ? matchOpponents[0].profiles : null;
        
        // 如果有多次評價，取最新的
        const matchReviews = myReviews
          .filter(r => r.match_id === m.match_id)
          .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        
        const latestReview = matchReviews.length > 0 ? matchReviews[0] : null;
        const isEdited = latestReview?.comment?.includes('\u200B');
        
        return {
          id: m.match_id,
          created_at: m.matches?.created_at || new Date().toISOString(),
          opponent: opponent,
          latestReview,
          isEdited
        };
      });

      // 依時間排序 (最新的在最上面)
      historyData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setMatches(historyData);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = (match, opponent, review) => {
    setReviewMatch({ id: match.id });
    setReviewTarget(opponent);
    setExistingReview(review);
  };

  const handleReviewSubmit = () => {
    // 提交評價後重新整理列表
    setReviewMatch(null);
    setReviewTarget(null);
    setExistingReview(null);
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
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <span className="text-4xl animate-spin">🀄</span>
            <span className="font-bold tracking-widest text-gray-500">翻查戰績中...</span>
          </div>
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
                    <div className="font-medium text-lg text-green-700">
                      {myProfile?.username || '我'} <span className="text-gray-400 text-sm mx-1">vs</span> {match.opponent?.username || '神秘雀友'}
                    </div>
                  </div>
                </div>
                
                {match.latestReview && (
                  <div className="bg-green-50 p-3 rounded-xl mb-4 border border-green-100">
                    <div className="flex justify-between mb-2">
                      <div className="text-sm font-medium text-gray-700">我給出的評價：</div>
                    </div>
                    <div className="flex gap-4 mb-2">
                      <div className="text-sm flex items-center gap-1"><span className="font-bold">牌速</span> <Star size={12} className="fill-yellow-400 text-yellow-400"/> {match.latestReview.speed_rating}</div>
                      <div className="text-sm flex items-center gap-1"><span className="font-bold">牌技</span> <Star size={12} className="fill-yellow-400 text-yellow-400"/> {match.latestReview.skill_rating}</div>
                      <div className="text-sm flex items-center gap-1"><span className="font-bold">牌品</span> <Star size={12} className="fill-yellow-400 text-yellow-400"/> {match.latestReview.manner_rating}</div>
                    </div>
                    {match.latestReview.comment && match.latestReview.comment.replace('\u200B', '').trim() && (
                      <p className="text-sm text-gray-600 italic bg-white p-2 rounded-lg border border-gray-100">
                        "{match.latestReview.comment.replace('\u200B', '')}"
                      </p>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-2">
                  <div className="text-sm text-gray-500">
                    {match.isEdited ? '評價次數：2 / 2' : match.latestReview ? '評價次數：1 / 2' : '評價次數：0 / 2'}
                  </div>
                  
                  <button
                    onClick={() => handleReviewClick(match, match.opponent, match.latestReview)}
                    disabled={match.isEdited || !match.opponent}
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1 transition-colors ${
                      match.isEdited || !match.opponent
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    <Star size={16} className={!match.isEdited && match.opponent ? 'fill-current' : ''} />
                    {match.isEdited ? '已達評價上限' : match.latestReview ? '修改評價' : '留下評價'}
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
