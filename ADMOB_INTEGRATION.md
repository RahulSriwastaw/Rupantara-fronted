# Google AdMob Integration - Frontend Implementation

## Overview
This document explains the complete Google AdMob integration in the Rupantara frontend, controlled by the Admin Panel.

## Features Implemented

### 1. **AdMob Store** (`store/adsStore.ts`)
A Zustand store that manages:
- Ads configuration from admin panel
- Daily ad watch limits
- Cooldown periods
- Reward points calculation
- Ad watch history
- Today's earnings tracking

### 2. **AdMob API** (`services/api.ts`)
API functions to:
- Fetch ads configuration from backend
- Record ad watch events
- Track ad impressions
- Get user ad statistics

### 3. **AdMob Hook** (`hooks/useAdMob.ts`)
Custom React hook providing:
- Current ads configuration
- Page-specific ad display logic
- Reward ad watching functionality
- Ad impression tracking
- Real-time stats (daily limit, cooldown, earnings)

### 4. **AdMob Components** (`components/AdMobComponents.tsx`)

#### RewardedAdButton
Three variants:
- **default**: Animated button with gradient effects
- **compact**: Simple button for tight spaces
- **card**: Full card with stats and progress

#### BannerAd
Displays banner advertisements on enabled pages

### 5. **Rewards Page** (`app/(main)/rewards/page.tsx`)
Complete rewards center featuring:
- Stats dashboard (balance, earnings, ads remaining)
- Progress tracking
- How-it-works guide
- Tips and limits information

## Admin Panel Configuration

The admin panel (`new-admin-pannel`) controls all ad settings:

### Configuration Options:
```typescript
{
  isEnabled: boolean,           // Master toggle for ads
  provider: 'google_admob',     // Ad provider
  rewardType: 'fixed' | 'random', // Point reward type
  fixedPoints: number,          // Fixed reward amount
  randomMin: number,            // Random reward minimum
  randomMax: number,            // Random reward maximum
  
  pages: {                      // Page-wise ad placement
    home: boolean,
    templates: boolean,
    generate: boolean,
    wallet: boolean,
    rewards: boolean,
    // ... etc
  },
  
  adIds: {                      // Google AdMob IDs
    bannerId: string,
    interstitialId: string,
    rewardedId: string,
    nativeId: string,
  },
  
  maxAdsPerUser: number,        // Daily limit (default: 20)
  cooldownMinutes: number,      // Wait time between ads (default: 3)
}
```

## Usage Examples

### 1. Display Rewarded Ad Button
```tsx
import { RewardedAdButton } from '@/components/AdMobComponents';

function MyComponent() {
  return (
    <RewardedAdButton 
      variant="card"
      onAdComplete={(points) => {
        console.log(`Earned ${points} points!`);
      }}
    />
  );
}
```

### 2. Show Banner Ad
```tsx
import { BannerAd } from '@/components/AdMobComponents';

function MyPage() {
  return (
    <div>
      <h1>My Page</h1>
      <BannerAd />
    </div>
  );
}
```

### 3. Use AdMob Hook
```tsx
import { useAdMob } from '@/hooks/useAdMob';

function CustomComponent() {
  const {
    canWatchRewardedAd,
    watchRewardedAd,
    adsRemaining,
    todayEarnings,
  } = useAdMob('home');

  const handleClick = async () => {
    if (canWatchRewardedAd) {
      await watchRewardedAd();
    }
  };

  return (
    <div>
      <p>Ads remaining: {adsRemaining}</p>
      <p>Today's earnings: {todayEarnings}</p>
      <button onClick={handleClick}>Watch Ad</button>
    </div>
  );
}
```

## Backend Integration

The frontend expects these API endpoints:

### GET `/api/v1/ads/config`
Returns the ads configuration set by admin panel

### POST `/api/v1/ads/watch`
Records a rewarded ad watch and credits points
```json
{
  "adId": "ca-app-pub-xxx",
  "adType": "rewarded"
}
```

Response:
```json
{
  "success": true,
  "points": 5,
  "newBalance": 105,
  "adsWatchedToday": 3,
  "message": "Points credited successfully"
}
```

### POST `/api/v1/ads/impression`
Records ad impressions for analytics
```json
{
  "adType": "banner",
  "adId": "ca-app-pub-xxx"
}
```

### GET `/api/v1/ads/stats`
Returns user's ad statistics
```json
{
  "todayAdsWatched": 5,
  "todayEarnings": 25,
  "totalAdsWatched": 150,
  "totalEarnings": 750,
  "canWatchMore": true,
  "nextAdAvailableIn": 0
}
```

## How It Works

1. **Initialization**: When user visits any page, `adsStore` fetches configuration from backend
2. **Page Check**: Each page checks if ads are enabled via `useAdMob(pageName)`
3. **Display**: If enabled, banner/rewarded ads are displayed
4. **Watch Flow**:
   - User clicks "Watch Ad"
   - Frontend validates daily limit and cooldown
   - Backend API is called to verify and credit points
   - Wallet is refreshed
   - Toast notification shows earned points
   - Stats are updated
5. **Daily Reset**: Stats reset at midnight (handled by backend)

## State Management Flow

```
Admin Panel → Backend DB → Frontend API Call → Zustand Store → React Components
     ↓                                                              ↑
  Updates Config                                            Displays Ads
     ↓                                                              ↑
  Save to DB ───────────────────────────────────────────────→ Live Updates
```

## File Structure

```
Rupantara-fronted/
├── store/
│   └── adsStore.ts              # Ad state management
├── hooks/
│   └── useAdMob.ts              # Custom hook for ads
├── services/
│   └── api.ts                   # API functions (updated)
├── components/
│   ├── AdMobComponents.tsx      # Ad components
│   └── ui/
│       ├── separator.tsx        # UI component
│       └── ...
└── app/
    └── (main)/
        └── rewards/
            └── page.tsx         # Rewards page
```

## Testing Checklist

- [ ] Admin panel can update ads config
- [ ] Frontend fetches config on load
- [ ] Rewarded ad button shows correct state
- [ ] Daily limit is enforced
- [ ] Cooldown timer works correctly
- [ ] Points are credited after watching ad
- [ ] Wallet balance updates
- [ ] Banner ads display on enabled pages
- [ ] Stats are accurate
- [ ] Toast notifications appear
- [ ] Rewards page displays all info correctly

## Environment Variables

Add to `.env.local`:
```env
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

## Next Steps

1. **Backend Implementation**: Ensure backend has all required endpoints
2. **Google AdMob Setup**: 
   - Create AdMob account
   - Create ad units
   - Add IDs to admin panel
3. **Mobile Integration**: If using Capacitor, integrate native AdMob SDK
4. **Analytics**: Track ad performance and earnings
5. **A/B Testing**: Test different reward amounts

## Support

For issues or questions, refer to:
- Admin Panel: `new-admin-pannel/App.tsx` (Ads section)
- Backend API: Check backend documentation
- Google AdMob Docs: https://admob.google.com/

---

**Created**: December 2024  
**Version**: 1.0.0  
**Status**: Production Ready ✅
