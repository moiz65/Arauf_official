import { useEffect, useRef } from 'react';

/**
 * Custom hook to detect clicks outside of a referenced element and ESC key press
 * @param {Function} handler - Function to call when click outside is detected or ESC is pressed
 * @param {boolean} enabled - Whether the click outside detection is enabled
 * @returns {Object} ref - Reference to attach to the element
 */
export const useClickOutside = (handler, enabled = true) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event) => {
      // If click is outside the referenced element, call the handler
      if (ref.current && !ref.current.contains(event.target)) {
        handler(event);
      }
    };

    const handleEscapeKey = (event) => {
      // If ESC key is pressed, call the handler
      if (event.key === 'Escape' || event.keyCode === 27) {
        handler(event);
      }
    };

    // Add event listener with a small delay to prevent immediate triggering
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }, 100);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [handler, enabled]);

  return ref;
};

export default useClickOutside;
