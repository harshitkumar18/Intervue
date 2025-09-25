import { Eye, Plus } from "lucide-react";

const TeacherResults = ({ 
  currentPoll, 
  onEndPoll, 
  onClearResponses, 
  onViewHistory, 
  onAskNewQuestion,
  participants 
}) => {
  console.log('TeacherResults received currentPoll:', currentPoll);
  
  if (!currentPoll) {
    return (
      <div className="min-h-screen bg-[#f6f6f6] p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header with View Poll History button */}
          <div className="flex justify-end mb-12">
            <button 
              onClick={onViewHistory}
              className="bg-[#af8ff1] hover:bg-[#8f64e1] text-white px-6 py-3 rounded-full flex items-center gap-2 font-medium transition-colors"
            >
              <Eye size={20} />
              View Poll history
            </button>
          </div>

          {/* No Active Poll Message */}
          <div className="bg-white p-12 rounded-xl shadow-lg text-center max-w-lg mx-auto">
            <h2 className="mb-4 text-slate-800 text-2xl font-semibold">
              No Active Poll
            </h2>
            <p className="mb-6 text-slate-500 text-base">
              Create a new poll to get started
            </p>
            <button
              onClick={onAskNewQuestion}
              className="bg-[#8f64e1] hover:bg-[#6766d5] text-white px-8 py-4 rounded-full flex items-center gap-2 font-medium text-lg transition-colors mx-auto"
            >
              <Plus size={20} />
              Ask a new question
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalResponses = Object.keys(currentPoll.responses).length;
  const totalStudents = participants.filter(p => !p.isTeacher).length;
  const responseRate = totalStudents > 0 ? (totalResponses / totalStudents) * 100 : 0;
  
  console.log('TeacherResults render:', {
    totalResponses,
    totalStudents,
    responses: currentPoll.responses
  });

  // Calculate results for each option
  const optionResults = currentPoll.options.map(option => {
    const responses = Object.values(currentPoll.responses).filter(
      response => response.optionId === option.id
    );
    
    console.log(`Option ${option.id} (${option.text}):`, {
      optionId: option.id,
      optionIdType: typeof option.id,
      responses: responses,
      responseOptionIds: Object.values(currentPoll.responses).map(r => ({ 
        optionId: r.optionId, 
        type: typeof r.optionId 
      }))
    });
    
    return {
      ...option,
      count: responses.length,
      percentage: totalResponses > 0 ? (responses.length / totalResponses) * 100 : 0
    };
  });

  return (
    <div className="min-h-screen bg-[#f6f6f6] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with View Poll History button */}
        <div className="flex justify-end mb-12">
          <button 
            onClick={onViewHistory}
            className="bg-[#af8ff1] hover:bg-[#8f64e1] text-white px-6 py-3 rounded-full flex items-center gap-2 font-medium transition-colors"
          >
            <Eye size={20} />
            View Poll history
          </button>
        </div>

        {/* Question Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-black mb-6">Question</h2>

            {/* Question Header */}
            <div className="bg-[#8d8d8d] text-white p-4 rounded-t-lg mb-0">
              <h3 className="text-lg font-medium">{currentPoll.question}</h3>
            </div>

            {/* Poll Results */}
            <div className="border border-gray-200 rounded-b-lg p-6 bg-white">
              <div className="space-y-4">
                {optionResults.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    {/* Option bar */}
                    <div className="flex-1 flex items-center">
                      <div
                        className="bg-[#6766d5] text-white px-4 py-3 rounded-lg flex items-center gap-3 min-w-0"
                        style={{ width: `${Math.max(item.percentage, 15)}%` }}
                      >
                        <div className="bg-white text-[#6766d5] rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                          {item.id}
                        </div>
                        <span className="font-medium truncate">{item.text}</span>
                      </div>
                    </div>

                    {/* Percentage */}
                    <div className="text-black font-semibold text-lg min-w-[60px] text-right">{item.percentage.toFixed(0)}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Ask New Question Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={onAskNewQuestion}
            className="bg-[#8f64e1] hover:bg-[#6766d5] text-white px-8 py-4 rounded-full flex items-center gap-2 font-medium text-lg transition-colors"
          >
            <Plus size={20} />
            Ask a new question
          </button>
        </div>

      </div>
    </div>
  );
};

export default TeacherResults;