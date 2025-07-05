import openai

def get_ai_suggestions(url, analysis_results, openai_api_key):
    openai.api_key = openai_api_key

    prompt_summary = f"""
    Analyze the following website analysis results for {url} and provide a concise, human-readable summary.
    Focus on the most critical findings and overall strengths/weaknesses.

    Analysis Results:
    Domain Authority & Trust: {analysis_results.get('domain_authority')}
    Page Speed & Performance: {analysis_results.get('page_speed')}
    SEO Quality & Structure: {analysis_results.get('seo_quality')}
    User Experience (UX): {analysis_results.get('user_experience')}
    """

    prompt_seo_improvements = f"""
    Based on the SEO analysis results for {url}, provide 3-5 actionable and specific SEO improvement suggestions.
    Focus on technical SEO, on-page SEO, and content optimization.

    SEO Analysis Data: {analysis_results.get('seo_quality')}
    """

    prompt_content_originality_tone = f"""
    Given the following URL: {url}, please provide a brief assessment of the likely content originality and tone.
    (Note: For accurate content originality, a more in-depth content analysis is needed, this will be a general guess based on typical website content patterns or if the URL suggests a very generic site).
    Focus on general impression and common tones (e.g., informative, promotional, casual, formal).
    """

    summary = ""
    seo_suggestions = ""
    content_insights = ""

    try:
        # Generate Summary
        response_summary = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful AI assistant specialized in website analysis."},
                {"role": "user", "content": prompt_summary}
            ],
            max_tokens=300
        )
        summary = response_summary.choices[0].message.content.strip()

        # Generate SEO Improvements
        response_seo = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert SEO consultant."},
                {"role": "user", "content": prompt_seo_improvements}
            ],
            max_tokens=400
        )
        seo_suggestions = response_seo.choices[0].message.content.strip()

        # Generate Content Originality and Tone (more of a guess without actual content)
        response_content = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a content analysis expert."},
                {"role": "user", "content": prompt_content_originality_tone}
            ],
            max_tokens=200
        )
        content_insights = response_content.choices[0].message.content.strip()

    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        return {"error": f"AI feature unavailable: {e}"}

    return {
        "summary": summary,
        "seo_improvement_suggestions": seo_suggestions,
        "content_originality_tone": content_insights
    }
