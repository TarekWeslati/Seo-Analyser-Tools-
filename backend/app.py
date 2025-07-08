import os
from flask import Flask, render_template, request, jsonify

# --- 1. تحديد مسارات المجلدات ---
# هذا الجزء حيوي جداً لتحديد مكان ملفاتك.
# os.path.dirname(__file__) يعطي المسار للمجلد الذي يحتوي على app.py
# os.path.abspath(...) يحول المسار إلى مسار مطلق
# os.path.join(...) يبني المسار بطريقة صحيحة لنظام التشغيل (Windows/Linux)

# المسار الأساسي لمجلد app.py (الذي هو الآن داخل مجلد 'backend')
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# تحديد مسار المجلد الذي يحتوي على ملفات الواجهة الأمامية (index.html, css, js)
# بما أن app.py موجود داخل 'backend'، نحتاج للصعود مجلد واحد ('..')
# للوصول إلى جذر المشروع، ثم الدخول إلى 'frontend/public'
FRONTEND_PUBLIC_DIR = os.path.join(BASE_DIR, '..', 'frontend', 'public')

# --- 2. تهيئة تطبيق Flask ---
# نخبر Flask أين يجد ملفات القوالب (HTML) والملفات الثابتة (CSS/JS/صور)
app = Flask(__name__,
            template_folder=FRONTEND_PUBLIC_DIR,  # ملفات HTML موجودة هنا
            static_folder=FRONTEND_PUBLIC_DIR)    # ملفات CSS/JS/صور موجودة هنا أيضاً

# --- 3. المسارات (Routes) ونقاط النهاية (API Endpoints) ---

# المسار الرئيسي '/' - لعرض الصفحة الرئيسية للتطبيق
@app.route('/')
def index():
    # render_template يبحث عن 'index.html' داخل المجلد المحدد في template_folder
    return render_template('index.html')

# نقطة نهاية API لتحليل الموقع - تستقبل طلب POST
@app.route('/analyze', methods=['POST'])
def analyze_website():
    try:
        data = request.get_json() # استلام البيانات بتنسيق JSON من الواجهة الأمامية
        url = data.get('url')    # استخراج الرابط المرسل

        # التحقق مما إذا كان الرابط موجوداً
        if not url:
            return jsonify({'error': 'URL is required'}), 400

        print(f"طلب تحليل رابط: {url}") # لغرض التصحيح في سجل الخادم

        # === 4. منطق التحليل (بيانات وهمية حالياً) ===
        # هذا هو الجزء الذي ستستبدله بمنطق التحليل الحقيقي لاحقاً
        # نستخدم sleep لمحاكاة وقت معالجة التحليل
        import time
        time.sleep(2) # انتظار ثانيتين لمحاكاة التحليل

        # بيانات وهمية (Dummy Data) لإظهار كيف ستظهر النتائج في الواجهة الأمامية
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

        # إرجاع النتائج الوهمية بتنسيق JSON إلى الواجهة الأمامية
        return jsonify(dummy_results)

    except Exception as e:
        # معالجة أي أخطاء تحدث أثناء معالجة الطلب
        print(f"حدث خطأ في analyze_website: {e}")
        return jsonify({'error': 'An internal server error occurred.'}), 500

# نقطة نهاية API لجلب النصوص حسب اللغة (للتدويل)
@app.route('/translations/<lang>')
def get_translations(lang):
    # قاموس يحتوي على الترجمات لكل لغة
    translations_data = {
        "ar": {
            "app_title": "محلل الويب الاحترافي",
            "analyze_any_website": "تحليل أي موقع ويب",
            "placeholder_url": "https://www.example.com",
            "analyze_button": "تحليل",
            "loading_text": "جاري تحليل الموقع، الرجاء الانتظار...",
            "analysis_results_for": "نتائج التحليل لـ:",
            "seo_score_title": "نقاط SEO",
            "speed_score_title": "نقاط السرعة",
            "ux_score_title": "نقاط تجربة المستخدم (UX)",
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
            "speed_score_title": "Speed Score",
            "ux_score_title": "User Experience (UX) Score",
            "domain_authority_title": "Domain Authority & Site Trust",
            "security_score_title": "Security Score",
            "ai_summary_title": "AI Summary",
            "export_pdf_button": "Export PDF",
            "error_url_required": "Please enter a website URL.",
            "error_analysis_failed": "An error occurred during analysis. Please try again."
        }
    }
    # إرجاع الترجمات للغة المطلوبة، أو الإنجليزية كافتراضي إذا لم توجد
    return jsonify(translations_data.get(lang, translations_data["en"]))

# --- 5. تشغيل التطبيق ---
# هذا الجزء يضمن تشغيل الخادم عند تنفيذ الملف مباشرة
if __name__ == '__main__':
    # debug=True مفيد للتطوير: يعيد تحميل الخادم عند التغييرات ويعرض أخطاء مفصلة
    # يجب تعيينه False في بيئة الإنتاج لأسباب أمنية وأداء
    app.run(debug=True)
