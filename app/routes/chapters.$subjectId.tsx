import type { Route } from "./+types/chapters.$subjectId";
import { useNavigate, useParams } from "react-router";
import { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Chapters - React Router App" },
    { name: "description", content: "Select chapters for your subject" },
  ];
}

interface Chapter {
  id: number;
  title: string;
  subject_id: number;
  description?: string;
}

export default function ChaptersSelection() {
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const { t } = useLanguage();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', message: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);


  // ✅ Fetch chapters from Django backend
  const fetchChapters = async () => {
    if (!subjectId) return;

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/chapters/${subjectId}/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const backendChapters = await response.json();
        setChapters(backendChapters);
      } else {
        console.error("Failed to fetch chapters");
        // If no chapters found, show message
        setChapters([]);
      }
    } catch (error) {
      console.error("Error fetching chapters:", error);
      setChapters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChapters();
  }, [subjectId]);



  const handleChapterSelect = (chapterId: number) => {
    setSelectedChapter(chapterId);
  };

  useEffect(() => {
    if (selectedChapter && subjectId) {
      const fetchHistory = async () => {
        try {
          const response = await fetch(`http://localhost:8000/api/chat/history/?subject_id=${subjectId}&chapter_id=${selectedChapter}`, {
            credentials: 'include'
          });
          const data = await response.json();
          if (data.history) {
            setChatHistory(data.history);
          }
        } catch (error) {
          console.error('Error fetching history:', error);
        }
      };
      fetchHistory();
    } else {
      setChatHistory([]);
    }
  }, [selectedChapter, subjectId]);

  const handleContinue = () => {
    if (selectedChapter) {
      localStorage.setItem('selectedChapter', selectedChapter.toString());
      // Navigate to tutor/chat page or wherever appropriate
      navigate('/');
    }
  };

  const handleSendMessage = async (e: React.FormEvent, retryCount = 0) => {
    e.preventDefault();
    if (chatMessage.trim() && !isLoading) {
      const userMessage = chatMessage.trim();
      setChatMessage('');
      setIsLoading(true);

      // Add user message to chat history
      setChatHistory(prev => [...prev, { role: 'user', message: userMessage }]);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout

        const response = await fetch('http://localhost:8000/api/chat/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          signal: controller.signal,
          body: JSON.stringify({
            message: userMessage,
            chapter_id: selectedChapter,
            subject_id: subjectId
          })
        });

        clearTimeout(timeoutId);
        const data = await response.json();

        if (data.success) {
          // Add AI response to chat history
          setChatHistory(prev => [...prev, { role: 'ai', message: data.response }]);
        } else {
          // Handle specific error messages
          let errorMessage = 'Sorry, I encountered an error. Please try again.';

          if (data.error?.includes('Model server is not running')) {
            errorMessage = 'The AI model server is currently offline. Please contact support or try again later.';
          } else if (data.error?.includes('took too long to respond')) {
            errorMessage = 'The AI is taking longer than usual to respond. This might be due to a complex question. Please try a simpler question or try again later.';
          } else if (data.error?.includes('Connection error')) {
            errorMessage = 'There seems to be a connectivity issue. Please check your internet connection and try again.';
          }

          setChatHistory(prev => [...prev, {
            role: 'ai',
            message: errorMessage
          }]);
        }
      } catch (error: any) {
        console.error('Chat error:', error);

        let errorMessage = 'Sorry, I could not connect to the AI service. Please try again.';

        if (error.name === 'AbortError') {
          errorMessage = 'The request took too long to complete. Please try asking a simpler question or try again later.';
        } else if (error.message?.includes('fetch')) {
          errorMessage = 'Network connection failed. Please check your internet connection and try again.';
        }

        // Retry logic for network errors (but not for timeouts)
        if (retryCount < 2 && error.name !== 'AbortError') {
          setTimeout(() => {
            // Restore the message and retry
            setChatMessage(userMessage);
            setChatHistory(prev => prev.slice(0, -1)); // Remove the user message
            handleSendMessage(e, retryCount + 1);
          }, 2000);

          setChatHistory(prev => [...prev, {
            role: 'ai',
            message: `Connection failed. Retrying in 2 seconds... (Attempt ${retryCount + 2}/3)`
          }]);
          return;
        }

        setChatHistory(prev => [...prev, {
          role: 'ai',
          message: errorMessage
        }]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.wav');

      const response = await fetch('http://127.0.0.1:5002/transcribe', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setChatMessage(data.transcribed_text);
      } else {
        setChatHistory(prev => [...prev, {
          role: 'ai',
          message: 'Sorry, I could not understand the audio. Please try again.'
        }]);
      }
    } catch (error) {
      console.error('Transcription error:', error);
      setChatHistory(prev => [...prev, {
        role: 'ai',
        message: 'Sorry, I could not connect to the transcription service.'
      }]);
    } finally {
      setIsLoading(false);
      setIsListening(false);
      setMediaRecorder(null);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsListening(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setChatHistory(prev => [...prev, {
        role: 'ai',
        message: 'Sorry, I could not access your microphone. Please check permissions.'
      }]);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  };

  const toggleMicrophone = () => {
    if (isLoading) return; // Don't allow recording while processing

    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const getColorClasses = (isSelected: boolean) => {
    return isSelected
      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
      : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md';
  };

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading chapters...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 shadow-lg flex flex-col h-full">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Chapters
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            10th Science
          </p>
        </div>

        <div className="p-4 space-y-2 overflow-y-auto flex-1 pb-32">
          {chapters.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No chapters available
              </p>
              <button
                onClick={() => navigate('/subjects')}
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Choose Another Subject
              </button>
            </div>
          ) : (
            chapters.map((chapter) => {
              const isSelected = selectedChapter === chapter.id;
              return (
                <button
                  key={chapter.id}
                  onClick={() => handleChapterSelect(chapter.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                    isSelected
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isSelected ? 'bg-blue-600' : 'bg-blue-500 text-white'
                    }`}>
                      {chapter.id}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm line-clamp-2">
                        {chapter.title}
                      </h3>
                      {chapter.description && (
                        <p className="text-xs opacity-75 mt-1 line-clamp-1">
                          {chapter.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        {selectedChapter ? (
          <div className="h-full">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {chapters.find(c => c.id === selectedChapter)?.title}
              </h1>
              {/* <div className="flex space-x-4">
                <button
                  onClick={handleContinue}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  take test
                </button>
              </div> */}
            </div>

            {/* Content Sections */}
            <div className="h-full flex flex-col">
              {/* Chat History Section */}
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col mb-20">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    AI Chat
                  </h2>
                  <button
                    onClick={() => {
                      if (selectedChapter) {
                        navigate(`/subject/test/${selectedChapter}`);
                      }
                    }}
                    disabled={!selectedChapter}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center space-x-2 ${
                      selectedChapter
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Generate Test</span>
                  </button>
                </div>

                <div className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg p-4 overflow-y-auto bg-gray-50 dark:bg-gray-700">
                  {chatHistory.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                      <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p>Start a conversation about this chapter</p>
                      <p className="text-sm opacity-75">Ask questions, get explanations, or practice problems</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatHistory.map((chat, index) => (
                        <div key={index} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-2xl px-4 py-2 rounded-lg ${
                            chat.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-500'
                          }`}>
                            <div className="text-sm prose dark:prose-invert max-w-none">
                              <ReactMarkdown
                                remarkPlugins={[remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                              >
                                {chat.message}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-white dark:bg-gray-600 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-500 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                              </div>
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {isListening ? 'Processing your voice...' : 'AI is analyzing your question...'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Select a Chapter
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose a chapter from the sidebar to view notes and formulas
              </p>
            </div>
          </div>
        )}
      </div>

      {/* AI Chatbot - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-40">
        <div className="max-w-4xl mx-auto p-4">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
            {/* AI Icon */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>

            {/* Input Area */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ask AI about this chapter... (e.g., 'Explain chemical reactions')"
                className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />

              {/* Microphone Button */}
              <button
                type="button"
                onClick={toggleMicrophone}
                disabled={isLoading}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-all duration-200 ${
                  isListening
                    ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 animate-pulse shadow-lg'
                    : isLoading
                    ? 'bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500 hover:shadow-md'
                }`}
                title={
                  isLoading
                    ? 'Processing audio...'
                    : isListening
                    ? 'Click to stop recording'
                    : 'Click to start voice input'
                }
              >
                {isListening ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 6h12v12H6z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!chatMessage.trim() || isLoading}
              className={`flex-shrink-0 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                chatMessage.trim() && !isLoading
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transform hover:scale-105'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-2 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>

          {/* Quick Suggestions */}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => !isLoading && setChatMessage("Explain the key concepts in this chapter")}
              disabled={isLoading}
              className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              💡 Key concepts
            </button>
            <button
              onClick={() => !isLoading && setChatMessage("Give me practice questions")}
              disabled={isLoading}
              className="px-3 py-1 text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📝 Practice questions
            </button>
            <button
              onClick={() => !isLoading && setChatMessage("Help me understand formulas")}
              disabled={isLoading}
              className="px-3 py-1 text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🧮 Formula help
            </button>
          </div>
        </div>
      </div>

      {/* Add bottom padding to prevent content being hidden behind fixed chatbot */}
      <div className="h-32"></div>
    </main>
  );
}