import os
from flask import Flask, request, jsonify, render_template, send_file, send_from_directory
from flask_cors import CORS # لمعالجة CORS إذا كانت الواجهة الأمامية على منفذ/نطاق مختلف

# استيراد الخدمات (الملفات الأخرى التي تحتوي على منطق التحليل)
from services.domain_analysis import get_domain_analysis
from services.pagespeed_analysis import get_pagespeed_insights
from services.seo_analysis import perform_seo_analysis
from services.ux_analysis import perform_ux_analysis
from services.ai_suggestions import get_ai_suggestions
from utils.url_validator import is_valid_url
from utils.pdf_generator import generate_pdf_report

# تحديد مسار مجلد القوالب وملفات الـ static
# ملف app.py موجود في backend/
# مجلد frontend/ موجود في نفس مستوى مجلد backend/
# مجلد public/ موجود داخل frontend/
template_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend'))
static_dir = os.path.a bspath(os.path.join(os.path.dirname(__file__), '../frontend/public'))

# تهيئة تطبيق Flask مع تحديد مسارات القوالب والملفات الثابتة
app = Flask(__name__,
            template_folder=template_dir,
            static_folder=static_dir,
            static_url_path='/') # استخدام '/' لخدمة الملفات الثابتة مباشرة من الجذر
CORS(app) # تفعيل CORS لجميع المسارات

# تحميل مفاتيح الـ API من متغيرات البيئة (ملف .env على جهازك، أو إعدادات Render)
app.config['PAGESPEED_API_KEY'] = os.getenv('PAGESPEED_API_KEY')
app.config['OPENAI_API_KEY'] = os.getenv('OPENAI_API_KEY') # اختياري

# مسار الصفحة الرئيسية لخدمة index.html مباشرة كملف ثابت
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

# مسار لخدمة باقي الملفات الثابتة (مثل CSS, JS, الصور) من مجلد public
# هذا المسار سيخدم أي ملف داخل static_folder مباشرة من الجذر
@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)


@app.route('/analyze', methods=['POST'])
def analyze_website():
    data = request.get_json()
    url = data.get('url')

    if not url or not is_valid_url(url):
        return jsonify({"error": "عنوان URL غير صالح."}), 400

    results = {}
    try:
        # 1. تحليل موثوقية النطاق والثقة
        domain_data = get_domain_analysis(url)
        results['domain_authority'] = domain_data

        # 2. سرعة وأداء الصفحة
        pagespeed_data = get_pagespeed_insights(url, app.config['PAGESPEED_API_KEY'])
        results['page_speed'] = pagespeed_data

        # 3. جودة وهيكل الـ SEO
        seo_data = perform_seo_analysis(url)
        results['seo_quality'] = seo_data

        # 4. تجربة المستخدم (UX)
        ux_data = perform_ux_analysis(url)
        results['user_experience'] = ux_data

        # ميزات الذكاء الاصطناعي الاختيارية
        if app.config.get('OPENAI_API_KEY'): # تأكد من وجود المفتاح لتفعيل الميزة
            ai_data = get_ai_suggestions(url, results, app.config['OPENAI_API_KEY'])
            results['ai_insights'] = ai_data

        return jsonify(results), 200

    except Exception as e:
        print(f"حدث خطأ أثناء التحليل: {e}")
        return jsonify({"error": "حدث خطأ غير متوقع أثناء التحليل.", "details": str(e)}), 500

@app.route('/generate_report', methods=['POST'])
def generate_report():
    data = request.get_json()
    analysis_results = data.get('results')
    url = data.get('url')

    if not analysis_results or not url:
        return jsonify({"error": "النتائج أو عنوان URL مفقودان لتوليد التقرير."}), 400

    try:
        pdf_path = generate_pdf_report(url, analysis_results)
        # إرسال الملف كملف مرفق للتنزيل
        return send_file(pdf_path, as_attachment=True, download_name=f"{url.replace('https://', '').replace('http://', '')}_analysis_report.pdf", mimetype='application/pdf')
    except Exception as e:
        print(f"حدث خطأ أثناء توليد تقرير PDF: {e}")
        return jsonify({"error": "فشل في توليد تقرير PDF.", "details": str(e)}), 500


if __name__ == '__main__':
    # تشغيل التطبيق في وضع التصحيح (Debug Mode) على المنفذ 5000
    # لا تستخدم debug=True في بيئة الإنتاج
    app.run(debug=True, host='0.0.0.0', port=5000)
