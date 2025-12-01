import React from 'react';
import { StyleSheet, Pressable, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, ICON_SIZES, SPACING } from '../constants/theme';

const TABS = [
  { key: 'home', label: 'Home', icon: 'home-variant-outline' },
  { key: 'qibla', label: 'Qibla', icon: 'compass-outline' },
  { key: 'tracker', label: 'Tracker', icon: 'chart-line' },
  { key: 'settings', label: 'Settings', icon: 'cog-outline' },
];

const BottomNav = ({ activeTab, onTabPress, animatedBackgroundColor }) => {
  const isQiblaTab = activeTab === 'qibla';

  // Use animated background color if provided, otherwise use default
  const containerStyle = isQiblaTab && animatedBackgroundColor
    ? [styles.container, { backgroundColor: animatedBackgroundColor }]
    : [styles.container, isQiblaTab && styles.containerNoBg];

  return (
    <Animated.View style={containerStyle}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        // Use white with opacity for inactive icons on qibla tab for visibility on green
        const iconColor = isActive
          ? COLORS.text.primary
          : (isQiblaTab ? 'rgba(255, 255, 255, 0.37)' : COLORS.text.faded);

        return (
          <Pressable
            key={tab.key}
            style={({ pressed }) => [
              styles.tab,
              isActive && styles.tabActive,
              pressed && !isActive && styles.tabPressed,
            ]}
            onPress={() => onTabPress?.(tab.key)}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={ICON_SIZES.lg}
              color={iconColor}
            />
          </Pressable>
        );
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxl,
    alignSelf: 'stretch',
  },
  containerNoBg: {
    backgroundColor: 'transparent',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs + 2, // 6px
    paddingHorizontal: SPACING.md - 4, // 12px
  },
  tabActive: {},
  tabPressed: {},
});

export default BottomNav;


