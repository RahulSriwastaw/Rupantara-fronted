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
        <button onClick={handleClose} className="absolute top-2 right-2">
          <X className="h-4 w-4" />
        </button>
        {popup.image && (
          <img src={popup.image} alt={popup.title} className="w-full h-32 object-cover rounded mb-2" />
        )}
        <h3 className="font-bold mb-1">{popup.title}</h3>
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
        <div className="bg-white rounded-t-lg p-6 w-full max-w-md mx-auto animate-in slide-in-from-bottom">
          <button onClick={handleClose} className="absolute top-4 right-4">
            <X className="h-5 w-5" />
          </button>
          {popup.image && (
            <img src={popup.image} alt={popup.title} className="w-full h-48 object-cover rounded mb-4" />
          )}
          <h2 className="text-2xl font-bold mb-2">{popup.title}</h2>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`bg-white rounded-lg p-6 ${popup.popupType === 'full_screen' ? 'w-full h-full rounded-none' : 'max-w-md w-full mx-4'} relative`}>
        <button onClick={handleClose} className="absolute top-4 right-4">
          <X className="h-5 w-5" />
        </button>
        {popup.image && (
          <img src={popup.image} alt={popup.title} className="w-full h-48 object-cover rounded mb-4" />
        )}
        <h2 className="text-2xl font-bold mb-2">{popup.title}</h2>
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

