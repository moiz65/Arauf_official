import defaultProfilePic from '../assets/Logo/rauf textile png.png';

/**
 * Get the user profile picture URL with fallback
 * @param {string|null} profileUrl - The Cloudinary URL or profile picture path
 * @returns {string} - The valid profile picture URL or default image
 */
export const getProfilePictureUrl = (profileUrl) => {
  // If no URL provided, return default
  if (!profileUrl || profileUrl.trim() === '') {
    return defaultProfilePic;
  }

  // If it's already a full URL (Cloudinary or other CDN), use it directly
  if (profileUrl.startsWith('http://') || profileUrl.startsWith('https://')) {
    return profileUrl;
  }

  // If it's a relative path, construct full URL
  if (profileUrl.startsWith('/')) {
    const baseUrl = process.env.REACT_APP_AUTH_BASE_URL || 'http://localhost:5000';
    return `${baseUrl}${profileUrl}`;
  }

  // Default fallback
  return defaultProfilePic;
};

/**
 * Get user initials from name for avatar placeholders
 * @param {string} firstName - User's first name
 * @param {string} lastName - User's last name
 * @returns {string} - User initials (e.g., "JD" for "John Doe")
 */
export const getUserInitials = (firstName = '', lastName = '') => {
  const firstInitial = firstName.charAt(0).toUpperCase();
  const lastInitial = lastName.charAt(0).toUpperCase();
  return `${firstInitial}${lastInitial}` || 'U';
};

/**
 * Generate a colored avatar background based on user name
 * @param {string} name - User's full name or email
 * @returns {string} - CSS color string
 */
export const getAvatarColor = (name = '') => {
  const colors = [
    '#3B82F6', // blue
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#F59E0B', // amber
    '#10B981', // green
    '#06B6D4', // cyan
    '#F97316', // orange
    '#6366F1', // indigo
  ];
  
  // Generate a consistent color based on name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Validate image file before upload
 * @param {File} file - The file to validate
 * @returns {Object} - { valid: boolean, error: string|null }
 */
export const validateProfileImage = (file) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Invalid file type. Please select a JPG, PNG, GIF, or WEBP image.' 
    };
  }

  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: 'File size must be less than 5MB' 
    };
  }

  return { valid: true, error: null };
};

/**
 * Create a preview URL for an image file
 * @param {File} file - The image file
 * @returns {string|null} - The preview URL or null
 */
export const createImagePreview = (file) => {
  if (!file) return null;
  return URL.createObjectURL(file);
};

/**
 * Clean up preview URL to avoid memory leaks
 * @param {string} url - The preview URL to revoke
 */
export const revokeImagePreview = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

export default {
  getProfilePictureUrl,
  getUserInitials,
  getAvatarColor,
  validateProfileImage,
  createImagePreview,
  revokeImagePreview
};
