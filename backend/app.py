from flask import Flask, request, jsonify
import requests
from bs4 import BeautifulSoup
import os

app = Flask(__name__)

# دالة وهمية لاستدعاء نموذج Gemini
# يجب استبدال هذه الدالة بالكود الفعلي الخاص بك
def call_gemini_api(prompt):
    # هنا يجب أن يكون الكود الذي يرسل الطلب إلى API Gemini
    # ويعيد النتيجة
    # كمثال، يمكن استخدام مكتبة google.generativeai
    # import google.generativeai as genai
    # genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    # model = genai.GenerativeModel('gemini-pro')
    # response = model.generate_content(prompt)
    # return response.text
    return {"result": f"This is a placeholder for Gemini's response to: {prompt}"}

# ---
# 1. وظيفة إعادة كتابة المقالات (Article Rewriter)
# ---
@app.route('/api/rewrite', methods=['POST'])
def rewrite_article():
    data = request.get_json()
    text = data.get('text')
    
    if not text:
        return jsonify({"error": "Text to rewrite is required"}), 400
    
    prompt = f"أعد كتابة هذا المقال بأسلوب احترافي وجذاب مع الحفاظ على المعنى الأصلي:\n\n{text}"
    
    gemini_response = call_gemini_api(prompt)
    
    return jsonify({"rewritten_text": gemini_response["result"]})

# ---
# 2. وظيفة تحليل المقالات (Article Analysis)
# ---
@app.route('/api/analyze-article', methods=['POST'])
def analyze_article_content():
    data = request.get_json()
    article_content = data.get('content')

    if not article_content:
        return jsonify({"error": "Article content is required"}), 400

    prompt = f"""
    قم بتحليل المحتوى التالي من المقال وقدم تقريراً مفصلاً.
    تقريرك يجب أن يتضمن:
    1. الكلمات المفتاحية الأساسية في المقال.
    2. تقييم لسهولة القراءة (Readability Score) وتوصيات لتحسينه.
    3. تقييم لنية المستخدم (User Intent) التي يستهدفها المقال (مثل: إعلامي، تجاري، استقصائي).
    4. اقتراحات للمحتوى المفقود (Content Gaps) التي يمكن إضافتها لتعزيز المقال.

    محتوى المقال:
    {article_content}
    """

    # استبدال هذا الاستدعاء بـ API Gemini الفعلي
    gemini_api_response = {
        "keywords": ["الذكاء الاصطناعي", "تحليل البيانات"],
        "readability_score": "جيد جداً (85/100)",
        "readability_recommendations": "استخدم جمل أقصر في بعض الأحيان",
        "user_intent": "إعلامي (Informational)",
        "content_gaps": ["يمكن إضافة فقرة عن تطبيقات الذكاء الاصطناعي في حياتنا اليومية."]
    }

    return jsonify(gemini_api_response)

# ---
# 3. وظيفة تحليل الكلمات المفتاحية للمواقع (Website Keyword Analysis)
# ---
@app.route('/api/get_website_keywords', methods=['POST'])
def get_website_keywords():
    data = request.get_json()
    url = data.get('url')

    if not url:
        return jsonify({"error": "URL is required"}), 400

    try:
        response = requests.get(url, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        page_text = soup.get_text()

        prompt = f"حلل هذا النص واستخرج أهم الكلمات المفتاحية و الكلمات المفتاحية الطويلة (long-tail keywords) ذات الصلة: \n\n{page_text[:4000]}"
        
        # استبدال هذا الاستدعاء بـ API Gemini الفعلي
        gemini_api_response = {
            "keywords": ["تحليل المواقع", "تحسين محركات البحث"],
            "long_tail_keywords": ["كيفية تحسين سيو الموقع", "أدوات مجانية لتحليل المواقع"]
        }

        return jsonify(gemini_api_response)

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to fetch the URL: {e}"}), 500

# ---
# 4. وظيفة تحليل المنافسين (Competitor Analysis)
# ---
@app.route('/api/analyze_competitors', methods=['POST'])
def analyze_competitors():
    data = request.get_json()
    my_url = data.get('my_url')
    competitor_url = data.get('competitor_url')

    if not my_url or not competitor_url:
        return jsonify({"error": "Both URLs are required"}), 400

    try:
        my_response = requests.get(my_url, timeout=10)
        competitor_response = requests.get(competitor_url, timeout=10)

        my_soup = BeautifulSoup(my_response.text, 'html.parser')
        competitor_soup = BeautifulSoup(competitor_response.text, 'html.parser')

        my_text = my_soup.get_text()
        competitor_text = competitor_soup.get_text()

        prompt = f"قارن بين هذين النصين واستخرج: 1- الكلمات المفتاحية المشتركة. 2- الكلمات المفتاحية التي يستخدمها المنافس ولا أستخدمها.\n\nالنص الأول (موقعي):\n{my_text[:2000]}\n\nالنص الثاني (المنافس):\n{competitor_text[:2000]}"
        
        # استبدال هذا الاستدعاء بـ API Gemini الفعلي
        gemini_api_response = {
            "common_keywords": ["تحليل المواقع", "تسويق رقمي"],
            "competitor_exclusive_keywords": ["تحليل سيو المقالات", "أدوات SEO مجانية"]
        }

        return jsonify(gemini_api_response)

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to fetch one of the URLs: {e}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
