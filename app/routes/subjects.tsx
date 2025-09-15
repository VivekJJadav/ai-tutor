import type { Route } from "./+types/subjects";
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Learning Dashboard - Education Portal" },
    { name: "description", content: "Your personalized learning dashboard" },
  ];
}

interface Subject {
  id: number;
  name: string;
  color: string;
}

interface Chapter {
  id: number;
  title: string;
  order: number;
  subject_id: number;
}

export default function SubjectsSelection() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [userInfo, setUserInfo] = useState({
    username: '',
    standard: '10th',
    language: 'en'
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  const colors = ['blue', 'green', 'purple', 'orange', 'teal', 'red', 'indigo', 'pink'];

  // Fetch subjects from Django backend
  const fetchSubjects = async () => {
    try {
      const response = await fetch("http://localhost:8001/api/subjects/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const backendSubjects = data.subjects || data;
        const mappedSubjects = backendSubjects.map((subject: any, index: number) => ({
          id: subject.id,
          name: subject.name,
          color: colors[index % colors.length]
        }));
        setSubjects(mappedSubjects);
      } else {
        console.error("Failed to fetch subjects");
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch chapters for selected subject
  const fetchChapters = async (subjectId: number) => {
    try {
      setChaptersLoading(true);
      const response = await fetch(`http://localhost:8001/api/chapters/${subjectId}/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const chaptersData = await response.json();
        setChapters(chaptersData);
      } else {
        console.error("Failed to fetch chapters");
        setChapters([]);
      }
    } catch (error) {
      console.error("Error fetching chapters:", error);
      setChapters([]);
    } finally {
      setChaptersLoading(false);
    }
  };

  // Fetch user info
  const fetchUserInfo = async () => {
    try {
      const response = await fetch("http://localhost:8001/api/auth/user-info/", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUserInfo({
          username: data.user.username,
          standard: data.user.standard || '10th',
          language: data.user.language || 'en'
        });
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  // Update standard
  const updateStandard = async (newStandard: string) => {
    try {
      setSettingsLoading(true);
      const response = await fetch("http://localhost:8001/api/auth/update-settings/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ standard: newStandard }),
      });

      if (response.ok) {
        setUserInfo(prev => ({ ...prev, standard: newStandard }));
        // Refresh chapters if a subject is selected
        if (selectedSubject) {
          fetchChapters(selectedSubject);
        }
      } else {
        console.error("Failed to update standard");
      }
    } catch (error) {
      console.error("Error updating standard:", error);
    } finally {
      setSettingsLoading(false);
    }
  };

  // Update language
  const updateLanguage = async (newLanguage: string) => {
    try {
      setSettingsLoading(true);
      const response = await fetch("http://localhost:8001/api/auth/update-settings/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ language: newLanguage }),
      });

      if (response.ok) {
        setUserInfo(prev => ({ ...prev, language: newLanguage }));
      } else {
        console.error("Failed to update language");
      }
    } catch (error) {
      console.error("Error updating language:", error);
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
    fetchUserInfo();
  }, []);

  const handleSubjectSelect = (subjectId: number) => {
    setSelectedSubject(subjectId);
    fetchChapters(subjectId);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:8001/api/auth/logout/", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.ok) {
        navigate("/");
      }
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/");
    }
  };

  const getColorClasses = (color: string, isSelected: boolean = false) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-500',
        hover: 'hover:bg-blue-600',
        text: 'text-blue-600',
        selected: isSelected ? 'bg-blue-600' : 'hover:bg-blue-50'
      },
      green: {
        bg: 'bg-green-500',
        hover: 'hover:bg-green-600',
        text: 'text-green-600',
        selected: isSelected ? 'bg-green-600' : 'hover:bg-green-50'
      },
      purple: {
        bg: 'bg-purple-500',
        hover: 'hover:bg-purple-600',
        text: 'text-purple-600',
        selected: isSelected ? 'bg-purple-600' : 'hover:bg-purple-50'
      },
      orange: {
        bg: 'bg-orange-500',
        hover: 'hover:bg-orange-600',
        text: 'text-orange-600',
        selected: isSelected ? 'bg-orange-600' : 'hover:bg-orange-50'
      },
      teal: {
        bg: 'bg-teal-500',
        hover: 'hover:bg-teal-600',
        text: 'text-teal-600',
        selected: isSelected ? 'bg-teal-600' : 'hover:bg-teal-50'
      },
      red: {
        bg: 'bg-red-500',
        hover: 'hover:bg-red-600',
        text: 'text-red-600',
        selected: isSelected ? 'bg-red-600' : 'hover:bg-red-50'
      },
      indigo: {
        bg: 'bg-indigo-500',
        hover: 'hover:bg-indigo-600',
        text: 'text-indigo-600',
        selected: isSelected ? 'bg-indigo-600' : 'hover:bg-indigo-50'
      },
      pink: {
        bg: 'bg-pink-500',
        hover: 'hover:bg-pink-600',
        text: 'text-pink-600',
        selected: isSelected ? 'bg-pink-600' : 'hover:bg-pink-50'
      },
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Bar with Subjects */}
      <nav className="bg-white dark:bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Education Portal
              </h1>
            </div>

            {/* Subjects Navigation */}
            <div className="hidden md:flex space-x-1">
              {subjects.map((subject) => {
                const isSelected = selectedSubject === subject.id;
                const colorClass = getColorClasses(subject.color, isSelected);
                return (
                  <button
                    key={subject.id}
                    onClick={() => handleSubjectSelect(subject.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isSelected
                        ? `${colorClass.bg} text-white`
                        : `text-gray-600 dark:text-gray-300 ${colorClass.selected} dark:hover:bg-gray-700`
                    }`}
                  >
                    {subject.name}
                  </button>
                );
              })}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {userInfo.username.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-50 border border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => {
                      setShowSettings(true);
                      setShowProfileDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Subjects Menu */}
        <div className="md:hidden bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <div className="px-4 py-3">
            <div className="grid grid-cols-2 gap-2">
              {subjects.map((subject) => {
                const isSelected = selectedSubject === subject.id;
                const colorClass = getColorClasses(subject.color, isSelected);
                return (
                  <button
                    key={subject.id}
                    onClick={() => handleSubjectSelect(subject.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isSelected
                        ? `${colorClass.bg} text-white`
                        : `text-gray-600 dark:text-gray-300 ${colorClass.selected}`
                    }`}
                  >
                    {subject.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedSubject ? (
          /* Hero Section */
          <div className="text-center py-16">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to Your Learning Dashboard
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                Please select the subject you want to learn from the navigation bar above
              </p>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                  Available Subjects
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {subjects.map((subject) => {
                    const colorClass = getColorClasses(subject.color);
                    return (
                      <button
                        key={subject.id}
                        onClick={() => handleSubjectSelect(subject.id)}
                        className={`p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-transparent transition-all duration-200 transform hover:scale-105 hover:shadow-lg ${colorClass.selected}`}
                      >
                        <div className={`w-12 h-12 ${colorClass.bg} rounded-full flex items-center justify-center mx-auto mb-3`}>
                          <span className="text-white font-bold text-lg">
                            {subject.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {subject.name}
                        </h4>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Chapters Section */
          <div>
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {subjects.find(s => s.id === selectedSubject)?.name} Chapters
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Select a chapter to start learning
                  </p>
                </div>
                {/* <button
                  onClick={() => setSelectedSubject(null)}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Back to Subjects
                </button> */}
              </div>
            </div>

            {chaptersLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading chapters...</p>
              </div>
            ) : chapters.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                  <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                    No chapters available for this subject yet.
                  </p>
                  <button
                    onClick={() => setSelectedSubject(null)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Choose Another Subject
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {chapters.map((chapter) => {
                  const subject = subjects.find(s => s.id === selectedSubject);
                  const colorClass = getColorClasses(subject?.color || 'blue');
                  return (
                    <div
                      key={chapter.id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 p-6 cursor-pointer border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 ${colorClass.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white font-bold text-lg">
                            {chapter.order}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {chapter.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Chapter {chapter.order}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <button
                          className={`w-full ${colorClass.bg} ${colorClass.hover} text-white px-4 py-2 rounded-lg transition-colors font-medium`}
                        >
                          Start Learning
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Language Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Language</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { code: 'en', name: 'English' },
                    { code: 'hi', name: 'हिंदी' },
                    { code: 'gu', name: 'ગુજરાતી' }
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => updateLanguage(lang.code)}
                      disabled={settingsLoading}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        userInfo.language === lang.code
                          ? 'bg-blue-500 text-white'
                          : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      } ${settingsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Standard Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Standard</h3>
                <div className="grid grid-cols-3 gap-2">
                  {['8th', '9th', '10th'].map((standard) => (
                    <button
                      key={standard}
                      onClick={() => updateStandard(standard)}
                      disabled={settingsLoading}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        userInfo.standard === standard
                          ? 'bg-blue-500 text-white'
                          : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      } ${settingsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {standard}
                    </button>
                  ))}
                </div>
              </div>

              {/* Close Button */}
              <div className="pt-4">
                <button
                  onClick={() => setShowSettings(false)}
                  disabled={settingsLoading}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {settingsLoading ? 'Updating...' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}