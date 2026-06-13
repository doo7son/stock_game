// Service to fetch market data from Yahoo Finance via local Vite proxy or Vercel rewrites

export const KOREAN_STOCKS = [
  { symbol: '005930.KS', name: '삼성전자', shortname: 'Samsung Electronics' },
  { symbol: '000660.KS', name: 'SK하이닉스', shortname: 'SK Hynix' },
  { symbol: '035420.KS', name: 'NAVER', shortname: 'Naver Corporation' },
  { symbol: '035720.KS', name: '카카오', shortname: 'Kakao' },
  { symbol: '005380.KS', name: '현대차', shortname: 'Hyundai Motor' },
  { symbol: '373220.KS', name: 'LG에너지솔루션', shortname: 'LG Energy Solution' },
  { symbol: '207940.KS', name: '삼성바이오로직스', shortname: 'Samsung Biologics' },
  { symbol: '000270.KS', name: '기아', shortname: 'Kia' },
  { symbol: '068270.KS', name: '셀트리온', shortname: 'Celltrion' },
  { symbol: '051910.KS', name: 'LG화학', shortname: 'LG Chem' },
  { symbol: 'AAPL', name: '애플', shortname: 'Apple Inc.' },
  { symbol: 'TSLA', name: '테슬라', shortname: 'Tesla, Inc.' },
  { symbol: 'NVDA', name: '엔비디아', shortname: 'NVIDIA Corporation' },
  { symbol: 'MSFT', name: '마이크로소프트', shortname: 'Microsoft' },
  { symbol: 'GOOGL', name: '구글 (Alphabet)', shortname: 'Alphabet Inc.' },
];

// 전역 환율 캐시
let cachedExchangeRate = 1400;
let lastExchangeRateFetch = 0;

export const fetchExchangeRate = async () => {
  const now = Date.now();
  // 5분마다 갱신
  if (now - lastExchangeRateFetch < 5 * 60 * 1000 && lastExchangeRateFetch !== 0) {
    return cachedExchangeRate;
  }
  
  try {
    const response = await fetch(`/api/yahoo/v8/finance/chart/KRW=X?range=1d&interval=1d`);
    if (!response.ok) return cachedExchangeRate;
    const data = await response.json();
    const rate = data.chart?.result?.[0]?.meta?.regularMarketPrice;
    if (rate) {
      cachedExchangeRate = rate;
      lastExchangeRateFetch = now;
    }
    return cachedExchangeRate;
  } catch (error) {
    console.error("Failed to fetch exchange rate", error);
    return cachedExchangeRate;
  }
};

export const fetchQuotes = async (symbols) => {
  if (!symbols || symbols.length === 0) return [];
  const symbolArray = Array.isArray(symbols) ? symbols : [symbols];
  const exchangeRate = await fetchExchangeRate();
  
  try {
    const promises = symbolArray.map(async (symbol) => {
      try {
        const response = await fetch(`/api/yahoo/v8/finance/chart/${symbol}?range=1d&interval=1d`);
        if (!response.ok) return null;
        
        const data = await response.json();
        const meta = data.chart?.result?.[0]?.meta;
        if (!meta) return null;
        
        const localStock = KOREAN_STOCKS.find(s => s.symbol === symbol);
        
        const isUSD = meta.currency === 'USD';
        const rate = isUSD ? exchangeRate : 1;

        const regularMarketPrice = meta.regularMarketPrice * rate;
        const previousClose = meta.chartPreviousClose * rate;
        const change = regularMarketPrice - previousClose;
        const changePercent = (change / previousClose) * 100;

        return {
          symbol: symbol,
          currency: meta.currency,
          originalPriceUSD: isUSD ? meta.regularMarketPrice : null,
          exchangeRateUsed: isUSD ? exchangeRate : 1,
          regularMarketPrice: regularMarketPrice,
          regularMarketPreviousClose: previousClose,
          regularMarketChange: change,
          regularMarketChangePercent: changePercent,
          regularMarketVolume: meta.regularMarketVolume || 0,
          regularMarketDayLow: (meta.regularMarketPrice * 0.98) * rate, 
          regularMarketDayHigh: (meta.regularMarketPrice * 1.02) * rate,
          shortName: localStock ? localStock.shortname : symbol,
          localName: localStock ? localStock.name : symbol
        };
      } catch (err) {
        console.error(`Error fetching quote for ${symbol}`, err);
        return null;
      }
    });

    const results = await Promise.all(promises);
    return results.filter(Boolean);

  } catch (error) {
    console.error("Failed to fetch quotes:", error);
    return [];
  }
};

export const fetchChartData = async (symbol, range = '1mo', interval = '1d') => {
  const exchangeRate = await fetchExchangeRate();

  try {
    const response = await fetch(`/api/yahoo/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    if (!result) return [];
    
    const meta = result.meta;
    const isUSD = meta?.currency === 'USD';
    const rate = isUSD ? exchangeRate : 1;

    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    
    const chartData = timestamps.map((time, index) => {
      return {
        time: new Date(time * 1000).toLocaleDateString(),
        fullTime: new Date(time * 1000).toLocaleString(),
        open: quotes.open?.[index] ? quotes.open[index] * rate : null,
        high: quotes.high?.[index] ? quotes.high[index] * rate : null,
        low: quotes.low?.[index] ? quotes.low[index] * rate : null,
        close: quotes.close?.[index] ? quotes.close[index] * rate : null,
        volume: quotes.volume?.[index] || null,
      };
    }).filter(item => item.close !== null);
    
    return chartData;
  } catch (error) {
    console.error(`Failed to fetch chart data for ${symbol}:`, error);
    return [];
  }
};

export const searchSymbols = async (query) => {
  const normalizedQuery = query.toLowerCase().trim();
  
  const localResults = KOREAN_STOCKS.filter(stock => 
    stock.name.toLowerCase().includes(normalizedQuery) || 
    stock.symbol.toLowerCase().includes(normalizedQuery) ||
    stock.shortname.toLowerCase().includes(normalizedQuery)
  ).map(stock => ({
    symbol: stock.symbol,
    shortname: stock.name,
    quoteType: 'EQUITY'
  }));

  if (localResults.length > 0) return localResults;

  try {
    const response = await fetch(`/api/yahoo/v1/finance/search?q=${query}&quotesCount=5&newsCount=0`);
    if (!response.ok) throw new Error('Search failed');
    const data = await response.json();
    return data.quotes || [];
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
};
