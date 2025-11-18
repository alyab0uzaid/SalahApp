/**
 * Time Utilities
 *
 * Utility functions for time conversion and formatting.
 * Used across the app for consistent time handling.
 */

/**
 * Convert a Date object to "H:MM AM/PM" format
 * @param {Date} date - Date object to format
 * @returns {string} Formatted time string (e.g., "5:30 PM")
 */
export const formatTime = (date) => {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  if (hours === 0) hours = 12;

  return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Format a Date object to "H:MM AM/PM" format for prayer times
 * @param {Date} date - Prayer time date object
 * @returns {string} Formatted prayer time string
 */
export const formatPrayerTime = (date) => {
  if (!date) return '';
  return formatTime(date);
};

/**
 * Convert time string (e.g., "5:22 AM" or "5:22:30 AM") to minutes since midnight
 * Handles both "H:MM AM/PM" and "H:MM:SS AM/PM" formats
 * @param {string} timeStr - Time string to convert
 * @returns {number} Total minutes since midnight (including fractional seconds)
 */
export const timeToMinutes = (timeStr) => {
  const [time, period] = timeStr.split(' ');
  const parts = time.split(':').map(Number);
  const hours = parts[0];
  const minutes = parts[1] || 0;
  const seconds = parts[2] || 0;

  // Convert to total minutes including fractional seconds
  let totalMinutes = hours * 60 + minutes + (seconds / 60);
  if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
  if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60;
  return totalMinutes;
};
