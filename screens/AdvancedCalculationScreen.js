import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, ICON_SIZES } from '../constants/theme';
import * as Haptics from 'expo-haptics';
import { getSettings, updateSetting, saveSettings } from '../utils/settingsStorage';

const HIGH_LATITUDE_RULES = [
  { key: 'MiddleOfTheNight', label: 'Middle of the Night' },
  { key: 'SeventhOfTheNight', label: 'Seventh of the Night' },
  { key: 'TwilightAngle', label: 'Twilight Angle' },
];

const PRAYER_NAMES = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export default function AdvancedCalculationScreen({ navigation, onSettingsChange }) {
  const insets = useSafeAreaInsets();

  // Custom angles
  const [fajrAngle, setFajrAngle] = useState('');
  const [ishaAngle, setIshaAngle] = useState('');

  // High latitude rule
  const [highLatitudeRule, setHighLatitudeRule] = useState('MiddleOfTheNight');

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

    // Load custom angles
    if (settings.customAngles?.fajrAngle !== null && settings.customAngles?.fajrAngle !== undefined) {
      setFajrAngle(settings.customAngles.fajrAngle.toString());
    }
    if (settings.customAngles?.ishaAngle !== null && settings.customAngles?.ishaAngle !== undefined) {
      setIshaAngle(settings.customAngles.ishaAngle.toString());
    }

    // Load high latitude rule
    setHighLatitudeRule(settings.highLatitudeRule || 'MiddleOfTheNight');

    // Load prayer adjustments
    if (settings.prayerAdjustments) {
      const newAdj = {};
      PRAYER_NAMES.forEach(name => {
        newAdj[name] = (settings.prayerAdjustments[name] || 0).toString();
      });
      setAdjustments(newAdj);
    }
  };

  const handleSaveCustomAngles = async () => {
    try {
      const settings = await getSettings();

      settings.customAngles = {
        fajrAngle: fajrAngle ? parseFloat(fajrAngle) : null,
        ishaAngle: ishaAngle ? parseFloat(ishaAngle) : null,
      };

      await saveSettings(settings);

      if (onSettingsChange) {
        await onSettingsChange();
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error saving custom angles:', error);
    }
  };

  const handleHighLatitudeRuleChange = async (rule) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setHighLatitudeRule(rule);
      await updateSetting('highLatitudeRule', rule);

      if (onSettingsChange) {
        await onSettingsChange();
      }
    } catch (error) {
      console.error('Error updating high latitude rule:', error);
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

  const handleResetAll = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Reset UI state
      setFajrAngle('');
      setIshaAngle('');
      setHighLatitudeRule('MiddleOfTheNight');

      const resetAdj = {};
      PRAYER_NAMES.forEach(name => {
        resetAdj[name] = '0';
      });
      setAdjustments(resetAdj);

      // Reset in storage
      const settings = await getSettings();
      settings.customAngles = {
        fajrAngle: null,
        ishaAngle: null,
      };
      settings.highLatitudeRule = 'MiddleOfTheNight';
      settings.prayerAdjustments = {
        Fajr: 0,
        Sunrise: 0,
        Dhuhr: 0,
        Asr: 0,
        Maghrib: 0,
        Isha: 0,
      };
      await saveSettings(settings);

      if (onSettingsChange) {
        await onSettingsChange();
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error resetting:', error);
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
        <Text style={styles.headerTitle}>Advanced</Text>
        <Pressable
          style={styles.resetButton}
          onPress={handleResetAll}
        >
          <Text style={styles.resetButtonText}>Reset</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Custom Angles Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CUSTOM ANGLES</Text>
          <Text style={styles.sectionDescription}>
            Override the default angles for your selected calculation method. Leave empty to use method defaults.
          </Text>

          <View style={styles.settingsContainer}>
            {/* Fajr Angle */}
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Fajr Angle (degrees)</Text>
              <TextInput
                style={styles.input}
                value={fajrAngle}
                onChangeText={setFajrAngle}
                placeholder="e.g., 18"
                placeholderTextColor={COLORS.text.disabled}
                keyboardType="numeric"
                returnKeyType="done"
              />
            </View>

            <View style={styles.separator} />

            {/* Isha Angle */}
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Isha Angle (degrees)</Text>
              <TextInput
                style={styles.input}
                value={ishaAngle}
                onChangeText={setIshaAngle}
                placeholder="e.g., 17"
                placeholderTextColor={COLORS.text.disabled}
                keyboardType="numeric"
                returnKeyType="done"
              />
            </View>

          </View>

          <Pressable style={styles.saveButton} onPress={handleSaveCustomAngles}>
            <Text style={styles.saveButtonText}>Apply Custom Angles</Text>
          </Pressable>
        </View>

        {/* High Latitude Rule Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HIGH LATITUDE RULE</Text>
          <Text style={styles.sectionDescription}>
            For locations above 48° latitude where twilight persists. Only applies when needed.
          </Text>

          <View style={styles.settingsContainer}>
            {HIGH_LATITUDE_RULES.map((rule, index) => (
              <React.Fragment key={rule.key}>
                {index > 0 && <View style={styles.separator} />}
                <Pressable
                  style={styles.optionButton}
                  onPress={() => handleHighLatitudeRuleChange(rule.key)}
                >
                  <Text style={styles.optionText}>
                    {rule.label}
                  </Text>
                  {highLatitudeRule === rule.key && (
                    <MaterialCommunityIcons
                      name="check"
                      size={ICON_SIZES.md}
                      color={COLORS.text.primary}
                    />
                  )}
                </Pressable>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Prayer Time Adjustments Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRAYER TIME ADJUSTMENTS</Text>
          <Text style={styles.sectionDescription}>
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
  resetButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  resetButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.medium.primary,
    color: '#FF6B6B',
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
    marginBottom: SPACING.xs,
  },
  sectionDescription: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.weights.regular.primary,
    color: COLORS.text.secondary,
    marginBottom: SPACING.md,
    lineHeight: 18,
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
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.regular.primary,
    color: COLORS.text.primary,
    width: 80,
    textAlign: 'right',
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
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    minHeight: 48,
    paddingVertical: SPACING.sm,
  },
  optionText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.regular.primary,
    color: COLORS.text.primary,
    flex: 1,
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
