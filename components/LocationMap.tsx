import MapView, { Polyline } from "react-native-maps";
import { useDatabase } from "../contexts/dbContext";
import { useEffect, useState, useRef } from "react";
import { LocationItem } from "../models";
import { StyleSheet, View } from "react-native";

const LocationMap = () => {
  const db = useDatabase();
  const [items, setItems] = useState<LocationItem[]>([]);

  useEffect(() => {
    (async () => {
      setItems(await db.getSubsetLocation(0, -1));
    })();
  }, []);

  const mapRef = useRef<MapView>(null!);

  if (!items.length) return <View style={styles.cont} />;

  return (
    <MapView
      ref={mapRef}
      style={styles.cont}
      initialRegion={{
        latitude: items[0].latitude,
        longitude: items[0].longitude,
        latitudeDelta: 0,
        longitudeDelta: 0,
      }}
      onMapLoaded={() =>
        mapRef.current.fitToCoordinates(items, {
          edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
          animated: false,
        })
      }
    >
      <Polyline coordinates={items} />
    </MapView>
  );
};

const styles = StyleSheet.create({
  cont: {
    height: 300,
  },
});

export default LocationMap;
