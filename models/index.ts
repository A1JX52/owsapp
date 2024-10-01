export type AccelerometerItem = {
  x: number;
  y: number;
  z: number;
  timestamp: number;
  id: number;
};

export type LocationItem = {
  latitude: number;
  longitude: number;
  timestamp: number;
  id: number;
};

export type DataPoint = {
  date: number;
  value: number;
};
