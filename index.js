/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import { database } from './services/db';

AppRegistry.registerComponent(appName, () => App);

AppRegistry.registerHeadlessTask('AccelerometerData', () => async (taskData) => {
  await database.addAcc(taskData);
});
AppRegistry.registerHeadlessTask('LocationData', () => async () => {});
AppRegistry.registerHeadlessTask('LocationPermissionDeniedPermanently', () => async () => {})