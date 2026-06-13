// Service to fetch market data from Yahoo Finance via local Vite proxy or Vercel rewrites

// 한글 종목명을 야후 파이낸스 티커로 변환하기 위한 데이터
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
  // 미국 인기 주식
  { symbol: 'AAPL', name: '애플', shortname: 'Apple Inc.' },
  { symbol: 'TSLA', name: '테슬라', shortname: 'Tesla, Inc.' },
  { symbol: 'NVDA', name: '엔비디아', shortname: 'NVIDIA Corporation' },
  { symbol: 'MSFT', name: '마이크로소프트', shortname: 'Microsoft' },
  { symbol: 'GOOGL', name: '구글 (Alphabet)', shortname: 'Alphabet Inc.' },
];

export const fetchQuotes = async (symbols) => {
  if (!symbols || symbols.length === 0) return [];
  
  const symbolArray = Array.isArray(symbols) ? symbols : [symbols];
  
  try {
    // 막혀있는 v7/finance/quote 대신 열려있는 v8/finance/chart API의 meta 영역을 활용하여 현재가를 가져옵니다.
    const promises = symbolArray.map(async (symbol) => {
      try {
        const response = await fetch(`/api/yahoo/v8/finance/chart/${symbol}?range=1d&interval=1d`);
        if (!response.ok) return null;
        
        const data = await response.json();
        const meta = data.chart?.result?.[0]?.meta;
        if (!meta) return null;
        
        const localStock = KOREAN_STOCKS.find(s => s.symbol === symbol);
        
        const regularMarketPrice = meta.regularMarketPrice;
        const previousClose = meta.chartPreviousClose;
        const change = regularMarketPrice - previousClose;
        const changePercent = (change / previousClose) * 100;

        return {
          symbol: symbol,
          regularMarketPrice: regularMarketPrice,
          regularMarketPreviousClose: previousClose,
          regularMarketChange: change,
          regularMarketChangePercent: changePercent,
          regularMarketVolume: meta.regularMarketVolume || 0,
          regularMarketDayLow: meta.regularMarketPrice * 0.98, // 차트 API 메타에는 일일 저가/고가가 없으므로 근사치 제공
          regularMarketDayHigh: meta.regularMarketPrice * 1.02,
          shortName: localStock ? localStock.shortname : symbol,
          localName: localStock ? localStock.name : symbol
        };
      } catch (err) {
        console.error(`Error fetching quote for ${symbol}`, err);
        return null;
      }
    });

    const results = await Promise.all(promises);
    return results.filter(Boolean); // null 제거

  } catch (error) {
    console.error("Failed to fetch quotes:", error);
    return [];
  }
};

export const fetchChartData = async (symbol, range = '1mo', interval = '1d') => {
  try {
    const response = await fetch(`/api/yahoo/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`);
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result) return [];
    
    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    
    const chartData = timestamps.map((time, index) => {
      return {
        time: new Date(time * 1000).toLocaleDateString(),
        fullTime: new Date(time * 1000).toLocaleString(),
        open: quotes.open?.[index] || null,
        high: quotes.high?.[index] || null,
        low: quotes.low?.[index] || null,
        close: quotes.close?.[index] || null,
        volume: quotes.volume?.[index] || null,
      };
    }).filter(item => item.close !== null);
    
    return chartData;
  } catch (error) {
    console.error(`Failed to fetch chart data for ${symbol}:`, error);
    return [];
  }
};

// 검색 기능: 로컬 데이터베이스 먼저 검색 후, 야후 API 검색
export const searchSymbols = async (query) => {
  const normalizedQuery = query.toLowerCase().trim();
  
  // 1. 자체 한글/영문 데이터베이스에서 검색
  const localResults = KOREAN_STOCKS.filter(stock => 
    stock.name.toLowerCase().includes(normalizedQuery) || 
    stock.symbol.toLowerCase().includes(normalizedQuery) ||
    stock.shortname.toLowerCase().includes(normalizedQuery)
  ).map(stock => ({
    symbol: stock.symbol,
    shortname: stock.name,
    quoteType: 'EQUITY'
  }));

  // 로컬에 검색 결과가 있으면 바로 반환 (야후 API 호출 안함)
  if (localResults.length > 0) {
    return localResults;
  }

  // 2. 야후 API 검색 (영문/해외주식) - 검색 API는 뚫려있음
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
