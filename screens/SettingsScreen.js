import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, ICON_SIZES } from '../constants/theme';
import * as Haptics from 'expo-haptics';
import { getSettings } from '../utils/settingsStorage';
import CalculationMethodScreen from './CalculationMethodScreen';
import AsrMethodScreen from './AsrMethodScreen';

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
  'Standard': 'Standard (Shafi\'i, Maliki, Hanbali)',
  'Hanafi': 'Hanafi',
};

export default function SettingsScreen({ navigation, onSettingsChange }) {
  const insets = useSafeAreaInsets();
  const [calculationMethod, setCalculationMethod] = useState('MuslimWorldLeague');
  const [asrMethod, setAsrMethod] = useState('Standard');

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
    setAsrMethod(settings.asrMethod || 'Standard');
  };

  // Main settings screen
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Settings Header */}
        <Text style={styles.title}>Settings</Text>

        {/* Prayers Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prayers</Text>
          <View style={styles.settingsContainer}>
            <Pressable
              style={styles.settingButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation?.navigate('CalculationMethod');
              }}
            >
              <View style={styles.settingButtonContent}>
                <Text style={styles.settingLabel}>Calculation Method</Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={ICON_SIZES.md}
                  color={COLORS.text.secondary}
                />
              </View>
            </Pressable>
            
            <View style={styles.separator} />
            
            <Pressable
              style={styles.settingButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation?.navigate('AsrMethod');
              }}
            >
              <View style={styles.settingButtonContent}>
                <Text style={styles.settingLabel}>Asr Calculation</Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={ICON_SIZES.md}
                  color={COLORS.text.secondary}
                />
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontFamily: FONTS.weights.medium.primary,
    color: COLORS.text.primary,
    marginBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.weights.medium.primary,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  settingsContainer: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  settingButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  settingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabel: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.regular.primary,
    color: COLORS.text.primary,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: SPACING.md,
  },
});
