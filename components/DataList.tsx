import React, { useState, useEffect } from 'react';
import { FlatList, Text, View, ActivityIndicator, ListRenderItem } from 'react-native';
import {AccelerometerItem} from '../models';
import { useDatabase } from '../contexts/dbContext';

const DataList = () => {
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<AccelerometerItem[]>([]);
    const [nextPage, setNextPage] = useState(0);

    const db = useDatabase();
    const limit = 15;
  
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
      fetchPage(0);
    }, []);
  
    const renderItem: ListRenderItem<AccelerometerItem> = ({ item }) => {
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

    const onRefresh = () => {
      setItems([]);
      fetchPage(0);
    }
  
    return (
      <FlatList
        data={items}
        renderItem={renderItem}
        contentContainerStyle={{ gap: 20 }}
        onEndReached={() => fetchPage(nextPage)}
        onEndReachedThreshold={1}
        ListFooterComponent={() => loading && <ActivityIndicator />}
        refreshing={loading}
        onRefresh={onRefresh}
      />
    );
};

export default DataList;