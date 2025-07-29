document.addEventListener('DOMContentLoaded', () => {
    const articleTextInput = document.getElementById('article-text');
    const analyzeArticleButton = document.getElementById('analyze-article-button');
    const articleErrorMessage = document.getElementById('article-error-message');
    const articleLoadingSpinner = document.getElementById('article-loading-spinner');
    const articleResultsDashboard = document.getElementById('article-results-dashboard');
    const analyzeAnotherArticleButton = document.getElementById('analyze-another-article-button');
    const rewriteArticleButton = document.getElementById('rewrite-article-button');
    const rewrittenArticleOutput = document.getElementById('rewritten-article-output');

    // Article results elements
    const articleStructureText = document.getElementById('article-structure-text');
    const keywordSuggestionsList = document.getElementById('keyword-suggestions-list');
    const contentHealthText = document.getElementById('content-health-text');
    const originalityAssessmentText = document.getElementById('originality-assessment-text');

    const themeToggle = document.getElementById('theme-toggle');
    const languageSelect = document.getElementById('language-select');

    let translations = {};
    let currentLanguage = localStorage.getItem('lang') || 'en';

    async function loadTranslations(lang) {
        try {
            const response = await fetch(`/locales/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load translations for ${lang}.`);
            }
            translations = await response.json();
            applyTranslations();
            localStorage.setItem('lang', lang);
        } catch (error) {
            console.error('Error loading translations:', error);
            if (lang !== 'en') {
                loadTranslations('en');
            }
        }
    }

    function applyTranslations() {
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            if (translations[key]) {
                element.textContent = translations[key];
            }
        });
        articleTextInput.placeholder = translations['pasteArticlePlaceholder'] || "Paste your article content here...";
        if (articleStructureText) articleStructureText.textContent = translations['loadingAiSuggestions'];
        if (keywordSuggestionsList) keywordSuggestionsList.innerHTML = `<li>${translations['loadingMessage']}</li>`;
        if (contentHealthText) contentHealthText.textContent = translations['loadingAiInsights'];
        if (originalityAssessmentText) originalityAssessmentText.textContent = translations['loadingAiInsights'];
        if (rewrittenArticleOutput && rewrittenArticleOutput.querySelector('p')) rewrittenArticleOutput.querySelector('p').textContent = translations['loadingArticleRewrites'];
    }

    const showElement = (element) => { if (element) element.classList.remove('hidden'); };
    const hideElement = (element) => { if (element) element.classList.add('hidden'); };

    const displayError = (message) => {
        if (articleErrorMessage) {
            articleErrorMessage.textContent = message;
            showElement(articleErrorMessage);
        }
        hideElement(articleLoadingSpinner);
        hideElement(articleResultsDashboard);
        console.error("Displaying error message:", message);
    };

    function displayArticleResults(results) {
        console.log("Displaying article analysis results:", results);
        showElement(articleResultsDashboard);
        hideElement(articleLoadingSpinner);

        if (articleStructureText) articleStructureText.textContent = results.structure_suggestions || translations['noSuggestionsAvailable'];
        
        if (keywordSuggestionsList) {
            keywordSuggestionsList.innerHTML = '';
            const keywords = results.keyword_suggestions || [];
            if (keywords.length > 0) {
                keywords.forEach(keyword => {
                    const li = document.createElement('li');
                    li.textContent = keyword;
                    keywordSuggestionsList.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.textContent = translations['noKeywordsFound'];
                keywordSuggestionsList.appendChild(li);
            }
        }

        if (contentHealthText) contentHealthText.textContent = results.content_health || translations['noAssessmentAvailable'];
        if (originalityAssessmentText) originalityAssessmentText.textContent = results.originality_assessment || translations['noAssessmentAvailable'];
    }

    analyzeArticleButton.addEventListener('click', async () => {
        const articleText = articleTextInput.value.trim();
        hideElement(articleErrorMessage);
        hideElement(articleResultsDashboard);
        showElement(articleLoadingSpinner);
        console.log("Analyze Article button clicked.");

        if (!articleText) {
            displayError(translations['pleaseEnterArticle'] || 'Please enter article content.');
            return;
        }

        try {
            const backendApiUrl = `/analyze_article_content`;
            console.log("Sending POST request to:", backendApiUrl);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 180000); // Longer timeout for AI analysis

            const response = await fetch(backendApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept-Language': currentLanguage
                },
                body: JSON.stringify({ article_text: articleText }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            console.log("Received response from backend. Status:", response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Backend response not OK. Raw text:", errorText);
                try {
                    const errorData = JSON.parse(errorText);
                    throw new Error(errorData.error || `${translations['serverError'] || 'Server error'}: ${response.status}`);
                } catch (jsonError) {
                    throw new Error(`${translations['serverReturnedNonJson'] || 'Server returned non-JSON error'} (Status: ${response.status}): ${errorText.substring(0, 100)}...`);
                }
            }

            const results = await response.json();
            console.log("Received article analysis results from backend:", results);

            displayArticleResults(results);

        } catch (error) {
            console.error('Article analysis failed:', error);
            if (error.name === 'AbortError') {
                displayError(translations['analysisTimedOut'] || 'Analysis timed out. The server took too long to respond. Please try again later.');
            } else if (error instanceof TypeError && error.message.includes('Network request failed')) {
                displayError(translations['networkError'] || 'Network error. Could not connect to the server. Please check your internet connection and try again.');
            } else {
                displayError(`${translations['articleAnalysisFailed'] || 'Article analysis failed'}: ${error.message}. ${translations['pleaseTryAgain'] || 'Please try again later.'}`);
            }
            hideElement(articleLoadingSpinner);
        }
    });

    rewriteArticleButton.addEventListener('click', async () => {
        const articleText = articleTextInput.value.trim();

        if (!articleText) {
            displayError(translations['pleaseEnterArticle'] || 'Please enter article content to rewrite.');
            return;
        }

        if (rewrittenArticleOutput) {
            showElement(rewrittenArticleOutput);
            rewrittenArticleOutput.innerHTML = `<p>${translations['loadingArticleRewrites']}</p>`;
        }
        if (rewriteArticleButton) rewriteArticleButton.disabled = true;

        try {
            const backendApiUrl = `/rewrite_article`;
            console.log("Sending POST request to:", backendApiUrl);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 240000); // Longer timeout for rewriting

            const response = await fetch(backendApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept-Language': currentLanguage
                },
                body: JSON.stringify({ article_text: articleText }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Article Rewrite Backend response not OK. Raw text:", errorText);
                try {
                    const errorData = JSON.parse(errorText);
                    throw new Error(errorData.error || `${translations['failedToRewriteArticle'] || 'Failed to rewrite article.'} (Status: ${response.status})`);
                } catch (jsonParseError) {
                    throw new Error(`${translations['aiFeatureLimited'] || 'AI features are limited or unavailable in the free version.'} (Error: ${errorText.substring(0, 100)}...)`);
                }
            }

            const rewrittenContent = await response.json();
            if (rewrittenContent.rewritten_text) {
                rewrittenArticleOutput.innerHTML = `<p><strong>${translations['rewrittenArticle'] || 'Rewritten Article:'}</strong></p><p>${rewrittenContent.rewritten_text}</p>`;
            } else {
                rewrittenArticleOutput.innerHTML = `<p>${translations['noRewrittenArticleAvailable'] || 'No rewritten article available.'}</p>`;
            }

        } catch (error) {
            console.error('Article rewriting failed:', error);
            if (rewrittenArticleOutput) rewrittenArticleOutput.innerHTML = `<p class="text-red-600">${error.message}</p>`;
        } finally {
            if (rewriteArticleButton) rewriteArticleButton.disabled = false;
        }
    });

    analyzeAnotherArticleButton.addEventListener('click', () => {
        hideElement(articleResultsDashboard);
        hideElement(articleErrorMessage);
        articleTextInput.value = '';
        showElement(document.getElementById('article-input-section'));
        if (rewrittenArticleOutput) {
            rewrittenArticleOutput.innerHTML = `<p>${translations['loadingArticleRewrites']}</p>`;
            hideElement(rewrittenArticleOutput);
        }
    });

    // Dark/Light theme toggle
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        if (document.body.classList.contains('dark')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    });

    // Load theme preference on page load
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
    }

    // Language selection change event
    languageSelect.addEventListener('change', (event) => {
        currentLanguage = event.target.value;
        loadTranslations(currentLanguage);
    });

    loadTranslations(currentLanguage);
    languageSelect.value = currentLanguage;
});
