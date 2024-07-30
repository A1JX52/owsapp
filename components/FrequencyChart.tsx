import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Text, LayoutChangeEvent } from 'react-native';
import { Skia, Canvas, Group, Path, ColorShader } from '@shopify/react-native-skia';
import { scaleLinear } from 'd3-scale'
import { AccelerometerItem } from '../models';

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

  const handleCanvasLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimension({ width, height });
  };

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
    data.shift();
  
    data.forEach(pt => {
      path.lineTo(xScale(pt.date), yScale(pt.value));
    });
    return path;
  };

  const points = useMemo(() => buildPoints(items), [items, dimension]);
  const path = useMemo(() => buildPath(points), [points]);

  return (
    <View style={styles.cont}>
      <Text style={styles.txt}>Frequency Chart</Text>
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
      </Canvas>
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