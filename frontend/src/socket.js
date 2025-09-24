import { io } from 'socket.io-client';
import { BACKEND_URL } from './api/config.js';

const socket = io(BACKEND_URL);

export default socket;