import React, { useEffect, useState } from 'react';
import { usePortfolioStore } from '../store/portfolioStore';
import { fetchQuotes } from '../services/marketData';
import { TrendingUp, TrendingDown, DollarSign, Briefcase, Activity } from 'lucide-react';
import { syncUserData } from '../services/firebase';

export default function Dashboard({ onSelectStock }) {
  const { nickname, balance, portfolio } = usePortfolioStore();
  const [portfolioQuotes, setPortfolioQuotes] = useState({});
  const [loading, setLoading] = useState(false);

  const symbols = Object.keys(portfolio);

  useEffect(() => {
    if (symbols.length > 0) {
      setLoading(true);
      fetchQuotes(symbols).then(quotes => {
        const quoteMap = {};
        quotes.forEach(q => {
          quoteMap[q.symbol] = q;
        });
        setPortfolioQuotes(quoteMap);
        setLoading(false);
      });
    }
  }, [JSON.stringify(symbols)]);

  const calculateTotalValue = () => {
    let total = balance;
    symbols.forEach(sym => {
      const currentPrice = portfolioQuotes[sym]?.regularMarketPrice || portfolio[sym].avgPrice;
      total += portfolio[sym].shares * currentPrice;
    });
    return total;
  };

  const calculateTotalReturn = () => {
    let invested = 0;
    let currentValue = 0;
    
    symbols.forEach(sym => {
      invested += portfolio[sym].shares * portfolio[sym].avgPrice;
      const currentPrice = portfolioQuotes[sym]?.regularMarketPrice || portfolio[sym].avgPrice;
      currentValue += portfolio[sym].shares * currentPrice;
    });

    const returnAmt = currentValue - invested;
    const returnPct = invested === 0 ? 0 : (returnAmt / invested) * 100;
    return { returnAmt, returnPct };
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(val || 0);
  };

  const totalValue = calculateTotalValue();
  const { returnAmt, returnPct } = calculateTotalReturn();

  // Sync to Firebase whenever prices or balance changes
  useEffect(() => {
    if (nickname) {
      syncUserData(nickname, totalValue, returnPct);
    }
  }, [nickname, totalValue, returnPct]);

  return (
    <div>
      <h2 className="portfolio-header">포트폴리오 요약</h2>
      
      <div className="grid-3" style={{ marginTop: '2rem' }}>
        <div className="glass-card">
          <div className="flex-between">
            <h3 className="text-muted">총 자산 (평가금)</h3>
            <Briefcase size={20} className="text-muted" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '1rem' }}>
            {formatCurrency(totalValue)}
          </div>
        </div>

        <div className="glass-card">
          <div className="flex-between">
            <h3 className="text-muted">보유 현금 (예수금)</h3>
            <DollarSign size={20} className="text-muted" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '1rem' }}>
            {formatCurrency(balance)}
          </div>
        </div>

        <div className="glass-card">
          <div className="flex-between">
            <h3 className="text-muted">총 수익금</h3>
            <Activity size={20} className="text-muted" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '1rem', color: returnAmt >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {returnAmt > 0 ? '+' : ''}{formatCurrency(returnAmt)}
            <span style={{ fontSize: '1rem', marginLeft: '0.5rem' }}>
              ({returnPct > 0 ? '+' : ''}{returnPct.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      <h3 style={{ marginTop: '3rem', marginBottom: '1rem' }}>보유 주식 목록</h3>
      {symbols.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p className="text-muted">보유 중인 주식이 없습니다. 거래소에서 주식을 매수해보세요!</p>
        </div>
      ) : (
        <div className="stock-list glass-card" style={{ padding: '0.5rem' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>실시간 가격 불러오는 중...</div>
          ) : (
            symbols.map(sym => {
              const item = portfolio[sym];
              const quoteData = portfolioQuotes[sym];
              const currentPrice = quoteData?.regularMarketPrice || item.avgPrice;
              // 한글 이름이 있으면 사용하고, 없으면 짧은 이름이나 심볼 사용
              const name = quoteData?.localName || quoteData?.shortName || sym;
              const profit = (currentPrice - item.avgPrice) * item.shares;
              const profitPct = ((currentPrice - item.avgPrice) / item.avgPrice) * 100;
              const isProfit = profit >= 0;

              return (
                <div 
                  key={sym} 
                  className="stock-item" 
                  onClick={() => onSelectStock(sym)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {sym.substring(0, 1)}
                    </div>
                    <div>
                      <div className="stock-symbol">{name}</div>
                      <div className="stock-name">{sym}</div>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold' }}>{item.shares} 주</div>
                    <div className="text-muted">평단가 {formatCurrency(item.avgPrice)}</div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: '120px' }}>
                    <div style={{ fontWeight: 'bold' }}>{formatCurrency(currentPrice)}</div>
                    <div className={isProfit ? 'text-green' : 'text-red'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                      {isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      {profitPct.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
