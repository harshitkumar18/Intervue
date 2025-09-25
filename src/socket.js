import { io } from 'socket.io-client';
import { BACKEND_URL } from './api/config.js';

console.log('Connecting to backend URL:', BACKEND_URL);
const socket = io(BACKEND_URL);

socket.on('connect', () => {
  console.log('Socket connected to:', BACKEND_URL, 'with ID:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

export default socket;