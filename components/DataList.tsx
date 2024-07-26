import React, { useState, useEffect } from 'react';
import { FlatList, Text, ActivityIndicator } from 'react-native';
import {AccelerometerItem} from '../models';
import { useDatabase } from '../contexts/dbContext';
import DataListItem from './DataListItem';

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
  
    const onRefresh = () => {
      setItems([]);
      fetchPage(0);
    }
  
    return (
      <FlatList
        data={items}
        renderItem={({ item }) => <DataListItem item={ item } />}
        contentContainerStyle={{ gap: 20 }}
        onEndReached={() => fetchPage(nextPage)}
        onEndReachedThreshold={1}
        ListFooterComponent={() => loading && <ActivityIndicator />}
        refreshing={loading}
        onRefresh={onRefresh}
        ListEmptyComponent={<Text>there are no recordings</Text>}
      />
    );
};

export default DataList;