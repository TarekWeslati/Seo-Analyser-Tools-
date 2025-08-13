# app.py: The backend Flask application to handle API requests.
import os
import json
import firebase_admin
import google.generativeai as genai
from firebase_admin import credentials, auth, firestore
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from backend.services.website_analysis import get_website_analysis, generate_pdf_report, ai_rewrite_seo_content, ai_refine_content, ai_broken_link_suggestions
from backend.services.article_analysis import analyze_article_content, rewrite_article

# Get the Firebase service account key and Gemini API key from environment variables
firebase_service_account_key_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY_JSON")
gemini_api_key = os.getenv("GEMINI_API_KEY")

if firebase_service_account_key_json:
    try:
        # Load the service account key from the environment variable (JSON string)
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
else:
    print("GEMINI_API_KEY environment variable not set. Gemini API will not be configured.")

# Initialize the Flask app
app = Flask(__name__, static_folder='static')
CORS(app)  # Enable CORS for all routes

# Define routes for website analyzer
@app.route('/')
def serve_index():
    return send_from_directory(app.root_path, 'index.html')

@app.route('/static/locales/<filename>')
def serve_locales(filename):
    return send_from_directory(os.path.join(app.root_path, 'static', 'locales'), filename)

@app.route('/main.js')
def serve_main_js():
    return send_from_directory(app.root_path, 'main.js')

@app.route('/api/website-analyze', methods=['POST'])
def analyze_website():
    # Authentication check
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "Authorization token is missing"}), 401
    
    id_token = auth_header.split(' ')[1]
    try:
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
    except Exception as e:
        print(f"Token verification failed: {e}")
        return jsonify({"error": "Invalid or expired token"}), 401

    data = request.get_json()
    website_url = data.get('website_url', '')
    lang = request.headers.get('Accept-Language', 'en')

    if not website_url:
        return jsonify({"error": "Website URL is required"}), 400

    try:
        analysis_results = get_website_analysis(website_url, lang=lang)
        if analysis_results.get("error"):
            return jsonify({"error": analysis_results["error"]}), 500
        return jsonify(analysis_results), 200
    except Exception as e:
        print(f"Error during website analysis: {e}")
        return jsonify({"error": "Failed to analyze the website. Please try again later."}), 500

# Define routes for article analyzer
@app.route('/api/article-analyze', methods=['POST'])
def analyze_article():
    # Authentication check
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "Authorization token is missing"}), 401
    
    id_token = auth_header.split(' ')[1]
    try:
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
    except Exception as e:
        print(f"Token verification failed: {e}")
        return jsonify({"error": "Invalid or expired token"}), 401

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
