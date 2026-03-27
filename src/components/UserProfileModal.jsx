import React, { useState, useEffect } from 'react';
import { X, User, Zap, Handshake } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export default function UserProfileModal({ user, onClose }) {
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        // 抓取額外的個人資料 (牌風、簡介、座右銘)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('bio, mahjong_styles, motto')
          .eq('id', user.id)
          .single();
          
        if (profileData) {
          setProfile(profileData);
        }

        // 抓取近期評價 (使用 view: user_recent_reviews)
        const { data: reviewsData } = await supabase
          .from('user_recent_reviews')
          .select('*')
          .eq('reviewee_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (reviewsData) {
          setReviews(reviewsData);
        }

        // 抓取排行榜名次
        const { data: rankData } = await supabase
          .from('leaderboard_stats')
          .select('rank')
          .eq('user_id', user.id)
          .single();

        if (rankData) {
          setUserRank(rankData.rank);
        }
      } catch (err) {
        console.error('Error fetching user details:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDetails();
  }, [user.id]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 font-sans text-black">
      <div className="bg-[#F5F4EE] border-4 border-black rounded-xl w-full max-w-md max-h-[85vh] flex flex-col relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        
        {/* 頂部標題列 (固定) */}
        <div className="p-4 border-b-2 border-black flex justify-between items-center bg-[#F5F4EE] rounded-t-lg shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black tracking-widest flex items-center gap-2">
              <User size={24} /> {user.username || '神秘雀友'}
            </h2>
            {userRank && userRank <= 100 && (
              <span className={`px-2 py-0.5 text-xs font-black border-2 border-black shadow-brutal-sm ${
                userRank === 1 ? 'bg-yellow-400 text-black' :
                userRank === 2 ? 'bg-yellow-400 text-black' :
                userRank === 3 ? 'bg-yellow-400 text-black' :
                userRank <= 20 ? 'bg-red-500 text-white' :
                userRank <= 60 ? 'bg-indigo-900 text-white' :
                'bg-gray-700 text-white'
              }`}>
                {userRank === 1 ? '雀神' : 
                 userRank === 2 ? '雀聖' : 
                 userRank === 3 ? '雀王' : 
                 userRank <= 20 ? '雀將' : 
                 userRank <= 60 ? '雀豪' : '雀俠'}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-black hover:scale-110 transition-transform">
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        {/* 內容區塊 (可滾動) */}
        <div className="p-4 overflow-y-auto grow">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <span className="text-4xl animate-spin mb-4 block">🀄</span>
              <span className="font-bold">載入中...</span>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* 座右銘 */}
              {profile?.motto && (
                <div className="text-center italic font-bold text-gray-700 bg-white border-2 border-black p-3 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  「{profile.motto}」
                </div>
              )}

              {/* 分數總覽 (來自 Home.jsx 傳入的 user 物件) */}
              <div className="flex justify-between items-center py-3 border-y-2 border-black bg-white px-2 rounded-lg">
                <div className="flex-1 text-center">
                  <div className="flex justify-center mb-1"><Zap size={20} /></div>
                  <div className="text-xs font-bold tracking-wider">牌速<br/>{user.speed_rating || '-'}</div>
                </div>
                <div className="w-[2px] h-8 bg-black"></div>
                <div className="flex-1 text-center">
                  <div className="flex justify-center mb-1">
                    <span className="font-black text-lg leading-none text-red-600" style={{height: '20px'}}>中</span>
                  </div>
                  <div className="text-xs font-bold tracking-wider">牌技<br/>{user.skill_rating || '-'}</div>
                </div>
                <div className="w-[2px] h-8 bg-black"></div>
                <div className="flex-1 text-center">
                  <div className="flex justify-center mb-1"><Handshake size={20} /></div>
                  <div className="text-xs font-bold tracking-wider">牌品<br/>{user.manner_rating || '-'}</div>
                </div>
              </div>

              {/* 牌風標籤 */}
              {profile?.mahjong_styles && profile.mahjong_styles.length > 0 && (
                <div>
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-black rounded-full"></span> 牌風標籤
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.mahjong_styles.map(style => (
                      <span key={style} className="px-3 py-1 bg-black text-white text-xs font-bold rounded-full">
                        {style}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 個人簡介 */}
              {profile?.bio && (
                <div>
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-black rounded-full"></span> 關於我
                  </h3>
                  <div className="bg-white border-2 border-black p-3 rounded-lg text-sm whitespace-pre-wrap">
                    {profile.bio}
                  </div>
                </div>
              )}

              {/* 雀友評價列表 */}
              <div>
                <h3 className="font-bold mb-3 flex items-center gap-2 border-b-2 border-black pb-2">
                  <span className="w-2 h-2 bg-black rounded-full"></span> 雀友評價
                </h3>
                {reviews.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 font-bold border-2 border-dashed border-black rounded-lg bg-white">
                    暫無評價
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-white border-2 border-black rounded-lg p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-sm">
                            {review.reviewer_name || '神秘雀友'}
                          </span>
                          <span className="text-xs text-gray-500 font-bold">
                            {format(new Date(review.created_at), 'yyyy-MM-dd')}
                          </span>
                        </div>
                        
                        <div className="flex gap-4 mb-2 text-xs font-bold bg-[#F5F4EE] p-2 rounded border border-black">
                          <div className="flex items-center gap-1"><Zap size={14}/> {review.speed_rating}</div>
                          <div className="flex items-center gap-1"><span className="font-black text-[12px] leading-none text-red-600">中</span> {review.skill_rating}</div>
                          <div className="flex items-center gap-1"><Handshake size={14}/> {review.manner_rating}</div>
                        </div>

                        {review.comment ? (
                          <p className="text-sm break-words mt-2 whitespace-pre-wrap">{review.comment.replace('\u200B', '')}</p>
                        ) : (
                          <p className="text-sm text-gray-400 italic mt-2">無文字評論</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}