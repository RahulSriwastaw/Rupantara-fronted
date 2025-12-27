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
      <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4 max-w-sm animate-in slide-in-from-bottom">
        <button onClick={handleClose} className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-white rounded-full p-1">
          <X className="h-4 w-4" />
        </button>
        {popup.image && (
          <div className="relative w-full rounded-lg overflow-hidden mb-3 flex items-center justify-center bg-gray-50">
            <img
              src={popup.image}
              alt={popup.title}
              className="w-full h-auto max-h-[300px] object-contain"
            />
          </div>
        )}
        <h3 className="font-bold mb-1 text-gray-900">{popup.title}</h3>
        <p className="text-sm text-gray-600 mb-2">{popup.description}</p>
        <button
          onClick={handleCTAClick}
          className="w-full bg-indigo-600 text-white py-1.5 rounded text-sm hover:bg-indigo-700"
        >
          {popup.ctaText}
        </button>
      </div>
    );
  }

  if (popup.popupType === 'bottom_sheet') {
    return (
      <div className="fixed inset-0 z-50 flex items-end bg-black/50">
        <div className="bg-white rounded-t-lg p-6 w-full max-w-md mx-auto animate-in slide-in-from-bottom max-h-[90vh] overflow-y-auto">
          <button onClick={handleClose} className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white rounded-full p-1">
            <X className="h-5 w-5" />
          </button>
          {popup.image && (
            <div className="relative w-full rounded-lg overflow-hidden mb-4 flex items-center justify-center bg-gray-50 min-h-[200px]">
              <img
                src={popup.image}
                alt={popup.title}
                className="w-full h-auto max-h-[400px] object-contain"
              />
            </div>
          )}
          <h2 className="text-2xl font-bold mb-2 text-gray-900">{popup.title}</h2>
          <p className="text-gray-600 mb-4">{popup.description}</p>
          <button
            onClick={handleCTAClick}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
          >
            {popup.ctaText}
          </button>
        </div>
      </div>
    );
  }

  // Default: center_modal or full_screen
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`bg-white rounded-lg ${popup.popupType === 'full_screen' ? 'w-full h-full rounded-none' : 'max-w-lg w-full mx-4 max-h-[90vh]'} relative overflow-hidden flex flex-col`}>
        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white rounded-full p-1.5 shadow-md"
        >
          <X className="h-5 w-5 text-gray-700" />
        </button>
        
        {popup.image && (
          <div className={`relative w-full overflow-hidden flex items-center justify-center bg-gray-50 ${popup.popupType === 'full_screen' ? 'h-1/2' : 'min-h-[250px]'}`}>
            <img
              src={popup.image}
              alt={popup.title}
              className={`w-full h-auto object-contain ${popup.popupType === 'full_screen' ? 'max-h-full' : 'max-h-[500px]'}`}
            />
          </div>
        )}
        
        <div className="p-6 flex-1 flex flex-col">
          <h2 className="text-2xl font-bold mb-2 text-gray-900">{popup.title}</h2>
          <p className="text-gray-600 mb-4 flex-1">{popup.description}</p>
          <button
            onClick={handleCTAClick}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-medium text-base"
          >
            {popup.ctaText}
          </button>
        </div>
      </div>
    </div>
  );
}

