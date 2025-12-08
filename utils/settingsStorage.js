import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@SalahApp:settings';

// Default settings
const DEFAULT_SETTINGS = {
  calculationMethod: 'MuslimWorldLeague',
  asrMethod: 'Standard', // 'Standard' or 'Hanafi'
};

/**
 * Get all settings from storage
 * @returns {Promise<Object>} Settings object
 */
export const getSettings = async () => {
  try {
    const settingsJson = await AsyncStorage.getItem(SETTINGS_KEY);
    if (settingsJson) {
      return JSON.parse(settingsJson);
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

