import { create } from 'zustand';
import { getAgentStatus } from '@/api';

export type AssistantStatusType = 'idle' | 'active' | 'processing' | 'error';

interface AssistantState {
  status: AssistantStatusType;
  activeSessions: number;
  isConnected: boolean;
  lastActivity: Date | null;
  isBusy: boolean; // Local busy state for portal actions

  // Actions
  setStatus: (status: AssistantStatusType) => void;
  setConnected: (connected: boolean) => void;
  setBusy: (busy: boolean) => void;
  fetchStatus: () => Promise<void>;
}

export const useAssistantStore = create<AssistantState>((set, get) => ({
  status: 'idle',
  activeSessions: 0,
  isConnected: false,
  lastActivity: null,
  isBusy: false,

  setStatus: (status) => set({ status }),

  setConnected: (connected) => set({ isConnected: connected }),

  setBusy: (busy) => set({ 
    isBusy: busy,
    status: busy ? 'processing' : (get().isConnected ? 'idle' : 'error'),
  }),

  fetchStatus: async () => {
    try {
      const data = await getAgentStatus();
      const currentBusy = get().isBusy;
      set({
        // Keep processing state if we're locally busy
        status: currentBusy ? 'processing' : (data.busy ? 'processing' : 'idle'),
        activeSessions: data.active_sessions || 0,
        lastActivity: data.last_activity ? new Date(data.last_activity) : null,
        isConnected: true,
      });
    } catch {
      set({ status: 'error', isConnected: false });
    }
  },
}));
