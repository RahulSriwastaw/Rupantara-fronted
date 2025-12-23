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

// Try to use sharp for proper resizing, fallback to copy if not available
let sharp;
try {
  sharp = require('sharp');
  console.log('✅ Using sharp for image resizing');
} catch (e) {
  console.log('⚠️  Sharp not found, installing...');
  console.log('   Run: npm install --save-dev sharp');
  console.log('   For now, copying logo at original size...');
}

async function generateIcons() {
  for (const [folder, size] of Object.entries(iconSizes)) {
    const targetFolder = path.join(androidResPath, folder);
    
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }
    
    try {
      if (sharp) {
        // Use sharp to resize logo to proper size
        const iconPath = path.join(targetFolder, 'ic_launcher.png');
        const roundIconPath = path.join(targetFolder, 'ic_launcher_round.png');
        const foregroundIconPath = path.join(targetFolder, 'ic_launcher_foreground.png');
        
        // Generate standard icon (square with transparent background)
        await sharp(sourceLogo)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
          })
          .toFile(iconPath);
        
        // Generate round icon (same as standard for now)
        await sharp(sourceLogo)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .toFile(roundIconPath);
        
        // Generate foreground icon (for adaptive icons)
        await sharp(sourceLogo)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .toFile(foregroundIconPath);
        
        console.log(`✅ Generated icons for ${folder} (${size}px)`);
      } else {
        // Fallback: copy logo at original size
        const iconPath = path.join(targetFolder, 'ic_launcher.png');
        const roundIconPath = path.join(targetFolder, 'ic_launcher_round.png');
        const foregroundIconPath = path.join(targetFolder, 'ic_launcher_foreground.png');
        
        fs.copyFileSync(sourceLogo, iconPath);
        fs.copyFileSync(sourceLogo, roundIconPath);
        fs.copyFileSync(sourceLogo, foregroundIconPath);
        
        console.log(`⚠️  Copied logo to ${folder} (original size - install sharp for proper resizing)`);
      }
    } catch (error) {
      console.error(`❌ Error generating icons for ${folder}:`, error.message);
    }
  }
  
  console.log('\n✅ Icon generation complete!');
  if (!sharp) {
    console.log('\n💡 Tip: Install sharp for proper icon resizing:');
    console.log('   npm install --save-dev sharp');
    console.log('   Then run this script again.');
  }
}

generateIcons().catch(console.error);

