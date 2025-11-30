import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.appName}>Salah</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.xxl,
    fontFamily: FONTS.weights.bold.primary,
    textAlign: 'center',
    letterSpacing: 1,
  },
});

export default LoadingScreen;

