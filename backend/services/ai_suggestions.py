import json
import httpx

# This function will interact with the Gemini API
async def get_ai_suggestions(url: str, analysis_results: dict):
    """
    Generates AI-powered summaries, SEO suggestions, and content insights
    based on the website analysis results using the Gemini API.
    """
    ai_insights = {
        "summary": "N/A",
        "seo_improvement_suggestions": "N/A",
        "content_originality_tone": "N/A"
    }

    # Prepare analysis data for the LLM
    # We'll simplify the results to make the prompt manageable for the LLM
    simplified_results = {
        "url": url,
        "domain_authority": {
            "domain": analysis_results.get('domain_authority', {}).get('domain', 'N/A'),
            "domain_age_years": analysis_results.get('domain_authority', {}).get('domain_age_years', 'N/A'),
            "ssl_status": analysis_results.get('domain_authority', {}).get('ssl_status', 'N/A'),
            "blacklist_status": analysis_results.get('domain_authority', {}).get('blacklist_status', 'N/A'),
        },
        "page_speed": {
            "Performance Score": analysis_results.get('page_speed', {}).get('scores', {}).get('Performance Score', 'N/A'),
            "issues": [issue.get('title', '') for issue in analysis_results.get('page_speed', {}).get('issues', [])]
        },
        "seo_quality": {
            "score": analysis_results.get('seo_quality', {}).get('score', 'N/A'),
            "title": analysis_results.get('seo_quality', {}).get('elements', {}).get('title', 'N/A'),
            "meta_description": analysis_results.get('seo_quality', {}).get('elements', {}).get('meta_description', 'N/A'),
            "broken_links_count": len(analysis_results.get('seo_quality', {}).get('elements', {}).get('broken_links', [])),
            "missing_alt_images_count": len([s for s in analysis_results.get('seo_quality', {}).get('elements', {}).get('image_alt_status', []) if "Missing" in s or "Empty" in s]),
            "keywords": analysis_results.get('seo_quality', {}).get('elements', {}).get('keyword_density', {}),
            "h_tags": analysis_results.get('seo_quality', {}).get('elements', {}).get('h_tags', {}),
            "improvement_tips": analysis_results.get('seo_quality', {}).get('improvement_tips', [])
        },
        "user_experience": {
            "issues": analysis_results.get('user_experience', {}).get('issues', []),
            "suggestions": analysis_results.get('user_experience', {}).get('suggestions', [])
        },
        "extracted_text_sample": analysis_results.get('extracted_text_sample', 'No text extracted.') # Assuming this is added to analysis_results
    }

    # Convert simplified_results to a JSON string for the prompt
    results_json_string = json.dumps(simplified_results, indent=2, ensure_ascii=False)

    # Gemini API configuration
    # The API key will be provided by the Canvas environment at runtime
    api_key = "" 
    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"

    # --- Prompt for Overall Summary ---
    summary_prompt = f"""
    Based on the following website analysis data for the URL: {url}, provide a concise overall summary.
    Highlight the main strengths, weaknesses, and critical areas for improvement.
    The summary should be easy to understand for a non-technical audience.
    
    Analysis Data:
    {results_json_string}
    """
    summary_payload = {"contents": [{"role": "user", "parts": [{"text": summary_prompt}]}]}
    
    # --- Prompt for SEO Improvement Suggestions ---
    seo_prompt = f"""
    Based on the following SEO analysis data for the URL: {url}, provide specific and actionable SEO improvement suggestions.
    Focus on title tags, meta descriptions, alt text for images, broken links, keyword usage, and heading structure.
    Provide at least 3-5 concrete suggestions.
    
    SEO Data:
    {json.dumps(simplified_results['seo_quality'], indent=2, ensure_ascii=False)}
    """
    seo_payload = {"contents": [{"role": "user", "parts": [{"text": seo_prompt}]}]}

    # --- Prompt for Content Originality & Tone (UX) ---
    content_ux_prompt = f"""
    Based on the following user experience issues and extracted text content for the URL: {url},
    provide insights into the content's originality, tone (e.g., formal, informal, engaging, dry), and readability.
    Suggest improvements for content quality and overall user experience.
    
    UX Issues: {json.dumps(simplified_results['user_experience']['issues'], indent=2, ensure_ascii=False)}
    Extracted Text Sample: {simplified_results['extracted_text_sample']}
    """
    content_ux_payload = {"contents": [{"role": "user", "parts": [{"text": content_ux_prompt}]}]}

    # Make API calls concurrently
    async with httpx.AsyncClient() as client:
        try:
            summary_response = await client.post(api_url, json=summary_payload, timeout=60)
            summary_response.raise_for_status() # Raise an exception for HTTP errors
            summary_result = summary_response.json()
            if summary_result.get('candidates') and summary_result['candidates'][0].get('content') and summary_result['candidates'][0]['content'].get('parts'):
                ai_insights["summary"] = summary_result['candidates'][0]['content']['parts'][0]['text']
            else:
                print(f"Gemini API (summary) returned unexpected structure: {summary_result}")

            seo_response = await client.post(api_url, json=seo_payload, timeout=60)
            seo_response.raise_for_status()
            seo_result = seo_response.json()
            if seo_result.get('candidates') and seo_result['candidates'][0].get('content') and seo_result['candidates'][0]['content'].get('parts'):
                ai_insights["seo_improvement_suggestions"] = seo_result['candidates'][0]['content']['parts'][0]['text']
            else:
                print(f"Gemini API (SEO) returned unexpected structure: {seo_result}")

            content_ux_response = await client.post(api_url, json=content_ux_payload, timeout=60)
            content_ux_response.raise_for_status()
            content_ux_result = content_ux_response.json()
            if content_ux_result.get('candidates') and content_ux_result['candidates'][0].get('content') and content_ux_result['candidates'][0]['content'].get('parts'):
                ai_insights["content_originality_tone"] = content_ux_result['candidates'][0]['content']['parts'][0]['text']
            else:
                print(f"Gemini API (content/UX) returned unexpected structure: {content_ux_result}")

        except httpx.HTTPStatusError as e:
            print(f"HTTP error during Gemini API call: {e.response.status_code} - {e.response.text}")
            # You might want to set a more specific error message in ai_insights
        except httpx.RequestError as e:
            print(f"Request error during Gemini API call: {e}")
        except Exception as e:
            print(f"An unexpected error occurred during Gemini API call: {e}")

    return ai_insights
