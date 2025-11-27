import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';

const PrayerDetailsBottomSheet = ({ bottomSheetRef, selectedPrayer }) => {
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
