/**
 * Haptic Feedback Utility
 * Provides vibration feedback for touch interactions
 */

export type HapticIntensity = "light" | "medium" | "heavy";

/**
 * Trigger haptic feedback on supported devices
 * Requires https for navigator.vibrate to work
 */
export function triggerHaptic(intensity: HapticIntensity = "medium"): void {
  if (!navigator.vibrate) {
    return;
  }

  const patterns: Record<HapticIntensity, number | number[]> = {
    light: 5,
    medium: 15,
    heavy: [10, 5, 15],
  };

  try {
    navigator.vibrate(patterns[intensity]);
  } catch (error) {
    // Silently fail if vibration is not supported
    // console.debug('Haptic feedback not supported:', error);
  }
}

/**
 * Light feedback - subtle indication (e.g., hover)
 */
export function hoverHaptic(): void {
  triggerHaptic("light");
}

/**
 * Medium feedback - standard interaction (e.g., selection)
 */
export function selectHaptic(): void {
  triggerHaptic("medium");
}

/**
 * Heavy feedback - important action (e.g., error, confirmation)
 */
export function errorHaptic(): void {
  triggerHaptic("heavy");
}

/**
 * Pattern feedback - custom vibration pattern
 */
export function patternHaptic(pattern: number[]): void {
  if (!navigator.vibrate) {
    return;
  }

  try {
    navigator.vibrate(pattern);
  } catch (error) {
    // Silently fail if vibration is not supported
  }
}

/**
 * Cancel any ongoing vibration
 */
export function cancelHaptic(): void {
  if (!navigator.vibrate) {
    return;
  }

  try {
    navigator.vibrate(0);
  } catch (error) {
    // Silently fail
  }
}
