import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, ICON_SIZES } from '../constants/theme';
import * as Haptics from 'expo-haptics';
import { getSettings, updateSetting } from '../utils/settingsStorage';

// Available calculation methods
const CALCULATION_METHODS = [
  { key: 'MuslimWorldLeague', label: 'Muslim World League' },
  { key: 'IslamicSocietyOfNorthAmerica', label: 'Islamic Society of North America (ISNA)' },
  { key: 'Egyptian', label: 'Egyptian General Authority of Survey' },
  { key: 'UmmAlQura', label: 'Umm al-Qura University, Makkah' },
  { key: 'UniversityOfIslamicSciencesKarachi', label: 'University of Islamic Sciences, Karachi' },
  { key: 'InstituteOfGeophysicsUniversityOfTehran', label: 'Institute of Geophysics, University of Tehran' },
  { key: 'Shia', label: 'Shia Ithna Ashari (Ja\'fari)' },
  { key: 'Gulf', label: 'Gulf Region' },
  { key: 'Kuwait', label: 'Kuwait' },
  { key: 'Qatar', label: 'Qatar' },
  { key: 'Singapore', label: 'Singapore' },
  { key: 'Other', label: 'Other' },
];

export default function CalculationMethodSelectScreen({ navigation, onSettingsChange }) {
  const insets = useSafeAreaInsets();
  const [calculationMethod, setCalculationMethod] = useState('MuslimWorldLeague');

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settings = await getSettings();
    setCalculationMethod(settings.calculationMethod || 'MuslimWorldLeague');
  };

  const handleCalculationMethodChange = async (method) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCalculationMethod(method);
      await updateSetting('calculationMethod', method);
      if (typeof onSettingsChange === 'function') {
        await onSettingsChange();
      }
      // Use setTimeout to ensure state updates complete before going back
      setTimeout(() => {
        navigation?.goBack();
      }, 0);
    } catch (error) {
      console.error('Error updating calculation method:', error);
      setTimeout(() => {
        navigation?.goBack();
      }, 0);
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
        <Text style={styles.headerTitle}>Select Method</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.description}>
          Choose the method used to calculate prayer times based on your location and school of thought.
        </Text>
        
        {CALCULATION_METHODS.map((method) => (
          <Pressable
            key={method.key}
            style={[
              styles.optionButton,
              calculationMethod === method.key && styles.optionButtonActive,
            ]}
            onPress={() => handleCalculationMethodChange(method.key)}
          >
            <Text
              style={[
                styles.optionText,
                calculationMethod === method.key && styles.optionTextActive,
              ]}
            >
              {method.label}
            </Text>
          </Pressable>
        ))}
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
  optionButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  optionButtonActive: {
    borderColor: COLORS.text.primary,
    backgroundColor: COLORS.background.tertiary,
  },
  optionText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.regular.primary,
    color: COLORS.text.secondary,
  },
  optionTextActive: {
    color: COLORS.text.primary,
    fontFamily: FONTS.weights.medium.primary,
  },
});

