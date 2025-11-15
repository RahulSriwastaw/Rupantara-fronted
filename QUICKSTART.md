# 🚀 Quick Start Guide - Rupantar AI Frontend

Get your Rupantar AI frontend up and running in minutes!

## Prerequisites

- Node.js 18 or higher
- npm or yarn package manager

## Installation

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 14
- React 18
- TailwindCSS
- Shadcn UI components
- Zustand for state management
- React Hook Form + Zod for forms
- And more...

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎯 First Time Setup

When you first open the app:

1. You'll see the **Welcome Screen**
2. Click "Get Started" to register or "Sign In" to login
3. Use these demo credentials or create a new account:
   - Email: `demo@rupantar.ai`
   - Password: `demo123`

## 📱 Navigating the App

### Bottom Navigation (5 Tabs)

1. **Template** - Browse 1000+ AI templates
2. **Wallet** - Manage your points and earnings
3. **Generate** (Center) - Create AI images
4. **History** - View your generations
5. **Pro** - Purchase points packages

### Quick Actions

- **Search Templates**: Use search bar at top of Template tab
- **Generate Image**: Upload photos → Add prompt → Generate
- **Check Balance**: Click points badge in top header
- **Edit Profile**: Click profile icon → Profile settings

## 💎 Understanding Points

- **Starting Balance**: 100 points (welcome bonus)
- **Generation Cost**: 20+ points (varies by quality)
- **Earning Points**:
  - Daily Login: +3 points
  - Watch Ads: +6 points (5/day max)
  - Referrals: +20 points each

## 🎨 Creating Your First Image

1. Go to **Generate** tab
2. Upload 1-5 photos
3. (Optional) Select a template from Template tab
4. Write your prompt or use suggestions
5. Adjust quality and settings
6. Click "Generate Image"
7. View result in History tab

## 🎭 Becoming a Creator

1. Go to **Profile** tab
2. Click "Become a Creator" card
3. Fill out application form
4. Submit demo templates
5. Wait for approval (simulated in this demo)
6. Access Creator Dashboard from Profile

## 📁 Project Structure

```
frontend/
├── app/                    # Next.js pages
│   ├── (auth)/            # Login, Register, Welcome
│   ├── (main)/            # Main app pages
│   └── (creator)/         # Creator dashboard
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   ├── layout/           # Navigation components
│   ├── template/         # Template components
│   ├── generate/         # Generation components
│   └── ...
├── store/                # Zustand stores
├── services/             # API services (mock)
├── types/                # TypeScript types
├── data/                 # Mock data
└── lib/                  # Utilities
```

## 🔧 Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Export static site
npm run export
```

## 🎨 Customization

### Colors

Edit `frontend/app/globals.css` to change the color scheme:

```css
:root {
  --primary: 262 83% 58%;  /* Purple */
  --secondary: 210 40% 96.1%;
  /* ... other colors */
}
```

### Logo

Replace logo in `components/layout/TopHeader.tsx`

### Mock Data

Edit files in `data/` folder to customize sample templates, transactions, etc.

## 📱 Mobile App (Capacitor)

### Build Mobile App

```bash
# Initialize Capacitor (first time only)
npm run export
npx cap init
npx cap add android
npx cap add ios

# Sync and open
npx cap sync
npx cap open android  # or ios
```

See `DEPLOYMENT.md` for detailed mobile build instructions.

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
npx kill-port 3000
# Or use different port
npm run dev -- -p 3001
```

### Module Not Found

```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

## 🎯 Testing Features

### Test User Flow
1. Register new account → Get 100 bonus points
2. Browse templates → Like and save favorites
3. Generate image → Use 20 points
4. Check wallet → View transaction
5. Apply to be creator → Fill form

### Test Creator Flow
1. Manually set `isCreator: true` in auth store (for demo)
2. Access creator dashboard from profile
3. View earnings and templates
4. Create new template (UI only)

## 📚 Learn More

- [Complete Feature List](FEATURES.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [Shadcn UI](https://ui.shadcn.com/)

## 💡 Tips

1. **Responsive Design**: Resize browser to see mobile/tablet views
2. **Mock Data**: All data is simulated - perfect for testing
3. **State Persistence**: Zustand stores persist in localStorage
4. **Easy Backend Integration**: Replace mock APIs in `services/mockApi.ts`

## 🤝 Support

For issues or questions:
- Check [FEATURES.md](FEATURES.md) for implemented features
- Review [DEPLOYMENT.md](DEPLOYMENT.md) for deployment help
- Open an issue in the repository

## 🎉 You're All Set!

The app is now running with:
- ✅ Complete UI/UX for all features
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Mock data for testing
- ✅ State management
- ✅ Form validation
- ✅ Animations and transitions
- ✅ Ready for backend integration

**Enjoy exploring Rupantar AI!** 🚀

