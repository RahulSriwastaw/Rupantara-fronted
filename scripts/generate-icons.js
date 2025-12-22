const fs = require('fs');
const path = require('path');

// Icon sizes for different densities
const iconSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

const sourceLogo = path.join(__dirname, '../public/logo.png');
const androidResPath = path.join(__dirname, '../android/app/src/main/res');

// Check if logo exists
if (!fs.existsSync(sourceLogo)) {
  console.error('❌ Logo file not found at:', sourceLogo);
  process.exit(1);
}

console.log('📱 Generating Android app icons...');
console.log('Source logo:', sourceLogo);

// For now, we'll copy the logo to all mipmap folders
// Note: In production, you should use ImageMagick or sharp to resize
// But for now, we'll copy and let Android Studio handle resizing

Object.entries(iconSizes).forEach(([folder, size]) => {
  const targetFolder = path.join(androidResPath, folder);
  
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }
  
  // Copy logo as ic_launcher.png
  const targetFile = path.join(targetFolder, 'ic_launcher.png');
  fs.copyFileSync(sourceLogo, targetFile);
  
  // Copy as ic_launcher_round.png (same for now)
  const targetRoundFile = path.join(targetFolder, 'ic_launcher_round.png');
  fs.copyFileSync(sourceLogo, targetRoundFile);
  
  // Copy as ic_launcher_foreground.png
  const targetForegroundFile = path.join(targetFolder, 'ic_launcher_foreground.png');
  fs.copyFileSync(sourceLogo, targetForegroundFile);
  
  console.log(`✅ Generated icons for ${folder} (${size}px)`);
});

console.log('\n✅ All icons generated!');
console.log('⚠️  Note: Icons are copied at original size.');
console.log('   For proper scaling, use Android Studio Image Asset Studio:');
console.log('   Right-click res folder → New → Image Asset');

