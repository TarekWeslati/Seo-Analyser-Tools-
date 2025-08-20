import os
import json
import asyncio
import aiohttp
import requests
from requests.packages.urllib3.exceptions import InsecureRequestWarning
from bs4 import BeautifulSoup
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, auth, firestore
import google.generativeai as genai

# Suppress InsecureRequestWarning
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

# Firebase Admin SDK Configuration
try:
    firebase_key_str = os.environ.get("FIREBASE_SERVICE_ACCOUNT_KEY")
    if firebase_key_str:
        firebase_cred = json.loads(firebase_key_str)
        cred = credentials.Certificate(firebase_cred)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
    else:
        print("Warning: FIREBASE_SERVICE_ACCOUNT_KEY is not set or empty. Firestore functionality will be disabled.")
        db = None
except Exception as e:
    print(f"Error initializing Firebase: {e}. Firestore functionality will be disabled.")
    db = None

# Gemini API Configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("Warning: GEMINI_API_KEY is not set.")
    genai = None # Disable Gemini functionality
else:
    genai.configure(api_key=GEMINI_API_KEY)

# Flask App Configuration
app = Flask(__name__, static_folder='frontend/public/static', template_folder='frontend/public')
CORS(app)

# --- In-memory cache for API results ---
results_cache = {}

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
    if not db:
        return jsonify({"error": "Firebase is not configured. Authentication not available."}), 500
    
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
        return jsonify({"error": f"Failed to authenticate: {e}"}), 500

# --- Asynchronous Helper Functions ---
async def call_gemini_api_for_json(prompt_text):
    if not genai:
        raise ValueError("Gemini API key is not configured.")
    
    prompt = f"{prompt_text}\n\nReturn the response as a single, valid JSON object only."
    
    try:
        model = genai.GenerativeModel('gemini-1.5-pro')
        response = await model.generate_content_async(prompt)
        
        response_text = response.text.strip('`').strip()
        if response_text.startswith('json'):
            response_text = response_text[4:].strip()
        
        try:
            json_data = json.loads(response_text)
            return json_data
        except json.JSONDecodeError as e:
            print(f"Initial JSON parse failed: {e}. Trying to fix with a new prompt.")
            fix_prompt = f"The previous response was not a valid JSON. Please provide a valid JSON object based on the following task: '{prompt_text}'. The response must be a single, valid JSON object."
            fix_response = await model.generate_content_async(fix_prompt)
            fix_response_text = fix_response.text.strip('`').strip()
            if fix_response_text.startswith('json'):
                fix_response_text = fix_response_text[4:].strip()
            return json.loads(fix_response_text)

    except Exception as e:
        raise RuntimeError(f"Failed to get a valid response from Gemini API: {e}") from e

async def call_gemini_api_for_text(prompt):
    if not genai:
        raise ValueError("Gemini API key is not configured.")
    
    try:
        model = genai.GenerativeModel('gemini-1.5-pro')
        response = await model.generate_content_async(prompt)
        return response.text
    except Exception as e:
        raise RuntimeError(f"Failed to get a response from Gemini API: {e}") from e

async def fetch_website_content_async(url):
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=10, ssl=False) as response:
                response.raise_for_status()
                return await response.text()
    except aiohttp.ClientError as e:
        raise RuntimeError(f"Failed to fetch URL: {e}") from e

# --- 1. Article Rewriter ---
@app.route('/api/rewrite', methods=['POST'])
async def rewrite_article():
    data = request.get_json()
    text = data.get('text')
    
    if not text:
        return jsonify({"error": "Text to rewrite is required"}), 400
    
    # Check cache first
    cache_key = f"rewrite:{text}"
    if cache_key in results_cache:
        return jsonify({"rewritten_text": results_cache[cache_key]})

    prompt = f"أعد كتابة هذا المقال بأسلوب احترافي وجذاب مع الحفاظ على المعنى الأصلي:\n\n{text}"
    
    try:
        gemini_response = await call_gemini_api_for_text(prompt)
        results_cache[cache_key] = gemini_response # Store in cache
        return jsonify({"rewritten_text": gemini_response})
    except (ValueError, RuntimeError) as e:
        return jsonify({"error": str(e)}), 500

# --- 2. Article Analysis ---
@app.route('/api/analyze-article', methods=['POST'])
async def analyze_article_content():
    data = request.get_json()
    article_content = data.get('content')

    if not article_content:
        return jsonify({"error": "Article content is required"}), 400
    
    # Check cache first
    cache_key = f"analyze_article:{article_content}"
    if cache_key in results_cache:
        return jsonify({"analysis_report": results_cache[cache_key]})

    prompt = f"""
    قم بتحليل المحتوى التالي من المقال وقدم تقريراً مفصلاً بتنسيق JSON. التقرير يجب أن يحتوي على الحقول التالية:
    - **main_idea**: الفكرة الرئيسية للمقال.
    - **keywords**: قائمة بأهم الكلمات المفتاحية.
    - **readability_score**: تقييم لسهولة القراءة (من 1 إلى 10).
    - **readability_recommendations**: توصيات لتحسين سهولة القراءة.
    - **content_gaps**: اقتراحات للمحتوى المفقود.
    - **user_intent**: نية المستخدم التي يستهدفها المقال (مثل: إعلامي، تجاري).
    
    محتوى المقال:
    {article_content}
    """
    
    try:
        gemini_response = await call_gemini_api_for_json(prompt)
        results_cache[cache_key] = gemini_response # Store in cache
        return jsonify({"analysis_report": gemini_response})
    except (ValueError, RuntimeError, json.JSONDecodeError) as e:
        return jsonify({"error": f"فشل في تحليل المحتوى. {e}"}), 500


# --- 3. Website Keyword Analysis ---
@app.route('/api/get_website_keywords', methods=['POST'])
async def get_website_keywords():
    data = request.get_json()
    url = data.get('url')

    if not url:
        return jsonify({"error": "URL is required"}), 400

    # Check cache first
    cache_key = f"get_keywords:{url}"
    if cache_key in results_cache:
        return jsonify({"keywords_report": results_cache[cache_key]})

    try:
        response_text = await fetch_website_content_async(url)
        soup = BeautifulSoup(response_text, 'html.parser')
        page_text = soup.get_text()

        prompt = f"""
        حلل هذا النص واستخرج الكلمات المفتاحية والكلمات المفتاحية الطويلة (long-tail keywords). 
        قدم الإجابة ككائن JSON يحتوي على حقلين:
        - **keywords**: قائمة بأهم الكلمات المفتاحية.
        - **long_tail_keywords**: قائمة بالكلمات المفتاحية الطويلة ذات الصلة.
        
        النص:
        {page_text[:4000]}
        """
        
        gemini_response = await call_gemini_api_for_json(prompt)
        results_cache[cache_key] = gemini_response # Store in cache
        return jsonify({"keywords_report": gemini_response})

    except RuntimeError as e:
        return jsonify({"error": f"فشل في جلب عنوان URL: {e}"}), 500
    except (ValueError, RuntimeError, json.JSONDecodeError) as e:
        return jsonify({"error": f"فشل في تحليل المحتوى. {e}"}), 500
    except Exception as e:
        return jsonify({"error": "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقًا."}), 500

# --- 4. Competitor Analysis ---
@app.route('/api/analyze_competitors', methods=['POST'])
async def analyze_competitors():
    data = request.get_json()
    my_url = data.get('my_url')
    competitor_url = data.get('competitor_url')

    if not my_url or not competitor_url:
        return jsonify({"error": "Both URLs are required"}), 400

    # Check cache first
    cache_key = f"competitor_analysis:{my_url}:{competitor_url}"
    if cache_key in results_cache:
        return jsonify({"comparison_report": results_cache[cache_key]})

    try:
        my_response_text, competitor_response_text = await asyncio.gather(
            fetch_website_content_async(my_url),
            fetch_website_content_async(competitor_url)
        )

        my_soup = BeautifulSoup(my_response_text, 'html.parser')
        competitor_soup = BeautifulSoup(competitor_response_text, 'html.parser')

        my_text = my_soup.get_text()
        competitor_text = competitor_soup.get_text()

        prompt = f"""
        قارن بين النصين وقدم الإجابة ككائن JSON يحتوي على الحقول التالية:
        - **common_keywords**: قائمة بالكلمات المفتاحية المشتركة.
        - **competitor_exclusive_keywords**: قائمة بالكلمات المفتاحية التي يستخدمها المنافس فقط.
        
        النص الأول (موقعي):
        {my_text[:2000]}
        
        النص الثاني (المنافس):
        {competitor_text[:2000]}
        """
        
        gemini_response = await call_gemini_api_for_json(prompt)
        results_cache[cache_key] = gemini_response # Store in cache
        return jsonify({"comparison_report": gemini_response})

    except RuntimeError as e:
        return jsonify({"error": f"فشل في جلب أحد عناوين URL: {e}"}), 500
    except (ValueError, RuntimeError, json.JSONDecodeError) as e:
        return jsonify({"error": f"فشل في تحليل المحتوى. {e}"}), 500
    except Exception as e:
        return jsonify({"error": "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقًا."}), 500

if __name__ == '__main__':
    from sys import platform
    port = int(os.environ.get("PORT", 5000))
    if "linux" in platform:
        import asyncio
        asyncio.run(app.run(host='0.0.0.0', port=port, debug=False))
    else:
        app.run(host='0.0.0.0', port=port, debug=False)
