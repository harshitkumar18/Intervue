# Live Polling System

A real-time polling application built with React frontend and Express.js backend using Socket.io for live communication.

## 🚀 Features

### Teacher Features
- **Create Polls**: Create multiple choice questions with custom time limits
- **Live Results**: View real-time poll results and student responses
- **Smart Validation**: Ask new questions only when appropriate:
  - No active poll exists
  - All students have answered the current question
  - Poll timer has expired
  - No students are connected
- **Student Management**: View connected students and kick out users if needed
- **Poll History**: Access previous poll results and statistics

### Student Features
- **Join Sessions**: Enter name and join live polling sessions
- **Answer Questions**: Submit answers to multiple choice questions
- **Real-time Timer**: See accurate countdown timer synchronized with server
- **Live Results**: View poll results and see how responses compare
- **Persistent Names**: Names are saved per browser tab for convenience
- **Auto Results**: Automatically see results when timer expires

### Real-time Features
- **Live Updates**: All participants see updates instantly
- **Synchronized Timers**: Student and teacher timers stay in sync
- **Chat System**: Optional chat functionality for communication
- **Connection Management**: Automatic reconnection and state synchronization

## 🛠️ Technology Stack

### Frontend
- **React 18**: Modern React with hooks
- **Socket.io Client**: Real-time communication
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful icons
- **Local Storage**: Client-side persistence

### Backend
- **Express.js**: Web application framework
- **Socket.io**: Real-time bidirectional communication
- **CORS**: Cross-origin resource sharing
- **Node.js**: JavaScript runtime

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
npm start
```

The backend server will run on `http://localhost:3001`

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

The frontend will run on `http://localhost:3000`

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)
1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Deploy the `build` folder to your hosting service

### Backend Deployment (Railway/Heroku/Render)
1. Set environment variables:
```env
PORT=3001
NODE_ENV=production
```

2. Deploy the backend directory

### Environment Variables for Production
Create a `.env` file in the backend directory:
```env
PORT=3001
NODE_ENV=production
```

## 🎯 Usage

### For Teachers
1. **Start the Application**: Open the app in your browser
2. **Select Teacher Role**: Choose "I'm a Teacher" on the welcome screen
3. **Enter Name**: Provide your name (saved per browser tab)
4. **Create Poll**: 
   - Enter your question
   - Add multiple choice options (minimum 3, can add more)
   - Set time limit (10-60 seconds)
   - Mark correct answers (optional)
   - Click "Ask Question"
5. **Monitor Results**: View live responses and results
6. **Manage Students**: See connected students and kick if needed
7. **Ask Next Question**: Create new polls when conditions are met

### For Students
1. **Join Session**: Open the app in your browser
2. **Select Student Role**: Choose "I'm a Student" on the welcome screen
3. **Enter Name**: Provide your name (saved per browser tab)
4. **Wait for Question**: Wait for teacher to start a poll
5. **Answer Question**: Select your answer and click "Submit"
6. **View Results**: See poll results and wait for next question

## 🔧 Configuration

### Customization
- **Timer Limits**: Modify timer range in `PollCreator.jsx`
- **Maximum Options**: Change option limits in validation logic
- **UI Colors**: Update color scheme in component styles
- **Server Port**: Change port in `backend/server.js`

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 🚨 Important Notes

### Teacher Validation Rules
Teachers can only ask new questions when:
- No active poll exists
- All connected students have answered
- The current poll timer has expired
- No students are connected

### Student Experience
- Names are unique per browser tab
- Timer shows actual remaining time (not original limit)
- Results appear automatically when timer expires
- No forced answer submission

### Real-time Synchronization
- All timers are synchronized with server time
- Late-joining students see correct remaining time
- State is maintained across reconnections

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**
```bash
cd backend
npm install
npm start
```

**Frontend connection issues:**
- Ensure backend is running on port 3001
- Check browser console for errors
- Verify Socket.io connection

**Timer not syncing:**
- Refresh the page
- Check network connection
- Verify server is running

**Students can't join:**
- Check if teacher has started a session
- Verify student name is entered
- Check browser compatibility

## 📄 API Endpoints

### Socket.io Events

#### Client to Server
- `user:join` - Join session as teacher/student
- `teacher:create_poll` - Create new poll
- `student:answer` - Submit answer
- `teacher:kick` - Kick student
- `chat:send` - Send chat message

#### Server to Client
- `state:init` - Initialize client state
- `poll:started` - New poll started
- `poll:update` - Poll results updated
- `poll:ended` - Poll ended
- `participants:update` - Participant list updated
- `teacher:validation_update` - Teacher can ask new question status
- `chat:new` - New chat message

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Ensure all dependencies are installed
4. Verify server and client are running

---

**Happy Polling!** 🎉
