import requests

def get_pagespeed_insights(url, api_key):
    api_url = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
    params = {
        'url': url,
        'key': api_key,
        'strategy': 'desktop', # Can also run for 'mobile'
        'category': ['PERFORMANCE', 'ACCESSIBILITY', 'BEST_PRACTICES', 'SEO'] # Get all categories
    }
    
    try:
        response = requests.get(api_url, params=params)
        response.raise_for_status() # Raise an exception for HTTP errors
        data = response.json()

        # Extract Core Web Vitals (LCP, FID, CLS) - often from metrics
        # Note: FID is a lab data metric, not always available directly as CWV from PageSpeed API v5.
        # It's more of a field data metric. We'll focus on lab metrics here.
        lighthouse_result = data.get('lighthouseResult', {})
        audits = lighthouse_result.get('audits', {})

        metrics = {
            "First Contentful Paint": audits.get('first-contentful-paint', {}).get('displayValue'),
            "Largest Contentful Paint": audits.get('largest-contentful-paint', {}).get('displayValue'),
            "Cumulative Layout Shift": audits.get('cumulative-layout-shift', {}).get('displayValue'),
            "Total Blocking Time": audits.get('total-blocking-time', {}).get('displayValue'), # Proxy for FID impact
            "Speed Index": audits.get('speed-index', {}).get('displayValue'),
        }

        # Identify issues
        performance_issues = []
        for audit_id, audit_data in audits.items():
            if audit_data.get('score') is not None and audit_data['score'] < 0.9: # Below 90% score
                if 'details' in audit_data and 'items' in audit_data['details']:
                    # Look for specific types of issues
                    if audit_id in ['large-payloads', 'unnecessary-javascript', 'unnecessary-css', 'uses-optimized-images']:
                        performance_issues.append({
                            "title": audit_data.get('title'),
                            "description": audit_data.get('description'),
                            "score": audit_data.get('score')
                        })
                    elif audit_id == 'server-response-time':
                        performance_issues.append({
                            "title": "Server Response Time",
                            "description": "Ensure your server response time is fast.",
                            "score": audit_data.get('score')
                        })
                    elif audit_id == 'uses-optimized-images' and audit_data.get('details', {}).get('items'):
                        heavy_images = [item.get('url') for item in audit_data['details']['items'] if item.get('totalBytes') > 100 * 1024] # Example: >100KB
                        if heavy_images:
                            performance_issues.append({
                                "title": "Heavy Images Detected",
                                "images": heavy_images,
                                "description": "Optimize these images for faster loading."
                            })

        # Overall scores
        scores = {
            "Performance Score": lighthouse_result.get('categories', {}).get('performance', {}).get('score') * 100,
            "Accessibility Score": lighthouse_result.get('categories', {}).get('accessibility', {}).get('score') * 100,
            "Best Practices Score": lighthouse_result.get('categories', {}).get('best-practices', {}).get('score') * 100,
            "SEO Score": lighthouse_result.get('categories', {}).get('seo', {}).get('score') * 100,
        }

        return {
            "metrics": metrics,
            "scores": scores,
            "issues": performance_issues,
            "full_report_link": f"https://developers.google.com/speed/pagespeed/insights/?url={url}"
        }

    except requests.exceptions.RequestException as e:
        print(f"Error fetching PageSpeed Insights: {e}")
        return {"error": f"Could not fetch PageSpeed Insights: {e}"}
    except Exception as e:
        print(f"An unexpected error occurred in PageSpeed analysis: {e}")
        return {"error": f"An unexpected error occurred: {e}"}
