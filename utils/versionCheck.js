/**
 * Force-update check: fetches minimum required version from config URL.
 * If current version is older, the app should show an "Update required" screen.
 *
 * Config URL must return JSON: { "minimumVersion": "1.0.3" }
 * Host this at: add app-config.json to your repo and use the raw GitHub URL.
 */
const CONFIG_URL = 'https://raw.githubusercontent.com/alyab0uzaid/SalahApp/main/app-config.json';

const parseVersion = (v) => {
  const parts = (v || '0.0.0').toString().split('.').map(Number);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
};

const isVersionLess = (current, minimum) => {
  const c = parseVersion(current);
  const m = parseVersion(minimum);
  if (c[0] !== m[0]) return c[0] < m[0];
  if (c[1] !== m[1]) return c[1] < m[1];
  return c[2] < m[2];
};

/**
 * Check if an update is required.
 * @param {string} currentVersion - Current app version (e.g. from Constants.expoConfig?.version)
 * @returns {Promise<{ updateRequired: boolean, minimumVersion?: string }>}
 */
export const checkUpdateRequired = async (currentVersion) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(CONFIG_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return { updateRequired: false };
    const data = await res.json();
    const min = data?.minimumVersion;
    if (!min || !currentVersion) return { updateRequired: false };
    return {
      updateRequired: isVersionLess(currentVersion, min),
      minimumVersion: min,
    };
  } catch (e) {
    // On network error, allow app to work (don't block)
    return { updateRequired: false };
  }
};
