#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up Live Polling System...\n');

// Check if Node.js is installed
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Node.js version: ${nodeVersion}`);
} catch (error) {
  console.error('❌ Node.js is not installed. Please install Node.js 14+ from https://nodejs.org/');
  process.exit(1);
}

// Install root dependencies
console.log('📦 Installing root dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Root dependencies installed');
} catch (error) {
  console.error('❌ Failed to install root dependencies');
  process.exit(1);
}

// Install frontend dependencies
console.log('📦 Installing frontend dependencies...');
try {
  execSync('npm install', { 
    cwd: path.join(__dirname, '../frontend'),
    stdio: 'inherit' 
  });
  console.log('✅ Frontend dependencies installed');
} catch (error) {
  console.error('❌ Failed to install frontend dependencies');
  process.exit(1);
}

// Install backend dependencies
console.log('📦 Installing backend dependencies...');
try {
  execSync('npm install', { 
    cwd: path.join(__dirname, '../backend'),
    stdio: 'inherit' 
  });
  console.log('✅ Backend dependencies installed');
} catch (error) {
  console.error('❌ Failed to install backend dependencies');
  process.exit(1);
}

// Create .env files if they don't exist
const backendEnvPath = path.join(__dirname, '../backend/.env');
if (!fs.existsSync(backendEnvPath)) {
  console.log('📝 Creating backend .env file...');
  fs.writeFileSync(backendEnvPath, `PORT=3001
NODE_ENV=development
`);
  console.log('✅ Backend .env file created');
}

const frontendEnvPath = path.join(__dirname, '../frontend/.env');
if (!fs.existsSync(frontendEnvPath)) {
  console.log('📝 Creating frontend .env file...');
  fs.writeFileSync(frontendEnvPath, `REACT_APP_BACKEND_URL=http://localhost:3001
`);
  console.log('✅ Frontend .env file created');
}

console.log('\n🎉 Setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Start development servers: npm run dev');
console.log('2. Or start individually:');
console.log('   - Backend: npm run server');
console.log('   - Frontend: npm run client');
console.log('\n🌐 URLs:');
console.log('   - Frontend: http://localhost:3000');
console.log('   - Backend: http://localhost:3001');
console.log('\n📚 Read DEPLOYMENT.md for deployment instructions');
