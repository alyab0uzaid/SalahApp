import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, ICON_SIZES } from '../constants/theme';
import * as Haptics from 'expo-haptics';
import { getSettings, saveSettings } from '../utils/settingsStorage';

const PRAYER_NAMES = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export default function PrayerAdjustmentsScreen({ navigation, onSettingsChange }) {
  const insets = useSafeAreaInsets();

  // Prayer adjustments
  const [adjustments, setAdjustments] = useState({
    Fajr: '0',
    Sunrise: '0',
    Dhuhr: '0',
    Asr: '0',
    Maghrib: '0',
    Isha: '0',
  });

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settings = await getSettings();

    // Load prayer adjustments
    if (settings.prayerAdjustments) {
      const newAdj = {};
      PRAYER_NAMES.forEach(name => {
        newAdj[name] = (settings.prayerAdjustments[name] || 0).toString();
      });
      setAdjustments(newAdj);
    }
  };

  const handleAdjustmentChange = async (prayerName, value) => {
    setAdjustments(prev => ({ ...prev, [prayerName]: value }));
  };

  const handleSaveAdjustments = async () => {
    try {
      const settings = await getSettings();

      const numericAdjustments = {};
      PRAYER_NAMES.forEach(name => {
        const val = adjustments[name];
        numericAdjustments[name] = val ? parseInt(val) : 0;
      });

      settings.prayerAdjustments = numericAdjustments;
      await saveSettings(settings);

      if (onSettingsChange) {
        await onSettingsChange();
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error saving adjustments:', error);
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
        <Text style={styles.headerTitle}>Prayer Time Adjustments</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.description}>
          Manually adjust prayer times in minutes. Use positive numbers to add time or negative to subtract.
        </Text>

        <View style={styles.settingsContainer}>
          {PRAYER_NAMES.map((name, index) => (
            <React.Fragment key={name}>
              {index > 0 && <View style={styles.separator} />}
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>{name}</Text>
                <View style={styles.adjustmentInputContainer}>
                  <TextInput
                    style={styles.adjustmentInput}
                    value={adjustments[name]}
                    onChangeText={(value) => handleAdjustmentChange(name, value)}
                    placeholder="0"
                    placeholderTextColor={COLORS.text.disabled}
                    keyboardType="numeric"
                    returnKeyType="done"
                  />
                  <Text style={styles.minutesLabel}>min</Text>
                </View>
              </View>
            </React.Fragment>
          ))}
        </View>

        <Pressable style={styles.saveButton} onPress={handleSaveAdjustments}>
          <Text style={styles.saveButtonText}>Apply Adjustments</Text>
        </Pressable>
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
  description: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.regular.primary,
    color: COLORS.text.secondary,
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  settingsContainer: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    minHeight: 48,
  },
  inputLabel: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.regular.primary,
    color: COLORS.text.primary,
    flex: 1,
  },
  adjustmentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  adjustmentInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.regular.primary,
    color: COLORS.text.primary,
    width: 60,
    textAlign: 'right',
  },
  minutesLabel: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.weights.regular.primary,
    color: COLORS.text.secondary,
    width: 30,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginLeft: SPACING.md,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  saveButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.medium.primary,
    color: COLORS.text.primary,
  },
});

