const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

// Define allowed origins for CORS
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://intervue122.vercel.app",
  "https://intervue122.vercel.app/", // With trailing slash
  process.env.FRONTEND_ORIGIN
].filter(Boolean);

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// In-memory storage
let currentPoll = null;
let pollHistory = [];
let participants = [];
let chatMessages = [];
let pollSequence = 0;

// Helper function to check if teacher can ask new question
function canTeacherAskNewQuestion() {
  if (!currentPoll || !currentPoll.isActive) {
    return { canAsk: true, reason: 'No active poll' };
  }
  
  const students = participants.filter(p => !p.isTeacher);
  if (students.length === 0) {
    return { canAsk: true, reason: 'No students connected' };
  }
  
  const allStudentsAnswered = students.every(s => s.hasAnswered);
  if (allStudentsAnswered) {
    return { canAsk: true, reason: 'All students have answered' };
  }
  
  // Check if poll has expired (timer reached zero)
  if (currentPoll.startTime && currentPoll.timeLimitSec) {
    const elapsedTime = (Date.now() - currentPoll.startTime) / 1000;
    if (elapsedTime >= currentPoll.timeLimitSec) {
      return { canAsk: true, reason: 'Poll timer has expired' };
    }
  }
  
  const answeredCount = students.filter(s => s.hasAnswered).length;
  return { 
    canAsk: false, 
    reason: `Waiting for ${students.length - answeredCount} more students to answer`,
    answeredCount,
    totalStudents: students.length
  };
}

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Live Polling Backend is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Send initial state to newly connected user
  socket.emit('state:init', {
    currentPoll,
    pollHistory,
    participants,
    chatMessages,
    teacherCanAskNew: canTeacherAskNewQuestion()
  });

  // Handle user joining (teacher or student)
  socket.on('user:join', ({ name, isTeacher }) => {
    console.log(`User join event received: name=${name}, isTeacher=${isTeacher}, socketId=${socket.id}`);
    console.log(`Current participants before join:`, participants.map(p => ({ id: p.id, name: p.name, isTeacher: p.isTeacher })));
    
    // Check if user with same name already exists (reconnection)
    const existingUserIndex = participants.findIndex(p => p.name === name);
    
    if (existingUserIndex !== -1) {
      // Update existing user with new socket ID and role
      participants[existingUserIndex] = {
        id: socket.id,
        name,
        isTeacher,
        hasAnswered: false,
        joinedAt: new Date()
      };
      console.log(`User reconnected: ${name} (${isTeacher ? 'Teacher' : 'Student'}) with new socket ID: ${socket.id}`);
    } else {
      // Add new user
      const user = {
        id: socket.id,
        name,
        isTeacher,
        hasAnswered: false,
        joinedAt: new Date()
      };
      participants.push(user);
      console.log(`New user joined: ${name} (${isTeacher ? 'Teacher' : 'Student'}) with socket ID: ${socket.id}`);
    }
    
    socket.emit('user:joined', { name, isTeacher });
    io.emit('participants:update', participants);
    
    // Emit teacher validation status to all teachers
    const teacherValidation = canTeacherAskNewQuestion();
    io.emit('teacher:validation_update', teacherValidation);
    
    console.log('Current participants after join:', participants.map(p => ({ id: p.id, name: p.name, isTeacher: p.isTeacher })));
  });

  // Handle teacher creating a poll
  socket.on('teacher:create_poll', ({ question, options, timeLimitSec, correctOptionIds }) => {
    console.log(`Teacher create poll event received from socket: ${socket.id}`);
    console.log(`Current participants:`, participants.map(p => ({ id: p.id, name: p.name, isTeacher: p.isTeacher })));
    
    // Check if teacher can create a new poll
    const teacher = participants.find(p => p.id === socket.id);
    console.log(`Found teacher:`, teacher);
    
    if (!teacher || !teacher.isTeacher) {
      console.log(`Teacher validation failed: teacher=${teacher}, isTeacher=${teacher?.isTeacher}`);
      socket.emit('teacher:create_error', 'Only teachers can create polls.');
      return;
    }

    // Validation: Can only create new poll if no active poll OR all students have answered OR timer has expired
    if (currentPoll && currentPoll.isActive) {
      const students = participants.filter(p => !p.isTeacher);
      const allStudentsAnswered = students.length > 0 && students.every(s => s.hasAnswered);
      
      // Check if poll has expired (timer reached zero)
      const pollExpired = currentPoll.startTime && currentPoll.timeLimitSec && 
        ((Date.now() - currentPoll.startTime) / 1000) >= currentPoll.timeLimitSec;
      
      if (!allStudentsAnswered && !pollExpired) {
        socket.emit('teacher:create_error', 'Cannot create new poll. Current poll is active and not all students have answered yet.');
        return;
      }
    }

    // Form validation
    if (!question || question.trim() === '') {
      socket.emit('teacher:create_error', 'Question cannot be empty.');
      return;
    }
    
    if (!options || options.length < 2 || options.some(opt => opt.text.trim() === '')) {
      socket.emit('teacher:create_error', 'At least two non-empty options are required.');
      return;
    }
    
    if (correctOptionIds.length !== 1) {
      socket.emit('teacher:create_error', 'Exactly one correct answer must be selected.');
      return;
    }

    // Store previous poll in history if it exists
    if (currentPoll && currentPoll.isActive) {
      const previousPoll = {
        ...currentPoll,
        isActive: false,
        endTime: Date.now(),
        responses: currentPoll.responses // Keep full responses for history display
      };
      
      pollHistory.unshift(previousPoll);
      console.log(`Previous poll stored in history: ${previousPoll.question}`);
    }

    // Create new poll
    pollSequence++;
    currentPoll = {
      id: Date.now(),
      sequence: pollSequence,
      question,
      options: options.map((opt, index) => ({
        id: index + 1,
        text: opt.text,
        isCorrect: correctOptionIds.includes(index + 1)
      })),
      timeLimitSec: timeLimitSec || 60,
      startTime: Date.now(),
      responses: {},
      isActive: true
    };

    // Clear previous responses
    participants.forEach(p => {
      if (!p.isTeacher) {
        p.hasAnswered = false;
      }
    });

    io.emit('poll:started', currentPoll);
    io.emit('history:update', pollHistory); // Send updated history to all clients
    
    // Emit teacher validation status update
    const teacherValidation = canTeacherAskNewQuestion();
    io.emit('teacher:validation_update', teacherValidation);
    
    // Set up periodic check for timer expiration
    const timerCheckInterval = setInterval(() => {
      if (!currentPoll || !currentPoll.isActive) {
        clearInterval(timerCheckInterval);
        return;
      }
      
      const elapsedTime = (Date.now() - currentPoll.startTime) / 1000;
      if (elapsedTime >= currentPoll.timeLimitSec) {
        // Timer expired - update validation status
        const validation = canTeacherAskNewQuestion();
        io.emit('teacher:validation_update', validation);
        clearInterval(timerCheckInterval);
      }
    }, 1000); // Check every second
    
    console.log(`Poll created: ${question}`);
    console.log('Poll data:', {
      id: currentPoll.id,
      sequence: currentPoll.sequence,
      options: currentPoll.options,
      responses: currentPoll.responses
    });
  });

  // Handle teacher ending a poll
  socket.on('teacher:end_poll', () => {
    if (currentPoll) {
      currentPoll.isActive = false;
      currentPoll.endTime = Date.now();
      
      // Add to history
      pollHistory.unshift({
        ...currentPoll,
        responses: currentPoll.responses // Keep full responses for history display
      });
      
      io.emit('poll:ended', currentPoll);
      
      // Emit teacher validation status update
      const teacherValidation = canTeacherAskNewQuestion();
      io.emit('teacher:validation_update', teacherValidation);
      
      console.log('Poll ended');
    }
  });

  // Handle teacher clearing responses
  socket.on('teacher:clear_responses', () => {
    if (currentPoll) {
      currentPoll.responses = {};
      participants.forEach(p => {
        if (!p.isTeacher) {
          p.hasAnswered = false;
        }
      });
      io.emit('poll:cleared');
      console.log('Responses cleared');
    }
  });

  // Handle student answering
  socket.on('student:answer', ({ pollId, optionId }) => {
    console.log(`Student answer received: pollId=${pollId}, optionId=${optionId}, socketId=${socket.id}`);
    console.log('Socket connected:', socket.connected);
    console.log('Current participants count:', participants.length);
    
    if (!currentPoll) {
      console.log('No current poll');
      return;
    }
    
    if (!currentPoll.isActive) {
      console.log('Poll is not active');
      return;
    }
    
    if (currentPoll.id !== pollId) {
      console.log(`Poll ID mismatch: expected ${currentPoll.id}, got ${pollId}`);
      return;
    }
    
    const participant = participants.find(p => p.id === socket.id);
    if (!participant) {
      console.log('Participant not found for socket ID:', socket.id);
      console.log('Available participants:', participants.map(p => ({ id: p.id, name: p.name, isTeacher: p.isTeacher })));
      console.log('Total participants count:', participants.length);
      return;
    }
    
    if (participant.isTeacher) {
      console.log('Teacher cannot answer polls');
      return;
    }
    
    if (participant.hasAnswered) {
      console.log(`${participant.name} has already answered`);
      return;
    }
    
    // Store the response (ensure optionId is a number for consistency)
    currentPoll.responses[socket.id] = {
      optionId: parseInt(optionId),
      participantName: participant.name,
      timestamp: Date.now()
    };
    participant.hasAnswered = true;
    
    console.log(`Response stored: ${participant.name} answered option ${optionId} (type: ${typeof optionId})`);
    console.log(`Total responses: ${Object.keys(currentPoll.responses).length}`);
    console.log('Current poll responses:', currentPoll.responses);
    console.log('Current poll options:', currentPoll.options.map(opt => ({ id: opt.id, type: typeof opt.id, text: opt.text })));
    
    // Emit updates to all clients
    io.emit('poll:update', currentPoll);
    io.emit('participants:update', participants);
    
    // Emit teacher validation status update
    const teacherValidation = canTeacherAskNewQuestion();
    io.emit('teacher:validation_update', teacherValidation);
  });

  // Handle socket disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const participant = participants.find(p => p.id === socket.id);
    if (participant) {
      const wasStudent = !participant.isTeacher;
      const hadAnswered = participant.hasAnswered;
      
      participants = participants.filter(p => p.id !== socket.id);
      
      // Remove their responses if they were a student
      if (currentPoll && currentPoll.responses[socket.id]) {
        delete currentPoll.responses[socket.id];
      }
      
      io.emit('participants:update', participants);
      if (currentPoll) {
        io.emit('poll:update', currentPoll);
      }
      
      // Emit teacher validation status update
      const teacherValidation = canTeacherAskNewQuestion();
      io.emit('teacher:validation_update', teacherValidation);
      
      console.log(`Participant removed: ${participant.name} (Student: ${wasStudent}, Had Answered: ${hadAnswered})`);
    }
  });

  // Handle chat messages
  socket.on('chat:message', ({ message }) => {
    console.log('Chat message received from socket:', socket.id, 'Message:', message);
    const participant = participants.find(p => p.id === socket.id);
    if (participant) {
      const chatMessage = {
        id: Date.now(),
        senderId: socket.id,
        senderName: participant.name,
        message,
        timestamp: Date.now()
      };
      
      chatMessages.push(chatMessage);
      io.emit('chat:new', chatMessage);
      console.log(`Chat: ${participant.name}: ${message}`);
      console.log('Total chat messages:', chatMessages.length);
    } else {
      console.log('Chat message from unknown participant:', socket.id);
    }
  });

  // Handle teacher kicking a user
  socket.on('teacher:kick', ({ userId }) => {
    const teacher = participants.find(p => p.id === socket.id);
    if (teacher && teacher.isTeacher) {
      const userToKick = participants.find(p => p.id === userId);
      if (userToKick && !userToKick.isTeacher) {
        // Remove from participants
        participants = participants.filter(p => p.id !== userId);
        
        // Remove their responses
        if (currentPoll && currentPoll.responses[userId]) {
          delete currentPoll.responses[userId];
        }
        
        // Notify the kicked user
        io.to(userId).emit('user:kicked');
        
        // Update all participants
        io.emit('participants:update', participants);
        io.emit('poll:update', currentPoll);
        
        // Emit teacher validation status update
        const teacherValidation = canTeacherAskNewQuestion();
        io.emit('teacher:validation_update', teacherValidation);
        
        console.log(`User kicked: ${userToKick.name}`);
      }
    }
  });

});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
