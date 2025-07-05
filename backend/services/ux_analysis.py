import requests
from bs4 import BeautifulSoup
# For more advanced UX (responsiveness, layout clarity)
# you would ideally use a headless browser like Puppeteer/Playwright
# and analyze screenshots, CSS properties, etc.
# For a pure Python backend, we can do some heuristic checks.

def get_html_content(url):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.text
    except requests.exceptions.RequestException as e:
        print(f"Error fetching content for UX analysis: {e}")
        return None

def evaluate_ux_heuristics(html_content):
    soup = BeautifulSoup(html_content, 'html5lib')

    ux_issues = []
    ux_score = 0
    max_ux_score = 100

    # Layout Clarity (heuristic: check for large paragraphs without breaks, many ads)
    paragraphs = soup.find_all('p')
    long_paragraphs = [p for p in paragraphs if len(p.get_text(strip=True).split()) > 150] # Arbitrary long
    if long_paragraphs:
        ux_issues.append("Consider breaking down long paragraphs for better readability.")
        ux_score -= len(long_paragraphs) * 2 # Penalty

    # Responsiveness (heuristic: check for viewport meta tag)
    viewport_meta = soup.find("meta", attrs={"name": "viewport"})
    if not viewport_meta or "width=device-width" not in viewport_meta.get("content", ""):
        ux_issues.append("Missing or incorrect viewport meta tag. Page might not be responsive on mobile.")
        ux_score -= 20
    else:
        ux_score += 20 # Reward for having it

    # Font Readability (heuristic: check for inline styles that might override default fonts)
    # This is very hard without full CSS parsing. Mocking.
    # A proper check would involve analyzing computed CSS properties.
    if soup.find(style=lambda value: value and ("font-size" in value or "color" in value)):
        ux_issues.append("Check for potentially problematic inline font styles that could affect readability.")
        # No direct score penalty without knowing if it's good or bad

    # Navigation Quality (heuristic: presence of common navigation elements)
    nav_elements = soup.find_all(['nav', 'ul', 'ol'])
    header_nav = soup.find('header')
    if not nav_elements or not header_nav:
        ux_issues.append("Navigation elements might be missing or hard to find.")
        ux_score -= 15
    else:
        ux_score += 15

    # Mobile Usability (very basic heuristic - relies on viewport meta)
    # Full mobile usability requires tools like PageSpeed Insights or Playwright.
    if "Missing or incorrect viewport meta tag" in ux_issues:
        ux_issues.append("Mobile usability is likely poor due to missing responsive design setup.")
    else:
        ux_score += 10 # Reward for likely mobile-friendliness due to viewport

    # Call-to-action (heuristic: presence of buttons/links with common CTA texts)
    cta_keywords = ["buy", "shop", "contact", "learn more", "sign up", "download"]
    found_cta = any(any(k in a.get_text(strip=True).lower() for k in cta_keywords) for a in soup.find_all(['a', 'button']))
    if not found_cta:
        ux_issues.append("Consider adding clear calls-to-action for user guidance.")
        ux_score -= 5
    else:
        ux_score += 5

    final_score = max(0, min(max_ux_score, (max_ux_score / 2) + ux_score)) # Adjust to be 0-100 and start around 50

    return {
        "score": int(final_score),
        "issues": ux_issues,
        "suggestions": [
            "Ensure clear visual hierarchy and sufficient whitespace.",
            "Test responsiveness across various devices and screen sizes.",
            "Use standard, readable font sizes and good color contrast.",
            "Provide intuitive and consistent navigation.",
            "Optimize for touch targets and finger-friendly elements on mobile.",
            "Place prominent and clear calls-to-action."
        ]
    }


def perform_ux_analysis(url):
    html_content = get_html_content(url)
    if not html_content:
        return {"error": "Could not retrieve page content for UX analysis."}

    ux_data = evaluate_ux_heuristics(html_content)
    return ux_data
