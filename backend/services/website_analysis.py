import requests
from bs4 import BeautifulSoup
import whois
import dns.resolver
import datetime
import os
import json
from weasyprint import HTML
import tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

# Function to call Gemini API (copied from article_analysis.py for consistency)
def call_gemini_api(prompt, model_name="gemini-2.5-flash-preview-05-20"):
    """
    Calls the Gemini API to generate text based on a given prompt.
    Handles exponential backoff for retries.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable not set.")
        return None

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}]
    }

    retries = 0
    max_retries = 5
    base_delay = 1  # seconds

    while retries < max_retries:
        try:
            response = requests.post(url, headers=headers, data=json.dumps(payload), timeout=60)
            response.raise_for_status()  # Raise an HTTPError for bad responses (4xx or 5xx)
            result = response.json()

            if result and result.get("candidates") and len(result["candidates"]) > 0 and \
               result["candidates"][0].get("content") and result["candidates"][0]["content"].get("parts") and \
               len(result["candidates"][0]["content"]["parts"]) > 0:
                return result["candidates"][0]["content"]["parts"][0]["text"]
            else:
                print(f"Gemini API returned an unexpected structure: {result}")
                return None
        except requests.exceptions.Timeout:
            print(f"Request timed out. Retrying {retries + 1}/{max_retries}...")
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}. Retrying {retries + 1}/{max_retries}...")
        except json.JSONDecodeError:
            print(f"Failed to decode JSON from response: {response.text}. Retrying {retries + 1}/{max_retries}...")

        retries += 1
        delay = base_delay * (2 ** retries)  # Exponential backoff
        print(f"Waiting for {delay} seconds before retrying...")
        time.sleep(delay)

    print(f"Failed to get a successful response from Gemini API after {max_retries} retries.")
    return None

def get_domain_authority(domain):
    """
    Retrieves domain authority metrics.
    """
    domain_authority_score = "N/A"
    domain_age_years = "N/A"
    ssl_status = "N/A"
    blacklist_status = "N/A"
    dns_health = "N/A"

    try:
        # WHOIS lookup for domain age
        w = whois.whois(domain)
        if w.creation_date:
            if isinstance(w.creation_date, list):
                creation_date = w.creation_date[0]
            else:
                creation_date = w.creation_date
            domain_age_years = (datetime.datetime.now() - creation_date).days // 365
        
        # DNS Health check (basic)
        try:
            dns.resolver.resolve(domain, 'A')
            dns_health = "Healthy"
        except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.resolver.NoNameservers):
            dns_health = "Issues Detected"
        except Exception as e:
            dns_health = f"Error: {e}"

        # Note: Domain Authority Score, SSL, and Blacklist status often require third-party APIs
        # For this example, we'll use placeholders or simple checks where possible.
        # A real-world application would integrate with services like Moz, SEMrush, SSL Labs, Spamhaus.
        
        # Placeholder for Domain Authority Score (requires external API)
        domain_authority_score = "N/A" # This typically comes from a paid API like Moz

        # Basic SSL check (requires making an HTTPS request)
        try:
            response = requests.get(f"https://{domain}", timeout=5)
            if response.status_code == 200:
                ssl_status = "Active"
            else:
                ssl_status = "Inactive/Error"
        except requests.exceptions.SSLError:
            ssl_status = "Inactive/Invalid"
        except requests.exceptions.RequestException:
            ssl_status = "N/A (Connection Error)"

        # Placeholder for Blacklist Status (requires external API)
        blacklist_status = "N/A" # This typically comes from a paid API

    except Exception as e:
        print(f"Error in get_domain_authority for {domain}: {e}")
        # Keep N/A for values if an error occurs

    return {
        "domain": domain,
        "domain_authority_score": domain_authority_score,
        "domain_age_years": domain_age_years,
        "ssl_status": ssl_status,
        "blacklist_status": blacklist_status,
        "dns_health": dns_health
    }

def get_page_speed_insights(url, lang="en"):
    """
    Retrieves simulated PageSpeed Insights data using LLM.
    In a real application, this would integrate with Google PageSpeed Insights API.
    """
    prompt_en = f"""Analyze the potential PageSpeed Insights for the URL: {url}.
    Provide a simulated Performance Score (0-100) and identify 3-5 common Core Web Vitals (LCP, FID, CLS) statuses (Good, Needs Improvement, Poor).
    Also, list 3-5 common performance issues and their brief solutions.
    Format the output as a JSON object with keys: "Performance Score", "Core Web Vitals", "Issues", "Pagespeed Report Link".
    Example:
    {{
        "Performance Score": "75",
        "Core Web Vitals": {{
            "Largest Contentful Paint (LCP)": "Needs Improvement",
            "First Input Delay (FID)": "Good",
            "Cumulative Layout Shift (CLS)": "Poor"
        }},
        "Issues": [
            "Optimize images (compress and lazy load)",
            "Minify CSS and JavaScript",
            "Reduce server response times"
        ],
        "Pagespeed Report Link": "https://developers.google.com/speed/pagespeed/insights/?url={url}"
    }}
    Ensure the JSON is valid and only contains the specified keys. If data is not available, use "N/A".
    """

    prompt_ar = f"""حلل رؤى سرعة الصفحة المحتملة للرابط: {url}.
    قدم درجة أداء محاكاة (0-100) وحدد حالة 3-5 من مقاييس Core Web Vitals الشائعة (LCP, FID, CLS) (جيد، يحتاج إلى تحسين، ضعيف).
    أيضاً، اذكر 3-5 مشكلات أداء شائعة وحلولها الموجزة.
    قم بتنسيق الناتج ككائن JSON بالمفاتيح التالية: "Performance Score", "Core Web Vitals", "Issues", "Pagespeed Report Link".
    مثال:
    {{
        "Performance Score": "75",
        "Core Web Vitals": {{
            "Largest Contentful Paint (LCP)": "يحتاج إلى تحسين",
            "First Input Delay (FID)": "جيد",
            "Cumulative Layout Shift (CLS)": "ضعيف"
        }},
        "Issues": [
            "تحسين الصور (ضغط وتحميل كسول)",
            "تصغير ملفات CSS و JavaScript",
            "تقليل أوقات استجابة الخادم"
        ],
        "Pagespeed Report Link": "https://developers.google.com/speed/pagespeed/insights/?url={url}"
    }}
    تأكد أن JSON صالح ويحتوي فقط على المفاتيح المحددة. إذا كانت البيانات غير متوفرة، استخدم "N/A".
    """

    selected_prompt = prompt_ar if lang == "ar" else prompt_en

    try:
        # Call Gemini API to simulate PageSpeed Insights
        response_text = call_gemini_api(selected_prompt)
        if response_text:
            # Clean the response to ensure it's valid JSON
            # Sometimes LLMs add extra text like "```json" or "```"
            response_text = response_text.replace('```json', '').replace('```', '').strip()
            scores = json.loads(response_text)
            scores["Pagespeed Report Link"] = f"https://developers.google.com/speed/pagespeed/insights/?url={url}"
            return {
                "scores": {"Performance Score": scores.get("Performance Score", "N/A")},
                "core_web_vitals": scores.get("Core Web Vitals", {}),
                "issues": scores.get("Issues", []),
                "pagespeed_report_link": scores.get("Pagespeed Report Link", f"https://developers.google.com/speed/pagespeed/insights/?url={url}")
            }
        else:
            return {
                "scores": {"Performance Score": "N/A"},
                "core_web_vitals": {},
                "issues": ["Failed to get PageSpeed insights from AI."],
                "pagespeed_report_link": f"https://developers.google.com/speed/pagespeed/insights/?url={url}"
            }
    except json.JSONDecodeError as e:
        print(f"JSON decoding error for PageSpeed Insights: {e} - Response: {response_text}")
        return {
            "scores": {"Performance Score": "N/A"},
            "core_web_vitals": {},
            "issues": ["Failed to parse PageSpeed insights from AI (JSON Error)."],
            "pagespeed_report_link": f"https://developers.google.com/speed/pagespeed/insights/?url={url}"
        }
    except Exception as e:
        print(f"Error in get_page_speed_insights for {url}: {e}")
        return {
            "scores": {"Performance Score": "N/A"},
            "core_web_vitals": {},
            "issues": ["Failed to get PageSpeed insights."],
            "pagespeed_report_link": f"https://developers.google.com/speed/pagespeed/insights/?url={url}"
        }

def get_seo_quality(url, lang="en"):
    """
    Analyzes SEO quality of a webpage.
    """
    elements = {
        "title": "N/A",
        "meta_description": "N/A",
        "h_tags": {},
        "broken_links": [],
        "missing_alt_count": 0,
        "internal_links_count": 0,
        "external_links_count": 0,
        "keyword_density": {},
        "content_length": {"word_count": "N/A", "character_count": "N/A"},
        "robots_txt_present": False,
        "sitemap_xml_present": False,
        "extracted_text_sample": "" # To be used for AI content analysis
    }
    improvement_tips = []
    score = "N/A"

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')

        # Title and Meta Description
        title_tag = soup.find('title')
        elements["title"] = title_tag.get_text(strip=True) if title_tag else "N/A"

        meta_description_tag = soup.find('meta', attrs={'name': 'description'})
        elements["meta_description"] = meta_description_tag['content'].strip() if meta_description_tag else "N/A"

        # H Tags
        for i in range(1, 7):
            h_tags = [h.get_text(strip=True) for h in soup.find_all(f'h{i}') if h.get_text(strip=True)]
            if h_tags:
                elements["h_tags"][f"h{i}"] = h_tags

        # Links and Broken Links
        all_links = soup.find_all('a', href=True)
        internal_links = 0
        external_links = 0
        broken_links = []

        # Use ThreadPoolExecutor for concurrent link checking
        with ThreadPoolExecutor(max_workers=10) as executor:
            future_to_url = {executor.submit(check_link_status, link['href'], url): link['href'] for link in all_links}
            for future in as_completed(future_to_url):
                href = future_to_url[future]
                try:
                    is_internal, is_broken = future.result()
                    if is_internal:
                        internal_links += 1
                    else:
                        external_links += 1
                    if is_broken:
                        broken_links.append(href)
                except Exception as e:
                    print(f"Error checking link {href}: {e}")
                    # Consider as broken if check fails
                    broken_links.append(href)

        elements["internal_links_count"] = internal_links
        elements["external_links_count"] = external_links
        elements["broken_links"] = broken_links

        # Missing Alt Text
        images_without_alt = [img for img in soup.find_all('img') if not img.get('alt')]
        elements["missing_alt_count"] = len(images_without_alt)

        # Content Length and Keyword Density
        main_content = soup.find('body') # Or more specific content area
        if main_content:
            text_content = main_content.get_text(separator=' ', strip=True)
            elements["extracted_text_sample"] = text_content[:1000] # Store first 1000 chars for AI
            words = text_content.split()
            elements["content_length"]["word_count"] = len(words)
            elements["content_length"]["character_count"] = len(text_content)

            # Basic keyword density (top 10 common words, excluding stop words)
            from collections import Counter
            import re
            stop_words_en = set(["the", "a", "an", "is", "are", "was", "were", "and", "or", "but", "if", "then", "else", "when", "where", "how", "what", "why", "who", "which", "this", "that", "these", "those", "of", "to", "in", "on", "at", "with", "from", "by", "for", "as", "it", "he", "she", "we", "you", "they", "them", "us", "him", "her", "its", "their", "my", "your", "our", "his", "her", "its", "their", "me", "him", "her", "us", "them", "i", "we", "you", "he", "she", "it", "they", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "can", "could", "should", "might", "must", "get", "go", "say", "see", "make", "know", "take", "come", "think", "look", "want", "give", "use", "find", "tell", "ask", "work", "seem", "feel", "try", "leave", "call", "good", "new", "first", "last", "long", "great", "little", "own", "other", "old", "right", "big", "high", "different", "small", "large", "next", "early", "young", "important", "few", "public", "bad", "same", "able"])
            stop_words_ar = set(["من", "في", "إلى", "على", "عن", "مع", "بـ", "كـ", "لـ", "و", "فـ", "ثم", "أو", "إذا", "كان", "هو", "هي", "هم", "نحن", "أنت", "أنتم", "هذا", "هذه", "ذلك", "تلك", "الذي", "التي", "الذين", "اللاتي", "ما", "من", "هل", "لا", "نعم", "كل", "بعض", "غير", "أكثر", "أقل", "أول", "آخر", "جديد", "قديم", "كبير", "صغير", "طويل", "قصير", "جيد", "سيء", "مختلف", "نفس", "أهم", "أفضل", "أسوأ", "أين", "كيف", "متى", "لماذا", "أي", "أية", "لأن", "لكن", "لكي", "حتى", "دون", "بين", "فوق", "تحت", "أمام", "خلف", "جانب", "داخل", "خارج", "عند", "قبل", "بعد", "حين", "ذات", "عدة", "فقط", "أيضا", "حقا", "جدا", "مثلا", "دائما", "أبدا", "غالبا", "نادرا", "أحيانا", "ربما", "بالتأكيد", "بالفعل", "فورا", "مباشرة", "عادة", "غالبا", "نادرا", "أحيانا", "ربما", "بالتأكيد", "بالفعل", "فورا", "مباشرة", "عادة"])

            selected_stop_words = stop_words_ar if lang == "ar" else stop_words_en

            words_filtered = [word.lower() for word in re.findall(r'\b\w+\b', text_content) if word.lower() not in selected_stop_words and len(word) > 2]
            word_counts = Counter(words_filtered)
            total_words = len(words_filtered)
            if total_words > 0:
                elements["keyword_density"] = {word: round((count / total_words) * 100, 2) for word, count in word_counts.most_common(10)}

        # Robots.txt and Sitemap.xml presence
        try:
            robots_response = requests.get(f"{url}/robots.txt", timeout=3)
            elements["robots_txt_present"] = robots_response.status_code == 200
        except requests.exceptions.RequestException:
            elements["robots_txt_present"] = False

        try:
            sitemap_response = requests.get(f"{url}/sitemap.xml", timeout=3)
            elements["sitemap_xml_present"] = sitemap_response.status_code == 200
        except requests.exceptions.RequestException:
            elements["sitemap_xml_present"] = False

        # Generate SEO improvement tips using LLM
        prompt_en = f"""Based on the following SEO analysis data for {url}:
        Title: {elements['title']}
        Meta Description: {elements['meta_description']}
        H Tags: {elements['h_tags']}
        Broken Links Count: {len(elements['broken_links'])}
        Missing Alt Text Count: {elements['missing_alt_count']}
        Internal Links: {elements['internal_links_count']}
        External Links: {elements['external_links_count']}
        Keyword Density (Top 5): {json.dumps(dict(list(elements['keyword_density'].items())[:5]))}
        Word Count: {elements['content_length']['word_count']}
        Robots.txt Present: {elements['robots_txt_present']}
        Sitemap.xml Present: {elements['sitemap_xml_present']}

        Provide 5-7 actionable SEO improvement tips for this webpage. Focus on practical advice.
        Format as a numbered list.
        """
        prompt_ar = f"""بناءً على بيانات تحليل تحسين محركات البحث (SEO) التالية للرابط: {url}:
        العنوان: {elements['title']}
        الوصف التعريفي (Meta Description): {elements['meta_description']}
        علامات H (H Tags): {elements['h_tags']}
        عدد الروابط المعطلة: {len(elements['broken_links'])}
        عدد الصور بدون نص بديل (Alt Text): {elements['missing_alt_count']}
        الروابط الداخلية: {elements['internal_links_count']}
        الروابط الخارجية: {elements['external_links_count']}
        كثافة الكلمات المفتاحية (أعلى 5): {json.dumps(dict(list(elements['keyword_density'].items())[:5]), ensure_ascii=False)}
        عدد الكلمات: {elements['content_length']['word_count']}
        وجود ملف Robots.txt: {elements['robots_txt_present']}
        وجود ملف Sitemap.xml: {elements['sitemap_xml_present']}

        قدم 5-7 نصائح عملية لتحسين محركات البحث لهذه الصفحة. ركز على النصائح القابلة للتطبيق.
        قم بالتنسيق كقائمة مرقمة.
        """
        
        selected_prompt = prompt_ar if lang == "ar" else prompt_en
        llm_tips = call_gemini_api(selected_prompt)
        if llm_tips:
            # Split the numbered list from LLM into individual tips
            improvement_tips = [tip.strip() for tip in llm_tips.split('\n') if tip.strip() and (tip.strip()[0].isdigit() or tip.strip().startswith('- '))]
            if not improvement_tips: # If it's not a numbered list, just take the whole text
                improvement_tips = [llm_tips]
        else:
            improvement_tips = [lang_specific_message(lang, "noSeoTips")]

        # Calculate a simple SEO score (placeholder logic)
        score = calculate_seo_score(elements)

    except requests.exceptions.RequestException as e:
        print(f"HTTP Request error for {url}: {e}")
        improvement_tips = [lang_specific_message(lang, "websiteUnreachable")]
        elements["error"] = "Website unreachable or connection error."
    except Exception as e:
        print(f"Error in get_seo_quality for {url}: {e}")
        improvement_tips = [lang_specific_message(lang, "seoAnalysisFailed")]
        elements["error"] = "Failed to perform SEO quality analysis."

    return {
        "score": score,
        "elements": elements,
        "improvement_tips": improvement_tips
    }

def check_link_status(href, base_url):
    """Checks if a link is internal/external and its status."""
    is_internal = href.startswith('/') or base_url in href
    is_broken = False
    try:
        # Only check external links or internal links that are full URLs
        if not is_internal or href.startswith('http'):
            response = requests.head(href, timeout=5, allow_redirects=True)
            if not (200 <= response.status_code < 400): # Success or redirect
                is_broken = True
    except requests.exceptions.RequestException:
        is_broken = True
    return is_internal, is_broken

def calculate_seo_score(elements):
    """
    Calculates a simple SEO score based on collected elements.
    This is a simplified scoring logic.
    """
    score = 0
    max_score = 100

    # Title and Meta Description presence (20 points)
    if elements["title"] != "N/A" and len(elements["title"]) > 0:
        score += 10
    if elements["meta_description"] != "N/A" and len(elements["meta_description"]) > 0:
        score += 10

    # Broken Links (15 points)
    if len(elements["broken_links"]) == 0:
        score += 15
    elif len(elements["broken_links"]) <= 3:
        score += 7

    # Missing Alt Text (10 points)
    if elements["missing_alt_count"] == 0:
        score += 10
    elif elements["missing_alt_count"] <= 5:
        score += 5

    # Content Length (10 points) - simple check, adjust as needed
    if isinstance(elements["content_length"]["word_count"], int) and elements["content_length"]["word_count"] > 300:
        score += 10

    # Robots.txt and Sitemap.xml (10 points)
    if elements["robots_txt_present"]:
        score += 5
    if elements["sitemap_xml_present"]:
        score += 5

    # H Tags presence (10 points) - at least h1 and some others
    if "h1" in elements["h_tags"] and len(elements["h_tags"]) > 1:
        score += 10

    # Keyword Density (10 points) - basic presence
    if elements["keyword_density"]:
        score += 10

    # Ensure score is within 0-100 range
    return max(0, min(100, score))

def get_user_experience_insights(url, lang="en"):
    """
    Retrieves user experience insights using LLM.
    """
    elements = {
        "viewport_meta_present": False,
        "issues": [],
        "suggestions": []
    }

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')

        # Check for viewport meta tag
        viewport_meta = soup.find('meta', attrs={'name': 'viewport'})
        elements["viewport_meta_present"] = viewport_meta is not None

        # Use LLM for broader UX assessment
        prompt_en = f"""Analyze the user experience (UX) of the webpage: {url}.
        Identify 3-5 common UX issues (e.g., mobile responsiveness, navigation, content clarity, accessibility) and provide 3-5 actionable suggestions for improvement.
        Format the output as a JSON object with keys: "issues", "suggestions".
        Example:
        {{
            "issues": [
                "Poor mobile responsiveness on smaller screens.",
                "Navigation menu is not intuitive.",
                "Lack of clear call-to-actions."
            ],
            "suggestions": [
                "Implement a responsive design framework.",
                "Simplify the main navigation structure.",
                "Add prominent call-to-action buttons."
            ]
        }}
        Ensure the JSON is valid and only contains the specified keys. If data is not available, use empty lists.
        """
        prompt_ar = f"""حلل تجربة المستخدم (UX) لصفحة الويب: {url}.
        حدد 3-5 مشكلات UX شائعة (مثل، استجابة الجوال، التنقل، وضوح المحتوى، إمكانية الوصول) وقدم 3-5 اقتراحات عملية للتحسين.
        قم بتنسيق الناتج ككائن JSON بالمفاتيح التالية: "issues", "suggestions".
        مثال:
        {{
            "issues": [
                "ضعف استجابة الجوال على الشاشات الصغيرة.",
                "قائمة التنقل ليست بديهية.",
                "نقص دعوات واضحة لاتخاذ إجراء."
            ],
            "suggestions": [
                "تطبيق إطار عمل تصميم متجاوب.",
                "تبسيط هيكل التنقل الرئيسي.",
                "إضافة أزرار دعوة لاتخاذ إجراء بارزة."
            ]
        }}
        تأكد أن JSON صالح ويحتوي فقط على المفاتيح المحددة. إذا كانت البيانات غير متوفرة، استخدم قوائم فارغة.
        """

        selected_prompt = prompt_ar if lang == "ar" else prompt_en
        
        response_text = call_gemini_api(selected_prompt)
        if response_text:
            response_text = response_text.replace('```json', '').replace('```', '').strip()
            ux_data = json.loads(response_text)
            elements["issues"] = ux_data.get("issues", [])
            elements["suggestions"] = ux_data.get("suggestions", [])
        else:
            elements["issues"] = [lang_specific_message(lang, "failedToGetUxInsights")]
            elements["suggestions"] = [lang_specific_message(lang, "noUxSuggestions")]

    except json.JSONDecodeError as e:
        print(f"JSON decoding error for UX insights: {e} - Response: {response_text}")
        elements["issues"] = [lang_specific_message(lang, "failedToParseUxInsights")]
        elements["suggestions"] = []
    except Exception as e:
        print(f"Error in get_user_experience_insights for {url}: {e}")
        elements["issues"] = [lang_specific_message(lang, "failedToGetUxInsights")]
        elements["suggestions"] = []

    return elements

def get_adsense_readiness(url, lang="en"):
    """
    Assesses AdSense readiness using LLM.
    """
    assessment = "N/A"
    improvement_areas = []

    prompt_en = f"""Assess the AdSense readiness of the webpage: {url}.
    Consider factors like content quality, originality, sufficient text, user experience, navigation, and compliance with AdSense policies.
    Provide an overall assessment and list 3-5 specific areas for improvement to increase AdSense approval chances.
    Format the output as a JSON object with keys: "assessment", "improvement_areas".
    Example:
    {{
        "assessment": "The website has good potential for AdSense but needs some improvements in content depth and navigation.",
        "improvement_areas": [
            "Increase content depth and regularly update articles.",
            "Ensure clear and easy navigation across all pages.",
            "Review AdSense program policies for compliance."
        ]
    }}
    Ensure the JSON is valid and only contains the specified keys. If data is not available, use "N/A" for assessment and empty list for areas.
    """

    prompt_ar = f"""قم بتقييم مدى جاهزية صفحة الويب: {url} لبرنامج AdSense.
    ضع في اعتبارك عوامل مثل جودة المحتوى، الأصالة، كفاية النص، تجربة المستخدم، التنقل، والامتثال لسياسات AdSense.
    قدم تقييماً عاماً واذكر 3-5 مجالات محددة للتحسين لزيادة فرص الموافقة على AdSense.
    قم بتنسيق الناتج ككائن JSON بالمفاتيح التالية: "assessment", "improvement_areas".
    مثال:
    {{
        "assessment": "الموقع لديه إمكانات جيدة لبرنامج AdSense ولكنه يحتاج إلى بعض التحسينات في عمق المحتوى والتنقل.",
        "improvement_areas": [
            "زيادة عمق المحتوى وتحديث المقالات بانتظام.",
            "ضمان تنقل واضح وسهل عبر جميع الصفحات.",
            "مراجعة سياسات برنامج AdSense للامتثال."
        ]
    }}
    تأكد أن JSON صالح ويحتوي فقط على المفاتيح المحددة. إذا كانت البيانات غير متوفرة، استخدم "N/A" للتقييم وقائمة فارغة للمجالات.
    """

    selected_prompt = prompt_ar if lang == "ar" else prompt_en

    try:
        response_text = call_gemini_api(selected_prompt)
        if response_text:
            response_text = response_text.replace('```json', '').replace('```', '').strip()
            adsense_data = json.loads(response_text)
            assessment = adsense_data.get("assessment", "N/A")
            improvement_areas = adsense_data.get("improvement_areas", [])
        else:
            assessment = lang_specific_message(lang, "failedToGetAdsenseInsights")
            improvement_areas = []
    except json.JSONDecodeError as e:
        print(f"JSON decoding error for AdSense readiness: {e} - Response: {response_text}")
        assessment = lang_specific_message(lang, "failedToParseAdsenseInsights")
        improvement_areas = []
    except Exception as e:
        print(f"Error in get_adsense_readiness for {url}: {e}")
        assessment = lang_specific_message(lang, "failedToGetAdsenseInsights")
        improvement_areas = []

    return {
        "assessment": assessment,
        "improvement_areas": improvement_areas
    }

def get_ai_insights(url, seo_quality_data, page_speed_data, ux_data, lang="en"):
    """
    Generates overall AI insights and suggestions.
    """
    summary_prompt_en = f"""Based on the following analysis data for {url}:
    SEO Quality Score: {seo_quality_data.get('score', 'N/A')}
    Page Speed Performance Score: {page_speed_data.get('scores', {}).get('Performance Score', 'N/A')}
    UX Issues: {', '.join(ux_data.get('issues', []))}
    SEO Improvement Tips: {', '.join(seo_quality_data.get('improvement_tips', []))}

    Provide a concise overall summary of the website's performance, highlighting its strengths and weaknesses from an SEO, Page Speed, and UX perspective.
    Also, give 3-5 actionable, high-level SEO improvement suggestions based on the provided data.
    Format the output as a JSON object with keys: "summary", "seo_improvement_suggestions", "content_originality_tone".
    Example:
    {{
        "summary": "The website performs moderately well in SEO and UX, but has significant page speed issues. Content quality is good but could be more engaging.",
        "seo_improvement_suggestions": "Focus on image optimization, browser caching, and content expansion for key pages.",
        "content_originality_tone": "The content is informative but lacks a unique tone. Consider adding more storytelling and a distinct brand voice."
    }}
    Ensure the JSON is valid. If data is not available, use "N/A" or empty strings/lists.
    """
    summary_prompt_ar = f"""بناءً على بيانات التحليل التالية للرابط: {url}:
    درجة جودة تحسين محركات البحث (SEO): {seo_quality_data.get('score', 'N/A')}
    درجة أداء سرعة الصفحة: {page_speed_data.get('scores', {}).get('Performance Score', 'N/A')}
    مشكلات تجربة المستخدم (UX): {', '.join(ux_data.get('issues', []))}
    نصائح تحسين محركات البحث (SEO): {', '.join(seo_quality_data.get('improvement_tips', []))}

    قدم ملخصاً موجزاً للأداء العام للموقع، مع تسليط الضوء على نقاط القوة والضعف من منظور تحسين محركات البحث، سرعة الصفحة، وتجربة المستخدم.
    أيضاً، قدم 3-5 اقتراحات عملية وعالية المستوى لتحسين محركات البحث بناءً على البيانات المقدمة.
    قم بتنسيق الناتج ككائن JSON بالمفاتيح التالية: "summary", "seo_improvement_suggestions", "content_originality_tone".
    مثال:
    {{
        "summary": "الموقع يؤدي بشكل جيد إلى حد ما في تحسين محركات البحث وتجربة المستخدم، ولكنه يعاني من مشكلات كبيرة في سرعة الصفحة. جودة المحتوى جيدة ولكن يمكن أن تكون أكثر جاذبية.",
        "seo_improvement_suggestions": "ركز على تحسين الصور، التخزين المؤقت للمتصفح، وتوسيع المحتوى للصفحات الرئيسية.",
        "content_originality_tone": "المحتوى غني بالمعلومات ولكنه يفتقر إلى نبرة فريدة. فكر في إضافة المزيد من السرد وصوت مميز للعلامة التجارية."
    }}
    تأكد أن JSON صالح. إذا كانت البيانات غير متوفرة، استخدم "N/A" أو سلاسل/قوائم فارغة.
    """

    selected_summary_prompt = summary_prompt_ar if lang == "ar" else summary_prompt_en

    ai_insights = {
        "summary": "N/A",
        "seo_improvement_suggestions": "N/A",
        "content_originality_tone": "N/A",
        "error": None
    }

    try:
        response_text = call_gemini_api(selected_summary_prompt)
        if response_text:
            response_text = response_text.replace('```json', '').replace('```', '').strip()
            parsed_insights = json.loads(response_text)
            ai_insights["summary"] = parsed_insights.get("summary", "N/A")
            ai_insights["seo_improvement_suggestions"] = parsed_insights.get("seo_improvement_suggestions", "N/A")
            ai_insights["content_originality_tone"] = parsed_insights.get("content_originality_tone", "N/A")
        else:
            ai_insights["error"] = lang_specific_message(lang, "failedToGetAiInsights")
    except json.JSONDecodeError as e:
        print(f"JSON decoding error for AI insights: {e} - Response: {response_text}")
        ai_insights["error"] = lang_specific_message(lang, "failedToParseAiInsights")
    except Exception as e:
        print(f"Error in get_ai_insights for {url}: {e}")
        ai_insights["error"] = lang_specific_message(lang, "failedToGetAiInsights")

    return ai_insights

def ai_rewrite_seo_content(title, meta_description, keywords, lang="en"):
    """
    Rewrites SEO title and meta description using LLM.
    """
    prompt_en = f"""Given the current SEO Title: "{title}" and Meta Description: "{meta_description}", and relevant Keywords: "{keywords}".
    Generate 3 new, optimized, and engaging SEO titles (under 60 characters) and 3 new meta descriptions (under 160 characters) for a webpage.
    Focus on click-through rate and search engine visibility.
    Format the output as a JSON object with keys: "titles", "meta_descriptions".
    Example:
    {{
        "titles": [
            "New Title 1",
            "New Title 2"
        ],
        "meta_descriptions": [
            "New Meta Description 1",
            "New Meta Description 2"
        ]
    }}
    Ensure the JSON is valid.
    """
    prompt_ar = f"""بالنظر إلى عنوان تحسين محركات البحث (SEO) الحالي: "{title}" والوصف التعريفي (Meta Description): "{meta_description}"، والكلمات المفتاحية ذات الصلة: "{keywords}".
    قم بإنشاء 3 عناوين SEO جديدة ومحسّنة وجذابة (أقل من 60 حرفًا) و 3 أوصاف تعريفية جديدة (أقل من 160 حرفًا) لصفحة ويب.
    ركز على نسبة النقر إلى الظهور ورؤية محركات البحث.
    قم بتنسيق الناتج ككائن JSON بالمفاتيح التالية: "titles", "meta_descriptions".
    مثال:
    {{
        "titles": [
            "عنوان جديد 1",
            "عنوان جديد 2"
        ],
        "meta_descriptions": [
            "وصف تعريفي جديد 1",
            "وصف تعريفي جديد 2"
        ]
    }}
    تأكد أن JSON صالح.
    """

    selected_prompt = prompt_ar if lang == "ar" else prompt_en

    try:
        response_text = call_gemini_api(selected_prompt)
        if response_text:
            response_text = response_text.replace('```json', '').replace('```', '').strip()
            parsed_data = json.loads(response_text)
            return {
                "titles": parsed_data.get("titles", []),
                "meta_descriptions": parsed_data.get("meta_descriptions", [])
            }
        else:
            return {"titles": [], "meta_descriptions": [], "error": lang_specific_message(lang, "failedToGenerateRewrites")}
    except json.JSONDecodeError as e:
        print(f"JSON decoding error for AI SEO rewrite: {e} - Response: {response_text}")
        return {"titles": [], "meta_descriptions": [], "error": lang_specific_message(lang, "failedToParseRewrites")}
    except Exception as e:
        print(f"Error in ai_rewrite_seo_content: {e}")
        return {"titles": [], "meta_descriptions": [], "error": lang_specific_message(lang, "failedToGenerateRewrites")}

def ai_refine_content(text_sample, lang="en"):
    """
    Refines content using LLM for better readability, engagement, and SEO.
    """
    prompt_en = f"""Refine the following text sample to improve its readability, engagement, and SEO.
    Provide the refined text and 3-5 specific suggestions for further improvement.
    Format the output as a JSON object with keys: "refined_text", "suggestions".
    Example:
    {{
        "refined_text": "This is the improved version of the text.",
        "suggestions": [
            "Use more active voice.",
            "Break down long sentences.",
            "Incorporate relevant keywords naturally."
        ]
    }}
    Ensure the JSON is valid.
    Text sample: {text_sample}
    """
    prompt_ar = f"""قم بتحسين عينة النص التالية لتحسين قابلية القراءة، الجاذبية، وتحسين محركات البحث.
    قدم النص المحسن و 3-5 اقتراحات محددة لمزيد من التحسين.
    قم بتنسيق الناتج ككائن JSON بالمفاتيح التالية: "refined_text", "suggestions".
    مثال:
    {{
        "refined_text": "هذه هي النسخة المحسنة من النص.",
        "suggestions": [
            "استخدم صيغة المبني للمعلوم أكثر.",
            "قسم الجمل الطويلة.",
            "ادمج الكلمات المفتاحية ذات الصلة بشكل طبيعي."
        ]
    }}
    تأكد أن JSON صالح.
    عينة النص: {text_sample}
    """

    selected_prompt = prompt_ar if lang == "ar" else prompt_en

    try:
        response_text = call_gemini_api(selected_prompt)
        if response_text:
            response_text = response_text.replace('```json', '').replace('```', '').strip()
            parsed_data = json.loads(response_text)
            return {
                "refined_text": parsed_data.get("refined_text", ""),
                "suggestions": parsed_data.get("suggestions", [])
            }
        else:
            return {"refined_text": "", "suggestions": [], "error": lang_specific_message(lang, "failedToRefineContent")}
    except json.JSONDecodeError as e:
        print(f"JSON decoding error for AI content refinement: {e} - Response: {response_text}")
        return {"refined_text": "", "suggestions": [], "error": lang_specific_message(lang, "failedToParseRefinement")}
    except Exception as e:
        print(f"Error in ai_refine_content: {e}")
        return {"refined_text": "", "suggestions": [], "error": lang_specific_message(lang, "failedToRefineContent")}

def ai_broken_link_suggestions(broken_links, lang="en"):
    """
    Generates suggestions for fixing broken links using LLM.
    """
    if not broken_links:
        return {"suggestions": lang_specific_message(lang, "noBrokenLinksToSuggestFixes")}

    links_str = "\n".join(broken_links)
    prompt_en = f"""Given the following list of broken links:
    {links_str}
    Provide actionable suggestions on how to fix these broken links to improve SEO and user experience.
    Focus on practical steps like checking redirects, updating URLs, or removing links.
    Format as a numbered list of suggestions.
    """
    prompt_ar = f"""بالنظر إلى قائمة الروابط المعطلة التالية:
    {links_str}
    قدم اقتراحات عملية حول كيفية إصلاح هذه الروابط المعطلة لتحسين تحسين محركات البحث وتجربة المستخدم.
    ركز على الخطوات العملية مثل التحقق من عمليات إعادة التوجيه، تحديث عناوين URL، أو إزالة الروابط.
    قم بالتنسيق كقائمة مرقمة من الاقتراحات.
    """

    selected_prompt = prompt_ar if lang == "ar" else prompt_en

    try:
        response_text = call_gemini_api(selected_prompt)
        if response_text:
            suggestions = [s.strip() for s in response_text.split('\n') if s.strip() and (s.strip()[0].isdigit() or s.strip().startswith('- '))]
            return {"suggestions": "\n".join(suggestions)}
        else:
            return {"suggestions": lang_specific_message(lang, "failedToGetBrokenLinkSuggestions")}
    except Exception as e:
        print(f"Error in ai_broken_link_suggestions: {e}")
        return {"suggestions": lang_specific_message(lang, "failedToGetBrokenLinkSuggestions")}

def get_website_analysis(url, lang="en"):
    """
    Performs a comprehensive website analysis.
    """
    domain = url.replace("http://", "").replace("https://", "").split("/")[0]

    # Use ThreadPoolExecutor for concurrent API calls
    with ThreadPoolExecutor(max_workers=5) as executor:
        future_domain_authority = executor.submit(get_domain_authority, domain)
        future_page_speed = executor.submit(get_page_speed_insights, url, lang)
        future_seo_quality = executor.submit(get_seo_quality, url, lang)
        future_user_experience = executor.submit(get_user_experience_insights, url, lang)
        future_adsense_readiness = executor.submit(get_adsense_readiness, url, lang)

        domain_authority_data = future_domain_authority.result()
        page_speed_data = future_page_speed.result()
        seo_quality_data = future_seo_quality.result()
        user_experience_data = future_user_experience.result()
        adsense_readiness_data = future_adsense_readiness.result()

    # Get AI insights based on collected data
    ai_insights_data = get_ai_insights(url, seo_quality_data, page_speed_data, user_experience_data, lang)
    broken_link_suggestions_data = ai_broken_link_suggestions(seo_quality_data.get('elements', {}).get('broken_links', []), lang)

    return {
        "domain_authority": domain_authority_data,
        "page_speed": page_speed_data,
        "seo_quality": seo_quality_data,
        "user_experience": user_experience_data,
        "adsense_readiness": adsense_readiness_data,
        "ai_insights": ai_insights_data,
        "broken_link_suggestions": broken_link_suggestions_data,
        "extracted_text_sample": seo_quality_data.get('elements', {}).get('extracted_text_sample', '')
    }

def generate_pdf_report(url, lang="en"):
    """
    Generates a PDF report from the analysis results.
    """
    analysis_results = get_website_analysis(url, lang=lang)

    # Define translations for PDF report
    pdf_translations = {
        "en": {
            "reportTitle": "Website Analysis Report",
            "analyzedUrl": "Analyzed URL:",
            "domainAuthority": "Domain Authority",
            "score": "Score",
            "domainAge": "Domain Age",
            "yearsText": "years",
            "sslStatus": "SSL Status",
            "blacklistStatus": "Blacklist Status",
            "dnsHealth": "DNS Health",
            "pageSpeed": "Page Speed Insights",
            "performanceScore": "Performance Score",
            "coreWebVitals": "Core Web Vitals",
            "issues": "Issues",
            "seoQuality": "SEO Quality",
            "overallScore": "Overall Score",
            "title": "Title",
            "metaDescription": "Meta Description",
            "hTags": "Heading Tags (H1-H6)",
            "brokenLinks": "Broken Links",
            "missingAlt": "Missing Alt Text (Images)",
            "internalLinks": "Internal Links",
            "externalLinks": "External Links",
            "keywordDensity": "Keyword Density (Top 10)",
            "wordCount": "Word Count",
            "charCount": "Character Count",
            "robotsTxt": "Robots.txt Present",
            "sitemapXml": "Sitemap.xml Present",
            "improvementTips": "SEO Improvement Tips",
            "userExperience": "User Experience (UX)",
            "viewportMeta": "Viewport Meta Tag Present",
            "uxIssues": "UX Issues",
            "uxSuggestions": "UX Suggestions",
            "adsenseReadiness": "AdSense Readiness",
            "assessment": "Assessment",
            "improvementAreas": "Improvement Areas",
            "aiInsights": "AI Insights & Suggestions",
            "summary": "Overall Summary",
            "seoSuggestions": "AI SEO Improvement Suggestions",
            "contentOriginality": "AI Content Originality & Tone",
            "brokenLinkFixSuggestions": "AI Broken Link Fix Suggestions",
            "notAvailable": "N/A",
            "yesText": "Yes",
            "noText": "No",
            "goodText": "Good",
            "fairText": "Fair",
            "poorText": "Poor",
            "websiteUnreachable": "Website could not be reached or connection error.",
            "seoAnalysisFailed": "Failed to perform SEO quality analysis.",
            "failedToGetUxInsights": "Failed to get UX insights from AI.",
            "failedToParseUxInsights": "Failed to parse UX insights from AI.",
            "noUxSuggestions": "No UX suggestions available.",
            "failedToGetAdsenseInsights": "Failed to get AdSense readiness insights from AI.",
            "failedToParseAdsenseInsights": "Failed to parse AdSense readiness insights from AI.",
            "failedToGetAiInsights": "Failed to get overall AI insights.",
            "failedToParseAiInsights": "Failed to parse overall AI insights.",
            "failedToGenerateRewrites": "Failed to generate AI SEO rewrites.",
            "failedToParseRewrites": "Failed to parse AI SEO rewrites.",
            "failedToRefineContent": "Failed to refine content.",
            "failedToParseRefinement": "Failed to parse content refinement.",
            "noBrokenLinksToSuggestFixes": "No broken links were found to suggest fixes for.",
            "failedToGetBrokenLinkSuggestions": "Failed to get broken link suggestions from AI."
        },
        "ar": {
            "reportTitle": "تقرير تحليل الموقع",
            "analyzedUrl": "الرابط المحلل:",
            "domainAuthority": "سلطة النطاق",
            "score": "النتيجة",
            "domainAge": "عمر النطاق",
            "yearsText": "سنة",
            "sslStatus": "حالة SSL",
            "blacklistStatus": "حالة القائمة السوداء",
            "dnsHealth": "صحة DNS",
            "pageSpeed": "رؤى سرعة الصفحة",
            "performanceScore": "درجة الأداء",
            "coreWebVitals": "مقاييس الويب الأساسية",
            "issues": "المشكلات",
            "seoQuality": "جودة تحسين محركات البحث (SEO)",
            "overallScore": "النتيجة الإجمالية",
            "title": "العنوان",
            "metaDescription": "الوصف التعريفي (Meta Description)",
            "hTags": "علامات العناوين (H1-H6)",
            "brokenLinks": "الروابط المعطلة",
            "missingAlt": "نص بديل مفقود (الصور)",
            "internalLinks": "الروابط الداخلية",
            "externalLinks": "الروابط الخارجية",
            "keywordDensity": "كثافة الكلمات المفتاحية (أعلى 10)",
            "wordCount": "عدد الكلمات",
            "charCount": "عدد الأحرف",
            "robotsTxt": "وجود Robots.txt",
            "sitemapXml": "وجود Sitemap.xml",
            "improvementTips": "نصائح تحسين محركات البحث (SEO)",
            "userExperience": "تجربة المستخدم (UX)",
            "viewportMeta": "وجود علامة Viewport Meta",
            "uxIssues": "مشكلات تجربة المستخدم",
            "uxSuggestions": "اقتراحات تجربة المستخدم",
            "adsenseReadiness": "جاهزية AdSense",
            "assessment": "التقييم",
            "improvementAreas": "مجالات التحسين",
            "aiInsights": "رؤى واقتراحات الذكاء الاصطناعي",
            "summary": "ملخص عام",
            "seoSuggestions": "اقتراحات تحسين محركات البحث (AI SEO)",
            "contentOriginality": "أصالة ونبرة المحتوى (AI)",
            "brokenLinkFixSuggestions": "اقتراحات إصلاح الروابط المعطلة (AI)",
            "notAvailable": "غير متوفر",
            "yesText": "نعم",
            "noText": "لا",
            "goodText": "جيد",
            "fairText": "متوسط",
            "poorText": "ضعيف",
            "websiteUnreachable": "لا يمكن الوصول إلى الموقع أو خطأ في الاتصال.",
            "seoAnalysisFailed": "فشل في إجراء تحليل جودة تحسين محركات البحث.",
            "failedToGetUxInsights": "فشل في الحصول على رؤى تجربة المستخدم.",
            "failedToParseUxInsights": "فشل في تحليل رؤى تجربة المستخدم.",
            "failedToGetAdsenseInsights": "فشل في الحصول على رؤى جاهزية AdSense.",
            "failedToParseAdsenseInsights": "فشل في تحليل رؤى جاهزية AdSense.",
            "failedToGetAiInsights": "فشل في الحصول على رؤى الذكاء الاصطناعي الشاملة.",
            "failedToParseAiInsights": "فشل في تحليل رؤى الذكاء الاصطناعي الشاملة.",
            "failedToGenerateRewrites": "فشل في إنشاء إعادة صياغة SEO بواسطة الذكاء الاصطناعي.",
            "failedToParseRewrites": "فشل في تحليل إعادة صياغة SEO.",
            "failedToRefineContent": "فشل في تحسين المحتوى.",
            "failedToParseRefinement": "فشل في تحليل تحسين المحتوى.",
            "noBrokenLinksToSuggestFixes": "لم يتم العثور على روابط معطلة لاقتراح إصلاحات لها.",
            "failedToGetBrokenLinkSuggestions": "فشل في الحصول على اقتراحات إصلاح الروابط المعطلة من الذكاء الاصطناعي."
        }
    }

    t = pdf_translations.get(lang, pdf_translations["en"]) # Get translations for selected language

    # Generate HTML content for the PDF
    html_content = f"""
    <!DOCTYPE html>
    <html lang="{lang}">
    <head>
        <meta charset="UTF-8">
        <title>{t['reportTitle']}</title>
        <style>
            body {{ font-family: 'Arial', sans-serif; margin: 20mm; font-size: 10pt; color: #333; }}
            h1 {{ color: #1a237e; text-align: center; font-size: 24pt; margin-bottom: 15mm; }}
            h2 {{ color: #283593; font-size: 16pt; margin-top: 10mm; margin-bottom: 5mm; border-bottom: 1px solid #ccc; padding-bottom: 5px; }}
            h3 {{ color: #3f51b5; font-size: 12pt; margin-top: 8mm; margin-bottom: 3mm; }}
            p, ul, ol {{ margin-bottom: 2mm; line-height: 1.5; }}
            ul, ol {{ padding-left: 5mm; }}
            li {{ margin-bottom: 1mm; }}
            .section {{ margin-bottom: 10mm; padding: 5mm; border: 1px solid #eee; border-radius: 5px; background-color: #f9f9f9; }}
            .score-good {{ color: green; font-weight: bold; }}
            .score-fair {{ color: orange; font-weight: bold; }}
            .score-poor {{ color: red; font-weight: bold; }}
            .data-label {{ font-weight: bold; color: #555; }}
            .data-value {{ margin-left: 5px; }}
            .ai-section {{ background-color: #e8eaf6; border-left: 5px solid #3f51b5; padding: 10px; margin-top: 10px; }}
            .ai-section h4 {{ color: #3f51b5; }}
            .ai-section p {{ margin-bottom: 5px; }}
            .ai-section ul {{ margin-top: 5px; }}
            .ai-section li {{ margin-bottom: 2px; }}
            .footer {{ text-align: center; margin-top: 20mm; font-size: 8pt; color: #777; }}
            @page {{ size: A4; margin: 20mm; }}
            body {{ direction: {'rtl' if lang == 'ar' else 'ltr'}; }}
        </style>
    </head>
    <body>
        <h1>{t['reportTitle']}</h1>
        <p><span class="data-label">{t['analyzedUrl']}</span> <span class="data-value">{url}</span></p>

        <div class="section">
            <h2>{t['domainAuthority']}</h2>
            <p><span class="data-label">{t['domainAge']}:</span> <span class="data-value">{analysis_results['domain_authority']['domain_age_years']} {t['yearsText']}</span></p>
            <p><span class="data-label">{t['sslStatus']}:</span> <span class="data-value">{analysis_results['domain_authority']['ssl_status']}</span></p>
            <p><span class="data-label">{t['blacklistStatus']}:</span> <span class="data-value">{analysis_results['domain_authority']['blacklist_status']}</span></p>
            <p><span class="data-label">{t['dnsHealth']}:</span> <span class="data-value">{analysis_results['domain_authority']['dns_health']}</span></p>
        </div>

        <div class="section">
            <h2>{t['pageSpeed']}</h2>
            <p><span class="data-label">{t['performanceScore']}:</span> <span class="data-value">{analysis_results['page_speed']['scores']['Performance Score']}</span></p>
            <h3>{t['coreWebVitals']}</h3>
            <ul>
                {''.join([f'<li><span class="data-label">{metric}:</span> <span class="data-value">{value}</span></li>' for metric, value in analysis_results['page_speed']['core_web_vitals'].items()]) if analysis_results['page_speed']['core_web_vitals'] else f'<li>{t["notAvailable"]}</li>'}
            </ul>
            <h3>{t['issues']}</h3>
            <ul>
                {''.join([f'<li>{issue}</li>' for issue in analysis_results['page_speed']['issues']]) if analysis_results['page_speed']['issues'] else f'<li>{t["notAvailable"]}</li>'}
            </ul>
            <p><span class="data-label">PageSpeed Report:</span> <a href="{analysis_results['page_speed']['pagespeed_report_link']}">{analysis_results['page_speed']['pagespeed_report_link']}</a></p>
        </div>

        <div class="section">
            <h2>{t['seoQuality']}</h2>
            <p><span class="data-label">{t['overallScore']}:</span> <span class="data-value">{analysis_results['seo_quality']['score']}</span></p>
            <p><span class="data-label">{t['title']}:</span> <span class="data-value">{analysis_results['seo_quality']['elements']['title']}</span></p>
            <p><span class="data-label">{t['metaDescription']}:</span> <span class="data-value">{analysis_results['seo_quality']['elements']['meta_description']}</span></p>
            <h3>{t['hTags']}</h3>
            <ul>
                {''.join([f'<li><span class="data-label">{tag}:</span> <span class="data-value">{", ".join(titles)}</span></li>' for tag, titles in analysis_results['seo_quality']['elements']['h_tags'].items()]) if analysis_results['seo_quality']['elements']['h_tags'] else f'<li>{t["notAvailable"]}</li>'}
            </ul>
            <p><span class="data-label">{t['brokenLinks']}:</span> <span class="data-value">{len(analysis_results['seo_quality']['elements']['broken_links'])}</span></p>
            {'<ul>' + ''.join([f'<li>{link}</li>' for link in analysis_results['seo_quality']['elements']['broken_links']]) + '</ul>' if analysis_results['seo_quality']['elements']['broken_links'] else ''}
            <p><span class="data-label">{t['missingAlt']}:</span> <span class="data-value">{analysis_results['seo_quality']['elements']['missing_alt_count']}</span></p>
            <p><span class="data-label">{t['internalLinks']}:</span> <span class="data-value">{analysis_results['seo_quality']['elements']['internal_links_count']}</span></p>
            <p><span class="data-label">{t['externalLinks']}:</span> <span class="data-value">{analysis_results['seo_quality']['elements']['external_links_count']}</span></p>
            <h3>{t['keywordDensity']}</h3>
            <ul>
                {''.join([f'<li><span class="data-label">{keyword}:</span> <span class="data-value">{density}%</span></li>' for keyword, density in analysis_results['seo_quality']['elements']['keyword_density'].items()]) if analysis_results['seo_quality']['elements']['keyword_density'] else f'<li>{t["notAvailable"]}</li>'}
            </ul>
            <p><span class="data-label">{t['wordCount']}:</span> <span class="data-value">{analysis_results['seo_quality']['elements']['content_length']['word_count']}</span></p>
            <p><span class="data-label">{t['charCount']}:</span> <span class="data-value">{analysis_results['seo_quality']['elements']['content_length']['character_count']}</span></p>
            <p><span class="data-label">{t['robotsTxt']}:</span> <span class="data-value">{t['yesText'] if analysis_results['seo_quality']['elements']['robots_txt_present'] else t['noText']}</span></p>
            <p><span class="data-label">{t['sitemapXml']}:</span> <span class="data-value">{t['yesText'] if analysis_results['seo_quality']['elements']['sitemap_xml_present'] else t['noText']}</span></p>
            <h3>{t['improvementTips']}</h3>
            <ul>
                {''.join([f'<li>{tip}</li>' for tip in analysis_results['seo_quality']['improvement_tips']]) if analysis_results['seo_quality']['improvement_tips'] else f'<li>{t["notAvailable"]}</li>'}
            </ul>
        </div>

        <div class="section">
            <h2>{t['userExperience']}</h2>
            <p><span class="data-label">{t['viewportMeta']}:</span> <span class="data-value">{t['yesText'] if analysis_results['user_experience']['viewport_meta_present'] else t['noText']}</span></p>
            <h3>{t['uxIssues']}</h3>
            <ul>
                {''.join([f'<li>{issue}</li>' for issue in analysis_results['user_experience']['issues']]) if analysis_results['user_experience']['issues'] else f'<li>{t["notAvailable"]}</li>'}
            </ul>
            <h3>{t['uxSuggestions']}</h3>
            <ul>
                {''.join([f'<li>{suggestion}</li>' for suggestion in analysis_results['user_experience']['suggestions']]) if analysis_results['user_experience']['suggestions'] else f'<li>{t["notAvailable"]}</li>'}
            </ul>
        </div>

        <div class="section">
            <h2>{t['adsenseReadiness']}</h2>
            <p><span class="data-label">{t['assessment']}:</span> <span class="data-value">{analysis_results['adsense_readiness']['assessment']}</span></p>
            <h3>{t['improvementAreas']}</h3>
            <ul>
                {''.join([f'<li>{area}</li>' for area in analysis_results['adsense_readiness']['improvement_areas']]) if analysis_results['adsense_readiness']['improvement_areas'] else f'<li>{t["notAvailable"]}</li>'}
            </ul>
        </div>

        <div class="section ai-section">
            <h2>{t['aiInsights']}</h2>
            <h3>{t['summary']}</h3>
            <p>{analysis_results['ai_insights']['summary']}</p>
            <h3>{t['seoSuggestions']}</h3>
            <p>{analysis_results['ai_insights']['seo_improvement_suggestions']}</p>
            <h3>{t['contentOriginality']}</h3>
            <p>{analysis_results['ai_insights']['content_originality_tone']}</p>
            <h3>{t['brokenLinkFixSuggestions']}</h3>
            <p>{analysis_results['broken_link_suggestions']['suggestions']}</p>
        </div>

        <div class="footer">
            <p>{t['reportTitle']} - Generated on {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </div>
    </body>
    </html>
