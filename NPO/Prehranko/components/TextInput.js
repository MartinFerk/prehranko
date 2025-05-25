// components/AuthInput.js
import React from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

const AuthInput = ({ placeholder, value, onChangeText, secureTextEntry, keyboardType }) => {
  return (
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      placeholderTextColor={theme.colors.text}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    height: 50,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 10,
    paddingHorizontal: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.secondary, // Svetlo oranžna obroba
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default AuthInput;