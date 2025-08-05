document.addEventListener('DOMContentLoaded', () => {
    const websiteAnalysisForm = document.getElementById('websiteAnalysisForm');
    const analyzeButton = document.getElementById('analyzeButton');
    const websiteAnalysisResults = document.getElementById('websiteAnalysisResults');
    const websiteAnalysisError = document.getElementById('websiteAnalysisError');
    const websiteAnalysisLoading = document.getElementById('websiteAnalysisLoading');

    const articleAnalysisForm = document.getElementById('articleAnalysisForm');
    const analyzeArticleButton = document.getElementById('analyzeArticleButton');
    const articleAnalysisResults = document.getElementById('articleAnalysisResults');
    const articleAnalysisError = document.getElementById('articleAnalysisError');
    const articleAnalysisLoading = document.getElementById('articleAnalysisLoading');

    // Function to show loading state
    const showLoading = (element, message) => {
        if (element) {
            element.innerHTML = `<div class="flex items-center justify-center space-x-2">
                                    <svg class="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>${message}</span>
                                </div>`;
            element.classList.remove('hidden');
        }
    };

    // Function to hide loading state
    const hideLoading = (element) => {
        if (element) {
            element.classList.add('hidden');
            element.innerHTML = '';
        }
    };

    // Function to show error message
    const showError = (element, message) => {
        if (element) {
            element.innerHTML = `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                                    <strong class="font-bold">خطأ!</strong>
                                    <span class="block sm:inline">${message}</span>
                                </div>`;
            element.classList.remove('hidden');
        }
    };

    // Function to hide error message
    const hideError = (element) => {
        if (element) {
            element.classList.add('hidden');
            element.innerHTML = '';
        }
    };

    // Website Analysis Form Submission
    if (websiteAnalysisForm) {
        websiteAnalysisForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = document.getElementById('websiteUrl').value;

            hideError(websiteAnalysisError);
            hideLoading(websiteAnalysisLoading);
            websiteAnalysisResults.innerHTML = ''; // Clear previous results

            if (!url) {
                showError(websiteAnalysisError, 'الرجاء إدخال رابط الموقع.');
                return;
            }

            analyzeButton.disabled = true;
            showLoading(websiteAnalysisLoading, 'جاري تحليل الموقع، قد يستغرق هذا بعض الوقت...');

            try {
                const response = await fetch('/analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept-Language': 'ar', // Or dynamically get from user settings
                        'Authorization': `Bearer ${localStorage.getItem('idToken')}`
                    },
                    body: JSON.stringify({ url })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'فشل تحليل الموقع. يرجى المحاولة لاحقاً.');
                }

                const data = await response.json();
                displayWebsiteAnalysisResults(data);

            } catch (error) {
                console.error('Error during website analysis:', error);
                showError(websiteAnalysisError, `خطأ في تحليل الموقع: ${error.message}. يرجى المحاولة مرة أخرى لاحقاً.`);
            } finally {
                analyzeButton.disabled = false;
                hideLoading(websiteAnalysisLoading);
            }
        });
    }

    // Function to display website analysis results (basic structure)
    function displayWebsiteAnalysisResults(data) {
        let html = '<div class="space-y-4">';

        if (data.title) {
            html += `<p class="text-lg font-semibold">العنوان: <span class="font-normal">${data.title}</span></p>`;
        }
        if (data.description) {
            html += `<p class="text-lg font-semibold">الوصف: <span class="font-normal">${data.description}</span></p>`;
        }
        if (data.keywords && data.keywords.length > 0) {
            html += `<p class="text-lg font-semibold">الكلمات المفتاحية: <span class="font-normal">${data.keywords.join(', ')}</span></p>`;
        }
        if (data.headings && Object.keys(data.headings).length > 0) {
            html += `<div><h3 class="text-xl font-bold mb-2">العناوين:</h3><ul class="list-disc list-inside space-y-1">`;
            for (const tag in data.headings) {
                html += `<li><strong>${tag.toUpperCase()}:</strong> ${data.headings[tag].join('; ')}</li>`;
            }
            html += `</ul></div>`;
        }
        if (data.broken_links && data.broken_links.length > 0) {
            html += `<div><h3 class="text-xl font-bold mb-2">الروابط المعطلة:</h3><ul class="list-disc list-inside space-y-1">`;
            data.broken_links.forEach(link => {
                html += `<li>${link}</li>`;
            });
            html += `</ul></div>`;
        }
        if (data.ai_broken_link_suggestions && data.ai_broken_link_suggestions.length > 0) {
            html += `<div><h3 class="text-xl font-bold mb-2">اقتراحات الروابط المعطلة (AI):</h3><ul class="list-disc list-inside space-y-1">`;
            data.ai_broken_link_suggestions.forEach(suggestion => {
                html += `<li>${suggestion}</li>`;
            });
            html += `</ul></div>`;
        }
        if (data.ai_seo_rewrite_suggestions) {
            html += `<div><h3 class="text-xl font-bold mb-2">اقتراحات إعادة صياغة SEO (AI):</h3><div class="space-y-2">`;
            for (const key in data.ai_seo_rewrite_suggestions) {
                html += `<p><strong>${key}:</strong> ${data.ai_seo_rewrite_suggestions[key]}</p>`;
            }
            html += `</div></div>`;
        }
        if (data.ai_content_refinement) {
            html += `<div><h3 class="text-xl font-bold mb-2">تحسين المحتوى (AI):</h3><p>${data.ai_content_refinement}</p></div>`;
        }

        html += '</div>';
        websiteAnalysisResults.innerHTML = html;
    }


    // Article Analysis Form Submission
    if (articleAnalysisForm) {
        articleAnalysisForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const articleText = document.getElementById('articleText').value;

            hideError(articleAnalysisError);
            hideLoading(articleAnalysisLoading);
            articleAnalysisResults.innerHTML = ''; // Clear previous results

            if (!articleText) {
                showError(articleAnalysisError, 'الرجاء إدخال نص المقال لتحليله.');
                return;
            }

            analyzeArticleButton.disabled = true;
            showLoading(articleAnalysisLoading, 'جاري تحليل المقال، قد يستغرق هذا بعض الوقت...');

            try {
                const response = await fetch('/analyze_article_content', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept-Language': 'ar',
                        'Authorization': `Bearer ${localStorage.getItem('idToken')}`
                    },
                    body: JSON.stringify({ article_text: articleText })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'فشل تحليل المقال. يرجى المحاولة لاحقاً.');
                }

                const data = await response.json();
                displayArticleAnalysisResults(data);

            } catch (error) {
                console.error('Error during article analysis:', error);
                showError(articleAnalysisError, `خطأ في تحليل المقال: ${error.message}. يرجى المحاولة مرة أخرى لاحقاً.`);
            } finally {
                analyzeArticleButton.disabled = false;
                hideLoading(articleAnalysisLoading);
            }
        });
    }

    // Function to display article analysis results (improved structure)
    function displayArticleAnalysisResults(data) {
        let html = '<div class="space-y-4">';

        if (data.word_count) {
            html += `<p class="text-lg font-semibold">عدد الكلمات: <span class="font-normal">${data.word_count}</span></p>`;
        }
        if (data.readability_score) {
            html += `<p class="text-lg font-semibold">درجة المقروئية: <span class="font-normal">${data.readability_score}</span></p>`;
        }
        if (data.keywords && data.keywords.length > 0) {
            html += `<div><h3 class="text-xl font-bold mb-2">الكلمات المفتاحية المستخرجة:</h3><ul class="list-disc list-inside space-y-1">`;
            data.keywords.forEach(keyword => {
                html += `<li>${keyword}</li>`;
            });
            html += `</ul></div>`;
        }
        if (data.sentiment) {
            html += `<p class="text-lg font-semibold">المشاعر: <span class="font-normal">${data.sentiment}</span></p>`;
        }
        if (data.summary) {
            html += `<div><h3 class="text-xl font-bold mb-2">الملخص:</h3><p>${data.summary}</p></div>`;
        }
        if (data.readability_suggestions && data.readability_suggestions.length > 0) {
            html += `<div><h3 class="text-xl font-bold mb-2">اقتراحات المقروئية:</h3><ul class="list-disc list-inside space-y-1">`;
            data.readability_suggestions.forEach(suggestion => {
                html += `<li>${suggestion}</li>`;
            });
            html += `</ul></div>`;
        }
        if (data.seo_suggestions && data.seo_suggestions.length > 0) {
            html += `<div><h3 class="text-xl font-bold mb-2">اقتراحات SEO:</h3><ul class="list-disc list-inside space-y-1">`;
            data.seo_suggestions.forEach(suggestion => {
                html += `<li>${suggestion}</li>`;
            });
            html += `</ul></div>`;
        }
        if (data.rewritten_content) {
            html += `<div><h3 class="text-xl font-bold mb-2">المحتوى المعاد صياغته:</h3><p>${data.rewritten_content}</p></div>`;
        }

        html += '</div>';
        articleAnalysisResults.innerHTML = html;
    }
});
