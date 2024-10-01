import React, { useState, useEffect } from "react";
import {
  Text,
  Button,
  View,
  Alert,
  StyleSheet,
  NativeModules,
} from "react-native";
import { AccelerometerItem } from "../models";
import { useDatabase } from "../contexts/dbContext";
import useServiceStore from "../serviceStore";

const { AccelerometerModule } = NativeModules;

const DevView = () => {
  const [acc, setAcc] = useState<AccelerometerItem>({
    x: 0,
    y: 0,
    z: 0,
    timestamp: -1,
    id: -1,
  });
  const isRunning = useServiceStore((state) => state.isRunning);
  const db = useDatabase();

  let d = new Date(acc.timestamp);

  return (
    <View style={styles.cont}>
      <Button
        title={isRunning ? "stop" : "start"}
        onPress={async () => {
          if (isRunning) {
            AccelerometerModule.stopService();
          } else {
            const result =
              await AccelerometerModule.handleLocationPermissions();
            if (result !== "PERMISSION_GRANTED") return;
            AccelerometerModule.startService();
          }
        }}
      />
      <Text style={styles.txt}>
        {JSON.stringify(acc, undefined, 2) +
          "\n" +
          d.toLocaleTimeString("en-GB") +
          "." +
          d.getMilliseconds()}
      </Text>
      <Button
        title="get latest item"
        onPress={async () => {
          let acc = await db.getAcc();
          setAcc(acc ? acc : { x: 0, y: 0, z: 0, timestamp: -1, id: -1 });
        }}
      />
      <Button
        title="delete all items"
        onPress={() => {
          Alert.alert("confirm", "are you sure you want to delete all items?", [
            { text: "cancel" },
            { text: "okay", onPress: db.drop },
          ]);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  cont: {
    flex: 1,
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  txt: {
    color: "red",
    fontWeight: "bold",
    fontSize: 20,
  },
});

export default DevView;
