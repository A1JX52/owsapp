import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, LayoutChangeEvent, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Skia, Canvas, Group, Path, ColorShader, Circle, DashPathEffect } from '@shopify/react-native-skia';
import { scaleLinear } from 'd3-scale'
import { interpolateNumber } from 'd3-interpolate'
import { DataPoint } from '../models';
import { GestureDetector, Gesture, ScrollView } from 'react-native-gesture-handler';
import { useSharedValue, runOnJS } from 'react-native-reanimated';
import { getMinMax } from '../services/helper';

const PADDING = 16;

const FrequencyChart = ({ points }: { points: DataPoint[] }) => {
  const [dimension, setDimension] = useState({width: 0, height: 0});
  const [getYForX, setGetYForX] = useState(() => (x: number) => {'worklet';});
  const [value, setValue] = useState(-1);
  const [yOrigin, setYOrigin] = useState(-1);

  const handleCanvasLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimension({ width, height });

    if (translateX.value > width - Dimensions.get('window').width / 2 + PADDING) {
      scrollRef.current?.scrollToEnd();
    }
  };

  const translateX = useSharedValue(PADDING);
  const translateY = useSharedValue(-40);

  const buildPath = (data: DataPoint[]) => {
    const path = Skia.Path.Make();
  
    if (!data.length) return path;
  
    const values = data.map(pt => pt.value);
    const dates = data.map(pt => pt.date);
  
    const xScale = scaleLinear()
      .domain([dates[0], dates[dates.length - 1]])
      .range([PADDING, dimension.width - PADDING]); // PADDING because strokeWidth may exceed canvas at edge
  
    const yScale = scaleLinear()
      .domain(Object.values(getMinMax(values)))
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
      translateY.value = -40;
    };

    setGetYForX(() => (x: number) => {
      'worklet';
      runOnJS(wrapper)(x);
    });
    setYOrigin(yScale(0));
    return path;
  };

  const path = useMemo(() => buildPath(points), [points, dimension]);
  useEffect(() => getYForX(translateX.value), [path]);
  
  const scrollRef = useRef<ScrollView>(null);
  const [scale, setScale] = useState(1);
  const oldScale = useSharedValue(1);

  const pinch = Gesture.Pinch()
    .blocksExternalGesture(scrollRef)
    .onBegin((event) => {
      oldScale.value = scale;
    })
    .onUpdate((event) => {
      runOnJS(setScale)(Math.max(oldScale.value * event.scale, 1));
    })
    .onEnd((event) => {
      if (oldScale.value * event.scale < 1) {
        event.scale = 1 / oldScale.value;
      }
      runOnJS(setDimension)({
        width: dimension.width * event.scale,
        height: dimension.height,
      });
    });

  
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const width = event.nativeEvent.contentSize.width;
    let x = Math.min(Math.max(0, event.nativeEvent.contentOffset.x), width); // values can be out of bounds because of overScroll caused by inertia
    x += PADDING;
    translateX.value = x;
    getYForX(x);
  }

  return (
    <GestureDetector gesture={pinch}>
      <View style={styles.cont}>
        <Text style={styles.txt}>{value}</Text>
        <ScrollView
          horizontal
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: Dimensions.get('window').width / 2 - PADDING * 2 }} // equals calc(50% - PADDING)
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
        >
          <Canvas style={{ flex: 1, minWidth: '100%' /* minWidth required because dimension.width is initially 0 */, width: dimension.width }} onLayout={handleCanvasLayout}>
            <Group>
              <Path
                path={`M ${PADDING} ${yOrigin} L ${dimension.width - PADDING} ${yOrigin}`}
                color='grey'
                style='stroke'
                strokeWidth={2}
              >
                <DashPathEffect intervals={[6, 6]} />
              </Path>
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
        </ScrollView>
        <Text style={styles.txtScale}>{scale.toFixed(2)}</Text>
      </View>
    </GestureDetector>
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
  txtScale: {
    fontSize: 16,
    color: 'tomato',
  },
});

export default FrequencyChart;