import os
import json
import firebase_admin
import google.generativeai as genai
from firebase_admin import credentials, auth, firestore
from flask import Flask, request, jsonify, send_from_directory, make_response
from flask_cors import CORS
from backend.services.website_analysis import get_website_analysis, generate_pdf_report, ai_rewrite_seo_content, ai_refine_content, ai_broken_link_suggestions
from backend.services.article_analysis import analyze_article_content, rewrite_article

# الحصول على مفتاح حساب الخدمة لـ Firebase ومتغيرات Gemini API من متغيرات البيئة
firebase_service_account_key_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY_JSON")
gemini_api_key = os.getenv("GEMINI_API_KEY")

if firebase_service_account_key_json:
    try:
        cred_dict = json.loads(firebase_service_account_key_json)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        db = firestore.client() # تهيئة Firestore
        print("Firebase Admin SDK and Firestore initialized successfully.")
    except Exception as e:
        print(f"Error initializing Firebase Admin SDK: {e}")
        print("Firebase Admin SDK will not be available.")
else:
    print("FIREBASE_SERVICE_ACCOUNT_KEY_JSON environment variable not set. Firebase Admin SDK will not be initialized.")

# تهيئة Gemini API
if gemini_api_key:
    try:
        genai.configure(api_key=gemini_api_key)
        print("Gemini API key configured successfully.")
    except Exception as e:
        print(f"Error configuring Gemini API: {e}")
else:
    print("GEMINI_API_KEY environment variable not set. Gemini AI services will not be available.")

# تحديد المسار إلى مجلد frontend/public
frontend_public_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public')

app = Flask(__name__,
            static_folder=frontend_public_path, # خدمة جميع ملفات الواجهة الأمامية من هنا
            static_url_path='/') # خدمتها من مسار الجذر

# تهيئة CORS للسماح بالطلبات من نطاق Render و localhost
CORS(app, resources={r"/*": {"origins": ["https://analyzer.oxabite.com", "http://localhost:5000"]}}, supports_credentials=True, allow_headers=["Authorization", "Content-Type"])

@app.route('/')
def index():
    """
    خدمة index.html مباشرة من المجلد الثابت للمسار الجذر.
    """
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/article_analyzer.html')
def article_analyzer_page():
    """
    خدمة article_analyzer.html مباشرة من المجلد الثابت.
    """
    return send_from_directory(app.static_folder, 'article_analyzer.html')

@app.route('/favicon.ico')
def favicon():
    """
    خدمة favicon.ico مباشرة من المجلد الثابت.
    """
    return send_from_directory(app.static_folder, 'favicon.ico')

# جميع الملفات الثابتة الأخرى مثل CSS و JS واللغات سيتم خدمتها تلقائيًا
# على سبيل المثال، طلب إلى /static/css/style.css سيبحث في
# frontend/public/static/css/style.css لأن static_folder هو frontend_public_path
# و static_url_path هو '/'.

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
    # السماح بالملفات الثابتة ومسارات التوثيق بدون التحقق من الرمز المميز
    if request.path.startswith('/static/') or \
       request.path in ['/', '/index.html', '/article_analyzer.html', '/register', '/login', '/verify_id_token', '/favicon.ico']:
        return # السماح بالوصول

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
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
