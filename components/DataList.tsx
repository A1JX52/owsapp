import React, { useState, useMemo, useEffect } from 'react';
import { FlatList, Text, ActivityIndicator, View, Button, LayoutChangeEvent } from 'react-native';
import { AccelerometerItem, DataPoint } from '../models';
import { useDatabase } from '../contexts/dbContext';
import DataListItem from './DataListItem';
import FrequencyChart from './FrequencyChart';
import WaveHeightFilter from '../services/WaveHeightFilter';
import LocationMap from './LocationMap';

const DataList = () => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AccelerometerItem[]>([]);
  const [nextPage, setNextPage] = useState(0);
  const [allItems, setAllItems] = useState<AccelerometerItem[]>([]);
  const [itemHeight, setItemHeight] = useState(-1);
  const [scrollToEnd, setScrollToEnd] = useState(false);

  const db = useDatabase();
  const limit = 15;
  const listRef = React.useRef<FlatList>(null!);

  const fetchPage = async (page: number) => {
    if (loading) return;
    setLoading(true);

    const newItems = await db.getSubsetAcc(page, limit);
    
    setItems((items) => {
      return [...items, ...newItems]
    });
    setNextPage(page + limit);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      setAllItems(await db.getSubsetAcc(0, -1));
    })();
    fetchPage(0);
  }, []);

  useEffect(() => {
    if (scrollToEnd && listRef.current) {
      listRef.current.scrollToEnd();
      setScrollToEnd(false);
    }
  }, [scrollToEnd, items]);

  const onRefresh = () => {
    setItems([]);
    (async () => {
      setAllItems(await db.getSubsetAcc(0, -1));
    })();
    fetchPage(0);
  }

  const onItemLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setItemHeight(height);
  };

  const getItemLayout = (data: ArrayLike<any> | null | undefined, index: number) => ({
    length: itemHeight,
    offset: (itemHeight + 20) * index + 20,
    index,
  });

  const buildFrequencyPoints = (items: AccelerometerItem[]): DataPoint[] => {
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

  const frequencyPoints = useMemo(() => buildFrequencyPoints([...allItems].reverse()), [allItems]);

  var downsampler = require("downsample-lttb");
  const buildAccelerationPoints = (items: AccelerometerItem[]): DataPoint[] => {
    if (!items.length) return [];
    const observations = items.map(item => [item.z]);
    let result = (new WaveHeightFilter(observations)).filterAll();
    result = result.map(([cumsum, position, velocity], index) => ([
      index,
      position,
    ]));
    result = downsampler.processData(result, Math.trunc(items.length / 100));
    return result.map(([index, position]) => ({
      date: index * WaveHeightFilter.dT,
      value: position,
    }));
  }

  const accelerationPoints = useMemo(() => buildAccelerationPoints([...allItems].reverse()), [allItems]);

  return (
    <View style={{ flex: 1 }}>
      <LocationMap />
      <FrequencyChart points={accelerationPoints} />
      <FrequencyChart points={frequencyPoints} />
      <Button title='scroll to end' onPress={() => {
        setNextPage(allItems.length);
        setItems(allItems);
        setScrollToEnd(true);
      }} />
      <FlatList
        data={items}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }: { item: AccelerometerItem }) =>
          <DataListItem
            item={ item }
            onLayout={ item.id != allItems[0].id ? undefined : onItemLayout }
          />
        }
        contentContainerStyle={{ gap: 20 }}
        onEndReached={() => fetchPage(nextPage)}
        onEndReachedThreshold={1}
        getItemLayout={getItemLayout}
        ListFooterComponent={() => loading && <ActivityIndicator />}
        refreshing={loading}
        onRefresh={onRefresh}
        ListEmptyComponent={<Text>there are no recordings</Text>}
        ref={listRef}
      />
    </View>
  );
};

export default DataList;