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
}

export function PopupManager() {
  const [popup, setPopup] = useState<Popup | null>(null);
  const [show, setShow] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchPopup = async () => {
      try {
        const response = await monetizationApi.getActivePopups();
        if (response.success && response.popup) {
          setPopup(response.popup);
          setShow(true);
        }
      } catch (error) {
        console.error('Error fetching popup:', error);
      }
    };
    fetchPopup();
  }, []);

  const handleClose = async () => {
    if (popup) {
      await monetizationApi.trackPopupClose(popup._id);
    }
    setShow(false);
  };

  const handleCTAClick = async () => {
    if (popup) {
      await monetizationApi.trackPopupClick(popup._id);
      
      if (popup.ctaAction === 'buy_pack') {
        router.push('/pro');
      } else if (popup.ctaAction === 'watch_ad') {
        // Trigger ad watch - implement ad watching logic
        console.log('Watch ad action');
      } else if (popup.ctaAction === 'apply_offer') {
        router.push('/pro');
      } else if (popup.ctaAction === 'custom_url' && popup.ctaUrl) {
        window.location.href = popup.ctaUrl;
      }
    }
    setShow(false);
  };

  if (!show || !popup) return null;

  // Different popup types rendering
  if (popup.popupType === 'toast') {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-white rounded-xl shadow-2xl p-4 max-w-sm w-[90vw] sm:w-auto animate-in slide-in-from-bottom duration-300 border border-gray-100">
        <button 
          onClick={handleClose} 
          className="absolute top-3 right-3 z-10 bg-gray-100 hover:bg-gray-200 rounded-full p-1.5 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-gray-600" />
        </button>
        {popup.image && (
          <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-3 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            )}
            <img
              src={popup.image}
              alt={popup.title}
              className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)}
            />
          </div>
        )}
        <div className="pr-8">
          <h3 className="font-bold text-lg mb-1.5 text-gray-900">{popup.title}</h3>
          <p className="text-sm text-gray-600 mb-3 leading-relaxed">{popup.description}</p>
          <button
            onClick={handleCTAClick}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-2.5 rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
          >
            {popup.ctaText}
          </button>
        </div>
      </div>
    );
  }

  if (popup.popupType === 'bottom_sheet') {
    return (
      <div className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-white rounded-t-2xl p-6 w-full max-w-lg mx-auto animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Drag Handle */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
          </div>
          
          <button 
            onClick={handleClose} 
            className="absolute top-5 right-5 z-10 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
          
          {popup.image && (
            <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-5 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
              )}
              <img
                src={popup.image}
                alt={popup.title}
                className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
              />
            </div>
          )}
          
          <div className="pr-12">
            <h2 className="text-2xl font-bold mb-3 text-gray-900">{popup.title}</h2>
            <p className="text-gray-600 mb-5 leading-relaxed">{popup.description}</p>
            <button
              onClick={handleCTAClick}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 rounded-xl font-medium hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              {popup.ctaText}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Exit Intent Popup
  if (popup.popupType === 'exit_intent') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300">
          <button 
            onClick={handleClose} 
            className="absolute top-5 right-5 z-10 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
          
          {popup.image && (
            <div className="relative w-full aspect-square flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
              )}
              <img
                src={popup.image}
                alt={popup.title}
                className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
              />
            </div>
          )}
          
          <div className="p-8 flex-1 flex flex-col">
            <h2 className="text-3xl font-bold mb-3 text-gray-900">{popup.title}</h2>
            <p className="text-gray-600 mb-6 flex-1 leading-relaxed text-lg">{popup.description}</p>
            <button
              onClick={handleCTAClick}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-4 rounded-xl font-semibold text-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              {popup.ctaText}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default: center_modal or full_screen - Split Layout Design
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 p-2 sm:p-4">
      <div className={`bg-white ${popup.popupType === 'full_screen' ? 'w-full h-full rounded-none' : 'rounded-2xl max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh]'} relative overflow-hidden flex flex-col sm:flex-row shadow-2xl animate-in zoom-in duration-300`}>
        <button 
          onClick={handleClose} 
          className="absolute top-3 right-3 sm:top-5 sm:right-5 z-10 bg-white/90 hover:bg-white rounded-full p-2 sm:p-2.5 transition-colors shadow-lg border border-gray-200"
          aria-label="Close"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
        </button>
        
        {/* Image Section - Top on Mobile, Left on Desktop */}
        {popup.image && (
          <div className={`relative ${popup.popupType === 'full_screen' ? 'w-full sm:w-1/2 h-1/2 sm:h-full' : 'w-full sm:w-2/5 h-64 sm:h-auto min-h-[250px] sm:min-h-0'} overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center`}>
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            )}
            <img
              src={popup.image}
              alt={popup.title}
              className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)}
            />
          </div>
        )}
        
        {/* Content Section - Bottom on Mobile, Right on Desktop */}
        <div className={`flex-1 flex flex-col ${popup.popupType === 'full_screen' ? 'p-6 sm:p-12 justify-center' : 'p-4 sm:p-8'} overflow-y-auto`}>
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
              Limited offer
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
              <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
              Holiday sale
            </span>
          </div>

          {/* Title */}
          <h2 className={`${popup.popupType === 'full_screen' ? 'text-3xl sm:text-5xl' : 'text-2xl sm:text-4xl'} font-bold mb-2 sm:mb-3 text-gray-900 leading-tight`}>
            {popup.title}
          </h2>

          {/* Discount/Offer Text */}
          <p className={`${popup.popupType === 'full_screen' ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'} font-bold mb-2 text-gray-900`}>
            UPTO 81% OFF
          </p>

          {/* Description */}
          <p className={`text-gray-600 mb-4 sm:mb-6 leading-relaxed ${popup.popupType === 'full_screen' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'}`}>
            {popup.description}
          </p>

          {/* Features List */}
          <div className="space-y-2.5 sm:space-y-3 mb-4 sm:mb-6">
            <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="flex-1">Limited-time offer — ends 28th Dec</span>
            </div>
            <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="flex-1">Seedance Pro Fast</span>
              <span className="px-1.5 sm:px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full whitespace-nowrap">Unlimited</span>
            </div>
            <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="flex-1 min-w-0">ChatGPT 1.5, Nano Banana PRO, Flux.2</span>
              <span className="px-1.5 sm:px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full whitespace-nowrap">Unlimited</span>
              <button className="w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 text-xs flex-shrink-0">
                i
              </button>
            </div>
            <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="flex-1 min-w-0">ImagineArt 1.5, Nano Banana PRO, Flux.2</span>
              <span className="px-1.5 sm:px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full whitespace-nowrap">Unlimited</span>
              <button className="w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 text-xs flex-shrink-0">
                i
              </button>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleCTAClick}
            className={`w-full bg-gradient-to-r from-red-600 to-red-700 text-white ${popup.popupType === 'full_screen' ? 'py-4 sm:py-5 text-lg sm:text-xl' : 'py-3.5 sm:py-4 text-base sm:text-lg'} rounded-xl font-bold hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] relative overflow-hidden`}
          >
            <span className="relative z-10">{popup.ctaText}</span>
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/30"></div>
          </button>
        </div>
      </div>
    </div>
  );
}

