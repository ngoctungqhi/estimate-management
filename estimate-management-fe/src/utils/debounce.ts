/**
 * Debounce function
 *
 * Creates a debounced version of a function that delays invoking the provided function
 * until after `delay` milliseconds have elapsed since the last time it was invoked.
 *
 * @param func The function to debounce
 * @param delay The number of milliseconds to delay
 * @returns A debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}
