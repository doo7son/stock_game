import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import TradingScreen from './components/TradingScreen';
import WelcomeScreen from './components/WelcomeScreen';
import Leaderboard from './components/Leaderboard';
import { usePortfolioStore } from './store/portfolioStore';
import { RefreshCw, LayoutDashboard, LineChart, Trophy, LogOut } from 'lucide-react';
import { loginUser } from './services/firebase';

function App() {
  const [currentView, setCurrentView] = useState('DASHBOARD'); // DASHBOARD, TRADING, LEADERBOARD
  const [selectedStock, setSelectedStock] = useState('005930.KS'); // 삼성전자를 기본값으로
  const [isInitializing, setIsInitializing] = useState(true);
  
  const { userId, nickname, resetAccount, setUserData } = usePortfolioStore();

  useEffect(() => {
    const autoLogin = async () => {
      const savedUser = localStorage.getItem('stock_game_user');
      if (savedUser) {
        try {
          const { userId, password } = JSON.parse(savedUser);
          const result = await loginUser(userId, password);
          if (result.success) {
            setUserData(result.data);
          } else {
            localStorage.removeItem('stock_game_user');
          }
        } catch (e) {
          localStorage.removeItem('stock_game_user');
        }
      }
      setIsInitializing(false);
    };
    autoLogin();
  }, []);

  if (isInitializing) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>데이터 불러오는 중...</div>;
  }

  if (!userId) {
    return (
      <div className="app-container">
        <header style={{ borderBottom: 'none' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-green))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              학생 모의 투자소
            </h1>
            <p className="text-muted" style={{ marginTop: '0.25rem' }}>위험 부담 없이 진짜 시장을 경험해보세요</p>
          </div>
        </header>
        <main>
          <WelcomeScreen />
        </main>
      </div>
    );
  }

  const handleSelectStock = (symbol) => {
    setSelectedStock(symbol);
    setCurrentView('TRADING');
  };

  return (
    <div className="app-container">
      <header>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-green))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            학생 모의 투자소
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <span className="text-muted">투자자: <strong style={{ color: 'var(--text-main)' }}>{nickname}</strong></span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            className="danger" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--accent-red)' }}
            onClick={() => {
              if (window.confirm('로그아웃 하시겠습니까?')) {
                resetAccount();
              }
            }}
          >
            <LogOut size={16} /> 로그아웃
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)' }}>
        <button 
          onClick={() => setCurrentView('DASHBOARD')}
          style={{ background: 'transparent', borderRadius: 0, padding: '1rem 2rem', borderBottom: `2px solid ${currentView === 'DASHBOARD' ? 'var(--accent-blue)' : 'transparent'}`, color: currentView === 'DASHBOARD' ? 'var(--text-main)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <LayoutDashboard size={18} /> 내 자산
        </button>
        <button 
          onClick={() => setCurrentView('TRADING')}
          style={{ background: 'transparent', borderRadius: 0, padding: '1rem 2rem', borderBottom: `2px solid ${currentView === 'TRADING' ? 'var(--accent-blue)' : 'transparent'}`, color: currentView === 'TRADING' ? 'var(--text-main)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <LineChart size={18} /> 거래소
        </button>
        <button 
          onClick={() => setCurrentView('LEADERBOARD')}
          style={{ background: 'transparent', borderRadius: 0, padding: '1rem 2rem', borderBottom: `2px solid ${currentView === 'LEADERBOARD' ? 'var(--accent-blue)' : 'transparent'}`, color: currentView === 'LEADERBOARD' ? 'var(--text-main)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Trophy size={18} /> 랭킹 (명예의 전당)
        </button>
      </div>

      <main>
        {currentView === 'DASHBOARD' && <Dashboard onSelectStock={handleSelectStock} />}
        {currentView === 'TRADING' && <TradingScreen onBack={() => setCurrentView('DASHBOARD')} initialSymbol={selectedStock} />}
        {currentView === 'LEADERBOARD' && <Leaderboard currentNickname={nickname} />}
      </main>
    </div>
  );
}

export default App;
