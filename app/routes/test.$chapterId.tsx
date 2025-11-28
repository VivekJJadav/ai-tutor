import { useParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";

interface Question {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export default function TestPage() {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<{[key: number]: string}>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        // Call the RAG server directly
        const response = await fetch('http://127.0.0.1:5002/generate_test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chapter_id: chapterId,
            topic: `Chapter ${chapterId} Science` // You might want to pass the actual title if available
          })
        });

        const data = await response.json();

        if (data.success && data.questions) {
          setQuestions(data.questions);
        } else {
          setError(data.warning || data.error || "Failed to generate test");
        }
      } catch (err) {
        console.error("Error fetching test:", err);
        setError("Failed to connect to the AI server.");
      } finally {
        setLoading(false);
      }
    };

    if (chapterId) {
      fetchTest();
    }
  }, [chapterId]);

  const handleAnswerSelect = (questionIndex: number, option: string) => {
    if (submitted) return;
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: option
    }));
  };

  const handleSubmit = () => {
    let newScore = 0;
    questions.forEach((q, index) => {
      if (answers[index] === q.correct_answer) {
        newScore++;
      }
    });
    setScore(newScore);
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">AI is generating your test from the textbook...</p>
          <p className="text-sm text-gray-500">This might take a minute.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error Generating Test</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Chapter
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Chapter Test
          </h1>
          <div className="w-24"></div> {/* Spacer */}
        </div>

        {submitted && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center animate-fade-in">
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Test Results</h2>
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {score} / {questions.length}
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {score === questions.length ? 'Perfect Score! 🎉' : 
               score >= questions.length / 2 ? 'Good job! 👍' : 'Keep practicing! 💪'}
            </p>
          </div>
        )}

        <div className="space-y-6">
          {questions.map((q, index) => {
            const isCorrect = answers[index] === q.correct_answer;
            const isSelected = answers[index] !== undefined;
            
            return (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex items-start mb-4">
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mr-4">
                    {index + 1}
                  </span>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white pt-1">
                    {q.question}
                  </h3>
                </div>

                <div className="space-y-3 ml-12">
                  {q.options.map((option, optIndex) => {
                    let optionClass = "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700";
                    
                    if (submitted) {
                      if (option === q.correct_answer) {
                        optionClass = "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300";
                      } else if (answers[index] === option) {
                        optionClass = "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300";
                      }
                    } else if (answers[index] === option) {
                      optionClass = "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm";
                    }

                    return (
                      <button
                        key={optIndex}
                        onClick={() => handleAnswerSelect(index, option)}
                        disabled={submitted}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${optionClass}`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                {submitted && (
                  <div className="mt-4 ml-12 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-semibold">Explanation:</span> {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!submitted && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={Object.keys(answers).length < questions.length}
              className={`px-8 py-3 rounded-xl font-bold text-lg shadow-lg transition-all duration-200 ${
                Object.keys(answers).length < questions.length
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transform hover:scale-105'
              }`}
            >
              Submit Test
            </button>
          </div>
        )}
        
        <div className="h-12"></div>
      </div>
    </div>
  );
}
