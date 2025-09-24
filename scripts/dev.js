#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Live Polling System Development Environment...\n');

// Start backend
console.log('📡 Starting backend server...');
const backend = spawn('npm', ['start'], {
  cwd: path.join(__dirname, '../backend'),
  stdio: 'inherit',
  shell: true
});

// Start frontend
console.log('🎨 Starting frontend development server...');
const frontend = spawn('npm', ['start'], {
  cwd: path.join(__dirname, '../frontend'),
  stdio: 'inherit',
  shell: true
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development servers...');
  backend.kill();
  frontend.kill();
  process.exit(0);
});

backend.on('error', (err) => {
  console.error('❌ Backend error:', err);
});

frontend.on('error', (err) => {
  console.error('❌ Frontend error:', err);
});

console.log('✅ Development environment started!');
console.log('📡 Backend: http://localhost:3001');
console.log('🎨 Frontend: http://localhost:3000');
console.log('\nPress Ctrl+C to stop all servers');
