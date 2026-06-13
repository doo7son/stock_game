import React, { useEffect, useState } from 'react';
import { Trophy, TrendingUp, TrendingDown, Medal } from 'lucide-react';
import { subscribeToLeaderboard } from '../services/firebase';

export default function Leaderboard({ currentNickname }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard((data) => {
      setLeaders(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(val || 0);
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy size={24} style={{ color: '#fbbf24' }} />; // Gold
    if (index === 1) return <Medal size={24} style={{ color: '#9ca3af' }} />; // Silver
    if (index === 2) return <Medal size={24} style={{ color: '#b45309' }} />; // Bronze
    return <span style={{ fontWeight: 'bold', fontSize: '1.2rem', width: '24px', display: 'inline-block', textAlign: 'center' }}>{index + 1}</span>;
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h2 className="portfolio-header" style={{ margin: 0 }}>명예의 전당 (Top 50)</h2>
        <div style={{ padding: '0.5rem 1rem', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-blue)', borderRadius: '20px', fontWeight: 'bold' }}>
          실시간 랭킹
        </div>
      </div>

      <div className="glass-card" style={{ padding: '0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr', padding: '1.5rem', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', color: 'var(--text-muted)' }}>
          <div>순위</div>
          <div>투자자</div>
          <div style={{ textAlign: 'right' }}>총 자산</div>
          <div style={{ textAlign: 'right' }}>수익률</div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>랭킹 불러오는 중...</div>
        ) : leaders.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }} className="text-muted">
            아직 등록된 랭킹이 없거나 Firebase 설정이 안 되어 있습니다.
          </div>
        ) : (
          <div className="stock-list" style={{ marginTop: 0, gap: 0 }}>
            {leaders.map((user, index) => {
              const isCurrentUser = user.nickname === currentNickname;
              const isPositive = user.returnPct >= 0;

              return (
                <div 
                  key={user.nickname} 
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '60px 1fr 1fr 1fr', 
                    padding: '1.25rem 1.5rem', 
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: isCurrentUser ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    alignItems: 'center',
                    transition: 'background 0.2s'
                  }}
                  className="stock-item"
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {getRankIcon(index)}
                  </div>
                  <div style={{ fontWeight: isCurrentUser ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {user.nickname}
                    {isCurrentUser && <span style={{ fontSize: '0.7rem', background: 'var(--accent-blue)', padding: '0.1rem 0.4rem', borderRadius: '4px', color: 'white' }}>나</span>}
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {formatCurrency(user.totalValue)}
                  </div>
                  <div className={isPositive ? 'text-green' : 'text-red'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem', fontWeight: 'bold' }}>
                    {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {isPositive ? '+' : ''}{(user.returnPct || 0).toFixed(2)}%
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
