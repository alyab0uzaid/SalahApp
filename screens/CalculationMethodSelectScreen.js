import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, ICON_SIZES } from '../constants/theme';
import * as Haptics from 'expo-haptics';
import { useSettings } from '../contexts/SettingsContext';

// Available calculation methods
const CALCULATION_METHODS = [
  { key: 'MuslimWorldLeague', label: 'Muslim World League' },
  { key: 'IslamicSocietyOfNorthAmerica', label: 'Islamic Society of North America (ISNA)' },
  { key: 'Egyptian', label: 'Egyptian General Authority of Survey' },
  { key: 'UmmAlQura', label: 'Umm al-Qura University, Makkah' },
  { key: 'UniversityOfIslamicSciencesKarachi', label: 'University of Islamic Sciences, Karachi' },
  { key: 'InstituteOfGeophysicsUniversityOfTehran', label: 'Institute of Geophysics, University of Tehran' },
  { key: 'MoonsightingCommittee', label: 'Moonsighting Committee Worldwide' },
  { key: 'Turkey', label: 'Turkey (Diyanet)' },
  { key: 'Dubai', label: 'Dubai / Gulf Region' },
  { key: 'Kuwait', label: 'Kuwait' },
  { key: 'Qatar', label: 'Qatar' },
  { key: 'Singapore', label: 'Singapore' },
  { key: 'Other', label: 'Other' },
];

export default function CalculationMethodSelectScreen({ navigation, onSettingsChange }) {
  const insets = useSafeAreaInsets();
  const { settings, updateSettingInContext } = useSettings();
  const calculationMethod = settings.calculationMethod || 'MuslimWorldLeague';

  const handleCalculationMethodChange = async (method) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Update context - instantly updates everywhere!
      await updateSettingInContext('calculationMethod', method);

      // Trigger prayer time recalculation
      if (onSettingsChange) {
        onSettingsChange();
      }
    } catch (error) {
      console.error('Error updating calculation method:', error);
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

        <View style={styles.settingsContainer}>
          {CALCULATION_METHODS.map((method, index) => (
            <React.Fragment key={method.key}>
              {index > 0 && <View style={styles.separator} />}
              <Pressable
                style={styles.optionButton}
                onPress={() => handleCalculationMethodChange(method.key)}
              >
                <Text style={styles.optionText}>
                  {method.label}
                </Text>
                {calculationMethod === method.key && (
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
    paddingRight: SPACING.md,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginLeft: SPACING.md,
  },
});

