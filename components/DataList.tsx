import React, { useState, useMemo, useEffect } from "react";
import {
  FlatList,
  Text,
  ActivityIndicator,
  View,
  Button,
  LayoutChangeEvent,
} from "react-native";
import { AccelerometerItem, DataPoint } from "../models";
import { useDatabase } from "../contexts/dbContext";
import DataListItem from "./DataListItem";
import FrequencyChart from "./FrequencyChart";
import LocationMap from "./LocationMap";
import useAccelerometerProcessorStore from "../accelerometerProcessorStore";

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
      return [...items, ...newItems];
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
  };

  const onItemLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setItemHeight(height);
  };

  const getItemLayout = (
    data: ArrayLike<any> | null | undefined,
    index: number
  ) => ({
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
      value: count,
    }));
  };

  const frequencyPoints = useMemo(
    () => buildFrequencyPoints([...allItems].reverse()),
    [allItems]
  );

  const accProcessor = useAccelerometerProcessorStore(
    (state) => state.processor
  );

  const accSetProcessor = useAccelerometerProcessorStore(
    (state) => state.setProcessor
  );

  useEffect(() => {
    if (!allItems.length) return;
    accProcessor.reset(allItems);
    accProcessor.applyHighPassFilter();
    accProcessor.applyKalmanFilter();
    accSetProcessor(accProcessor.clone());
  }, [allItems]);

  const accPoints = useMemo(() => accProcessor.getHeights(), [accProcessor]);

  return (
    <View style={{ flex: 1 }}>
      <LocationMap />
      <FrequencyChart points={accPoints} />
      <FrequencyChart points={frequencyPoints} />
      <Button
        title="scroll to end"
        onPress={() => {
          setNextPage(allItems.length);
          setItems(allItems);
          setScrollToEnd(true);
        }}
      />
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }: { item: AccelerometerItem }) => (
          <DataListItem
            item={item}
            onLayout={item.id != allItems[0].id ? undefined : onItemLayout}
          />
        )}
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
