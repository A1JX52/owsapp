import React, {useState, useEffect} from 'react';
import {Text, Button, View, Alert, StyleSheet} from 'react-native';
import {
  accelerometer,
  setUpdateIntervalForType,
  SensorTypes,
} from 'react-native-sensors';
import {AccelerometerItem} from '../models';
import {useDatabase} from '../contexts/dbContext';

const DevView = () => {
  const [acc, setAcc] = useState<AccelerometerItem>({x: 0, y: 0, z: 0});
  const db = useDatabase();

  useEffect(() => {
    setUpdateIntervalForType(SensorTypes.accelerometer, 200);

    const sub = accelerometer.subscribe({
      next: (item: AccelerometerItem) => db.addAcc(item),
      error: (error: any) => console.error('reading sensor data failed', error),
    });
    return () => sub.unsubscribe();
  }, []);
    
  return (
    <View>
      <Text style={styles.txt}>{JSON.stringify(acc)}</Text>
      <Button title="get latest item" onPress={async () => {
        let acc = await db.getAcc();
        if (acc) {
          setAcc(acc);
        }
      }}/>
      <Button
        title="delete all items"
        onPress={() => {
          Alert.alert('confirm', 'are you sure you want to delete all items?', [
            {text: 'cancel'},
            {text: 'okay', onPress: db.deleteAcc},
          ]);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  cont: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  txt: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 20,
  },
});

export default DevView;