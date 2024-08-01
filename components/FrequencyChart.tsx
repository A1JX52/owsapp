import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, Text, LayoutChangeEvent } from 'react-native';
import { Skia, Canvas, Group, Path, ColorShader, Circle } from '@shopify/react-native-skia';
import { scaleLinear } from 'd3-scale'
import { interpolateNumber } from 'd3-interpolate'
import { AccelerometerItem } from '../models';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useSharedValue, runOnJS } from 'react-native-reanimated';

const PADDING = 16;

interface DataPoint {
  date: number,
  value: number,
}

const buildPoints = (items: AccelerometerItem[]): DataPoint[] => {
  const groupedData: { [key: number]: number } = {};

  items.forEach((item: AccelerometerItem) => {
    const date = new Date(item.timestamp);
    date.setMilliseconds(0);
    const minute = date.getTime();

    if (!groupedData[minute]) {
      groupedData[minute] = 0;
    }
    groupedData[minute]++;
  });

  return Object.entries(groupedData).map(([timestamp, count]) => ({
    date: +timestamp,
    value: count
  }));
};

const FrequencyChart = ({ items }: { items: AccelerometerItem[] }) => {
  const [dimension, setDimension] = useState({width: 0, height: 0});
  const [getYForX, setGetYForX] = useState(() => (x: number) => {'worklet';});
  const [value, setValue] = useState(-1);

  const handleCanvasLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimension({ width, height });
  };

  const translateX = useSharedValue(PADDING);
  const translateY = useSharedValue(40);

  const buildPath = (data: DataPoint[]) => {
    const path = Skia.Path.Make();
  
    if (!data.length) return path;
  
    const values = data.map(pt => pt.value);
    const dates = data.map(pt => pt.date);
  
    const xScale = scaleLinear()
      .domain([Math.min(...dates), Math.max(...dates)])
      .range([PADDING, dimension.width - PADDING]);
  
    const yScale = scaleLinear()
      .domain([Math.min(...values), Math.max(...values)])
      .range([dimension.height - PADDING, PADDING]);
  
    path.moveTo(xScale(data[0].date), yScale(data[0].value));
  
    data.forEach(pt => {
      path.lineTo(xScale(pt.date), yScale(pt.value));
    });

    const wrapper = (x: number) => {
      const date = xScale.invert(x);
      for (let i = 0; i < data.length - 1; i++) {
        var pt1 = data[i];
        var pt2 = data[i + 1];

        if (date >= pt1.date && date <= pt2.date) {
          const i = interpolateNumber(pt1.value, pt2.value);
          const t = (date - pt1.date) / (pt2.date - pt1.date);
          translateY.value = yScale(i(t));
          setValue(date - pt1.date < pt2.date - date ? pt1.value : pt2.value);
          return;
        }
      }
      translateY.value = 40;
    };

    setGetYForX(() => (x: number) => {
      'worklet';
      runOnJS(wrapper)(x);
    });
    return path;
  };

  const points = useMemo(() => buildPoints(items), [items, dimension]);
  const path = useMemo(() => buildPath(points), [points]);
  useEffect(() => getYForX(translateX.value), [path]);
  
  const gesture = Gesture.Pan()
    .onChange((pos) => {
      const newTranslateX = translateX.value + pos.changeX;

      if (newTranslateX > dimension.width - PADDING) {
        translateX.value = dimension.width - PADDING;
      } else if (newTranslateX < PADDING) {
        translateX.value = PADDING;
      } else {
        translateX.value += pos.changeX;
      }
      getYForX(translateX.value);
    });

  return (
    <View style={styles.cont}>
      <Text style={styles.txt}>{value}</Text>
      <GestureDetector gesture={gesture}>
        <Canvas style={{ flex: 1 }} onLayout={handleCanvasLayout}>
          <Group>
            <Path
              path={path}
              style='stroke'
              strokeWidth={3}
            >
              <ColorShader color='lightBlue' />
            </Path>
          </Group>
          <Circle cx={translateX} cy={translateY} r={7} color='white' />
        </Canvas>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  cont: {
    backgroundColor: '#1F1D2B',
    padding: PADDING,
    height: 200,
  },
  txt: {
    fontSize: 20,
    color: 'white',
  },
});

export default FrequencyChart;