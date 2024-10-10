import { AccelerometerItem, DataPoint } from "../models";
import WaveHeightFilter from "./WaveHeightFilter";
import FourierTransform from "./FourierTransform";
import HighPassFilter from "./HighPassFilter";
import { mean } from "mathjs";

var downsampler = require("downsample-lttb");
class AccelerometerProcessor {
  private result: number[][] = [];

  public clone() {
    const dp = new AccelerometerProcessor();
    dp.result = this.result;
    return dp;
  }

  public reset(items: AccelerometerItem[]) {
    this.result = items.map((item) => [item.z]); // [accZ]

    this._peaksIndex = undefined;
    this._troughsIndex = undefined;
  }

  public applyHighPassFilter() {
    const observations = this.result.flat();
    const fftResult = new FourierTransform();
    fftResult.fft(observations);

    const hpFilter = new HighPassFilter(0.9 * fftResult.getDominantFrequency());
    let hpObservations = [];
    for (let i = 0; i < observations.length; i++) {
      hpObservations.push([hpFilter.filter(observations[i])]);
    }
    this.result = hpObservations; // [accZ]
  }

  public applyKalmanFilter() {
    this.result = new WaveHeightFilter(this.result).filterAll(); // [cumsum, position, velocity]
  }

  public getHeights(threshold = 0): DataPoint[] {
    if (!threshold || threshold >= this.result.length) {
      return this.result.map(([cumsum, position, velocity], index) => ({
        date: index * WaveHeightFilter.dT,
        value: position,
      }));
    }
    let temp = this.result.map(([cumsum, position, velocity], index) => [
      index,
      position,
    ]);
    temp = downsampler.processData(temp, threshold);
    return temp.map(([index, position]) => ({
      date: index * WaveHeightFilter.dT,
      value: position,
    }));
  }
  private _peaksIndex?: number[];

  get peaksIndex(): number[] {
    if (this._peaksIndex == undefined) {
      const signs = this.result
        .map(([cumsum, position, velocity]) => velocity)
        .map((velocity) => (velocity < 0 ? -1 : 1));

      const peaks = [];
      for (let i = 1; i < signs.length; i++) {
        if (signs[i] - signs[i - 1] < 0) peaks.push(i);
      }
      this._peaksIndex = peaks;
    }
    return this._peaksIndex;
  }

  get peaks(): DataPoint[] {
    return this.peaksIndex.map((index) => ({
      date: index * WaveHeightFilter.dT,
      value: this.result[index][1],
    }));
  }
  private _troughsIndex?: number[];

  private get troughsIndex(): number[] {
    if (this._troughsIndex == undefined) {
      const signs = this.result
        .map(([cumsum, position, velocity]) => velocity)
        .map((velocity) => (velocity < 0 ? -1 : 1));

      const troughs = [];
      for (let i = 1; i < signs.length; i++) {
        if (signs[i] - signs[i - 1] > 0) troughs.push(i);
      }
      this._troughsIndex = troughs;
    }
    return this._troughsIndex;
  }

  get troughs(): DataPoint[] {
    return this.troughsIndex.map((index) => ({
      date: index * WaveHeightFilter.dT,
      value: this.result[index][1],
    }));
  }

  get meanWaveHeight() {
    const peakMean = mean(
      this.peaksIndex.map((index) => this.result[index][1])
    );
    const troughMean = mean(
      this.troughsIndex.map((index) => this.result[index][1])
    );
    return -troughMean + peakMean;
  }
}

export default AccelerometerProcessor;
