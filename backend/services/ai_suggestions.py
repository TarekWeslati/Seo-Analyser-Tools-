import requests
import json
import os

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
    if not api_key:
        raise Exception("Gemini API Key is not provided.")

    # Add language instruction to the prompt
    full_prompt = f"{prompt}\n\nRespond in {lang} language."

    chat_history = []
    chat_history.push({ "role": "user", "parts": [{ "text": full_prompt }] })

    payload = {
        "contents": chat_history,
        "generationConfig": {
            "temperature": 0.7,
            "topP": 0.95,
            "topK": 40,
        }
    }
    if response_schema:
        payload["generationConfig"]["responseMimeType"] = "application/json"
        payload["generationConfig"]["responseSchema"] = response_schema
    else:
        payload["generationConfig"]["responseMimeType"] = "text/plain"

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
                    # Gemini might return JSON as a string, need to parse it
                    return json.loads(text_response)
                except json.JSONDecodeError:
                    print(f"Warning: Gemini returned non-JSON string for expected JSON schema: {text_response}")
                    # Attempt to return raw text if JSON parsing fails, or raise error
                    raise Exception(f"Failed to parse JSON response from Gemini: {text_response}")
            else:
                return {"text": text_response}
        else:
            # Handle cases where candidates, content, parts, or text are missing
            print(f"Warning: Unexpected response structure from Gemini API: {result}")
            return {"text": "N/A"} # Return N/A for text if structure is bad

    except requests.exceptions.RequestException as e:
        print(f"Gemini API request failed: {e}")
        raise Exception(f"Gemini API request failed: {e}")
    except Exception as e:
        print(f"An error occurred during Gemini API call: {e}")
        raise Exception(f"An error occurred during Gemini API call: {e}")


def get_ai_suggestions(url, analysis_results, lang="en"):
    """
    Generates AI-powered SEO and content insights based on analysis results.
    """
    api_key = os.getenv('GEMINI_API_KEY') # Get API key dynamically
    if not api_key:
        print("GEMINI_API_KEY environment variable not set. AI suggestions will be N/A.")
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
    - Broken Links: {len(seo_quality.get('elements', {}).get('broken_links', []))}
    - Missing Alt Text Images: {len([s for s in seo_quality.get('elements', {}).get('image_alt_status', []) if "Missing" in s or "Empty" in s])}
    - H-Tags: {json.dumps(seo_quality.get('elements', {}).get('h_tags', {}))}
    - Keyword Density (Top 10): {json.dumps(dict(sorted(seo_quality.get('elements', {}).get('keyword_density', {}).items(), key=lambda item: item[1], reverse=True)[:10]))}
    - Overall SEO Score: {seo_quality.get('score', 'N/A')}
    - Existing SEO Improvement Tips: {json.dumps(seo_quality.get('improvement_tips', []))}

    Focus on 3-5 specific, actionable recommendations.
    """

    # Prompt for Content Originality/Tone/Readability
    content_prompt = f"""
    Analyze the following text sample from the website {url} for its originality, tone, and readability.
    Text Sample: "{extracted_text_sample}"
    Consider these UX issues (if any): {json.dumps(user_experience.get('issues', []))}
    Provide insights and suggestions for improvement.
    """

    # Prompt for Overall Summary
    summary_prompt = f"""
    Provide an overall summary of the website analysis for {url}.
    Include strengths, weaknesses, and critical areas for improvement based on all provided data:
    Domain Authority: {json.dumps(analysis_results.get('domain_authority', 'N/A'))}
    Page Speed: {json.dumps(analysis_results.get('page_speed', 'N/A'))}
    SEO Quality: {json.dumps(analysis_results.get('seo_quality', 'N/A'))}
    User Experience: {json.dumps(analysis_results.get('user_experience', 'N/A'))}
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


def generate_seo_rewrites(current_title, current_meta_description, keywords, lang="en"):
    """
    Generates alternative SEO-optimized title tags and meta descriptions using Gemini API.
    """
    api_key = os.getenv('GEMINI_API_KEY') # Get API key dynamically
    if not api_key:
        raise Exception("GEMINI_API_KEY environment variable not set. Cannot generate AI SEO rewrites.")

    prompt = f"""
    As an expert in SEO, please provide 3-5 alternative, SEO-optimized title tags and meta descriptions.
    The title tags should be between 10-70 characters.
    The meta descriptions should be between 120-160 characters.
    Focus on being concise, compelling, and including relevant keywords.

    Current Title: "{current_title}"
    Current Meta Description: "{current_meta_description}"
    Keywords to consider (if available): "{keywords}"

    Provide the output in JSON format, with keys 'titles' (list of strings) and 'meta_descriptions' (list of strings).
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
        # Return empty lists on error to avoid crashing the frontend
        return {"titles": [], "meta_descriptions": [], "error": str(e)}


def refine_content(text_sample, lang="en"):
    """
    Refines a given text sample for clarity, engagement, and readability using Gemini API.
    """
    api_key = os.getenv('GEMINI_API_KEY') # Get API key dynamically
    if not api_key:
        raise Exception("GEMINI_API_KEY environment variable not set. Cannot refine content.")
    
    if not text_sample or text_sample == "No content extracted for AI analysis.":
        # Return a default message if no valid text is provided
        return {"refined_text": "No valid text sample provided for refinement.", "suggestions": []}

    prompt = f"""
    As a content optimization specialist, please refine the following text sample.
    Improve its clarity, engagement, and readability.
    Provide a revised version of the text and 2-3 specific suggestions for further improvement.

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
        # Return default values on error to avoid crashing the frontend
        return {"refined_text": "Error during refinement.", "suggestions": [], "error": str(e)}

def get_adsense_readiness_assessment(analysis_results, lang="en"):
    """
    Provides an AI-driven assessment of a website's readiness for Google AdSense.
    """
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("GEMINI_API_KEY environment variable not set. AdSense assessment will be N/A.")
        return {
            "assessment": "N/A (AI features are limited or unavailable in the free version. Upgrade for full access.)",
            "improvement_areas": []
        }

    seo_quality = analysis_results.get('seo_quality', {})
    ux_data = analysis_results.get('user_experience', {})
    domain_authority = analysis_results.get('domain_authority', {})
    page_speed = analysis_results.get('page_speed', {})
    extracted_text_sample = analysis_results.get('extracted_text_sample', "No content available.")

    prompt = f"""
    Based on the following website analysis data, provide an assessment of its readiness for Google AdSense.
    Do NOT give a numerical percentage. Instead, provide an overall assessment (e.g., "Good potential, but needs improvements in X and Y" or "Significant improvements needed") and list 3-5 key areas for improvement to meet AdSense requirements.

    Website Analysis Data:
    - Domain Age: {domain_authority.get('domain_age_years', 'N/A')} years
    - SSL Status: {domain_authority.get('ssl_status', 'N/A')}
    - Broken Links: {len(seo_quality.get('elements', {}).get('broken_links', []))}
    - Missing Alt Text Images: {len([s for s in seo_quality.get('elements', {}).get('image_alt_status', []) if "Missing" in s or "Empty" in s])}
    - Overall SEO Score: {seo_quality.get('score', 'N/A')}
    - Page Speed Performance Score: {page_speed.get('scores', {}).get('Performance Score', 'N/A')}
    - UX Issues: {json.dumps(ux_data.get('issues', []))}
    - Sample Content: "{extracted_text_sample}"
    - Heading Tags: {json.dumps(seo_quality.get('elements', {}).get('h_tags', {}))}
    - Meta Description: {seo_quality.get('elements', {}).get('meta_description', 'N/A')}

    Consider factors like content quality (originality, depth, readability), site navigation, user experience, technical SEO, and compliance with AdSense policies (e.g., no broken links, good page speed).

    Provide the output in JSON format, with keys 'assessment' (string) and 'improvement_areas' (list of strings).
    Ensure the response is in {lang} language.
    """

    response_schema = {
        "type": "OBJECT",
        "properties": {
            "assessment": {"type": "STRING"},
            "improvement_areas": {
                "type": "ARRAY",
                "items": {"type": "STRING"}
            }
        },
        "required": ["assessment", "improvement_areas"]
    }

    try:
        return call_gemini_api(prompt, api_key, response_schema, lang)
    except Exception as e:
        print(f"Error in get_adsense_readiness_assessment: {e}")
        return {
            "assessment": "Error generating AdSense assessment. (AI features are limited or unavailable in the free version.)",
            "improvement_areas": []
        }


def get_broken_link_fix_suggestions(broken_links_list, lang="en"):
    """
    Provides AI-driven suggestions for fixing broken links.
    """
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("GEMINI_API_KEY environment variable not set. Broken link suggestions will be N/A.")
        return {
            "suggestions": "N/A (AI features are limited or unavailable in the free version. Upgrade for full access.)"
        }

    if not broken_links_list:
        return {"suggestions": "No broken links provided for suggestions."}

    # Limit the number of broken links sent to AI to avoid exceeding context window
    links_sample = broken_links_list[:5] # Take first 5 broken links for the prompt

    prompt = f"""
    You are an expert in website maintenance and SEO.
    Given the following list of broken links found on a website:
    {json.dumps(links_sample, indent=2)}

    Provide concise and actionable suggestions on how to fix these broken links.
    Focus on general strategies and best practices rather than specific code,
    as the exact fix depends on the nature of each link.
    Include 3-5 distinct methods or tips.
    Provide the output in JSON format, with a key 'suggestions' (string).
    Ensure the response is in {lang} language.
    """

    response_schema = {
        "type": "OBJECT",
        "properties": {
            "suggestions": {"type": "STRING"}
        },
        "required": ["suggestions"]
    }

    try:
        response = call_gemini_api(prompt, api_key, response_schema, lang)
        return {"suggestions": response.get("suggestions", "N/A")}
    except Exception as e:
        print(f"Error in get_broken_link_fix_suggestions: {e}")
        return {
            "suggestions": "Error generating broken link fix suggestions. (AI features are limited or unavailable in the free version.)"
        }

