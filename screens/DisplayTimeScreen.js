import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, ICON_SIZES } from '../constants/theme';
import * as Haptics from 'expo-haptics';
import { useSettings } from '../contexts/SettingsContext';

export default function DisplayTimeScreen({ navigation, onSettingsChange }) {
  const insets = useSafeAreaInsets();
  const { settings, updateSettingInContext } = useSettings();

  const use24Hour = settings.timeFormat === '24';

  const handleTimeFormatToggle = async (value) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Update context - instantly updates everywhere!
      await updateSettingInContext('timeFormat', value ? '24' : '12');

      // Notify parent to update the app
      if (onSettingsChange) {
        await onSettingsChange();
      }
    } catch (error) {
      console.error('Error updating time format:', error);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation?.goBack();
          }}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={ICON_SIZES.lg}
            color={COLORS.text.primary}
          />
        </Pressable>
        <Text style={styles.headerTitle}>Display & Time</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Time Format Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TIME FORMAT</Text>
          <View style={styles.settingsContainer}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>24-Hour Time</Text>
              <Switch
                value={use24Hour}
                onValueChange={handleTimeFormatToggle}
                trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: '#4CAF50' }}
                thumbColor={use24Hour ? COLORS.text.primary : 'rgba(255, 255, 255, 0.5)'}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: {
    width: ICON_SIZES.lg + SPACING.sm,
    height: ICON_SIZES.lg + SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.weights.medium.primary,
    color: COLORS.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.weights.medium.primary,
    color: 'rgba(255, 255, 255, 0.69)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
  },
  settingsContainer: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    height: 48,
  },
  settingLabel: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.regular.primary,
    color: COLORS.text.primary,
    flexShrink: 0,
  },
});

