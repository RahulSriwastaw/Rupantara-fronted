# Frontend Environment Variables Update

After deploying the new backend to Railway, update the following environment variables in Vercel:

## Update in Vercel Dashboard

Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

### Update These Variables:

```
NEXT_PUBLIC_BACKEND_URL=https://your-new-railway-backend-url.up.railway.app
NEXT_PUBLIC_API_URL=https://your-new-railway-backend-url.up.railway.app/api
```

### Keep Existing Firebase Variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBl6NLfJ_PKmbL0nrbuPeHg3gsCvZeLAvw
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=rupantra-ai.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=rupantra-ai
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=rupantra-ai.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=717770940130
NEXT_PUBLIC_FIREBASE_APP_ID=1:717770940130:web:e918e9e148560f10c3c8bb
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ZBL177LFYH
```

## After Updating

1. Redeploy the frontend in Vercel
2. Test that API calls work correctly
3. Verify authentication flow

