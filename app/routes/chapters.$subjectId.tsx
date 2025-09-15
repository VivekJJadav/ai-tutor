import type { Route } from "./+types/chapters.$subjectId";
import { useNavigate, useParams } from "react-router";
import { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";

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

  // ✅ Fetch chapters from Django backend
  const fetchChapters = async () => {
    if (!subjectId) return;

    try {
      setLoading(true);
      const response = await fetch(`http://127.0.0.1:8000/api/chapters/${subjectId}/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
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

  const handleContinue = () => {
    if (selectedChapter) {
      localStorage.setItem('selectedChapter', selectedChapter.toString());
      // Navigate to tutor/chat page or wherever appropriate
      navigate('/');
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
    <main className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl w-full mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Select Chapter
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Choose a chapter to start learning
            </p>
          </div>

          {chapters.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No chapters available for this subject yet.
              </p>
              <button
                onClick={() => navigate('/subjects')}
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Choose Another Subject
              </button>
            </div>
          ) : (
            <>
              {/* Chapters Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {chapters.map((chapter) => {
                  const isSelected = selectedChapter === chapter.id;
                  return (
                    <button
                      key={chapter.id}
                      onClick={() => handleChapterSelect(chapter.id)}
                      className={`p-6 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 text-left ${getColorClasses(isSelected)}`}
                    >
                      <div>
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                          <span className="text-white font-bold text-lg">
                            {chapter.id}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {chapter.title}
                        </h3>
                        {chapter.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {chapter.description}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Chapter Summary */}
              {selectedChapter && (
                <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Selected Chapter
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const chapter = chapters.find(c => c.id === selectedChapter);
                      return (
                        <span className="px-3 py-1 rounded-full text-sm font-medium text-white bg-blue-500">
                          {chapter?.title}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Continue Button */}
              <div className="text-center">
                <button
                  onClick={handleContinue}
                  disabled={!selectedChapter}
                  className={`px-8 py-3 rounded-lg text-lg font-medium transition-all duration-200 ${
                    selectedChapter
                      ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Start Learning
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}