import os
from flask import Flask, render_template, request, jsonify, url_for
import requests
from bs4 import BeautifulSoup
import time
import ssl # Required for SSLContext if needed for advanced security checks

# --- 1. Define Folder Paths ---
# This section is crucial for Flask to locate your frontend files.
# os.path.dirname(__file__) gets the directory where app.py is located (e.g., /path/to/your_project_root/backend)
# os.path.abspath(...) converts the path to an absolute path
# os.path.join(...) builds platform-independent paths (works on Windows/Linux)

# Base directory for app.py (which is inside 'backend' folder)
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Define the path to the frontend's public directory (where index.html, CSS, JS are)
# Since app.py is in 'backend', we need to go up one level ('..') to reach the project root,
# then navigate into 'frontend/public'.
FRONTEND_PUBLIC_DIR = os.path.join(BASE_DIR, '..', 'frontend', 'public')

# --- 2. Initialize Flask Application ---
# We tell Flask where to find our HTML templates and static files (CSS/JS/images).
app = Flask(__name__,
            template_folder=FRONTEND_PUBLIC_DIR,  # HTML templates are here
            static_folder=FRONTEND_PUBLIC_DIR,    # CSS/JS/images are also here
            static_url_path='/static')            # Flask will serve files from static_folder under the /static URL prefix

# This line is important for Render.com to ensure url_for (if used) works correctly.
# It helps Flask generate correct URLs when deployed.
if 'RENDER_EXTERNAL_HOSTNAME' in os.environ:
    app.config['SERVER_NAME'] = os.environ.get('RENDER_EXTERNAL_HOSTNAME')

# --- 3. Basic Analysis Functions ---
# These functions perform basic web analysis and data collection.

def analyze_seo(html_content):
    """
    Performs basic SEO analysis: checks for title, meta description, and H1 tags.
    """
    soup = BeautifulSoup(html_content, 'html.parser')
    seo_score = 0
    description_parts = [] # Use a list to build description

    # Check for page title
    title_tag = soup.find('title')
    if title_tag and title_tag.string and len(title_tag.string.strip()) > 10:
        seo_score += 25
        description_parts.append("عنوان الصفحة موجود وطوله مناسب.")
    else:
        description_parts.append("عنوان الصفحة مفقود أو قصير جداً.")

    # Check for meta description
    meta_description = soup.find('meta', attrs={'name': 'description'})
    if meta_description and meta_description.get('content') and len(meta_description.get('content').strip()) > 50:
        seo_score += 25
        description_parts.append("الوصف التعريفي (Meta Description) موجود وطوله مناسب.")
    else:
        description_parts.append("الوصف التعريفي (Meta Description) مفقود أو قصير جداً.")

    # Check for H1 tag
    h1_tag = soup.find('h1')
    if h1_tag and h1_tag.string and len(h1_tag.string.strip()) > 0:
        seo_score += 25
        description_parts.append("عنوان H1 موجود.")
    else:
        description_parts.append("عنوان H1 مفقود.")

    # Check for alt attributes on images
    images_without_alt = 0
    for img in soup.find_all('img'):
        if not img.get('alt'):
            images_without_alt += 1
    if images_without_alt == 0:
        seo_score += 25
        description_parts.append("جميع الصور تحتوي على سمات 'alt'.")
    elif images_without_alt > 0 and images_without_alt < 5:
        seo_score += 15
        description_parts.append(f"يوجد {images_without_alt} صورة بدون سمة 'alt'.")
    else:
        description_parts.append(f"يوجد {images_without_alt} صورة بدون سمة 'alt'. تحتاج لتحسين.")

    return {
        "score": min(seo_score, 100), # Cap score at 100
        "description": " ".join(description_parts)
    }

def analyze_speed(url):
    """
    Performs basic speed analysis: measures initial response time (TTFB).
    """
    start_time = time.time()
    try:
        response = requests.get(url, timeout=10)
        end_time = time.time()
        response_time = (end_time - start_time) * 1000 # in milliseconds

        speed_score = 100
        description = ""

        if response_time > 2000: # More than 2 seconds
            speed_score = 50
            description = f"وقت استجابة بطيء: {response_time:.2f}ms. قد يؤثر على تجربة المستخدم."
        elif response_time > 1000: # More than 1 second
            speed_score = 75
            description = f"وقت استجابة متوسط: {response_time:.2f}ms. يمكن تحسينه."
        else:
            description = f"وقت استجابة سريع: {response_time:.2f}ms."

        return {
            "score": speed_score,
            "description": description
        }
    except requests.exceptions.RequestException as e:
        return {
            "score": 0,
            "description": f"فشل في قياس السرعة: {e}. قد يكون الموقع غير متاح أو هناك مشكلة في الاتصال."
        }

def analyze_ux(html_content):
    """
    Performs basic User Experience (UX) analysis: checks for meta viewport.
    """
    soup = BeautifulSoup(html_content, 'html.parser')
    ux_score = 0
    description_parts = []

    # Check for meta viewport (for mobile responsiveness)
    meta_viewport = soup.find('meta', attrs={'name': 'viewport'})
    if meta_viewport and 'width=device-width' in meta_viewport.get('content', ''):
        ux_score += 100
        description_parts.append("الموقع يبدو متجاوباً مع الأجهزة المحمولة (meta viewport موجود).")
    else:
        description_parts.append("meta viewport مفقود أو غير صحيح. قد لا يكون الموقع متجاوباً بشكل جيد على الأجهزة المحمولة.")

    return {
        "score": ux_score,
        "description": " ".join(description_parts)
    }

def analyze_security(url):
    """
    Performs basic security analysis: checks for HTTPS usage and valid SSL certificate.
    """
    security_score = 0
    description_parts = []

    if url.startswith('https://'):
        security_score = 70 # Base score for using HTTPS
        description_parts.append("الموقع يستخدم HTTPS (اتصال آمن).")
        try:
            # requests verifies SSL certificates by default
            requests.get(url, timeout=5, verify=True)
            security_score = 100
            description_parts = ["الموقع يستخدم HTTPS (اتصال آمن) وشهادة SSL صالحة."]
        except requests.exceptions.SSLError:
            security_score = 50
            description_parts.append("الموقع يستخدم HTTPS ولكن هناك مشكلة في شهادة SSL.")
        except requests.exceptions.RequestException as e:
            security_score = 0
            description_parts.append(f"فشل التحقق من HTTPS/SSL: {e}. قد يكون الموقع لا يدعم HTTPS بشكل صحيح أو غير متاح.")
    else:
        security_score = 0
        description_parts.append("الموقع لا يستخدم HTTPS. الاتصال غير آمن.")

    return {
        "score": security_score,
        "description": " ".join(description_parts)
    }

# --- 4. Routes and API Endpoints ---

# Main route '/' - serves the main application page
@app.route('/')
def index():
    # render_template looks for 'index.html' inside the template_folder defined above
    return render_template('index.html')

# API endpoint for website analysis - receives a POST request
@app.route('/analyze', methods=['POST'])
def analyze_website():
    try:
        data = request.get_json() # Get JSON data sent from the frontend
        url = data.get('url')    # Extract the URL

        # Validate URL
        if not url:
            return jsonify({'error': 'URL is required', 'details': 'No URL provided.'}), 400

        # Prepend http:// if no protocol is specified
        if not url.startswith('http://') and not url.startswith('https://'):
            url = 'http://' + url # Default to http:// if no protocol

        print(f"Request to analyze URL: {url}") # For server logs

        # Fetch page content
        html_content = ""
        try:
            # Increase timeout for potentially slow websites
            response = requests.get(url, timeout=15)
            response.raise_for_status() # Raise an exception for 4xx or 5xx errors
            html_content = response.text
        except requests.exceptions.RequestException as e:
            # Handle errors during URL fetching
            error_message = f"Failed to fetch content from URL: {url}. Details: {str(e)}"
            print(error_message)
            return jsonify({
                "error": "Failed to fetch URL",
                "details": error_message,
                "seo_score": "N/A", "seo_description": "فشل جلب المحتوى. قد يكون الرابط غير صالح أو الموقع غير متاح.",
                "speed_score": "N/A", "speed_description": "فشل جلب المحتوى. قد يكون الرابط غير صالح أو الموقع غير متاح.",
                "ux_score": "N/A", "ux_description": "فشل جلب المحتوى. قد يكون الرابط غير صالح أو الموقع غير متاح.",
                "domain_authority": "N/A", "domain_authority_desc": "لا يمكن حساب سلطة النطاق بدون دمج API خارجي.",
                "security_score": "N/A", "security_description": "فشل جلب المحتوى. قد يكون الرابط غير صالح أو الموقع غير متاح.",
                "ai_summary": "تعذر تحليل الموقع بسبب مشكلة في الاتصال أو جلب المحتوى."
            }), 400

        # Perform analyses
        seo_results = analyze_seo(html_content)
        speed_results = analyze_speed(url) # analyze_speed makes its own request
        ux_results = analyze_ux(html_content)
        security_results = analyze_security(url)

        # Combine results
        results = {
            "seo_score": f"{seo_results['score']}/100",
            "seo_description": seo_results['description'],
            "speed_score": f"{speed_results['score']}/100",
            "speed_description": speed_results['description'],
            "ux_score": f"{ux_results['score']}/100",
            "ux_description": ux_results['description'],
            "domain_authority": "N/A", # Cannot analyze without external API
            "domain_authority_desc": "لا يمكن حساب سلطة النطاق بدون دمج API خارجي مثل Moz أو Ahrefs.",
            "security_score": f"{security_results['score']}/100",
            "security_description": security_results['description'],
            "ai_summary": "سيتم إنشاء الملخص بواسطة الذكاء الاصطناعي في الواجهة الأمامية بناءً على هذه النتائج."
        }

        # Return results as JSON to the frontend
        return jsonify(results)

    except Exception as e:
        # Catch any unexpected errors during request processing
        error_message = f"An unhandled error occurred in analyze_website: {str(e)}"
        print(error_message)
        return jsonify({'error': 'An internal server error occurred.', 'details': error_message}), 500

# API endpoint to fetch translations based on language
@app.route('/translations/<lang>')
def get_translations(lang):
    # Dictionary containing translations for each language
    translations_data = {
        "ar": {
            "app_title": "محلل الويب الاحترافي",
            "analyze_any_website": "تحليل أي موقع ويب",
            "placeholder_url": "https://www.example.com",
            "analyze_button": "تحليل",
            "loading_text": "جاري تحليل الموقع، الرجاء الانتظار...",
            "analysis_results_for": "نتائج التحليل لـ:",
            "seo_score_title": "نقاط SEO",
            "speed_score_title": "نقاط السرعة",
            "ux_score_title": "نقاط تجربة المستخدم (UX)",
            "domain_authority_title": "سلطة النطاق وثقة الموقع",
            "security_score_title": "نقاط الأمان",
            "ai_summary_title": "ملخص الذكاء الاصطناعي",
            "export_pdf_button": "تصدير PDF",
            "error_url_required": "الرجاء إدخال رابط موقع.",
            "error_analysis_failed": "حدث خطأ أثناء تحليل الموقع. الرجاء المحاولة مرة أخرى.",
            "failed_to_fetch_url": "فشل جلب المحتوى من الرابط المحدد. الرجاء التحقق من الرابط أو المحاولة لاحقاً."
        },
        "en": {
            "app_title": "Web Analyzer Pro",
            "analyze_any_website": "Analyze Any Website",
            "placeholder_url": "https://www.example.com",
            "analyze_button": "Analyze",
            "loading_text": "Analyzing website, please wait...",
            "analysis_results_for": "Analysis Results for:",
            "seo_score_title": "SEO Score",
            "speed_score_title": "Speed Score",
            "ux_score_title": "User Experience (UX) Score",
            "domain_authority_title": "Domain Authority & Site Trust",
            "security_score_title": "Security Score",
            "ai_summary_title": "AI Summary",
            "export_pdf_button": "Export PDF",
            "error_url_required": "Please enter a website URL.",
            "error_analysis_failed": "An error occurred during analysis. Please try again.",
            "failed_to_fetch_url": "Failed to fetch content from the provided URL. Please check the URL or try again later."
        }
    }
    # Return translations for the requested language, or English as default if not found
    return jsonify(translations_data.get(lang, translations_data["en"]))

# --- 5. Run the Application ---
# This ensures the server starts when the file is executed directly
if __name__ == '__main__':
    # debug=True is useful for development: it reloads the server on changes and shows detailed errors.
    # It should be set to False in production environments for security and performance reasons.
    app.run(debug=True)
