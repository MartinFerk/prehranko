// components/IconButton.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather'; // Uporabljamo Feather ikone
import { theme } from '../styles/theme';

const IconButton = ({ iconName, title, onPress, color }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Icon name={iconName} size={24} color="#FFF" />
      </View>
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: theme.spacing.medium,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.small,
  },
  title: {
    fontSize: 12,
    color: theme.colors.secondary,
    textAlign: 'center',
  },
});

export default IconButton;