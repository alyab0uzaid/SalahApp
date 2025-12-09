import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, ICON_SIZES } from '../constants/theme';
import * as Haptics from 'expo-haptics';
import { getSettings, updateSetting } from '../utils/settingsStorage';

const TIME_FORMATS = [
  { value: '12', label: '12-hour (AM/PM)' },
  { value: '24', label: '24-hour' },
];

const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

export default function DisplayTimeScreen({ navigation, onSettingsChange }) {
  const insets = useSafeAreaInsets();
  const [timeFormat, setTimeFormat] = useState('12');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');

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
    setTimeFormat(settings.timeFormat || '12');
    setDateFormat(settings.dateFormat || 'MM/DD/YYYY');
  };

  const handleTimeFormatChange = async (value) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeFormat(value);
      await updateSetting('timeFormat', value);
      if (onSettingsChange) {
        onSettingsChange();
      }
    } catch (error) {
      console.error('Error updating time format:', error);
    }
  };

  const handleDateFormatChange = async (value) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setDateFormat(value);
      await updateSetting('dateFormat', value);
      if (onSettingsChange) {
        onSettingsChange();
      }
    } catch (error) {
      console.error('Error updating date format:', error);
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
          <Text style={styles.sectionTitle}>Time Format</Text>
          <View style={styles.optionsContainer}>
            {TIME_FORMATS.map((format) => (
              <Pressable
                key={format.value}
                style={[
                  styles.optionButton,
                  timeFormat === format.value && styles.optionButtonActive
                ]}
                onPress={() => handleTimeFormatChange(format.value)}
              >
                <Text style={[
                  styles.optionText,
                  timeFormat === format.value && styles.optionTextActive
                ]}>
                  {format.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Date Format Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date Format</Text>
          <View style={styles.optionsContainer}>
            {DATE_FORMATS.map((format) => (
              <Pressable
                key={format.value}
                style={[
                  styles.optionButton,
                  dateFormat === format.value && styles.optionButtonActive
                ]}
                onPress={() => handleDateFormatChange(format.value)}
              >
                <Text style={[
                  styles.optionText,
                  dateFormat === format.value && styles.optionTextActive
                ]}>
                  {format.label}
                </Text>
              </Pressable>
            ))}
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
  optionsContainer: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  optionButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  optionButtonActive: {
    backgroundColor: COLORS.background.tertiary,
    borderColor: COLORS.text.primary,
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

