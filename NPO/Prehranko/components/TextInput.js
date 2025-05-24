import React from 'react';
import { Button } from 'react-native';
import { theme } from '../styles/theme';

const AuthButton = ({ title, onPress, color = theme.colors.primary }) => (
  <Button title={title} onPress={onPress} color={color} />
);

export default AuthButton;