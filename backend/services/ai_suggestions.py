import requests
import json

# Placeholder for Gemini API Key - will be passed from app.py config
# For local testing, you might set it here: GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"

def call_gemini_api(prompt, api_key, response_schema=None, lang="en"):
    """
    Calls the Gemini 2.0 Flash API to generate content.
    Args:
        prompt (str): The prompt to send to the LLM.
        api_key (str): Your Gemini API key.
        response_schema (dict, optional): JSON schema for structured responses. Defaults to None.
        lang (str): Preferred language for the response (e.g., "en", "ar", "fr").
    Returns:
        dict: Parsed JSON response from the API.
    Raises:
        Exception: If the API call fails or returns an unexpected response.
    """
    chat_history = []
    chat_history.push({ "role": "user", "parts": [{ "text": prompt }] })

    payload = {
        "contents": chat_history,
        "generationConfig": {
            "responseMimeType": "application/json" if response_schema else "text/plain",
            "temperature": 0.7,
            "topP": 0.95,
            "topK": 40,
        }
    }
    if response_schema:
        payload["generationConfig"]["responseSchema"] = response_schema

    # Construct the API URL
    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"

    try:
        response = requests.post(
            api_url,
            headers={'Content-Type': 'application/json'},
            data=json.dumps(payload)
        )
        response.raise_for_status() # Raise an exception for HTTP errors (4xx or 5xx)
        result = response.json()

        if result.get("candidates") and result["candidates"][0].get("content") and \
           result["candidates"][0]["content"].get("parts") and \
           result["candidates"][0]["content"]["parts"][0].get("text"):
            
            text_response = result["candidates"][0]["content"]["parts"][0]["text"]
            if response_schema:
                try:
                    return json.loads(text_response)
                except json.JSONDecodeError:
                    raise Exception(f"Failed to parse JSON response from Gemini: {text_response}")
            else:
                return {"text": text_response}
        else:
            raise Exception(f"Unexpected response structure from Gemini API: {result}")

    except requests.exceptions.RequestException as e:
        raise Exception(f"Gemini API request failed: {e}")
    except Exception as e:
        raise Exception(f"An error occurred during Gemini API call: {e}")


def get_ai_suggestions(url, analysis_results, lang="en", api_key=None):
    """
    Generates AI-powered SEO and content insights based on analysis results.
    """
    if not api_key:
        print("GEMINI_API_KEY not set. AI suggestions will be N/A.")
        return {
            "seo_improvement_suggestions": "N/A",
            "content_originality_tone": "N/A",
            "summary": "N/A"
        }

    seo_quality = analysis_results.get('seo_quality', {})
    user_experience = analysis_results.get('user_experience', {})
    extracted_text_sample = analysis_results.get('extracted_text_sample', "No content available.")

    # Prompt for SEO suggestions
    seo_prompt = f"""
    As an expert SEO analyst, provide actionable SEO improvement suggestions for the website: {url}.
    Based on the following data:
    - Title: {seo_quality.get('elements', {}).get('title', 'N/A')}
    - Meta Description: {seo_quality.get('elements', {}).get('meta_description', 'N/A')}
    - Broken Links: {seo_quality.get('elements', {}).get('broken_links', [])}
    - Missing Alt Text Images: {seo_quality.get('elements', {}).get('image_alt_status', [])}
    - H-Tags: {seo_quality.get('elements', {}).get('h_tags', {})}
    - Keyword Density (Top 10): {json.dumps(dict(sorted(seo_quality.get('elements', {}).get('keyword_density', {}).items(), key=lambda item: item[1], reverse=True)[:10]))}
    - Overall SEO Score: {seo_quality.get('score', 'N/A')}
    - Existing SEO Improvement Tips: {seo_quality.get('improvement_tips', [])}

    Focus on 3-5 specific, actionable recommendations.
    Respond in {lang} language.
    """

    # Prompt for Content Originality/Tone/Readability
    content_prompt = f"""
    Analyze the following text sample from the website {url} for its originality, tone, and readability.
    Text Sample: "{extracted_text_sample}"
    Consider these UX issues (if any): {user_experience.get('issues', [])}
    Provide insights and suggestions for improvement.
    Respond in {lang} language.
    """

    # Prompt for Overall Summary
    summary_prompt = f"""
    Provide an overall summary of the website analysis for {url}.
    Include strengths, weaknesses, and critical areas for improvement based on all provided data:
    Domain Authority: {analysis_results.get('domain_authority', 'N/A')}
    Page Speed: {analysis_results.get('page_speed', 'N/A')}
    SEO Quality: {analysis_results.get('seo_quality', 'N/A')}
    User Experience: {analysis_results.get('user_experience', 'N/A')}
    Respond in {lang} language.
    """

    ai_suggestions = {
        "seo_improvement_suggestions": "N/A",
        "content_originality_tone": "N/A",
        "summary": "N/A"
    }

    try:
        seo_response = call_gemini_api(seo_prompt, api_key, lang=lang)
        ai_suggestions["seo_improvement_suggestions"] = seo_response.get("text", "N/A")
    except Exception as e:
        print(f"Error getting AI SEO suggestions: {e}")

    try:
        content_response = call_gemini_api(content_prompt, api_key, lang=lang)
        ai_suggestions["content_originality_tone"] = content_response.get("text", "N/A")
    except Exception as e:
        print(f"Error getting AI content insights: {e}")

    try:
        summary_response = call_gemini_api(summary_prompt, api_key, lang=lang)
        ai_suggestions["summary"] = summary_response.get("text", "N/A")
    except Exception as e:
        print(f"Error getting AI overall summary: {e}")

    return ai_suggestions


def generate_seo_rewrites(current_title, current_meta_description, keywords, lang="en", api_key=None):
    """
    Generates alternative SEO-optimized title tags and meta descriptions using Gemini API.
    """
    if not api_key:
        raise Exception("GEMINI_API_KEY not set. Cannot generate AI SEO rewrites.")

    prompt = f"""
    As an expert in SEO, please provide 3-5 alternative, SEO-optimized title tags and meta descriptions.
    The title tags should be between 10-70 characters.
    The meta descriptions should be between 120-160 characters.
    Focus on being concise, compelling, and including relevant keywords.

    Current Title: "{current_title}"
    Current Meta Description: "{current_meta_description}"
    Keywords to consider (if available): "{keywords}"

    Provide the output in JSON format, with keys 'titles' (list of strings) and 'meta_descriptions' (list of strings).
    Ensure the response is in {lang} language.
    """

    response_schema = {
        "type": "OBJECT",
        "properties": {
            "titles": {
                "type": "ARRAY",
                "items": {"type": "STRING"}
            },
            "meta_descriptions": {
                "type": "ARRAY",
                "items": {"type": "STRING"}
            }
        },
        "required": ["titles", "meta_descriptions"]
    }

    try:
        return call_gemini_api(prompt, api_key, response_schema, lang)
    except Exception as e:
        print(f"Error in generate_seo_rewrites: {e}")
        return {"titles": [], "meta_descriptions": [], "error": str(e)}


def refine_content(text_sample, lang="en", api_key=None):
    """
    Refines a given text sample for clarity, engagement, and readability using Gemini API.
    """
    if not api_key:
        raise Exception("GEMINI_API_KEY not set. Cannot refine content.")
    
    if not text_sample:
        return {"refined_text": "No text provided.", "suggestions": []}

    prompt = f"""
    As a content optimization specialist, please refine the following text sample.
    Improve its clarity, engagement, and readability.
    Provide a revised version of the text and 2-3 specific suggestions for further improvement.
    The refined text should be in {lang} language.

    Text Sample: "{text_sample}"

    Provide the output in JSON format, with keys 'refined_text' (string) and 'suggestions' (list of strings).
    """

    response_schema = {
        "type": "OBJECT",
        "properties": {
            "refined_text": {"type": "STRING"},
            "suggestions": {
                "type": "ARRAY",
                "items": {"type": "STRING"}
            }
        },
        "required": ["refined_text", "suggestions"]
    }

    try:
        return call_gemini_api(prompt, api_key, response_schema, lang)
    except Exception as e:
        print(f"Error in refine_content: {e}")
        return {"refined_text": "Error during refinement.", "suggestions": [], "error": str(e)}

