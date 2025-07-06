import os
from flask import Flask, render_template, request, jsonify

# تحديد مسارات المجلدات الثابتة والقوالب
# هذا يعتمد على هيكل مشروعك
# هنا نفترض أن 'frontend/public' هو المجلد الذي يحتوي على index.html وملفات الـ static (css, js)
base_dir = os.path.abspath(os.path.dirname(__file__))
static_folder_path = os.path.join(base_dir, 'frontend', 'public')
template_folder_path = os.path.join(base_dir, 'frontend', 'public') # index.html موجود هنا

app = Flask(__name__,
            static_folder=static_folder_path,
            template_folder=template_folder_path)

# مسار الصفحة الرئيسية
@app.route('/')
def index():
    return render_template('index.html')

# نقطة نهاية API لتحليل الموقع
@app.route('/analyze', methods=['POST'])
def analyze_website():
    data = request.get_json()
    url = data.get('url')

    if not url:
        return jsonify({'error': 'URL is required'}), 400

    print(f"Request received to analyze: {url}") # لغرض التصحيح في السيرفر

    # === هذا هو الجزء الذي ستستبدله بمنطق التحليل الحقيقي لاحقًا ===
    # حاليًا، بيانات وهمية (Dummy Data)
    import time
    time.sleep(2) # محاكاة عملية التحليل (انتظر ثانيتين)

    dummy_results = {
        "seo_score": "85",
        "seo_description": "أداء SEO جيد، مع توصيات لزيادة الروابط الخلفية وتحسين الكلمات المفتاحية.",
        "speed_score": "92",
        "speed_description": "سرعة تحميل ممتازة على كل من الأجهزة المحمولة وسطح المكتب، مما يضمن تجربة مستخدم سريعة.",
        "ux_score": "78",
        "ux_description": "تجربة مستخدم جيدة، يمكن تحسين تفاعل العناصر وتصميم الشاشات الصغيرة لتجربة أفضل.",
        "domain_authority": "75/100",
        "domain_authority_desc": "سلطة نطاق عالية تشير إلى موثوقية وثقة قوية للموقع.",
        "security_score": "A+",
        "security_description": "نتائج أمان ممتازة، تم الكشف عن بروتوكولات HTTPS قوية ولا توجد نقاط ضعف معروفة.",
        "ai_summary": "الموقع يتمتع بأداء جيد بشكل عام في جوانب السرعة والأمان، مع الحاجة إلى بعض التحسينات في SEO وتجربة المستخدم لزيادة فعاليته وتصنيفه في محركات البحث."
    }
    # =============================================================

    return jsonify(dummy_results)

# نقطة نهاية API لجلب النصوص حسب اللغة (للتدويل)
@app.route('/translations/<lang>')
def get_translations(lang):
    translations = {
        "ar": {
            "app_title": "محلل الويب الاحترافي",
            "analyze_any_website": "تحليل أي موقع ويب",
            "placeholder_url": "https://www.example.com",
            "analyze_button": "تحليل",
            "loading_text": "جاري تحليل الموقع، الرجاء الانتظار...",
            "analysis_results_for": "نتائج التحليل لـ:",
            "seo_score_title": "نقاط SEO",
            "seo_description_placeholder": "...", # سيتم استبدالها بالوصف الفعلي
            "speed_score_title": "نقاط السرعة",
            "speed_description_placeholder": "...",
            "ux_score_title": "نقاط تجربة المستخدم (UX)",
            "ux_description_placeholder": "...",
            "domain_authority_title": "سلطة النطاق وثقة الموقع",
            "security_score_title": "نقاط الأمان",
            "ai_summary_title": "ملخص الذكاء الاصطناعي",
            "export_pdf_button": "تصدير PDF",
            "error_url_required": "الرجاء إدخال رابط موقع.",
            "error_analysis_failed": "حدث خطأ أثناء تحليل الموقع. الرجاء المحاولة مرة أخرى."
        },
        "en": {
            "app_title": "Web Analyzer Pro",
            "analyze_any_website": "Analyze Any Website",
            "placeholder_url": "https://www.example.com",
            "analyze_button": "Analyze",
            "loading_text": "Analyzing website, please wait...",
            "analysis_results_for": "Analysis Results for:",
            "seo_score_title": "SEO Score",
            "seo_description_placeholder": "...",
            "speed_score_title": "Speed Score",
            "speed_description_placeholder": "...",
            "ux_score_title": "User Experience (UX) Score",
            "ux_description_placeholder": "...",
            "domain_authority_title": "Domain Authority & Site Trust",
            "security_score_title": "Security Score",
            "ai_summary_title": "AI Summary",
            "export_pdf_button": "Export PDF",
            "error_url_required": "Please enter a website URL.",
            "error_analysis_failed": "An error occurred during analysis. Please try again."
        }
    }
    return jsonify(translations.get(lang, translations["en"])) # ارجع الإنجليزية كافتراضي

if __name__ == '__main__':
    app.run(debug=True)
