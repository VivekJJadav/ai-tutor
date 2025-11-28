# tutor/views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import requests
import google.generativeai as genai
import os
import logging
from .models import Subject, ChatMessage

# Set up logging
logger = logging.getLogger(__name__)

def list_available_gemini_models():
    """List available Gemini models for debugging"""
    try:
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            return []
        genai.configure(api_key=api_key)
        models = genai.list_models()
        return [model.name for model in models if 'generateContent' in model.supported_generation_methods]
    except Exception as e:
        logger.error(f"Error listing available models: {str(e)}")
        return []

def ajax_login_required(func):
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        return func(request, *args, **kwargs)
    return wrapper

def get_gemini_response(user_message, chapter_id=None):
    """Generate response using Gemini API"""
    try:
        logger.info(f"Starting Gemini API request for message: {user_message[:50]}...")

        # Configure Gemini (you'll need to set GOOGLE_API_KEY environment variable)
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            logger.error("GOOGLE_API_KEY environment variable not set")
            return None, "Gemini API key not configured"

        logger.info("API key found, configuring Gemini...")
        genai.configure(api_key=api_key)

        try:
            # Try latest models, fallback to alternatives if needed
            # Order: newest to oldest, most reliable first
            model_names = ['gemini-2.0-flash-exp', 'gemini-2.0-flash', 'gemini-1.5-pro']
            model = None
            model_name = None

            for model_name in model_names:
                try:
                    model = genai.GenerativeModel(model_name)
                    logger.info(f"Gemini model {model_name} initialized successfully")
                    break
                except Exception as e:
                    logger.warning(f"Failed to initialize {model_name}: {str(e)}")
                    continue

            if not model:
                # List available models for debugging
                available_models = list_available_gemini_models()
                error_msg = f"Failed to initialize any Gemini model. Tried: {', '.join(model_names)}"
                if available_models:
                    error_msg += f". Available models: {', '.join(available_models)}"
                logger.error(error_msg)
                return None, error_msg
        except Exception as config_error:
            logger.error(f"Error configuring Gemini: {str(config_error)}")
            return None, f"Gemini configuration error: {str(config_error)}"

        # Create context-aware prompt for educational content
        system_prompt = """You are an AI tutor helping students with their studies.
        Provide clear, educational explanations appropriate for high school students.
        Focus on helping students understand concepts rather than just giving answers.
        If asked about specific chapters, relate your response to standard curriculum topics."""

        # Add chapter context if available
        chapter_context = ""
        if chapter_id:
            logger.info(f"Adding chapter context for chapter_id: {chapter_id}")
            # Map chapter IDs to topics (based on the science chapters from the view)
            science_chapters = {
                1: 'Chemical Reactions and Equations',
                2: 'Acids, Bases and Salts',
                3: 'Metals and Non-metals',
                4: 'Carbon and its Compounds',
                5: 'Life Processes',
                6: 'Control and Coordination',
                7: 'How do Organisms Reproduce?',
                8: 'Heredity',
                9: 'Light – Reflection and Refraction',
                10: 'The Human Eye and the Colourful World',
                11: 'Electricity',
                12: 'Magnetic Effects of Electric Current',
                13: 'Our Environment'
            }

            chapter_topic = science_chapters.get(chapter_id, "General Science")
            chapter_context = f"This question is related to the chapter: {chapter_topic}. "

        full_prompt = f"{system_prompt}\n\n{chapter_context}Student question: {user_message}"
        logger.info("Sending request to Gemini API...")

        try:
            response = model.generate_content(full_prompt)
            if response and hasattr(response, 'text') and response.text:
                logger.info("Gemini API response received successfully")
                return response.text, None
            else:
                logger.error("Gemini API returned empty or invalid response")
                return None, "Gemini API returned empty response"
        except Exception as api_error:
            logger.error(f"Gemini API call failed: {str(api_error)}")
            return None, f"Gemini API call error: {str(api_error)}"

    except Exception as e:
        logger.error(f"Unexpected error in get_gemini_response: {str(e)}")
        return None, f"Gemini error: {str(e)}"

@ajax_login_required
def subjects_view(request):
    subjects = Subject.objects.all()
    subjects_data = [
        {
            'id': subject.id,
            'name': subject.name
        }
        for subject in subjects
    ]
    return JsonResponse({'subjects': subjects_data})

@ajax_login_required
def chapters_view(request, subject_id):
    try:
        from accounts.models import StudentProfile
        profile = StudentProfile.objects.get(user=request.user)
        # Identify subject
        subject = Subject.objects.get(id=subject_id)

        if not profile.standard_selected:
            return JsonResponse({'error': 'Standard not selected'}, status=400)

        standard = profile.standard

        # Add debug logging
        logger.info(f"chapters_view - subject_id: {subject_id}, subject.name: {subject.name}, standard: {standard}, standard_selected: {profile.standard_selected}")

        if not standard or not str(standard).strip():
            logger.warning(f"chapters_view - standard is None or empty for user: {request.user}")
            return JsonResponse({'error': 'Standard not set'}, status=400)

        # Hard-coded 10th Science chapters; accept minor naming variants
        normalized_subject = subject.name.replace(' ', '').lower()
        is_science = 'science' in normalized_subject

        # Check if standard is 10th - handle both '10th' and '10' formats
        standard_str = str(standard).strip().lower()
        is_10th = standard_str.startswith('10')

        logger.info(f"chapters_view - normalized_subject: {normalized_subject}, is_science: {is_science}, standard_str: {standard_str}, is_10th: {is_10th}")

        if is_science and is_10th:
            science_chapters = [
                'Chemical Reactions and Equations',
                'Acids, Bases and Salts',
                'Metals and Non-metals',
                'Carbon and its Compounds',
                'Life Processes',
                'Control and Coordination',
                'How do Organisms Reproduce?',
                'Heredity',
                'Light – Reflection and Refraction',
                'The Human Eye and the Colourful World',
                'Electricity',
                'Magnetic Effects of Electric Current',
                'Our Environment'
            ]

            chapters_data = [
                {
                    'id': index + 1,  # synthetic id
                    'title': f"Chapter {index + 1} {title}",
                    'order': index + 1,
                    'subject_id': subject_id
                }
                for index, title in enumerate(science_chapters)
            ]
            return JsonResponse(chapters_data, safe=False)

        # For any other subject or standard, return empty list for now
        return JsonResponse([], safe=False)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@ajax_login_required
def get_chat_history(request):
    try:
        subject_id = request.GET.get('subject_id')
        chapter_id = request.GET.get('chapter_id')
        
        if not subject_id or not chapter_id:
            return JsonResponse({'error': 'Missing subject_id or chapter_id'}, status=400)
            
        messages = ChatMessage.objects.filter(
            user=request.user,
            subject_id=subject_id,
            chapter_index=chapter_id
        ).order_by('created_at')
        
        history = [
            {
                'role': msg.role,
                'message': msg.message,
                'created_at': msg.created_at.isoformat()
            }
            for msg in messages
        ]
        
        return JsonResponse({'history': history})
    except Exception as e:
        logger.error(f"Error fetching chat history: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
@ajax_login_required
def chat_view(request):
    try:
        subject_id = request.GET.get('subject_id')
        chapter_id = request.GET.get('chapter_id')
        
        if not subject_id or not chapter_id:
            return JsonResponse({'error': 'Missing subject_id or chapter_id'}, status=400)
            
        messages = ChatMessage.objects.filter(
            user=request.user,
            subject_id=subject_id,
            chapter_index=chapter_id
        ).order_by('created_at')
        
        history = [
            {
                'role': msg.role,
                'message': msg.message,
                'created_at': msg.created_at.isoformat()
            }
            for msg in messages
        ]
        
        return JsonResponse({'history': history})
    except Exception as e:
        logger.error(f"Error fetching chat history: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
@ajax_login_required
def chat_view(request):
    try:
        logger.info(f"Chat request received from user: {request.user}")

        # Parse request body
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in request body: {str(e)}")
            return JsonResponse({'error': 'Invalid JSON format'}, status=400)

        user_message = data.get('message', '').strip()
        chapter_id = data.get('chapter_id')
        subject_id = data.get('subject_id') # New field

        logger.info(f"Processing message: {user_message[:50]}..., chapter_id: {chapter_id}, subject_id: {subject_id}")

        if not user_message:
            logger.warning("Empty message received")
            return JsonResponse({'error': 'Message is required'}, status=400)

        # Save User Message
        if subject_id and chapter_id:
            try:
                ChatMessage.objects.create(
                    user=request.user,
                    subject_id=subject_id,
                    chapter_index=chapter_id,
                    role='user',
                    message=user_message
                )
            except Exception as e:
                logger.error(f"Failed to save user message: {e}")

        # Primary: Try RAG server first
        rag_server_url = "http://127.0.0.1:5002/generate"

        try:
            # Prepare payload for RAG server
            payload = {
                'message': user_message,
                'chapter_id': chapter_id
            }

            logger.info("Attempting connection to RAG server...")

            # Send POST request to RAG server
            response = requests.post(
                rag_server_url,
                json=payload,
                timeout=120  # Wait 2 minutes before falling back to Gemini
            )

            logger.info(f"RAG server response status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    ai_response = data.get('response')
                    logger.info("Successfully received response from RAG server")
                    
                    # Save AI Response
                    if subject_id and chapter_id:
                        try:
                            ChatMessage.objects.create(
                                user=request.user,
                                subject_id=subject_id,
                                chapter_index=chapter_id,
                                role='ai',
                                message=ai_response
                            )
                        except Exception as e:
                            logger.error(f"Failed to save AI message: {e}")

                    return JsonResponse({
                        'response': ai_response,
                        'success': True,
                        'source': 'rag_model'
                    })
                else:
                    logger.warning(f"RAG server returned error: {data.get('error')}")
                    # Fallback to Gemini
                    pass
            else:
                logger.warning(f'RAG server error: {response.status_code}')
                # Fallback to Gemini
                pass

        except requests.exceptions.ConnectionError:
            logger.warning("RAG server not available, falling back to Gemini...")
        except requests.exceptions.Timeout:
            logger.warning("RAG server timed out, falling back to Gemini...")
        except Exception as model_error:
            logger.warning(f"RAG server error: {str(model_error)}, falling back to Gemini...")

        # Fallback: Use Gemini when fine-tuned model is not available
        logger.info("Using Gemini as fallback...")
        gemini_response, gemini_error = get_gemini_response(user_message, chapter_id)

        if gemini_response:
            logger.info("Successfully generated response using Gemini fallback")
            
            # Save AI Response (Gemini)
            if subject_id and chapter_id:
                try:
                    ChatMessage.objects.create(
                        user=request.user,
                        subject_id=subject_id,
                        chapter_index=chapter_id,
                        role='ai',
                        message=gemini_response
                    )
                except Exception as e:
                    logger.error(f"Failed to save AI message: {e}")

            return JsonResponse({
                'response': gemini_response,
                'success': True,
                'source': 'gemini_fallback'
            })
        else:
            logger.error(f"Both fine-tuned model and Gemini failed. Gemini error: {gemini_error}")
            return JsonResponse({
                'error': f'Both fine-tuned model and Gemini failed. Gemini error: {gemini_error}',
                'success': False
            }, status=500)

    except Exception as e:
        logger.error(f"Unexpected error in chat_view: {str(e)}", exc_info=True)
        return JsonResponse({
            'error': f'Internal server error: {str(e)}',
            'success': False
        }, status=500)