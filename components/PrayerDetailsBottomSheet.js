import React, { useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';

const PrayerDetailsBottomSheet = ({ bottomSheetRef, selectedPrayer, notificationEnabled, onNotificationToggle }) => {
  // Backdrop component - renders a semi-transparent overlay
  const renderBackdrop = (props) => (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      opacity={0.5}
      pressBehavior="close"
    />
  );

  if (!selectedPrayer) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1} // Start closed
      enablePanDownToClose={true}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      backdropComponent={renderBackdrop}
      enableDynamicSizing={true}
    >
      <BottomSheetView style={styles.contentContainer}>
        <Text style={styles.prayerTitle}>{selectedPrayer.name.toUpperCase()} NOTIFICATIONS</Text>

        {/* Notification Toggle Section */}
        <View style={styles.optionSection}>

          <TouchableOpacity
            style={[
              styles.optionButton,
              notificationEnabled && styles.optionButtonActive
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onNotificationToggle && onNotificationToggle(true);
            }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="bell"
              size={24}
              color={notificationEnabled ? COLORS.text.primary : COLORS.text.secondary}
            />
            <Text style={[
              styles.optionText,
              notificationEnabled && styles.optionTextActive
            ]}>
              Notify me
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              !notificationEnabled && styles.optionButtonActive
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onNotificationToggle && onNotificationToggle(false);
            }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="bell-off-outline"
              size={24}
              color={!notificationEnabled ? COLORS.text.primary : COLORS.text.secondary}
            />
            <Text style={[
              styles.optionText,
              !notificationEnabled && styles.optionTextActive
            ]}>
              Silent
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: COLORS.background.secondary,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
  },
  handleIndicator: {
    backgroundColor: COLORS.text.faded,
    width: 30,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    paddingTop: SPACING.md,
  },
  prayerTitle: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.medium.primary,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xxs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  optionSection: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background.tertiary,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonActive: {
    borderColor: COLORS.text.primary,
    backgroundColor: COLORS.background.primary,
  },
  optionText: {
    fontSize: 17,
    fontFamily: FONTS.weights.regular.primary,
    color: COLORS.text.secondary,
    marginLeft: SPACING.md,
  },
  optionTextActive: {
    color: COLORS.text.primary,
    fontFamily: FONTS.weights.medium.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.weights.medium.primary,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
});

export default PrayerDetailsBottomSheet;
