import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, LayoutAnimation, Platform, UIManager, InteractionManager } from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, ICON_SIZES } from '../constants/theme';
import * as Haptics from 'expo-haptics';
import { updateSetting, getMethodForCountry } from '../utils/settingsStorage';
import * as Location from 'expo-location';
import { useSettings } from '../contexts/SettingsContext';

// Method label mapping
const METHOD_LABELS = {
  'MuslimWorldLeague': 'Muslim World League',
  'IslamicSocietyOfNorthAmerica': 'Islamic Society of North America (ISNA)',
  'Egyptian': 'Egyptian General Authority of Survey',
  'UmmAlQura': 'Umm al-Qura University, Makkah',
  'UniversityOfIslamicSciencesKarachi': 'University of Islamic Sciences, Karachi',
  'InstituteOfGeophysicsUniversityOfTehran': 'Institute of Geophysics, University of Tehran',
  'MoonsightingCommittee': 'Moonsighting Committee Worldwide',
  'Turkey': 'Turkey (Diyanet)',
  'Dubai': 'Dubai / Gulf Region',
  'Kuwait': 'Kuwait',
  'Qatar': 'Qatar',
  'Singapore': 'Singapore',
  'Other': 'Other',
};

const ASR_LABELS = {
  'Standard': 'Standard',
  'Hanafi': 'Hanafi',
};

const HIGH_LATITUDE_RULE_LABELS = {
  'MiddleOfTheNight': 'Middle of the Night',
  'SeventhOfTheNight': 'Seventh of the Night',
  'TwilightAngle': 'Twilight Angle',
};

// Default angles for each calculation method (Fajr, Isha)
const METHOD_DEFAULT_ANGLES = {
  'MuslimWorldLeague': { fajr: 18, isha: 17 },
  'IslamicSocietyOfNorthAmerica': { fajr: 15, isha: 15 },
  'Egyptian': { fajr: 19.5, isha: 17.5 },
  'UmmAlQura': { fajr: 18.5, isha: 0 },
  'UniversityOfIslamicSciencesKarachi': { fajr: 18, isha: 18 },
  'InstituteOfGeophysicsUniversityOfTehran': { fajr: 17.7, isha: 14 },
  'MoonsightingCommittee': { fajr: 18, isha: 18 },
  'Turkey': { fajr: 18, isha: 17 },
  'Dubai': { fajr: 18.2, isha: 18.2 },
  'Kuwait': { fajr: 18, isha: 17.5 },
  'Qatar': { fajr: 18, isha: 0 },
  'Singapore': { fajr: 20, isha: 18 },
  'Other': { fajr: 0, isha: 0 },
};

export default function CalculationMethodScreen({ navigation, onSettingsChange }) {
  const insets = useSafeAreaInsets();
  const { settings, updateSettingInContext } = useSettings();

  // Extract values from context - NO FLICKERING!
  const calculationMethod = settings.calculationMethod || 'MuslimWorldLeague';
  const asrMethod = settings.asrMethod || 'Standard';
  const highLatitudeRule = settings.highLatitudeRule || 'MiddleOfTheNight';
  const autoMode = settings.calculationMethodAuto || false;

  const handleAutoToggle = async (value) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Update context immediately
      await updateSettingInContext('calculationMethodAuto', value);

      // If enabling auto mode, auto-detect ALL settings from location
      if (value) {
        try {
          const locationData = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          const latitude = locationData.coords.latitude;
          const longitude = locationData.coords.longitude;

          const reverseGeocode = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
          });

          if (reverseGeocode && reverseGeocode.length > 0) {
            const country = reverseGeocode[0].country;

            if (country) {
              // Auto-detect calculation method
              const recommendedMethod = getMethodForCountry(country);
              await updateSettingInContext('calculationMethod', recommendedMethod);

              // Auto-detect high latitude rule based on latitude
              const recommendedHighLatRule = latitude > 48 ? 'SeventhOfTheNight' : 'MiddleOfTheNight';
              await updateSettingInContext('highLatitudeRule', recommendedHighLatRule);

              // Reset custom angles to defaults (let calculation method handle it)
              await updateSettingInContext('customAngles', {
                fajrAngle: null,
                ishaAngle: null,
              });

              // Reset prayer adjustments to defaults
              await updateSettingInContext('prayerAdjustments', {
                fajr: 0,
                sunrise: 0,
                dhuhr: 0,
                asr: 0,
                maghrib: 0,
                isha: 0,
              });
            }
          }
        } catch (error) {
          console.error('Error auto-detecting settings:', error);
        }
      }

      // Trigger prayer time recalculation
      if (onSettingsChange) {
        await onSettingsChange();
      }
    } catch (error) {
      console.error('Error updating auto mode:', error);
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
        <Text style={styles.headerTitle}>Calculation</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ASR METHOD Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ASR METHOD</Text>
          <View style={styles.settingsContainer}>
            {/* Asr Method Button */}
            <Pressable
              style={styles.settingButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation?.navigate('AsrMethod');
              }}
            >
              <View style={styles.settingButtonContent}>
                <Text style={styles.settingLabel}>School of Thought</Text>
                <View style={styles.settingValueRow}>
                  <Text style={styles.settingValue} numberOfLines={1}>
                    {ASR_LABELS[asrMethod] || asrMethod}
                  </Text>
                  <View style={styles.chevronContainer}>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={ICON_SIZES.md}
                      color={COLORS.text.secondary}
                    />
                  </View>
                </View>
              </View>
            </Pressable>
          </View>
        </View>

        {/* METHOD Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>METHOD</Text>
          <View style={styles.settingsContainer}>
            {/* Automatic Calculation Toggle */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Automatic Calculation</Text>
              <Switch
                value={autoMode}
                onValueChange={handleAutoToggle}
                trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: '#4CAF50' }}
                thumbColor={autoMode ? COLORS.text.primary : 'rgba(255, 255, 255, 0.5)'}
              />
            </View>

            <View style={styles.separator} />

            {/* Calculation Method Button */}
            <Pressable
              style={styles.settingButton}
              onPress={() => {
                if (!autoMode) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation?.navigate('CalculationMethodSelect');
                }
              }}
              disabled={autoMode}
            >
              <View style={styles.settingButtonContent}>
                <Text style={styles.settingLabel}>Calculation Method</Text>
                <View style={styles.settingValueRow}>
                  <Text
                    style={[
                      styles.settingValue,
                      autoMode && styles.settingValueDisabled
                    ]}
                    numberOfLines={1}
                  >
                    {METHOD_LABELS[calculationMethod] || calculationMethod}
                  </Text>
                  <View style={[styles.chevronContainer, { opacity: autoMode ? 0 : 1 }]}>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={ICON_SIZES.md}
                      color={COLORS.text.secondary}
                    />
                  </View>
                </View>
              </View>
            </Pressable>
          </View>
        </View>

        {/* ADVANCED Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ADVANCED</Text>
          <View style={styles.settingsContainer}>
            {/* High Latitude Rule Button */}
            <Pressable
              style={styles.settingButton}
              onPress={() => {
                if (!autoMode) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation?.navigate('HighLatitudeRule');
                }
              }}
              disabled={autoMode}
            >
              <View style={styles.settingButtonContent}>
                <Text style={[styles.settingLabel, autoMode && styles.settingLabelDisabled]}>
                  High Latitude Rule
                </Text>
                <View style={styles.settingValueRow}>
                  <Text style={[styles.settingValue, autoMode && styles.settingValueDisabled]} numberOfLines={1}>
                    {HIGH_LATITUDE_RULE_LABELS[highLatitudeRule] || highLatitudeRule}
                  </Text>
                  <View style={[styles.chevronContainer, { opacity: autoMode ? 0 : 1 }]}>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={ICON_SIZES.md}
                      color={COLORS.text.secondary}
                    />
                  </View>
                </View>
              </View>
            </Pressable>

            <View style={styles.separator} />

            {/* Custom Angles Button */}
            <Pressable
              style={styles.settingButton}
              onPress={() => {
                if (!autoMode) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation?.navigate('CustomAngles');
                }
              }}
              disabled={autoMode}
            >
              <View style={styles.settingButtonContent}>
                <Text style={[styles.settingLabel, autoMode && styles.settingLabelDisabled]}>
                  Custom Angles
                </Text>
                <View style={styles.settingValueRow}>
                  <Text
                    style={[
                      styles.settingValue,
                      autoMode && styles.settingValueDisabled
                    ]}
                    numberOfLines={1}
                  >
                    {(() => {
                      const customFajr = settings.customAngles?.fajrAngle;
                      const customIsha = settings.customAngles?.ishaAngle;
                      const defaults = METHOD_DEFAULT_ANGLES[calculationMethod] || { fajr: 0, isha: 0 };

                      const displayFajr = customFajr !== null && customFajr !== undefined
                        ? customFajr.toFixed(1)
                        : defaults.fajr.toFixed(1);
                      const displayIsha = customIsha !== null && customIsha !== undefined
                        ? customIsha.toFixed(1)
                        : defaults.isha.toFixed(1);

                      return `(${displayFajr}, ${displayIsha})`;
                    })()}
                  </Text>
                  <View style={[styles.chevronContainer, { opacity: autoMode ? 0 : 1 }]}>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={ICON_SIZES.md}
                      color={COLORS.text.secondary}
                    />
                  </View>
                </View>
              </View>
            </Pressable>

            <View style={styles.separator} />

            {/* Prayer Time Adjustments Button */}
            <Pressable
              style={styles.settingButton}
              onPress={() => {
                if (!autoMode) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation?.navigate('PrayerAdjustments');
                }
              }}
              disabled={autoMode}
            >
              <View style={styles.settingButtonContent}>
                <Text style={[styles.settingLabel, autoMode && styles.settingLabelDisabled]}>
                  Prayer Time Adjustments
                </Text>
                <View style={[styles.chevronContainer, { opacity: autoMode ? 0 : 1 }]}>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={ICON_SIZES.md}
                    color={COLORS.text.secondary}
                  />
                </View>
              </View>
            </Pressable>
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
  settingButton: {
    paddingHorizontal: SPACING.md,
    height: 48,
    justifyContent: 'center',
  },
  settingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  settingLabel: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.regular.primary,
    color: COLORS.text.primary,
    flexShrink: 0,
  },
  settingLabelDisabled: {
    color: COLORS.text.disabled,
  },
  settingValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  settingValue: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.regular.primary,
    color: COLORS.text.secondary,
    textAlign: 'right',
    paddingRight: ICON_SIZES.md + SPACING.xs,
    flexShrink: 1,
  },
  settingValueDisabled: {
    color: COLORS.text.disabled,
  },
  chevronContainer: {
    position: 'absolute',
    right: 0,
    width: ICON_SIZES.md,
    height: ICON_SIZES.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginLeft: SPACING.md,
  },
});

