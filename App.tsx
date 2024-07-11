import React from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import {DatabaseProvider} from './contexts/dbContext';
import DevView from './components/DevView';

function App(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.cont}>
      <DatabaseProvider>
        <DevView/>
      </DatabaseProvider>
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
