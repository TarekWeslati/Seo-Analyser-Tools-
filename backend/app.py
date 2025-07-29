import os
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
import json 

# Import services and utilities with full relative paths from the project root.
from backend.services.domain_analysis import get_domain_analysis
from backend.services.pagespeed_analysis import get_pagespeed_insights
from backend.services.seo_analysis import perform_seo_analysis, get_content_length, check_robots_txt, check_sitemap_xml # Added new functions
from backend.services.ux_analysis import perform_ux_analysis, check_viewport_meta # Added new function
# Updated imports for AI services
from backend.services.ai_suggestions import get_ai_suggestions, generate_seo_rewrites, refine_content, get_adsense_readiness_assessment, get_broken_link_fix_suggestions, analyze_article_content_ai, rewrite_article_ai # Added new AI functions
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

# Ensure API keys are loaded from environment variables
app.config['PAGESPEED_API_KEY'] = os.getenv('PAGESPEED_API_KEY')
app.config['GEMINI_API_KEY'] = os.getenv('GEMINI_API_KEY') 

last_analysis_results = {} 

# Route to serve the main frontend HTML file
@app.route('/')
def index():
    print("Serving index.html") 
    return send_from_directory(app.static_folder, 'index.html')

# Route to serve other static files (like CSS and JS)
@app.route('/<path:filename>')
def serve_static(filename):
    print(f"Serving static file: {filename}") 
    return send_from_directory(app.static_folder, filename)

@app.route('/analyze', methods=['POST'])
def analyze_website(): 
    global last_analysis_results 
    print("Received /analyze POST request.") 
    data = request.get_json()
    url = data.get('url')
    # Get preferred language from header, default to 'en'
    lang = request.headers.get('Accept-Language', 'en').split(',')[0].split('-')[0]

    if not url or not is_valid_url(url): 
        print(f"Invalid URL provided: {url}") 
        return jsonify({"error": "Invalid URL provided."}), 400

    results = {}
    try:
        print(f"Starting analysis for URL: {url}") 
        
        print("Getting domain analysis...")
        domain_data = get_domain_analysis(url)
        results['domain_authority'] = domain_data
        print("Domain analysis complete.")

        print("Getting PageSpeed Insights...")
        # Pass API key to pagespeed_analysis
        pagespeed_data = get_pagespeed_insights(url, app.config['PAGESPEED_API_KEY'])
        results['page_speed'] = pagespeed_data
        print("PageSpeed Insights complete.")

        print("Performing SEO analysis...")
        seo_data = perform_seo_analysis(url)
        results['seo_quality'] = seo_data
        print("SEO analysis complete.")

        # Add new non-API SEO analyses
        if 'page_text' in seo_data.get('elements', {}):
            content_len_data = get_content_length(seo_data['elements']['page_text'])
            results['seo_quality']['elements']['content_length'] = content_len_data
            print(f"Content length analysis complete: {content_len_data}")
        
        robots_present = check_robots_txt(url)
        sitemap_present = check_sitemap_xml(url)
        results['seo_quality']['elements']['robots_txt_present'] = robots_present
        results['seo_quality']['elements']['sitemap_xml_present'] = sitemap_present
        print(f"Robots.txt present: {robots_present}, Sitemap.xml present: {sitemap_present}")


        print("Performing UX analysis...")
        ux_data = perform_ux_analysis(url)
        results['user_experience'] = ux_data
        print("UX analysis complete.")

        # Add new non-API UX analyses
        if 'raw_html' in ux_data: # Assuming ux_analysis returns raw_html
            viewport_meta_present = check_viewport_meta(ux_data['raw_html'])
            results['user_experience']['viewport_meta_present'] = viewport_meta_present
            print(f"Viewport meta present: {viewport_meta_present}")
        else:
            results['user_experience']['viewport_meta_present'] = False # Default if no raw_html

        
        # Extract text sample for AI analysis
        results['extracted_text_sample'] = "No content extracted for AI analysis."
        if results['seo_quality'] and results['seo_quality'].get('elements') and results['seo_quality']['elements'].get('page_text'):
            results['extracted_text_sample'] = results['seo_quality']['elements']['page_text'][:2000] # Increased sample size

        print("Getting AI suggestions...")
        # Pass language to AI suggestions, API key is handled internally by ai_suggestions
        ai_data = get_ai_suggestions(url, results, lang)
        results['ai_insights'] = ai_data
        print("AI suggestions complete.")

        print("Getting AdSense readiness assessment...")
        # Pass language to AdSense assessment, API key is handled internally
        adsense_assessment = get_adsense_readiness_assessment(results, lang)
        results['adsense_readiness'] = adsense_assessment
        print("AdSense readiness assessment complete.")

        print("Getting broken link fix suggestions...")
        broken_links = results.get('seo_quality', {}).get('elements', {}).get('broken_links', [])
        if broken_links and isinstance(broken_links, list) and len(broken_links) > 0: # Ensure it's a list and not empty
            broken_link_suggestions = get_broken_link_fix_suggestions(broken_links, lang)
            results['broken_link_suggestions'] = broken_link_suggestions
        else:
            results['broken_link_suggestions'] = {"suggestions": "No broken links found to suggest fixes for."}
        print("Broken link fix suggestions complete.")


        last_analysis_results = results 
        print("Analysis complete. Returning results.") 
        return jsonify(results), 200

    except Exception as e:
        print(f"Critical Error during analysis: {e}") 
        return jsonify({"error": "An unexpected error occurred during analysis.", "details": str(e)}), 500

@app.route('/generate_report', methods=['POST'])
def generate_report():
    global last_analysis_results 
    print("Received /generate_report POST request.") 
    url = request.get_json().get('url') 

    analysis_results = last_analysis_results 

    if not analysis_results or not url:
        print("Missing analysis results or URL for report generation.") 
        return jsonify({"error": "Missing analysis results or URL for report generation."}), 400

    try:
        print(f"Generating PDF report for URL: {url}") 
        pdf_path = generate_pdf_report(url, analysis_results)
        print("PDF report generated. Sending file.") 
        return send_file(pdf_path, as_attachment=True, download_name=f"{url.replace('https://', '').replace('http://', '')}_analysis_report.pdf", mimetype='application/pdf')
    except Exception as e:
        print(f"Error generating PDF report: {e}") 
        return jsonify({"error": "Failed to generate PDF report.", "details": str(e)}), 500

# AI endpoint for SEO rewrites
@app.route('/ai_rewrite_seo', methods=['POST'])
def ai_rewrite_seo():
    data = request.get_json()
    title = data.get('title')
    meta_description = data.get('meta_description')
    keywords = data.get('keywords')
    lang = request.headers.get('Accept-Language', 'en').split(',')[0].split('-')[0]

    if not title and not meta_description:
        return jsonify({"error": "No title or meta description provided for rewrite."}), 400

    try:
        print(f"Generating AI SEO rewrites for title: {title}, meta: {meta_description}")
        # Removed api_key argument here as it's fetched internally by generate_seo_rewrites
        rewrites = generate_seo_rewrites(title, meta_description, keywords, lang) 
        print("AI SEO rewrites complete.")
        return jsonify(rewrites), 200
    except Exception as e:
        print(f"Error generating AI SEO rewrites: {e}")
        return jsonify({"error": "Failed to generate AI SEO rewrites.", "details": str(e)}), 500

# AI endpoint for content refinement
@app.route('/ai_refine_content', methods=['POST'])
def ai_refine_content():
    data = request.get_json()
    text_sample = data.get('text_sample')
    lang = request.headers.get('Accept-Language', 'en').split(',')[0].split('-')[0]

    if not text_sample:
        return jsonify({"error": "No text sample provided for refinement."}), 400

    try:
        print(f"Generating AI content refinement for text sample: {text_sample[:50]}...")
        # Removed api_key argument here as it's fetched internally by refine_content
        refinement = refine_content(text_sample, lang) 
        print("AI content refinement complete.")
        return jsonify(refinement), 200
    except Exception as e:
        print(f"Error generating AI content refinement: {e}")
        return jsonify({"error": "Failed to generate AI content refinement.", "details": str(e)}), 500

# New: Article Analyzer endpoint (Phase 3)
@app.route('/analyze_article_content', methods=['POST'])
def analyze_article_content():
    data = request.get_json()
    article_text = data.get('article_text')
    lang = request.headers.get('Accept-Language', 'en').split(',')[0].split('-')[0]

    if not article_text:
        return jsonify({"error": "No article text provided for analysis."}), 400

    try:
        print(f"Analyzing article content (first 50 chars): {article_text[:50]}...")
        analysis_results = analyze_article_content_ai(article_text, lang)
        print("Article content analysis complete.")
        return jsonify(analysis_results), 200
    except Exception as e:
        print(f"Error analyzing article content: {e}")
        return jsonify({"error": "Failed to analyze article content.", "details": str(e)}), 500

# New: Article Rewriter endpoint (Phase 3)
@app.route('/rewrite_article', methods=['POST'])
def rewrite_article():
    data = request.get_json()
    article_text = data.get('article_text')
    lang = request.headers.get('Accept-Language', 'en').split(',')[0].split('-')[0]

    if not article_text:
        return jsonify({"error": "No article text provided for rewriting."}), 400

    try:
        print(f"Rewriting article (first 50 chars): {article_text[:50]}...")
        rewritten_content = rewrite_article_ai(article_text, lang)
        print("Article rewriting complete.")
        return jsonify(rewritten_content), 200
    except Exception as e:
        print(f"Error rewriting article: {e}")
        return jsonify({"error": "Failed to rewrite article.", "details": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
