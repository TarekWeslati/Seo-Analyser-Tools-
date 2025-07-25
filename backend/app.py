import os
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
import json 

# Import services
from backend.services.domain_analysis import get_domain_analysis # تأكد من المسار الكامل
from backend.services.pagespeed_analysis import get_pagespeed_insights # تأكد من المسار الكامل
from backend.services.seo_analysis import perform_seo_analysis # تأكد من المسار الكامل
from backend.services.ux_analysis import perform_ux_analysis # تأكد من المسار الكامل
from backend.services.ai_suggestions import get_ai_suggestions # تأكد من المسار الكامل
from backend.utils.url_validator import is_valid_url # **هذا هو التغيير الرئيسي**
from backend.utils.pdf_generator import generate_pdf_report # تأكد من المسار الكامل

# تحديد المسارات الصحيحة للملفات الثابتة والقوالب
template_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend/public'))
static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend/public'))

app = Flask(__name__,
            template_folder=template_dir,
            static_folder=static_dir,
            static_url_path='/') 
CORS(app)

app.config['PAGESPEED_API_KEY'] = os.getenv('PAGESPEED_API_KEY')

last_analysis_results = {} 

# المسار الجذر لخدمة ملفات الواجهة الأمامية
@app.route('/')
def index():
    print("Serving index.html") 
    return send_from_directory(app.static_folder, 'index.html')

# مسار لخدمة الملفات الثابتة الأخرى (مثل CSS و JS)
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

    if not url or not is_valid_url(url): # هنا يتم استخدام is_valid_url
        print(f"Invalid URL provided: {url}") 
        return jsonify({"error": "Invalid URL provided."}), 400

    results = {}
    try:
        print(f"Starting analysis for URL: {url}") 
        
        print("Getting domain analysis...")
        domain_data = get_domain_analysis(url)
        print("Domain analysis complete.")

        print("Getting PageSpeed Insights...")
        pagespeed_data = get_pagespeed_insights(url, app.config['PAGESPEED_API_KEY'])
        print("PageSpeed Insights complete.")

        print("Performing SEO analysis...")
        seo_data = perform_seo_analysis(url)
        print("SEO analysis complete.")

        print("Performing UX analysis...")
        ux_data = perform_ux_analysis(url)
        print("UX analysis complete.")

        results['domain_authority'] = domain_data
        results['page_speed'] = pagespeed_data
        results['seo_quality'] = seo_data
        results['user_experience'] = ux_data
        
        results['extracted_text_sample'] = "No text extracted for AI analysis."
        if results['seo_quality'] and results['seo_quality'].get('elements') and results['seo_quality']['elements'].get('page_text'):
            results['extracted_text_sample'] = results['seo_quality']['elements']['page_text'][:1000]

        print("Getting AI suggestions...")
        ai_data = get_ai_suggestions(url, results)
        results['ai_insights'] = ai_data
        print("AI suggestions complete.")

        last_analysis_results = results 
        print("Analysis complete. Returning results.") 
        return jsonify(results), 200

    except Exception as e:
        print(f"Critical Error during analysis: {e}", exc_info=True) 
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
        print(f"Error generating PDF report: {e}", exc_info=True) 
        return jsonify({"error": "Failed to generate PDF report.", "details": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
