import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';

interface UserAvatarProps {
  userId: string;
  userName?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showGoogleBadge?: boolean;
}

interface GoogleAccountStatus {
  success: boolean;
  linked: boolean;
  google_email?: string;
  google_photo_url?: string;
  google_display_name?: string;
}

// Simple in-memory cache for Google photo URLs
const photoCache: Map<string, { url: string | null; timestamp: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const UserAvatar: React.FC<UserAvatarProps> = ({
  userId,
  userName,
  size = 'md',
  className = '',
  showGoogleBadge = true,
}) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
  };

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-5 w-5',
    lg: 'h-7 w-7',
  };

  const badgeSizes = {
    sm: 'h-3 w-3 -bottom-0.5 -right-0.5',
    md: 'h-4 w-4 -bottom-0.5 -right-0.5',
    lg: 'h-5 w-5 -bottom-1 -right-1',
  };

  useEffect(() => {
    const fetchGooglePhoto = async () => {
      if (!userId) return;

      // Check cache first
      const cached = photoCache.get(userId);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setPhotoUrl(cached.url);
        setIsGoogleConnected(cached.url !== null);
        return;
      }

      try {
        const sessionKey = localStorage.getItem('adminSessionKey');
        const authSeed = localStorage.getItem('adminAuthSeed');
        if (!sessionKey || !authSeed) return;

        const apiUrl = await getApiUrl(`/google-account/user-photo?user_id=${encodeURIComponent(userId)}`);
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'X-Token': X_TOKEN_VALUE,
            'Session-Key': sessionKey,
            'Auth-Seed': authSeed,
          },
        });

        if (response.ok) {
          const data: GoogleAccountStatus = await response.json();
          if (data.success && data.linked && data.google_photo_url) {
            setPhotoUrl(data.google_photo_url);
            setIsGoogleConnected(true);
            photoCache.set(userId, { url: data.google_photo_url, timestamp: Date.now() });
          } else {
            setPhotoUrl(null);
            setIsGoogleConnected(false);
            photoCache.set(userId, { url: null, timestamp: Date.now() });
          }
        }
      } catch (error) {
        // Silently fail - show default avatar
        photoCache.set(userId, { url: null, timestamp: Date.now() });
      }
    };

    fetchGooglePhoto();
  }, [userId]);

  const handleImageError = () => {
    setImageError(true);
    setPhotoUrl(null);
    // Update cache to prevent repeated failed requests
    photoCache.set(userId, { url: null, timestamp: Date.now() });
  };

  const initials = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '';

  return (
    <div className={`relative ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br from-primary-100 to-primary-200/50 flex items-center justify-center overflow-hidden`}
      >
        {photoUrl && !imageError ? (
          <img
            src={photoUrl}
            alt={userName || userId}
            className="w-full h-full object-cover"
            onError={handleImageError}
            referrerPolicy="no-referrer"
          />
        ) : initials ? (
          <span className="text-xs font-semibold text-primary-600">{initials}</span>
        ) : (
          <User className={`${iconSizes[size]} text-primary-600`} />
        )}
      </div>
      
      {showGoogleBadge && isGoogleConnected && !imageError && (
        <div
          className={`absolute ${badgeSizes[size]} bg-white rounded-full shadow-sm border border-neutral-200/80 flex items-center justify-center`}
        >
          <svg
            className="w-2/3 h-2/3"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default UserAvatar;

// Export cache clearing function for use when needed
export const clearUserAvatarCache = (userId?: string) => {
  if (userId) {
    photoCache.delete(userId);
  } else {
    photoCache.clear();
  }
};
