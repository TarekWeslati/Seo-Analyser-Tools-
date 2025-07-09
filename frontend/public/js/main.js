document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded. Initializing Web Analyzer.');

    // === عناصر DOM الرئيسية ===
    const appTitle = document.getElementById('app-title');
    const navAppTitle = document.getElementById('nav-app-title');
    const analyzeAnyWebsiteText = document.getElementById('analyze-any-website-text');
    const websiteUrlInput = document.getElementById('website-url');
    const analyzeBtn = document.getElementById('analyze-btn');
    const loadingIndicator = document.getElementById('loading-indicator');
    const analyzingText = document.getElementById('analyzing-text');
    const resultsSection = document.getElementById('results-section');
    const analysisResultsForText = document.getElementById('analysis-results-for-text');
    const analyzedUrlDisplay = document.getElementById('analyzed-url-display');
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    const exportPdfText = document.getElementById('export-pdf-text');
    const errorMessageContainer = document.getElementById('error-message-container');

    // === عناصر عرض النتائج ===
    const seoScoreTitle = document.getElementById('seo-score-title');
    const seoScoreElem = document.getElementById('seo-score');
    const seoDescriptionElem = document.getElementById('seo-description');

    const speedScoreTitle = document.getElementById('speed-score-title');
    const speedScoreElem = document.getElementById('speed-score');
    const speedDescriptionElem = document.getElementById('speed-description');

    const uxScoreTitle = document.getElementById('ux-score-title');
    const uxScoreElem = document.getElementById('ux-score');
    const uxDescriptionElem = document.getElementById('ux-description');

    const domainAuthorityTitle = document.getElementById('domain-authority-title');
    const domainAuthorityElem = document.getElementById('domain-authority');
    const domainAuthorityDescElem = document.getElementById('domain-authority-desc');

    const securityScoreTitle = document.getElementById('security-score-title');
    const securityScoreElem = document.getElementById('security-score');
    const securityDescriptionElem = document.getElementById('security-description');

    const aiSummaryTitle = document.getElementById('ai-summary-title');
    const aiSummaryContentElem = document.getElementById('ai-summary-content');

    // === عناصر تبديل اللغة والثيم ===
    const langToggleBtn = document.getElementById('lang-toggle-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');

    // === متغيرات الحالة ===
    let currentLang = localStorage.getItem('appLang') || 'ar'; // Default language or from local storage
    let currentTheme = localStorage.getItem('appTheme') || 'light'; // Default theme or from local storage
    let translations = {}; // Translations will be loaded here

    // === Helper Functions ===

    // Load translations from the backend
    async function loadTranslations(lang) {
        console.log(`Loading translations for: ${lang}`);
        try {
            const response = await fetch(`/translations/${lang}`);
            if (!response.ok) {
                throw new Error('Failed to load translations');
            }
            translations = await response.json();
            applyTranslations();
        } catch (error) {
            console.error('Error loading translations:', error);
            // Fallback to default English translations in case of error
            translations = {
                "app_title": "Web Analyzer Pro",
                "analyze_any_website": "Analyze Any Website",
                "placeholder_url": "https://www.example.com",
                "analyze_button": "Analyze",
                "loading_text": "Analyzing...",
                "analysis_results_for": "Analysis Results for:",
                "seo_score_title": "SEO Score",
                "seo_description_placeholder": "",
                "speed_score_title": "Speed Score",
                "speed_description_placeholder": "",
                "ux_score_title": "User Experience (UX) Score",
                "ux_description_placeholder": "",
                "domain_authority_title": "Domain Authority & Site Trust",
                "security_score_title": "Security Score",
                "ai_summary_title": "AI Summary",
                "export_pdf_button": "Export PDF",
                "error_url_required": "Please enter a website URL.",
                "error_analysis_failed": "An error occurred during analysis. Please try again.",
                "failed_to_fetch_url": "Failed to fetch content from the provided URL. Please check the URL or try again later."
            };
            applyTranslations(); // Apply default in case of error
        }
    }

    // Apply translations to DOM elements
    function applyTranslations() {
        if (!translations.app_title) {
            console.warn('Translations not loaded yet, skipping applyTranslations.');
            return;
        }
        appTitle.textContent = translations.app_title;
        navAppTitle.textContent = translations.app_title;
        analyzeAnyWebsiteText.textContent = translations.analyze_any_website;
        websiteUrlInput.placeholder = translations.placeholder_url;
        analyzeBtn.textContent = translations.analyze_button;
        analyzingText.textContent = translations.loading_text;
        analysisResultsForText.innerHTML = `${translations.analysis_results_for} <span id="analyzed-url-display"></span>`;
        exportPdfText.textContent = translations.export_pdf_button;

        seoScoreTitle.textContent = translations.seo_score_title;
        speedScoreTitle.textContent = translations.speed_score_title;
        uxScoreTitle.textContent = translations.ux_score_title;
        domainAuthorityTitle.textContent = translations.domain_authority_title;
        securityScoreTitle.textContent = translations.security_score_title;
        aiSummaryTitle.textContent = translations.ai_summary_title;

        langToggleBtn.innerHTML = `<i class="fas fa-globe"></i> ${currentLang.toUpperCase() === 'AR' ? 'EN' : 'AR'}`;
        document.documentElement.setAttribute('lang', currentLang);
        document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
        console.log('Translations applied.');
    }

    // Apply theme (Dark/Light Mode)
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            document.body.classList.remove('dark-mode');
            themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
        }
        localStorage.setItem('appTheme', theme);
        console.log(`Theme set to: ${theme}`);
    }

    // Initialize the application on load
    async function initializeApp() {
        await loadTranslations(currentLang); // Load translations first
        applyTheme(currentTheme); // Apply theme
        // Ensure sections are hidden initially
        loadingIndicator.style.display = 'none';
        resultsSection.style.display = 'none';
        exportPdfBtn.style.display = 'none';
        console.log('App initialized.');
    }

    // Function to display error messages to the user
    function showErrorMessage(message) {
        // Clear previous messages
        errorMessageContainer.innerHTML = ''; 

        const errorMessageDiv = document.createElement('div');
        errorMessageDiv.className = 'alert alert-danger mt-3';
        errorMessageDiv.setAttribute('role', 'alert');
        errorMessageDiv.textContent = message;
        errorMessageContainer.appendChild(errorMessageDiv);

        setTimeout(() => {
            errorMessageDiv.remove(); // Remove message after 5 seconds
        }, 5000);
        console.error('Error displayed:', message);
    }

    // Function to generate AI Summary by calling the backend
    async function generateAISummary(analysisResults, targetLang) {
        aiSummaryContentElem.textContent = translations.loading_text; // Display loading text for summary
        console.log('Generating AI summary via backend...');

        try {
            const response = await fetch('/generate_ai_summary', { // Call new backend endpoint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    analysis_results: analysisResults,
                    target_lang: targetLang
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || translations.error_analysis_failed);
            }

            const data = await response.json();
            aiSummaryContentElem.textContent = data.summary || translations.error_analysis_failed;
            console.log('AI summary generated successfully from backend.');

        } catch (error) {
            aiSummaryContentElem.textContent = translations.error_analysis_failed;
            console.error("Error calling backend for AI summary:", error);
        }
    }


    // === Event Listeners ===

    // Analyze button
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', async () => {
            console.log('Analyze button clicked.');
            const url = websiteUrlInput.value.trim();

            // Clear previous error messages
            errorMessageContainer.innerHTML = '';

            if (!url) {
                showErrorMessage(translations.error_url_required);
                return;
            }

            // Show loading indicator and hide old results
            loadingIndicator.style.display = 'block';
            resultsSection.style.display = 'none';
            exportPdfBtn.style.display = 'none';
            analyzedUrlDisplay.textContent = ''; // Clear previous URL
            aiSummaryContentElem.textContent = ''; // Clear previous AI summary

            // Clear previous results content
            seoScoreElem.textContent = 'N/A';
            seoDescriptionElem.textContent = '';
            speedScoreElem.textContent = 'N/A';
            speedDescriptionElem.textContent = '';
            uxScoreElem.textContent = 'N/A';
            uxDescriptionElem.textContent = '';
            domainAuthorityElem.textContent = 'N/A';
            domainAuthorityDescElem.textContent = '';
            securityScoreElem.textContent = 'N/A';
            securityDescriptionElem.textContent = '';


            try {
                console.log('Sending analysis request to backend...');
                const response = await fetch('/analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ url: url })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.details || translations.error_analysis_failed);
                }

                const data = await response.json(); // Receive analysis data as JSON
                console.log('Analysis data received:', data);

                // Update UI with received results
                analyzedUrlDisplay.textContent = url;
                seoScoreElem.textContent = data.seo_score || 'N/A';
                seoDescriptionElem.textContent = data.seo_description || '';
                speedScoreElem.textContent = data.speed_score || 'N/A';
                speedDescriptionElem.textContent = data.speed_description || '';
                uxScoreElem.textContent = data.ux_score || 'N/A';
                uxDescriptionElem.textContent = data.ux_description || '';
                domainAuthorityElem.textContent = data.domain_authority || 'N/A';
                domainAuthorityDescElem.textContent = data.domain_authority_desc || '';
                securityScoreElem.textContent = data.security_score || 'N/A';
                securityDescriptionElem.textContent = data.security_description || '';
                
                resultsSection.style.display = 'block'; // Show results section
                exportPdfBtn.style.display = 'block'; // Show PDF export button

                // Call backend function to generate AI summary
                generateAISummary(data, currentLang);


            } catch (error) {
                console.error('Error during analysis fetch:', error);
                showErrorMessage(error.message || translations.error_analysis_failed);
            } finally {
                loadingIndicator.style.display = 'none'; // Hide loading indicator
                console.log('Analysis process finished.');
            }
        });
    } else {
        console.error('Analyze button not found! Check ID in index.html.');
    }


    // Language toggle button
    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', () => {
            console.log('Language toggle button clicked.');
            currentLang = currentLang === 'ar' ? 'en' : 'ar';
            localStorage.setItem('appLang', currentLang); // Save language to local storage
            loadTranslations(currentLang); // Reload and apply translations
        });
    } else {
        console.error('Language toggle button not found! Check ID in index.html.');
    }

    // Theme toggle button
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            console.log('Theme toggle button clicked.');
            currentTheme = currentTheme === 'light' ? 'dark' : 'light';
            applyTheme(currentTheme);
        });
    } else {
        console.error('Theme toggle button not found! Check ID in index.html.');
    }

    // === Initialize App on startup ===
    initializeApp();
});
