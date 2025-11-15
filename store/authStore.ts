import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, CreatorApplication } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isCreator: boolean;
  creatorApplication: CreatorApplication | null;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setCreatorStatus: (isCreator: boolean) => void;
  loginAsCreator: (userId: string, password: string) => boolean; // Add this new function
  followCreator: (creatorId: string, creatorName: string) => void;
  unfollowCreator: (creatorId: string) => void;
  submitCreatorApplication: (payload: {
    username: string;
    bio?: string;
    socialLinks?: CreatorApplication['socialLinks'];
    demoTemplates: { image: string; prompt: string }[];
  }) => CreatorApplication;
  setCreatorApplicationStatus: (
    status: CreatorApplication['status'],
    options?: { rejectionReason?: string }
  ) => void;
  revokeCreatorAccess: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isCreator: false,
      login: (user) => set({ user, isAuthenticated: true, isCreator: user.isCreator }),
      logout: () => set({ user: null, isAuthenticated: false, isCreator: false, creatorApplication: null }),
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
      setCreatorStatus: (isCreator) => set({ isCreator }),
      // Mock function for creator login - in a real app, this would call an API
      loginAsCreator: (userId: string, password: string) => {
        // Simple validation for demo purposes
        if (userId && password) {
          const state = get();
          if (state.user) {
            // Update user to be a creator
            const updatedUser = {
              ...state.user,
              isCreator: true,
              creatorId: userId
            };
            set({ user: updatedUser, isCreator: true });
            return true;
          }
        }
        return false;
      },
      submitCreatorApplication: ({ username, bio, socialLinks, demoTemplates }) => {
        const state = get();
        if (!state.user) throw new Error('Not authenticated');
        const app: CreatorApplication = {
          id: `app_${Date.now()}`,
          userId: state.user.id,
          username,
          socialLinks: socialLinks || {},
          demoTemplates,
          status: 'pending',
          submittedAt: new Date().toISOString(),
        };
        // Save bio into user profile for convenience
        set({
          creatorApplication: app,
          user: { ...state.user, bio: bio || state.user.bio },
        });
        return app;
      },
      followCreator: (creatorId, creatorName) => {
        const state = get();
        if (!state.user) return;
        const existing = state.user.followingCreators || [];
        if (existing.some((c) => c.id === creatorId)) return;
        const updated = [...existing, { id: creatorId, name: creatorName }];
        set({ user: { ...state.user, followingCreators: updated } });
      },
      unfollowCreator: (creatorId) => {
        const state = get();
        if (!state.user) return;
        const existing = state.user.followingCreators || [];
        const updated = existing.filter((c) => c.id !== creatorId);
        set({ user: { ...state.user, followingCreators: updated } });
      },
      setCreatorApplicationStatus: (status, options) => {
        const state = get();
        const current = state.creatorApplication;
        if (!current) return;
        const reviewedAt = new Date().toISOString();
        const updatedApp: CreatorApplication = {
          ...current,
          status,
          reviewedAt,
          rejectionReason: options?.rejectionReason,
        };
        // If approved, upgrade user to creator
        if (status === 'approved' && state.user) {
          const updatedUser = { ...state.user, isCreator: true };
          set({ creatorApplication: updatedApp, user: updatedUser, isCreator: true });
        } else {
          set({ creatorApplication: updatedApp });
        }
      },
      revokeCreatorAccess: () => {
        const state = get();
        if (state.user) {
          set({ user: { ...state.user, isCreator: false }, isCreator: false });
        }
      }
    }),
    {
      name: 'rupantar-auth',
    }
  )
);