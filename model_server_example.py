"""
Example Model Server for AI Tutor
This is a simple Flask server that can be used as a template for your fine-tuned model server.

Run with: python model_server_example.py
"""

from flask import Flask, request, jsonify
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.route('/generate', methods=['POST'])
def generate():
    """
    Generate response based on user message and chapter_id
    
    Expected JSON payload:
    {
        "message": "user question here",
        "chapter_id": 1
    }
    
    Returns:
    {
        "success": true/false,
        "response": "AI generated response",
        "error": "error message if success is false"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        message = data.get('message', '').strip()
        chapter_id = data.get('chapter_id')
        
        if not message:
            return jsonify({
                'success': False,
                'error': 'Message is required'
            }), 400
        
        logger.info(f"Received request - message: {message[:50]}..., chapter_id: {chapter_id}")
        
        # TODO: Replace this with your actual fine-tuned model inference
        # This is just a placeholder that returns a simple response
        response_text = f"This is a placeholder response for your question about chapter {chapter_id}: {message}"
        
        # Example: You would integrate your model here
        # model = load_your_model()
        # response_text = model.generate(message, chapter_id)
        
        return jsonify({
            'success': True,
            'response': response_text
        })
        
    except Exception as e:
        logger.error(f"Error in generate endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'}), 200


if __name__ == '__main__':
    # Run on port 5001
    app.run(host='127.0.0.1', port=5001, debug=True)
