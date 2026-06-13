import React, { useState } from 'react';
import { usePortfolioStore } from '../store/portfolioStore';
import { UserPlus } from 'lucide-react';

export default function WelcomeScreen() {
  const [name, setName] = useState('');
  const { setNickname } = usePortfolioStore();

  const handleStart = (e) => {
    e.preventDefault();
    if (name.trim().length > 0) {
      setNickname(name.trim());
    }
  };

  return (
    <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ display: 'inline-flex', background: 'rgba(59, 130, 246, 0.2)', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem', color: 'var(--accent-blue)' }}>
          <UserPlus size={40} />
        </div>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>가상 주식 거래소 환영합니다</h2>
        <p className="text-muted" style={{ marginBottom: '2rem' }}>
          사용하실 닉네임을 입력하고 투자를 시작하세요! 명예의 전당 1위에 도전해보세요.
        </p>

        <form onSubmit={handleStart}>
          <input 
            type="text" 
            placeholder="닉네임 입력..." 
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ marginBottom: '1.5rem', fontSize: '1.1rem', textAlign: 'center' }}
            maxLength={15}
            required
          />
          <button type="submit" className="primary" style={{ width: '100%', fontSize: '1.1rem' }}>
            시작하기
          </button>
        </form>
      </div>
    </div>
  );
}
