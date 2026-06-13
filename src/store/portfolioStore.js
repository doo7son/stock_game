import { create } from 'zustand';
import { updatePortfolioToDB } from '../services/firebase';

const INITIAL_BALANCE = 10000000;

export const usePortfolioStore = create((set, get) => ({
  userId: null,
  nickname: '',
  balance: INITIAL_BALANCE,
  portfolio: {},

  // 로그인 시 DB에서 데이터 불러오기
  setUserData: (data) => set({
    userId: data.userId,
    nickname: data.nickname,
    balance: data.balance ?? INITIAL_BALANCE,
    portfolio: data.portfolio || {}
  }),

  buyStock: (symbol, amount, price) => {
    const { balance, portfolio, userId } = get();
    const totalCost = amount * price;

    if (balance < totalCost) {
      return { success: false, message: '잔액이 부족합니다.' };
    }

    const currentShares = portfolio[symbol]?.shares || 0;
    const currentAvgPrice = portfolio[symbol]?.avgPrice || 0;
    
    const newShares = currentShares + amount;
    const newAvgPrice = ((currentShares * currentAvgPrice) + totalCost) / newShares;

    const newBalance = balance - totalCost;
    const newPortfolio = {
      ...portfolio,
      [symbol]: {
        shares: newShares,
        avgPrice: newAvgPrice
      }
    };

    set({ balance: newBalance, portfolio: newPortfolio });
    
    // DB 실시간 저장
    if (userId) {
      updatePortfolioToDB(userId, newBalance, newPortfolio, null, null); 
      // totalValue와 returnPct는 Dashboard에서 주기적으로 업데이트 하므로 여기선 생략 가능
    }

    return { success: true, message: `성공적으로 매수했습니다: ${amount}주` };
  },

  sellStock: (symbol, amount, price) => {
    const { balance, portfolio, userId } = get();
    const currentShares = portfolio[symbol]?.shares || 0;

    if (currentShares < amount) {
      return { success: false, message: '매도할 주식이 부족합니다.' };
    }

    const totalRevenue = amount * price;
    const newShares = currentShares - amount;
    
    const newPortfolio = { ...portfolio };
    if (newShares === 0) {
      delete newPortfolio[symbol];
    } else {
      newPortfolio[symbol] = {
        ...newPortfolio[symbol],
        shares: newShares
      };
    }

    const newBalance = balance + totalRevenue;

    set({ balance: newBalance, portfolio: newPortfolio });

    // DB 실시간 저장
    if (userId) {
      updatePortfolioToDB(userId, newBalance, newPortfolio, null, null);
    }

    return { success: true, message: `성공적으로 매도했습니다: ${amount}주` };
  },

  // 로컬 상태와 localStorage만 리셋 (파산 신청 시)
  resetAccount: () => {
    localStorage.removeItem('stock_game_user');
    set({
      userId: null,
      nickname: '',
      balance: INITIAL_BALANCE,
      portfolio: {}
    });
  }
}));
