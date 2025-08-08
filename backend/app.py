import os
import json
import firebase_admin
import google.generativeai as genai

from firebase_admin import credentials
from firebase_admin import firestore
from flask import Flask, jsonify, request
from flask_cors import CORS

# Initialize Flask app and CORS
app = Flask(__name__)
CORS(app)

# 1. Get Firebase credentials from environment variable
#    (الحصول على مفاتيح Firebase من متغيرات البيئة)
firebase_credentials_json = os.environ.get('FIREBASE_CREDENTIALS')

if firebase_credentials_json:
    try:
        # Convert JSON string to a Python dictionary
        # (تحويل سلسلة JSON إلى قاموس Python)
        cred = credentials.Certificate(json.loads(firebase_credentials_json))
        firebase_admin.initialize_app(cred)
        print("Firebase initialized successfully.")
    except Exception as e:
        print(f"Error initializing Firebase with credentials: {e}")
else:
    print("Firebase credentials environment variable not found. Skipping initialization.")

# 2. Get Gemini API key from environment variable
#    (الحصول على مفتاح Gemini API من متغيرات البيئة)
gemini_api_key = os.environ.get('GEMINI_API_KEY')

if gemini_api_key:
    genai.configure(api_key=gemini_api_key)
    print("Gemini API key configured successfully.")
else:
    print("Gemini API key environment variable not found. Skipping configuration.")

# Initialize Firestore
db = firestore.client()

@app.route('/')
def home():
    return 'Backend is running.'

# Add other routes for your application logic here
# (أضف المسارات الأخرى لمنطق تطبيقك هنا)

@app.route('/test-gemini', methods=['POST'])
def test_gemini():
    """
    A test route to check if the Gemini API is working.
    (مسار اختبار للتحقق من عمل Gemini API)
    """
    if not gemini_api_key:
        return jsonify({"error": "Gemini API key not configured."}), 500

    try:
        model = genai.GenerativeModel('gemini-1.5-pro-latest')
        prompt = "Hello, what's your name?"
        response = model.generate_content(prompt)
        return jsonify({"response": response.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
