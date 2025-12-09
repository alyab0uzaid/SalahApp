import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, ICON_SIZES } from '../constants/theme';
import * as Haptics from 'expo-haptics';
import { getSettings, updateSetting } from '../utils/settingsStorage';

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

export default function CalculationMethodScreen({ navigation, onSettingsChange }) {
  const insets = useSafeAreaInsets();
  const [calculationMethod, setCalculationMethod] = useState('MuslimWorldLeague');
  const [autoMode, setAutoMode] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Reload settings when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation?.addListener('focus', () => {
      loadSettings();
    });
    return unsubscribe;
  }, [navigation]);

  const loadSettings = async () => {
    const settings = await getSettings();
    setCalculationMethod(settings.calculationMethod || 'MuslimWorldLeague');
    setAutoMode(settings.calculationMethodAuto || false);
  };

  const handleAutoToggle = async (value) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setAutoMode(value);
      await updateSetting('calculationMethodAuto', value);
      if (typeof onSettingsChange === 'function') {
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
        <Text style={styles.headerTitle}>Calculation Method</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.settingsContainer}>
          {/* Set Automatically Toggle */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Set automatically</Text>
            <Switch
              value={autoMode}
              onValueChange={handleAutoToggle}
              trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: 'rgba(255, 255, 255, 0.4)' }}
              thumbColor={autoMode ? COLORS.text.primary : 'rgba(255, 255, 255, 0.5)'}
            />
          </View>

          <View style={styles.separator} />

          {/* Method Selection Button */}
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
              <Text style={styles.settingLabel}>
                Method
              </Text>
              <View style={styles.settingValueContainer}>
                {autoMode ? (
                  <>
                    <View style={{ width: ICON_SIZES.md, height: ICON_SIZES.md }} />
                    <Text style={[styles.settingValue, styles.settingValueRight]}>
                      {METHOD_LABELS[calculationMethod] || calculationMethod}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.settingValue}>
                      {METHOD_LABELS[calculationMethod] || calculationMethod}
                    </Text>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={ICON_SIZES.md}
                      color={COLORS.text.secondary}
                    />
                  </>
                )}
              </View>
            </View>
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
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
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    minHeight: 48, // Fixed height to prevent size changes
  },
  settingButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    minHeight: 48, // Fixed height to match settingRow
  },
  settingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  settingLabel: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.regular.primary,
    color: COLORS.text.primary,
  },
  settingValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    flex: 1,
    minWidth: ICON_SIZES.md + SPACING.sm, // Reserve space for arrow
  },
  settingValue: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.regular.primary,
    color: COLORS.text.secondary,
  },
  settingValueRight: {
    textAlign: 'right',
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: SPACING.md,
  },
});

