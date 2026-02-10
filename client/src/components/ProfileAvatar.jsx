import React from 'react';
import defaultProfilePic from '../assets/Logo/rauf textile png.png';

/**
 * ProfileAvatar component
 * Displays user profile picture with fallback to default image
 * @param {string} profileUrl - Cloudinary URL or other profile picture URL
 * @param {string} alt - Alt text for the image
 * @param {string} className - Additional CSS classes
 * @param {string} size - Size preset: 'xs', 'sm', 'md', 'lg', 'xl'
 */
const ProfileAvatar = ({ 
  profileUrl, 
  alt = 'Profile', 
  className = '', 
  size = 'md' 
}) => {
  // Size presets
  const sizeClasses = {
    xs: 'w-8 h-8',
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  // Get the profile image URL or fallback to default
  const getProfileImageUrl = () => {
    if (!profileUrl) {
      return defaultProfilePic;
    }
    
    // If it's already a full URL (Cloudinary or other CDN), use it directly
    if (profileUrl.startsWith('http://') || profileUrl.startsWith('https://')) {
      return profileUrl;
    }
    
    // Otherwise, use default
    return defaultProfilePic;
  };

  return (
    <img
      src={getProfileImageUrl()}
      alt={alt}
      className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      onError={(e) => {
        // Fallback to default image if the URL fails to load
        e.target.src = defaultProfilePic;
      }}
    />
  );
};

export default ProfileAvatar;
