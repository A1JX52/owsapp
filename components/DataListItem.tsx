import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { AccelerometerItem } from '../models';

const DataListItem = ({ item }: { item: AccelerometerItem }) => {
  let d = new Date(item.timestamp);

  return (
  <View>
    <Text>id: {item.id}</Text>
    <Text>x: {item.x}</Text>
    <Text>y: {item.y}</Text>
    <Text>z: {item.z}</Text>
    <Text>timestamp: {d.toLocaleTimeString('en-GB') + '.' + d.getMilliseconds()}</Text>
  </View>
  );
};

export default memo(DataListItem, (prevProps, nextProps) => prevProps.item.id === nextProps.item.id);