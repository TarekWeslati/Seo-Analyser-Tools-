import os
from flask import Flask, request, jsonify, render_template, send_file
from flask_cors import CORS # For handling CORS if frontend is on a different port/domain

from services.domain_analysis import get_domain_analysis
from services.pagespeed_analysis import get_pagespeed_insights
from services.seo_analysis import perform_seo_analysis
from services.ux_analysis import perform_ux_analysis
from services.ai_suggestions import get_ai_suggestions
from utils.url_validator import is_valid_url
from utils.pdf_generator import generate_pdf_report

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Load configuration from environment variables or a config file
app.config['PAGESPEED_API_KEY'] = os.getenv('PAGESPEED_API_KEY')
app.config['OPENAI_API_KEY'] = os.getenv('OPENAI_API_KEY') # Optional

@app.route('/')
def index():
    return render_template('index.html') # Serve the frontend (if integrated directly)

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
        if app.config['OPENAI_API_KEY']:
            ai_data = get_ai_suggestions(url, results, app.config['OPENAI_API_KEY'])
            results['ai_insights'] = ai_data

        return jsonify(results), 200

    except Exception as e:
        print(f"Error during analysis: {e}")
        return jsonify({"error": "An error occurred during analysis.", "details": str(e)}), 500

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
    app.run(debug=True, host='0.0.0.0', port=5000)
Rename Backend folder to backend".
