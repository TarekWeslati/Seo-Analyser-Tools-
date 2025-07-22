import requests
import os

def get_pagespeed_insights(url, api_key):
    pagespeed_results = {
        "scores": {
            "Performance Score": "N/A",
            "Accessibility Score": "N/A",
            "Best Practices Score": "N/A",
            "SEO Score": "N/A"
        },
        "core_web_vitals": {
            "Largest Contentful Paint (LCP)": "N/A",
            "Cumulative Layout Shift (CLS)": "N/A",
            "First Input Delay (FID)": "N/A"
        },
        "issues": [],
        "pagespeed_report_link": f"https://developers.google.com/speed/pagespeed/insights/?url={url}"
    }

    if not api_key:
        print("PAGESPEED_API_KEY environment variable not set. PageSpeed Insights will be N/A.")
        return pagespeed_results

    pagespeed_url = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
    params = {
        'url': url,
        'key': api_key,
        'strategy': 'desktop', # يمكن تغييرها إلى 'mobile' أو تركها ديناميكية
        'category': ['PERFORMANCE', 'ACCESSIBILITY', 'BEST_PRACTICES', 'SEO']
    }

    try:
        # زيادة المهلة لطلب HTTPX لـ PageSpeed API
        response = requests.get(pagespeed_url, params=params, timeout=120) # زيادة المهلة إلى 120 ثانية
        response.raise_for_status() # رفع استثناء لأخطاء HTTP (4xx أو 5xx)
        data = response.json()

        lighthouse = data.get('lighthouseResult', {})
        audits = lighthouse.get('audits', {})
        categories = lighthouse.get('categories', {})

        # تحديث النقاط
        for category in params['category']:
            score_key = f"{category.replace('_', ' ').title()} Score"
            score = categories.get(category, {}).get('score')
            if score is not None:
                pagespeed_results['scores'][score_key] = int(score * 100)

        # Core Web Vitals
        metrics = lighthouse.get('audits', {}).get('metrics', {}).get('details', {}).get('items', [])
        for metric in metrics:
            if metric.get('id') == 'largest-contentful-paint':
                pagespeed_results['core_web_vitals']['Largest Contentful Paint (LCP)'] = metric.get('displayValue', 'N/A')
            elif metric.get('id') == 'cumulative-layout-shift':
                pagespeed_results['core_web_vitals']['Cumulative Layout Shift (CLS)'] = metric.get('displayValue', 'N/A')
            elif metric.get('id') == 'first-input-delay':
                pagespeed_results['core_web_vitals']['First Input Delay (FID)'] = metric.get('displayValue', 'N/A')

        # Performance Issues (مثال: استخدام 'diagnostics' أو 'details' من التدقيقات)
        # هذا الجزء قد يحتاج لتعديل بناءً على بنية استجابة PageSpeed الفعلية
        # للحصول على قائمة بالمشاكل، عادة ما ننظر إلى التدقيقات التي لديها 'score' أقل من 1
        # ونستخرج منها معلومات ذات صلة.
        pagespeed_results['issues'] = []
        for audit_key, audit_value in audits.items():
            if audit_value.get('score') is not None and audit_value.get('score') < 1:
                # محاولة استخراج عنوان المشكلة أو وصفها
                title = audit_value.get('title')
                description = audit_value.get('description')
                if title and "Learn more" in title: # إزالة "Learn more"
                    title = title.split("Learn more")[0].strip()
                
                if title and title not in pagespeed_results['issues']: # تجنب التكرار
                    pagespeed_results['issues'].append(title)
                elif description and description not in pagespeed_results['issues']:
                    pagespeed_results['issues'].append(description)
        
        # إذا لم يتم العثور على مشاكل محددة
        if not pagespeed_results['issues']:
            pagespeed_results['issues'].append("No critical performance issues detected by PageSpeed Insights.")

        return pagespeed_results

    except requests.exceptions.RequestException as e:
        print(f"Error fetching PageSpeed Insights: {e}")
        # إذا كان الخطأ 429، نطبع رسالة خاصة
        if isinstance(e, requests.exceptions.HTTPError) and e.response.status_code == 429:
            print("PageSpeed Insights API quota exceeded. Please wait or check your Google Cloud Console.")
            pagespeed_results['issues'].append("PageSpeed Insights API quota exceeded. Scores and issues are N/A.")
        else:
            pagespeed_results['issues'].append(f"Failed to fetch PageSpeed Insights: {e}. Scores and issues are N/A.")
        
        # نرجع النتائج مع القيم الافتراضية "N/A"
        return pagespeed_results

