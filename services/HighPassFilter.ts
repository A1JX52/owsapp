import WaveHeightFilter from "./WaveHeightFilter";

class HighPassFilter {
  private alpha;
  private prevInput = 0;
  private prevOutput = 0;

  constructor(cutoffFreq: number) {
    this.alpha = 1 / (2 * Math.PI * WaveHeightFilter.dT * cutoffFreq + 1);
  }

  public filter(input: number): number {
    const output = this.alpha * this.prevOutput + (input - this.prevInput);
    this.prevInput = input;
    this.prevOutput = output;
    return output;
  }
}

export default HighPassFilter;
