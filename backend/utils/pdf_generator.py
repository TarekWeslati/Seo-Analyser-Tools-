import os
from weasyprint import HTML, CSS
from jinja2 import Environment, FileSystemLoader

def generate_pdf_report(url, results):
    # تحديد مسار القوالب (مجلد 'templates' داخل 'backend/utils')
    # بما أن pdf_generator.py موجود في backend/utils، فإن القوالب يجب أن تكون بجانبه
    template_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'templates'))
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template('report_template.html')

    # تحضير البيانات للقالب
    # هنا يجب التأكد من أن جميع البيانات التي يتم الوصول إليها في القالب
    # هي من أنواع قابلة للطباعة أو قابلة للتجزئة إذا كانت تستخدم كمفاتيح
    # خاصة عند الوصول إلى العناصر المتداخلة.
    # سنقوم بتبسيط الوصول إلى البيانات لضمان التوافق.

    # التأكد من أن scores و issues هي قواميس أو قوائم فارغة إذا كانت غير موجودة
    pagespeed_scores = results.get('page_speed', {}).get('scores', {})
    pagespeed_issues = results.get('page_speed', {}).get('issues', [])
    core_web_vitals = results.get('page_speed', {}).get('core_web_vitals', {})

    seo_elements = results.get('seo_quality', {}).get('elements', {})
    seo_improvement_tips = results.get('seo_quality', {}).get('improvement_tips', [])
    h_tags = seo_elements.get('h_tags', {})
    keyword_density = seo_elements.get('keyword_density', {})

    ux_issues = results.get('user_experience', {}).get('issues', [])
    ux_suggestions = results.get('user_experience', {}).get('suggestions', [])

    # تحويل القواميس إلى قوائم من أزواج (key, value) لتجنب TypeError في بعض الحالات
    # هذا يضمن أن Jinja2 يتعامل معها كقوائم يمكن تكرارها
    formatted_h_tags = []
    for tag, content_list in h_tags.items():
        formatted_h_tags.append(f"{tag}: {', '.join(content_list)}")

    formatted_keyword_density = []
    # فرز الكلمات الرئيسية حسب الكثافة
    sorted_keywords = sorted(keyword_density.items(), key=lambda item: item[1], reverse=True)[:10]
    for keyword, density in sorted_keywords:
        formatted_keyword_density.append(f"{keyword}: {density}%")

    # تحويل Core Web Vitals إلى قائمة من السلاسل النصية
    formatted_core_web_vitals = []
    for metric, value in core_web_vitals.items():
        formatted_core_web_vitals.append(f"{metric}: {value}")

    # بناء سياق البيانات للقالب
    context = {
        'url': url,
        'results': results, # نمرر النتائج الكاملة أيضاً، ولكن نستخدم المتغيرات المحضرة للوصول الآمن
        'domain_authority': results.get('domain_authority', {}),
        'page_speed': {
            'scores': pagespeed_scores,
            'issues': pagespeed_issues,
            'core_web_vitals': formatted_core_web_vitals, # استخدام النسخة المحضرة
            'pagespeed_report_link': results.get('page_speed', {}).get('pagespeed_report_link', '#')
        },
        'seo_quality': {
            'score': results.get('seo_quality', {}).get('score', 'N/A'),
            'seo_overall_text': results.get('seo_quality', {}).get('seo_overall_text', 'N/A'),
            'elements': {
                'title': seo_elements.get('title', 'N/A'),
                'meta_description': seo_elements.get('meta_description', 'N/A'),
                'broken_links': seo_elements.get('broken_links', []),
                'image_alt_status': seo_elements.get('image_alt_status', []),
                'internal_links_count': seo_elements.get('internal_links_count', 'N/A'),
                'external_links_count': seo_elements.get('external_links_count', 'N/A'),
                'h_tags': formatted_h_tags, # استخدام النسخة المحضرة
                'keyword_density': formatted_keyword_density, # استخدام النسخة المحضرة
            },
            'improvement_tips': seo_improvement_tips,
        },
        'user_experience': {
            'issues': ux_issues,
            'suggestions': ux_suggestions,
        },
        'ai_insights': results.get('ai_insights', {}),
    }

    # رندر القالب ببيانات السياق
    html_content = template.render(context)

    # إنشاء ملف PDF
    pdf_path = os.path.join(template_dir, 'report.pdf') # يمكن حفظه في مجلد مؤقت
    HTML(string=html_content).write_pdf(pdf_path, stylesheets=[CSS(string='''
        body { font-family: sans-serif; margin: 20mm; }
        h1, h2, h3 { color: #1e40af; } /* blue-700 */
        .section { margin-bottom: 15mm; border: 1px solid #e2e8f0; padding: 10mm; border-radius: 5mm; }
        .score-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 5px;
            font-weight: bold;
            color: white;
            margin-left: 5px;
        }
        .score-good { background-color: #10B981; } /* green-500 */
        .score-medium { background-color: #FBBF24; } /* yellow-400 */
        .score-bad { background-color: #EF4444; } /* red-500 */
        ul { list-style-type: disc; margin-left: 20px; }
        li { margin-bottom: 5px; }
        strong { font-weight: bold; }
        .ai-section { background-color: #eff6ff; border-left: 5px solid #60a5fa; padding: 10px; margin-top: 10px; border-radius: 5px; } /* blue-100 & blue-400 */
        .ai-section p { color: #1e40af; } /* blue-700 */
        a { color: #2563eb; text-decoration: none; } /* blue-600 */
    ''')])
    
    return pdf_path

