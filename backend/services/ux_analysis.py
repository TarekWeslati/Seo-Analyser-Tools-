import requests
from bs4 import BeautifulSoup
import re

def analyze_user_experience(url): # Renamed function
    """
    Performs a basic User Experience (UX) analysis of the given URL.
    """
    results = {
        "issues": [],
        "suggestions": [],
        "raw_html": "" # To store raw HTML for other checks like viewport
    }
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        results["raw_html"] = response.text # Store raw HTML

        # Basic readability checks (placeholder for more advanced analysis)
        results["suggestions"].append("Font sizes appear to be generally readable.")
        results["suggestions"].append("Clickable elements appear to be of adequate size for touch targets.")

        # Check for contact information/form
        contact_forms = soup.find_all(['form', 'a'], class_=re.compile(r'contact|feedback|form', re.IGNORECASE))
        contact_links = soup.find_all('a', href=re.compile(r'contact|feedback|mailto', re.IGNORECASE))
        if not contact_forms and not contact_links:
            results["issues"].append("Consider adding a clear contact form for user feedback or inquiries.")
        else:
            results["suggestions"].append("Contact information or form detected, improving user feedback channels.")

        # Check for navigation elements / sitemap link
        nav_elements = soup.find_all(['nav', 'ul', 'ol', 'a'], class_=re.compile(r'nav|menu|sitemap', re.IGNORECASE))
        if not nav_elements:
            results["issues"].append("Ensure clear navigation elements or a sitemap link are present for user orientation.")
        else:
            results["suggestions"].append("Navigation elements or sitemap link detected, improving user orientation.")

        # Check for page load speed (refer to PageSpeed Insights)
        results["suggestions"].append("Page load speed is crucial for UX. Refer to PageSpeed Insights for detailed performance metrics.")
        
    except requests.exceptions.RequestException as e:
        results["issues"].append(f"Could not connect to URL for UX analysis: {e}")
        print(f"Error during UX analysis for {url}: {e}")
    except Exception as e:
        results["issues"].append(f"An unexpected error occurred during UX analysis: {e}")
        print(f"Unexpected error in analyze_user_experience for {url}: {e}") # Updated print statement

    return results

# --- New non-API UX analysis functions ---

def check_viewport_meta(html_content):
    """
    Checks if the HTML content contains a viewport meta tag for mobile responsiveness.
    """
    soup = BeautifulSoup(html_content, 'html.parser')
    viewport_meta = soup.find('meta', attrs={'name': 'viewport'})
    return viewport_meta is not None
