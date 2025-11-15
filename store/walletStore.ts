import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction } from '@/types';

interface WalletState {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  transactions: Transaction[];
  dailyLoginClaimed: boolean;
  dailyStreak: number;
  adsWatchedToday: number;
  lastLoginDate: string;
  addPoints: (amount: number, type: Transaction['type'], description: string) => void;
  deductPoints: (amount: number, type: Transaction['type'], description: string) => void;
  claimDailyLogin: () => void;
  watchAd: () => void;
  resetDailyLimits: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      balance: 100, // Initial bonus points
      totalEarned: 100,
      totalSpent: 0,
      transactions: [],
      dailyLoginClaimed: false,
      dailyStreak: 0,
      adsWatchedToday: 0,
      lastLoginDate: new Date().toISOString().split('T')[0],
      
      addPoints: (amount, type, description) => {
        const state = get();
        const newBalance = state.balance + amount;
        const transaction: Transaction = {
          id: `txn_${Date.now()}`,
          userId: 'current_user',
          type,
          amount: amount,
          balanceAfter: newBalance,
          description,
          createdAt: new Date().toISOString(),
        };
        
        set({
          balance: newBalance,
          totalEarned: state.totalEarned + amount,
          transactions: [transaction, ...state.transactions],
        });
      },
      
      deductPoints: (amount, type, description) => {
        const state = get();
        const newBalance = Math.max(0, state.balance - amount);
        const transaction: Transaction = {
          id: `txn_${Date.now()}`,
          userId: 'current_user',
          type,
          amount: -amount,
          balanceAfter: newBalance,
          description,
          createdAt: new Date().toISOString(),
        };
        
        set({
          balance: newBalance,
          totalSpent: state.totalSpent + amount,
          transactions: [transaction, ...state.transactions],
        });
      },
      
      claimDailyLogin: () => {
        const state = get();
        const today = new Date().toISOString().split('T')[0];
        
        if (!state.dailyLoginClaimed && state.lastLoginDate !== today) {
          get().addPoints(3, 'daily_login', 'Daily login bonus');
          set({
            dailyLoginClaimed: true,
            dailyStreak: state.dailyStreak + 1,
            lastLoginDate: today,
          });
        }
      },
      
      watchAd: () => {
        const state = get();
        if (state.adsWatchedToday < 5) {
          get().addPoints(6, 'ad_watch', 'Watched reward ad');
          set({ adsWatchedToday: state.adsWatchedToday + 1 });
        }
      },
      
      resetDailyLimits: () => {
        set({ dailyLoginClaimed: false, adsWatchedToday: 0 });
      },
    }),
    {
      name: 'rupantar-wallet',
    }
  )
);

