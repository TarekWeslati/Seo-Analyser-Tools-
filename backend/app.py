import os
import requests
import re
from bs4 import BeautifulSoup
from flask import Flask, request, jsonify, g
from functools import wraps
from firebase_admin import credentials, initialize_app, auth
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
import logging

try:
    # Attempt to load the Firebase credentials from the environment variable
    firebase_credentials_json = os.getenv("FIREBASE_CREDENTIALS")
    if firebase_credentials_json:
        # Create a temporary file to hold the credentials
        with open("firebase-sa.json", "w") as f:
            f.write(firebase_credentials_json)
        cred = credentials.Certificate("firebase-sa.json")
        # Initialize Firebase Admin SDK
        initialize_app(cred)
        print("Firebase Admin SDK initialized successfully.")
    else:
        print("Firebase credentials environment variable not found. Skipping initialization.")

    # Initialize Flask app
    app = Flask(__name__)
    app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True

    # Configure Gemini API
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY environment variable not found.")
    else:
        genai.configure(api_key=api_key)

    # Middleware to verify Firebase ID Token
    def firebase_auth_middleware():
        def wrapper(fn):
            @wraps(fn)
            def decorated_function(*args, **kwargs):
                # Skip authentication for the root path
                if request.path == '/':
                    print("Skipping authentication for path: /")
                    return fn(*args, **kwargs)

                # Get the Authorization header
                auth_header = request.headers.get('Authorization')
                if not auth_header or not auth_header.startswith('Bearer '):
                    print("Authentication required: Authorization header missing.")
                    return jsonify({"error": "Authentication required. Please log in."}), 401
                
                id_token = auth_header.split('Bearer ')[1]
                print(f"Received Authorization header: Bearer {id_token[:30]}...")

                try:
                    # Verify the ID token
                    decoded_token = auth.verify_id_token(id_token)
                    g.user = decoded_token
                    print(f"Token successfully verified by middleware for UID: {g.user['uid']}")
                    return fn(*args, **kwargs)
                except Exception as e:
                    print(f"Authentication failed in middleware: {e}")
                    return jsonify({"error": f"Authentication failed: {str(e)}"}), 401
            return decorated_function
        return wrapper

    # --- API ENDPOINTS ---

    @app.route('/')
    def index():
        # This is a basic health check endpoint, returning a simple message
        return "Backend is running.", 200

    @app.route('/analyze', methods=['POST'])
    @firebase_auth_middleware()
    def analyze_website():
        print("Received request for website analysis.")
        try:
            data = request.get_json()
            url = data.get('url')
            if not url:
                return jsonify({"error": "URL is required"}), 400
            
            # Use the existing function to analyze the website
            analysis_data = get_website_analysis(url)
            return jsonify(analysis_data)
        except Exception as e:
            print(f"Error during website analysis: {e}")
            return jsonify({"error": str(e)}), 500

    @app.route('/analyze_article_content', methods=['POST'])
    @firebase_auth_middleware()
    def analyze_article():
        print("Received request for article analysis.")
        try:
            data = request.get_json()
            article_text = data.get('article_text')
            if not article_text:
                return jsonify({"error": "Article text is required"}), 400
            
            # Use the existing function to analyze the article
            analysis_data = analyze_article_content(article_text)
            return jsonify(analysis_data)
        except Exception as e:
            print(f"Error during article analysis: {e}")
            return jsonify({"error": str(e)}), 500

    @app.route('/signup', methods=['POST'])
    def signup():
        print("Received signup request.")
        try:
            data = request.get_json()
            email = data.get('email')
            password = data.get('password')
            if not email or not password:
                return jsonify({"error": "Email and password are required"}), 400
            
            user = auth.create_user(email=email, password=password)
            custom_token = auth.create_custom_token(user.uid)
            return jsonify({"status": "success", "uid": user.uid, "token": custom_token.decode('utf-8')})
        except Exception as e:
            print(f"Error during user signup: {e}")
            return jsonify({"error": str(e)}), 400

    @app.route('/login', methods=['POST'])
    def login():
        print("Received login request.")
        try:
            data = request.get_json()
            email = data.get('email')
            password = data.get('password')
            if not email or not password:
                return jsonify({"error": "Email and password are required"}), 400
            
            # This is a simplified login. In a real app, you'd use a client-side SDK.
            # Here, we can create a custom token for the user.
            user = auth.get_user_by_email(email)
            custom_token = auth.create_custom_token(user.uid)
            return jsonify({"status": "success", "uid": user.uid, "token": custom_token.decode('utf-8')})
        except Exception as e:
            print(f"Error during user login: {e}")
            return jsonify({"error": "Invalid email or password"}), 401

    # --- HELPER FUNCTIONS ---

    def get_website_analysis(url):
        # ... (Your existing get_website_analysis function) ...
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')

            # Extract SEO-related information
            title = soup.title.string if soup.title else 'No title found'
            description = soup.find('meta', attrs={'name': 'description'})
            description = description['content'] if description else 'No description found'
            keywords = soup.find('meta', attrs={'name': 'keywords'})
            keywords = keywords['content'].split(',') if keywords else []

            # Extract headings
            headings = {f'h{i}': [h.get_text().strip() for h in soup.find_all(f'h{i}')] for i in range(1, 7)}

            # Generate AI-powered insights using Gemini
            model = genai.GenerativeModel('gemini-1.5-pro-latest',
                                          safety_settings={
                                              HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                                              HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                                              HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                                              HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
                                          })

            ai_prompt_rewrite = f"""
            أنت خبير في تحسين محركات البحث (SEO). بناءً على المعلومات التالية من موقع ويب:
            - العنوان: {title}
            - الوصف: {description}
            - الكلمات المفتاحية: {', '.join(keywords)}
            - العناوين (H1-H6): {headings}

            الرجاء تقديم اقتراحات موجزة لإعادة صياغة العنوان والوصف والكلمات المفتاحية لتحسين SEO. قم بالرد بتنسيق JSON فقط مع المفاتيح "title", "description", و"keywords".
            """
            
            ai_prompt_content = f"""
            بناءً على محتوى الموقع الذي تم استخراجه والذي يحتوي على العناوين والكلمات المفتاحية، قدم اقتراحاً مختصراً لتحسين المحتوى ليصبح أكثر جاذبية للقراء ومناسباً لمحركات البحث.
            """

            rewrite_response = model.generate_content(ai_prompt_rewrite)
            rewrite_suggestions = rewrite_response.text

            content_response = model.generate_content(ai_prompt_content)
            content_refinement = content_response.text
            
            # Basic broken link check (can be improved)
            all_links = [link.get('href') for link in soup.find_all('a')]
            broken_links = [link for link in all_links if link and not link.startswith('#') and 'http' not in link]

            return {
                "title": title,
                "description": description,
                "keywords": keywords,
                "headings": headings,
                "broken_links": broken_links,
                "ai_seo_rewrite_suggestions": rewrite_suggestions,
                "ai_content_refinement": content_refinement,
            }
        except Exception as e:
            logging.error(f"Error in get_website_analysis: {e}")
            raise # Re-raise the exception to be caught by the route's try-except block

    def analyze_article_content(article_text):
        # ... (Your existing analyze_article_content function) ...
        try:
            # Word count
            word_count = len(article_text.split())

            # Readability score (Flesch-Kincaid based on English rules, approximate for Arabic)
            # This is a simplification; a full Arabic readability score would be more complex.
            total_sentences = len(re.split(r'[.!?]', article_text))
            total_words = len(re.findall(r'\b\w+\b', article_text))
            avg_words_per_sentence = total_words / total_sentences if total_sentences > 0 else 0
            readability_score = 206.835 - 1.015 * avg_words_per_sentence
            
            model = genai.GenerativeModel('gemini-1.5-pro-latest',
                                          safety_settings={
                                              HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                                              HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                                              HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                                              HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
                                          })

            # AI prompts for analysis
            ai_prompt_summary = f"""
            قم بتلخيص المقال التالي في ثلاث نقاط رئيسية:
            {article_text}
            """

            ai_prompt_sentiment = f"""
            قم بتحليل المشاعر في المقال التالي (إيجابية، سلبية، محايدة):
            {article_text}
            """

            ai_prompt_readability = f"""
            بناءً على المقال التالي، قدم اقتراحين لتحسين المقروئية وجعله أسهل للقراءة:
            {article_text}
            """

            ai_prompt_seo = f"""
            بناءً على المقال التالي، قدم اقتراحين لتحسينه لمحركات البحث (SEO):
            {article_text}
            """
            
            # Generate AI-powered insights
            summary_response = model.generate_content(ai_prompt_summary)
            sentiment_response = model.generate_content(ai_prompt_sentiment)
            readability_response = model.generate_content(ai_prompt_readability)
            seo_response = model.generate_content(ai_prompt_seo)

            return {
                "word_count": word_count,
                "readability_score": readability_score,
                "summary": summary_response.text,
                "sentiment": sentiment_response.text,
                "readability_suggestions": readability_response.text.split('\n'),
                "seo_suggestions": seo_response.text.split('\n')
            }
        except Exception as e:
            logging.error(f"Error in analyze_article_content: {e}")
            raise # Re-raise the exception to be caught by the route's try-except block

    # Final line of the script to make the app executable by Gunicorn
    # For Render, the app is expected to be a global variable
    # The 'app' variable is already defined, no need for another line here.

except Exception as e:
    # This block will catch any error that occurs during app initialization
    print(f"CRITICAL ERROR during Flask app initialization: {e}")
    # You can also use a more robust logging system here
    logging.exception("Fatal error during app startup")
    # You might want to create a dummy app to return a 500 error for Gunicorn
    def error_app(environ, start_response):
        status = '500 Internal Server Error'
        headers = [('Content-type', 'text/plain')]
        start_response(status, headers)
        return [b"Application failed to start. Check server logs for details."]
    app = error_app
