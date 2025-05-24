// components/AuthInput.js
import React from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

const AuthInput = ({ placeholder, value, onChangeText, secureTextEntry, keyboardType }) => (
  <TextInput
    placeholder={placeholder}
    value={value}
    onChangeText={onChangeText}
    secureTextEntry={secureTextEntry}
    keyboardType={keyboardType}
    autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
    style={styles.input}
  />
);

const styles = StyleSheet.create({
  input: {
    borderBottomWidth: 1,
    marginBottom: theme.spacing.medium,
    paddingVertical: theme.spacing.small,
    paddingHorizontal: theme.spacing.tiny,
  },
});

export default AuthInput;