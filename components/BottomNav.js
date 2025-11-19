import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, ICON_SIZES, SPACING } from '../constants/theme';

const TABS = [
  { key: 'home', label: 'Home', icon: 'home-variant-outline' },
  { key: 'qibla', label: 'Qibla', icon: 'compass-outline' },
  { key: 'tracker', label: 'Tracker', icon: 'chart-line' },
  { key: 'settings', label: 'Settings', icon: 'cog-outline' },
];

const BottomNav = ({ activeTab, onTabPress }) => {
  // No background fill when on qibla tab
  const isQiblaTab = activeTab === 'qibla';
  
  return (
    <View style={[styles.container, isQiblaTab && styles.containerNoBg]}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
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
              color={isActive ? COLORS.text.primary : COLORS.text.faded}
            />
          </Pressable>
        );
      })}
    </View>
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


