import React, { useState, useMemo, useEffect } from "react";
import { StyleSheet, Text, Dimensions } from "react-native";
import {
  Skia,
  Canvas,
  Group,
  Path,
  ColorShader,
  Circle,
  DashPathEffect,
  vec,
  PathVerb,
} from "@shopify/react-native-skia";
import { scaleLinear } from "d3-scale";
import { DataPoint } from "../models";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useDerivedValue,
  runOnJS,
  withSpring,
} from "react-native-reanimated";
import { getMinMax } from "../services/helper";
import AnimatedText from "./AnimatedText";

const PADDING = 16;

const FrequencyChart = ({
  points,
  peaks = [],
  troughs = [],
  additionalPoints = [],
}: {
  points: DataPoint[];
  peaks?: DataPoint[];
  troughs?: DataPoint[];
  additionalPoints?: DataPoint[];
}) => {
  const [scale, setScale] = useState(1);
  const output = useSharedValue(-1);
  const [yOrigin, setYOrigin] = useState(-1);

  const translateX = useSharedValue(
    Dimensions.get("window").width / 2 - PADDING
  );

  const canvasSize = useSharedValue({ width: 0, height: 0 });
  const contentSize = useDerivedValue(() => {
    const newContentWidth = canvasSize.value.width * scale;
    const paddingHorizontal = canvasSize.value.width / 2;
    if (paddingHorizontal) {
      // would otherwise ruin our initial translateX value during rendering
      // handle fractional deviations in layout (Dimensions.get('window').width != canvasSize.width)
      const x = Math.max(
        Math.min(paddingHorizontal, translateX.value),
        -newContentWidth + paddingHorizontal
      ); // fix scroll out of content
      translateX.value = x;
    }
    return { width: newContentWidth, height: canvasSize.value.height };
  });

  const xScale = (value: number) =>
    scaleLinear()
      .domain([points[0].date, points[points.length - 1].date])
      .range([0, contentSize.value.width])(value);

  const yScale = (value: number) =>
    scaleLinear()
      .domain(Object.values(getMinMax(points.map((pt) => pt.value))))
      .range([contentSize.value.height - PADDING, PADDING])(value); // PADDING because strokeWidth may exceed canvas at edge

  const buildPath = (data: DataPoint[]) => {
    const path = Skia.Path.Make();

    if (!data.length) return path;

    path.moveTo(xScale(data[0].date), yScale(data[0].value));

    data.slice(1).forEach((pt) => {
      path.lineTo(xScale(pt.date), yScale(pt.value)); // path.doPoint(xScale(pt.date)).x != xScale(pt.date)
    });
    setYOrigin(yScale(0));
    return path;
  };

  const path = useMemo(
    () => buildPath(points),
    [points, contentSize.value.width]
  ); // should not listen to a shared value like that

  const additionalPath = useMemo(
    () => buildPath(additionalPoints),
    [additionalPoints, contentSize.value.width]
  );

  const buildCircles = (data: DataPoint[]) => {
    return data.map((pt) => ({
      cx: xScale(pt.date),
      cy: yScale(pt.value),
    }));
  };

  const peakCircles = useMemo(
    () => buildCircles(peaks),
    [peaks, contentSize.value.width]
  );

  const troughCircles = useMemo(
    () => buildCircles(troughs),
    [troughs, contentSize.value.width]
  );

  const getYForX = (x: number) => {
    "worklet";
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
          output.value = fraction < 0.5 ? points[i - 1].value : points[i].value;
          return from.y + (to.y - from.y) * fraction;
        }
        from = to;
      }
    }
    if (cmds.length && x >= from.x) return from.y; // handle minor deviations in path (caused by graphics engine)
    return -40;
  };

  const translateXWithSpring = useDerivedValue(() =>
    withSpring(translateX.value, {
      mass: 0.3,
      damping: 30,
    })
  );
  const translateY = useDerivedValue(() =>
    getYForX(-translateXWithSpring.value + canvasSize.value.width / 2)
  );

  const oldScale = useSharedValue(1);

  const pinch = Gesture.Pinch()
    .onBegin((event) => {
      oldScale.value = scale;
    })
    .onUpdate((event) => {
      runOnJS(setScale)(Math.max(oldScale.value * event.scale, 1));
    });

  const transform = useDerivedValue(() => [
    { translateX: translateXWithSpring.value },
  ]);

  const pan = Gesture.Pan()
    .simultaneousWithExternalGesture(pinch)
    .maxPointers(1)
    .onChange((event) => {
      const paddingHorizontal = canvasSize.value.width / 2;
      const x = Math.max(
        Math.min(paddingHorizontal, translateX.value + event.changeX),
        -contentSize.value.width + paddingHorizontal
      );
      translateX.value = x;
    });

  return (
    <GestureDetector gesture={pinch}>
      <Animated.View style={styles.cont}>
        <AnimatedText sv={output} style={styles.txt} />
        <GestureDetector gesture={pan}>
          <Canvas style={{ flex: 1 }} onSize={canvasSize}>
            <Group transform={transform}>
              <Path
                path={`M ${0} ${yOrigin} L ${
                  contentSize.value.width
                } ${yOrigin}`}
                color="grey"
                style="stroke"
                strokeWidth={2}
              >
                <DashPathEffect intervals={[6, 6]} />
              </Path>
              <Path path={additionalPath} style="stroke" strokeWidth={3}>
                <ColorShader color="lightPink" />
              </Path>
              <Path path={path} style="stroke" strokeWidth={3}>
                <ColorShader color="lightBlue" />
              </Path>
              {peakCircles.map(({ cx, cy }, index) => (
                <Circle key={index} cx={cx} cy={cy} r={3} color="red" />
              ))}
              {troughCircles.map(({ cx, cy }, index) => (
                <Circle key={index} cx={cx} cy={cy} r={3} color="yellow" />
              ))}
            </Group>
            <Circle
              cx={canvasSize.value.width / 2}
              cy={translateY}
              r={7}
              color="white"
            />
          </Canvas>
        </GestureDetector>
        <Text style={styles.txtScale}>{scale.toFixed(2)}</Text>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  cont: {
    backgroundColor: "#1F1D2B",
    padding: PADDING,
    height: 200,
  },
  txt: {
    fontSize: 20,
    color: "white",
  },
  txtScale: {
    fontSize: 16,
    color: "tomato",
  },
});

export default FrequencyChart;
