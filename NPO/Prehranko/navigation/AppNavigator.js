// navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import FaceVerificationScreen from '../screens/FaceVerificationScreen';
import CameraScreen from '../screens/CameraScreen';
import CaptureFoodScreen from '../screens/CaptureFoodScreen';
import SettingsScreen from '../screens/SettingsScreen';
import GoalScreen from '../screens/GoalScreen';
import DeleteFoodScreen from '../screens/DeleteFoodScreen';
import MQTTListener from '../components/MQTTListener';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <MQTTListener />
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Prehranko' }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="FaceVerificationScreen" component={FaceVerificationScreen} options={{ title: '2FA Preverjanje' }} />
        <Stack.Screen name="CameraScreen" component={CameraScreen} options={{ title: 'Kamera' }} />
        <Stack.Screen name="CaptureFoodScreen" component={CaptureFoodScreen} options={{ title: 'Zajemi Obrok' }} />
        <Stack.Screen name="SettingsScreen" component={SettingsScreen} options={{ title: 'Nastavitve' }} />
        <Stack.Screen name="GoalScreen" component={GoalScreen} options={{ title: 'Nastavi Cilj' }} />
        <Stack.Screen name="DeleteFoodScreen" component={DeleteFoodScreen} options={{ title: 'Izbriši Vnos' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}