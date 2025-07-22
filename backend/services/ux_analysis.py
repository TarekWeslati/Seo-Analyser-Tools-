import requests
from bs4 import BeautifulSoup
import re

def perform_ux_analysis(url):
    ux_results = {
        "issues": [],
        "suggestions": []
    }

    try:
        # إضافة مهلة لطلب HTTP (30 ثانية)
        response = requests.get(url, timeout=30)
        response.raise_for_status() # رفع استثناء لأخطاء HTTP (4xx أو 5xx)
        soup = BeautifulSoup(response.text, 'lxml')

        # 1. تحليل حجم الخط (Font Size)
        # هذا تحليل تقريبي وقد يتطلب تحليل CSS الفعلي ليكون دقيقاً
        # نبحث عن عناصر النص الشائعة ونفترض أحجام الخطوط الافتراضية
        small_font_elements = soup.find_all(lambda tag: tag.name in ['p', 'li', 'span', 'div'] and 
                                             ('font-size' in tag.attrs or 'style' in tag.attrs))
        
        found_small_font = False
        for element in small_font_elements:
            style = element.get('style', '')
            font_size_match = re.search(r'font-size:\s*(\d+(\.\d+)?)(px|em|rem|%);', style)
            if font_size_match:
                size = float(font_size_match.group(1))
                unit = font_size_match.group(3)
                
                # افتراضات بسيطة لأحجام الخطوط الصغيرة
                if (unit == 'px' and size < 14) or \
                   (unit == 'em' and size < 0.9) or \
                   (unit == 'rem' and size < 0.9) or \
                   (unit == '%' and size < 90):
                    ux_results["issues"].append("Potentially small font sizes detected, which may affect readability.")
                    found_small_font = True
                    break
        if not found_small_font:
            ux_results["suggestions"].append("Font sizes appear to be generally readable.")


        # 2. تحليل تباين الألوان (Color Contrast - تحليل بدائي)
        # يتطلب تحليل CSS الفعلي وحساب التباين، هذا مثال بسيط جداً
        # نبحث عن سمات اللون والخلفية
        if soup.find(style=re.compile(r'color|background-color')):
            ux_results["suggestions"].append("Consider checking color contrast for accessibility, especially for text over backgrounds.")
        else:
            ux_results["suggestions"].append("Color contrast cannot be fully assessed without full CSS analysis.")


        # 3. استخدام الأزرار وعناصر النقر (Clickable Elements)
        buttons = soup.find_all(['button', 'a'])
        if not buttons:
            ux_results["issues"].append("No clickable elements (buttons/links) found, which might impact navigation.")
        
        # فحص حجم الأزرار وعناصر النقر (تقديري)
        small_buttons = soup.find_all(lambda tag: tag.name in ['button', 'a'] and 
                                       ('width' in tag.attrs or 'height' in tag.attrs or 'style' in tag.attrs))
        found_small_button = False
        for btn in small_buttons:
            style = btn.get('style', '')
            width_match = re.search(r'width:\s*(\d+)(px|em|rem);', style)
            height_match = re.search(r'height:\s*(\d+)(px|em|rem);', style)
            
            if (width_match and float(width_match.group(1)) < 44) or \
               (height_match and float(height_match.group(1)) < 44):
                ux_results["issues"].append("Some clickable elements might be too small for easy tapping on mobile devices (less than 44x44px recommended).")
                found_small_button = True
                break
        if not found_small_button and buttons:
            ux_results["suggestions"].append("Clickable elements appear to be of adequate size for touch targets.")

        # 4. وجود نموذج اتصال (Contact Form)
        if not soup.find('form', class_=re.compile(r'contact|feedback|form')):
            ux_results["suggestions"].append("Consider adding a clear contact form for user feedback or inquiries.")
        else:
            ux_results["suggestions"].append("Contact form detected, which is good for user interaction.")

        # 5. وجود خريطة الموقع (Sitemap) أو روابط التنقل الواضحة
        if not soup.find('a', text=re.compile(r'Sitemap|خريطة الموقع', re.IGNORECASE)) and \
           not soup.find('nav'):
            ux_results["suggestions"].append("Ensure clear navigation and consider adding a sitemap link for better user orientation.")
        else:
            ux_results["suggestions"].append("Navigation elements or sitemap link detected, improving user orientation.")

        # 6. سرعة تحميل الصفحة (ملاحظة: يتم تغطيتها بشكل أفضل بواسطة PageSpeed Insights)
        ux_results["suggestions"].append("Page load speed is crucial for UX. Refer to PageSpeed Insights for detailed performance metrics.")

    except requests.exceptions.RequestException as e:
        print(f"Error fetching content for UX analysis: {e}")
        ux_results["issues"].append(f"Failed to fetch page content for UX analysis: {e}")
        ux_results["suggestions"].append("Cannot provide full UX analysis due to inability to fetch page content.")
    except Exception as e:
        print(f"An unexpected error occurred during UX analysis: {e}")
        ux_results["issues"].append(f"An unexpected error occurred during UX analysis: {e}")
        ux_results["suggestions"].append("Cannot provide full UX analysis due to an unexpected error.")
    
    return ux_results

