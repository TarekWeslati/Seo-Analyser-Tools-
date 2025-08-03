import os
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
import json
import firebase_admin
from firebase_admin import credentials, auth, firestore
from datetime import datetime

# Import services and utilities with full relative paths from the project root.
from backend.services.domain_analysis import get_domain_analysis
from backend.services.pagespeed_analysis import get_pagespeed_insights
from backend.services.seo_analysis import perform_seo_analysis, get_content_length, check_robots_txt, check_sitemap_xml
from backend.services.ux_analysis import analyze_user_experience, check_viewport_meta
from backend.services.ai_suggestions import get_ai_suggestions, generate_seo_rewrites, refine_content, get_adsense_readiness_assessment, get_broken_link_fix_suggestions, analyze_article_content_ai, rewrite_article_ai
from backend.utils.url_validator import is_valid_url
from backend.utils.pdf_generator import generate_pdf_report

# Define the correct paths for static files and templates.
template_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public'))
static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public'))

app = Flask(__name__,
            template_folder=template_dir,
            static_folder=static_dir,
            static_url_path='/')
CORS(app)

# Initialize Firebase Admin SDK
try:
    if not firebase_admin._apps:
        # Load service account key from environment variable
        firebase_service_account_json = os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY_JSON')
        if not firebase_service_account_json:
            raise ValueError("FIREBASE_SERVICE_ACCOUNT_KEY_JSON environment variable is not set.")
        
        # Ensure the JSON string is parsed correctly
        cred = credentials.Certificate(json.loads(firebase_service_account_json))
        firebase_admin.initialize_app(cred)
    db = firestore.client()
except Exception as e:
    print(f"Error initializing Firebase Admin SDK: {e}")
    # Consider how to handle this in production (e.g., exit, log to external service)

# Ensure API keys are loaded from environment variables
app.config['PAGESPEED_API_KEY'] = os.getenv('PAGESPEED_API_KEY')
app.config['GEMINI_API_KEY'] = os.getenv('GEMINI_API_KEY')

last_analysis_results = {}

# Helper to get current user ID from token
def get_current_user_id():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None
    try:
        id_token = auth_header.split('Bearer ')[1]
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token['uid']
    except Exception as e:
        print(f"Error verifying auth token: {e}")
        return None

# Route to serve the main frontend HTML file
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

# New route for the Article Analyzer page
@app.route('/article_analyzer.html')
def article_analyzer_page():
    return send_from_directory(app.static_folder, 'article_analyzer.html')

# Route to serve other static files (like CSS and JS)
@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)

@app.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    try:
        user = auth.create_user(email=email, password=password)
        # Store user data in Firestore
        user_ref = db.collection('users').document(user.uid)
        user_ref.set({
            'email': user.email,
            'plan': 'free',  # Default plan
            'analysis_count': 0,
            'last_login': firestore.SERVER_TIMESTAMP # Use server timestamp
        })
        return jsonify({"message": "User registered successfully.", "uid": user.uid}), 201
    except Exception as e:
        if 'email-already-exists' in str(e):
            return jsonify({"error": "Email already registered."}), 409
        return jsonify({"error": str(e)}), 500

@app.route('/login', methods=['POST'])
def login_user():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    try:
        user = auth.get_user_by_email(email)
        custom_token = auth.create_custom_token(user.uid).decode('utf-8')

        # Update last_login in Firestore
        user_ref = db.collection('users').document(user.uid)
        user_ref.update({'last_login': firestore.SERVER_TIMESTAMP})

        return jsonify({"message": "Login successful.", "token": custom_token, "email": user.email}), 200
    except Exception as e:
        return jsonify({"error": "Invalid credentials or user not found."}), 401

@app.route('/verify_id_token', methods=['POST'])
def verify_id_token():
    """
    Verifies a Firebase ID token (from social login or email/password)
    and creates/updates user data in Firestore.
    """
    data = request.get_json()
    id_token = data.get('idToken')

    if not id_token:
        return jsonify({"error": "ID Token is required."}), 400

    try:
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
        email = decoded_token.get('email')
        display_name = decoded_token.get('name')
        photo_url = decoded_token.get('picture')

        user_ref = db.collection('users').document(uid)
        user_doc = user_ref.get()

        if not user_doc.exists:
            # New user, create entry in Firestore
            user_ref.set({
                'email': email,
                'display_name': display_name,
                'photo_url': photo_url,
                'plan': 'free',
                'analysis_count': 0,
                'last_login': firestore.SERVER_TIMESTAMP,
                'created_at': firestore.SERVER_TIMESTAMP
            })
            message = "New user created and logged in."
        else:
            # Existing user, update last login and potentially other fields
            user_ref.update({
                'last_login': firestore.SERVER_TIMESTAMP,
                'email': email, # Update email if it changed (e.g., social login)
                'display_name': display_name,
                'photo_url': photo_url
            })
            message = "Existing user logged in."

        return jsonify({"message": message, "uid": uid, "email": email}), 200

    except Exception as e:
        print(f"Error verifying ID token: {e}")
        return jsonify({"error": "Invalid or expired ID token."}), 401


@app.route('/analyze', methods=['POST'])
def analyze_website():
    global last_analysis_results
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "Authentication required. Please log in."}), 401

    print(f"User {user_id} is performing analysis.")

    data = request.get_json()
    url = data.get('url')
    lang = request.headers.get('Accept-Language', 'en').split(',')[0].split('-')[0]

    if not url or not is_valid_url(url):
        return jsonify({"error": "Invalid URL provided."}), 400

    # --- Freemium Logic Placeholder ---
    # In a real app, you'd fetch user_doc here and check their 'plan' and 'analysis_count'
    # For now, we allow all authenticated users to analyze.
    # user_ref = db.collection('users').document(user_id)
    # user_doc = user_ref.get()
    # if user_doc.exists:
    #     user_data = user_doc.to_dict()
    #     if user_data.get('plan') == 'free' and user_data.get('analysis_count', 0) >= FREE_TIER_LIMIT:
    #         return jsonify({"error": "Free tier limit reached. Please upgrade to premium."}), 403
    #     # Increment analysis count
    #     user_ref.update({'analysis_count': firestore.Increment(1)})
    # --- End Freemium Logic Placeholder ---


    results = {}
    try:
        domain_data = get_domain_analysis(url)
        results['domain_authority'] = domain_data

        pagespeed_data = get_pagespeed_insights(url, app.config['PAGESPEED_API_KEY'])
        results['page_speed'] = pagespeed_data

        seo_data = perform_seo_analysis(url)
        results['seo_quality'] = seo_data

        if 'page_text' in seo_data.get('elements', {}):
            content_len_data = get_content_length(seo_data['elements']['page_text'])
            results['seo_quality']['elements']['content_length'] = content_len_data

        robots_present = check_robots_txt(url)
        sitemap_present = check_sitemap_xml(url)
        results['seo_quality']['elements']['robots_txt_present'] = robots_present
        results['seo_quality']['elements']['sitemap_xml_present'] = sitemap_present

        ux_data = analyze_user_experience(url)
        results['user_experience'] = ux_data

        if 'raw_html' in ux_data:
            viewport_meta_present = check_viewport_meta(ux_data['raw_html'])
            results['user_experience']['viewport_meta_present'] = viewport_meta_present
        else:
            results['user_experience']['viewport_meta_present'] = False

        results['extracted_text_sample'] = "No content extracted for AI analysis."
        if results['seo_quality'] and results['seo_quality'].get('elements') and results['seo_quality']['elements'].get('page_text'):
            results['extracted_text_sample'] = results['seo_quality']['elements']['page_text'][:2000]

        ai_data = get_ai_suggestions(url, results, lang)
        results['ai_insights'] = ai_data

        adsense_assessment = get_adsense_readiness_assessment(results, lang)
        results['adsense_readiness'] = adsense_assessment

        broken_links = results.get('seo_quality', {}).get('elements', {}).get('broken_links', [])
        if broken_links and isinstance(broken_links, list) and len(broken_links) > 0:
            broken_link_suggestions = get_broken_link_fix_suggestions(broken_links, lang)
            results['broken_link_suggestions'] = broken_link_suggestions
        else:
            results['broken_link_suggestions'] = {"suggestions": "No broken links found to suggest fixes for."}

        last_analysis_results = results
        return jsonify(results), 200

    except Exception as e:
        print(f"Critical Error during analysis: {e}")
        return jsonify({"error": "An unexpected error occurred during analysis.", "details": str(e)}), 500

@app.route('/generate_report', methods=['POST'])
def generate_report():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "Authentication required. Please log in."}), 401

    global last_analysis_results
    url = request.get_json().get('url')

    analysis_results = last_analysis_results

    if not analysis_results or not url:
        return jsonify({"error": "Missing analysis results or URL for report generation."}), 400

    # --- Freemium Logic Placeholder for PDF ---
    # In a real app, you'd fetch user_doc here and check their 'plan'
    # if user_data.get('plan') == 'free':
    #     return jsonify({"error": "PDF export is a premium feature. Please upgrade."}), 403
    # --- End Freemium Logic Placeholder ---

    try:
        pdf_path = generate_pdf_report(url, analysis_results)
        return send_file(pdf_path, as_attachment=True, download_name=f"{url.replace('https://', '').replace('http://', '')}_analysis_report.pdf", mimetype='application/pdf')
    except Exception as e:
        print(f"Error generating PDF report: {e}")
        return jsonify({"error": "Failed to generate PDF report.", "details": str(e)}), 500

@app.route('/ai_rewrite_seo', methods=['POST'])
def ai_rewrite_seo():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "Authentication required. Please log in."}), 401

    # --- Freemium Logic Placeholder for AI Tools ---
    # In a real app, you'd fetch user_doc here and check their 'plan' and AI usage limits
    # if user_data.get('plan') == 'free' and user_data.get('ai_rewrites_count', 0) >= FREE_TIER_AI_LIMIT:
    #     return jsonify({"error": "Free tier AI rewrite limit reached. Please upgrade."}), 403
    # --- End Freemium Logic Placeholder ---

    data = request.get_json()
    title = data.get('title')
    meta_description = data.get('meta_description')
    keywords = data.get('keywords')
    lang = request.headers.get('Accept-Language', 'en').split(',')[0].split('-')[0]

    if not title and not meta_description:
        return jsonify({"error": "No title or meta description provided for rewrite."}), 400

    try:
        rewrites = generate_seo_rewrites(title, meta_description, keywords, lang)
        return jsonify(rewrites), 200
    except Exception as e:
        print(f"Error generating AI SEO rewrites: {e}")
        return jsonify({"error": "Failed to generate AI SEO rewrites.", "details": str(e)}), 500

@app.route('/ai_refine_content', methods=['POST'])
def ai_refine_content():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "Authentication required. Please log in."}), 401

    data = request.get_json()
    text_sample = data.get('text_sample')
    lang = request.headers.get('Accept-Language', 'en').split(',')[0].split('-')[0]

    if not text_sample:
        return jsonify({"error": "No text sample provided for refinement."}), 400

    try:
        refinement = refine_content(text_sample, lang)
        return jsonify(refinement), 200
    except Exception as e:
        print(f"Error generating AI content refinement: {e}")
        return jsonify({"error": "Failed to generate AI content refinement.", "details": str(e)}), 500

@app.route('/analyze_article_content', methods=['POST'])
def analyze_article_content():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "Authentication required. Please log in."}), 401

    data = request.get_json()
    article_text = data.get('article_text')
    lang = request.headers.get('Accept-Language', 'en').split(',')[0].split('-')[0]

    if not article_text:
        return jsonify({"error": "No article text provided for analysis."}), 400

    try:
        analysis_results = analyze_article_content_ai(article_text, lang)
        return jsonify(analysis_results), 200
    except Exception as e:
        print(f"Error analyzing article content: {e}")
        return jsonify({"error": "Failed to analyze article content.", "details": str(e)}), 500

@app.route('/rewrite_article', methods=['POST'])
def rewrite_article():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "Authentication required. Please log in."}), 401

    data = request.get_json()
    article_text = data.get('article_text')
    lang = request.headers.get('Accept-Language', 'en').split(',')[0].split('-')[0]

    if not article_text:
        return jsonify({"error": "No article text provided for rewriting."}), 400

    try:
        rewritten_content = rewrite_article_ai(article_text, lang)
        return jsonify(rewritten_content), 200
    except Exception as e:
        print(f"Error rewriting article: {e}")
        return jsonify({"error": "Failed to rewrite article.", "details": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
