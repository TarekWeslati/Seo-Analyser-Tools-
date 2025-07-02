import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

def get_html_content(url):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.text
    except requests.exceptions.RequestException as e:
        print(f"Error fetching content for SEO analysis: {e}")
        return None

def extract_seo_elements(html_content, base_url):
    soup = BeautifulSoup(html_content, 'html5lib')

    title = soup.title.string if soup.title else "N/A"
    meta_description = soup.find("meta", attrs={"name": "description"})
    meta_description = meta_description["content"] if meta_description else "N/A"

    h_tags = {}
    for i in range(1, 7):
        h_tags[f"H{i}"] = [h.get_text(strip=True) for h in soup.find_all(f"h{i}")]

    # Keyword Usage (very basic - just looking for common words in content)
    text_content = soup.get_text()
    words = text_content.lower().split()
    keyword_density = {}
    # Example: Check for top 10 most frequent words excluding stop words
    from collections import Counter
    import re
    stop_words = set(["the", "and", "a", "is", "it", "in", "of", "to", "for", "on", "with", "as"])
    clean_words = [re.sub(r'[^a-z0-9]', '', word) for word in words if re.sub(r'[^a-z0-9]', '', word) and re.sub(r'[^a-z0-9]', '', word) not in stop_words]
    most_common = Counter(clean_words).most_common(10)
    for word, count in most_common:
        keyword_density[word] = f"{(count / len(clean_words) * 100):.2f}%" if clean_words else "0.00%"


    # Broken Links and Alt Attributes
    broken_links = []
    internal_links = []
    external_links = []
    image_alt_status = [] # "Missing", "Present", "Empty"

    for a_tag in soup.find_all('a', href=True):
        href = a_tag['href']
        full_url = urljoin(base_url, href)
        parsed_full_url = urlparse(full_url)
        parsed_base_url = urlparse(base_url)

        if parsed_full_url.scheme in ['http', 'https']:
            if parsed_full_url.netloc == parsed_base_url.netloc:
                internal_links.append(full_url)
            else:
                external_links.append(full_url)
            # Basic check for broken links - more robust check needed (e.g., async requests)
            try:
                # Making a HEAD request is faster than GET
                head_response = requests.head(full_url, timeout=5)
                if not (200 <= head_response.status_code < 400):
                    broken_links.append({"url": full_url, "status": head_response.status_code})
            except requests.exceptions.RequestException:
                broken_links.append({"url": full_url, "status": "Unreachable"})

    for img_tag in soup.find_all('img'):
        if 'alt' not in img_tag.attrs:
            image_alt_status.append("Missing alt for: " + img_tag.get('src', 'Unknown'))
        elif not img_tag['alt'].strip():
            image_alt_status.append("Empty alt for: " + img_tag.get('src', 'Unknown'))
        else:
            image_alt_status.append("Present alt for: " + img_tag.get('src', 'Unknown'))


    return {
        "title": title,
        "meta_description": meta_description,
        "h_tags": h_tags,
        "keyword_density": keyword_density,
        "broken_links": broken_links,
        "internal_links_count": len(internal_links),
        "external_links_count": len(external_links),
        "image_alt_status": image_alt_status
    }

def calculate_seo_score(seo_data):
    score = 0
    max_score = 100

    # Title presence
    if seo_data['title'] and seo_data['title'] != "N/A":
        score += 10
    # Meta description presence
    if seo_data['meta_description'] and seo_data['meta_description'] != "N/A":
        score += 10
    # H1 presence
    if seo_data['h_tags'].get('H1'):
        score += 15
    # Some H2/H3 presence
    if seo_data['h_tags'].get('H2') or seo_data['h_tags'].get('H3'):
        score += 10
    # Few broken links
    if len(seo_data['broken_links']) == 0:
        score += 20
    elif len(seo_data['broken_links']) < 5:
        score += 10
    # Image alt attributes
    missing_alt_count = sum(1 for s in seo_data['image_alt_status'] if "Missing" in s or "Empty" in s)
    if missing_alt_count == 0:
        score += 15
    elif missing_alt_count < 5:
        score += 7

    # Basic keyword density check (placeholder)
    if seo_data['keyword_density']:
        score += 10 # Just for having some keywords detected

    # Cap score at max_score
    return min(int(score), max_score)

def perform_seo_analysis(url):
    html_content = get_html_content(url)
    if not html_content:
        return {"error": "Could not retrieve page content for SEO analysis."}

    seo_elements = extract_seo_elements(html_content, url)
    seo_score = calculate_seo_score(seo_elements)

    improvement_tips = []
    if seo_elements['title'] == "N/A":
        improvement_tips.append("Add a concise and descriptive title tag.")
    if seo_elements['meta_description'] == "N/A":
        improvement_tips.append("Add a compelling meta description (under 160 characters).")
    if not seo_elements['h_tags'].get('H1'):
        improvement_tips.append("Ensure you have a single, clear H1 tag on the page.")
    if seo_elements['broken_links']:
        improvement_tips.append(f"Fix {len(seo_elements['broken_links'])} broken links found on the page.")
    if any("Missing" in s or "Empty" in s for s in seo_elements['image_alt_status']):
        improvement_tips.append("Add descriptive alt attributes to all images for accessibility and SEO.")
    if not seo_elements['keyword_density']:
        improvement_tips.append("Review your content for relevant keyword usage.")


    return {
        "score": seo_score,
        "elements": seo_elements,
        "improvement_tips": improvement_tips
    }
