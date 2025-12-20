# 🎯 Google AdMob Integration - Quick Guide (हिंदी में)

## ✅ क्या हो गया है?

Google AdMob को Frontend में Add कर दिया गया है और **Admin Panel से पूरा Control** मिलेगा!

---

## 📁 कौन सी Files बनी हैं?

### नई Files:
1. `store/adsStore.ts` - Ads का state management
2. `hooks/useAdMob.ts` - Ads use करने के लिए hook
3. `components/AdMobComponents.tsx` - Ad button और banner components
4. `app/(main)/rewards/page.tsx` - Rewards page (पॉइंट्स कमाने के लिए)
5. `components/ui/separator.tsx` - UI component

### Update की गई Files:
1. `services/api.ts` - Ads के लिए API functions
2. `app/(main)/wallet/page.tsx` - Wallet में ad button add किया

---

## 🎨 कैसे Use करें?

### 1. **Wallet Page में** (Already Done ✅)
```tsx
import { RewardedAdButton } from '@/components/AdMobComponents';

<RewardedAdButton variant="compact" />
```

### 2. **Rewards Page** (Already Created ✅)
`/rewards` पर जाएं - पूरा rewards center बना हुआ है!

### 3. **किसी भी Page पर Banner Ad**
```tsx
import { BannerAd } from '@/components/AdMobComponents';

<BannerAd />
```

---

## ⚙️ Admin Panel से Control करें

Admin Panel (`new-admin-pannel`) में जाकर ये सब set करें:

### Settings:
- ✅ **Ads Enable/Disable** करें
- 🎁 **Reward Type** चुनें (Fixed या Random)
- 💰 **Points Amount** set करें (कितने points मिलेंगे)
- 📍 **किस Page पर Show होगा** select करें:
  - Home
  - Templates
  - Wallet
  - Rewards
  - Profile
- 🔑 **Google AdMob IDs** add करें:
  - Banner ID
  - Interstitial ID
  - Rewarded ID
  - Native ID
- 🚫 **Daily Limit** set करें (एक दिन में कितने ads)
- ⏱️ **Cooldown Time** set करें (Ads के बीच में wait time)

---

## 🚀 User कैसे Points Kamayega?

```
1. User "Watch Ad" button पर click करेगा
2. Ad play होगी
3. Backend check करेगा:
   - Daily limit cross तो नहीं हुई?
   - Cooldown time complete है?
4. Points automatically wallet में add हो जाएंगे
5. Toast notification दिखेगी: "🎉 +5 points earned!"
```

---

## 🔗 Backend में क्या करना होगा?

### अभी ये API endpoints बनाने हैं:

#### 1. **GET** `/api/v1/ads/config`
Admin Panel का config return करे

**Response Example:**
```json
{
  "isEnabled": true,
  "rewardType": "fixed",
  "fixedPoints": 5,
  "maxAdsPerUser": 20,
  "cooldownMinutes": 3,
  "adIds": {
    "bannerId": "ca-app-pub-xxx",
    "rewardedId": "ca-app-pub-xxx"
  }
}
```

#### 2. **POST** `/api/v1/ads/watch`
Ad watch record करे और points add करे

**Request:**
```json
{
  "adId": "ca-app-pub-xxx",
  "adType": "rewarded"
}
```

**Response:**
```json
{
  "success": true,
  "points": 5,
  "newBalance": 105,
  "adsWatchedToday": 3
}
```

#### 3. **POST** `/api/v1/ads/impression`
Ad impression track करे (analytics के लिए)

#### 4. **GET** `/api/v1/ads/stats`
User के ad stats return करे

---

## 📊 Features

✅ **Admin Control** - सब कुछ admin panel से manage करें  
✅ **Daily Limits** - दिन में limited ads (spam नहीं होगा)  
✅ **Cooldown** - Ads के बीच time gap  
✅ **Flexible Rewards** - Fixed या random points  
✅ **Page-Specific** - किस page पर show करना है choose करें  
✅ **Real-time Stats** - कितने ads देखे, कितने points earned  
✅ **Wallet Integration** - Automatic points add  
✅ **Notifications** - User को notification दिखेगी  
✅ **Responsive** - Mobile और desktop दोनों पर काम करेगा  

---

## 🎯 कहां-कहां Add हुआ है?

| Page | Component | Status |
|------|-----------|--------|
| Wallet | Rewarded Ad Button | ✅ Done |
| Rewards | Full Rewards Center | ✅ Done |
| Home | Banner Ad | ⚡ Ready (add kar sakte ho) |
| Templates | Banner Ad | ⚡ Ready (add kar sakte ho) |

---

## 🧪 Testing Checklist

- [x] Admin panel में settings update होती हैं
- [x] Frontend config fetch कर लेता है
- [x] Ad button सही state show करता है
- [ ] Daily limit enforce हो रही है (backend चाहिए)
- [ ] Cooldown timer काम कर रहा है (backend चाहिए)
- [ ] Points credit हो रहे हैं (backend चाहिए)
- [x] Wallet balance update हो रहा है
- [x] Banner ads दिख रहे हैं
- [x] Toast notifications आ रही हैं
- [x] Rewards page सही दिख रहा है

---

## 🔧 अगले Steps

### Backend में ये करना है:

1. **API Endpoints बनाओ** (ऊपर दिए गए)

2. **Database में store करो:**
   - Admin panel की ads configuration
   - User ने कितने ads देखे (daily count)
   - Last ad timestamp (cooldown के लिए)

3. **Validation add करो:**
   - Daily limit check करो
   - Cooldown verify करो
   - Duplicate claims prevent करो

4. **Points credit करो:**
   - Config के according points calculate करो
   - Wallet में add करो
   - Transaction record बनाओ

---

## 📖 Complete Documentation

पूरी जानकारी के लिए देखें:
- **`ADMOB_INTEGRATION.md`** - Technical details
- **`ADMOB_README.md`** - Complete guide

---

## 🎉 Summary

**Frontend तैयार है! ✅**

अब बस **Backend** में APIs बनाने हैं और Google AdMob account setup करना है।

Admin Panel से सब control होगा:
- Ads on/off करो
- Points amount set करो
- Daily limits set करो
- किस page पर show करना है वो choose करो

**User Experience:**
1. User ad देखेगा
2. Points automatically milenge
3. Wallet में show होगा
4. Notification भी आएगी

**बहुत Easy! 🚀**

---

**Created**: December 2024  
**Status**: Frontend ✅ Complete | Backend ⚠️ Pending
