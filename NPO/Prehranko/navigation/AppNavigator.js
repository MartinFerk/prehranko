// navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import CameraScreen from '../screens/CameraScreen.js';
import SettingsScreen from '../screens/SettingsScreen';
import CaptureFoodScreen from '../screens/CaptureFoodScreen.js';
import FaceVerificationScreen from '../screens/FaceVerificationScreen.js';
import GoalScreen from '../screens/GoalScreen.js'; // Preveri, ali je pot pravilna
import DeleteFoodScreen from '../screens/DeleteFoodScreen.js';


const Stack = createStackNavigator();

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="CaptureFoodScreen" component={CaptureFoodScreen} options={{ headerShown: false }}/>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CameraScreen" component={CameraScreen} options={{ headerShown: false }} />
      <Stack.Screen name="FaceVerification" component={FaceVerificationScreen} />
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="GoalScreen" component={GoalScreen} options={{ headerShown: false }} />
      <Stack.Screen name="DeleteFoodScreen" component={DeleteFoodScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;