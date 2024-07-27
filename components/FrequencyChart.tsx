import React, { useState , useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GraphPoint, LineGraph } from 'react-native-graph';
import { AccelerometerItem } from '../models';

const FrequencyChart = ({ items }: { items: AccelerometerItem[] }) => {
  const [value, setValue] = useState(-1);

  const groupDataByMinute = (items: AccelerometerItem[]) => {
    const groupedData: {[key: number]: number} = {};
    
    items.forEach((item: AccelerometerItem) => {
      const date = new Date(item.timestamp);
      date.setSeconds(0, 0);
      const minute = date.getTime();
      
      if (!groupedData[minute]) {
        groupedData[minute] = 0;
      }
      groupedData[minute]++;
    });

    return Object.entries(groupedData).map(([timestamp, count]) => ({
      date: new Date(Number(timestamp)),
      value: count
    }));
  };

  const [points, setPoints] = useState<GraphPoint[]>(groupDataByMinute(items));

  useEffect(() => {
    setPoints(groupDataByMinute(items));
  }, [items]);

  return (
    <View>
      <Text style={styles.txt}>{value}</Text>
      <LineGraph style={styles.cont}
        points={points}
        animated={true}
        color='#4484B2'
        enablePanGesture={true}
        onPointSelected={(p) => setValue(p.value)}
        onGestureEnd={() => setValue(-1)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  cont: {
    height: 200,
  },
  txt: {
    fontSize: 20,
  },
});

export default FrequencyChart;