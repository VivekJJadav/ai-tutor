# AI Tutor - Interactive Learning Platform

An intelligent tutoring system that combines a Remix frontend, Django backend, and an advanced RAG-based AI to help students learn effectively.

## 🚀 Features

-   **Interactive Chat:** Ask questions and get answers based on your specific textbooks.
-   **Voice Input:** Speak your questions, preview the transcribed text, and get AI responses.
-   **Test Generation:** Automatically generate multiple-choice tests for any chapter.
-   **Chat History:** Save and review your past conversations.
-   **Subject Management:** Organize your learning by subjects and chapters.

## 🛠️ Tech Stack

-   **Frontend:** React, Remix, Tailwind CSS
-   **Backend:** Django, Django REST Framework
-   **Database:** SQLite (Development)
-   **AI Integration:** Connects to a custom RAG server (see `ai-tutor-rag` repo)

## 📦 Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/VivekJJadav/ai-tutor.git
    cd ai-tutor
    ```

2.  **Frontend Setup:**
    ```bash
    npm install
    npm run dev
    ```

3.  **Backend Setup:**
    ```bash
    cd ai_tutor
    python -m venv myenv
    source myenv/bin/activate  # On Windows: myenv\Scripts\activate
    pip install -r requirements.txt
    python manage.py migrate
    python manage.py runserver
    ```

## 🔗 Related Repositories

-   **RAG Server:** [ai-tutor-rag](https://github.com/VivekJJadav/ai-tutor-rag) - The AI engine powering this application.
