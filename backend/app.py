# app.py: The complete backend application for Website & Article Analyzer.

import os
import json
import firebase_admin
import google.generativeai as genai
import requests
import asyncio
from firebase_admin import credentials, auth, firestore
from flask import Flask, request, jsonify, send_from_directory, make_response
from flask_cors import CORS
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import re

# =========================================================================
# Configuration & Environment Variables
# =========================================================================

# Get API keys and Firebase configuration from environment variables
firebase_service_account_key_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY_JSON")
gemini_api_key = os.getenv("GEMINI_API_KEY")
pagespeed_api_key = os.getenv("PAGESPEED_API_KEY")

# =========================================================================
# Firebase & Gemini Initialization
# =========================================================================

# Initialize Firebase Admin SDK
try:
    if firebase_service_account_key_json:
        cred_dict = json.loads(firebase_service_account_key_json)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("Firebase Admin SDK and Firestore initialized successfully.")
    else:
        print("FIREBASE_SERVICE_ACCOUNT_KEY_JSON environment variable not set. Firebase Admin SDK will not be available.")
except Exception as e:
    print(f"Error initializing Firebase Admin SDK: {e}")
    print("Firebase Admin SDK will not be available.")

# Initialize Gemini API
try:
    if gemini_api_key:
        genai.configure(api_key=gemini_api_key)
        print("Gemini API key configured successfully.")
    else:
        print("GEMINI_API_KEY environment variable not set. Gemini AI services will not be available.")
except Exception as e:
    print(f"Error configuring Gemini API: {e}")
    print("Gemini AI services will not be available.")

# =========================================================================
# Flask App Setup
# =========================================================================

# Define the path to the frontend public directory
frontend_public_path = os.path.join(os.path.dirname(__file__), '..', 'public')

app = Flask(__name__,
            static_folder=frontend_public_path,
            static_url_path='/')

# Configure CORS to allow requests from the Canvas environment
# We assume the user's Canvas app URL is provided by a variable or is a known domain.
CORS(app, resources={r"/*": {"origins": ["*"]}}, supports_credentials=True, allow_headers=["Authorization", "Content-Type"])

# =========================================================================
# Frontend Serving Routes
# =========================================================================

@app.route('/')
def index():
    """Serve index.html from the root path."""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve all other static files."""
    return send_from_directory(app.static_folder, filename)

# =========================================================================
# Middleware for Authentication
# =========================================================================

@app.before_request
def verify_token_middleware():
    """
    Middleware to verify user authentication token before processing API requests.
    """
    # Exclude static files and authentication routes from token verification
    if request.path.startswith('/static/') or \
       request.path.startswith('/api/auth/') or \
       request.path in ['/', '/index.html', '/favicon.ico']:
        return

    # Check for Authorization header
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "Authorization header missing."}), 401

    try:
        # Extract the ID token from the Bearer token
        id_token = auth_header.split(' ')[1]
        decoded_token = auth.verify_id_token(id_token)
        request.user_id = decoded_token['uid']
    except Exception as e:
        return jsonify({"error": f"Authentication required: {str(e)}"}), 401

# =========================================================================
# Helper Functions for Analysis
# =========================================================================

def get_pagespeed_results(url):
    """Fetches PageSpeed Insights data."""
    if not pagespeed_api_key:
        return {"error": "PageSpeed API key is not configured."}
    
    pagespeed_url = f"https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={url}&key={pagespeed_api_key}"
    response = requests.get(pagespeed_url)
    if response.status_code == 200:
        return response.json()
    else:
        return {"error": f"Failed to fetch PageSpeed data. Status code: {response.status_code}"}

def get_seo_content(html_content):
    """Extracts basic SEO data from HTML."""
    soup = BeautifulSoup(html_content, 'html.parser')
    
    title = soup.title.string if soup.title else ""
    meta_description = soup.find('meta', attrs={'name': 'description'})
    meta_description = meta_description['content'] if meta_description else ""
    
    headings = [h.text.strip() for h in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])]
    
    all_text = soup.get_text(separator=' ', strip=True)
    word_count = len(re.findall(r'\b\w+\b', all_text))
    char_count = len(all_text)
    
    return {
        "title": title,
        "meta_description": meta_description,
        "headings": headings,
        "word_count": word_count,
        "char_count": char_count,
        "all_text": all_text
    }

def get_broken_links(url, html_content):
    """A simple function to find broken links."""
    soup = BeautifulSoup(html_content, 'html.parser')
    broken_links = []
    
    for a_tag in soup.find_all('a', href=True):
        href = a_tag['href']
        if href.startswith('http') and urlparse(href).netloc != urlparse(url).netloc:
            try:
                response = requests.head(href, timeout=5)
                if response.status_code >= 400:
                    broken_links.append(href)
            except requests.exceptions.RequestException:
                broken_links.append(href)
    return broken_links

def generate_gemini_response(prompt):
    """A helper function to get a response from the Gemini API."""
    if not gemini_api_key:
        return "Gemini API key not configured."
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini API error: {e}")
        return "An error occurred while generating AI content."

# =========================================================================
# Website Analysis API Endpoint
# =========================================================================

@app.route('/api/website-analyze', methods=['POST'])
def website_analyze():
    """
    Main endpoint to analyze a website.
    """
    data = request.get_json()
    url = data.get('input')
    lang = request.headers.get('Accept-Language', 'en')

    if not url:
        return jsonify({"error": "URL is required"}), 400

    try:
        # Fetch website content
        response = requests.get(url, timeout=10)
        html_content = response.text
        
        # Get PageSpeed results
        pagespeed_results = get_pagespeed_results(url)

        # Get basic SEO data
        seo_data = get_seo_content(html_content)
        
        # Get broken links
        broken_links = get_broken_links(url, html_content)
        
        # Generate AI-powered insights
        # AI SEO suggestions (for simplicity, we'll generate one summary)
        seo_prompt = f"Given the title '{seo_data['title']}' and meta description '{seo_data['meta_description']}' and the website content, provide 3-5 concise SEO improvement tips in {lang}."
        ai_seo_suggestions = generate_gemini_response(seo_prompt)

        # AI content refinement
        content_sample = seo_data['all_text'][:1000] # Use first 1000 chars as a sample
        content_prompt = f"Refine the following content for better readability and engagement, and provide 3 suggestions for improvement in {lang}:\n\n{content_sample}"
        ai_content_refinement = generate_gemini_response(content_prompt)
        
        # AI broken link suggestions
        broken_link_prompt = f"Given the following list of broken links, provide a short, actionable suggestion on how to fix them in {lang}:\n{', '.join(broken_links)}"
        ai_broken_link_suggestions = generate_gemini_response(broken_link_prompt) if broken_links else "No broken links found."

        # Compile and return the final report
        analysis_report = {
            "source_url": url,
            "domainAuthority": {
                "score": 85, # Placeholder for a real API call
                "domainName": urlparse(url).netloc,
                "domainAge": "5 years", # Placeholder
                "sslStatus": "Valid", # Placeholder
                "dnsHealth": "Healthy" # Placeholder
            },
            "pageSpeed": {
                "performanceScore": pagespeed_results.get("lighthouseResult", {}).get("categories", {}).get("performance", {}).get("score", 0) * 100,
                "coreWebVitals": {
                    "LCP": "2.5s", # Placeholder
                    "CLS": "0.1", # Placeholder
                    "FID": "100ms" # Placeholder
                },
                "performanceIssues": "Needs optimization" # Placeholder
            },
            "seoQuality": {
                "overallScore": 90, # Placeholder
                "title": seo_data['title'],
                "metaDescription": seo_data['meta_description'],
                "headings": seo_data['headings'],
                "wordCount": seo_data['word_count'],
                "charCount": seo_data['char_count'],
                "robotsTxtPresent": "Yes", # Placeholder
                "sitemapXmlPresent": "Yes" # Placeholder
            },
            "brokenLinks": {
                "count": len(broken_links),
                "list": broken_links
            },
            "aiInsights": {
                "seoSuggestions": ai_seo_suggestions,
                "contentRefinement": ai_content_refinement,
                "brokenLinkSuggestions": ai_broken_link_suggestions,
            }
        }
        
        return jsonify(analysis_report), 200

    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")
        return jsonify({"error": f"Failed to access the URL. Please check the address."}), 400
    except Exception as e:
        print(f"Internal server error: {e}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

# =========================================================================
# Article Analysis API Endpoint
# =========================================================================

@app.route('/api/article-analyze', methods=['POST'])
def article_analyze():
    """
    Endpoint to analyze an article's content using AI.
    """
    data = request.get_json()
    article_text = data.get('input')
    lang = request.headers.get('Accept-Language', 'en')

    if not article_text:
        return jsonify({"error": "Article text is required"}), 400

    try:
        # Use Gemini to perform comprehensive article analysis
        prompt = f"""
        Perform a detailed analysis of the following article in {lang}. The analysis should include:
        1.  **Summary:** A concise summary of the article's main points.
        2.  **SEO Score:** A score out of 100 for SEO quality, explaining why.
        3.  **Keywords:** A list of the top 5 most important keywords.
        4.  **Readability Score:** A score out of 100 for readability, explaining why.
        5.  **Suggestions:** A list of 3-5 actionable suggestions to improve the article's content and SEO.

        Article Text:\n\n{article_text}
        """
        
        ai_analysis_response = generate_gemini_response(prompt)
        
        # This is a simple parsing method, for a real app,
        # you'd use a more robust approach (e.g., JSON response from Gemini).
        # We'll just return the raw text for simplicity.
        
        analysis_results = {
            "source_text": article_text,
            "ai_analysis": ai_analysis_response
        }

        return jsonify(analysis_results), 200
        
    except Exception as e:
        print(f"Error during article analysis: {e}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

# =========================================================================
# Main Entry Point
# =========================================================================

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
