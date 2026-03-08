import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING } from '../constants/theme';

// App Store: https://apps.apple.com/app/id6756989968
const APP_STORE_URL = 'https://apps.apple.com/app/id6756989968';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.salahapp.ios';

export default function ForceUpdateScreen() {
  const insets = useSafeAreaInsets();

  const openStore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <MaterialCommunityIcons
        name="cellphone-arrow-down"
        size={72}
        color={COLORS.text.secondary}
        style={styles.icon}
      />
      <Text style={styles.title}>Update Required</Text>
      <Text style={styles.message}>
        A new version of Salah is available. Please update to continue using the app.
      </Text>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={openStore}
      >
        <Text style={styles.buttonText}>Update Now</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
    paddingHorizontal: SPACING.xl,
  },
  icon: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontFamily: FONTS.weights.bold.primary,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  message: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.regular.primary,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },
  button: {
    backgroundColor: COLORS.accent.white,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.bold.primary,
    color: COLORS.background.primary,
  },
});
