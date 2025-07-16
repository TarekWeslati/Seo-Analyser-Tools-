import os
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
import asyncio
import httpx

# Import services (other files containing analysis logic)
from services.domain_analysis import get_domain_analysis
from services.pagespeed_analysis import get_pagespeed_insights
from services.seo_analysis import perform_seo_analysis
from services.ux_analysis import perform_ux_analysis
from services.ai_suggestions import get_ai_suggestions
from utils.url_validator import is_valid_url
from utils.pdf_generator import generate_pdf_report

# Determine the path for templates and static files
template_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend'))
static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend/public'))

# Initialize Flask app with template and static folders
app = Flask(__name__,
            template_folder=template_dir,
            static_folder=static_dir,
            static_url_path='/')
CORS(app)

# Load API keys from environment variables
app.config['PAGESPEED_API_KEY'] = os.getenv('PAGESPEED_API_KEY')
app.config['OPENAI_API_KEY'] = os.getenv('OPENAI_API_KEY')

# Route for the homepage, serving index.html directly as a static file
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

# Route to serve other static files (CSS, JS, images) from the public folder
@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)


@app.route('/analyze', methods=['POST'])
async def analyze_website():
    data = request.get_json()
    url = data.get('url')

    if not url or not is_valid_url(url):
        return jsonify({"error": "Invalid URL provided."}), 400

    results = {}
    try:
        loop = asyncio.get_event_loop()
        
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

        if app.config.get('OPENAI_API_KEY'):
            ai_data = await loop.run_in_executor(None, get_ai_suggestions, url, results, app.config['OPENAI_API_KEY'])
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
    app.run(debug=True, host='0.0.0.0', port=5000)
