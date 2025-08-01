import os
from weasyprint import HTML, CSS
from jinja2 import Environment, FileSystemLoader

def generate_pdf_report(url, results):
    # تحديد مسار القوالب (مجلد 'templates' داخل 'backend/utils')
    template_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'templates'))
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template('report_template.html')

    # تحضير البيانات للقالب
    pagespeed_scores = results.get('page_speed', {}).get('scores', {})
    pagespeed_issues = results.get('page_speed', {}).get('issues', [])
    core_web_vitals = results.get('page_speed', {}).get('core_web_vitals', {})

    seo_elements = results.get('seo_quality', {}).get('elements', {})
    seo_improvement_tips = results.get('seo_quality', {}).get('improvement_tips', [])
    h_tags = seo_elements.get('h_tags', {})
    keyword_density = seo_elements.get('keyword_density', {})
    broken_links = seo_elements.get('broken_links', []) # Get actual broken links

    ux_issues = results.get('user_experience', {}).get('issues', [])
    ux_suggestions = results.get('user_experience', {}).get('suggestions', [])

    # تحويل القواميس إلى قوائم من أزواج (key, value) لتجنب TypeError في بعض الحالات
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

    # Helper function to safely get integer score
    def get_int_score(data, key, default_value='N/A'):
        score = data.get(key, default_value)
        try:
            return int(score)
        except (ValueError, TypeError):
            return default_value

    # Prepare scores for safe comparison
    seo_score_int = get_int_score(results.get('seo_quality', {}), 'score')
    da_score_int = get_int_score(results.get('domain_authority', {}), 'domain_authority_score')
    perf_score_int = get_int_score(results.get('page_speed', {}).get('scores', {}), 'Performance Score')

    # Calculate missing alt text count for PDF
    missing_alt_count = len([s for s in seo_elements.get('image_alt_status', []) if "Missing" in s or "Empty" in s])


    # بناء سياق البيانات للقالب
    context = {
        'url': url,
        'results': results, # نمرر النتائج الكاملة أيضاً، ولكن نستخدم المتغيرات المحضرة للوصول الآمن
        'domain_authority': results.get('domain_authority', {}),
        'page_speed': {
            'scores': pagespeed_scores,
            'issues': pagespeed_issues,
            'core_web_vitals': formatted_core_web_vitals,
            'pagespeed_report_link': results.get('page_speed', {}).get('pagespeed_report_link', '#'),
            'perf_score_int': perf_score_int # Pass integer score for comparison
        },
        'seo_quality': {
            'score': results.get('seo_quality', {}).get('score', 'N/A'),
            'seo_overall_text': results.get('seo_quality', {}).get('seo_overall_text', 'N/A'),
            'elements': {
                'title': seo_elements.get('title', 'N/A'),
                'meta_description': seo_elements.get('meta_description', 'N/A'),
                'broken_links': broken_links, # Pass actual broken links
                'image_alt_status': seo_elements.get('image_alt_status', []),
                'missing_alt_count': missing_alt_count, # Pass pre-calculated missing alt count
                'internal_links_count': seo_elements.get('internal_links_count', 'N/A'),
                'external_links_count': seo_elements.get('external_links_count', 'N/A'),
                'h_tags': formatted_h_tags,
                'keyword_density': formatted_keyword_density,
                'content_length': seo_elements.get('content_length', {}), # New: Content Length
                'robots_txt_present': seo_elements.get('robots_txt_present', False), # New: Robots.txt
                'sitemap_xml_present': seo_elements.get('sitemap_xml_present', False), # New: Sitemap.xml
            },
            'improvement_tips': seo_improvement_tips,
            'seo_score_int': seo_score_int # Pass integer score for comparison
        },
        'user_experience': {
            'issues': ux_issues,
            'suggestions': ux_suggestions,
            'viewport_meta_present': results.get('user_experience', {}).get('viewport_meta_present', False), # New: Viewport Meta
        },
        'ai_insights': results.get('ai_insights', {}),
        'adsense_readiness': results.get('adsense_readiness', {}), # AdSense readiness data
        'broken_link_suggestions': results.get('broken_link_suggestions', {}) # New: Broken link suggestions
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

        /* PDF specific styles for status indicators */
        .status-good { color: #16a34a; font-weight: bold; } /* green-600 */
        .status-bad { color: #dc2626; font-weight: bold; } /* red-600 */
        .status-neutral { color: #4b5563; } /* gray-600 */
    ''')])
    
    return pdf_path
