import { create } from 'zustand'

interface ServiceState {
  isRunning: boolean;
  setRunning: (running: boolean) => void;
}

const useServiceStore = create<ServiceState>()((set) => ({
  isRunning: false,
  setRunning: (running) => set(() => ({ isRunning: running })),
}));

export default useServiceStore;