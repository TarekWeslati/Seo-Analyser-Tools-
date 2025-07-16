import os
from datetime import datetime
from weasyprint import HTML, CSS

def generate_pdf_report(url, results):
    report_html = f"""
    <!DOCTYPE html>
    <html lang="en" dir="ltr">
    <head>
        <meta charset="UTF-8">
        <title>Website Analysis Report for {url}</title>
        <style>
            body {{ font-family: 'Inter', sans-serif; margin: 20px; direction: ltr; text-align: left; }}
            h1, h2, h3 {{ color: #333; }}
            .section {{ margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px; }}
            .score-badge {{
                display: inline-block; padding: 8px 12px; border-radius: 5px; font-weight: bold;
                color: white; text-align: center; margin-right: 10px; /* For button spacing */
            }}
            .score-good {{ background-color: #28a745; }} /* Green */
            .score-medium {{ background-color: #ffc107; }} /* Yellow */
            .score-bad {{ background-color: #dc3545; }} /* Red */
            ul {{ list-style-type: disc; margin-left: 20px; }}
            li {{ margin-bottom: 5px; }}
        </style>
    </head>
    <body>
        <h1 style="text-align: center;">Website Analysis Report</h1>
        <p><strong>URL:</strong> {url}</p>
        <p><strong>Report Date:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>

        <div class="section">
            <h2>Overall Scores</h2>
            <p>
                SEO Score: <span class="score-badge {'score-good' if results.get('seo_quality',{{}}).get('score',0) >= 70 else 'score-medium' if results.get('seo_quality',{{}}).get('score',0) >= 40 else 'score-bad'}">{results.get('seo_quality',{{}}).get('score', 'N/A')}/100</span>
                Performance Score: <span class="score-badge {'score-good' if results.get('page_speed',{{}}).get('scores',{{}}).get('Performance Score',0) >= 70 else 'score-medium' if results.get('page_speed',{{}}).get('scores',{{}}).get('Performance Score',0) >= 40 else 'score-bad'}">{results.get('page_speed',{{}}).get('scores',{{}}).get('Performance Score', 'N/A')}</span>
                UX Score: <span class="score-badge {'score-good' if results.get('user_experience',{{}}).get('score',0) >= 70 else 'score-medium' if results.get('user_experience',{{}}).get('score',0) >= 40 else 'score-bad'}">{results.get('user_experience',{{}}).get('score', 'N/A')}/100</span>
            </p>
            {f"<h3>AI Summary:</h3><p>{results.get('ai_insights',{{}}).get('summary', 'N/A')}</p>" if results.get('ai_insights',{{}}).get('summary') else ''}
        </div>

        <div class="section">
            <h2>1. Domain Authority & Website Trust</h2>
            <p>Domain: {results.get('domain_authority',{{}}).get('domain', 'N/A')}</p>
            <ul>
                <li>Estimated Domain Authority: {results.get('domain_authority',{{}}).get('domain_authority_estimate', 'N/A')}</li>
                <li>Domain Age: {results.get('domain_authority',{{}}).get('domain_age_years', 'N/A')} years</li>
                <li>SSL/HTTPS Status: {results.get('domain_authority',{{}}).get('ssl_status', 'N/A')}</li>
                <li>Blacklist Status: {results.get('domain_authority',{{}}).get('blacklist_status', 'N/A')}</li>
                <li>DNS Health: {results.get('domain_authority',{{}}).get('dns_health', 'N/A')}</li>
            </ul>
        </div>

        <div class="section">
            <h2>2. Page Speed & Performance</h2>
            <h3>Core Web Vitals & Key Performance Metrics:</h3>
            <ul>
                {f"<li>First Contentful Paint (FCP): {results.get('page_speed',{{}}).get('metrics',{{}}).get('First Contentful Paint', 'N/A')}</li>" if results.get('page_speed',{{}}).get('metrics',{{}}).get('First Contentful Paint') else ''}
                {f"<li>Largest Contentful Paint (LCP): {results.get('page_speed',{{}}).get('metrics',{{}}).get('Largest Contentful Paint', 'N/A')}</li>" if results.get('page_speed',{{}}).get('metrics',{{}}).get('Largest Contentful Paint') else ''}
                {f"<li>Cumulative Layout Shift (CLS): {results.get('page_speed',{{}}).get('metrics',{{}}).get('Cumulative Layout Shift', 'N/A')}</li>" if results.get('page_speed',{{}}).get('metrics',{{}}).get('Cumulative Layout Shift') else ''}
                {f"<li>Total Blocking Time (TBT): {results.get('page_speed',{{}}).get('metrics',{{}}).get('Total Blocking Time', 'N/A')}</li>" if results.get('page_speed',{{}}).get('metrics',{{}}).get('Total Blocking Time') else ''}
                {f"<li>Speed Index: {results.get('page_speed',{{}}).get('metrics',{{}}).get('Speed Index', 'N/A')}</li>" if results.get('page_speed',{{}}).get('metrics',{{}}).get('Speed Index') else ''}
            </ul>
            <h3>Performance Issues:</h3>
            <ul>
                {''.join([f"<li>{{{{issue['title']}}}} (Score: {{{{issue.get('score', 'N/A')}}}}): {{{{issue.get('description', '')}}}}</li>" for issue in results.get('page_speed',{{}}).get('issues', [])]) if results.get('page_speed',{{}}).get('issues', []) else '<li>No major performance issues detected.</li>'}
            </ul>
            <p style="text-align: left;"><a href="{results.get('page_speed',{{}}).get('full_report_link', '#')}">View Full Google PageSpeed Insights Report</a></p>
        </div>

        <div class="section">
            <h2>3. SEO Quality & Structure</h2>
            <ul>
                <li>Title Tag: <span dir="ltr">{results.get('seo_quality',{{}}).get('elements',{{}}).get('title', 'N/A')}</span></li>
                <li>Meta Description: <span dir="ltr">{results.get('seo_quality',{{}}).get('elements',{{}}).get('meta_description', 'N/A')}</span></li>
                <li>Broken Links Found: {len(results.get('seo_quality',{{}}).get('elements',{{}}).get('broken_links', []))}</li>
                <li>Images Missing Alt: {len([s for s in results.get('seo_quality',{{}}).get('elements',{{}}).get('image_alt_status', []) if "Missing" in s or "Empty" in s])} missing/empty</li>
                <li>Internal Links Count: {results.get('seo_quality',{{}}).get('elements',{{}}).get('internal_links_count', 'N/A')}</li>
                <li>External Links Count: {results.get('seo_quality',{{}}).get('elements',{{}}).get('external_links_count', 'N/A')}</li>
            </ul>
            <h3>H-Tag Structure (Headings):</h3>
            <ul>
                {f"<li>H1: {{{{', '.join(results.get('seo_quality',{{}}).get('elements',{{}}).get('h_tags',{{}}).get('H1',[]))}}}}</li>" if results.get('seo_quality',{{}}).get('elements',{{}}).get('h_tags',{{}}).get('H1') else ''}
                {f"<li>H2: {{{{', '.join(results.get('seo_quality',{{}}).get('elements',{{}}).get('h_tags',{{}}).get('H2',[]))}}}}</li>" if results.get('seo_quality',{{}}).get('elements',{{}}).get('h_tags',{{}}).get('H2') else ''}
                {f"<li>H3: {{{{', '.join(results.get('seo_quality',{{}}).get('elements',{{}}).get('h_tags',{{}}).get('H3',[]))}}}}</li>" if results.get('seo_quality',{{}}).get('elements',{{}}).get('h_tags',{{}}).get('H3') else ''}
                <!-- Add H4-H6 if necessary -->
            </ul>
            <h3>SEO Improvement Tips:</h3>
            <ul>
                {''.join([f"<li>{{{{tip}}}}</li>" for tip in results.get('seo_quality',{{}}).get('improvement_tips', [])]) if results.get('seo_quality',{{}}).get('improvement_tips', []) else '<li>Looks good! No critical SEO issues detected based on our analysis.</li>'}
            </ul>
            {f"<h3>AI SEO Suggestions:</h3><p>{results.get('ai_insights',{{}}).get('seo_improvement_suggestions', 'N/A')}</p>" if results.get('ai_insights',{{}}).get('seo_improvement_suggestions') else ''}
        </div>

        <div class="section">
            <h2>4. User Experience (UX)</h2>
            <h3>Detected UX Issues:</h3>
            <ul>
                {''.join([f"<li>{{{{issue}}}}</li>" for issue in results.get('user_experience',{{}}).get('issues', [])]) if results.get('user_experience',{{}}).get('issues', []) else '<li>No major UX issues detected based on our heuristic analysis.</li>'}
            </ul>
            <h3>General UX Suggestions:</h3>
            <ul>
                {''.join([f"<li>{{{{suggestion}}}}</li>" for suggestion in results.get('user_experience',{{}}).get('suggestions', [])])}
            </ul>
            {f"<h3>AI Content Insights:</h3><p>{results.get('ai_insights',{{}}).get('content_originality_tone', 'N/A')}</p>" if results.get('ai_insights',{{}}).get('content_originality_tone') else ''}
        </div>

    </body>
    </html>
    """
    # Create a temporary directory for the PDF
    temp_dir = 'temp_reports'
    os.makedirs(temp_dir, exist_ok=True)
    pdf_filename = f"{url.replace('https://', '').replace('http://', '').replace('/', '_')}_report.pdf"
    pdf_path = os.path.join(temp_dir, pdf_filename)

    # Convert HTML to PDF
    HTML(string=report_html).write_pdf(pdf_path)

    return pdf_path
