import React, { useMemo, useEffect } from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';

const PrayerStatusBottomSheet = ({ bottomSheetRef, prayerName, prayerTime, direction, isRemoving, onConfirm, onCancel }) => {
  const snapPoints = useMemo(() => ['30%'], []);

  // Determine question and confirm button color based on direction and if removing
  const question = isRemoving
    ? (direction === 'right' ? 'REMOVE ON TIME?' : 'REMOVE LATE?')
    : (direction === 'right' ? 'MARK ON TIME?' : 'MARK LATE?');
  const confirmColor = direction === 'right' ? '#81C784' : '#FF9A76';

  const renderBackdrop = (props) => (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      opacity={0.5}
      pressBehavior="close"
    />
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      backdropComponent={renderBackdrop}
      enableDynamicSizing={false}
      onClose={onCancel}
    >
      <BottomSheetView style={styles.contentContainer}>
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{question}</Text>
          {prayerName && (
            <Text style={styles.prayerNameText}>{prayerName.toUpperCase()}</Text>
          )}
        </View>

        <View style={styles.buttonsContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.cancelButton,
              pressed && { opacity: 0.7 }
            ]}
            onPress={onCancel}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: confirmColor },
              pressed && { opacity: 0.7 }
            ]}
            onPress={onConfirm}
          >
            <Text style={styles.confirmText}>Confirm</Text>
          </Pressable>
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
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  questionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionText: {
    fontSize: 24,
    fontFamily: FONTS.weights.bold.primary,
    color: COLORS.text.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  prayerNameText: {
    fontSize: 14,
    fontFamily: FONTS.weights.regular.primary,
    color: COLORS.text.secondary,
    marginTop: SPACING.sm,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.md + 4,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  cancelButton: {
    backgroundColor: COLORS.background.tertiary,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  cancelText: {
    fontSize: 16,
    fontFamily: FONTS.weights.medium.primary,
    color: COLORS.text.primary,
  },
  confirmText: {
    fontSize: 16,
    fontFamily: FONTS.weights.medium.primary,
    color: COLORS.text.primary,
  },
});

export default PrayerStatusBottomSheet;
