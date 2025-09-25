const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing local build...');

try {
  // Change to frontend directory
  process.chdir('frontend');
  
  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Build the project
  console.log('🔨 Building project...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Check if dist directory exists
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    console.log('✅ Build successful!');
    console.log('📁 Contents of dist directory:');
    const files = fs.readdirSync(distPath, { recursive: true });
    files.forEach(file => console.log(`  - ${file}`));
  } else {
    console.log('❌ Build failed - dist directory not found');
  }
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
