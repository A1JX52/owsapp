import React, {useState, useEffect} from 'react';
import {Text, Button, View, Alert, StyleSheet, NativeModules, NativeEventEmitter} from 'react-native';
import {AccelerometerItem} from '../models';
import {useDatabase} from '../contexts/dbContext';

const {AccelerometerModule} = NativeModules;

const DevView = () => {
  const [acc, setAcc] = useState<AccelerometerItem>({x: 0, y: 0, z: 0, timestamp: -1, id: -1});
  const [record, setRecord] = useState(false);
  const db = useDatabase();

  useEffect(() => {
    if (!record) {
      AccelerometerModule.stopService();
      return;
    }
    AccelerometerModule.startService();
    const eventEmitter = new NativeEventEmitter(AccelerometerModule);
    let eventListener = eventEmitter.addListener('AccelerometerData', (event: AccelerometerItem) => {
      db.addAcc(event);
    });
    return () => {
      eventListener.remove();
    };
  }, [record]);
    
  let d = new Date(acc.timestamp);

  return (
    <View style={styles.cont}>
      <Button title={record ? 'stop' : 'start'} onPress={() => setRecord(!record)}/>
      <Text style={styles.txt}>{JSON.stringify(acc, undefined, 2) + '\n' + d.toLocaleTimeString('en-GB') + '.' + d.getMilliseconds()}</Text>
      <Button title='get latest item' onPress={async () => {
        let acc = await db.getAcc();
        setAcc(acc ? acc : {x: 0, y: 0, z: 0, timestamp: -1, id: -1});
      }}/>
      <Button
        title='delete all items'
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