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
      // Don't call onSettingsChange - it causes unnecessary re-renders
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
              trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: '#4CAF50' }}
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
              <View style={styles.settingValueRow}>
                <Text
                  style={[
                    styles.settingValue,
                    autoMode && styles.settingValueExpanded,
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
                    color={COLORS.text.disabled}
                  />
                </View>
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
  },
  settingValueExpanded: {
    paddingRight: 0,
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

