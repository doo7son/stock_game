import { create } from 'zustand';

// Initial state for the student portfolio
const INITIAL_BALANCE = 10000000;

export const usePortfolioStore = create((set, get) => ({
  nickname: null,
  balance: INITIAL_BALANCE,
  portfolio: {}, // { 'AAPL': { shares: 10, avgPrice: 150.0 } }
  transactions: [], // { id, type, symbol, shares, price, date }
  
  setNickname: (name) => {
    set({ nickname: name });
  },

  buyStock: (symbol, shares, price) => {
    const totalCost = shares * price;
    const { balance, portfolio } = get();
    
    if (balance < totalCost) {
      return { success: false, message: 'Insufficient funds' };
    }
    
    const existing = portfolio[symbol] || { shares: 0, avgPrice: 0 };
    const newShares = existing.shares + shares;
    const newAvgPrice = ((existing.shares * existing.avgPrice) + totalCost) / newShares;
    
    set((state) => ({
      balance: state.balance - totalCost,
      portfolio: {
        ...state.portfolio,
        [symbol]: { shares: newShares, avgPrice: newAvgPrice }
      },
      transactions: [
        {
          id: Date.now().toString(),
          type: 'BUY',
          symbol,
          shares,
          price,
          date: new Date().toISOString()
        },
        ...state.transactions
      ]
    }));
    
    return { success: true, message: `Successfully bought ${shares} shares of ${symbol}` };
  },
  
  sellStock: (symbol, shares, price) => {
    const { portfolio } = get();
    const existing = portfolio[symbol];
    
    if (!existing || existing.shares < shares) {
      return { success: false, message: 'Not enough shares to sell' };
    }
    
    const revenue = shares * price;
    const remainingShares = existing.shares - shares;
    
    const newPortfolio = { ...portfolio };
    if (remainingShares === 0) {
      delete newPortfolio[symbol];
    } else {
      newPortfolio[symbol] = {
        ...existing,
        shares: remainingShares
      };
    }
    
    set((state) => ({
      balance: state.balance + revenue,
      portfolio: newPortfolio,
      transactions: [
        {
          id: Date.now().toString(),
          type: 'SELL',
          symbol,
          shares,
          price,
          date: new Date().toISOString()
        },
        ...state.transactions
      ]
    }));
    
    return { success: true, message: `Successfully sold ${shares} shares of ${symbol}` };
  },
  
  resetAccount: () => {
    set({
      balance: INITIAL_BALANCE,
      portfolio: {},
      transactions: []
    });
  }
}));
