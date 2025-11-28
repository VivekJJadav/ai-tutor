# Gemini AI Fallback Setup

The AI Tutor now includes Gemini as a fallback when the primary model server fails.

## Setup Instructions

1. **Get a Gemini API Key**
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Sign in with your Google account
   - Create a new API key

2. **Configure Environment Variables**
   ```bash
   cd ai_tutor
   cp .env.example .env
   ```

3. **Add your API key to the .env file**
   ```
   GOOGLE_API_KEY=your_actual_api_key_here
   ```

4. **Restart the Django server**
   ```bash
   python manage.py runserver
   ```

## How it Works

- The system first tries to connect to the local model server at `http://127.0.0.1:5001/generate`
- If that fails (connection error, timeout, or server unavailable), it automatically falls back to Gemini
- Gemini responses are context-aware and tailored for educational content
- The frontend will receive the response normally, regardless of which AI service generated it

## Testing the Fallback

To test the Gemini fallback:
1. Make sure the local model server at port 5001 is **not** running
2. Try sending a message in the chat interface
3. The system should automatically use Gemini and display the response

## Error Handling

If both the local server and Gemini fail, you'll see specific error messages indicating what went wrong.