const { KalmanFilter } = require('kalman-filter');
import { diag, mean, multiply, subtract } from 'mathjs'

class WaveHeightFilter {
  static dT = 0.01;
  private B = [[(1.0/6) * WaveHeightFilter.dT ** 3], [0.5 * WaveHeightFilter.dT ** 2], [WaveHeightFilter.dT]]; // one single integration for each to only apply the difference in acceleration
  private index = 0;

  private mean;

  constructor(private observations: number[][]) {
    this.mean = mean(observations);
  }

  private kFilter = new KalmanFilter({
    observation: {
      dimension: 1,
      stateProjection: [[1, 0, 0]], // '[[]]' in case of multiple sensors or one sensor has multiple dimensions; inverted interpretation due to kalman filter algorithm
      covariance: [0.05 ** 2], // special syntax allowed for diagonal of 2d matrix instead of diag()
    },
    dynamic: {
      init: {
        mean: [[0], [0], [0]],
        covariance: [0, 0, 0],
      },
      dimension: 3, // [position, velocity, acceleration]
      timeStep: WaveHeightFilter.dT,
      transition: [
        [1, WaveHeightFilter.dT, 0.5 * WaveHeightFilter.dT ** 2],
        [0, 1, WaveHeightFilter.dT],
        [0, 0, 1],
      ], // is not ambiguous; specific physical model
      constant: ({previousCorrected}: any) => { // transforms the predicted state to the actual output state [cumsum, position, velocity]
        // use global index because only 'k-1' is provided
        const u = subtract(this.observations[this.index][0], this.mean);
        this.index++;
        const result = multiply(this.B, u);
        return result;
      },
      covariance: [0.1, 0.1, 0.5],
    }
  });

  filterAll(): number[][] {
    this.index = 0;

    let previousCorrected: any = null;
    const results: number[][] = [];
    this.observations.forEach(observation => {
      const predicted = this.kFilter.predict({
        previousCorrected
      });

      const correctedState = this.kFilter.correct({
        predicted,
        observation: [0] // already handled by external influence because we normalize the observations relative to a mean value
      });

      results.push(correctedState.mean.flat());
      previousCorrected = correctedState
    });
    return results;
  }
}

export default WaveHeightFilter;