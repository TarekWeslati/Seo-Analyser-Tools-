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
# (الحصول على مفاتيح Firebase من متغيرات البيئة)
firebase_credentials_json = os.environ.get('FIREBASE_CREDENTIALS')

# A variable to track if Firebase was initialized
# (متغير لتتبع ما إذا كانت Firebase قد تم تهيئتها)
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

@app.route('/')
def home():
    if firebase_initialized:
        return 'Backend is running. Firebase and Firestore are active.'
    else:
        return 'Backend is running. Firebase is NOT active.'

# Add other routes for your application logic here
# (أضف المسارات الأخرى لمنطق تطبيقك هنا)

@app.route('/test-gemini', methods=['POST'])
def test_gemini():
    """
    A test route to check if the Gemini API is working.
    (مسار اختبار للتحقق من عمل Gemini API)
    """
    if not gemini_api_key or not model:
        return jsonify({"error": "Gemini API key not configured."}), 500

    try:
        prompt = "Hello, what's your name?"
        response = model.generate_content(prompt)
        return jsonify({"response": response.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
