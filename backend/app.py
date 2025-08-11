import os
import json
import firebase_admin
from firebase_admin import credentials, auth
from flask import Flask, request, jsonify, send_from_directory, make_response
from flask_cors import CORS
from backend.services.website_analysis import get_website_analysis, generate_pdf_report, ai_rewrite_seo_content, ai_refine_content, ai_broken_link_suggestions
from backend.services.article_analysis import analyze_article_content, rewrite_article

# Get the Firebase service account key from environment variable
firebase_service_account_key_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY_JSON")

if firebase_service_account_key_json:
    try:
        cred_dict = json.loads(firebase_service_account_key_json)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        print("Firebase Admin SDK initialized successfully.")
    except Exception as e:
        print(f"Error initializing Firebase Admin SDK: {e}")
        print("Firebase Admin SDK will not be available.")
else:
    print("FIREBASE_SERVICE_ACCOUNT_KEY_JSON environment variable not set. Firebase Admin SDK will not be initialized.")

# Define the path to the frontend/public directory relative to the current file (app.py)
# This assumes app.py is in backend/ and frontend/public is at ../frontend/public
frontend_public_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public')

app = Flask(__name__,
            static_folder=frontend_public_path, # Serve all frontend files from here
            static_url_path='/') # Serve them from the root URL

# Configure CORS to allow requests from your Render domain and localhost
CORS(app, resources={r"/*": {"origins": ["https://analyzer.oxabite.com", "http://localhost:5000"]}}, supports_credentials=True, allow_headers=["Authorization", "Content-Type"])

@app.route('/')
def index():
    # Serve index.html directly from the static folder for the root path
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/article_analyzer.html')
def article_analyzer_page():
    # Serve article_analyzer.html directly from the static folder
    return send_from_directory(app.static_folder, 'article_analyzer.html')

@app.route('/favicon.ico')
def favicon():
    # Serve favicon.ico directly from the static folder
    return send_from_directory(app.static_folder, 'favicon.ico')

# All other static files like CSS, JS, locales will now be served automatically
# For example, a request to /static/css/style.css will look for
# frontend/public/static/css/style.css because static_folder is frontend_public_path
# and static_url_path is '/'.

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    try:
        user = auth.create_user(email=email, password=password)
        custom_token = auth.create_custom_token(user.uid)
        return jsonify({"message": "User registered successfully", "email": email, "token": custom_token.decode('utf-8')}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    try:
        user = auth.get_user_by_email(email)
        custom_token = auth.create_custom_token(user.uid)
        return jsonify({"message": "Logged in successfully", "email": email, "token": custom_token.decode('utf-8')}), 200
    except Exception as e:
        return jsonify({"error": "Invalid credentials or user not found."}), 401

@app.route('/verify_id_token', methods=['POST'])
def verify_id_token():
    data = request.get_json()
    id_token = data.get('idToken')

    if not id_token:
        return jsonify({"error": "ID token is required"}), 400

    try:
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
        email = decoded_token.get('email')
        return jsonify({"message": "Token verified successfully", "uid": uid, "email": email}), 200
    except Exception as e:
        return jsonify({"error": "Invalid ID token."}), 401

@app.before_request
def verify_token_middleware():
    # Allow static files (now under /static), auth routes, root path, HTML files, and favicon.ico without token verification
    # Note: With static_url_path='/', all files in frontend_public_path are served as static.
    # So /static/css/style.css maps to frontend_public_path/static/css/style.css
    if request.path.startswith('/static/') or \
       request.path in ['/', '/index.html', '/article_analyzer.html', '/register', '/login', '/verify_id_token', '/favicon.ico']:
        return # Allow access

    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "Authorization header missing."}), 401

    try:
        id_token = auth_header.split(' ')[1]
        decoded_token = auth.verify_id_token(id_token)
        request.user_id = decoded_token['uid']
    except Exception as e:
        return jsonify({"error": "Authentication required. Please log in."}), 401

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    url = data.get('url')
    lang = request.headers.get('Accept-Language', 'en')

    if not url:
        return jsonify({"error": "URL is required"}), 400

    try:
        analysis_results = get_website_analysis(url, lang=lang)
        return jsonify(analysis_results), 200
    except Exception as e:
        print(f"Error during website analysis: {e}")
        return jsonify({"error": "Failed to analyze website. Please try again later."}), 500

@app.route('/generate_report', methods=['POST'])
def generate_report():
    data = request.get_json()
    url = data.get('url')
    lang = request.headers.get('Accept-Language', 'en')

    if not url:
        return jsonify({"error": "URL is required"}), 400

    try:
        pdf_bytes = generate_pdf_report(url, lang=lang)
        if pdf_bytes:
            response = make_response(pdf_bytes)
            response.headers['Content-Type'] = 'application/pdf'
            response.headers['Content-Disposition'] = f'attachment; filename="{url.replace("http://", "").replace("https://", "").replace("/", "_")}_report.pdf"'
            return response
        else:
            return jsonify({"error": "Failed to generate PDF report."}), 500
    except Exception as e:
        print(f"Error generating PDF report: {e}")
        return jsonify({"error": "Failed to generate PDF report. Please try again later."}), 500

@app.route('/ai_rewrite_seo', methods=['POST'])
def ai_rewrite_seo():
    data = request.get_json()
    title = data.get('title', '')
    meta_description = data.get('meta_description', '')
    keywords = data.get('keywords', '')
    lang = request.headers.get('Accept-Language', 'en')

    try:
        suggestions = ai_rewrite_seo_content(title, meta_description, keywords, lang=lang)
        return jsonify(suggestions), 200
    except Exception as e:
        print(f"Error during AI SEO rewrite: {e}")
        return jsonify({"error": "Failed to generate AI SEO rewrites."}), 500

@app.route('/ai_refine_content', methods=['POST'])
def ai_refine_content():
    data = request.get_json()
    text_sample = data.get('text_sample', '')
    lang = request.headers.get('Accept-Language', 'en')

    try:
        refined_content = ai_refine_content(text_sample, lang=lang)
        return jsonify(refined_content), 200
    except Exception as e:
        print(f"Error during AI content refinement: {e}")
        return jsonify({"error": "Failed to refine content."}), 500

@app.route('/ai_broken_link_suggestions', methods=['POST'])
def ai_broken_link_suggestions_route():
    data = request.get_json()
    broken_links = data.get('broken_links', [])
    lang = request.headers.get('Accept-Language', 'en')

    try:
        suggestions = ai_broken_link_suggestions(broken_links, lang=lang)
        return jsonify(suggestions), 200
    except Exception as e:
        print(f"Error during AI broken link suggestions: {e}")
        return jsonify({"error": "Failed to get broken link suggestions."}), 500

@app.route('/analyze_article_content', methods=['POST'])
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
