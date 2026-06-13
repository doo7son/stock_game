import React, { useState } from 'react';
import { usePortfolioStore } from '../store/portfolioStore';
import { loginUser, signUpUser } from '../services/firebase';
import { LogIn, UserPlus } from 'lucide-react';

export default function WelcomeScreen() {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { setUserData } = usePortfolioStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId.trim() || !password.trim() || (!isLoginTab && !nickname.trim())) return;

    setLoading(true);
    setMessage('');

    let result;
    if (isLoginTab) {
      result = await loginUser(userId.trim(), password.trim());
    } else {
      result = await signUpUser(userId.trim(), password.trim(), nickname.trim());
    }

    setLoading(false);

    if (result.success) {
      // 로컬 스토리지에 유저 아이디 저장 (자동 로그인용)
      localStorage.setItem('stock_game_user', JSON.stringify({ userId: result.data.userId, password }));
      setUserData(result.data);
    } else {
      setMessage(result.message);
    }
  };

  return (
    <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
        
        <div style={{ display: 'flex', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)' }}>
          <button 
            style={{ flex: 1, background: 'transparent', padding: '1rem', borderBottom: isLoginTab ? '2px solid var(--accent-blue)' : '2px solid transparent', color: isLoginTab ? 'var(--text-main)' : 'var(--text-muted)' }}
            onClick={() => { setIsLoginTab(true); setMessage(''); }}
          >
            로그인
          </button>
          <button 
            style={{ flex: 1, background: 'transparent', padding: '1rem', borderBottom: !isLoginTab ? '2px solid var(--accent-blue)' : '2px solid transparent', color: !isLoginTab ? 'var(--text-main)' : 'var(--text-muted)' }}
            onClick={() => { setIsLoginTab(false); setMessage(''); }}
          >
            회원가입
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(59, 130, 246, 0.2)', padding: '1rem', borderRadius: '50%', marginBottom: '1rem', color: 'var(--accent-blue)' }}>
            {isLoginTab ? <LogIn size={32} /> : <UserPlus size={32} />}
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            {isLoginTab ? '투자소 입장하기' : '새 계좌 개설하기'}
          </h2>
          <p className="text-muted">
            {isLoginTab ? '아이디와 비밀번호를 입력하세요' : '초기 자본금 1,000만 원이 즉시 지급됩니다'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>아이디</label>
            <input 
              type="text" 
              placeholder="아이디 입력" 
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              maxLength={20}
              required
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>비밀번호</label>
            <input 
              type="password" 
              placeholder="비밀번호 입력" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {!isLoginTab && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>닉네임 (랭킹 표시용)</label>
              <input 
                type="text" 
                placeholder="멋진 닉네임 입력" 
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={15}
                required
              />
            </div>
          )}

          {message && (
            <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--accent-red)', textAlign: 'center', fontSize: '0.9rem' }}>
              {message}
            </div>
          )}

          <button type="submit" className="primary" style={{ width: '100%', fontSize: '1.1rem', marginTop: '1rem' }} disabled={loading}>
            {loading ? '처리 중...' : (isLoginTab ? '로그인' : '계좌 개설 및 시작')}
          </button>
        </form>
      </div>
    </div>
  );
}
