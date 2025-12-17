import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, ICON_SIZES } from '../constants/theme';
import * as Haptics from 'expo-haptics';
import { getSettings, updateSetting, getMethodForCountry } from '../utils/settingsStorage';
import * as Location from 'expo-location';

// Method label mapping
const METHOD_LABELS = {
  'MuslimWorldLeague': 'Muslim World League',
  'IslamicSocietyOfNorthAmerica': 'Islamic Society of North America (ISNA)',
  'Egyptian': 'Egyptian General Authority of Survey',
  'UmmAlQura': 'Umm al-Qura University, Makkah',
  'UniversityOfIslamicSciencesKarachi': 'University of Islamic Sciences, Karachi',
  'InstituteOfGeophysicsUniversityOfTehran': 'Institute of Geophysics, University of Tehran',
  'Shia': 'Shia Ithna Ashari (Ja\'fari)',
  'Gulf': 'Gulf Region',
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

export default function CalculationMethodScreen({ navigation, onSettingsChange }) {
  const insets = useSafeAreaInsets();
  const [calculationMethod, setCalculationMethod] = useState('MuslimWorldLeague');
  const [asrMethod, setAsrMethod] = useState('Standard');
  const [highLatitudeRule, setHighLatitudeRule] = useState('MiddleOfTheNight');
  const [autoMode, setAutoMode] = useState(false);
  const isUpdatingRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const lastUpdateTimeRef = useRef(0);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    isInitialLoadRef.current = false;
  }, []);

  // Reload settings when screen comes into focus (but skip if we recently updated)
  useEffect(() => {
    const unsubscribe = navigation?.addListener('focus', () => {
      if (!isInitialLoadRef.current) {
        const timeSinceLastUpdate = Date.now() - lastUpdateTimeRef.current;
        // Only reload if more than 1 second has passed since last update
        if (timeSinceLastUpdate > 1000 && !isUpdatingRef.current) {
          loadSettings();
        }
      }
    });
    return unsubscribe;
  }, [navigation]);

  const loadSettings = async () => {
    if (isUpdatingRef.current) return; // Don't load if we're updating

    const settings = await getSettings();
    const newMethod = settings.calculationMethod || 'MuslimWorldLeague';
    const newAsrMethod = settings.asrMethod || 'Standard';
    const newHighLatitudeRule = settings.highLatitudeRule || 'MiddleOfTheNight';
    const newAutoMode = settings.calculationMethodAuto || false;

    // Only update state if values actually changed to prevent flickering
    setCalculationMethod(prevMethod => prevMethod !== newMethod ? newMethod : prevMethod);
    setAsrMethod(prevAsrMethod => prevAsrMethod !== newAsrMethod ? newAsrMethod : prevAsrMethod);
    setHighLatitudeRule(prevRule => prevRule !== newHighLatitudeRule ? newHighLatitudeRule : prevRule);
    setAutoMode(prevAutoMode => prevAutoMode !== newAutoMode ? newAutoMode : prevAutoMode);
  };

  const handleAutoToggle = async (value) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Mark that we're updating to prevent reload during update
      isUpdatingRef.current = true;
      lastUpdateTimeRef.current = Date.now();

      // Update local state immediately for responsive UI
      setAutoMode(value);

      // Wait a frame to ensure state update is committed
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Save to storage
      await updateSetting('calculationMethodAuto', value);

      // If enabling auto mode, detect method from location
      if (value) {
        try {
          // Get current location
          const locationData = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          // Reverse geocode to get country
          const reverseGeocode = await Location.reverseGeocodeAsync({
            latitude: locationData.coords.latitude,
            longitude: locationData.coords.longitude,
          });

          if (reverseGeocode && reverseGeocode.length > 0) {
            const address = reverseGeocode[0];
            const country = address.country;

            if (country) {
              const recommendedMethod = getMethodForCountry(country);

              // Update calculation method immediately in state
              setCalculationMethod(recommendedMethod);

              // Wait for state update
              await new Promise(resolve => requestAnimationFrame(resolve));

              // Save to storage
              await updateSetting('calculationMethod', recommendedMethod);

              console.log(`[Auto-detect] Country: ${country}, Method: ${recommendedMethod}`);
            }
          }
        } catch (error) {
          console.error('Error auto-detecting calculation method:', error);
        }
      }

      // Wait for all storage writes to complete before triggering callback
      await new Promise(resolve => setTimeout(resolve, 50));

      // Update timestamp to extend protection window
      lastUpdateTimeRef.current = Date.now();

      // Trigger parent callback
      if (onSettingsChange) {
        onSettingsChange();
      }

      // Keep updating flag set to prevent any reloads during this time
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 1500);
    } catch (error) {
      console.error('Error updating auto mode:', error);
      // Revert on error
      setAutoMode(!value);
      isUpdatingRef.current = false;
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

            <View style={styles.separator} />

            {/* Asr Method Button */}
            <Pressable
              style={styles.settingButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation?.navigate('AsrMethod');
              }}
            >
              <View style={styles.settingButtonContent}>
                <Text style={styles.settingLabel}>Asr Method</Text>
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
                <View style={[styles.chevronContainer, { opacity: autoMode ? 0 : 1 }]}>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={ICON_SIZES.md}
                    color={COLORS.text.secondary}
                  />
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

