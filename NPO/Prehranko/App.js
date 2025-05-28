// App.js
import { Buffer } from 'buffer';
import process from 'process';
import 'react-native-get-random-values';

global.Buffer = Buffer;
global.process = process;

import React from 'react';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return <AppNavigator />;
}
