import os
import json
import requests

def call_gemini_api(prompt, model_name="gemini-2.5-flash-preview-05-20"):
    """
    Calls the Gemini API to generate text based on a given prompt.
    Handles exponential backoff for retries.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable not set.")
        return None

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}]
    }

    retries = 0
    max_retries = 5
    base_delay = 1  # seconds

    while retries < max_retries:
        try:
            response = requests.post(url, headers=headers, data=json.dumps(payload), timeout=60)
            response.raise_for_status()  # Raise an HTTPError for bad responses (4xx or 5xx)
            result = response.json()

            if result and result.get("candidates") and len(result["candidates"]) > 0 and \
               result["candidates"][0].get("content") and result["candidates"][0]["content"].get("parts") and \
               len(result["candidates"][0]["content"]["parts"]) > 0:
                return result["candidates"][0]["content"]["parts"][0]["text"]
            else:
                print(f"Gemini API returned an unexpected structure: {result}")
                return None
        except requests.exceptions.Timeout:
            print(f"Request timed out. Retrying {retries + 1}/{max_retries}...")
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}. Retrying {retries + 1}/{max_retries}...")
        except json.JSONDecodeError:
            print(f"Failed to decode JSON from response: {response.text}. Retrying {retries + 1}/{max_retries}...")

        retries += 1
        delay = base_delay * (2 ** retries)  # Exponential backoff
        print(f"Waiting for {delay} seconds before retrying...")
        time.sleep(delay)

    print(f"Failed to get a successful response from Gemini API after {max_retries} retries.")
    return None

def analyze_article_content(article_text, lang="en"):
    """
    Analyzes article content using LLM for structure, keywords, health, and originality.
    """
    results = {
        "suggested_structure": "No suggestions available.",
        "keyword_suggestions": "No suggestions available.",
        "content_health_assessment": "No assessment available.",
        "originality_assessment": "No assessment available.",
        "error": None
    }

    # Define prompts in both English and Arabic
    prompts = {
        "en": {
            "structure": "Analyze the following article content and suggest an optimal SEO-friendly article structure (headings, subheadings, key sections). Provide the output as a clear, structured text. Article: ",
            "keywords": "Based on the following article content, suggest relevant SEO keywords and long-tail keywords. Provide the output as a comma-separated list of keywords. Article: ",
            "health": "Assess the SEO health of the following article content. Provide insights on readability, keyword stuffing, and overall SEO quality. Article: ",
            "originality": "Assess the originality and uniqueness of the following article content. Highlight any potential issues with plagiarism or lack of unique perspective. Article: "
        },
        "ar": {
            "structure": "حلل محتوى المقال التالي واقترح هيكلاً مثالياً للمقال متوافقاً مع تحسين محركات البحث (عناوين رئيسية، عناوين فرعية، أقسام رئيسية). قدم الناتج كنص منظم وواضح. المقال: ",
            "keywords": "بناءً على محتوى المقال التالي، اقترح كلمات مفتاحية ذات صلة وكلمات مفتاحية طويلة الذيل لتحسين محركات البحث. قدم الناتج كقائمة كلمات مفتاحية مفصولة بفاصلة. المقال: ",
            "health": "قم بتقييم صحة تحسين محركات البحث (SEO) لمحتوى المقال التالي. قدم رؤى حول سهولة القراءة، حشو الكلمات المفتاحية، والجودة العامة لتحسين محركات البحث. المقال: ",
            "originality": "قم بتقييم أصالة وتفرد محتوى المقال التالي. سلط الضوء على أي مشكلات محتملة تتعلق بالانتحال أو نقص المنظور الفريد. المقال: "
        }
    }

    # Select prompts based on language
    selected_prompts = prompts.get(lang, prompts["en"]) # Default to English if language not found

    try:
        # Generate suggested structure
        structure_prompt = selected_prompts["structure"] + article_text
        results["suggested_structure"] = call_gemini_api(structure_prompt) or "No suggestions available."

        # Generate keyword suggestions
        keywords_prompt = selected_prompts["keywords"] + article_text
        results["keyword_suggestions"] = call_gemini_api(keywords_prompt) or "No suggestions available."

        # Generate content health assessment
        health_prompt = selected_prompts["health"] + article_text
        results["content_health_assessment"] = call_gemini_api(health_prompt) or "No assessment available."

        # Generate originality assessment
        originality_prompt = selected_prompts["originality"] + article_text
        results["originality_assessment"] = call_gemini_api(originality_prompt) or "No assessment available."

    except Exception as e:
        results["error"] = f"An error occurred during article analysis: {str(e)}"
        print(f"Error in analyze_article_content: {e}")

    return results

def rewrite_article(article_text, lang="en"):
    """
    Rewrites an article using LLM to make it 100% original.
    """
    rewrite_prompt_en = "Rewrite the following article content to be 100% original, unique, and engaging, while retaining its core meaning and key information. Ensure it passes plagiarism checks. Article: "
    rewrite_prompt_ar = "أعد صياغة محتوى المقال التالي ليكون أصلياً وفريداً وجذاباً بنسبة 100%، مع الحفاظ على معناه الأساسي ومعلوماته الرئيسية. تأكد من أنه يجتاز فحوصات الانتحال. المقال: "

    selected_rewrite_prompt = rewrite_prompt_ar if lang == "ar" else rewrite_prompt_en

    try:
        rewritten_content = call_gemini_api(selected_rewrite_prompt + article_text)
        return {"rewritten_content": rewritten_content or "No rewritten article available."}
    except Exception as e:
        print(f"Error in rewrite_article: {e}")
        return {"error": f"Failed to rewrite article: {str(e)}"}

