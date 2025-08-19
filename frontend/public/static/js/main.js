// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    // --- Variables and Elements ---
    const articleTextarea = document.getElementById('articleText');
    const analyzeArticleButton = document.getElementById('analyzeArticleButton');
    const articleRewriteButton = document.getElementById('articleRewriteButton');
    const analysisOutput = document.getElementById('analysis-output');
    const analyzeWebsiteButton = document.getElementById('analyzeWebsiteButton');
    const analyzeCompetitorButton = document.getElementById('analyzeCompetitorButton');
    const websiteUrlInput = document.getElementById('websiteUrl');
    const websiteAnalysisOutput = document.getElementById('website-analysis-output');

    // --- Language and Theme Variables ---
    const languageSelector = document.getElementById('languageSelector');
    const themeToggle = document.getElementById('themeToggle');
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');
    let translations = {};

    // Function to fetch translations and update content
    const fetchTranslations = async (lang) => {
        try {
            const response = await fetch(`/static/locales/${lang}.json`);
            if (!response.ok) throw new Error('Translations file not found.');
            translations = await response.json();
            document.querySelectorAll('[data-translate]').forEach(element => {
                const key = element.getAttribute('data-translate');
                if (translations[key]) {
                    element.textContent = translations[key];
                }
            });
            // Update placeholders if they exist
            document.querySelectorAll('[data-translate][placeholder]').forEach(element => {
                const key = element.getAttribute('data-translate');
                if (translations[`${key}Placeholder`]) {
                    element.placeholder = translations[`${key}Placeholder`];
                }
            });
            document.documentElement.lang = lang;
            document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        } catch (error) {
            console.error("Error loading translations:", error);
        }
    };

    // Load initial language from localStorage
    const initialLang = localStorage.getItem('lang') || 'ar';
    languageSelector.value = initialLang;
    fetchTranslations(initialLang);

    // --- Event Listeners ---

    // Language selector
    languageSelector.addEventListener('change', (e) => {
        const selectedLang = e.target.value;
        localStorage.setItem('lang', selectedLang);
        fetchTranslations(selectedLang);
    });

    // Dark Mode Toggle
    themeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        sunIcon.classList.toggle('hidden', !isDark);
        moonIcon.classList.toggle('hidden', isDark);
    });
    // Set initial theme
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    }

    // --- Analysis Functions ---

    // Generic fetch and display function
    const fetchAndDisplay = async (url, data, outputElement, placeholderText, displayFunction) => {
        outputElement.innerHTML = `<p class="text-blue-500 animate-pulse">${placeholderText}</p>`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();

            if (response.ok) {
                if (result.analysis_report || result.keywords_report || result.comparison_report || result.rewritten_text) {
                    // Call the specific display function based on the data type
                    displayFunction(result, outputElement);
                } else {
                    outputElement.innerHTML = `<p class="text-red-500">Error: ${result.error || 'Failed to get a valid report from the server.'}</p>`;
                }
            } else {
                outputElement.innerHTML = `<p class="text-red-500">Error: ${result.error || response.statusText}</p>`;
            }
        } catch (error) {
            console.error('Fetch error:', error);
            outputElement.innerHTML = `<p class="text-red-500">${translations.fetchDataError || 'An error occurred while fetching data. Please try again later.'}</p>`;
        }
    };

    // Display function for Website Keyword Analysis
    const displayWebsiteKeywords = (data, outputElement) => {
        const report = data.keywords_report;
        if (!report || !report.keywords || !report.long_tail_keywords) {
            outputElement.innerHTML = `<p class="text-red-500">${translations.invalidReportFormat || 'Invalid report format received from the server.'}</p>`;
            return;
        }
        let outputHtml = `<div class="space-y-4">
            <div>
                <h4 class="text-lg font-bold text-gray-800 dark:text-gray-200">${translations.keywords}</h4>
                <p class="text-gray-600 dark:text-gray-400">${report.keywords.join(', ')}</p>
            </div>
            <div>
                <h4 class="text-lg font-bold text-gray-800 dark:text-gray-200">${translations.longTailKeywords}</h4>
                <p class="text-gray-600 dark:text-gray-400">${report.long_tail_keywords.join(', ')}</p>
            </div>
        </div>`;
        outputElement.innerHTML = outputHtml;
    };

    // Display function for Article Analysis
    const displayArticleAnalysis = (data, outputElement) => {
        const report = data.analysis_report;
        if (!report || !report.main_idea) {
            outputElement.innerHTML = `<p class="text-red-500">${translations.invalidReportFormat || 'Invalid report format received from the server.'}</p>`;
            return;
        }
        let outputHtml = `<div class="space-y-4">
            <div>
                <h4 class="text-lg font-bold text-gray-800 dark:text-gray-200">${translations.mainIdea}</h4>
                <p class="text-gray-600 dark:text-gray-400">${report.main_idea}</p>
            </div>
            <div>
                <h4 class="text-lg font-bold text-gray-800 dark:text-gray-200">${translations.keywords}</h4>
                <p class="text-gray-600 dark:text-gray-400">${report.keywords.join(', ')}</p>
            </div>
            <div>
                <h4 class="text-lg font-bold text-gray-800 dark:text-gray-200">${translations.readabilityScore}</h4>
                <p class="text-gray-600 dark:text-gray-400">${report.readability_score} / 10</p>
            </div>
            <div>
                <h4 class="text-lg font-bold text-gray-800 dark:text-gray-200">${translations.readabilityRecommendations}</h4>
                <p class="text-gray-600 dark:text-gray-400">${report.readability_recommendations}</p>
            </div>
            <div>
                <h4 class="text-lg font-bold text-gray-800 dark:text-gray-200">${translations.contentGaps}</h4>
                <p class="text-gray-600 dark:text-gray-400">${report.content_gaps.join(', ')}</p>
            </div>
            <div>
                <h4 class="text-lg font-bold text-gray-800 dark:text-gray-200">${translations.userIntent}</h4>
                <p class="text-gray-600 dark:text-gray-400">${report.user_intent}</p>
            </div>
        </div>`;
        outputElement.innerHTML = outputHtml;
    };

    // Display function for Competitor Analysis
    const displayCompetitorAnalysis = (data, outputElement) => {
        const report = data.comparison_report;
        if (!report || !report.common_keywords) {
            outputElement.innerHTML = `<p class="text-red-500">${translations.invalidReportFormat || 'Invalid report format received from the server.'}</p>`;
            return;
        }
        let outputHtml = `<div class="space-y-4">
            <div>
                <h4 class="text-lg font-bold text-gray-800 dark:text-gray-200">${translations.commonKeywords}</h4>
                <p class="text-gray-600 dark:text-gray-400">${report.common_keywords.join(', ')}</p>
            </div>
            <div>
                <h4 class="text-lg font-bold text-gray-800 dark:text-gray-200">${translations.competitorExclusiveKeywords}</h4>
                <p class="text-gray-600 dark:text-gray-400">${report.competitor_exclusive_keywords.join(', ')}</p>
            </div>
        </div>`;
        outputElement.innerHTML = outputHtml;
    };

    // Display function for Article Rewrite
    const displayRewrittenArticle = (data, outputElement) => {
        const text = data.rewritten_text;
        if (!text) {
            outputElement.innerHTML = `<p class="text-red-500">${translations.invalidReportFormat || 'Invalid report format received from the server.'}</p>`;
            return;
        }
        outputElement.innerHTML = `<p class="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">${text}</p>`;
    };
    
    // --- Event Listener Assignments ---

    if (analyzeArticleButton) {
        analyzeArticleButton.addEventListener('click', () => {
            const articleContent = articleTextarea.value;
            if (!articleContent) {
                analysisOutput.innerHTML = `<p class="text-red-500">${translations.enterArticleContent || 'Enter article content first.'}</p>`;
                return;
            }
            fetchAndDisplay('/api/analyze-article', { content: articleContent }, analysisOutput, translations.analyzingArticle || 'Analyzing article...', displayArticleAnalysis);
        });
    }

    if (articleRewriteButton) {
        articleRewriteButton.addEventListener('click', () => {
            const articleContent = articleTextarea.value;
            if (!articleContent) {
                analysisOutput.innerHTML = `<p class="text-red-500">${translations.enterArticleContent || 'Enter article content first.'}</p>`;
                return;
            }
            fetchAndDisplay('/api/rewrite', { text: articleContent }, analysisOutput, translations.rewritingArticle || 'Rewriting article...', displayRewrittenArticle);
        });
    }
    
    if (analyzeWebsiteButton) {
        analyzeWebsiteButton.addEventListener('click', () => {
            const url = websiteUrlInput.value;
            if (!url) {
                websiteAnalysisOutput.innerHTML = `<p class="text-red-500">${translations.enterYourWebsiteURLFirst || 'Enter your website URL first.'}</p>`;
                return;
            }
            fetchAndDisplay('/api/get_website_keywords', { url }, websiteAnalysisOutput, translations.analyzingWebsite || 'Analyzing website...', displayWebsiteKeywords);
        });
    }

    if (analyzeCompetitorButton) {
        analyzeCompetitorButton.addEventListener('click', async () => {
            const my_url = websiteUrlInput.value;
            if (!my_url) {
                websiteAnalysisOutput.innerHTML = `<p class="text-red-500">${translations.enterYourWebsiteURLFirst || 'Enter your website URL first.'}</p>`;
                return;
            }
            const competitor_url = prompt(translations.enterCompetitorURLPrompt || 'Enter competitor URL:');
            if (!competitor_url) return;
            fetchAndDisplay('/api/analyze_competitors', { my_url, competitor_url }, websiteAnalysisOutput, translations.analyzingCompetitors || 'Analyzing competitors...', displayCompetitorAnalysis);
        });
    }
});
