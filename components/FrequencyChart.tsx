import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, LayoutChangeEvent, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Skia, Canvas, Group, Path, ColorShader, Circle, DashPathEffect, vec, PathVerb } from '@shopify/react-native-skia';
import { scaleLinear } from 'd3-scale'
import { DataPoint } from '../models';
import { GestureDetector, Gesture, ScrollView } from 'react-native-gesture-handler';
import { useSharedValue, runOnJS } from 'react-native-reanimated';
import { getMinMax } from '../services/helper';

const PADDING = 16;

const FrequencyChart = ({ points }: { points: DataPoint[] }) => {
  const [dimension, setDimension] = useState({width: 0, height: 0});
  const [value, setValue] = useState(-1);
  const [yOrigin, setYOrigin] = useState(-1);

  const handleCanvasLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimension({ width, height });

    if (translateX.value > width - Dimensions.get('window').width / 2 + PADDING) {
      scrollRef.current?.scrollToEnd();
    }
  };

  const getYForX = (x: number) => {
    'worklet';
    const cmds = path.toCmds();
    let from = vec(0, 0);

    for (let i = 0; i < cmds.length; i++) {
      const cmd = cmds[i];

      if (cmd[0] === PathVerb.Move) {
        from = vec(cmd[1], cmd[2]);
      } else if (cmd[0] === PathVerb.Line) {
        const to = vec(cmd[1], cmd[2]);
        
        if (x >= from.x && x <= to.x) {
          const fraction = (x - from.x) / (to.x - from.x);
          setValue(fraction < 0.5 ? points[i - 1].value : points[i].value);
          return from.y + (to.y - from.y) * fraction;
        }
        from = to;
      }
    }
    return -40;
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
  
    data.slice(1).forEach(pt => {
      path.lineTo(xScale(pt.date), yScale(pt.value));
    });
    setYOrigin(yScale(0));
    return path;
  };

  const path = useMemo(() => buildPath(points), [points, dimension]);
  useEffect(() => {
    translateY.value = getYForX(translateX.value)
  }, [path]);
  
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
    translateY.value = getYForX(x);
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