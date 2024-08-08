import React, { memo } from 'react';
import { View, Text, LayoutChangeEvent } from 'react-native';
import { AccelerometerItem } from '../models';

const DataListItem = ({ item, onLayout }: { item: AccelerometerItem, onLayout?: (event: LayoutChangeEvent) => void }) => {
  let d = new Date(item.timestamp);

  return (
  <View onLayout={onLayout}>
    <Text>id: {item.id}</Text>
    <Text>x: {item.x}</Text>
    <Text>y: {item.y}</Text>
    <Text>z: {item.z}</Text>
    <Text>timestamp: {d.toLocaleTimeString('en-GB') + '.' + d.getMilliseconds().toString().padStart(3, '0')}</Text>
  </View>
  );
};

export default memo(DataListItem, (prevProps, nextProps) => prevProps.item.id === nextProps.item.id);