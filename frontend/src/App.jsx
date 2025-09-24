import { useState, useEffect, useCallback } from 'react';
import socket from './socket';
import PollCreator from './components/PollCreator';
import TeacherResults from './components/TeacherResults';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Loader2 } from 'lucide-react';
import './styles/_global.scss';

const SCREENS = {
  welcome: 'welcome',
  getStarted: 'getStarted',
  waiting: 'waiting',
  question: 'question',
  results: 'results',
  history: 'history',
  kicked: 'kicked',
  teacher: 'teacher'
};

function App() {
  const [tabId] = useState(() => {
    // Generate unique tab ID if not exists
    let tabId = localStorage.getItem('polling_tab_id');
    if (!tabId) {
      tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('polling_tab_id', tabId);
    }
    return tabId;
  });
  
  const [screen, setScreen] = useState(SCREENS.welcome);
  const [name, setName] = useState(() => {
    // Check if name exists for this tab
    const savedName = localStorage.getItem(`polling_name_${tabId}`);
    return savedName || '';
  });
  const [isTeacher, setIsTeacher] = useState(false);
  const [currentPoll, setCurrentPoll] = useState(null);
  const [history, setHistory] = useState([]);
  const [answering, setAnswering] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [teacherView, setTeacherView] = useState('create');
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [chatMessages, setChatMessages] = useState([]);
  const [currentChatMessage, setCurrentChatMessage] = useState('');
  const [participants, setParticipants] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [teacherCanAskNew, setTeacherCanAskNew] = useState({ canAsk: true, reason: 'No active poll' });

  // Initialize socket listeners
  useEffect(() => {
    // Handle socket connection
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      // If user has a name and role, rejoin automatically
      if (name && (isTeacher !== null)) {
        console.log('Rejoining session:', { name, isTeacher, socketId: socket.id });
        socket.emit('user:join', { name: name.trim(), isTeacher });
      }
    });

    socket.on('user:joined', (user) => {
      console.log('User successfully joined:', user);
      setHasJoined(true);
      
      // Navigate to appropriate screen after joining
      if (currentPoll && currentPoll.isActive) {
        if (isTeacher) {
          setScreen(SCREENS.teacher);
          setTeacherView('results');
        } else {
          setScreen(SCREENS.question);
        }
      } else if (isTeacher) {
        setScreen(SCREENS.teacher);
        setTeacherView('create');
      } else {
        setScreen(SCREENS.waiting);
      }
    });

    socket.on('state:init', (data) => {
      setCurrentPoll(data.currentPoll);
      setHistory(data.pollHistory || []);
      setParticipants(data.participants || []);
      setChatMessages(data.chatMessages || []);
      setTeacherCanAskNew(data.teacherCanAskNew || { canAsk: true, reason: 'No active poll' });
      
      // Calculate timer for active poll
      if (data.currentPoll && data.currentPoll.isActive) {
        if (data.currentPoll.startTime && data.currentPoll.timeLimitSec) {
          const elapsedTime = (Date.now() - data.currentPoll.startTime) / 1000;
          const remainingTime = Math.max(0, data.currentPoll.timeLimitSec - elapsedTime);
          setTimeLeft(Math.ceil(remainingTime));
        } else {
          setTimeLeft(data.currentPoll.timeLimitSec || 60);
        }
      } else {
        setTimeLeft(0);
      }
      
      // Only auto-navigate if user has already joined (not on welcome screen)
      if (hasJoined) {
        if (data.currentPoll && data.currentPoll.isActive) {
          if (isTeacher) {
            setScreen(SCREENS.teacher);
            setTeacherView('results');
          } else {
            setScreen(SCREENS.question);
          }
        } else if (isTeacher) {
          setScreen(SCREENS.teacher);
          setTeacherView('create');
        } else {
          setScreen(SCREENS.waiting);
        }
      }
    });

    socket.on('poll:started', (poll) => {
      setCurrentPoll(poll);
      setAnswering(false);
      setSelectedOptionId(null);
      setCurrentQuestionNumber(poll.sequence || 1);
      // Calculate actual remaining time based on when poll started
      if (poll.startTime && poll.timeLimitSec) {
        const elapsedTime = (Date.now() - poll.startTime) / 1000;
        const remainingTime = Math.max(0, poll.timeLimitSec - elapsedTime);
        setTimeLeft(Math.ceil(remainingTime));
      } else {
        setTimeLeft(poll.timeLimitSec || 60);
      }
      
      if (isTeacher) {
        setScreen(SCREENS.teacher);
        setTeacherView('results');
      } else {
        setScreen(SCREENS.question);
      }
    });

    socket.on('poll:update', (poll) => {
      console.log('Poll update received:', poll);
      console.log('Responses:', poll.responses);
      console.log('Options:', poll.options.map(opt => ({ id: opt.id, type: typeof opt.id, text: opt.text })));
      setCurrentPoll(poll);
    });

    socket.on('history:update', (updatedHistory) => {
      console.log('History update received:', updatedHistory);
      setHistory(updatedHistory);
    });

    socket.on('poll:ended', (poll) => {
      setCurrentPoll(poll); // Keep the poll data to show results
      // Note: History is now automatically updated when new polls are created
      
      if (isTeacher) {
        setTeacherView('results'); // Show results instead of create
        setScreen(SCREENS.teacher);
      } else {
        setScreen(SCREENS.results);
      }
    });

    socket.on('poll:cleared', () => {
      if (currentPoll) {
        setCurrentPoll({ ...currentPoll, responses: {} });
      }
    });

    socket.on('participants:update', (participantsList) => {
      setParticipants(participantsList);
    });

    socket.on('chat:new', (message) => {
      console.log('New chat message received:', message);
      setChatMessages(prev => [...prev, message]);
    });

    socket.on('user:kicked', () => {
      setScreen(SCREENS.kicked);
    });

    socket.on('teacher:create_error', (error) => {
      alert(error);
    });

    socket.on('teacher:validation_update', (validation) => {
      console.log('Teacher validation update:', validation);
      setTeacherCanAskNew(validation);
    });

    return () => {
      socket.off('connect');
      socket.off('user:joined');
      socket.off('state:init');
      socket.off('poll:started');
      socket.off('poll:update');
      socket.off('poll:ended');
      socket.off('poll:cleared');
      socket.off('participants:update');
      socket.off('chat:new');
      socket.off('user:kicked');
      socket.off('teacher:create_error');
      socket.off('teacher:validation_update');
      socket.off('history:update');
    };
  }, [isTeacher, currentPoll]);

  // Countdown timer - calculate remaining time based on actual elapsed time
  useEffect(() => {
    let interval;
    if (currentPoll && currentPoll.isActive && screen === SCREENS.question) {
      interval = setInterval(() => {
        if (currentPoll.startTime && currentPoll.timeLimitSec) {
          const elapsedTime = (Date.now() - currentPoll.startTime) / 1000;
          const remainingTime = Math.max(0, currentPoll.timeLimitSec - elapsedTime);
          const newTimeLeft = Math.ceil(remainingTime);
          
          setTimeLeft(newTimeLeft);
          
          // Show results when time runs out
          if (newTimeLeft <= 0) {
            setScreen(SCREENS.results);
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentPoll, screen, selectedOptionId]);

  // Reset answering state when new poll starts
  useEffect(() => {
    if (currentPoll && currentPoll.id) {
      setAnswering(false);
      setSelectedOptionId(null);
    }
  }, [currentPoll?.id]);

  // Reset selectedRole when returning to welcome screen
  useEffect(() => {
    if (screen === SCREENS.welcome) {
      setSelectedRole(null);
      setHasJoined(false);
    }
  }, [screen]);


  const handleGetStarted = () => {
    setScreen(SCREENS.getStarted);
  };

  const handleBackToWelcome = () => {
    // Reset all state when going back to welcome
    setSelectedRole(null);
    setIsTeacher(false);
    setName('');
    setHasJoined(false);
    setScreen(SCREENS.welcome);
  };

  const handleNameSubmit = () => {
    if (name.trim()) {
      // Save name to localStorage for this tab
      localStorage.setItem(`polling_name_${tabId}`, name.trim());
      
      console.log('Joining as:', { name: name.trim(), isTeacher, socketId: socket.id, connected: socket.connected, tabId });
      
      if (!socket.connected) {
        console.error('Socket not connected when trying to join!');
        alert('Connection lost. Please refresh the page.');
        return;
      }
      
      socket.emit('user:join', { name: name.trim(), isTeacher });
      
      // Don't navigate immediately - wait for state:init to determine the correct screen
      // This handles the case where user is rejoining and there might be an active poll
    }
  };

  const handleCreatePoll = (pollData) => {
    // Create optimistic poll data for immediate display
    const optimisticPoll = {
      id: Date.now(),
      sequence: currentQuestionNumber + 1,
      question: pollData.question,
      options: pollData.options.map((opt, index) => ({
        id: index + 1,
        text: opt.text,
        isCorrect: pollData.correctOptionIds.includes(index + 1)
      })),
      timeLimitSec: pollData.timeLimitSec || 60,
      startTime: Date.now(),
      responses: {},
      isActive: true
    };
    
    console.log('Setting optimistic poll:', optimisticPoll);
    setCurrentPoll(optimisticPoll);
    setCurrentQuestionNumber(optimisticPoll.sequence);
    setTeacherView('results');
    
    socket.emit('teacher:create_poll', pollData);
  };

  const handleEndPoll = () => {
    socket.emit('teacher:end_poll');
  };

  const handleClearResponses = () => {
    socket.emit('teacher:clear_responses');
  };

  const submitAnswer = () => {
    if (selectedOptionId && currentPoll) {
      console.log('Submitting answer:', { 
        pollId: currentPoll.id, 
        optionId: selectedOptionId,
        socketId: socket.id,
        socketConnected: socket.connected,
        hasJoined: hasJoined
      });
      
      if (!socket.connected) {
        console.error('Socket not connected!');
        alert('Connection lost. Please refresh the page.');
        return;
      }
      
      if (!hasJoined) {
        console.error('User has not joined the session!');
        alert('Please wait for connection to be established.');
        return;
      }
      
      socket.emit('student:answer', { 
        pollId: currentPoll.id, 
        optionId: parseInt(selectedOptionId) 
      });
      setAnswering(true);
      setScreen(SCREENS.results);
    } else {
      console.log('Cannot submit answer:', { selectedOptionId, currentPoll });
    }
  };

  const handleSendMessage = useCallback(() => {
    if (currentChatMessage.trim()) {
      console.log('Sending chat message:', currentChatMessage.trim());
      socket.emit('chat:message', { message: currentChatMessage.trim() });
      setCurrentChatMessage('');
    }
  }, [currentChatMessage, socket]);

  const handleKickUser = (userId) => {
    socket.emit('teacher:kick', { userId });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Chat Panel Component
  const ChatPanel = () => (
    <div className="fixed right-8 bottom-32 w-80 bg-white rounded-lg shadow-sm border border-[#cecece] z-50 h-96">
      {/* Tabs */}
      <div className="flex border-b border-[#cecece]">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 py-3 px-4 text-sm font-medium ${
            activeTab === "chat" ? "text-[#000000] border-b-2 border-[#af8ff1]" : "text-[#8d8d8d]"
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveTab("participants")}
          className={`flex-1 py-3 px-4 text-sm font-medium ${
            activeTab === "participants" ? "text-[#000000] border-b-2 border-[#af8ff1]" : "text-[#8d8d8d]"
          }`}
        >
          Participants
        </button>
      </div>

      {/* Content Area - Fixed Height */}
      <div className="h-80 flex flex-col">
        {/* Chat Content */}
        {activeTab === "chat" && (
          <>
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[#8d8d8d]">
                    No messages yet
                  </div>
                ) : (
                  chatMessages.map((msg, index) => {
                    const isCurrentUser = msg.senderName === name;
                    return (
                      <div key={msg.id || index} className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                        {/* Sender Name */}
                        <div className={`text-xs text-[#4F0BD3] mb-1 ${isCurrentUser ? 'mr-2' : 'ml-2'}`}>
                          {msg.senderName}
                        </div>
                        {/* Message Bubble */}
                        <div className={`max-w-[70%] px-4 py-2 rounded-lg ${
                          isCurrentUser 
                            ? 'bg-[#6766d5] text-white' 
                            : 'bg-[#8d8d8d] text-white'
                        }`}>
                          <div className="text-sm">{msg.message}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <div className="p-4 border-t border-[#cecece]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentChatMessage}
                  onChange={(e) => setCurrentChatMessage(e.target.value)}
                  onKeyPress={(e) => { 
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 border border-[#cecece] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#6766d5]"
                  autoComplete="off"
                  autoFocus={true}
                />
                <button 
                  onClick={handleSendMessage} 
                  className="bg-[#6766d5] hover:bg-[#5a66d1] text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        )}

        {/* Participants List */}
        {activeTab === "participants" && (
          <div className="flex-1 p-4">
            <div className="flex justify-between items-center mb-4 text-sm">
              <span className="text-[#8d8d8d] font-medium">Name</span>
              <span className="text-[#8d8d8d] font-medium">Action</span>
            </div>

            <div className="h-full overflow-y-auto">
              <div className="space-y-3">
                {participants.filter(p => !p.isTeacher).map((participant, index) => (
                  <div key={participant.id || index} className="flex justify-between items-center py-2">
                    <span className="text-[#000000] text-sm">{participant.name}</span>
                    {isTeacher && (
                      <button 
                        onClick={() => handleKickUser(participant.id)}
                        className="text-[#1d68bd] text-sm font-medium hover:underline"
                      >
                        Kick out
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Floating Chat Button
  const FloatingChatButton = () => {
    // Don't show chat button on teacher create screen
    if (screen === SCREENS.teacher && teacherView === 'create') {
      return null;
    }
    
    return (
      <div className="fixed bottom-8 right-8 z-40">
        <button 
          onClick={() => setShowChatPanel(!showChatPanel)} 
          className="w-14 h-14 bg-[#6766d5] hover:bg-[#5a66d1] rounded-full shadow-lg transition-colors flex items-center justify-center"
        >
          <img src="./chat.png" alt="Chat" className="w-6 h-6 brightness-0 invert" />
        </button>
      </div>
    );
  };

  // Welcome Screen
  if (screen === SCREENS.welcome) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-full text-sm font-medium" style={{ background: 'linear-gradient(135deg, #7565D9 0%, #4D0ACD 100%)' }}>
              <img 
                src="./Vector (1).png" 
                alt="Intervue Poll" 
                className="w-4 h-4 brightness-0 invert" 
              />
              Intervue Poll
            </div>
          </div>

          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-[#000000] leading-tight">
              Welcome to the <span className="font-bold">Live Polling System</span>
            </h1>
            <p className="text-[#454545] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Please select the role that best describes you to begin using the live polling system
            </p>
          </div>

          {/* Role Selection Cards */}
          <div className="flex flex-col md:flex-row gap-6 justify-center items-stretch max-w-4xl mx-auto mt-12">
            {/* Student Card */}
            <div
              className={`flex-1 p-8 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                selectedRole === "student"
                  ? "border-[#7c3aed] bg-[#ffffff]"
                  : "border-[#d9d9d9] bg-[#ffffff] hover:border-[#7c3aed]/50"
              }`}
              onClick={() => setSelectedRole("student")}
            >
              <h3 className="text-2xl font-bold text-[#000000] mb-4 text-left">I'm a Student</h3>
              <p className="text-[#454545] text-left leading-relaxed">
                Lorem Ipsum is simply dummy text of the printing and typesetting industry
              </p>
            </div>

            {/* Teacher Card */}
            <div
              className={`flex-1 p-8 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                selectedRole === "teacher"
                  ? "border-[#7c3aed] bg-[#ffffff]"
                  : "border-[#d9d9d9] bg-[#ffffff] hover:border-[#7c3aed]/50"
              }`}
              onClick={() => setSelectedRole("teacher")}
            >
              <h3 className="text-2xl font-bold text-[#000000] mb-4 text-left">I'm a Teacher</h3>
              <p className="text-[#454545] text-left leading-relaxed">
                Submit answers and view live poll results in real-time.
              </p>
            </div>
          </div>

          {/* Continue Button */}
          <div className="pt-8">
            <button
              className="text-white px-12 py-4 rounded-full text-lg font-semibold transition-colors duration-200 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #7565D9 0%, #4D0ACD 100%)'
              }}
              disabled={!selectedRole}
              onClick={() => {
                if (selectedRole === "student") {
                  setIsTeacher(false);
                } else if (selectedRole === "teacher") {
                  setIsTeacher(true);
                }
                handleGetStarted();
              }}
              onMouseEnter={(e) => {
                if (!e.target.disabled) {
                  e.target.style.background = 'linear-gradient(135deg, #6854C8 0%, #3C0ABC 100%)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.target.disabled) {
                  e.target.style.background = 'linear-gradient(135deg, #7565D9 0%, #4D0ACD 100%)';
                }
              }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get Started Screen
  if (screen === SCREENS.getStarted) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto text-center space-y-8">
          {/* Intervue Poll Badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-full text-sm font-medium" style={{ background: 'linear-gradient(135deg, #7565D9 0%, #4D0ACD 100%)' }}>
              <img 
                src="./Vector (1).png" 
                alt="Intervue Poll" 
                className="w-4 h-4 brightness-0 invert" 
              />
              Intervue Poll
            </div>
          </div>

          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-[#000000] text-balance">Let's Get Started</h1>

            <p className="text-[#5c5b5b] text-lg leading-relaxed">
              {name ? (
                <>
                  Welcome back, <span className="font-semibold text-[#000000]">{name}</span>! 
                  {isTeacher ? ' You can create and manage polls.' : ' You can participate in live polls and submit answers.'}
                </>
              ) : (
                <>
                  If you're a student, you'll be able to{" "}
                  <span className="font-semibold text-[#000000]">submit your answers</span>, participate in live polls, and
                  see how your responses compare with your classmates
                </>
              )}
            </p>
          </div>

          {/* Form Section */}
          <div className="space-y-6 pt-4">
            <div className="text-left space-y-3">
              <label htmlFor="name" className="block text-[#000000] font-medium text-base">
                {name ? 'Your Name' : 'Enter your Name'}
              </label>
              <input
                type="text"
                id="name"
                placeholder="Rahul Bajaj"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-4 bg-[#ffffff] border border-gray-200 rounded-lg text-[#000000] placeholder-[#5c5b5b] focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-base"
              />
              {name && (
                <p className="text-sm text-[#6b7280]">
                  This name is saved for this browser tab. You can change it if needed.
                </p>
              )}
            </div>

            <button
              onClick={handleNameSubmit}
              className="text-white px-12 py-4 rounded-full text-lg font-semibold transition-colors duration-200"
              style={{
                background: 'linear-gradient(135deg, #7565D9 0%, #4D0ACD 100%)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #6854C8 0%, #3C0ABC 100%)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #7565D9 0%, #4D0ACD 100%)';
              }}
            >
              {name ? 'Join Session' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Waiting Screen
  if (screen === SCREENS.waiting) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto text-center space-y-8">
          {/* Intervue Poll Badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-full text-sm font-medium" style={{ background: 'linear-gradient(135deg, #7565D9 0%, #4D0ACD 100%)' }}>
              <img 
                src="./Vector (1).png" 
                alt="Intervue Poll" 
                className="w-4 h-4 brightness-0 invert" 
              />
              Intervue Poll
            </div>
          </div>

          {/* Loading Spinner */}
          <div className="flex justify-center">
            <div className="w-16 h-16 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#500ECE' }}></div>
          </div>

          {/* Wait Message */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[#000000]">Wait for the teacher to ask questions.</h2>
            <p className="text-[#5c5b5b] text-lg">You'll be notified when a new question is available.</p>
          </div>
        </div>

        {/* Chat Panel */}
        {showChatPanel && <ChatPanel />}
        <FloatingChatButton />
      </div>
    );
  }

  // Student Question Screen
  if (screen === SCREENS.question && currentPoll) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          <div className="space-y-8">
            {/* Header with Question and Timer */}
            <div className="flex items-center justify-center gap-4">
              <h1 className="text-2xl font-semibold text-[#2e2e2e]">Question {currentQuestionNumber}</h1>
                <div className="flex items-center gap-2">
                  <img src="./Timer.png" alt="Timer" className="w-4 h-4" />
                  <span className="text-[#cb1206] font-medium">{formatTime(timeLeft)}</span>
                </div>
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-lg border border-[#8d8d8d]/20 overflow-hidden shadow-lg">
              {/* Question Header */}
              <div className="bg-[#2e2e2e] px-6 py-4">
                <h2 className="text-white font-medium text-center">{currentPoll.question}</h2>
              </div>

              {/* Answer Options */}
              <div className="p-6 space-y-3">
                {currentPoll.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedOptionId(option.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                      selectedOptionId === option.id
                        ? "border-[#6766D5] bg-[#6766D5]/10"
                        : "border-[#8d8d8d]/20 bg-[#f6f6f6] hover:border-[#8d8d8d]/40"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        selectedOptionId === option.id ? "bg-[#6766D5] text-white" : "bg-[#8d8d8d] text-white"
                      }`}
                    >
                      {option.id}
                    </div>
                    <span className="text-[#2e2e2e] font-medium">{option.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button 
                className="px-12 py-3 rounded-full font-medium transition-colors text-white"
                style={{
                  background: 'linear-gradient(135deg, #7565D9 0%, #4D0ACD 100%)'
                }}
                onClick={submitAnswer}
                disabled={!selectedOptionId}
                onMouseEnter={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.background = 'linear-gradient(135deg, #6854C8 0%, #3C0ABC 100%)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.background = 'linear-gradient(135deg, #7565D9 0%, #4D0ACD 100%)';
                  }
                }}
              >
                Submit
              </button>
            </div>

          </div>
        </div>

        {/* Chat Panel */}
        {showChatPanel && <ChatPanel />}
        <FloatingChatButton />
      </div>
    );
  }

  // Student Results Screen
  if (screen === SCREENS.results && currentPoll) {
    const totalResponses = Object.keys(currentPoll.responses || {}).length;
    
    return (
      <div className="min-h-screen bg-[#f6f6f6] flex items-center justify-center p-4">
        <div className="w-full max-w-2xl mx-auto">
          {/* Header with Question and Timer */}
          <div className="flex items-center gap-4 mb-6">
            <h1 className="text-2xl font-semibold text-[#000000]">Question {currentQuestionNumber}</h1>
              <div className="flex items-center gap-2">
                <img src="./Timer.png" alt="Timer" className="w-5 h-5" />
                <span className="text-[#cb1206] font-mono text-lg">00:00</span>
              </div>
          </div>

          {/* Quiz Card */}
          <div className="bg-[#ffffff] rounded-lg shadow-sm overflow-hidden mb-8">
            {/* Question Header */}
            <div className="bg-[#8d8d8d] px-6 py-4">
              <h2 className="text-[#ffffff] text-lg font-medium">{currentPoll.question}</h2>
            </div>

            {/* Answer Options */}
            <div className="p-6 space-y-4">
              {currentPoll.options.map((option) => {
                const responses = Object.values(currentPoll.responses || {}).filter(
                  response => response.optionId === option.id
                );
                const percentage = totalResponses > 0 ? (responses.length / totalResponses) * 100 : 0;
                
                return (
                  <div key={option.id} className="relative">
                    {/* Background bar representing percentage */}
                    <div className="relative bg-[#f6f6f6] rounded-lg overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#6766d5] to-[#5a66d1] h-12 rounded-lg transition-all duration-500 ease-out"
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      />

                      {/* Answer content overlay */}
                      <div className="absolute inset-0 flex items-center justify-between px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-[#ffffff] rounded-full flex items-center justify-center text-[#6766d5] text-sm font-semibold">
                            {option.id}
                          </div>
                          <span className="text-[#ffffff] font-medium">{option.text}</span>
                        </div>
                        <span className="text-[#000000] font-semibold bg-[#ffffff] px-2 py-1 rounded text-sm">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Wait Message */}
          <div className="text-center">
            <p className="text-[#000000] text-lg">Wait for the teacher to ask a new question..</p>
          </div>

        </div>

        {/* Chat Panel */}
        {showChatPanel && <ChatPanel />}
        <FloatingChatButton key="results-chat-button" />
      </div>
    );
  }

  // History Screen
  if (screen === SCREENS.history) {
    return (
      <div className="min-h-screen bg-[#f6f6f6] p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-[#000000] mb-12">View Poll History</h1>

          <div className="space-y-12">
            {history.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#8d8d8d] text-lg">No poll history available</p>
              </div>
            ) : (
              history.map((poll, index) => (
                <div key={poll.id} className="space-y-6">
                  <h2 className="text-2xl font-semibold text-[#000000]">Question {index + 1}</h2>

                  <div className="border border-[#d9d9d9] rounded-lg overflow-hidden">
                    {/* Question Header */}
                    <div className="bg-[#828282] px-6 py-4">
                      <h3 className="text-[#ffffff] font-medium text-lg">{poll.question}</h3>
                    </div>

                    {/* Poll Options */}
                    <div className="bg-[#f6f6f6] p-6 space-y-4">
                      {poll.options.map((option) => {
                        const responses = Object.values(poll.responses || {}).filter(
                          response => response.optionId === option.id
                        );
                        const percentage = poll.responses && Object.keys(poll.responses).length > 0 
                          ? (responses.length / Object.keys(poll.responses).length) * 100 
                          : 0;
                        
                        return (
                          <div key={option.id} className="flex items-center gap-4">
                            {/* Option with progress bar */}
                            <div className="flex-1 flex items-center bg-[#ffffff] rounded-lg border border-[#d9d9d9] overflow-hidden">
                              {/* Progress bar background */}
                              <div className="flex-1 relative">
                                <div
                                  className="bg-[#6766d5] h-12 rounded-l-lg transition-all duration-300"
                                  style={{ width: `${Math.max(percentage, 2)}%` }}
                                />
                                <div className="absolute inset-0 flex items-center px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-[#ffffff] rounded-full flex items-center justify-center text-[#6766d5] text-sm font-semibold">
                                      {option.id}
                                    </div>
                                    <span className="text-[#ffffff] font-medium">{option.text}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Percentage display */}
                              <div className="px-4 py-3 bg-[#ffffff] min-w-[80px] text-right">
                                <span className="text-[#000000] font-semibold">{percentage.toFixed(0)}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Back to Current Poll Button */}
          {isTeacher && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setScreen(SCREENS.teacher)}
                className="bg-[#6766d5] hover:bg-[#5a66d1] text-white px-8 py-3 rounded-full font-medium transition-colors"
              >
                Back to Current Poll
              </button>
            </div>
          )}

        </div>

        {/* Chat Panel */}
        {showChatPanel && <ChatPanel />}
        <FloatingChatButton />
      </div>
    );
  }

  // Kicked Screen
  if (screen === SCREENS.kicked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          {/* Intervue Poll Badge */}
          <div className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-full text-sm font-medium mb-8" style={{ background: 'linear-gradient(135deg, #7565D9 0%, #4D0ACD 100%)' }}>
            <img 
              src="./Vector (1).png" 
              alt="Intervue Poll" 
              className="w-4 h-4 brightness-0 invert" 
            />
            Intervue Poll
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl font-bold text-black mb-4">{"You've been Kicked out !"}</h1>

          {/* Subtext */}
          <p className="text-gray-600 text-base leading-relaxed">
            {"Looks like the teacher had removed you from the poll system .Please Try again sometime."}
          </p>
        </div>
      </div>
    );
  }

  // Teacher Screen - Keep existing functionality
  if (screen === SCREENS.teacher) {
    return (
      <div>
        {teacherView === 'create' ? (
          <PollCreator 
            onCreate={handleCreatePoll}
            onViewHistory={() => setScreen(SCREENS.history)}
            teacherCanAskNew={teacherCanAskNew}
          />
        ) : (
          <TeacherResults 
            currentPoll={currentPoll}
            onEndPoll={handleEndPoll}
            onClearResponses={handleClearResponses}
            onViewHistory={() => setScreen(SCREENS.history)}
            onAskNewQuestion={() => setTeacherView('create')}
            participants={participants}
          />
        )}

        {/* Chat Panel */}
        {showChatPanel && <ChatPanel />}
        <FloatingChatButton />
      </div>
    );
  }

  return null;
}

export default App;