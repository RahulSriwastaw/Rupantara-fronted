import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, CreatorApplication } from '@/types';
import { creatorApi } from '@/services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isCreator: boolean;
  creatorApplication: CreatorApplication | null;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setCreatorStatus: (isCreator: boolean) => void;
  followCreator: (creatorId: string, creatorName: string) => void;
  unfollowCreator: (creatorId: string) => void;
  submitCreatorApplication: (payload: {
    username: string;
    bio?: string;
    socialLinks?: CreatorApplication['socialLinks'];
    demoTemplates: { image: string; prompt: string }[];
  }) => Promise<CreatorApplication>;
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
      creatorApplication: null,
      login: (user) => {
        const isCreator = user.isCreator || user.role === 'creator';
        set({
          user: { ...user, isCreator },
          isAuthenticated: true,
          isCreator
        });
      },
      logout: () => {
        // Token removal required for full logout
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        set({ user: null, isAuthenticated: false, isCreator: false, creatorApplication: null })
      },
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
      setCreatorStatus: (isCreator) =>
        set((state) => ({
          isCreator,
          user: state.user ? { ...state.user, isCreator } : null
        })),
      submitCreatorApplication: async (payload) => {
        const state = get();
        if (!state.user) throw new Error('Not authenticated');
        const { username, bio, socialLinks, demoTemplates } = payload;
        const backendRes = await creatorApi.apply({
          username: username,
          socialLinks: socialLinks || {}
        });
        const app: CreatorApplication = {
          id: String((backendRes as any).id || (backendRes as any)._id || `app_${Date.now()}`),
          userId: state.user.id,
          username,
          socialLinks: socialLinks || {},
          demoTemplates,
          status: String((backendRes as any).status || 'pending') as CreatorApplication['status'],
          submittedAt: String((backendRes as any).appliedDate || new Date().toISOString()),
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

        import('@/services/api').then(({ userApi }) => {
          userApi.followUser(creatorId).catch(err => console.error("Follow failed", err));
        });

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
      skipHydration: true,
    }
  )
);
