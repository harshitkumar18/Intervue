import { useState } from 'react';
import { Plus, X } from 'lucide-react';

const PollCreator = ({ onCreate, onCancel, teacherCanAskNew, hasJoined, socketConnected }) => {
  const [question, setQuestion] = useState('');
  const [timeLimit, setTimeLimit] = useState(60);
  const [showTimerDropdown, setShowTimerDropdown] = useState(false);

  const increaseTimer = () => {
    if (timeLimit < 60) {
      setTimeLimit(timeLimit + 1);
    }
  };

  const decreaseTimer = () => {
    if (timeLimit > 0) {
      setTimeLimit(timeLimit - 1);
    }
  };
  const [options, setOptions] = useState([
    { id: 1, text: '', isCorrect: 'no' },
    { id: 2, text: '', isCorrect: 'no' }
  ]);
  const [errors, setErrors] = useState({});

  const addOption = () => {
    const newId = Math.max(...options.map(o => o.id)) + 1;
    setOptions([...options, { id: newId, text: '', isCorrect: 'no' }]);
  };

  const removeOption = (id) => {
    if (options.length > 2) {
      setOptions(options.filter(opt => opt.id !== id));
    }
  };

  const updateOptionCorrectness = (optionId, value) => {
    setOptions(options.map(opt => 
      opt.id === optionId 
        ? { ...opt, isCorrect: value }
        : { ...opt, isCorrect: value === 'yes' ? 'no' : opt.isCorrect }
    ));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!question.trim()) {
      newErrors.question = 'Question is required';
    }
    
    if (options.length < 2) {
      newErrors.options = 'At least 2 options are required';
    }
    
    const emptyOptions = options.filter(opt => !opt.text.trim());
    if (emptyOptions.length > 0) {
      newErrors.options = 'All options must have text';
    }
    
    const correctOptions = options.filter(opt => opt.isCorrect === 'yes');
    if (correctOptions.length !== 1) {
      newErrors.correct = 'Exactly one option must be marked as correct';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = () => {
    if (validateForm()) {
      const correctOptionIds = options
        .filter(opt => opt.isCorrect === 'yes')
        .map(opt => opt.id);
      
      onCreate({
        question: question.trim(),
        options: options.map(opt => ({ text: opt.text.trim() })),
        timeLimitSec: timeLimit,
        correctOptionIds
      });
    }
  };

  return (
    <div style={{ 
      maxWidth: '1536px', 
      margin: '0 auto', 
      padding: 32, 
      background: '#fff'
    }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: 8, 
          background: 'linear-gradient(135deg, #7565D9 0%, #4D0ACD 100%)', 
          color: '#fff', 
          padding: '8px 16px', 
          borderRadius: 20, 
          fontSize: 14, 
          fontWeight: 500, 
          marginBottom: 24 
        }}>
          <img 
            src="./Vector (1).png" 
            alt="Intervue Poll" 
            className="w-4 h-4 brightness-0 invert object-contain" 
            onError={(e) => {
              console.error('Failed to load Vector (1).png');
              e.target.style.display = 'none';
            }}
          />
          <span>Intervue Poll</span>
        </div>

        <h1 style={{ 
          marginBottom: 16, 
          color: '#000000', 
          fontSize: '36px', 
          fontWeight: 700 
        }}>
          Let's Get Started
        </h1>

        <p style={{ 
          color: '#b4b4b4', 
          fontSize: 18, 
          lineHeight: '1.6', 
          maxWidth: '512px' 
        }}>
          you'll have the ability to create and manage polls, ask questions, and monitor your students' responses in
          real-time.
        </p>
      </div>

      {/* Question Input Section */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: 16 
        }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: 600, 
            color: '#000000' 
          }}>
            Enter your question
          </h2>
        </div>

        {/* Timer positioned above and aligned with the right edge of the textarea */}
        <div style={{ 
          display: 'flex',
          justifyContent: 'flex-end',
          width: '60%',
          marginBottom: 8 
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            background: '#f1f1f1', 
            padding: '8px 16px', 
            borderRadius: 8, 
            color: '#000000', 
            fontWeight: 500
          }}>
            <span>{timeLimit} seconds</span>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 2 
            }}>
              <button
                onClick={increaseTimer}
                disabled={timeLimit >= 60}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: timeLimit >= 60 ? 'not-allowed' : 'pointer',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 16,
                  height: 8,
                  opacity: timeLimit >= 60 ? 0.5 : 1
                }}
              >
                <div style={{ 
                  width: 16, 
                  height: 16, 
                  color: '#7451b6',
                  transform: 'rotate(180deg)',
                  fontSize: 12
                }}>▼</div>
              </button>
              <button
                onClick={decreaseTimer}
                disabled={timeLimit <= 0}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: timeLimit <= 0 ? 'not-allowed' : 'pointer',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 16,
                  height: 8,
                  opacity: timeLimit <= 0 ? 0.5 : 1
                }}
              >
                <div style={{ 
                  width: 16, 
                  height: 16, 
                  color: '#7451b6',
                  fontSize: 12
                }}>▼</div>
              </button>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter your question here..."
            style={{
              width: '60%',
              minHeight: 120,
              padding: 16,
              background: '#f1f1f1',
              border: 'none',
              borderRadius: 8,
              color: '#000000',
              fontSize: 18,
              resize: 'none',
              outline: 'none'
            }}
          />
          <div style={{ 
            position: 'absolute', 
            bottom: 16, 
            right: 'calc(40% + 16px)', 
            color: '#b4b4b4', 
            fontSize: 14 
          }}>
            {question.length}/100
          </div>
        </div>
        {errors.question && (
          <p style={{ color: '#ef4444', fontSize: 14, marginTop: 4 }}>
            {errors.question}
          </p>
        )}
      </div>

      {/* Options and Correctness Section */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: 48 
      }}>
        {/* Edit Options */}
        <div>
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: 600, 
            color: '#000000', 
            marginBottom: 24 
          }}>
            Edit Options
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {options.map((option) => (
              <div key={option.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 16 
              }}>
                <div style={{ 
                  width: 32, 
                  height: 32, 
                  background: '#7451b6', 
                  color: '#fff', 
                  borderRadius: 999, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: 14, 
                  fontWeight: 500 
                }}>
                  {option.id}
                </div>
                <div style={{ 
                  flex: 1, 
                  background: '#f1f1f1', 
                  padding: '12px 16px', 
                  borderRadius: 8 
                }}>
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => {
                      setOptions(options.map((opt) => 
                        opt.id === option.id 
                          ? { ...opt, text: e.target.value } 
                          : opt
                      ));
                    }}
                    placeholder={`Option ${option.id}`}
                    style={{ 
                      width: '100%', 
                      background: 'transparent', 
                      color: '#000', 
                      outline: 'none',
                      border: 'none'
                    }}
                  />
                </div>
                {options.length > 2 && (
                  <button
                    onClick={() => removeOption(option.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#dc2626',
                      cursor: 'pointer',
                      padding: 8,
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Remove option"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            ))}

            <button
              onClick={addOption}
              style={{
                background: 'transparent',
                color: '#7451b6',
                border: '1px solid #7451b6',
                padding: '8px 16px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: 'fit-content'
              }}
            >
              <div style={{ 
              
              }}>
          
              </div>
              + Add More Option
            </button>

          </div>
        </div>

        {/* Is it Correct */}
        <div>
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: 600, 
            color: '#000000', 
            marginBottom: 24 
          }}>
            Is it Correct?
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {options.map((option) => (
              <div key={option.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 16,
                height: '48px' // Match the height of option inputs
              }}>
                {/* Option number to match left column */}
                <div style={{ 
                  width: 32, 
                  height: 32, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#000000'
                }}>
                  {option.id}
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 16 
                }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    cursor: 'pointer' 
                  }}>
                    <input
                      type="radio"
                      name={`correct-${option.id}`}
                      value="yes"
                      checked={option.isCorrect === 'yes'}
                      onChange={() => updateOptionCorrectness(option.id, 'yes')}
                      style={{ 
                        accentColor: '#7451b6',
                        width: 16,
                        height: 16
                      }}
                    />
                    <span style={{ 
                      color: '#000000', 
                      fontWeight: 500 
                    }}>
                      Yes
                    </span>
                  </label>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    cursor: 'pointer' 
                  }}>
                    <input
                      type="radio"
                      name={`correct-${option.id}`}
                      value="no"
                      checked={option.isCorrect === 'no'}
                      onChange={() => updateOptionCorrectness(option.id, 'no')}
                      style={{ 
                        accentColor: '#7451b6',
                        width: 16,
                        height: 16
                      }}
                    />
                    <span style={{ 
                      color: '#000000', 
                      fontWeight: 500 
                    }}>
                      No
                    </span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Horizontal line spanning full window width */}
      <div style={{
        width: '100vw',
        height: '1px',
        backgroundColor: '#B6B6B6',
        marginLeft: 'calc(-50vw + 50%)',
        marginTop: '32px',
        marginBottom: '32px'
      }}></div>
      
      {errors.options && (
        <p style={{ color: '#ef4444', fontSize: 14, marginTop: 16 }}>
          {errors.options}
        </p>
      )}
      
      {errors.correct && (
        <p style={{ color: '#ef4444', fontSize: 14, marginTop: 16 }}>
          {errors.correct}
        </p>
      )}

      {/* Ask Question Button */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginTop: 48 }}>
        {/* Connection Status */}
        {!socketConnected && (
          <div style={{ 
            marginBottom: 16, 
            padding: '12px 16px', 
            background: '#fef2f2', 
            border: '1px solid #ef4444', 
            borderRadius: 8,
            color: '#dc2626',
            fontSize: 14,
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            ❌ Not connected to server. Please refresh the page.
          </div>
        )}
        
        {socketConnected && !hasJoined && (
          <div style={{ 
            marginBottom: 16, 
            padding: '12px 16px', 
            background: '#dbeafe', 
            border: '1px solid #3b82f6', 
            borderRadius: 8,
            color: '#1e40af',
            fontSize: 14,
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            🔄 Connecting to session... Please wait.
          </div>
        )}
        
        {/* Validation Status */}
        {hasJoined && !teacherCanAskNew?.canAsk && (
          <div style={{ 
            marginBottom: 16, 
            padding: '12px 16px', 
            background: '#fef3c7', 
            border: '1px solid #f59e0b', 
            borderRadius: 8,
            color: '#92400e',
            fontSize: 14,
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            {teacherCanAskNew?.reason}
            {teacherCanAskNew?.answeredCount !== undefined && teacherCanAskNew?.totalStudents !== undefined && (
              <div style={{ marginTop: 4, fontSize: 12 }}>
                ({teacherCanAskNew.answeredCount}/{teacherCanAskNew.totalStudents} students answered)
              </div>
            )}
          </div>
        )}
        
        {hasJoined && teacherCanAskNew?.canAsk && teacherCanAskNew?.reason !== 'No active poll' && (
          <div style={{ 
            marginBottom: 16, 
            padding: '12px 16px', 
            background: '#d1fae5', 
            border: '1px solid #10b981', 
            borderRadius: 8,
            color: '#065f46',
            fontSize: 14,
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            ✅ {teacherCanAskNew?.reason}
          </div>
        )}
        
        <button
          onClick={handleCreate}
          disabled={!teacherCanAskNew?.canAsk || !hasJoined || !socketConnected}
          style={{
            background: (teacherCanAskNew?.canAsk && hasJoined && socketConnected)
              ? 'linear-gradient(135deg, #7565D9 0%, #4D0ACD 100%)' 
              : '#9ca3af',
            color: '#fff',
            border: 'none',
            padding: '12px 32px',
            borderRadius: 20,
            cursor: (teacherCanAskNew?.canAsk && hasJoined && socketConnected) ? 'pointer' : 'not-allowed',
            fontSize: 18,
            fontWeight: 500,
            transition: 'all 0.2s',
            opacity: (teacherCanAskNew?.canAsk && hasJoined && socketConnected) ? 1 : 0.6
          }}
          onMouseEnter={(e) => {
            if (teacherCanAskNew?.canAsk && hasJoined && socketConnected) {
              e.target.style.background = 'linear-gradient(135deg, #6854C8 0%, #3C0ABC 100%)';
            }
          }}
          onMouseLeave={(e) => {
            if (teacherCanAskNew?.canAsk && hasJoined && socketConnected) {
              e.target.style.background = 'linear-gradient(135deg, #7565D9 0%, #4D0ACD 100%)';
            }
          }}
        >
          {!socketConnected ? 'Not Connected' : !hasJoined ? 'Connecting...' : 'Ask Question'}
        </button>
      </div>
    </div>
  );
};

export default PollCreator;