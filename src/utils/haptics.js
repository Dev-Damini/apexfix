/**
 * Lightweight haptic feedback utility using the Vibration API.
 * Falls back silently on unsupported devices/browsers.
 */
export function haptic(style = 'light') {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    const patterns = {
      light: [8],
      medium: [20],
      heavy: [40],
      success: [10, 60, 10],
      error: [30, 40, 30],
      selection: [5],
    };
    navigator.vibrate(patterns[style] || patterns.light);
  }
}