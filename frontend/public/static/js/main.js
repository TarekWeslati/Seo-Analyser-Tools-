document.addEventListener('DOMContentLoaded', () => {
    const websiteUrlInput = document.getElementById('website-url');
    const analyzeButton = document.getElementById('analyze-button');
    const errorMessage = document.getElementById('error-message');
    const loadingSpinner = document.getElementById('loading-spinner');
    const resultsDashboard = document.getElementById('results-dashboard');
    const analyzedUrlSpan = document.getElementById('analyzed-url');
    const analyzeAnotherButton = document.getElementById('analyze-another-button');
    const exportPdfButton = document.getElementById('export-pdf-button');
    const themeToggle = document.getElementById('theme-toggle');
    const languageSelect = document.getElementById('language-select');

    // New AI feature elements
    const rewriteSeoButton = document.getElementById('rewrite-seo-button');
    const rewriteSeoOutput = document.getElementById('rewrite-seo-output');
    const refineContentButton = document.getElementById('refine-content-button');
    const refineContentOutput = document.getElementById('refine-content-output');


    // Dashboard elements (as they are)
    const domainNameSpan = document.getElementById('domain-name');
    const domainAuthorityScoreSpan = document.getElementById('domain-authority-score');
    const domainAuthorityProgress = document.getElementById('domain-authority-progress');
    const domainAuthorityText = document.getElementById('domain-authority-text');
    const domainAgeSpan = document.getElementById('domain-age');
    const sslStatusSpan = document.getElementById('ssl-status');
    const blacklistStatusSpan = document.getElementById('blacklist-status');
    const dnsHealthSpan = document.getElementById('dns-health');

    const performanceScoreSpan = document.getElementById('performance-score');
    const performanceProgress = document.getElementById('performance-progress');
    const performanceText = document.getElementById('performance-text');
    const coreWebVitalsList = document.getElementById('core-web-vitals');
    const performanceIssuesList = document.getElementById('performance-issues');
    const pagespeedLink = document.getElementById('pagespeed-link');

    const seoOverallScoreSpan = document.getElementById('seo-overall-score');
    const seoOverallProgress = document.getElementById('seo-overall-progress');
    const seoOverallText = document.getElementById('seo-overall-text');
    const seoTitleSpan = document.getElementById('seo-title');
    const seoMetaDescriptionSpan = document.getElementById('seo-meta-description');
    const seoBrokenLinksSpan = document.getElementById('seo-broken-links');
    const seoMissingAltSpan = document.getElementById('seo-missing-alt');
    const seoInternalLinksSpan = document.getElementById('seo-internal-links');
    const seoExternalLinksSpan = document.getElementById('seo-external-links');
    const hTagsList = document.getElementById('h-tags-list');
    const keywordDensityList = document.getElementById('keyword-density-list');
    const seoImprovementTipsList = document.getElementById('seo-improvement-tips');
    const aiSeoSuggestionsSection = document.getElementById('ai-seo-suggestions-section');
    const aiSeoSuggestionsText = document.getElementById('ai-seo-suggestions-text');

    const uxIssuesList = document.getElementById('ux-issues-list');
    const uxSuggestionsList = document.getElementById('ux-suggestions-list');
    const aiContentInsightsSection = document.getElementById('ai-content-insights-section');
    const aiContentInsightsText = document.getElementById('ai-content-insights-text');

    const aiSummarySection = document.getElementById('ai-summary-section');
    const aiSummaryText = document.getElementById('ai-summary-text');

    let translations = {}; // Stores loaded translations
    let currentLanguage = localStorage.getItem('lang') || 'en'; // Get saved language or default to English

    // Function to fetch and load translations
    async function loadTranslations(lang) {
        try {
            const response = await fetch(`/locales/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load translations for ${lang}.`);
            }
            translations = await response.json();
            applyTranslations();
            localStorage.setItem('lang', lang); // Save selected language
        } catch (error) {
            console.error('Error loading translations:', error);
            // Fallback to default language if loading fails
            if (lang !== 'en') {
                loadTranslations('en');
            }
        }
    }

    // Function to apply translations to elements with data-translate attribute
    function applyTranslations() {
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            if (translations[key]) {
                element.textContent = translations[key];
            }
        });
        // Special handling for placeholder
        websiteUrlInput.placeholder = translations['analyzeWebsitePlaceholder'] || "https://www.google.com";
        // Update text for N/A or loading messages if they are not dynamically set by results
        document.getElementById('domain-authority-text').textContent = translations['calculatingMessage'];
        document.getElementById('performance-text').textContent = translations['calculatingMessage'];
        document.getElementById('seo-overall-text').textContent = translations['calculatingMessage'];
        
        // Update specific list items if they are showing default loading messages
        if (coreWebVitalsList.children.length === 1 && coreWebVitalsList.children[0].getAttribute('data-translate') === 'loadingMessage') {
            coreWebVitalsList.children[0].textContent = translations['loadingMessage'];
        }
        if (performanceIssuesList.children.length === 1 && performanceIssuesList.children[0].getAttribute('data-translate') === 'loadingMessage') {
            performanceIssuesList.children[0].textContent = translations['loadingMessage'];
        }
        if (hTagsList.children.length === 1 && hTagsList.children[0].getAttribute('data-translate') === 'loadingMessage') {
            hTagsList.children[0].textContent = translations['loadingMessage'];
        }
        if (keywordDensityList.children.length === 1 && keywordDensityList.children[0].getAttribute('data-translate') === 'loadingMessage') {
            keywordDensityList.children[0].textContent = translations['loadingMessage'];
        }
        if (seoImprovementTipsList.children.length === 1 && seoImprovementTipsList.children[0].getAttribute('data-translate') === 'loadingMessage') {
            seoImprovementTipsList.children[0].textContent = translations['loadingMessage'];
        }
        if (uxIssuesList.children.length === 1 && uxIssuesList.children[0].getAttribute('data-translate') === 'loadingMessage') {
            uxIssuesList.children[0].textContent = translations['loadingMessage'];
        }
        if (uxSuggestionsList.children.length === 1 && uxSuggestionsList.children[0].getAttribute('data-translate') === 'loadingMessage') {
            uxSuggestionsList.children[0].textContent = translations['loadingMessage'];
        }
        aiSeoSuggestionsText.textContent = translations['loadingAiSuggestions'];
        aiContentInsightsText.textContent = translations['loadingAiInsights'];
        aiSummaryText.textContent = translations['loadingAiSummary'];
        rewriteSeoOutput.querySelector('p').textContent = translations['loadingAiRewrites'];
        refineContentOutput.querySelector('p').textContent = translations['loadingAiRefinement'];


        // Update N/A messages if they are currently set to N/A
        // These will be overwritten by actual results if available
        const naElements = [
            domainNameSpan, domainAuthorityScoreSpan, domainAgeSpan, sslStatusSpan,
            blacklistStatusSpan, dnsHealthSpan, performanceScoreSpan, seoOverallScoreSpan,
            seoTitleSpan, seoMetaDescriptionSpan, seoBrokenLinksSpan, seoMissingAltSpan,
            seoInternalLinksSpan, seoExternalLinksSpan
        ];
        naElements.forEach(el => {
            if (el.textContent === 'N/A') {
                el.textContent = 'N/A';
            }
        });
    }


    // Helper functions to show/hide elements
    const showElement = (element) => element.classList.remove('hidden');
    const hideElement = (element) => element.classList.add('hidden');

    // Function to update progress bar width and color
    const updateProgressBar = (progressBarElement, score) => {
        let width = 0;
        let colorClass = 'progress-bad'; 

        if (score !== null && !isNaN(score)) {
            width = Math.max(0, Math.min(100, score)); 
            if (score >= 80) {
                colorClass = 'progress-good';
            } else if (score >= 50) {
                colorClass = 'progress-medium';
            } else {
                colorClass = 'progress-bad';
            }
        }

        progressBarElement.style.width = `${width}%`;
        progressBarElement.className = `progress-bar ${colorClass}`;
    };

    // Function to display an error message
    const displayError = (message) => {
        errorMessage.textContent = message;
        showElement(errorMessage);
        hideElement(loadingSpinner);
        hideElement(resultsDashboard); 
        console.error("Displaying error message:", message); 
    };

    // Function to display results on the dashboard
    function displayResults(url, results) {
        console.log("Displaying results on dashboard:", results); 
        if (analyzedUrlSpan) analyzedUrlSpan.textContent = url;
        showElement(resultsDashboard); 
        hideElement(loadingSpinner); 

        // Domain Authority
        const domainAuthority = results.domain_authority || {};
        domainNameSpan.textContent = domainAuthority.domain || 'N/A';
        const daScore = domainAuthority.domain_authority_score !== undefined && domainAuthority.domain_authority_score !== null ? domainAuthority.domain_authority_score : 'N/A';
        domainAuthorityScoreSpan.textContent = daScore;
        updateProgressBar(domainAuthorityProgress, daScore);
        domainAuthorityText.textContent = domainAuthority.domain_authority_text || translations['calculatingMessage']; 
        domainAgeSpan.textContent = domainAuthority.domain_age_years ? `${domainAuthority.domain_age_years} ${translations['yearsText'] || 'years'}` : 'N/A';
        sslStatusSpan.textContent = domainAuthority.ssl_status || 'N/A';
        blacklistStatusSpan.textContent = domainAuthority.blacklist_status || 'N/A';
        dnsHealthSpan.textContent = domainAuthority.dns_health || 'N/A';

        // Page Speed
        const pageSpeed = results.page_speed || {};
        const perfScore = pageSpeed.scores && pageSpeed.scores['Performance Score'] !== undefined && pageSpeed.scores['Performance Score'] !== null ? pageSpeed.scores['Performance Score'] : 'N/A';
        performanceScoreSpan.textContent = perfScore;
        updateProgressBar(performanceProgress, perfScore);
        performanceText.textContent = pageSpeed.performance_text || translations['calculatingMessage']; 
        pagespeedLink.href = pageSpeed.pagespeed_report_link || '#';

        // Core Web Vitals
        coreWebVitalsList.innerHTML = '';
        const coreVitals = pageSpeed.core_web_vitals || {};
        if (Object.keys(coreVitals).length > 0) {
            for (const metric in coreVitals) {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${metric}:</strong> ${coreVitals[metric] || 'N/A'}`;
                coreWebVitalsList.appendChild(li);
            }
        } else {
            const li = document.createElement('li');
            li.textContent = translations['noCoreWebVitals']; 
            coreWebVitalsList.appendChild(li);
        }

        // Performance Issues
        performanceIssuesList.innerHTML = '';
        const perfIssues = pageSpeed.issues || [];
        if (perfIssues.length > 0) {
        } else {
            const li = document.createElement('li');
            li.textContent = translations['noPerformanceIssues']; 
            li.classList.add('text-green-600', 'dark:text-green-300'); 
            performanceIssuesList.appendChild(li);
        }


        // SEO Quality
        const seoQuality = results.seo_quality || {};
        const seoScore = seoQuality.score !== undefined && seoQuality.score !== null ? seoQuality.score : 'N/A';
        seoOverallScoreSpan.textContent = seoScore;
        updateProgressBar(seoOverallProgress, seoScore);
        seoOverallText.textContent = seoQuality.seo_overall_text || translations['calculatingMessage']; 

        const seoElements = seoQuality.elements || {};
        seoTitleSpan.textContent = seoElements.title || 'N/A';
        seoMetaDescriptionSpan.textContent = seoElements.meta_description || 'N/A';
        seoBrokenLinksSpan.textContent = seoElements.broken_links ? seoElements.broken_links.length : '0';
        seoMissingAltSpan.textContent = seoElements.image_alt_status ? seoElements.image_alt_status.filter(s => s.includes("Missing") || s.includes("Empty")).length : '0';
        seoInternalLinksSpan.textContent = seoElements.internal_links_count !== undefined && seoElements.internal_links_count !== null ? seoElements.internal_links_count : 'N/A';
        seoExternalLinksSpan.textContent = seoElements.external_links_count !== undefined && seoElements.external_links_count !== null ? seoElements.external_links_count : 'N/A';

        // H-Tags
        hTagsList.innerHTML = '';
        const hTags = seoElements.h_tags || {};
        if (Object.keys(hTags).length > 0) {
            for (const tag in hTags) {
                const li = document.createElement('li');
                li.textContent = `${tag}: ${hTags[tag].join(', ')}`;
                hTagsList.appendChild(li);
            }
        } else {
            const li = document.createElement('li');
            li.textContent = translations['noHeadingTags']; 
            hTagsList.appendChild(li);
        }

        // Keyword Density
        keywordDensityList.innerHTML = '';
        const keywordDensity = seoElements.keyword_density || {};
        const topKeywords = Object.entries(keywordDensity)
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 10);
        if (topKeywords.length > 0) {
            topKeywords.forEach(([keyword, density]) => {
                const li = document.createElement('li');
                li.textContent = `${keyword}: ${density}%`;
                keywordDensityList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = translations['noKeywordsFound']; 
            keywordDensityList.appendChild(li);
        }

        // SEO Improvement Tips
        seoImprovementTipsList.innerHTML = '';
        const seoTips = seoQuality.improvement_tips || [];
        if (seoTips.length > 0) {
            seoTips.forEach(tip => {
                const li = document.createElement('li');
                li.textContent = tip;
                seoImprovementTipsList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = translations['noSeoTips']; 
            li.classList.add('text-green-600', 'dark:text-green-300');
            seoImprovementTipsList.appendChild(li);
        }

        // AI SEO Suggestions
        const aiInsights = results.ai_insights || {};
        if (aiInsights.seo_improvement_suggestions && aiInsights.seo_improvement_suggestions !== 'N/A') {
            aiSeoSuggestionsText.textContent = aiInsights.seo_improvement_suggestions;
            showElement(aiSeoSuggestionsSection);
        } else {
            hideElement(aiSeoSuggestionsSection);
        }


        // User Experience (UX)
        const userExperience = results.user_experience || {};

        // UX Issues
        uxIssuesList.innerHTML = '';
        const uxIssues = userExperience.issues || [];
        if (uxIssues.length > 0) {
            uxIssues.forEach(issue => {
                const li = document.createElement('li');
                li.textContent = issue;
                uxIssuesList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = translations['noUxIssues']; 
            li.classList.add('text-green-600', 'dark:text-green-300');
            uxIssuesList.appendChild(li);
        }

        // UX Suggestions
        uxSuggestionsList.innerHTML = '';
        const uxSuggestions = userExperience.suggestions || [];
        if (uxSuggestions.length > 0) {
            uxSuggestions.forEach(suggestion => {
                const li = document.createElement('li');
                li.textContent = suggestion;
                uxSuggestionsList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = translations['noUxSuggestions']; 
            li.classList.add('text-green-600', 'dark:text-green-300');
            uxSuggestionsList.appendChild(li);
        }

        // AI Content Insights
        if (aiInsights.content_originality_tone && aiInsights.content_originality_tone !== 'N/A') {
            aiContentInsightsText.textContent = aiInsights.content_originality_tone;
            showElement(aiContentInsightsSection);
        } else {
            hideElement(aiContentInsightsSection);
        }

        // AI Summary
        if (aiInsights.summary && aiInsights.summary !== 'N/A') {
            aiSummaryText.textContent = aiInsights.summary;
            showElement(aiSummarySection);
        } else {
            hideElement(aiSummarySection);
        }
    }

    // Event handler for the Analyze button
    analyzeButton.addEventListener('click', async () => {
        const url = websiteUrlInput.value.trim();
        hideElement(errorMessage);
        hideElement(resultsDashboard); 
        showElement(loadingSpinner); 
        console.log("Analyze button clicked. URL:", url); 

        if (!url) {
            displayError(translations['pleaseEnterUrl'] || 'Please enter a website URL.'); 
            return;
        }

        try {
            const backendApiUrl = `/analyze`; 
            console.log("Sending POST request to:", backendApiUrl); 

            const controller = new AbortController(); 
            const timeoutId = setTimeout(() => controller.abort(), 120000); 

            const response = await fetch(backendApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept-Language': currentLanguage 
                },
                body: JSON.stringify({ url }),
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
            console.log("Received results from backend:", results); 

            window.lastAnalysisResults = results; 

            hideElement(loadingSpinner); 
            displayResults(url, results); 

        } catch (error) {
            console.error('Analysis failed:', error);
            if (error.name === 'AbortError') {
                displayError(translations['analysisTimedOut'] || 'Analysis timed out. The server took too long to respond. Please try again later.'); 
            } else if (error instanceof TypeError && error.message.includes('Network request failed')) {
                displayError(translations['networkError'] || 'Network error. Could not connect to the server. Please check your internet connection and try again.'); 
            } else {
                displayError(`${translations['analysisFailed'] || 'Analysis failed'}: ${error.message}. ${translations['pleaseTryAgain'] || 'Please try again later.'}`); 
            }
            hideElement(loadingSpinner); 
        }
    });

    // Event handler for "Analyze Another" button
    analyzeAnotherButton.addEventListener('click', () => {
        hideElement(resultsDashboard);
        hideElement(errorMessage);
        websiteUrlInput.value = ''; 
        showElement(document.getElementById('input-section')); 
        // Clear AI outputs
        rewriteSeoOutput.innerHTML = `<p>${translations['loadingAiRewrites']}</p>`;
        hideElement(rewriteSeoOutput);
        refineContentOutput.innerHTML = `<p>${translations['loadingAiRefinement']}</p>`;
        hideElement(refineContentOutput);
    });

    // Event handler for Export PDF button
    exportPdfButton.addEventListener('click', async () => {
        const currentUrl = analyzedUrlSpan.textContent;
        if (!currentUrl || !window.lastAnalysisResults) {
            displayError(translations['noAnalysisResults'] || 'No analysis results to export. Please run an analysis first.'); 
            return;
        }

        exportPdfButton.textContent = translations['generatingPdf'] || 'Generating PDF...'; 
        exportPdfButton.disabled = true;

        try {
            const backendReportUrl = `/generate_report`; 
            const response = await fetch(backendReportUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept-Language': currentLanguage 
                },
                body: JSON.stringify({ url: currentUrl, results: window.lastAnalysisResults }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || translations['failedToGeneratePdf'] || 'Failed to generate PDF report.'); 
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `${currentUrl.replace(/[^a-z0-9]/gi, '_')}_analysis_report.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);

        } catch (error) {
            console.error('PDF export failed:', error);
            displayError(`${translations['pdfExportFailed'] || 'PDF export failed'}: ${error.message}`); 
        } finally {
            exportPdfButton.textContent = translations['exportPdfButton'] || 'Export PDF Report'; 
            exportPdfButton.disabled = false;
        }
    });

    // New: Event handler for Rewrite SEO button
    rewriteSeoButton.addEventListener('click', async () => {
        const currentUrl = analyzedUrlSpan.textContent;
        const currentTitle = seoTitleSpan.textContent;
        const currentMetaDescription = seoMetaDescriptionSpan.textContent;
        const currentKeywords = Object.keys(window.lastAnalysisResults.seo_quality.elements.keyword_density || {}).join(', ');

        if (!currentUrl || !window.lastAnalysisResults) {
            displayError(translations['runAnalysisFirst'] || 'Please run an analysis first to use AI tools.');
            return;
        }

        showElement(rewriteSeoOutput);
        rewriteSeoOutput.innerHTML = `<p>${translations['loadingAiRewrites']}</p>`;
        rewriteSeoButton.disabled = true;

        try {
            const response = await fetch('/ai_rewrite_seo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept-Language': currentLanguage
                },
                body: JSON.stringify({
                    url: currentUrl,
                    title: currentTitle,
                    meta_description: currentMetaDescription,
                    keywords: currentKeywords
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || translations['failedToGetAiRewrites'] || 'Failed to get AI rewrites.');
            }

            const aiRewrites = await response.json();
            let outputHtml = `<h3>${translations['aiRewritesTitle'] || 'AI Rewrites:'}</h3>`;
            if (aiRewrites.titles && aiRewrites.titles.length > 0) {
                outputHtml += `<p><strong>${translations['newTitles'] || 'New Titles:'}</strong></p><ul>`;
                aiRewrites.titles.forEach(title => {
                    outputHtml += `<li>${title}</li>`;
                });
                outputHtml += `</ul>`;
            }
            if (aiRewrites.meta_descriptions && aiRewrites.meta_descriptions.length > 0) {
                outputHtml += `<p><strong>${translations['newMetaDescriptions'] || 'New Meta Descriptions:'}</strong></p><ul>`;
                aiRewrites.meta_descriptions.forEach(desc => {
                    outputHtml += `<li>${desc}</li>`;
                });
                outputHtml += `</ul>`;
            }
            if (!aiRewrites.titles && !aiRewrites.meta_descriptions) {
                outputHtml += `<p>${translations['noAiRewritesAvailable'] || 'No AI rewrites available.'}</p>`;
            }
            rewriteSeoOutput.innerHTML = outputHtml;

        } catch (error) {
            console.error('AI Rewrite failed:', error);
            rewriteSeoOutput.innerHTML = `<p class="text-red-600">${translations['aiRewriteFailed'] || 'AI Rewrite failed'}: ${error.message}</p>`;
        } finally {
            rewriteSeoButton.disabled = false;
        }
    });

    // New: Event handler for Refine Content button
    refineContentButton.addEventListener('click', async () => {
        const extractedText = window.lastAnalysisResults.extracted_text_sample;

        if (!extractedText || !window.lastAnalysisResults) {
            displayError(translations['noContentForRefinement'] || 'No content extracted for refinement. Please run an analysis first.');
            return;
        }

        showElement(refineContentOutput);
        refineContentOutput.innerHTML = `<p>${translations['loadingAiRefinement']}</p>`;
        refineContentButton.disabled = true;

        try {
            const response = await fetch('/ai_refine_content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept-Language': currentLanguage
                },
                body: JSON.stringify({ text_sample: extractedText })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || translations['failedToRefineContent'] || 'Failed to refine content.');
            }

            const aiRefinement = await response.json();
            let outputHtml = `<h3>${translations['aiRefinementTitle'] || 'AI Content Refinement:'}</h3>`;
            if (aiRefinement.refined_text) {
                outputHtml += `<p><strong>${translations['refinedText'] || 'Refined Text:'}</strong></p><p>${aiRefinement.refined_text}</p>`;
            }
            if (aiRefinement.suggestions && aiRefinement.suggestions.length > 0) {
                outputHtml += `<p><strong>${translations['refinementSuggestions'] || 'Suggestions:'}</strong></p><ul>`;
                aiRefinement.suggestions.forEach(sugg => {
                    outputHtml += `<li>${sugg}</li>`;
                });
                outputHtml += `</ul>`;
            }
            if (!aiRefinement.refined_text && !aiRefinement.suggestions) {
                outputHtml += `<p>${translations['noAiRefinementAvailable'] || 'No AI refinement available.'}</p>`;
            }
            refineContentOutput.innerHTML = outputHtml;

        } catch (error) {
            console.error('AI Content Refinement failed:', error);
            refineContentOutput.innerHTML = `<p class="text-red-600">${translations['aiRefinementFailed'] || 'AI Refinement failed'}: ${error.message}</p>`;
        } finally {
            refineContentButton.disabled = false;
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

    // Initialize translations and theme on page load
    loadTranslations(currentLanguage);
    languageSelect.value = currentLanguage; // Set dropdown to current language
});
