import React, {useState, useEffect, useCallback} from 'react';
import {Button, SafeAreaView, Text, StyleSheet} from 'react-native';
import {
  accelerometer,
  setUpdateIntervalForType,
  SensorTypes,
} from 'react-native-sensors';
import {connect, initAcc, addAcc, getAcc} from './services/db';
import {AccelerometerItem} from './models';

function App(): React.JSX.Element {
  const [acc, setAcc] = useState<AccelerometerItem>({x: 0, y: 0, z: 0});

  const prepareDb = useCallback(async () => {
    try {
      const db = await connect();
      await initAcc(db);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    prepareDb();
  }, [prepareDb]);

  const add = async (item: AccelerometerItem) => {
    try {
      const db = await connect();
      await addAcc(db, item);
    } catch (error) {
      console.error(error);
    }
  };

  const get = async () => {
    const db = await connect();
    const latest = await getAcc(db);
    if (latest != null) {
      setAcc(latest);
    }
  };

  useEffect(() => {
    setUpdateIntervalForType(SensorTypes.accelerometer, 200);

    const sub = accelerometer.subscribe({
      next: (item: AccelerometerItem) => add(item),
      error: (error: any) => console.error('reading sensor data failed', error),
    });
    return () => sub.unsubscribe();
  }, []);

  return (
    <SafeAreaView style={styles.cont}>
      <Text style={styles.txt}>{JSON.stringify(acc)}</Text>
      <Button title="get latest item" onPress={() => get()} />
    </SafeAreaView>
  );
}

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

export default App;
