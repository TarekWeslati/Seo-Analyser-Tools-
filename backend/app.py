import os
import json
import firebase_admin
import google.generativeai as genai
from firebase_admin import credentials, auth, firestore
from flask import Flask, request, jsonify, send_from_directory, make_response
from flask_cors import CORS
from backend.services.website_analysis import get_website_analysis, generate_pdf_report, ai_rewrite_seo_content, ai_refine_content, ai_broken_link_suggestions
from backend.services.article_analysis import analyze_article_content, rewrite_article

# Get Firebase service account key and Gemini API key from environment variables
firebase_service_account_key_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY_JSON")
gemini_api_key = os.getenv("GEMINI_API_KEY")

if firebase_service_account_key_json:
    try:
        cred_dict = json.loads(firebase_service_account_key_json)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        db = firestore.client()  # Initialize Firestore
        print("Firebase Admin SDK and Firestore initialized successfully.")
    except Exception as e:
        print(f"Error initializing Firebase Admin SDK: {e}")
        print("Firebase Admin SDK will not be available.")
else:
    print("FIREBASE_SERVICE_ACCOUNT_KEY_JSON environment variable not set. Firebase Admin SDK will not be initialized.")

# Initialize Gemini API
if gemini_api_key:
    try:
        genai.configure(api_key=gemini_api_key)
        print("Gemini API key configured successfully.")
    except Exception as e:
        print(f"Error configuring Gemini API: {e}")
        print("Gemini API will not be available.")

# Initialize Flask app
app = Flask(__name__, static_folder='../static')
CORS(app)

@app.route('/')
def serve_index():
    # This route will serve your main HTML file
    return send_from_directory('../', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    # This route will serve all other static files (like JS and CSS)
    # The path to 'static' is now defined in the Flask app initialization
    # It's assumed your static files are in a directory named 'static' at the project root
    if path.startswith('static/'):
        return send_from_directory('../', path)
    return send_from_directory('../', path)

@app.route('/api/analyze_website', methods=['POST'])
def analyze_website():
    data = request.get_json()
    url = data.get('url', '')
    if not url:
        return jsonify({"error": "URL is required"}), 400
    try:
        analysis_results = get_website_analysis(url)
        return jsonify(analysis_results), 200
    except Exception as e:
        print(f"Error during website analysis: {e}")
        return jsonify({"error": "Failed to analyze website"}), 500

@app.route('/api/rewrite_seo_content', methods=['POST'])
def rewrite_seo_content_route():
    data = request.get_json()
    content = data.get('content', '')
    lang = data.get('lang', 'en')
    if not content:
        return jsonify({"error": "Content is required"}), 400
    try:
        rewritten_content = ai_rewrite_seo_content(content, lang=lang)
        return jsonify({"rewritten_content": rewritten_content}), 200
    except Exception as e:
        print(f"Error during SEO content rewrite: {e}")
        return jsonify({"error": "Failed to rewrite SEO content"}), 500
    
@app.route('/api/refine_content', methods=['POST'])
def refine_content_route():
    data = request.get_json()
    text_to_refine = data.get('text_to_refine', '')
    lang = request.headers.get('Accept-Language', 'en')

    if not text_to_refine:
        return jsonify({"error": "Text to refine is required"}), 400

    try:
        refined_data = ai_refine_content(text_to_refine, lang=lang)
        if refined_data.get("error"):
            return jsonify({"error": refined_data["error"]}), 500
        return jsonify(refined_data), 200
    except Exception as e:
        print(f"Error during AI content refinement: {e}")
        return jsonify({"error": "Failed to refine content. Please try again later."}), 500

@app.route('/api/analyze_article', methods=['POST'])
def analyze_article():
    data = request.get_json()
    article_text = data.get('article_text', '')
    lang = request.headers.get('Accept-Language', 'en')

    if not article_text:
        return jsonify({"error": "Article text is required"}), 400

    try:
        analysis_results = analyze_article_content(article_text, lang=lang)
        if analysis_results.get("error"):
            return jsonify({"error": analysis_results["error"]}), 500
        return jsonify(analysis_results), 200
    except Exception as e:
        print(f"Error during article content analysis: {e}")
        return jsonify({"error": "Failed to analyze article content. Please try again later."}), 500

@app.route('/api/rewrite_article', methods=['POST'])
def rewrite_article_route():
    data = request.get_json()
    article_text = data.get('article_text', '')
    lang = request.headers.get('Accept-Language', 'en')

    if not article_text:
        return jsonify({"error": "Article text is required"}), 400

    try:
        rewritten_data = rewrite_article(article_text, lang=lang)
        if rewritten_data.get("error"):
            return jsonify({"error": rewritten_data["error"]}), 500
        return jsonify(rewritten_data), 200
    except Exception as e:
        print(f"Error during article rewrite: {e}")
        return jsonify({"error": "Failed to rewrite article. Please try again later."}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=os.environ.get('PORT', 5000), debug=True)
