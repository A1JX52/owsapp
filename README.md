A mobile sensing system that repurposes old smartphones placed in open-water buoys to capture motion data in marine environments.

### How It Works

Raw accelerometer data is accessed via Android Native Modules and passed through a **Kalman filter** to reduce sensor noise — necessary because the raw data is too inaccurate for direct double integration to displacement. A **Fast Fourier Transform (FFT)** is then applied to identify dominant wave periods, based on a trochoidal wave model. Wave height, detected peaks and troughs, and the sensor sampling rate are visualized using React Native Skia.

Developer: Florian Eigendorf
