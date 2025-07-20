import os
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
import asyncio
import httpx # Required if your service functions are async

# Import services (other files containing analysis logic)
from services.domain_analysis import get_domain_analysis
from services.pagespeed_analysis import get_pagespeed_insights
from services.seo_analysis import perform_seo_analysis
from services.ux_analysis import perform_ux_analysis
from services.ai_suggestions import get_ai_suggestions # New import
from utils.url_validator import is_valid_url
from utils.pdf_generator import generate_pdf_report

# Determine the path for templates and static files
# app.py is in backend/
# frontend/ is at the same level as backend/
# public/ is inside frontend/
template_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend'))
static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend/public'))

# Initialize Flask app with template and static folders
# static_url_path='/' means files in static_folder will be served directly from the root
# For example, frontend/public/js/main.js will be accessible at /js/main.js
app = Flask(__name__,
            template_folder=template_dir,
            static_folder=static_dir,
            static_url_path='/') 
CORS(app)

# Load API keys from environment variables
app.config['PAGESPEED_API_KEY'] = os.getenv('PAGESPEED_API_KEY')
# No need to load OPENAI_API_KEY/GEMINI_API_KEY here, it's handled by Canvas runtime for LLM calls

# Route for the homepage, serving index.html directly as a static file
@app.route('/')
def index():
    # Render index.html from the static_folder (which is frontend/public/)
    return send_from_directory(app.static_folder, 'index.html')

# Route to serve other static files (CSS, JS, images) from the public folder
# This route is needed if static_url_path is not set to '/' or if you have
# files directly under public/ (like main.js, tailwind.css)
@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)


@app.route('/analyze', methods=['POST'])
async def analyze_website(): # Keep async def
    data = request.get_json()
    url = data.get('url')

    if not url or not is_valid_url(url):
        return jsonify({"error": "Invalid URL provided."}), 400

    results = {}
    try:
        loop = asyncio.get_event_loop()
        
        # We use run_in_executor to run synchronous (blocking) functions in a separate thread pool
        # This allows the async route to remain non-blocking for the main event loop
        tasks = [
            loop.run_in_executor(None, get_domain_analysis, url),
            loop.run_in_executor(None, get_pagespeed_insights, url, app.config['PAGESPEED_API_KEY']),
            loop.run_in_executor(None, perform_seo_analysis, url),
            loop.run_in_executor(None, perform_ux_analysis, url)
        ]

        domain_data, pagespeed_data, seo_data, ux_data = await asyncio.gather(*tasks)

        results['domain_authority'] = domain_data
        results['page_speed'] = pagespeed_data
        results['seo_quality'] = seo_data
        results['user_experience'] = ux_data
        
        # Add a placeholder for extracted text sample for AI analysis
        # In a real scenario, you would extract a text sample during SEO/UX analysis
        # For now, we'll use a dummy or simplified version
        results['extracted_text_sample'] = "This is a sample text extracted from the website for AI analysis. It would typically contain the main content of the page."
        if results['seo_quality'] and results['seo_quality'].get('elements') and results['seo_quality']['elements'].get('page_text'):
            results['extracted_text_sample'] = results['seo_quality']['elements']['page_text'][:1000] # Use first 1000 chars of extracted text

        # Call AI suggestions service
        ai_data = await get_ai_suggestions(url, results) # This is now an async call
        results['ai_insights'] = ai_data

        return jsonify(results), 200

    except Exception as e:
        print(f"Error during analysis: {e}")
        return jsonify({"error": "An unexpected error occurred during analysis.", "details": str(e)}), 500

@app.route('/generate_report', methods=['POST'])
def generate_report():
    data = request.get_json()
    analysis_results = data.get('results')
    url = data.get('url')

    if not analysis_results or not url:
        return jsonify({"error": "Missing analysis results or URL for report generation."}), 400

    try:
        pdf_path = generate_pdf_report(url, analysis_results)
        return send_file(pdf_path, as_attachment=True, download_name=f"{url.replace('https://', '').replace('http://', '')}_analysis_report.pdf", mimetype='application/pdf')
    except Exception as e:
        print(f"Error generating PDF report: {e}")
        return jsonify({"error": "Failed to generate PDF report.", "details": str(e)}), 500


if __name__ == '__main__':
    # For local development, you can run: python app.py
    # For production on Render, ensure your Procfile uses uvicorn worker:
    # web: gunicorn backend.app:app --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
    app.run(debug=True, host='0.0.0.0', port=5000)
