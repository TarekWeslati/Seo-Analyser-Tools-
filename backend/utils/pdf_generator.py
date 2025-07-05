import os
from datetime import datetime
from weasyprint import HTML, CSS # Requires system dependencies for WeasyPrint
# Or use fpdf2: from fpdf import FPDF

def generate_pdf_report(url, results):
    # This is a very basic example. For a professional report,
    # you would need a well-structured HTML template with CSS styling.
    # WeasyPrint converts HTML/CSS to PDF.

    report_html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Website Analysis Report for {url}</title>
        <style>
            body {{ font-family: sans-serif; margin: 20px; }}
            h1, h2, h3 {{ color: #333; }}
            .section {{ margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px; }}1
            .score-badge {{
                display: inline-block; padding: 8px 12px; border-radius: 5px; font-weight: bold;
                color: white; text-align: center;
            }}
            .score-good {{ background-color: #28a745; }} /* Green */
            .score-medium {{ background-color: #ffc107; }} /* Yellow */
            .score-bad {{ background-color: #dc3545; }} /* Red */
        </style>
    </head>
    <body>
        <h1>Website Analysis Report</h1>
        <p><strong>URL:</strong> {url}</p>
        <p><strong>Report Date:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>

        <div class="section">
            <h2>Overall Scores</h2>
            <p>
                SEO Score: <span class="score-badge {'score-good' if results.get('seo_quality',{}).get('score',0) >= 70 else 'score-medium' if results.get('seo_quality',{}).get('score',0) >= 40 else 'score-bad'}">{results.get('seo_quality',{}).get('score', 'N/A')}/100</span>
                Speed Score: <span class="score-badge {'score-good' if results.get('page_speed',{}).get('scores',{}).get('Performance Score',0) >= 70 else 'score-medium' if results.get('page_speed',{}).get('scores',{}).get('Performance Score',0) >= 40 else 'score-bad'}">{results.get('page_speed',{}).get('scores',{}).get('Performance Score', 'N/A')}</span>
                UX Score: <span class="score-badge {'score-good' if results.get('user_experience',{}).get('score',0) >= 70 else 'score-medium' if results.get('user_experience',{}).get('score',0) >= 40 else 'score-bad'}">{results.get('user_experience',{}).get('score', 'N/A')}/100</span>
            </p>
            {f"<h3>AI Summary:</h3><p>{results.get('ai_insights',{}).get('summary', 'N/A')}</p>" if results.get('ai_insights',{}).get('summary') else ''}
        </div>

        <div class="section">
            <h2>1. Domain Authority & Site Trust</h2>
            <p>Domain: {results.get('domain_authority',{}).get('domain', 'N/A')}</p>
            <ul>
                <li>Estimated Domain Authority: {results.get('domain_authority',{}).get('domain_authority_estimate', 'N/A')}</li>
                <li>Domain Age: {results.get('domain_authority',{}).get('domain_age_years', 'N/A')} years</li>
                <li>SSL Status: {results.get('domain_authority',{}).get('ssl_status', 'N/A')}</li>
                <li>Blacklist Status: {results.get('domain_authority',{}).get('blacklist_status', 'N/A')}</li>
                <li>DNS Health: {results.get('domain_authority',{}).get('dns_health', 'N/A')}</li>
            </ul>
        </div>

        <div class="section">
            <h2>2. Page Speed & Performance</h2>
            <h3>Core Web Vitals & Metrics:</h3>
            <ul>
                {f"<li>First Contentful Paint: {results.get('page_speed',{}).get('metrics',{}).get('First Contentful Paint', 'N/A')}</li>" if results.get('page_speed',{}).get('metrics',{}).get('First Contentful Paint') else ''}
                {f"<li>Largest Contentful Paint: {results.get('page_speed',{}).get('metrics',{}).get('Largest Contentful Paint', 'N/A')}</li>" if results.get('page_speed',{}).get('metrics',{}).get('Largest Contentful Paint') else ''}
                {f"<li>Cumulative Layout Shift: {results.get('page_speed',{}).get('metrics',{}).get('Cumulative Layout Shift', 'N/A')}</li>" if results.get('page_speed',{}).get('metrics',{}).get('Cumulative Layout Shift') else ''}
                {f"<li>Total Blocking Time: {results.get('page_speed',{}).get('metrics',{}).get('Total Blocking Time', 'N/A')}</li>" if results.get('page_speed',{}).get('metrics',{}).get('Total Blocking Time') else ''}
                {f"<li>Speed Index: {results.get('page_speed',{}).get('metrics',{}).get('Speed Index', 'N/A')}</li>" if results.get('page_speed',{}).get('metrics',{}).get('Speed Index') else ''}
            </ul>
            <h3>Performance Issues:</h3>
            <ul>
            page_speed_issues_html = ""
for issue in results.get('page_speed', ).get('issues', []):
    page_speed_issues_html += f"<li>{issue.get('title', 'N/A')} (Score: {issue.get('score', 'N/A')}): {issue.get('description', '')}</li>"

            <p><a href="{results.get('page_speed',{}).get('full_report_link', '#')}">View Full PageSpeed Insights Report</a></p>
        </div>

        <div class="section">
            <h2>3. SEO Quality & Structure</h2>
            <ul>
                <li>Title: {results.get('seo_quality',{}).get('elements',{}).get('title', 'N/A')}</li>
                <li>Meta Description: {results.get('seo_quality',{}).get('elements',{}).get('meta_description', 'N/A')}</li>
                <li>Broken Links: {len(results.get('seo_quality',{}).get('elements',{}).get('broken_links', []))}</li>
                <li>Image Alt Status: {len([s for s in results.get('seo_quality',{}).get('elements',{}).get('image_alt_status', []) if "Missing" in s or "Empty" in s])} missing/empty</li>
                <li>Internal Links: {results.get('seo_quality',{}).get('elements',{}).get('internal_links_count', 'N/A')}</li>
                <li>External Links: {results.get('seo_quality',{}).get('elements',{}).get('external_links_count', 'N/A')}</li>
            </ul>
            <h3>H Tags:</h3>
            <ul>
                {f"<li>H1: {', '.join(results.get('seo_quality',{}).get('elements',{}).get('h_tags',{}).get('H1',[]))}</li>" if results.get('seo_quality',{}).get('elements',{}).get('h_tags',{}).get('H1') else ''}
                {f"<li>H2: {', '.join(results.get('seo_quality',{}).get('elements',{}).get('h_tags',{}).get('H2',[]))}</li>" if results.get('seo_quality',{}).get('elements',{}).get('h_tags',{}).get('H2') else ''}
                {f"<li>H3: {', '.join(results.get('seo_quality',{}).get('elements',{}).get('h_tags',{}).get('H3',[]))}</li>" if results.get('seo_quality',{}).get('elements',{}).get('h_tags',{}).get('H3') else ''}
                </ul>
            <h3>Improvement Tips:</h3>
            <ul>
                f"<li>tip</li>" for tip in results.get('seo_quality',).get('improvement_tips', [])
            </ul>
            f"<h3>AI SEO Suggestions:</h3><p>results.get('ai_insights',).get('seo_improvement_suggestions', 'N/A')</p>" if results.get('ai_insights',).get('seo_improvement_suggestions') else ''
        </div>

        <div class="section">
            <h2>4. User Experience (UX)</h2>
            <h3>Issues Detected:</h3>
            <ul>
                f"<li>issue</li>" for issue in results.get('user_experience',).get('issues', [])
            </ul>
            <h3>General UX Suggestions:</h3>
            <ul>
                {f"<li>{suggestion}</li>" for suggestion in results.get('user_experience',{}).get('suggestions', [])}
            </ul>
            f"<h3>AI Content Insights:</h3><p>results.get('ai_insights',).get('content_originality_tone', 'N/A')</p>" if results.get('ai_insights',).get('content_originality_tone') else ''
        </div>

    </body>
    </html>
    """

    # Create a temporary file to save the PDF
    output_dir = "reports"
    os.makedirs(output_dir, exist_ok=True)
    pdf_filename = f"{url.replace('https://', '').replace('http://', '').replace('/', '_')}_report_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
    pdf_path = os.path.join(output_dir, pdf_filename)

    HTML(string=report_html).write_pdf(pdf_path)
    return pdf_path

# Example using FPDF2 (alternative if WeasyPrint has too many dependencies)
# from fpdf import FPDF
# def generate_pdf_report_fpdf(url, results):
#     pdf = FPDF()
#     pdf.add_page()
#     pdf.set_font("Arial", size=12)
#     pdf.cell(200, 10, txt=f"Website Analysis Report for {url}", ln=True, align="C")
#     # ... add more content using pdf.cell and pdf.multi_cell
#     pdf_filename = f"{url.replace('https://', '').replace('http://', '')}_analysis_report.pdf"
#     pdf_path = os.path.join("reports", pdf_filename)
#     pdf.output(pdf_path)
#     return pdf_path
# Rename Backend folder to backend
