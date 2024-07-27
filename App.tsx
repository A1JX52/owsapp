import React from 'react';
import { Text } from 'react-native';
import {DatabaseProvider} from './contexts/dbContext';
import DevView from './components/DevView';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DataList from './components/DataList';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const Tab = createBottomTabNavigator();

function DevTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name='DevView' component={DevView} />
      <Tab.Screen name='DataList' component={DataList} />
    </Tab.Navigator>
  );
}

function MainTabs() {
  return (
    <Text>hello world!</Text>
  );
}

function App(): React.JSX.Element {
  const isDevMode = true;
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <DatabaseProvider>
          {isDevMode ? <DevTabs /> : <MainTabs />}
        </DatabaseProvider>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

export default App;
