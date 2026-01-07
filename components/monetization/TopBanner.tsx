'use client';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';

interface TopBanner {
  _id: string;
  titleText: string;
  highlightTags?: string[];
  backgroundStyle?: 'solid' | 'gradient' | 'pattern';
  backgroundColor?: string;
  gradientColors?: {
    from: string;
    to: string;
  };
  textColor?: string;
  iconLeft?: string;
  iconRight?: string;
  ctaText: string;
  ctaAction: 'open_payment' | 'open_pack_selector' | 'apply_offer' | 'redirect_url';
  ctaUrl?: string;
  countdownEnabled?: boolean;
  countdownEndDate?: string;
  allowDismiss?: boolean;
}

export function TopBanner() {
  const [banner, setBanner] = useState<TopBanner | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        // Check if banner was dismissed
        const dismissedBanners = JSON.parse(localStorage.getItem('dismissedBanners') || '[]');
        
        const token = localStorage.getItem('token') || '';
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://new-backend-g2gw.onrender.com'}/api/banners/top/active`, {
          headers
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.banner) {
            // Check if this banner was dismissed
            if (!dismissedBanners.includes(data.banner._id)) {
              setBanner(data.banner);
              setIsVisible(true);
              
              // Track view
              fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://new-backend-g2gw.onrender.com'}/api/banners/top/track/view`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                },
                body: JSON.stringify({ bannerId: data.banner._id })
              }).catch(console.error);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching top banner:', error);
      }
    };

    fetchBanner();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!banner?.countdownEnabled || !banner?.countdownEndDate) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const end = new Date(banner.countdownEndDate!).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeRemaining('');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [banner]);

  const handleDismiss = async () => {
    if (!banner) return;

    // Save to localStorage
    const dismissedBanners = JSON.parse(localStorage.getItem('dismissedBanners') || '[]');
    dismissedBanners.push(banner._id);
    localStorage.setItem('dismissedBanners', JSON.stringify(dismissedBanners));

    // Track dismiss
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://new-backend-g2gw.onrender.com'}/api/banners/top/track/dismiss`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ bannerId: banner._id })
      });
    } catch (error) {
      console.error('Error tracking dismiss:', error);
    }

    setIsVisible(false);
    setIsDismissed(true);
  };

  const handleCTAClick = async () => {
    if (!banner) return;

    // Track click
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://new-backend-g2gw.onrender.com'}/api/banners/top/track/click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ bannerId: banner._id })
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }

    // Handle CTA action
    if (banner.ctaAction === 'open_payment' || banner.ctaAction === 'open_pack_selector') {
      router.push('/pro');
    } else if (banner.ctaAction === 'apply_offer') {
      router.push('/pro');
    } else if (banner.ctaAction === 'redirect_url' && banner.ctaUrl) {
      window.location.href = banner.ctaUrl;
    }
  };

  if (!banner || !isVisible || isDismissed) return null;

  // Get background style
  const getBackgroundStyle = () => {
    if (banner.backgroundStyle === 'gradient' && banner.gradientColors) {
      return {
        background: `linear-gradient(90deg, ${banner.gradientColors.from}, ${banner.gradientColors.to})`
      };
    }
    return {
      backgroundColor: banner.backgroundColor || '#dc2626'
    };
  };

  // Add padding-top to body when banner is visible to prevent content shift
  useEffect(() => {
    if (isVisible && banner) {
      document.body.style.paddingTop = '48px';
      return () => {
        document.body.style.paddingTop = '0';
      };
    }
  }, [isVisible, banner]);

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] w-full transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
      style={getBackgroundStyle()}
    >
      <div className="flex items-center justify-between px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base">
        {/* Left: Icon */}
        {banner.iconLeft && (
          <div className="flex-shrink-0 mr-2 sm:mr-3 text-lg sm:text-xl">
            {banner.iconLeft}
          </div>
        )}

        {/* Center: Content */}
        <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3 min-w-0">
          {/* Highlight Tags */}
          {banner.highlightTags && banner.highlightTags.length > 0 && (
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {banner.highlightTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title Text */}
          <div className="flex-1 text-center min-w-0">
            <span className="font-semibold whitespace-nowrap overflow-hidden text-ellipsis block">
              {banner.titleText}
            </span>
          </div>

          {/* Countdown */}
          {banner.countdownEnabled && timeRemaining && (
            <div className="flex-shrink-0 ml-2 sm:ml-3 px-2 py-1 bg-white/20 backdrop-blur-sm rounded font-mono text-xs sm:text-sm font-bold">
              {timeRemaining}
            </div>
          )}
        </div>

        {/* Right: CTA Button & Close */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2 sm:ml-3">
          {/* CTA Button */}
          <button
            onClick={handleCTAClick}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white text-red-600 rounded-lg font-bold text-xs sm:text-sm hover:bg-gray-100 transition-colors whitespace-nowrap shadow-md"
          >
            {banner.ctaText}
          </button>

          {/* Close Button */}
          {banner.allowDismiss !== false && (
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
              aria-label="Close banner"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

