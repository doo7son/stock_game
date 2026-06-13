import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, TrendingUp, TrendingDown, Clock, Activity, Star } from 'lucide-react';
import StockChart from './StockChart';
import { usePortfolioStore } from '../store/portfolioStore';
import { fetchQuotes, fetchChartData, searchSymbols, KOREAN_STOCKS } from '../services/marketData';

export default function TradingScreen({ onBack, initialSymbol = '005930.KS' }) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [quote, setQuote] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [timeRange, setTimeRange] = useState('1mo'); // 1d, 1mo, 6mo, 1y
  
  const [tradeAction, setTradeAction] = useState('BUY'); // BUY or SELL
  const [sharesAmount, setSharesAmount] = useState('');
  const [tradeMessage, setTradeMessage] = useState('');

  const { balance, portfolio, buyStock, sellStock } = usePortfolioStore();

  const loadStockData = async (sym) => {
    setSymbol(sym);
    setSearchQuery('');
    setSearchResults([]);
    
    // Fetch quote
    const quotes = await fetchQuotes([sym]);
    if (quotes && quotes.length > 0) {
      setQuote(quotes[0]);
    }
    
    // Fetch chart
    const data = await fetchChartData(sym, timeRange, timeRange === '1d' ? '5m' : '1d');
    setChartData(data);
  };

  useEffect(() => {
    loadStockData(symbol);
  }, [symbol, timeRange]);

  const handleSearch = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length > 1) {
      const results = await searchSymbols(q);
      setSearchResults(results.filter(r => r.quoteType === 'EQUITY' || r.quoteType === 'ETF'));
    } else {
      setSearchResults([]);
    }
  };

  const executeTrade = () => {
    const shares = parseInt(sharesAmount, 10);
    if (!shares || shares <= 0) return;
    if (!quote) return;

    const price = quote.regularMarketPrice;

    if (tradeAction === 'BUY') {
      const result = buyStock(symbol, shares, price);
      setTradeMessage(result.message);
      if (result.success) setSharesAmount('');
    } else {
      const result = sellStock(symbol, shares, price);
      setTradeMessage(result.message);
      if (result.success) setSharesAmount('');
    }

    setTimeout(() => setTradeMessage(''), 3000);
  };

  const ownedShares = portfolio[symbol]?.shares || 0;
  const isPositive = quote?.regularMarketChange >= 0;
  const chartColor = isPositive ? 'var(--accent-green)' : 'var(--accent-red)';

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(val || 0);
  };

  // 인기 주식 렌더링
  const renderPopularStocks = () => {
    const popular = KOREAN_STOCKS.slice(0, 10); // 상위 10개만
    return (
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginRight: '0.5rem' }}>
          <Star size={16} /> 추천 종목:
        </div>
        {popular.map(stock => (
          <button 
            key={stock.symbol}
            onClick={() => loadStockData(stock.symbol)}
            style={{ 
              padding: '0.25rem 0.75rem', 
              fontSize: '0.85rem', 
              background: symbol === stock.symbol ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)',
              color: symbol === stock.symbol ? 'white' : 'var(--text-main)',
              borderRadius: '20px',
              border: '1px solid var(--border-color)'
            }}
          >
            {stock.name}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div>
      <button onClick={onBack} style={{ background: 'transparent', padding: '0', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
        <ArrowLeft size={20} /> 대시보드로 돌아가기
      </button>

      <div style={{ position: 'relative', marginBottom: '2rem' }}>
        <div className="search-bar" style={{ marginBottom: '0' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="종목명(예: 삼성전자) 또는 심볼을 검색하세요..." 
              value={searchQuery}
              onChange={handleSearch}
              style={{ paddingLeft: '3rem' }}
            />
            {searchResults.length > 0 && (
              <div className="glass-card" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, marginTop: '0.5rem', padding: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                {searchResults.map((res, i) => (
                  <div 
                    key={i} 
                    onClick={() => loadStockData(res.symbol)}
                    style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}
                    className="stock-item"
                  >
                    <span style={{ fontWeight: 'bold' }}>{res.shortname}</span>
                    <span className="text-muted">{res.symbol}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* 추천/인기 주식 버튼 */}
        {renderPopularStocks()}
      </div>

      {!quote ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <Activity className="text-muted" size={48} style={{ margin: '0 auto', marginBottom: '1rem' }} />
          <h3 className="text-muted">종목을 검색하거나 위의 추천 종목을 선택하세요</h3>
        </div>
      ) : (
        <div className="trading-layout">
          <div className="glass-card">
            <div className="flex-between">
              <div>
                <h2 style={{ fontSize: '2rem' }}>{quote.localName || quote.shortName || symbol} <span className="text-muted" style={{ fontSize: '1.2rem', marginLeft: '0.5rem' }}>{symbol}</span></h2>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {formatCurrency(quote.regularMarketPrice)}
                  <span className={isPositive ? 'text-green' : 'text-red'} style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>
                    {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                    {isPositive ? '+' : ''}{quote.regularMarketChange?.toFixed(2)} ({quote.regularMarketChangePercent?.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="tabs" style={{ marginTop: '2rem' }}>
              {[
                { id: '1d', label: '1일' },
                { id: '1mo', label: '1개월' },
                { id: '6mo', label: '6개월' },
                { id: '1y', label: '1년' }
              ].map(r => (
                <button 
                  key={r.id}
                  className={`tab ${timeRange === r.id ? 'active' : ''}`}
                  onClick={() => setTimeRange(r.id)}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="chart-container">
              <StockChart data={chartData} color={chartColor} />
            </div>
            
            <div className="grid-3" style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <div>
                <div className="text-muted" style={{ fontSize: '0.85rem' }}>전일 종가</div>
                <div style={{ fontWeight: '600', marginTop: '0.25rem' }}>{formatCurrency(quote.regularMarketPreviousClose)}</div>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.85rem' }}>당일 변동폭</div>
                <div style={{ fontWeight: '600', marginTop: '0.25rem' }}>{formatCurrency(quote.regularMarketDayLow)} - {formatCurrency(quote.regularMarketDayHigh)}</div>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.85rem' }}>거래량</div>
                <div style={{ fontWeight: '600', marginTop: '0.25rem' }}>{(quote.regularMarketVolume || 0).toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ height: 'fit-content' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>주문하기</h3>
            
            <div className="tabs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
              <button 
                className="tab" 
                style={{ borderBottomColor: tradeAction === 'BUY' ? 'var(--accent-blue)' : 'transparent', color: tradeAction === 'BUY' ? 'white' : 'var(--text-muted)' }}
                onClick={() => setTradeAction('BUY')}
              >
                매수 (BUY)
              </button>
              <button 
                className="tab" 
                style={{ borderBottomColor: tradeAction === 'SELL' ? 'var(--accent-blue)' : 'transparent', color: tradeAction === 'SELL' ? 'white' : 'var(--text-muted)' }}
                onClick={() => setTradeAction('SELL')}
              >
                매도 (SELL)
              </button>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                <span className="text-muted">수량 (주)</span>
              </div>
              <input 
                type="number" 
                placeholder="0" 
                min="1"
                value={sharesAmount}
                onChange={(e) => setSharesAmount(e.target.value)}
                style={{ fontSize: '1.5rem', textAlign: 'right', padding: '1rem' }}
              />
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                <span className="text-muted">예상 주문 금액</span>
                <span style={{ fontWeight: 'bold' }}>{formatCurrency((parseInt(sharesAmount || 0) * quote.regularMarketPrice))}</span>
              </div>
              <div className="flex-between">
                <span className="text-muted">{tradeAction === 'BUY' ? '주문가능 금액' : '보유 주식 수량'}</span>
                <span style={{ fontWeight: 'bold' }}>{tradeAction === 'BUY' ? formatCurrency(balance) : `${ownedShares} 주`}</span>
              </div>
            </div>

            <button 
              className={tradeAction === 'BUY' ? 'primary' : 'primary'} 
              style={{ width: '100%', marginTop: '1.5rem', padding: '1rem', fontSize: '1.1rem', background: tradeAction === 'BUY' ? 'var(--accent-green)' : 'var(--accent-red)' }}
              onClick={executeTrade}
            >
              {tradeAction === 'BUY' ? '매수 주문' : '매도 주문'}
            </button>

            {tradeMessage && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', background: tradeMessage.includes('성공') || tradeMessage.includes('Successfully') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: tradeMessage.includes('성공') || tradeMessage.includes('Successfully') ? 'var(--accent-green)' : 'var(--accent-red)', textAlign: 'center' }}>
                {tradeMessage.replace('Successfully bought', '성공적으로 매수했습니다:').replace('Successfully sold', '성공적으로 매도했습니다:').replace('shares of', '주').replace('Insufficient funds', '잔액이 부족합니다.').replace('Not enough shares to sell', '매도할 주식이 부족합니다.')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
