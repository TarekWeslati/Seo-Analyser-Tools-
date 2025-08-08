import os
import json
import firebase_admin
import google.generativeai as genai
import requests

from firebase_admin import credentials
from firebase_admin import firestore
from flask import Flask, jsonify, request
from flask_cors import CORS
from bs4 import BeautifulSoup
from urllib.parse import urljoin

# Initialize Flask app and CORS
app = Flask(__name__)
CORS(app)

# 1. Get Firebase credentials from environment variable
# (الحصول على مفاتيح Firebase من متغيرات البيئة)
firebase_credentials_json = os.environ.get('FIREBASE_SERVICE_ACCOUNT_KEY_JSON')
firebase_initialized = False

if firebase_credentials_json:
    try:
        # Convert JSON string to a Python dictionary
        # (تحويل سلسلة JSON إلى قاموس Python)
        cred = credentials.Certificate(json.loads(firebase_credentials_json))
        firebase_admin.initialize_app(cred)
        firebase_initialized = True
        print("Firebase initialized successfully.")
    except Exception as e:
        print(f"Error initializing Firebase with credentials: {e}")
else:
    print("Firebase credentials environment variable not found. Skipping initialization.")

# Initialize Firestore client ONLY if Firebase was initialized
# (تهيئة عميل Firestore فقط إذا تم تهيئة Firebase بنجاح)
if firebase_initialized:
    db = firestore.client()
    print("Firestore client initialized successfully.")
else:
    db = None
    print("Firestore client not initialized because Firebase credentials were not found.")


# 2. Get Gemini API key from environment variable
# (الحصول على مفتاح Gemini API من متغيرات البيئة)
gemini_api_key = os.environ.get('GEMINI_API_KEY')

if gemini_api_key:
    genai.configure(api_key=gemini_api_key)
    print("Gemini API key configured successfully.")
else:
    print("Gemini API key environment variable not found. Skipping configuration.")

# Initialize Gemini model
# (تهيئة نموذج Gemini)
try:
    if gemini_api_key:
        model = genai.GenerativeModel('gemini-1.5-pro-latest')
except Exception as e:
    print(f"Error initializing Gemini model: {e}")
    model = None

# A helper function to extract text content from a URL
# (دالة مساعدة لاستخراج المحتوى النصي من رابط URL)
def extract_text_from_url(url):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status() # Raise an exception for bad status codes
        soup = BeautifulSoup(response.content, 'html.parser')

        # Remove scripts and style tags
        for script_or_style in soup(['script', 'style']):
            script_or_style.extract()

        # Get the main text content, focusing on body or article tags
        text = soup.body.get_text()

        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for phrase in ' '.join(lines).split("  "))
        text = '\n'.join(chunk for chunk in chunks if chunk)
        
        return text

    except requests.RequestException as e:
        print(f"Error fetching URL: {e}")
        return None

# The root route to check if the backend is running
# (المسار الرئيسي للتحقق من أن الواجهة الخلفية تعمل)
@app.route('/')
def home():
    if firebase_initialized:
        return 'Backend is running. Firebase and Firestore are active.'
    else:
        return 'Backend is running. Firebase is NOT active.'

# A test route to check if the Gemini API is working.
# (مسار اختبار للتحقق من عمل Gemini API)
@app.route('/test-gemini', methods=['POST'])
def test_gemini():
    if not gemini_api_key or not model:
        return jsonify({"error": "Gemini API key not configured."}), 500

    try:
        prompt = "Hello, what's your name?"
        response = model.generate_content(prompt)
        return jsonify({"response": response.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# The main route to analyze a URL's content
# (المسار الرئيسي لتحليل محتوى رابط URL)
@app.route('/analyze_url', methods=['POST'])
def analyze_url():
    if not gemini_api_key or not model:
        return jsonify({"error": "Gemini API key not configured."}), 500
    
    if not request.json or 'url' not in request.json:
        return jsonify({"error": "URL not provided."}), 400

    url = request.json['url']
    print(f"Analyzing URL: {url}")

    # Extract text from the URL
    # (استخراج النص من رابط URL)
    text_content = extract_text_from_url(url)
    if not text_content:
        return jsonify({"error": "Failed to extract content from URL."}), 500

    # Create the prompt for Gemini API
    # (إنشاء المطالبة لـ Gemini API)
    prompt = f"""
    أنت محلل محتوى خبير. قم بتحليل هذا المقال أو المحتوى الموجود على الرابط التالي: {url}
    
    المحتوى النصي:
    {text_content[:8000]}
    
    قم بتلخيص المحتوى في 5 نقاط رئيسية.
    ثم قدم تحليلاً مختصراً للموضوع ووجهة نظر الكاتب.
    واخيرا، حدد ما إذا كان المحتوى مقالاً إخبارياً، أو مقال رأي، أو محتوى علمياً، أو غير ذلك.
    
    قم بتقديم الرد باللغة العربية.
    """
    
    try:
        # Generate the content using Gemini API
        # (توليد المحتوى باستخدام Gemini API)
        response = model.generate_content(prompt)
        return jsonify({"analysis": response.text})
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
