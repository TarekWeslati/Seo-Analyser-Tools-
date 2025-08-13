import os
import json
import firebase_admin
import google.generativeai as genai
from firebase_admin import credentials, auth, firestore
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# Import your services
from services.website_analysis import get_website_analysis, generate_pdf_report, ai_rewrite_seo_content, ai_refine_content, ai_broken_link_suggestions
from services.article_analysis import analyze_article_content, rewrite_article

# Get Firebase service account key and Gemini API variables from environment variables
firebase_service_account_key_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY_JSON")
gemini_api_key = os.getenv("GEMINI_API_KEY")

# Initialize Flask with the correct template and static folders
# Note: The paths are relative to the location of app.py
# The static_folder is now pointing to the 'public' folder in frontend
app = Flask(__name__,
            static_folder='../frontend/public',
            template_folder='../frontend/public')
CORS(app)

if firebase_service_account_key_json:
    try:
        cred_dict = json.loads(firebase_service_account_key_json)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        db = firestore.client() # Initialize Firestore
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

# This route serves the main page (index.html) from the correct path.
@app.route('/')
def home():
    """
    Serves the index.html file from the 'frontend/public' directory.
    """
    return send_from_directory(app.template_folder, 'index.html')


# This route serves all static files (like CSS, JS, etc.) from their correct subdirectories.
# The path in the HTML will be /css/style.css or /js/main.js
@app.route('/<path:filename>')
def serve_static(filename):
    """
    Serves static files from the 'frontend/public' directory and its subdirectories.
    """
    return send_from_directory(app.static_folder, filename)


@app.route('/analyze_website', methods=['POST'])
def analyze_website_route():
    data = request.get_json()
    url = data.get('url', '')
    lang = request.headers.get('Accept-Language', 'en')

    if not url:
        return jsonify({"error": "URL is required"}), 400
    
    try:
        analysis_results = get_website_analysis(url, lang=lang)
        if analysis_results.get("error"):
            return jsonify({"error": analysis_results["error"]}), 500
        return jsonify(analysis_results), 200
    except Exception as e:
        print(f"Error during website analysis: {e}")
        return jsonify({"error": "Failed to analyze website. Please try again later."}), 500

# Your other routes will go here
# ... (rest of your existing routes)

@app.route('/analyze_content', methods=['POST'])
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

@app.route('/rewrite_article', methods=['POST'])
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
