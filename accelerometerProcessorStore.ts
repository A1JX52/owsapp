import { create } from "zustand";
import AccelerometerProcessor from "./services/AccelerometerProcessor";

interface AccelerometerProcessorState {
  processor: AccelerometerProcessor;
  setProcessor: (processor: AccelerometerProcessor) => void;
}

const useAccelerometerProcessorStore = create<AccelerometerProcessorState>()(
  (set) => ({
    processor: new AccelerometerProcessor(),
    setProcessor: (processor) => set(() => ({ processor: processor })),
  })
);

export default useAccelerometerProcessorStore;
