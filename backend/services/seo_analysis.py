import requests
from bs4 import BeautifulSoup
import re
from collections import Counter
from urllib.parse import urljoin, urlparse

def perform_seo_analysis(url):
    seo_results = {
        "score": "N/A",
        "seo_overall_text": "Analysis pending or failed.",
        "elements": {
            "title": "N/A",
            "meta_description": "N/A",
            "h_tags": {},
            "keyword_density": {},
            "internal_links_count": "N/A",
            "external_links_count": "N/A",
            "broken_links": [],
            "image_alt_status": [],
            "page_text": "N/A"
        },
        "improvement_tips": []
    }

    try:
        # إضافة مهلة لطلب HTTP (30 ثانية)
        response = requests.get(url, timeout=30)
        response.raise_for_status() # رفع استثناء لأخطاء HTTP (4xx أو 5xx)
        soup = BeautifulSoup(response.text, 'lxml')

        # استخراج العنوان (Title Tag)
        title_tag = soup.find('title')
        seo_results["elements"]["title"] = title_tag.get_text(strip=True) if title_tag else "Missing"
        if not title_tag or not title_tag.get_text(strip=True):
            seo_results["improvement_tips"].append("Add a concise and keyword-rich title tag.")
        elif len(seo_results["elements"]["title"]) < 10 or len(seo_results["elements"]["title"]) > 70:
            seo_results["improvement_tips"].append("Optimize title tag length (10-70 characters).")

        # استخراج الوصف التعريفي (Meta Description)
        meta_description_tag = soup.find('meta', attrs={'name': 'description'})
        seo_results["elements"]["meta_description"] = meta_description_tag['content'].strip() if meta_description_tag and 'content' in meta_description_tag.attrs else "Missing"
        if not meta_description_tag or not seo_results["elements"]["meta_description"]:
            seo_results["improvement_tips"].append("Add a compelling meta description (50-160 characters).")
        elif len(seo_results["elements"]["meta_description"]) < 50 or len(seo_results["elements"]["meta_description"]) > 160:
            seo_results["improvement_tips"].append("Optimize meta description length (50-160 characters).")

        # استخراج علامات العناوين (H-Tags)
        h_tags = {}
        for i in range(1, 7): # H1 to H6
            tags = soup.find_all(f'h{i}')
            if tags:
                h_tags[f'h{i}'] = [tag.get_text(strip=True) for tag in tags]
        seo_results["elements"]["h_tags"] = h_tags
        if not h_tags.get('h1'):
            seo_results["improvement_tips"].append("Ensure there is one H1 tag per page.")
        if len(h_tags.get('h1', [])) > 1:
            seo_results["improvement_tips"].append("Avoid multiple H1 tags; use only one per page.")


        # استخراج النص الكامل للصفحة لحساب كثافة الكلمات المفتاحية
        page_text = soup.get_text(separator=' ', strip=True)
        seo_results["elements"]["page_text"] = page_text

        # حساب كثافة الكلمات المفتاحية (أكثر 10 كلمات شيوعاً)
        words = re.findall(r'\b\w+\b', page_text.lower())
        word_counts = Counter(words)
        total_words = sum(word_counts.values())
        
        keyword_density = {}
        if total_words > 0:
            for word, count in word_counts.most_common(20): # خذ أكثر 20 كلمة شيوعاً
                if len(word) > 2: # تجاهل الكلمات القصيرة جداً
                    density = (count / total_words) * 100
                    keyword_density[word] = round(density, 2)
        
        # تصفية لأفضل 10 كلمات مفتاحية مع كثافة معقولة (أكثر من 0.5%)
        seo_results["elements"]["keyword_density"] = {
            k: v for k, v in sorted(keyword_density.items(), key=lambda item: item[1], reverse=True) if v > 0.5
        }
        # اقتطاع لأفضل 10
        seo_results["elements"]["keyword_density"] = dict(list(seo_results["elements"]["keyword_density"].items())[:10])


        # تحليل الروابط (الداخلية والخارجية) والروابط المعطلة
        internal_links_count = 0
        external_links_count = 0
        broken_links = []
        
        base_netloc = urlparse(url).netloc

        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href']
            full_url = urljoin(url, href)
            parsed_full_url = urlparse(full_url)

            if parsed_full_url.netloc == base_netloc:
                internal_links_count += 1
            elif parsed_full_url.netloc: # إذا كان له netloc وليس نفس الموقع
                external_links_count += 1
            
            # فحص الروابط المعطلة (فقط لعدد محدود لتجنب بطء التحليل)
            # يمكن تحسين هذا ليكون أكثر كفاءة أو يتم في خدمة منفصلة
            if parsed_full_url.scheme in ['http', 'https'] and parsed_full_url.netloc:
                try:
                    # مهلة قصيرة لفحص الروابط لتجنب تعليق طويل
                    head_response = requests.head(full_url, timeout=5, allow_redirects=True)
                    if head_response.status_code >= 400:
                        broken_links.append(full_url)
                except requests.exceptions.RequestException:
                    broken_links.append(full_url)
        
        seo_results["elements"]["internal_links_count"] = internal_links_count
        seo_results["elements"]["external_links_count"] = external_links_count
        seo_results["elements"]["broken_links"] = broken_links
        if broken_links:
            seo_results["improvement_tips"].append(f"Fix {len(broken_links)} broken links found.")


        # حالة Alt للصور
        image_alt_status = []
        for img_tag in soup.find_all('img'):
            src = img_tag.get('src', 'No src')
            alt = img_tag.get('alt', '').strip()
            if not alt:
                image_alt_status.append(f"Missing Alt: {src[:50]}...")
            elif alt == "":
                image_alt_status.append(f"Empty Alt: {src[:50]}...")
        seo_results["elements"]["image_alt_status"] = image_alt_status
        if image_alt_status:
            seo_results["improvement_tips"].append(f"Add descriptive alt text to {len(image_alt_status)} images.")

        # حساب النتيجة الإجمالية (مثال بسيط)
        score = 100
        if "Missing" in seo_results["elements"]["title"] or "Optimize title tag length" in seo_results["improvement_tips"]:
            score -= 15
        if "Missing" in seo_results["elements"]["meta_description"] or "Optimize meta description length" in seo_results["improvement_tips"]:
            score -= 10
        if not h_tags.get('h1') or len(h_tags.get('h1', [])) > 1:
            score -= 10
        if broken_links:
            score -= 20
        if image_alt_status:
            score -= 10
        
        seo_results["score"] = max(0, score) # تأكد أن النتيجة ليست سالبة
        seo_results["seo_overall_text"] = "Good" if score >= 80 else ("Fair" if score >= 50 else "Poor")

    except requests.exceptions.RequestException as e:
        print(f"Error fetching content for SEO analysis: {e}")
        seo_results["seo_overall_text"] = f"Failed to fetch content for SEO analysis: {e}"
        seo_results["improvement_tips"].append(f"Failed to fetch page content for SEO analysis: {e}")
    except Exception as e:
        print(f"An unexpected error occurred during SEO analysis: {e}")
        seo_results["seo_overall_text"] = f"An unexpected error occurred: {e}"
        seo_results["improvement_tips"].append(f"An unexpected error occurred during SEO analysis: {e}")
    
    return seo_results

