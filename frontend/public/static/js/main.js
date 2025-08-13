// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    // Dynamically get the backend base URL from the current window's origin
    const backendBaseUrl = window.location.origin;

    // ---
    // 1. المتغيرات والعناصر الخاصة بتحليل المقالات (من الكود الأصلي)
    // ---
    const articleTextarea = document.getElementById('articleText');
    const analyzeArticleButton = document.getElementById('analyzeArticleButton');
    const articleRewriteButton = document.getElementById('articleRewriteButton');
    const analysisOutput = document.getElementById('analysis-output');

    // ---
    // 2. المتغيرات والعناصر الخاصة بتحليل المواقع (جديد)
    // ---
    const analyzeWebsiteButton = document.getElementById('analyzeWebsiteButton');
    const analyzeCompetitorButton = document.getElementById('analyzeCompetitorButton');
    const websiteUrlInput = document.getElementById('websiteUrl');
    const websiteAnalysisOutput = document.getElementById('website-analysis-output');
    
    // ---
    // 3. المستمعات للأحداث (Event Listeners)
    // ---

    // المستمع لزر تحليل المقال
    analyzeArticleButton.addEventListener('click', async () => {
        const articleContent = articleTextarea.value;
        if (!articleContent) {
            analysisOutput.innerHTML = `<p class="text-red-500">Please enter article content.</p>`;
            return;
        }

        analysisOutput.innerHTML = `<p class="text-blue-500">Analyzing article... Please wait.</p>`;

        try {
            const response = await fetch('/api/analyze-article', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: articleContent })
            });

            const data = await response.json();

            if (response.ok) {
                let outputHtml = `<h4 class="text-lg font-medium mb-2">Article Analysis Results</h4>`;
                
                outputHtml += `<p><strong>Keywords:</strong> ${data.keywords.join(', ')}</p>`;
                
                outputHtml += `<p class="mt-2"><strong>Readability Score:</strong> ${data.readability_score}</p>`;
                outputHtml += `<p><strong>Recommendations:</strong> ${data.readability_recommendations}</p>`;
                
                outputHtml += `<p class="mt-2"><strong>User Intent:</strong> ${data.user_intent}</p>`;
                
                outputHtml += `<p class="mt-2"><strong>Content Gaps:</strong> ${data.content_gaps.join(', ')}</p>`;
                
                analysisOutput.innerHTML = outputHtml;
            } else {
                analysisOutput.innerHTML = `<p class="text-red-500">Error: ${data.error}</p>`;
            }
        } catch (error) {
            console.error('Error:', error);
            analysisOutput.innerHTML = `<p class="text-red-500">An error occurred while fetching data.</p>`;
        }
    });

    // المستمع لزر إعادة كتابة المقال (من الكود الأصلي)
    articleRewriteButton.addEventListener('click', async () => {
        // هنا يمكنك إضافة منطق إعادة الكتابة
        // ... (كودك الأصلي هنا)
        analysisOutput.innerHTML = `<p class="text-orange-500">Rewriting feature is under development.</p>`;
    });

    // المستمع لزر تحليل الموقع
    analyzeWebsiteButton.addEventListener('click', async () => {
        const url = websiteUrlInput.value;
        if (!url) {
            websiteAnalysisOutput.innerHTML = `<p class="text-red-500">Please enter a valid URL.</p>`;
            return;
        }

        websiteAnalysisOutput.innerHTML = `<p class="text-blue-500">Analyzing website... Please wait.</p>`;

        try {
            const response = await fetch('/api/get_website_keywords', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: url })
            });
            
            const data = await response.json();

            if (response.ok) {
                let outputHtml = `<h4 class="text-lg font-medium mb-2">Website Keywords Analysis</h4>`;
                outputHtml += `<p><strong>Keywords:</strong> ${data.keywords.join(', ')}</p>`;
                outputHtml += `<p><strong>Long-tail Keywords:</strong> ${data.long_tail_keywords.join(', ')}</p>`;
                websiteAnalysisOutput.innerHTML = outputHtml;
            } else {
                websiteAnalysisOutput.innerHTML = `<p class="text-red-500">Error: ${data.error}</p>`;
            }
        } catch (error) {
            console.error('Error:', error);
            websiteAnalysisOutput.innerHTML = `<p class="text-red-500">An error occurred while fetching data.</p>`;
        }
    });

    // المستمع لزر تحليل المنافس (الآن يتم تفعيله بالكامل)
    analyzeCompetitorButton.addEventListener('click', async () => {
        const my_url = websiteUrlInput.value;
        if (!my_url) {
            websiteAnalysisOutput.innerHTML = `<p class="text-red-500">Please enter your website's URL first.</p>`;
            return;
        }

        const competitor_url = prompt("Please enter the competitor's URL:");
        if (!competitor_url) {
            return; // المستخدم ألغى العملية
        }

        websiteAnalysisOutput.innerHTML = `<p class="text-blue-500">Analyzing competitors... Please wait.</p>`;

        try {
            const response = await fetch('/api/analyze_competitors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ my_url: my_url, competitor_url: competitor_url })
            });

            const data = await response.json();

            if (response.ok) {
                let outputHtml = `<h4 class="text-lg font-medium mb-2">Competitor Analysis Results</h4>`;
                outputHtml += `<p><strong>Common Keywords:</strong> ${data.common_keywords.join(', ')}</p>`;
                outputHtml += `<p class="mt-2"><strong>Competitor Exclusive Keywords:</strong> ${data.competitor_exclusive_keywords.join(', ')}</p>`;
                websiteAnalysisOutput.innerHTML = outputHtml;
            } else {
                websiteAnalysisOutput.innerHTML = `<p class="text-red-500">Error: ${data.error}</p>`;
            }
        } catch (error) {
            console.error('Error:', error);
            websiteAnalysisOutput.innerHTML = `<p class="text-red-500">An error occurred while fetching data.</p>`;
        }
    });

    // ---
    // 4. وظائف أخرى (من الكود الأصلي)
    // ---
    // ... (هنا يتم إضافة أي كود آخر موجود في ملف main.js الأصلي، مثل وظائف الـ dark mode والـ authentication إذا كانت موجودة)
    // ...
});
