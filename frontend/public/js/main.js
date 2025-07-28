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

    // New AdSense elements
    const adsenseReadinessSection = document.getElementById('adsense-readiness-section');
    const adsenseAssessmentText = document.getElementById('adsense-assessment-text');
    const adsenseImprovementAreasList = document.getElementById('adsense-improvement-areas-list');

    // New Broken Links Details elements
    const brokenLinksDetailsSection = document.getElementById('broken-links-details-section');
    const brokenLinksList = document.getElementById('broken-links-list');
    const brokenLinksFixSuggestionsSection = document.getElementById('broken-links-fix-suggestions-section');
    const brokenLinksFixSuggestionsText = document.getElementById('broken-links-fix-suggestions-text');


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
    const seoExternalLinksSpan = document = document.getElementById('seo-external-links');
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
        // Check if elements exist before trying to access children/set textContent
        if (coreWebVitalsList && coreWebVitalsList.children.length === 1 && coreWebVitalsList.children[0].getAttribute('data-translate') === 'loadingMessage') {
            coreWebVitalsList.children[0].textContent = translations['loadingMessage'];
        }
        if (performanceIssuesList && performanceIssuesList.children.length === 1 && performanceIssuesList.children[0].getAttribute('data-translate') === 'loadingMessage') {
            performanceIssuesList.children[0].textContent = translations['loadingMessage'];
        }
        if (hTagsList && hTagsList.children.length === 1 && hTagsList.children[0].getAttribute('data-translate') === 'loadingMessage') {
            hTagsList.children[0].textContent = translations['loadingMessage'];
        }
        if (keywordDensityList && keywordDensityList.children.length === 1 && keywordDensityList.children[0].getAttribute('data-translate') === 'loadingMessage') {
            keywordDensityList.children[0].textContent = translations['loadingMessage'];
        }
        if (seoImprovementTipsList && seoImprovementTipsList.children.length === 1 && seoImprovementTipsList.children[0].getAttribute('data-translate') === 'loadingMessage') {
            seoImprovementTipsList.children[0].textContent = translations['loadingMessage'];
        }
        if (uxIssuesList && uxIssuesList.children.length === 1 && uxIssuesList.children[0].getAttribute('data-translate') === 'loadingMessage') {
            uxIssuesList.children[0].textContent = translations['loadingMessage'];
        }
        if (uxSuggestionsList && uxSuggestionsList.children.length === 1 && uxSuggestionsList.children[0].getAttribute('data-translate') === 'loadingMessage') {
            uxSuggestionsList.children[0].textContent = translations['loadingMessage'];
        }
        // Ensure elements exist before setting textContent
        if (aiSeoSuggestionsText) aiSeoSuggestionsText.textContent = translations['loadingAiSuggestions'];
        if (aiContentInsightsText) aiContentInsightsText.textContent = translations['loadingAiInsights'];
        if (aiSummaryText) aiSummaryText.textContent = translations['loadingAiSummary'];
        if (rewriteSeoOutput && rewriteSeoOutput.querySelector('p')) rewriteSeoOutput.querySelector('p').textContent = translations['loadingAiRewrites'];
        if (refineContentOutput && refineContentOutput.querySelector('p')) refineContentOutput.querySelector('p').textContent = translations['loadingAiRefinement'];
        if (adsenseAssessmentText) adsenseAssessmentText.textContent = translations['loadingAdsenseAssessment'];
        if (adsenseImprovementAreasList) adsenseImprovementAreasList.innerHTML = `<li>${translations['loadingMessage']}</li>`;
        if (brokenLinksList) brokenLinksList.innerHTML = `<li>${translations['loadingMessage']}</li>`;
        if (brokenLinksFixSuggestionsText) brokenLinksFixSuggestionsText.textContent = translations['loadingAiSuggestions'];


        // Update N/A messages if they are currently set to N/A
        // These will be overwritten by actual results if available
        const naElements = [
            domainNameSpan, domainAuthorityScoreSpan, domainAgeSpan, sslStatusSpan,
            blacklistStatusSpan, dnsHealthSpan, performanceScoreSpan, seoOverallScoreSpan,
            seoTitleSpan, seoMetaDescriptionSpan, seoBrokenLinksSpan, seoMissingAltSpan,
            seoInternalLinksSpan, seoExternalLinksSpan
        ];
        naElements.forEach(el => {
            if (el && el.textContent === 'N/A') { // Add null check for el
                el.textContent = 'N/A';
            }
        });
    }


    // Helper functions to show/hide elements
    const showElement = (element) => { if (element) element.classList.remove('hidden'); };
    const hideElement = (element) => { if (element) element.classList.add('hidden'); };

    // Function to update progress bar width and color
    const updateProgressBar = (progressBarElement, score) => {
        if (!progressBarElement) return; // Add null check for progressBarElement

        let width = 0;
        let colorClass = 'progress-bad'; 

        // Ensure score is a number for comparison
        const numericScore = parseFloat(score);

        if (!isNaN(numericScore)) {
            width = Math.max(0, Math.min(100, numericScore)); 
            if (numericScore >= 80) {
                colorClass = 'progress-good';
            } else if (numericScore >= 50) {
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
        if (errorMessage) { // Add null check for errorMessage
            errorMessage.textContent = message;
            showElement(errorMessage);
        }
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
        if (domainNameSpan) domainNameSpan.textContent = domainAuthority.domain || 'N/A';
        const daScore = domainAuthority.domain_authority_score !== undefined && domainAuthority.domain_authority_score !== null ? domainAuthority.domain_authority_score : 'N/A';
        if (domainAuthorityScoreSpan) domainAuthorityScoreSpan.textContent = daScore;
        updateProgressBar(domainAuthorityProgress, daScore);
        // Updated message for Domain Authority Score
        if (domainAuthorityText) {
            if (daScore === 'N/A' || domainAuthority.domain_authority_text === "Requires external Domain Authority API") {
                domainAuthorityText.textContent = translations['domainAuthorityApiLimit'] || 'Domain Authority score requires a premium API key.';
            } else {
                domainAuthorityText.textContent = domainAuthority.domain_authority_text || translations['calculatingMessage']; 
            }
        }
        
        if (domainAgeSpan) domainAgeSpan.textContent = domainAuthority.domain_age_years ? `${domainAuthority.domain_age_years} ${translations['yearsText'] || 'years'}` : (translations['domainAgeApiLimit'] || 'N/A (Data might be limited by WHOIS service or API quota).');
        if (sslStatusSpan) sslStatusSpan.textContent = domainAuthority.ssl_status || 'N/A';
        if (blacklistStatusSpan) blacklistStatusSpan.textContent = domainAuthority.blacklist_status || 'N/A';
        if (dnsHealthSpan) dnsHealthSpan.textContent = domainAuthority.dns_health || 'N/A';

        // Page Speed
        const pageSpeed = results.page_speed || {};
        const perfScore = pageSpeed.scores && pageSpeed.scores['Performance Score'] !== undefined && pageSpeed.scores['Performance Score'] !== null ? pageSpeed.scores['Performance Score'] : 'N/A';
        if (performanceScoreSpan) performanceScoreSpan.textContent = perfScore;
        updateProgressBar(performanceProgress, perfScore);
        // Updated message for Page Speed Score
        if (performanceText) {
            if (perfScore === 'N/A' || pageSpeed.performance_text === "PAGESPEED_API_KEY environment variable not set.") {
                performanceText.textContent = translations['pageSpeedApiLimit'] || 'Page Speed data requires a Google PageSpeed Insights API key (free tier limits apply).';
            } else {
                performanceText.textContent = pageSpeed.performance_text || translations['calculatingMessage']; 
            }
        }
        if (pagespeedLink) pagespeedLink.href = pageSpeed.pagespeed_report_link || '#';

        // Core Web Vitals
        if (coreWebVitalsList) {
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
        }

        // Performance Issues
        if (performanceIssuesList) {
            performanceIssuesList.innerHTML = '';
            const perfIssues = pageSpeed.issues || [];
            if (perfIssues.length > 0) {
                perfIssues.forEach(issue => {
                    const li = document.createElement('li');
                    li.textContent = issue.title || 'Unknown issue';
                    performanceIssuesList.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.textContent = translations['noPerformanceIssues']; 
                li.classList.add('text-green-600', 'dark:text-green-300'); 
                performanceIssuesList.appendChild(li);
            }
        }


        // SEO Quality
        const seoQuality = results.seo_quality || {};
        const seoScore = seoQuality.score !== undefined && seoQuality.score !== null ? seoQuality.score : 'N/A';
        if (seoOverallScoreSpan) seoOverallScoreSpan.textContent = seoScore;
        updateProgressBar(seoOverallProgress, seoScore);
        if (seoOverallText) seoOverallText.textContent = seoQuality.seo_overall_text || translations['calculatingMessage']; 

        const seoElements = seoQuality.elements || {};
        if (seoTitleSpan) seoTitleSpan.textContent = seoElements.title || 'N/A';
        if (seoMetaDescriptionSpan) seoMetaDescriptionSpan.textContent = seoElements.meta_description || 'N/A';
        if (seoBrokenLinksSpan) seoBrokenLinksSpan.textContent = seoElements.broken_links ? seoElements.broken_links.length : '0';
        if (seoMissingAltSpan) seoMissingAltSpan.textContent = seoElements.image_alt_status ? seoElements.image_alt_status.filter(s => s.includes("Missing") || s.includes("Empty")).length : '0';
        if (seoInternalLinksSpan) seoInternalLinksSpan.textContent = seoElements.internal_links_count !== undefined && seoElements.internal_links_count !== null ? seoElements.internal_links_count : 'N/A';
        if (seoExternalLinksSpan) seoExternalLinksSpan.textContent = seoElements.external_links_count !== undefined && seoElements.external_links_count !== null ? seoElements.external_links_count : 'N/A';

        // H-Tags
        if (hTagsList) {
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
        }

        // Keyword Density
        if (keywordDensityList) {
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
        }

        // SEO Improvement Tips
        if (seoImprovementTipsList) {
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
        }

        // AI SEO Suggestions
        if (aiSeoSuggestionsText && aiSeoSuggestionsSection) {
            const aiInsights = results.ai_insights || {};
            if (aiInsights.seo_improvement_suggestions && aiInsights.seo_improvement_suggestions !== 'N/A') {
                aiSeoSuggestionsText.textContent = aiInsights.seo_improvement_suggestions;
                showElement(aiSeoSuggestionsSection);
            } else {
                aiSeoSuggestionsText.textContent = translations['aiFeatureLimited'] || 'AI suggestions are limited or unavailable in the free version.';
                showElement(aiSeoSuggestionsSection); // Still show the section but with a message
            }
        }

        // Broken Links Details
        if (brokenLinksDetailsSection && brokenLinksList && brokenLinksFixSuggestionsSection && brokenLinksFixSuggestionsText) {
            const brokenLinks = seoElements.broken_links || [];
            const brokenLinkSuggestions = results.broken_link_suggestions || {};

            if (brokenLinks.length > 0) {
                brokenLinksList.innerHTML = '';
                brokenLinks.forEach(link => {
                    const li = document.createElement('li');
                    li.textContent = link;
                    brokenLinksList.appendChild(li);
                });
                showElement(brokenLinksDetailsSection);

                if (brokenLinkSuggestions.suggestions && brokenLinkSuggestions.suggestions !== 'N/A') {
                    brokenLinksFixSuggestionsText.textContent = brokenLinkSuggestions.suggestions;
                    showElement(brokenLinksFixSuggestionsSection);
                } else {
                    brokenLinksFixSuggestionsText.textContent = translations['aiFeatureLimited'] || 'AI fix suggestions are limited or unavailable in the free version.';
                    showElement(brokenLinksFixSuggestionsSection);
                }
            } else {
                hideElement(brokenLinksDetailsSection);
            }
        }


        // User Experience (UX)
        const userExperience = results.user_experience || {};

        // UX Issues
        if (uxIssuesList) {
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
        }

        // UX Suggestions
        if (uxSuggestionsList) {
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
        }

        // AI Content Insights
        if (aiContentInsightsText && aiContentInsightsSection) {
            const aiInsights = results.ai_insights || {};
            if (aiInsights.content_originality_tone && aiInsights.content_originality_tone !== 'N/A') {
                aiContentInsightsText.textContent = aiInsights.content_originality_tone;
                showElement(aiContentInsightsSection);
            } else {
                aiContentInsightsText.textContent = translations['aiFeatureLimited'] || 'AI content insights are limited or unavailable in the free version.';
                showElement(aiContentInsightsSection); // Still show the section but with a message
            }
        }

        // AI Summary
        if (aiSummaryText && aiSummarySection) {
            const aiInsights = results.ai_insights || {};
            if (aiInsights.summary && aiInsights.summary !== 'N/A') {
                aiSummaryText.textContent = aiInsights.summary;
                showElement(aiSummarySection);
            } else {
                aiSummaryText.textContent = translations['aiFeatureLimited'] || 'AI summary is limited or unavailable in the free version.';
                showElement(aiSummarySection); // Still show the section but with a message
            }
        }

        // AdSense Readiness
        if (adsenseReadinessSection && adsenseAssessmentText && adsenseImprovementAreasList) {
            const adsenseReadiness = results.adsense_readiness || {};
            if (adsenseReadiness.assessment && adsenseReadiness.assessment !== 'N/A') {
                adsenseAssessmentText.textContent = adsenseReadiness.assessment;
                adsenseImprovementAreasList.innerHTML = '';
                if (adsenseReadiness.improvement_areas && adsenseReadiness.improvement_areas.length > 0) {
                    adsenseReadiness.improvement_areas.forEach(area => {
                        const li = document.createElement('li');
                        li.textContent = area;
                        adsenseImprovementAreasList.appendChild(li);
                    });
                } else {
                    const li = document.createElement('li');
                    li.textContent = translations['noAdsenseImprovements'] || 'No specific improvement areas suggested.';
                    adsenseImprovementAreasList.appendChild(li);
                }
                showElement(adsenseReadinessSection);
            } else {
                adsenseAssessmentText.textContent = translations['aiFeatureLimited'] || 'AI AdSense assessment is limited or unavailable in the free version.';
                adsenseImprovementAreasList.innerHTML = `<li>${translations['loadingMessage']}</li>`; // Reset to loading message
                showElement(adsenseReadinessSection); // Still show the section but with a message
            }
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
        if (rewriteSeoOutput) {
            rewriteSeoOutput.innerHTML = `<p>${translations['loadingAiRewrites']}</p>`;
            hideElement(rewriteSeoOutput);
        }
        if (refineContentOutput) {
            refineContentOutput.innerHTML = `<p>${translations['loadingAiRefinement']}</p>`;
            hideElement(refineContentOutput);
        }
        if (adsenseAssessmentText) adsenseAssessmentText.textContent = translations['loadingAdsenseAssessment'];
        if (adsenseImprovementAreasList) adsenseImprovementAreasList.innerHTML = `<li>${translations['loadingMessage']}</li>`;
        if (brokenLinksList) brokenLinksList.innerHTML = `<li>${translations['loadingMessage']}</li>`;
        if (brokenLinksFixSuggestionsText) brokenLinksFixSuggestionsText.textContent = translations['loadingAiSuggestions'];
        if (brokenLinksDetailsSection) hideElement(brokenLinksDetailsSection);
    });

    // Event handler for Export PDF button
    exportPdfButton.addEventListener('click', async () => {
        const currentUrl = analyzedUrlSpan.textContent;
        if (!currentUrl || !window.lastAnalysisResults) {
            displayError(translations['noAnalysisResults'] || 'No analysis results to export. Please run an analysis first.'); 
            return;
        }

        if (exportPdfButton) { // Null check for exportPdfButton
            exportPdfButton.textContent = translations['generatingPdf'] || 'Generating PDF...'; 
            exportPdfButton.disabled = true;
        }

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
            if (exportPdfButton) { // Null check for exportPdfButton
                exportPdfButton.textContent = translations['exportPdfButton'] || 'Export PDF Report'; 
                exportPdfButton.disabled = false;
            }
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

        if (rewriteSeoOutput) { // Null check for rewriteSeoOutput
            showElement(rewriteSeoOutput);
            rewriteSeoOutput.innerHTML = `<p>${translations['loadingAiRewrites']}</p>`;
        }
        if (rewriteSeoButton) rewriteSeoButton.disabled = true; // Null check for rewriteSeoButton

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
                const errorText = await response.text(); 
                console.error("AI Rewrite Backend response not OK. Raw text:", errorText);
                try {
                    const errorData = JSON.parse(errorText);
                    throw new Error(errorData.error || `${translations['failedToGetAiRewrites'] || 'Failed to get AI rewrites.'} (Status: ${response.status})`);
                } catch (jsonParseError) {
                    throw new Error(`${translations['aiFeatureLimited'] || 'AI features are limited or unavailable in the free version.'} (Error: ${errorText.substring(0, 100)}...)`);
                }
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
            if (!aiRewrites.titles.length && !aiRewrites.meta_descriptions.length) { 
                outputHtml += `<p>${translations['noAiRewritesAvailable'] || 'No AI rewrites available.'}</p>`;
            }
            if (rewriteSeoOutput) rewriteSeoOutput.innerHTML = outputHtml; // Null check

        } catch (error) {
            console.error('AI Rewrite failed:', error);
            if (rewriteSeoOutput) rewriteSeoOutput.innerHTML = `<p class="text-red-600">${error.message}</p>`; 
        } finally {
            if (rewriteSeoButton) rewriteSeoButton.disabled = false; // Null check
        }
    });

    // New: Event handler for Refine Content button
    refineContentButton.addEventListener('click', async () => {
        const extractedText = window.lastAnalysisResults.extracted_text_sample;

        if (!extractedText || extractedText === "No content extracted for AI analysis." || !window.lastAnalysisResults) {
            displayError(translations['noContentForRefinement'] || 'No content extracted for refinement. Please run an analysis first.');
            return;
        }

        if (refineContentOutput) { // Null check
            showElement(refineContentOutput);
            refineContentOutput.innerHTML = `<p>${translations['loadingAiRefinement']}</p>`;
        }
        if (refineContentButton) refineContentButton.disabled = true; // Null check

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
                const errorText = await response.text(); 
                console.error("AI Refine Backend response not OK. Raw text:", errorText);
                try {
                    const errorData = JSON.parse(errorText);
                    throw new Error(errorData.error || `${translations['failedToRefineContent'] || 'Failed to refine content.'} (Status: ${response.status})`);
                } catch (jsonParseError) {
                    throw new Error(`${translations['aiFeatureLimited'] || 'AI features are limited or unavailable in the free version.'} (Error: ${errorText.substring(0, 100)}...)`);
                }
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
            if (!aiRefinement.refined_text && (!aiRefinement.suggestions || aiRefinement.suggestions.length === 0)) { 
                outputHtml += `<p>${translations['noAiRefinementAvailable'] || 'No AI refinement available.'}</p>`;
            }
            if (refineContentOutput) refineContentOutput.innerHTML = outputHtml; // Null check

        } catch (error) {
            console.error('AI Content Refinement failed:', error);
            if (refineContentOutput) refineContentOutput.innerHTML = `<p class="text-red-600">${error.message}</p>`; 
        } finally {
            if (refineContentButton) refineContentButton.disabled = false; // Null check
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
