import os
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
import json # تأكد من استيراد json
# Import services
from services.domain_analysis import get_domain_analysis
from services.pagespeed_analysis import get_pagespeed_insights
from services.seo_analysis import perform_seo_analysis
from services.ux_analysis import perform_ux_analysis
from services.ai_suggestions import get_ai_suggestions
from utils.url_validator import is_valid_url
from utils.pdf_generator import generate_pdf_report

# تحديد المسارات الصحيحة للملفات الثابتة والقوالب
# تأكد أن هذه المسارات صحيحة بالنسبة لهيكل مشروعك
template_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend/public')) # مجلد القوالب هو public داخل frontend
static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend/public')) # مجلد الملفات الثابتة هو public داخل frontend

app = Flask(__name__,
            template_folder=template_dir,
            static_folder=static_dir,
            static_url_path='/') 
CORS(app)

app.config['PAGESPEED_API_KEY'] = os.getenv('PAGESPEED_API_KEY')
# لا تحتاج لتعيين GEMINI_API_KEY هنا، لأنه يتم قراءته مباشرة في ai_suggestions.py

# متغير عالمي مؤقت لتخزين آخر نتائج التحليل
# هذا ليس الحل الأمثل لتطبيق متعدد المستخدمين، لكنه سيعمل للغرض الحالي
last_analysis_results = {} 

# المسار الجذر لخدمة ملفات الواجهة الأمامية
@app.route('/')
def index():
    # تأكد من أن index.html موجود في مجلد static_folder
    return send_from_directory(app.static_folder, 'index.html')

# مسار لخدمة الملفات الثابتة الأخرى (مثل CSS و JS)
# هذا المسار سيتعامل مع أي طلب لا يطابق المسار الجذر
@app.route('/<path:filename>')
def serve_static(filename):
    # تأكد من أن الملفات موجودة في مجلد static_folder
    return send_from_directory(app.static_folder, filename)

@app.route('/analyze', methods=['POST'])
def analyze_website(): 
    global last_analysis_results 
    data = request.get_json()
    url = data.get('url')

    if not url or not is_valid_url(url):
        # تأكد من أن الاستجابة هي JSON حتى لو كان هناك خطأ في الإدخال
        return jsonify({"error": "Invalid URL provided."}), 400

    results = {}
    try:
        domain_data = get_domain_analysis(url)
        pagespeed_data = get_pagespeed_insights(url, app.config['PAGESPEED_API_KEY'])
        seo_data = perform_seo_analysis(url)
        ux_data = perform_ux_analysis(url)

        results['domain_authority'] = domain_data
        results['page_speed'] = pagespeed_data
        results['seo_quality'] = seo_data
        results['user_experience'] = ux_data
        
        # التأكد من أن extracted_text_sample دائماً موجود
        results['extracted_text_sample'] = "No text extracted for AI analysis."
        if results['seo_quality'] and results['seo_quality'].get('elements') and results['seo_quality']['elements'].get('page_text'):
            results['extracted_text_sample'] = results['seo_quality']['elements']['page_text'][:1000] # اقتطاع النص لتجنب الأحمال الكبيرة

        ai_data = get_ai_suggestions(url, results)
        results['ai_insights'] = ai_data

        last_analysis_results = results # حفظ النتائج في المتغير العالمي
        return jsonify(results), 200

    except Exception as e:
        print(f"Error during analysis: {e}")
        # تأكد من أن الاستجابة هي JSON حتى لو كان هناك خطأ في المعالجة
        return jsonify({"error": "An unexpected error occurred during analysis.", "details": str(e)}), 500

@app.route('/generate_report', methods=['POST'])
def generate_report():
    global last_analysis_results 
    url = request.get_json().get('url') 

    analysis_results = last_analysis_results 

    if not analysis_results or not url:
        return jsonify({"error": "Missing analysis results or URL for report generation."}), 400

    try:
        pdf_path = generate_pdf_report(url, analysis_results)
        return send_file(pdf_path, as_attachment=True, download_name=f"{url.replace('https://', '').replace('http://', '')}_analysis_report.pdf", mimetype='application/pdf')
    except Exception as e:
        print(f"Error generating PDF report: {e}")
        return jsonify({"error": "Failed to generate PDF report.", "details": str(e)}), 500


if __name__ == '__main__':
    # عند التشغيل محلياً، تأكد من استخدام نفس المنفذ الذي تتوقعه Render (عادة 10000 في الإنتاج)
    # لكن 5000 جيد للتطوير المحلي
    app.run(debug=True, host='0.0.0.0', port=5000)
