import { AccelerometerItem, DataPoint } from "../models";
import WaveHeightFilter from "./WaveHeightFilter";
import FourierTransform from "./FourierTransform";
import HighPassFilter from "./HighPassFilter";

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
}

export default AccelerometerProcessor;
