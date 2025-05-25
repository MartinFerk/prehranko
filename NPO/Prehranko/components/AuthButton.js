// components/AuthButton.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../styles/theme';

const { height } = Dimensions.get('window');

const AuthButton = ({ title, onPress, color = theme.colors.primary }) => {
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: color }]}
      onPress={onPress}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: height * 0.08, // 8% višine zaslona
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: theme.spacing.lower,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
});

export default AuthButton;