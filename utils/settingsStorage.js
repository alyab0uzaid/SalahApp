import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@SalahApp:settings';

// Default settings
const DEFAULT_SETTINGS = {
  calculationMethod: 'MuslimWorldLeague',
  asrMethod: null, // 'Standard' or 'Hanafi' - null means not set yet
  calculationMethodAuto: false, // Auto-detect calculation method
  timeFormat: '12', // '12' for 12-hour (AM/PM) or '24' for 24-hour
  dateFormat: 'MM/DD/YYYY', // Date format preference
  onboardingCompleted: false, // Whether user has completed onboarding

  // Advanced calculation options
  customAngles: {
    fajrAngle: null, // Custom Fajr angle (degrees) - null means use method default
    ishaAngle: null, // Custom Isha angle (degrees) - null means use method default
  },
  prayerAdjustments: {
    // Manual time adjustments in minutes (+/-)
    Fajr: 0,
    Sunrise: 0,
    Dhuhr: 0,
    Asr: 0,
    Maghrib: 0,
    Isha: 0,
  },
  highLatitudeRule: 'MiddleOfTheNight', // Options: 'MiddleOfTheNight', 'SeventhOfTheNight', 'TwilightAngle'
};

/**
 * Get all settings from storage
 * @returns {Promise<Object>} Settings object
 */
export const getSettings = async () => {
  try {
    const settingsJson = await AsyncStorage.getItem(SETTINGS_KEY);
    if (settingsJson) {
      const savedSettings = JSON.parse(settingsJson);
      // Merge with defaults to ensure new fields are included
      return {
        ...DEFAULT_SETTINGS,
        ...savedSettings,
        // Deep merge for nested objects
        customAngles: {
          ...DEFAULT_SETTINGS.customAngles,
          ...(savedSettings.customAngles || {}),
        },
        prayerAdjustments: {
          ...DEFAULT_SETTINGS.prayerAdjustments,
          ...(savedSettings.prayerAdjustments || {}),
        },
      };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error getting settings:', error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Save settings to storage
 * @param {Object} settings - Settings object to save
 * @returns {Promise<void>}
 */
export const saveSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

/**
 * Get a specific setting value
 * @param {string} key - Setting key
 * @returns {Promise<any>} Setting value or default
 */
export const getSetting = async (key) => {
  const settings = await getSettings();
  return settings[key] || DEFAULT_SETTINGS[key];
};

/**
 * Update a specific setting
 * @param {string} key - Setting key
 * @param {any} value - Setting value
 * @returns {Promise<void>}
 */
export const updateSetting = async (key, value) => {
  const settings = await getSettings();
  settings[key] = value;
  await saveSettings(settings);
};

/**
 * Reset onboarding status (for testing)
 * @returns {Promise<void>}
 */
export const resetOnboarding = async () => {
  try {
    const settings = await getSettings();
    settings.onboardingCompleted = false;
    await saveSettings(settings);
  } catch (error) {
    console.error('Error resetting onboarding:', error);
  }
};

// Country to calculation method mapping for auto-detection
const COUNTRY_METHOD_MAP = {
  // North America
  'United States': 'IslamicSocietyOfNorthAmerica',
  'Canada': 'IslamicSocietyOfNorthAmerica',
  'Mexico': 'IslamicSocietyOfNorthAmerica',

  // Middle East
  'Saudi Arabia': 'UmmAlQura',
  'United Arab Emirates': 'Dubai', // Fixed: was 'Gulf', now using correct method name
  'Kuwait': 'Kuwait',
  'Qatar': 'Qatar',
  'Bahrain': 'Dubai', // Fixed: was 'Gulf', now using correct method name
  'Oman': 'Dubai', // Fixed: was 'Gulf', now using correct method name
  'Yemen': 'UmmAlQura',
  'Jordan': 'MuslimWorldLeague',
  'Lebanon': 'MuslimWorldLeague',
  'Syria': 'MuslimWorldLeague',
  'Iraq': 'MuslimWorldLeague',
  'Palestine': 'MuslimWorldLeague',
  'Israel': 'MuslimWorldLeague',

  // Egypt and North Africa
  'Egypt': 'Egyptian',
  'Libya': 'Egyptian',
  'Tunisia': 'MuslimWorldLeague',
  'Algeria': 'MuslimWorldLeague',
  'Morocco': 'MuslimWorldLeague',
  'Sudan': 'Egyptian',

  // Iran and Shia-majority regions
  'Iran': 'InstituteOfGeophysicsUniversityOfTehran',
  'Azerbaijan': 'InstituteOfGeophysicsUniversityOfTehran',

  // South Asia
  'Pakistan': 'UniversityOfIslamicSciencesKarachi',
  'India': 'UniversityOfIslamicSciencesKarachi',
  'Bangladesh': 'UniversityOfIslamicSciencesKarachi',
  'Afghanistan': 'UniversityOfIslamicSciencesKarachi',

  // Southeast Asia
  'Singapore': 'Singapore',
  'Malaysia': 'Singapore',
  'Indonesia': 'Singapore',
  'Brunei': 'Singapore',

  // Turkey and Central Asia
  'Turkey': 'MuslimWorldLeague',
  'Turkmenistan': 'MuslimWorldLeague',
  'Uzbekistan': 'MuslimWorldLeague',
  'Kazakhstan': 'MuslimWorldLeague',
  'Kyrgyzstan': 'MuslimWorldLeague',
  'Tajikistan': 'MuslimWorldLeague',

  // Europe
  'United Kingdom': 'MuslimWorldLeague',
  'France': 'MuslimWorldLeague',
  'Germany': 'MuslimWorldLeague',
  'Netherlands': 'MuslimWorldLeague',
  'Belgium': 'MuslimWorldLeague',
  'Spain': 'MuslimWorldLeague',
  'Italy': 'MuslimWorldLeague',
  'Sweden': 'MuslimWorldLeague',
  'Norway': 'MuslimWorldLeague',
  'Denmark': 'MuslimWorldLeague',

  // Africa (Sub-Saharan)
  'Nigeria': 'MuslimWorldLeague',
  'Somalia': 'MuslimWorldLeague',
  'Senegal': 'MuslimWorldLeague',
  'Mali': 'MuslimWorldLeague',
  'Niger': 'MuslimWorldLeague',
  'Chad': 'MuslimWorldLeague',
  'Kenya': 'MuslimWorldLeague',
  'Tanzania': 'MuslimWorldLeague',
  'Ethiopia': 'MuslimWorldLeague',

  // Australia and Oceania
  'Australia': 'MuslimWorldLeague',
  'New Zealand': 'MuslimWorldLeague',
};

/**
 * Get recommended calculation method based on country
 * @param {string} country - Country name
 * @returns {string} Calculation method name
 */
export const getMethodForCountry = (country) => {
  return COUNTRY_METHOD_MAP[country] || 'MuslimWorldLeague'; // Default to MWL
};

// Prayer status storage
const PRAYER_STATUS_KEY = '@SalahApp:prayerStatus';

/**
 * Get prayer status from storage
 * @returns {Promise<Object>} Prayer status object
 */
export const getPrayerStatus = async () => {
  try {
    const statusJson = await AsyncStorage.getItem(PRAYER_STATUS_KEY);
    if (statusJson) {
      return JSON.parse(statusJson);
    }
    return {};
  } catch (error) {
    console.error('Error getting prayer status:', error);
    return {};
  }
};

/**
 * Save prayer status to storage
 * @param {Object} prayerStatus - Prayer status object to save
 * @returns {Promise<void>}
 */
export const savePrayerStatus = async (prayerStatus) => {
  try {
    await AsyncStorage.setItem(PRAYER_STATUS_KEY, JSON.stringify(prayerStatus));
  } catch (error) {
    console.error('Error saving prayer status:', error);
  }
};

