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

  // Default: center_modal or full_screen
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`bg-white ${popup.popupType === 'full_screen' ? 'w-full h-full rounded-none' : 'rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh]'} relative overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300`}>
        <button 
          onClick={handleClose} 
          className="absolute top-5 right-5 z-10 bg-gray-100 hover:bg-gray-200 rounded-full p-2.5 transition-colors shadow-md"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-gray-700" />
        </button>
        
        {popup.image && (
          <div className={`relative w-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 ${popup.popupType === 'full_screen' ? 'aspect-square max-h-[50vh]' : 'aspect-square'}`}>
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
        
        <div className={`p-8 flex-1 flex flex-col ${popup.popupType === 'full_screen' ? 'justify-center' : ''}`}>
          <h2 className={`${popup.popupType === 'full_screen' ? 'text-4xl' : 'text-3xl'} font-bold mb-4 text-gray-900`}>{popup.title}</h2>
          <p className={`text-gray-600 mb-6 flex-1 leading-relaxed ${popup.popupType === 'full_screen' ? 'text-xl' : 'text-lg'}`}>{popup.description}</p>
          <button
            onClick={handleCTAClick}
            className={`w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white ${popup.popupType === 'full_screen' ? 'py-5 text-xl' : 'py-4 text-lg'} rounded-xl font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]`}
          >
            {popup.ctaText}
          </button>
        </div>
      </div>
    </div>
  );
}

