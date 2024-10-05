import { fft, ifft, abs, complex, conj } from "mathjs";
import WaveHeightFilter from "./WaveHeightFilter";

class FourierTransform {
  private fftResult: number[] = [];
  private domIndex = -1;

  public static stft(signal: number[], windowSize: number, hopSize: number) {
    const numSegments = Math.ceil((signal.length - windowSize) / hopSize) + 1;
    const fftResults: FourierTransform[] = [];

    for (let i = 0; i < numSegments; i++) {
      const segment = signal.slice(i * hopSize, i * hopSize + windowSize);
      if (segment.length < 6) continue;
      const ft = new FourierTransform();
      ft.fft(segment);
      fftResults.push(ft);
    }
    return fftResults;
  }

  public fft(signal: number[]) {
    const window = this.hammingWindow(signal.length);
    signal = signal.map((value, index) => value * window[index]);
    const fftResult = fft(signal);
    this.fftResult = fftResult;
    return fftResult;
  }

  public getDominantFrequency() {
    const numSamples = this.fftResult.length;
    const sampleRate = 1.0 / WaveHeightFilter.dT;

    const freqs = Array.from(
      { length: numSamples },
      (_, index) => (index * sampleRate) / numSamples
    );

    let domIndex = -1;
    let magnitudes = this.fftResult.map((complex) => abs(complex));
    const threshold =
      0.1 * Math.max(...magnitudes.slice(1, magnitudes.length / 2 - 1));
    for (let i = 1; i < magnitudes.length / 2 - 1; i++) {
      if (
        magnitudes[i] > magnitudes[i - 1] &&
        magnitudes[i] > magnitudes[i + 1] &&
        magnitudes[i] >= threshold &&
        (domIndex == -1 || magnitudes[i] > magnitudes[domIndex])
      ) {
        domIndex = i;
      }
    }
    if (domIndex == -1) {
      domIndex = magnitudes.indexOf(
        Math.max(...magnitudes.slice(1, magnitudes.length / 2 - 1)) // magnitudes.length >= 6
      );
    }
    this.domIndex = domIndex;
    return Math.abs(freqs[domIndex]);
  }

  public ifft() {
    const newFftResult = Array(this.fftResult.length).fill(complex(0, 0));
    const domCoef = this.fftResult[this.domIndex];
    newFftResult[this.domIndex] = domCoef;
    newFftResult[this.fftResult.length - this.domIndex] = conj(domCoef);
    return ifft(newFftResult);
  }

  private hammingWindow(size: number) {
    const window = [];
    for (let i = 0; i < size; i++) {
      window.push(0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (size - 1)));
    }
    return window;
  }
}

export default FourierTransform;
