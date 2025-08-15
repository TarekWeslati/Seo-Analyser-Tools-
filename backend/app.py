import os
import json
import requests
from bs4 import BeautifulSoup
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, auth, firestore
import google.generativeai as genai

# Firebase Admin SDK Configuration
try:
    firebase_key_str = os.environ.get("FIREBASE_SERVICE_ACCOUNT_KEY")
    print(f"Attempting to load Firebase key. Key is None: {firebase_key_str is None}")
    if firebase_key_str:
        firebase_cred = json.loads(firebase_key_str)
        cred = credentials.Certificate(firebase_cred)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("Firebase Admin SDK initialized successfully.")
    else:
        raise ValueError("FIREBASE_SERVICE_ACCOUNT_KEY is not set or empty.")
except Exception as e:
    print(f"Error initializing Firebase Admin SDK: {e}")
    cred = None
    db = None

# Gemini API Configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("Warning: GEMINI_API_KEY is not set.")
else:
    genai.configure(api_key=GEMINI_API_KEY)

# Flask App Configuration
app = Flask(__name__, static_folder='frontend/public/static', template_folder='frontend/public')
CORS(app)

# --- Routes for Serving Frontend Files ---
@app.route('/')
def serve_index():
    return send_from_directory(app.template_folder, 'index.html')

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

# --- Authentication Routes ---
@app.route('/api/auth/google', methods=['POST'])
def google_auth_handler():
    id_token = request.headers.get('Authorization', '').split('Bearer ')[1]
    
    if not id_token:
        return jsonify({"error": "Authorization token is missing"}), 400
    
    try:
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
        user_email = decoded_token.get('email')

        user_ref = db.collection('users').document(uid)
        user_ref.set({
            'email': user_email,
            'last_login': firestore.SERVER_TIMESTAMP
        }, merge=True)
        
        return jsonify({"message": "User authenticated successfully", "uid": uid}), 200
    
    except auth.InvalidIdTokenError:
        return jsonify({"error": "Invalid ID token"}), 401
    except Exception as e:
        print(f"Error during Google auth: {e}")
        return jsonify({"error": "Failed to authenticate"}), 500

# --- Function for Calling Gemini API ---
def call_gemini_api(prompt):
    if not GEMINI_API_KEY:
        raise ValueError("Gemini API key is not configured.")
    
    try:
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        raise RuntimeError(f"Failed to get a response from Gemini API: {e}") from e

# --- 1. Article Rewriter ---
@app.route('/api/rewrite', methods=['POST'])
def rewrite_article():
    data = request.get_json()
    text = data.get('text')
    
    if not text:
        return jsonify({"error": "Text to rewrite is required"}), 400
    
    prompt = f"أعد كتابة هذا المقال بأسلوب احترافي وجذاب مع الحفاظ على المعنى الأصلي:\n\n{text}"
    
    try:
        gemini_response = call_gemini_api(prompt)
        return jsonify({"rewritten_text": gemini_response})
    except (ValueError, RuntimeError) as e:
        return jsonify({"error": str(e)}), 500

# --- 2. Article Analysis ---
@app.route('/api/analyze-article', methods=['POST'])
def analyze_article_content():
    data = request.get_json()
    article_content = data.get('content')

    if not article_content:
        return jsonify({"error": "Article content is required"}), 400

    prompt = f"""
    قم بتحليل المحتوى التالي من المقال وقدم تقريراً مفصلاً.
    تقريرك يجب أن يتضمن:
    1. الكلمات المفتاحية الأساسية في المقال.
    2. تقييم لسهولة القراءة (Readability Score) وتوصيات لتحسينه.
    3. تقييم لنية المستخدم (User Intent) التي يستهدفها المقال (مثل: إعلامي، تجاري، استقصائي).
    4. اقتراحات للمحتوى المفقود (Content Gaps) التي يمكن إضافتها لتعزيز المقال.
    
    محتوى المقال:
    {article_content}
    """
    
    try:
        gemini_response = call_gemini_api(prompt)
        return jsonify({"analysis_report": gemini_response})
    except (ValueError, RuntimeError) as e:
        return jsonify({"error": str(e)}), 500

# --- 3. Website Keyword Analysis ---
@app.route('/api/get_website_keywords', methods=['POST'])
def get_website_keywords():
    data = request.get_json()
    url = data.get('url')

    if not url:
        return jsonify({"error": "URL is required"}), 400

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status() # Raises an HTTPError for bad responses (4xx or 5xx)
        soup = BeautifulSoup(response.text, 'html.parser')
        page_text = soup.get_text()

        prompt = f"حلل هذا النص واستخرج أهم الكلمات المفتاحية و الكلمات المفتاحية الطويلة (long-tail keywords) ذات الصلة: \n\n{page_text[:4000]}"
        
        gemini_response = call_gemini_api(prompt)

        return jsonify({"keywords_report": gemini_response})

    except requests.exceptions.RequestException as e:
        print(f"Request Exception: {e}")
        return jsonify({"error": f"فشل في جلب عنوان URL: {e}"}), 500
    except (ValueError, RuntimeError) as e:
        print(f"Gemini API Error: {e}")
        return jsonify({"error": f"فشل في تحليل المحتوى: {e}"}), 500
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return jsonify({"error": "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقًا."}), 500

# --- 4. Competitor Analysis ---
@app.route('/api/analyze_competitors', methods=['POST'])
def analyze_competitors():
    data = request.get_json()
    my_url = data.get('my_url')
    competitor_url = data.get('competitor_url')

    if not my_url or not competitor_url:
        return jsonify({"error": "Both URLs are required"}), 400

    try:
        my_response = requests.get(my_url, timeout=10)
        competitor_response = requests.get(competitor_url, timeout=10)
        my_response.raise_for_status()
        competitor_response.raise_for_status()

        my_soup = BeautifulSoup(my_response.text, 'html.parser')
        competitor_soup = BeautifulSoup(competitor_response.text, 'html.parser')

        my_text = my_soup.get_text()
        competitor_text = competitor_soup.get_text()

        prompt = f"قارن بين هذين النصين واستخرج: 1- الكلمات المفتاحية المشتركة. 2- الكلمات المفتاحية التي يستخدمها المنافس ولا أستخدمها.\n\nالنص الأول (موقعي):\n{my_text[:2000]}\n\nالنص الثاني (المنافس):\n{competitor_text[:2000]}"
        
        gemini_response = call_gemini_api(prompt)

        return jsonify({"comparison_report": gemini_response})

    except requests.exceptions.RequestException as e:
        print(f"Request Exception: {e}")
        return jsonify({"error": f"فشل في جلب أحد عناوين URL: {e}"}), 500
    except (ValueError, RuntimeError) as e:
        print(f"Gemini API Error: {e}")
        return jsonify({"error": f"فشل في تحليل المحتوى: {e}"}), 500
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return jsonify({"error": "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقًا."}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
