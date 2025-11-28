import React, { useMemo, useState, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';

const PrayerStatusBottomSheet = forwardRef(({ onConfirm, onCancel }, ref) => {
  const snapPoints = useMemo(() => ['30%'], []);
  const bottomSheetRef = React.useRef(null);

  // Internal state for sheet data
  const [sheetData, setSheetData] = useState({
    prayerName: '',
    prayerTime: '',
    direction: 'right',
    isRemoving: false
  });

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    open: (data) => {
      // Use callback form to ensure data is set synchronously
      setSheetData(data);
      // Small delay to ensure state update completes before animation
      requestAnimationFrame(() => {
        bottomSheetRef.current?.snapToIndex(0);
      });
    },
    close: () => {
      bottomSheetRef.current?.close();
    }
  }));

  // Determine question and confirm button color based on direction and if removing
  const question = sheetData.isRemoving
    ? (sheetData.direction === 'right' ? 'REMOVE ON TIME?' : 'REMOVE LATE?')
    : (sheetData.direction === 'right' ? 'MARK ON TIME?' : 'MARK LATE?');
  const confirmColor = sheetData.direction === 'right' ? '#81C784' : '#FF9A76';

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
          <Text style={styles.prayerNameText}>{sheetData.prayerName?.toUpperCase()}</Text>
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
});

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
    alignItems: 'flex-start',
  },
  questionText: {
    fontSize: 20,
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
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
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
