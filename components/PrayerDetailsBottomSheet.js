import React, { useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';

const PrayerDetailsBottomSheet = ({ bottomSheetRef, selectedPrayer, notificationEnabled, onNotificationToggle }) => {
  // Snap points for the bottom sheet - 75% of screen height
  const snapPoints = useMemo(() => ['75%'], []);

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
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      backdropComponent={renderBackdrop}
      enableDynamicSizing={false}
    >
      <BottomSheetView style={styles.contentContainer}>
        <Text style={styles.prayerTitle}>{selectedPrayer.name}</Text>
        <Text style={styles.prayerTime}>{selectedPrayer.time}</Text>

        {/* Notification Toggle Section */}
        <View style={styles.optionSection}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <TouchableOpacity
            style={[
              styles.optionButton,
              notificationEnabled && styles.optionButtonActive
            ]}
            onPress={() => onNotificationToggle && onNotificationToggle(true)}
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
            onPress={() => onNotificationToggle && onNotificationToggle(false)}
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

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Prayer Details</Text>
          <Text style={styles.infoText}>
            More information about {selectedPrayer.name} will appear here.
          </Text>
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
    backgroundColor: COLORS.text.tertiary,
    width: 40,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  prayerTitle: {
    fontSize: 28,
    fontFamily: FONTS.weights.medium.primary,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  prayerTime: {
    fontSize: 20,
    fontFamily: FONTS.weights.regular.primary,
    color: COLORS.text.secondary,
    marginBottom: SPACING.lg,
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
  infoSection: {
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.weights.medium.primary,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: 15,
    fontFamily: FONTS.weights.regular.primary,
    color: COLORS.text.secondary,
    lineHeight: 22,
  },
});

export default PrayerDetailsBottomSheet;
