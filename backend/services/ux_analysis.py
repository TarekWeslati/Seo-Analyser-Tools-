import requests
from bs4 import BeautifulSoup
from collections import Counter
import re
from urllib.parse import urljoin, urlparse

def perform_seo_analysis(url):
    """
    Performs a comprehensive SEO analysis of the given URL.
    """
    results = {
        "score": 0, # Overall SEO score
        "seo_overall_text": "Needs improvement",
        "elements": {
            "title": "N/A",
            "meta_description": "N/A",
            "h_tags": {},
            "keyword_density": {},
            "broken_links": [],
            "image_alt_status": [],
            "internal_links_count": 0,
            "external_links_count": 0,
            "page_text": ""
        },
        "improvement_tips": []
    }

    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
        soup = BeautifulSoup(response.text, 'html.parser')

        # 1. Title Tag
        title_tag = soup.find('title')
        if title_tag:
            results["elements"]["title"] = title_tag.get_text(strip=True)
            if 10 <= len(results["elements"]["title"]) <= 70:
                results["score"] += 15
            else:
                results["improvement_tips"].append("Optimize title tag length (10-70 characters).")
        else:
            results["improvement_tips"].append("Add a title tag to your page.")

        # 2. Meta Description
        meta_description = soup.find('meta', attrs={'name': 'description'})
        if meta_description and meta_description.get('content'):
            results["elements"]["meta_description"] = meta_description['content'].strip()
            if 120 <= len(results["elements"]["meta_description"]) <= 160:
                results["score"] += 15
            else:
                results["improvement_tips"].append("Optimize meta description length (120-160 characters).")
        else:
            results["improvement_tips"].append("Add a meta description to your page.")

        # 3. H Tags (H1-H6)
        h_tags = {}
        for i in range(1, 7):
            tags = soup.find_all(f'h{i}')
            if tags:
                h_tags[f'h{i}'] = [tag.get_text(strip=True) for tag in tags]
        results["elements"]["h_tags"] = h_tags
        if 'h1' in h_tags and len(h_tags['h1']) == 1:
            results["score"] += 10
        elif 'h1' not in h_tags:
            results["improvement_tips"].append("Ensure your page has a single H1 tag.")
        else:
            results["improvement_tips"].append("Ensure your page has only one H1 tag.")
        
        if len(h_tags) > 1: # Check if there are other heading tags beyond just H1
             results["score"] += 5 # Give some score for using hierarchy

        # 4. Keyword Density
        page_text = soup.get_text(separator=' ', strip=True)
        results["elements"]["page_text"] = page_text # Store page text for other analyses
        words = re.findall(r'\b\w+\b', page_text.lower())
        word_counts = Counter(words)
        total_words = sum(word_counts.values())

        if total_words > 0:
            keyword_density = {word: round((count / total_words) * 100, 2) for word, count in word_counts.items()}
            results["elements"]["keyword_density"] = {k: v for k, v in sorted(keyword_density.items(), key=lambda item: item[1], reverse=True) if v > 0.5} # Only show keywords with >0.5% density
            if len(results["elements"]["keyword_density"]) > 0:
                results["score"] += 10
        else:
            results["improvement_tips"].append("Insufficient text content for keyword density analysis.")

        # 5. Broken Links (Internal and External)
        internal_links = set()
        external_links = set()
        broken_links = []
        
        base_domain = urlparse(url).netloc

        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href'].strip()
            full_url = urljoin(url, href)
            parsed_full_url = urlparse(full_url)

            if parsed_full_url.netloc == base_domain:
                internal_links.add(full_url)
            elif parsed_full_url.netloc: # It's an external link
                external_links.add(full_url)
            
            # Check for broken links (only for HTTP/HTTPS schemes)
            if parsed_full_url.scheme in ['http', 'https']:
                try:
                    # Use stream=True and close to be more efficient with connections
                    head_response = requests.head(full_url, timeout=5, allow_redirects=True)
                    if head_response.status_code >= 400:
                        broken_links.append(full_url)
                except requests.exceptions.RequestException as e:
                    # Consider network errors, timeouts, SSL errors as broken
                    broken_links.append(f"{full_url} (Error: {e})")
        
        results["elements"]["internal_links_count"] = len(internal_links)
        results["elements"]["external_links_count"] = len(external_links)
        results["elements"]["broken_links"] = broken_links # Store actual broken URLs

        if not broken_links:
            results["score"] += 15
        else:
            results["improvement_tips"].append(f"Fix {len(broken_links)} broken links found.")

        # 6. Image Alt Text
        images = soup.find_all('img')
        for img in images:
            alt_text = img.get('alt', '').strip()
            if not alt_text:
                results["elements"]["image_alt_status"].append(f"Missing alt for image: {img.get('src', 'N/A')}")
            else:
                results["elements"]["image_alt_status"].append(f"Alt text present for image: {img.get('src', 'N/A')}")
        
        if not any("Missing" in s for s in results["elements"]["image_alt_status"]) and not any("Empty" in s for s in results["elements"]["image_alt_status"]):
            results["score"] += 10
        elif len(results["elements"]["image_alt_status"]) > 0:
            results["improvement_tips"].append(f"Add descriptive alt text to {len([s for s in results['elements']['image_alt_status'] if 'Missing' in s or 'Empty' in s])} images.")
        else:
            results["improvement_tips"].append("No images found to check alt text.")


        # Determine overall SEO text based on score
        if results["score"] >= 80:
            results["seo_overall_text"] = "Excellent"
        elif results["score"] >= 60:
            results["seo_overall_text"] = "Good"
        elif results["score"] >= 40:
            results["seo_overall_text"] = "Fair"
        else:
            results["seo_overall_text"] = "Poor"

    except requests.exceptions.RequestException as e:
        results["seo_overall_text"] = f"Could not connect to URL for SEO analysis: {e}"
        results["improvement_tips"].append(f"Website might be down or inaccessible: {e}")
        print(f"Error during SEO analysis for {url}: {e}")
    except Exception as e:
        results["seo_overall_text"] = f"An unexpected error occurred during SEO analysis: {e}"
        results["improvement_tips"].append(f"An unexpected error occurred during SEO analysis: {e}")
        print(f"Unexpected error in perform_seo_analysis for {url}: {e}")

    return results

# --- New non-API SEO analysis functions ---

def get_content_length(text_content):
    """
    Calculates word count and character count of a given text.
    """
    word_count = len(text_content.split())
    char_count = len(text_content) # includes spaces
    return {"word_count": word_count, "character_count": char_count}

def check_robots_txt(url):
    """
    Checks if robots.txt file is accessible for the given URL's domain.
    """
    parsed_url = urlparse(url)
    robots_url = f"{parsed_url.scheme}://{parsed_url.netloc}/robots.txt"
    try:
        response = requests.get(robots_url, timeout=5)
        return response.status_code == 200
    except requests.exceptions.RequestException:
        return False

def check_sitemap_xml(url):
    """
    Checks if sitemap.xml file is accessible for the given URL's domain.
    This is a basic check; actual sitemap location can vary.
    """
    parsed_url = urlparse(url)
    sitemap_url = f"{parsed_url.scheme}://{parsed_url.netloc}/sitemap.xml"
    try:
        response = requests.get(sitemap_url, timeout=5)
        return response.status_code == 200
    except requests.exceptions.RequestException:
        return False

