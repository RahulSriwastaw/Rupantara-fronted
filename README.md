# Rupantar AI - Frontend

<div align="center">

![Rupantar AI](https://img.shields.io/badge/Rupantar-AI-8B5CF6?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC?style=for-the-badge&logo=tailwind-css)

**AI-powered photo transformation and generation platform**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Deployment](#-deployment)

</div>

---

## 🌟 Overview

Rupantar AI is a complete, production-ready frontend application for an AI-powered image generation platform. Built with modern web technologies, it offers a beautiful, responsive UI that works seamlessly on web and mobile devices.

### ✨ Highlights

- 🎨 **Beautiful UI/UX** - Modern gradient design with smooth animations
- 📱 **Fully Responsive** - Works perfectly on mobile, tablet, and desktop
- ⚡ **Lightning Fast** - Optimized with Next.js 14 and static export
- 🔧 **Type Safe** - Complete TypeScript coverage
- 🎯 **Production Ready** - AWS S3 + CloudFront compatible
- 📦 **Capacitor Ready** - Export as native iOS/Android apps

## 🎯 Features

### User App Features

#### 🔐 Authentication
- Registration with validation
- Email/Password login
- Social login UI (Google, Facebook)
- Forgot password flow

#### 📱 Main Tabs
1. **Template** - Browse 1000+ AI templates with search, filters
2. **Wallet** - Manage points, view transactions, earn rewards
3. **Generate** - Upload photos, use AI tools, create images
4. **History** - View generations, organize favorites
5. **Pro** - Purchase points packages

#### 🎨 Advanced Features
- Multi-photo upload with drag & drop
- AI tools (BG remove, enhance, upscale, colorize)
- Real-time prompt suggestions
- Quality selector (SD to 8K)
- Points system with earning methods
- Creator application workflow

### Creator Dashboard
- Template management
- Earnings tracking
- Analytics dashboard
- Withdrawal system

### Technical Features
- ✅ Next.js 14 with App Router
- ✅ Static export for AWS S3
- ✅ Shadcn UI components
- ✅ Zustand state management
- ✅ React Hook Form + Zod validation
- ✅ Mock APIs ready for backend
- ✅ Capacitor mobile support

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Credentials
```
Email: demo@rupantar.ai
Password: demo123
```

Or create a new account to get 100 welcome bonus points!

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 5 minutes
- **[FEATURES.md](FEATURES.md)** - Complete feature list
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment guides

## 🏗️ Tech Stack

### Core
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **Styling**: TailwindCSS 3
- **UI Components**: Shadcn UI

### State & Forms
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Date Handling**: date-fns

### Build & Deploy
- **Package Manager**: npm
- **Static Export**: Next.js export
- **Mobile**: Capacitor 6
- **Hosting**: AWS S3 + CloudFront ready

## 📁 Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   │   ├── welcome/       # Splash screen
│   │   ├── login/         # Login page
│   │   └── register/      # Registration
│   ├── (main)/            # Main app pages
│   │   ├── template/      # Template browser
│   │   ├── wallet/        # Points & transactions
│   │   ├── generate/      # Image generation
│   │   ├── history/       # Generation history
│   │   ├── pro/           # Points packages
│   │   └── profile/       # User profile
│   └── (creator)/         # Creator dashboard
│       ├── dashboard/     # Overview
│       ├── templates/     # Template management
│       └── earnings/      # Revenue tracking
├── components/            # React components
│   ├── ui/               # Shadcn UI base components
│   ├── layout/           # Layout components
│   ├── template/         # Template-specific
│   ├── generate/         # Generation-specific
│   └── ...
├── store/                # Zustand stores
│   ├── authStore.ts      # Authentication
│   ├── walletStore.ts    # Wallet & points
│   ├── generationStore.ts # Generations
│   └── templateStore.ts   # Templates
├── services/             # API services
│   └── mockApi.ts        # Mock API layer
├── types/                # TypeScript types
│   └── index.ts          # All type definitions
├── data/                 # Mock data
│   └── templates.json    # Sample templates
├── lib/                  # Utilities
│   └── utils.ts          # Helper functions
└── public/               # Static assets
    └── manifest.json     # PWA manifest
```

## 🎨 Customization

### Colors
Edit `app/globals.css`:
```css
:root {
  --primary: 262 83% 58%;  /* Purple gradient */
  --secondary: 210 40% 96.1%;
  /* ... customize all colors */
}
```

### Mock Data
Edit `data/templates.json` to add sample templates

### API Integration
Replace mock APIs in `services/mockApi.ts`:
```typescript
// Before (mock)
export const templatesApi = { /* mock implementation */ }

// After (real API)
import axios from 'axios';
export const templatesApi = {
  getAll: () => axios.get('/api/templates')
}
```

## 📱 Mobile App Build

### Android

```bash
npm run build
npx cap add android
npx cap sync
npx cap open android
```

### iOS

```bash
npm run build
npx cap add ios
npx cap sync
npx cap open ios
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## 🌐 Deployment

### AWS S3 + CloudFront

```bash
# Build
npm run build

# Deploy to S3
aws s3 sync out/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete guide.

## 🧪 Development

### Available Scripts

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm run export   # Export static site
```

### Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_RAZORPAY_KEY=your_key
NEXT_PUBLIC_STRIPE_KEY=your_key
```

## 📊 Features Implemented

- ✅ Complete UI/UX for all 15+ pages
- ✅ 50+ reusable components
- ✅ Full responsive design
- ✅ State management (4 stores)
- ✅ Form validation
- ✅ Mock API layer
- ✅ Loading states & animations
- ✅ Toast notifications
- ✅ Error handling
- ✅ TypeScript types
- ✅ Mobile-ready
- ✅ PWA manifest
- ✅ Static export
- ✅ Capacitor config

## 🤝 Backend Integration

This frontend is designed to work with any backend. Simply:

1. Replace mock APIs in `services/mockApi.ts`
2. Update environment variables
3. Handle authentication tokens
4. Connect to your API endpoints

All components are built to consume data from APIs, making integration straightforward.

## 🔒 Security Notes

- All passwords are validated (min 6 chars)
- XSS protection via React
- CSRF tokens ready to implement
- Environment variables for sensitive keys
- Input validation with Zod

## 🎯 Performance

- Code splitting by route
- Lazy loading images
- Optimized bundle size
- Static export for fast CDN delivery
- PWA capabilities

## 📈 What's Next?

### To Connect Backend:
1. Implement real API endpoints
2. Add authentication token handling
3. Connect to AI image generation service
4. Setup payment gateway integration
5. Implement file upload to cloud storage

### Additional Features (Optional):
- Real-time notifications (WebSocket)
- Advanced analytics (Google Analytics)
- Error monitoring (Sentry)
- Performance monitoring (Web Vitals)

## 🐛 Known Limitations

- Mock API data (no real backend)
- Simulated image generation
- Demo payment flow (no real transactions)
- No actual file uploads
- No email sending

All of these are frontend-only limitations and will work once connected to a real backend.

## 📝 License

Private - All Rights Reserved

## 🤝 Support

For issues or questions:
- Check [FEATURES.md](FEATURES.md)
- Review [DEPLOYMENT.md](DEPLOYMENT.md)
- Contact: support@rupantar.ai

---

<div align="center">

**Built with ❤️ using Next.js, React, and TailwindCSS**

Made in India 🇮🇳

</div>
