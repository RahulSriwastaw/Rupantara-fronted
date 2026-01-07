# Deployment Guide - Rupantar AI Frontend

This guide covers deploying the Rupantar AI frontend to AWS S3 + CloudFront and building mobile apps with Capacitor.

## Prerequisites

- Node.js 18+ installed
- AWS Account with S3 and CloudFront access
- Xcode (for iOS) or Android Studio (for Android)

## Web Deployment (AWS S3 + CloudFront)

### 1. Build the Project

```bash
cd frontend
npm install
npm run build
```

This creates a static export in the `out/` directory.

### 2. Create S3 Bucket

```bash
# Create bucket
aws s3 mb s3://rupantar-ai-frontend

# Enable static website hosting
aws s3 website s3://rupantar-ai-frontend --index-document index.html --error-document 404.html
```

### 3. Upload to S3

```bash
# Sync the out directory to S3
aws s3 sync out/ s3://rupantar-ai-frontend --delete

# Set public read permissions
aws s3 cp s3://rupantar-ai-frontend s3://rupantar-ai-frontend --recursive --acl public-read
```

### 4. Create CloudFront Distribution

1. Go to AWS CloudFront console
2. Create new distribution
3. Set origin domain to your S3 bucket
4. Enable "Redirect HTTP to HTTPS"
5. Set default root object to `index.html`
6. Create custom error response: 404 → /404.html
7. Deploy distribution

### 5. Configure Custom Domain (Optional)

1. Add CNAME record in your DNS provider
2. Request SSL certificate in AWS Certificate Manager
3. Attach certificate to CloudFront distribution

## Mobile App Deployment (Capacitor)

### 1. Build for Mobile

```bash
cd frontend
npm run build
```

### 2. Initialize Capacitor (First Time)

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli

# Initialize
npx cap init

# Add platforms
npx cap add android
npx cap add ios
```

### 3. Sync Assets

```bash
npx cap sync
```

### 4. Build Android App

```bash
# Open in Android Studio
npx cap open android

# In Android Studio:
# 1. Wait for Gradle sync
# 2. Build → Generate Signed Bundle/APK
# 3. Select "Android App Bundle" (for Play Store) or "APK"
# 4. Follow the signing wizard
```

### 5. Build iOS App

```bash
# Open in Xcode
npx cap open ios

# In Xcode:
# 1. Select your development team
# 2. Update bundle identifier
# 3. Product → Archive
# 4. Upload to App Store Connect
```

## Environment Variables

Create `.env.production` for production builds:

```env
NEXT_PUBLIC_API_URL=https://api.rupantar.ai
NEXT_PUBLIC_RAZORPAY_KEY=rzp_live_xxxxx
NEXT_PUBLIC_STRIPE_KEY=pk_live_xxxxx
NEXT_PUBLIC_APP_URL=https://rupantar.ai
```

## CI/CD (GitHub Actions Example)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd frontend && npm ci
      
      - name: Build
        run: cd frontend && npm run build
      
      - name: Deploy to S3
        uses: jakejarvis/s3-sync-action@master
        with:
          args: --delete
        env:
          AWS_S3_BUCKET: ${{ secrets.AWS_S3_BUCKET }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          SOURCE_DIR: 'frontend/out'
      
      - name: Invalidate CloudFront
        uses: chetan/invalidate-cloudfront-action@master
        env:
          DISTRIBUTION: ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }}
          PATHS: '/*'
          AWS_REGION: 'us-east-1'
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## Performance Optimization

### 1. Enable Gzip/Brotli Compression

In CloudFront, enable automatic compression in behavior settings.

### 2. Set Cache Headers

Configure S3 bucket to set proper cache headers:

```bash
aws s3 cp s3://rupantar-ai-frontend s3://rupantar-ai-frontend \
  --recursive \
  --metadata-directive REPLACE \
  --cache-control "public, max-age=31536000"
```

### 3. Image Optimization

Images are already optimized by Next.js Image component. Ensure you're using the `unoptimized: true` flag in production.

## Monitoring

- **CloudWatch**: Monitor CloudFront metrics
- **Real User Monitoring**: Consider adding Sentry or LogRocket
- **Uptime Monitoring**: Use services like UptimeRobot

## Troubleshooting

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next out node_modules
npm install
npm run build
```

### Capacitor Issues

```bash
# Reset Capacitor
npx cap sync
npx cap update
```

### S3 Permission Issues

Ensure your S3 bucket policy allows public read:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::rupantar-ai-frontend/*"
    }
  ]
}
```

## Support

For deployment issues, contact: support@rupantar.ai

