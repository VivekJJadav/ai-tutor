import type { Route } from "./+types/standards";
import { useNavigate } from "react-router";
import { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Select Standard - React Router App" },
    { name: "description", content: "Choose your educational standard" },
  ];
}

export default function StandardsSelection() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedStandard, setSelectedStandard] = useState<string | null>(null);

  const handleStandardSelect = async (standard: string) => {
    setSelectedStandard(standard);

    try {
      // Send standard selection to Django backend
      const response = await fetch("http://127.0.0.1:8000/api/auth/select-standard/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ standard }),
      });

      if (response.ok) {
        // Store standard preference in localStorage
        localStorage.setItem('selectedStandard', standard);
        // Navigate to subjects page after standard selection
        navigate('/subjects');
      } else {
        throw new Error("Failed to save standard selection");
      }
    } catch (error) {
      console.error("Error saving standard:", error);
      // Still store locally and navigate on error
      localStorage.setItem('selectedStandard', standard);
      navigate('/subjects');
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl w-full mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('standards.select')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('standards.choose')}
            </p>
          </div>

          {/* Standards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 8th Standard Button Card */}
            <button
              onClick={() => handleStandardSelect('8th')}
              className={`p-6 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                selectedStandard === '8th'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg'
                  : 'border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-500 hover:shadow-md'
              }`}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">8</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t('standards.eighth')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('standards.eighthDesc')}
                </p>
              </div>
            </button>

            {/* 9th Standard Button Card */}
            <button
              onClick={() => handleStandardSelect('9th')}
              className={`p-6 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                selectedStandard === '9th'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg'
                  : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 hover:shadow-md'
              }`}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">9</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t('standards.ninth')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('standards.ninthDesc')}
                </p>
              </div>
            </button>

            {/* 10th Standard Button Card */}
            <button
              onClick={() => handleStandardSelect('10th')}
              className={`p-6 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                selectedStandard === '10th'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                  : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md'
              }`}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">10</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t('standards.tenth')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('standards.tenthDesc')}
                </p>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('standards.changeLater')}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
