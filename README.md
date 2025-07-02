# Website Analysis Tool

A comprehensive web application to analyze any website URL across four main categories: Domain Authority & Site Trust, Page Speed & Performance, SEO Quality & Structure, and User Experience (UX).

## Features

-   **Domain Authority & Trust:**
    -   Estimates domain authority (basic heuristic).
    -   Checks domain age, SSL/HTTPS status, blacklist status, and DNS health.
-   **Page Speed & Performance:**
    -   Fetches Core Web Vitals (LCP, CLS, FCP, TBT, Speed Index) using Google PageSpeed Insights API.
    -   Highlights heavy images, large JS/CSS files, and server response issues.
    -   Provides overall Performance, Accessibility, Best Practices, and SEO scores from Lighthouse.
-   **SEO Quality & Structure:**
    -   Extracts title, meta description, H1–H6 structure.
    -   Detects basic keyword usage, broken links, and alt attributes for images.
    -   Provides an SEO score and improvement tips.
-   **User Experience (UX):**
    -   Evaluates layout clarity, responsiveness (via viewport meta), and navigation quality.
    -   Suggests UX improvements based on best practices.
-   **Optional AI Features (requires OpenAI API Key):**
    -   Generates a human-readable summary of analysis results.
    -   Provides AI-based SEO improvement suggestions.
    -   Offers AI insights into content originality and tone.
-   **Output:**
    -   Visual dashboard displaying scores, charts (if implemented), and detailed sections.
    -   Allows export of a detailed analysis report as a PDF.
    -   "Analyze Another Site" functionality.

## Tech Stack

-   **Backend:** Python 3.9+
    -   **Framework:** Flask
    -   **APIs:**
        -   Google PageSpeed Insights API (for performance metrics)
        -   OpenAI API (for AI features - optional)
        -   `whois` library (for domain age)
        -   `requests` (for HTTP requests, link checking)
        -   `BeautifulSoup4` & `html5lib` (for HTML parsing)
        -   `dnspython` (for basic DNS health)
        -   `weasyprint` (for PDF generation - *requires system dependencies*)
-   **Frontend:**
    -   HTML5
    -   Tailwind CSS (for styling and responsive design)
    -   Vanilla JavaScript (for DOM manipulation and API calls)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone [https://github.com/Tarekweslati/website-analysis-tool.git](https://github.com/Tarekweslati/website-analysis-tool.git)
cd website-analysis-tool
