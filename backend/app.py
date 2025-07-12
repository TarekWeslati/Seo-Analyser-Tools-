import os
from flask import Flask, request, jsonify, render_template, send_file, send_from_directory
from flask_cors import CORS # For handling CORS if frontend is on a different port/domain

# Import services (other files containing analysis logic)
from services.domain_analysis import get_domain_analysis
from services.pagespeed_analysis import get_pagespeed_insights
from services.seo_analysis import perform_seo_analysis
from services.ux_analysis import perform_ux_analysis
from services.ai_suggestions import get_ai_suggestions
from utils.url_validator import is_valid_url
from utils.pdf_generator import generate_pdf_report

# Determine the path for templates and static files
# app.py is in backend/
# frontend/ is at the same level as backend/
# public/ is inside frontend/
template_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend'))
static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend/public'))

# Initialize Flask app with template and static folders
app = Flask(__name__,
            template_folder=template_dir,
            static_folder=static_dir,
            static_url_path='/') # Use '/' to serve static files directly from root URL
CORS(app) # Enable CORS for all routes

# Load API keys from environment variables (from .env file locally, or Render settings)
app.config['PAGESPEED_API_KEY'] = os.getenv('PAGESPEED_API_KEY')
app.config['OPENAI_API_KEY'] = os.getenv('OPENAI_API_KEY') # Optional

# Route for the homepage, serving index.html directly as a static file
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

# Route to serve other static files (CSS, JS, images) from the public folder
# This route will serve any file within static_folder directly from the root URL
@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)


@app.route('/analyze', methods=['POST'])
def analyze_website():
    data = request.get_json()
    url = data.get('url')

    if not url or not is_valid_url(url):
        return jsonify({"error": "Invalid URL provided."}), 400

    results = {}
    try:
        # 1. Domain Authority & Trust
        domain_data = get_domain_analysis(url)
        results['domain_authority'] = domain_data

        # 2. Page Speed & Performance
        pagespeed_data = get_pagespeed_insights(url, app.config['PAGESPEED_API_KEY'])
        results['page_speed'] = pagespeed_data

        # 3. SEO Quality & Structure
        seo_data = perform_seo_analysis(url)
        results['seo_quality'] = seo_data

        # 4. User Experience (UX)
        ux_data = perform_ux_analysis(url)
        results['user_experience'] = ux_data

        # Optional AI Features
        if app.config.get('OPENAI_API_KEY'): # Check if key exists to enable feature
            ai_data = get_ai_suggestions(url, results, app.config['OPENAI_API_KEY'])
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
        # Send the file as an attachment for download
        return send_file(pdf_path, as_attachment=True, download_name=f"{url.replace('https://', '').replace('http://', '')}_analysis_report.pdf", mimetype='application/pdf')
    except Exception as e:
        print(f"Error generating PDF report: {e}")
        return jsonify({"error": "Failed to generate PDF report.", "details": str(e)}), 500


if __name__ == '__main__':
    # Run the application in debug mode on port 5000
    # Do not use debug=True in production environment
    app.run(debug=True, host='0.0.0.0', port=5000)
