'use client';
import { useEffect, useState } from 'react';
import { monetizationApi } from '@/services/monetizationApi';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Popup {
  _id: string;
  title: string;
  description: string;
  image?: string;
  ctaText: string;
  ctaAction: string;
  ctaUrl?: string;
  popupType: string;
  templateId?: string;
  promoCode?: string; // Promo code to auto-apply when user clicks CTA
  templateData?: {
    leftImageUrl?: string;
    leftOverlayText?: string;
    leftBrandText?: string;
    leftMainText?: string;
    leftDescription?: string;
    leftPromoCode?: string;
    leftUrgencyText?: string;
    leftCtaText?: string;
    leftBackgroundColor?: string;
    tags?: Array<{
      text: string;
      color: string;
      customColor?: string;
      isEnabled: boolean;
      order: number;
    }>;
    mainHeading?: string;
    subHeading?: string;
    description?: string;
    features?: Array<{
      text: string;
      badgeType?: string;
      isEnabled: boolean;
      order: number;
    }>;
    ctaText?: string;
    ctaAction?: string;
    ctaUrl?: string;
  };
  textContent?: {
    brandText?: string;
    showBrandText?: boolean;
    tags?: Array<{
      text: string;
      color: string;
      customColor?: string;
      isEnabled: boolean;
      order: number;
    }>;
    mainTitle?: string;
    subTitle?: string;
    autoUppercase?: boolean;
    description?: string;
    validityText?: string;
    features?: Array<{
      text: string;
      badge?: string;
      badgeText?: string;
      tooltip?: string;
      isEnabled: boolean;
      order: number;
    }>;
    ctaText?: string;
    ctaSubText?: string;
    couponText?: string;
    showCoupon?: boolean;
  };
  endTime?: string;
  frequency?: 'once_per_session' | 'once_per_day' | 'once_per_hour' | 'once_per_X_hours';
  frequencyHours?: number;
}

export function PopupManager() {
  const [popup, setPopup] = useState<Popup | null>(null);
  const [show, setShow] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const router = useRouter();

  // Prevent body scroll when popup is open
  // Prevent body scroll when popup is open
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [show]);

  // ESC key to close modal
  useEffect(() => {
    const handleEsc = async (e: KeyboardEvent) => {
      if (e.key === 'Escape' && show && popup) {
        if (popup) {
          await monetizationApi.trackPopupClose(popup._id);
        }
        setShow(false);
      }
    };
    if (show) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [show, popup]);

  useEffect(() => {
    const fetchPopup = async () => {
      try {
        const response = await monetizationApi.getActivePopups();
        if (response.success && response.popup) {
          const popupData = response.popup;
          console.log('📥 Popup received from API:', popupData);

          // --- Frequency Check Logic ---
          let shouldShow = true;
          const now = Date.now();
          const frequency = popupData.frequency || 'once_per_day';
          const frequencyHours = popupData.frequencyHours || 24;
          const storageKey = `popup_last_shown_${popupData._id}`;

          console.log(`⏱️ Checking frequency: ${frequency} (Hours: ${frequencyHours})`);

          if (frequency === 'once_per_session') {
            const sessionShown = sessionStorage.getItem(storageKey);
            if (sessionShown) {
              console.log('⛔ Popup already shown this session');
              shouldShow = false;
            }
          } else {
            const lastShownStr = localStorage.getItem(storageKey);
            if (lastShownStr) {
              const lastShown = parseInt(lastShownStr, 10);
              let cooldownMs = 0;

              if (frequency === 'once_per_hour') {
                cooldownMs = 60 * 60 * 1000; // 1 hour
              } else if (frequency === 'once_per_day') {
                cooldownMs = 24 * 60 * 60 * 1000; // 24 hours
              } else if (frequency === 'once_per_X_hours') {
                cooldownMs = frequencyHours * 60 * 60 * 1000;
              }

              const timeSinceLastShow = now - lastShown;
              if (timeSinceLastShow < cooldownMs) {
                console.log(`⛔ Popup filtered by frequency. Cooldown: ${cooldownMs}ms, Time Since: ${timeSinceLastShow}ms`);
                shouldShow = false;
              }
            }
          }

          if (shouldShow) {
            // Apply updates and show logic
            // Ensure all features have badgeType set
            if (popupData.templateData?.features) {
              popupData.templateData.features = popupData.templateData.features.map((f: any) => ({
                ...f,
                badgeType: f.badgeType || 'unlimited'
              }));
            }

            setPopup(popupData);
            setShow(true);

            // Mark as shown
            if (frequency === 'once_per_session') {
              sessionStorage.setItem(storageKey, 'true');
            } else {
              localStorage.setItem(storageKey, now.toString());
            }
            console.log('✅ Popup shown and timestamp updated');
          } else {
            console.log('⏭️ Skipping popup display due to frequency settings');
          }
        }
      } catch (error) {
        console.error('Error fetching popup:', error);
      }
    };
    fetchPopup();
  }, []);

  const handleClose = async (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (popup) {
      await monetizationApi.trackPopupClose(popup._id);
    }
    setShow(false);
  };

  const handleCTAClick = async () => {
    if (popup) {
      await monetizationApi.trackPopupClick(popup._id);

      // Get promo code from popup
      const promoCode = popup.promoCode;

      // Build URL with promo code if available and action is apply_offer
      const buildProUrl = (action: string) => {
        if (action === 'apply_offer' && promoCode) {
          return `/pro?promoCode=${encodeURIComponent(promoCode)}`;
        }
        return '/pro';
      };

      if (popup.ctaAction === 'buy_plan' || popup.ctaAction === 'buy_pack') {
        router.push(buildProUrl(popup.ctaAction));
      } else if (popup.ctaAction === 'open_payment') {
        router.push(buildProUrl(popup.ctaAction));
      } else if (popup.ctaAction === 'apply_offer') {
        router.push(buildProUrl('apply_offer'));
      } else if (popup.ctaAction === 'redirect' && popup.ctaUrl) {
        window.location.href = popup.ctaUrl;
      } else if (popup.templateData?.ctaAction === 'buy_plan') {
        router.push(buildProUrl(popup.templateData.ctaAction));
      } else if (popup.templateData?.ctaAction === 'open_payment') {
        router.push(buildProUrl(popup.templateData.ctaAction));
      } else if (popup.templateData?.ctaAction === 'apply_offer') {
        router.push(buildProUrl('apply_offer'));
      } else if (popup.templateData?.ctaAction === 'redirect' && popup.templateData?.ctaUrl) {
        window.location.href = popup.templateData.ctaUrl;
      }
    }
    setShow(false);
  };

  if (!show || !popup) return null;

  // Different popup types rendering
  if (popup.popupType === 'toast') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-6" onClick={handleClose}>
        <div className="bg-white rounded-xl shadow-2xl p-4 max-w-sm w-full sm:w-auto animate-in slide-in-from-bottom duration-300 border border-gray-100 relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleClose}
            onTouchStart={(e) => e.stopPropagation()}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 z-50 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-full p-2 sm:p-1.5 transition-colors touch-manipulation"
            style={{ minWidth: '44px', minHeight: '44px' }}
            aria-label="Close"
          >
            <X className="h-5 w-5 sm:h-4 sm:w-4 text-gray-600" />
          </button>
          {popup.image && (
            <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-3 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
              )}
              <img
                src={popup.image}
                alt={popup.title || 'Promotional image'}
                className={`max-w-full max-h-full transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                style={{
                  objectFit: 'contain',
                  objectPosition: 'center',
                  width: '100%',
                  height: '100%',
                  display: 'block'
                }}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
                loading="lazy"
                decoding="async"
              />
            </div>
          )}
          <div className="pr-8">
            <h3 className="font-bold text-lg mb-1.5 text-gray-900 break-words">{popup.title}</h3>
            <p className="text-sm text-gray-600 mb-3 leading-relaxed break-words">{popup.description}</p>
            <button
              onClick={handleCTAClick}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-2.5 rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {popup.ctaText}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (popup.popupType === 'bottom_sheet') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleClose}
        style={{ touchAction: 'none' }}
      >
        <div
          className="bg-white rounded-t-2xl p-4 sm:p-5 md:p-6 w-[95%] sm:w-[88%] md:w-[78%] lg:w-[68%] max-w-[95vw] sm:max-w-lg md:max-w-xl mx-auto animate-in slide-in-from-bottom duration-300 max-h-[80vh] sm:max-h-[75vh] md:max-h-[70vh] overflow-y-auto shadow-2xl relative"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '95vw',
            touchAction: 'pan-y',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* Drag Handle */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
          </div>

          <button
            onClick={handleClose}
            onTouchStart={(e) => e.stopPropagation()}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 z-50 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-full p-2.5 sm:p-2 transition-colors touch-manipulation"
            style={{ minWidth: '44px', minHeight: '44px' }}
            aria-label="Close"
          >
            <X className="h-6 w-6 sm:h-5 sm:w-5 text-gray-600" />
          </button>

          {popup.image && (
            <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-5 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                  <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
              )}
              <img
                src={popup.image}
                alt={popup.title || 'Promotional image'}
                className={`max-w-full max-h-full transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                style={{
                  objectFit: 'contain',
                  objectPosition: 'center',
                  width: '100%',
                  height: '100%',
                  display: 'block'
                }}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
                loading="lazy"
                decoding="async"
              />
            </div>
          )}

          <div className="pr-10 sm:pr-12">
            {/* Brand Text */}
            {popup.textContent?.showBrandText && popup.textContent.brandText && (
              <div className="text-[10px] sm:text-xs font-semibold text-gray-500 mb-1">{popup.textContent.brandText}</div>
            )}

            {/* Tags */}
            {popup.textContent?.tags && popup.textContent.tags.filter((t: any) => t.isEnabled && t.text).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {popup.textContent.tags
                  .filter((t: any) => t.isEnabled && t.text)
                  .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                  .map((tag: any, idx: number) => {
                    const colorClasses: Record<string, string> = {
                      red: 'bg-red-100 text-red-700',
                      orange: 'bg-orange-100 text-orange-700',
                      green: 'bg-green-100 text-green-700',
                      blue: 'bg-blue-100 text-blue-700',
                      yellow: 'bg-yellow-100 text-yellow-700',
                      purple: 'bg-purple-100 text-purple-700'
                    };
                    const bgClass = tag.color === 'custom' && tag.customColor
                      ? ''
                      : colorClasses[tag.color] || colorClasses.red;
                    return (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-semibold rounded-full ${bgClass}`}
                        style={tag.color === 'custom' && tag.customColor ? { backgroundColor: tag.customColor + '20', color: tag.customColor } : {}}
                      >
                        <span className="w-1 h-1 rounded-full bg-current opacity-60"></span>
                        {tag.text}
                      </span>
                    );
                  })}
              </div>
            )}

            {/* Main Title */}
            {popup.textContent?.mainTitle ? (
              <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-gray-900 leading-tight">{popup.textContent.mainTitle}</h2>
            ) : popup.title && (
              <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-gray-900 leading-tight">{popup.title}</h2>
            )}

            {/* Sub Title */}
            {popup.textContent?.subTitle && (
              <p className="text-base sm:text-lg font-semibold text-gray-800 mb-1 leading-tight">{popup.textContent.subTitle}</p>
            )}

            {/* Description */}
            {popup.textContent?.description ? (
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-5 leading-relaxed">{popup.textContent.description}</p>
            ) : popup.description && (
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-5 leading-relaxed">{popup.description}</p>
            )}

            {/* Validity Text */}
            {popup.textContent?.validityText && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{popup.textContent.validityText}</span>
              </div>
            )}

            {/* Features List */}
            {popup.textContent?.features && popup.textContent.features.filter((f: any) => f.isEnabled && f.text).length > 0 && (
              <div className="space-y-2 mb-4">
                {popup.textContent.features
                  .filter((f: any) => f.isEnabled && f.text)
                  .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                  .map((feature: any, idx: number) => {
                    const badgeClasses: Record<string, string> = {
                      unlimited: 'bg-green-100 text-green-700',
                      pro: 'bg-blue-100 text-blue-700',
                      premium: 'bg-purple-100 text-purple-700'
                    };
                    const badgeClass = badgeClasses[feature.badge] || 'bg-gray-100 text-gray-700';
                    const badgeText = feature.badge === 'custom' ? feature.badgeText : feature.badge;
                    return (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                        <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="flex-1">{feature.text}</span>
                        {feature.badge && badgeText && (
                          <span className={`px-1.5 py-0.5 text-xs font-semibold rounded-full ${badgeClass}`}>
                            {badgeText}
                          </span>
                        )}
                        {feature.tooltip && (
                          <button className="w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 text-xs" title={feature.tooltip}>
                            i
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}

            {/* CTA Button */}
            <button
              onClick={handleCTAClick}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base hover:from-indigo-700 hover:to-indigo-800 active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              {popup.textContent?.ctaText || popup.ctaText}
            </button>

            {/* CTA Subtext */}
            {popup.textContent?.ctaSubText && (
              <p className="text-xs text-gray-500 text-center mt-2">{popup.textContent.ctaSubText}</p>
            )}

            {/* Coupon Text */}
            {popup.textContent?.showCoupon && popup.textContent.couponText && (
              <p className="text-sm text-gray-600 text-center mt-3">{popup.textContent.couponText}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Exit Intent Popup
  if (popup.popupType === 'exit_intent') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300 p-3 sm:p-4"
        onClick={handleClose}
        style={{ touchAction: 'none' }}
      >
        <div
          className="bg-white rounded-2xl w-[95%] sm:w-[88%] md:w-[78%] lg:w-[68%] xl:w-[58%] max-w-[95vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl mx-2 sm:mx-4 max-h-[85vh] sm:max-h-[80vh] md:max-h-[75vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300 relative"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '95vw',
            touchAction: 'pan-y',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <button
            onClick={handleClose}
            onTouchStart={(e) => e.stopPropagation()}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 z-50 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-full p-2.5 sm:p-2 transition-colors touch-manipulation"
            style={{ minWidth: '44px', minHeight: '44px' }}
            aria-label="Close"
          >
            <X className="h-6 w-6 sm:h-5 sm:w-5 text-gray-600" />
          </button>

          {popup.image && (
            <div className="relative w-full aspect-square flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden p-4 sm:p-6">
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                  <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
              )}
              <img
                src={popup.image}
                alt={popup.title || 'Promotional image'}
                className={`max-w-full max-h-full transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                style={{
                  objectFit: 'contain',
                  objectPosition: 'center',
                  width: '100%',
                  height: '100%',
                  display: 'block'
                }}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
                loading="lazy"
                decoding="async"
              />
            </div>
          )}

          <div className="p-4 sm:p-6 md:p-8 flex-1 flex flex-col overflow-y-auto">
            {/* Brand Text */}
            {popup.textContent?.showBrandText && popup.textContent.brandText && (
              <div className="text-[10px] sm:text-xs font-semibold text-gray-500 mb-1.5 sm:mb-2">{popup.textContent.brandText}</div>
            )}

            {/* Tags */}
            {popup.textContent?.tags && popup.textContent.tags.filter((t: any) => t.isEnabled && t.text).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 justify-center">
                {popup.textContent.tags
                  .filter((t: any) => t.isEnabled && t.text)
                  .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                  .map((tag: any, idx: number) => {
                    const colorClasses: Record<string, string> = {
                      red: 'bg-red-100 text-red-700',
                      orange: 'bg-orange-100 text-orange-700',
                      green: 'bg-green-100 text-green-700',
                      blue: 'bg-blue-100 text-blue-700',
                      yellow: 'bg-yellow-100 text-yellow-700',
                      purple: 'bg-purple-100 text-purple-700'
                    };
                    const bgClass = tag.color === 'custom' && tag.customColor
                      ? ''
                      : colorClasses[tag.color] || colorClasses.red;
                    return (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full ${bgClass}`}
                        style={tag.color === 'custom' && tag.customColor ? { backgroundColor: tag.customColor + '20', color: tag.customColor } : {}}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
                        {tag.text}
                      </span>
                    );
                  })}
              </div>
            )}

            {/* Main Title */}
            {popup.textContent?.mainTitle ? (
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 text-gray-900 leading-tight break-words">{popup.textContent.mainTitle}</h2>
            ) : popup.title && (
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 text-gray-900 leading-tight break-words">{popup.title}</h2>
            )}

            {/* Sub Title */}
            {popup.textContent?.subTitle && (
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-1.5 sm:mb-2 leading-tight break-words">{popup.textContent.subTitle}</p>
            )}

            {/* Description */}
            {popup.textContent?.description ? (
              <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-4 sm:mb-6 flex-1 leading-relaxed">{popup.textContent.description}</p>
            ) : popup.description && (
              <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-4 sm:mb-6 flex-1 leading-relaxed">{popup.description}</p>
            )}

            {/* Validity Text */}
            {popup.textContent?.validityText && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 justify-center">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{popup.textContent.validityText}</span>
              </div>
            )}

            {/* Features List */}
            {popup.textContent?.features && popup.textContent.features.filter((f: any) => f.isEnabled && f.text).length > 0 && (
              <div className="space-y-2.5 mb-6">
                {popup.textContent.features
                  .filter((f: any) => f.isEnabled && f.text)
                  .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                  .map((feature: any, idx: number) => {
                    const badgeClasses: Record<string, string> = {
                      unlimited: 'bg-green-100 text-green-700',
                      pro: 'bg-blue-100 text-blue-700',
                      premium: 'bg-purple-100 text-purple-700'
                    };
                    const badgeClass = badgeClasses[feature.badge] || 'bg-gray-100 text-gray-700';
                    const badgeText = feature.badge === 'custom' ? feature.badgeText : feature.badge;
                    return (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 justify-center">
                        <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="flex-1">{feature.text}</span>
                        {feature.badge && badgeText && (
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${badgeClass}`}>
                            {badgeText}
                          </span>
                        )}
                        {feature.tooltip && (
                          <button className="w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 text-xs" title={feature.tooltip}>
                            i
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}

            {/* CTA Button */}
            <button
              onClick={handleCTAClick}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base md:text-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {popup.textContent?.ctaText || popup.ctaText}
            </button>

            {/* CTA Subtext */}
            {popup.textContent?.ctaSubText && (
              <p className="text-xs text-gray-500 text-center mt-2">{popup.textContent.ctaSubText}</p>
            )}

            {/* Coupon Text */}
            {popup.textContent?.showCoupon && popup.textContent.couponText && (
              <p className="text-sm text-gray-600 text-center mt-3">{popup.textContent.couponText}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default: center_modal or full_screen - Premium Responsive Design (Mobile-First)
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 p-2 sm:p-3 md:p-4"
      onClick={handleClose}
      style={{ touchAction: 'none', overflowX: 'hidden' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-title"
    >
      <div
        className={`bg-white ${popup.popupType === 'full_screen' ? 'w-full h-full rounded-none' : 'rounded-xl sm:rounded-2xl'} relative overflow-hidden flex flex-col sm:flex-row shadow-2xl animate-in zoom-in duration-300`}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: popup.popupType === 'full_screen' ? '100%' : isMobile ? 'min(85vw, 480px)' : 'min(95vw, 1000px)',
          height: popup.popupType === 'full_screen' ? '100%' : 'auto',
          aspectRatio: popup.popupType === 'full_screen' ? 'auto' : (isMobile ? '1 / 2' : '2 / 1'),
          maxWidth: popup.popupType === 'full_screen' ? '100%' : isMobile ? 'min(85vw, 480px)' : 'min(95vw, 1000px)',
          maxHeight: popup.popupType === 'full_screen' ? '100%' : isMobile ? '85vh' : '90vh',
          boxSizing: 'border-box',
          margin: 'auto',
          touchAction: 'pan-y',
          WebkitOverflowScrolling: 'touch',
          overflowX: 'hidden'
        }}
      >
        <button
          onClick={handleClose}
          onTouchStart={(e) => e.stopPropagation()}
          className="absolute top-2 right-2 sm:top-5 sm:right-5 z-50 bg-white/90 hover:bg-white active:bg-gray-100 rounded-full p-2.5 sm:p-2.5 transition-colors shadow-lg border border-gray-200 touch-manipulation"
          style={{ minWidth: '44px', minHeight: '44px' }}
          aria-label="Close"
        >
          <X className="h-6 w-6 sm:h-5 sm:w-5 text-gray-700" />
        </button>

        {/* Left Section - Image + Content (for OFFER_SPLIT template) */}
        {popup.templateId === 'OFFER_SPLIT_IMAGE_RIGHT_CONTENT' && popup.templateData ? (
          <div
            className={`relative w-full sm:w-[50%] overflow-hidden flex flex-col items-center justify-center p-1.5 sm:p-2 md:p-3 lg:p-4 flex-shrink-0`}
            style={{
              aspectRatio: '1 / 1',
              boxSizing: 'border-box',
              backgroundColor: popup.templateData.leftBackgroundColor || '#FFA500',
              backgroundImage: popup.templateData.leftImageUrl ? `url(${popup.templateData.leftImageUrl})` : 'none',
              backgroundSize: popup.templateData.leftImageUrl ? 'cover' : 'auto',
              backgroundPosition: 'center center',
              backgroundRepeat: 'no-repeat',
              backgroundAttachment: 'scroll',
              position: 'relative'
            }}
          >
            {/* Background Pattern Overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%), linear-gradient(-45deg, rgba(0,0,0,0.1) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.1) 75%), linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.1) 75%)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
            }}></div>

            {/* Content Overlay */}
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center space-y-2 sm:space-y-3 md:space-y-4 px-2 sm:px-4 py-3 sm:py-4">
              {/* Brand Text */}
              {popup.templateData.leftBrandText && (
                <p className="text-[10px] sm:text-xs md:text-sm font-semibold text-gray-800 uppercase">
                  {popup.templateData.leftBrandText}
                </p>
              )}

              {/* Main Text (SPECIAL OFFER) - White Ticket Style */}
              {popup.templateData.leftMainText && (
                <div className="relative w-full max-w-[280px] sm:max-w-xs">
                  {/* Blue Banner Background */}
                  <div className="absolute top-0 left-0 right-0 h-2 sm:h-3 bg-blue-600 rounded-t-lg z-10"></div>
                  {/* White Ticket Shape with Serrated Bottom */}
                  <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 mt-2 sm:mt-3 shadow-xl relative" style={{
                    clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, calc(100% - 24px) calc(100% - 8px), calc(100% - 36px) 100%, calc(100% - 48px) calc(100% - 8px), calc(100% - 60px) 100%, calc(100% - 72px) calc(100% - 8px), calc(100% - 84px) 100%, calc(100% - 96px) calc(100% - 8px), calc(100% - 108px) 100%, calc(100% - 120px) calc(100% - 8px), calc(100% - 132px) 100%, calc(100% - 144px) calc(100% - 8px), calc(100% - 156px) 100%, calc(100% - 168px) calc(100% - 8px), calc(100% - 180px) 100%, calc(100% - 192px) calc(100% - 8px), calc(100% - 204px) 100%, calc(100% - 216px) calc(100% - 8px), calc(100% - 228px) 100%, calc(100% - 240px) calc(100% - 8px), calc(100% - 252px) 100%, calc(100% - 264px) calc(100% - 8px), 12px 100%, 0 calc(100% - 12px))'
                  }}>
                    <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-black uppercase leading-tight">
                      {popup.templateData.leftMainText.split(' ').map((word: string, i: number) => (
                        <span key={i} className="block">{word}</span>
                      ))}
                    </h3>
                  </div>
                </div>
              )}

              {/* Description */}
              {popup.templateData.leftDescription && (
                <p className="text-[10px] sm:text-xs md:text-sm text-gray-800 max-w-[280px] sm:max-w-xs px-2">
                  {popup.templateData.leftDescription}
                </p>
              )}

              {/* Promo Code */}
              {popup.templateData.leftPromoCode && (
                <div className="border-t-2 border-dashed border-gray-400 pt-2 w-full max-w-[280px] sm:max-w-xs px-2">
                  <p className="text-[10px] sm:text-xs md:text-sm font-semibold text-gray-800">
                    {popup.templateData.leftPromoCode}
                  </p>
                </div>
              )}

              {/* Urgency Text */}
              {popup.templateData.leftUrgencyText && (
                <p className="text-[10px] sm:text-xs italic text-gray-700 max-w-[280px] sm:max-w-xs px-2">
                  {popup.templateData.leftUrgencyText}
                </p>
              )}

              {/* Left CTA Button */}
              {popup.templateData.leftCtaText && (
                <button
                  onClick={handleCTAClick}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold text-xs sm:text-sm md:text-base transition-colors shadow-lg mt-1 sm:mt-2 w-full max-w-[200px] sm:max-w-none"
                >
                  {popup.templateData.leftCtaText}
                </button>
              )}
            </div>
          </div>
        ) : ((popup.image) && (
          <div
            className={`relative w-full sm:w-[50%] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center flex-shrink-0`}
            style={{
              aspectRatio: '1 / 1',
              boxSizing: 'border-box',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-100">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            )}
            <div
              className="w-full h-full flex items-center justify-center p-1 sm:p-2 md:p-3"
              style={{
                width: '100%',
                maxWidth: '100%',
                height: '100%',
                overflow: 'hidden',
                boxSizing: 'border-box',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <img
                src={popup.image}
                alt={popup.title || 'Promotional image'}
                className={`transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                style={{
                  objectFit: 'contain',
                  objectPosition: 'center',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto',
                  display: 'block'
                }}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        ))}

        {/* Content Section - Right Side (100% width on mobile, 50% on desktop) */}
        <div
          className={`w-full sm:w-[50%] flex flex-col flex-shrink-0 ${popup.popupType === 'full_screen' ? 'p-4 sm:p-5 md:p-6 justify-center' : 'p-3 sm:p-4 md:p-5 lg:p-6'} overflow-y-auto bg-white relative min-h-0`}
          style={{
            aspectRatio: '1 / 1',
            boxSizing: 'border-box'
          }}
        >
          {/* Brand Text */}
          {popup.textContent?.showBrandText && popup.textContent.brandText && (
            <div className="text-xs sm:text-sm font-semibold text-gray-500 mb-2">
              {popup.textContent.brandText}
            </div>
          )}

          {/* For template-based popups, use templateData fields */}
          {popup.templateId === 'OFFER_SPLIT_IMAGE_RIGHT_CONTENT' && popup.templateData ? (
            <>
              {/* Tags from templateData */}
              {popup.templateData.tags && popup.templateData.tags.filter((t: any) => t.isEnabled && t.text).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {popup.templateData.tags
                    .filter((t: any) => t.isEnabled && t.text)
                    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                    .map((tag: any, idx: number) => {
                      const colorClasses: Record<string, string> = {
                        red: 'bg-red-600 text-white',
                        orange: 'bg-orange-500 text-white',
                        green: 'bg-green-600 text-white',
                        blue: 'bg-blue-600 text-white',
                        yellow: 'bg-yellow-500 text-white',
                        purple: 'bg-purple-600 text-white',
                        gray: 'bg-gray-700 text-white'
                      };
                      const bgClass = tag.color === 'custom' && tag.customColor
                        ? ''
                        : colorClasses[tag.color] || colorClasses.red;
                      return (
                        <span
                          key={idx}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full ${bgClass}`}
                          style={tag.color === 'custom' && tag.customColor ? { backgroundColor: tag.customColor, color: 'white' } : {}}
                        >
                          {tag.text}
                        </span>
                      );
                    })}
                </div>
              )}

              {/* Main Heading */}
              {popup.templateData.mainHeading && (
                <h2
                  id="popup-title"
                  className="font-bold mb-2 text-red-600 leading-tight uppercase break-words"
                  style={{
                    fontSize: 'clamp(18px, 4vw, 32px)',
                    lineHeight: '1.4'
                  }}
                >
                  {popup.templateData.mainHeading}
                </h2>
              )}

              {/* Sub Heading */}
              {popup.templateData.subHeading && (
                <p
                  className="font-bold mb-2 sm:mb-3 text-gray-900 uppercase leading-tight break-words"
                  style={{
                    fontSize: 'clamp(16px, 3.5vw, 28px)',
                    lineHeight: '1.4'
                  }}
                >
                  {popup.templateData.subHeading}
                </p>
              )}

              {/* Description */}
              {popup.templateData.description && (
                <p
                  className="text-gray-600 mb-3 sm:mb-4 break-words"
                  style={{
                    fontSize: 'clamp(14px, 2vw, 18px)',
                    lineHeight: '1.5'
                  }}
                >
                  {popup.templateData.description}
                </p>
              )}

              {/* Features from templateData - Show all features with badges */}
              {popup.templateData.features && Array.isArray(popup.templateData.features) && popup.templateData.features.length > 0 && (
                <div className="space-y-2 mb-4">
                  {popup.templateData.features
                    .filter((f: any) => f && f.text && f.text.trim() && (f.isEnabled !== false))
                    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                    .map((feature: any, idx: number) => {
                      const getBadgeClass = (badgeType: string) => {
                        const badges: Record<string, string> = {
                          unlimited: 'bg-green-500 text-white', // Medium green
                          pro: 'bg-green-700 text-white', // Dark green
                          included: 'bg-yellow-500 text-white' // Golden yellow
                        };
                        return badges[badgeType] || 'bg-green-500 text-white';
                      };

                      const badgeTypeToShow = (feature.badgeType && feature.badgeType.trim() !== '')
                        ? feature.badgeType.trim().toLowerCase()
                        : 'unlimited';
                      const badgeText = badgeTypeToShow === 'unlimited' ? 'Unlimited' :
                        badgeTypeToShow === 'pro' ? 'Pro' :
                          badgeTypeToShow === 'included' ? 'Included' :
                            badgeTypeToShow.charAt(0).toUpperCase() + badgeTypeToShow.slice(1);

                      return (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-900">
                          <svg className="w-4 h-4 text-black flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="flex-1 text-sm">{feature.text}</span>
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap flex-shrink-0 ${getBadgeClass(badgeTypeToShow)}`}
                          >
                            {badgeText}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Tags / Badges */}
              {popup.textContent?.tags && popup.textContent.tags.filter((t: any) => t.isEnabled && t.text).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                  {popup.textContent.tags
                    .filter((t: any) => t.isEnabled && t.text)
                    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                    .map((tag: any, idx: number) => {
                      const colorClasses: Record<string, string> = {
                        red: 'bg-red-100 text-red-700',
                        orange: 'bg-orange-100 text-orange-700',
                        green: 'bg-green-100 text-green-700',
                        blue: 'bg-blue-100 text-blue-700',
                        yellow: 'bg-yellow-100 text-yellow-700',
                        purple: 'bg-purple-100 text-purple-700'
                      };
                      const bgClass = tag.color === 'custom' && tag.customColor
                        ? ''
                        : colorClasses[tag.color] || colorClasses.red;
                      return (
                        <span
                          key={idx}
                          className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold rounded-full ${bgClass}`}
                          style={tag.color === 'custom' && tag.customColor ? { backgroundColor: tag.customColor + '20', color: tag.customColor } : {}}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
                          {tag.text}
                        </span>
                      );
                    })}
                </div>
              )}

              {/* Main Title */}
              {popup.textContent?.mainTitle && (
                <h2
                  id="popup-title"
                  className="font-bold mb-2 sm:mb-3 text-gray-900 break-words"
                  style={{
                    fontSize: 'clamp(20px, 4vw, 36px)',
                    lineHeight: '1.4'
                  }}
                >
                  {popup.textContent.mainTitle}
                </h2>
              )}

              {/* Fallback to legacy title if textContent.mainTitle not available */}
              {!popup.textContent?.mainTitle && popup.title && (
                <h2
                  id="popup-title"
                  className="font-bold mb-2 sm:mb-3 text-gray-900 break-words"
                  style={{
                    fontSize: 'clamp(20px, 4vw, 36px)',
                    lineHeight: '1.4'
                  }}
                >
                  {popup.title}
                </h2>
              )}

              {/* Sub Title */}
              {popup.textContent?.subTitle && (
                <p
                  className="font-bold mb-2 sm:mb-3 text-gray-800 break-words"
                  style={{
                    fontSize: 'clamp(16px, 3vw, 24px)',
                    lineHeight: '1.4'
                  }}
                >
                  {popup.textContent.subTitle}
                </p>
              )}

              {/* Description */}
              {popup.textContent?.description && (
                <p
                  className="text-gray-600 mb-3 sm:mb-4 md:mb-6 break-words"
                  style={{
                    fontSize: 'clamp(14px, 2vw, 18px)',
                    lineHeight: '1.5'
                  }}
                >
                  {popup.textContent.description}
                </p>
              )}

              {/* Fallback to legacy description */}
              {!popup.textContent?.description && popup.description && (
                <p
                  className="text-gray-600 mb-3 sm:mb-4 md:mb-6 break-words"
                  style={{
                    fontSize: 'clamp(14px, 2vw, 18px)',
                    lineHeight: '1.5'
                  }}
                >
                  {popup.description}
                </p>
              )}
            </>
          )}

          {/* Validity Text */}
          {popup.textContent?.validityText && (
            <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-700 mb-3">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="flex-1">{popup.textContent.validityText}</span>
            </div>
          )}

          {/* Features List */}
          {popup.textContent?.features && popup.textContent.features.filter((f: any) => f.isEnabled && f.text).length > 0 && (
            <div className="space-y-2.5 sm:space-y-3 mb-4 sm:mb-6">
              {popup.textContent.features
                .filter((f: any) => f.isEnabled && f.text)
                .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                .map((feature: any, idx: number) => {
                  const badgeClasses: Record<string, string> = {
                    unlimited: 'bg-green-100 text-green-700',
                    pro: 'bg-blue-100 text-blue-700',
                    premium: 'bg-purple-100 text-purple-700'
                  };
                  const badgeClass = badgeClasses[feature.badge] || 'bg-gray-100 text-gray-700';
                  const badgeText = feature.badge === 'custom' ? feature.badgeText : feature.badge;
                  return (
                    <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="flex-1 min-w-0">{feature.text}</span>
                      {feature.badge && badgeText && (
                        <span className={`px-1.5 sm:px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${badgeClass}`}>
                          {badgeText}
                        </span>
                      )}
                      {feature.tooltip && (
                        <button
                          className="w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 text-xs flex-shrink-0"
                          title={feature.tooltip}
                        >
                          i
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          {/* Decorative Wavy Element (Snowdrift) */}
          <div className="mb-3 relative">
            <svg className="w-full h-6 text-white" viewBox="0 0 1200 60" preserveAspectRatio="none">
              <path d="M0,60 Q150,40 300,50 T600,45 T900,55 T1200,50 L1200,60 L0,60 Z" fill="currentColor" />
            </svg>
          </div>

          {/* CTA Button - Sticky on Mobile, Normal on Desktop */}
          <div
            className="bg-white pt-4 pb-2 lg:pb-0 lg:pt-0 mt-auto"
            style={{
              position: 'sticky',
              bottom: 0,
              left: 0,
              right: 0,
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}
          >
            <button
              onClick={handleCTAClick}
              className="w-full bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 active:bg-red-800 active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl"
              style={{
                minHeight: '48px',
                fontSize: 'clamp(16px, 2.5vw, 18px)',
                padding: '12px 24px',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              {popup.templateId === 'OFFER_SPLIT_IMAGE_RIGHT_CONTENT' && popup.templateData?.ctaText
                ? popup.templateData.ctaText
                : (popup.textContent?.ctaText || popup.ctaText)}
            </button>
          </div>

          {/* CTA Subtext */}
          {popup.textContent?.ctaSubText && (
            <p className="text-xs text-gray-500 text-center mt-2">{popup.textContent.ctaSubText}</p>
          )}

          {/* Coupon Text */}
          {popup.textContent?.showCoupon && popup.textContent.couponText && (
            <p className="text-sm text-gray-600 text-center mt-3">{popup.textContent.couponText}</p>
          )}
        </div>
      </div>
    </div>
  );
}

