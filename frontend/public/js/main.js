document.addEventListener('DOMContentLoaded', () => {
    const backendBaseUrl = window.location.origin; // Dynamically get backend URL
    const authBaseUrl = backendBaseUrl;

    // Firebase configuration (replace with your actual Firebase project config)
    // You can find this in your Firebase project settings -> Project settings -> General -> Your apps -> Web app -> Firebase SDK snippet -> Config
    const firebaseConfig = {
        apiKey: "YOUR_FIREBASE_API_KEY", // Replace with your Web API Key
        authDomain: "YOUR_PROJECT_ID.firebaseapp.com", // Replace with your Project ID
        projectId: "YOUR_PROJECT_ID", // Replace with your Project ID
        storageBucket: "YOUR_PROJECT_ID.appspot.com", // Replace with your Project ID
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace with your Messaging Sender ID
        appId: "YOUR_APP_ID" // Replace with your App ID
    };

    // Initialize Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const auth = firebase.auth();
    const googleProvider = new firebase.auth.GoogleAuthProvider();
    // const facebookProvider = new firebase.auth.FacebookAuthProvider(); // Removed Facebook as requested

    const websiteUrlInput = document.getElementById('website-url');
    const analyzeButton = document.getElementById('analyze-button');
    const errorMessage = document.getElementById('error-message');
    const loadingSpinner = document.getElementById('loading-spinner');
    const resultsDashboard = document.getElementById('results-dashboard');
    const analyzedUrlSpan = document.getElementById('analyzed-url');
    const analyzeAnotherButton = document.getElementById('analyze-another-button');
    const exportPdfButton = document.getElementById('export-pdf-button');

    // Main buttons
    const analyzeWebsiteMainButton = document.getElementById('analyze-website-main-button');
    const articleAnalyzerLink = document.querySelector('a[href="/article_analyzer.html"]');


    // Auth Status Display elements
    const userEmailDisplay = document.getElementById('user-email-display');
    const notLoggedInMessage = document.getElementById('not-logged-in-message');
    const logoutButton = document.getElementById('logout-button');
    const authButtonsContainer = document.getElementById('auth-buttons-container');
    const showAuthModalButton = document.getElementById('show-auth-modal-button');

    // Auth Modal elements
    const authModal = document.getElementById('auth-modal');
    const closeAuthModalButton = document.getElementById('close-auth-modal');
    const modalAuthFormTitle = document.getElementById('modal-auth-form-title');
    const modalAuthPrompt = document.getElementById('modal-auth-prompt');
    const modalAuthEmailInput = document.getElementById('modal-auth-email');
    const modalAuthPasswordInput = document.getElementById('modal-auth-password');
    const modalAuthSubmitButton = document.getElementById('modal-auth-submit-button');
    const modalAuthErrorMessage = document.getElementById('modal-auth-error-message');
    const modalAuthLoadingSpinner = document.getElementById('modal-auth-loading-spinner');
    const modalSwitchAuthButton = document.getElementById('modal-switch-auth-button');
    const modalSwitchAuthText = document.getElementById('modal-switch-auth-text');
    const modalGoogleLoginButton = document.getElementById('modal-google-login-button');
    // const modalFacebookLoginButton = document.getElementById('modal-facebook-login-button'); // Removed Facebook as requested

    let currentAuthMode = 'login'; // 'login' or 'register' for the modal
    let currentAnalysisResults = null; // To store results for PDF export
    let actionAfterAuth = null; // Stores the function to call after successful authentication

    // Language and Theme elements
    const languageSelect = document.getElementById('language-select');
    const themeToggle = document.getElementById('theme-toggle');
    let translations = {};
    let currentLang = 'en';

    // Toggle sections
    const toggleButtons = document.querySelectorAll('.toggle-section');
    const expandAllButton = document.getElementById('expand-all-button');
    const collapseAllButton = document.getElementById('collapse-all-button');

    // AI Tools buttons
    const rewriteSeoButton = document.getElementById('rewrite-seo-button');
    const refineContentButton = document.getElementById('refine-content-button');
    const rewriteSeoOutput = document.getElementById('rewrite-seo-output');
    const refineContentOutput = document.getElementById('refine-content-output');

    // Load translations
    async function loadTranslations(lang) {
        try {
            const response = await fetch(`/locales/${lang}.json`);
            translations = await response.json();
            applyTranslations();
        } catch (error) {
            console.error('Error loading translations:', error);
        }
    }

    function applyTranslations() {
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.dataset.translate;
            if (translations[key]) {
                element.textContent = translations[key];
            }
        });
        // Update specific button texts that change based on auth mode in modal
        if (currentAuthMode === 'login') {
            modalAuthSubmitButton.textContent = translations['loginButton'];
            modalSwitchAuthButton.textContent = translations['registerHereButton'];
            modalSwitchAuthText.textContent = translations['noAccountText'];
            modalAuthFormTitle.textContent = translations['loginTitle'];
        } else {
            modalAuthSubmitButton.textContent = translations['registerButton'];
            modalSwitchAuthButton.textContent = translations['loginHereButton'];
            modalSwitchAuthText.textContent = translations['haveAccountText'];
            modalAuthFormTitle.textContent = translations['registerTitle'];
        }
    }

    // Theme Toggle Logic
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }

    themeToggle.addEventListener('click', () => {
        const currentTheme = localStorage.getItem('theme') || 'light';
        applyTheme(currentTheme === 'light' ? 'dark' : 'light');
    });

    // Language Select Logic
    languageSelect.addEventListener('change', (event) => {
        currentLang = event.target.value;
        localStorage.setItem('language', currentLang);
        loadTranslations(currentLang);
    });

    // Initial load
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    currentLang = localStorage.getItem('language') || 'en';
    languageSelect.value = currentLang;
    loadTranslations(currentLang);

    // Auth Modal Logic
    function showAuthModal(mode = 'login', callback = null) {
        currentAuthMode = mode;
        actionAfterAuth = callback; // Store the action to perform after successful auth
        modalAuthEmailInput.value = '';
        modalAuthPasswordInput.value = '';
        modalAuthErrorMessage.classList.add('hidden');
        modalAuthLoadingSpinner.classList.add('hidden');
        applyTranslations(); // Update modal texts based on mode
        authModal.classList.remove('hidden');
    }

    function hideAuthModal() {
        authModal.classList.add('hidden');
        actionAfterAuth = null; // Clear the stored action
    }

    showAuthModalButton.addEventListener('click', () => showAuthModal('login'));
    closeAuthModalButton.addEventListener('click', hideAuthModal);

    modalSwitchAuthButton.addEventListener('click', () => {
        currentAuthMode = currentAuthMode === 'login' ? 'register' : 'login';
        applyTranslations(); // Re-apply translations to update modal texts
        modalAuthErrorMessage.classList.add('hidden');
    });

    modalAuthSubmitButton.addEventListener('click', async () => {
        const email = modalAuthEmailInput.value;
        const password = modalAuthPasswordInput.value;

        if (!email || !password) {
            modalAuthErrorMessage.textContent = translations['emailPasswordRequired'];
            modalAuthErrorMessage.classList.remove('hidden');
            return;
        }

        modalAuthLoadingSpinner.classList.remove('hidden');
        modalAuthErrorMessage.classList.add('hidden');

        try {
            let response;
            if (currentAuthMode === 'register') {
                response = await fetch(`${authBaseUrl}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
            } else { // login (email/password)
                response = await fetch(`${authBaseUrl}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
            }

            const data = await response.json();
            if (response.ok) {
                if (currentAuthMode === 'login') {
                    const userCredential = await auth.signInWithCustomToken(data.token);
                    const idToken = await userCredential.user.getIdToken();
                    localStorage.setItem('authToken', idToken);
                    localStorage.setItem('userEmail', data.email);
                    updateAuthUI();
                    hideAuthModal();
                    if (actionAfterAuth) {
                        actionAfterAuth(); // Execute the stored action
                    }
                } else { // registered
                    modalAuthErrorMessage.textContent = translations['registrationSuccess'];
                    modalAuthErrorMessage.classList.remove('hidden');
                    currentAuthMode = 'login'; // Switch to login after successful registration
                    applyTranslations();
                }
            } else {
                modalAuthErrorMessage.textContent = data.error || translations['authFailed'];
                modalAuthErrorMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Auth error:', error);
            modalAuthErrorMessage.textContent = translations['networkErrorAuth'];
            modalAuthErrorMessage.classList.remove('hidden');
        } finally {
            modalAuthLoadingSpinner.classList.add('hidden');
        }
    });

    // Social Login Handlers (Google only, Facebook removed)
    async function handleSocialLogin(provider) {
        modalAuthLoadingSpinner.classList.remove('hidden');
        modalAuthErrorMessage.classList.add('hidden');
        try {
            const result = await auth.signInWithPopup(provider);
            const idToken = await result.user.getIdToken();

            const response = await fetch(`${authBaseUrl}/verify_id_token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken: idToken })
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('authToken', idToken);
                localStorage.setItem('userEmail', result.user.email);
                updateAuthUI();
                hideAuthModal();
                if (actionAfterAuth) {
                    actionAfterAuth(); // Execute the stored action
                }
            } else {
                modalAuthErrorMessage.textContent = data.error || translations['authFailed'];
                modalAuthErrorMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Social login error:', error);
            let displayError = translations['authFailed'];
            if (error.code === 'auth/popup-closed-by-user') {
                displayError = translations['popupClosed'];
            } else if (error.code === 'auth/cancelled-popup-request') {
                displayError = translations['popupCancelled'];
            } else if (error.code === 'auth/account-exists-with-different-credential') {
                displayError = translations['accountExistsDifferentCredential'];
            }
            modalAuthErrorMessage.textContent = displayError;
            modalAuthErrorMessage.classList.remove('hidden');
        } finally {
            modalAuthLoadingSpinner.classList.add('hidden');
        }
    }

    modalGoogleLoginButton.addEventListener('click', () => handleSocialLogin(googleProvider));
    // modalFacebookLoginButton.addEventListener('click', () => handleSocialLogin(facebookProvider)); // Removed

    logoutButton.addEventListener('click', async () => {
        try {
            await auth.signOut(); // Sign out from Firebase client-side
            localStorage.removeItem('authToken');
            localStorage.removeItem('userEmail');
            currentAnalysisResults = null; // Clear previous analysis
            updateAuthUI();
            websiteUrlInput.value = ''; // Clear URL input
            resultsDashboard.classList.add('hidden'); // Hide results
        } catch (error) {
            console.error('Logout error:', error);
            alert(translations['logoutFailed']);
        }
    });

    // Initial auth UI update on page load
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const idToken = await user.getIdToken();
            localStorage.setItem('authToken', idToken);
            localStorage.setItem('userEmail', user.email || user.displayName || translations['unknownUser']);
        } else {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userEmail');
        }
        updateAuthUI();
    });

    function updateAuthUI() {
        const token = localStorage.getItem('authToken');
        const email = localStorage.getItem('userEmail');

        if (token && email) {
            userEmailDisplay.textContent = email;
            userEmailDisplay.classList.remove('hidden');
            notLoggedInMessage.classList.add('hidden');
            logoutButton.classList.remove('hidden');
            authButtonsContainer.classList.add('hidden');
        } else {
            userEmailDisplay.textContent = '';
            userEmailDisplay.classList.add('hidden');
            notLoggedInMessage.classList.remove('hidden');
            logoutButton.classList.add('hidden');
            authButtonsContainer.classList.remove('hidden');
        }
    }


    // Analysis Logic
    analyzeButton.addEventListener('click', analyzeWebsite);
    analyzeAnotherButton.addEventListener('click', () => {
        resultsDashboard.classList.add('hidden');
        websiteUrlInput.value = '';
        errorMessage.classList.add('hidden');
        currentAnalysisResults = null;
    });

    // Trigger auth modal if not logged in for PDF export
    exportPdfButton.addEventListener('click', () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            showAuthModal('login', () => exportPdfReport()); // Pass function to execute after login
        } else {
            exportPdfReport();
        }
    });

    async function exportPdfReport() {
        if (!currentAnalysisResults) {
            alert(translations['noAnalysisResults']);
            return;
        }

        exportPdfButton.textContent = translations['generatingPdf'];
        exportPdfButton.disabled = true;

        const token = localStorage.getItem('authToken');
        if (!token) { // Should be logged in by now if modal was shown
            alert(translations['runAnalysisFirst']);
            exportPdfButton.textContent = translations['exportPdfButton'];
            exportPdfButton.disabled = false;
            return;
        }

        try {
            const response = await fetch(`${backendBaseUrl}/generate_report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept-Language': currentLang
                },
                body: JSON.stringify({ url: analyzedUrlSpan.textContent })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${analyzedUrlSpan.textContent.replace(/[^a-z0-9]/gi, '_')}_analysis_report.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } else {
                const errorData = await response.json();
                alert(`${translations['pdfExportFailed']}: ${errorData.error || translations['pleaseTryAgain']}`);
            }
        } catch (error) {
            console.error('PDF export error:', error);
            alert(`${translations['pdfExportFailed']}: ${translations['networkError']}`);
        } finally {
            exportPdfButton.textContent = translations['exportPdfButton'];
            exportPdfButton.disabled = false;
        }
    }

    async function analyzeWebsite() {
        const url = websiteUrlInput.value;
        const token = localStorage.getItem('authToken');

        if (!token) {
            // If not logged in, show modal and prompt for login
            showAuthModal('login', () => analyzeWebsite()); // After login, re-run analyzeWebsite
            return;
        }

        if (!url) {
            errorMessage.textContent = translations['pleaseEnterUrl'];
            errorMessage.classList.remove('hidden');
            return;
        }

        errorMessage.classList.add('hidden');
        loadingSpinner.classList.remove('hidden');
        resultsDashboard.classList.add('hidden');
        currentAnalysisResults = null; // Clear previous results

        try {
            const response = await fetch(`${backendBaseUrl}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept-Language': currentLang
                },
                body: JSON.stringify({ url: url })
            });

            if (response.ok) {
                const data = await response.json();
                currentAnalysisResults = data;
                displayResults(data, url);
                resultsDashboard.classList.remove('hidden');
            } else {
                const errorData = await response.json();
                errorMessage.textContent = `${translations['analysisFailed']}: ${errorData.error || translations['pleaseTryAgain']}`;
                errorMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Analysis error:', error);
            if (error.name === 'AbortError') {
                errorMessage.textContent = translations['analysisTimedOut'];
            } else {
                errorMessage.textContent = `${translations['networkError']}: ${translations['pleaseTryAgain']}`;
            }
            errorMessage.classList.remove('hidden');
        } finally {
            loadingSpinner.classList.add('hidden');
        }
    }

    function displayResults(data, url) {
        analyzedUrlSpan.textContent = url;

        // Domain Authority
        const daScore = data.domain_authority.domain_authority_score;
        document.getElementById('domain-name').textContent = data.domain_authority.domain;
        document.getElementById('domain-authority-score').textContent = daScore !== 'N/A' ? daScore : translations['notAvailable'];
        updateScoreDisplay('domain-authority', daScore);
        document.getElementById('domain-age').textContent = data.domain_authority.domain_age_years !== 'N/A' ? `${data.domain_authority.domain_age_years} ${translations['yearsText']}` : translations['notAvailable'];
        document.getElementById('ssl-status').textContent = data.domain_authority.ssl_status;
        document.getElementById('blacklist-status').textContent = data.domain_authority.blacklist_status;
        document.getElementById('dns-health').textContent = data.domain_authority.dns_health;

        // Page Speed
        const perfScore = data.page_speed.scores['Performance Score'];
        document.getElementById('performance-score').textContent = perfScore !== 'N/A' ? perfScore : translations['notAvailable'];
        updateScoreDisplay('performance', perfScore);
        document.getElementById('pagespeed-link').href = data.page_speed.pagespeed_report_link || '#';

        const coreWebVitalsList = document.getElementById('core-web-vitals');
        coreWebVitalsList.innerHTML = '';
        if (data.page_speed.core_web_vitals && Object.keys(data.page_speed.core_web_vitals).length > 0) {
            for (const metric in data.page_speed.core_web_vitals) {
                const li = document.createElement('li');
                const value = data.page_speed.core_web_vitals[metric];
                let statusClass = '';
                if (value.includes('Good')) statusClass = 'text-green-600 font-semibold';
                else if (value.includes('Needs Improvement')) statusClass = 'text-yellow-600 font-semibold';
                else if (value.includes('Poor')) statusClass = 'text-red-600 font-semibold';
                li.innerHTML = `<strong>${metric}:</strong> <span class="${statusClass}">${value}</span>`;
                coreWebVitalsList.appendChild(li);
            }
        } else {
            const li = document.createElement('li');
            li.textContent = translations['noCoreWebVitals'];
            coreWebVitalsList.appendChild(li);
        }

        const performanceIssuesList = document.getElementById('performance-issues');
        performanceIssuesList.innerHTML = '';
        if (data.page_speed.issues && data.page_speed.issues.length > 0) {
            data.page_speed.issues.forEach(issue => {
                const li = document.createElement('li');
                li.textContent = issue;
                performanceIssuesList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = translations['noPerformanceIssues'];
            performanceIssuesList.appendChild(li);
        }

        // SEO Quality
        const seoOverallScore = data.seo_quality.score;
        document.getElementById('seo-overall-score').textContent = seoOverallScore !== 'N/A' ? seoOverallScore : translations['notAvailable'];
        updateScoreDisplay('seo-overall', seoOverallScore);
        document.getElementById('seo-title').textContent = data.seo_quality.elements.title || translations['notAvailable'];
        document.getElementById('seo-meta-description').textContent = data.seo_quality.elements.meta_description || translations['notAvailable'];
        document.getElementById('seo-broken-links').textContent = data.seo_quality.elements.broken_links ? data.seo_quality.elements.broken_links.length : translations['notAvailable'];
        document.getElementById('seo-missing-alt').textContent = data.seo_quality.elements.missing_alt_count !== undefined ? data.seo_quality.elements.missing_alt_count : translations['notAvailable'];
        document.getElementById('seo-internal-links').textContent = data.seo_quality.elements.internal_links_count || translations['notAvailable'];
        document.getElementById('seo-external-links').textContent = data.seo_quality.elements.external_links_count || translations['notAvailable'];

        // New SEO elements
        document.getElementById('content-word-count').textContent = data.seo_quality.elements.content_length ? data.seo_quality.elements.content_length.word_count : translations['notAvailable'];
        document.getElementById('content-char-count').textContent = data.seo_quality.elements.content_length ? data.seo_quality.elements.content_length.character_count : translations['notAvailable'];
        document.getElementById('robots-txt-present').textContent = data.seo_quality.elements.robots_txt_present ? translations['yesText'] : translations['noText'];
        document.getElementById('sitemap-xml-present').textContent = data.seo_quality.elements.sitemap_xml_present ? translations['yesText'] : translations['noText'];


        const hTagsList = document.getElementById('h-tags-list');
        hTagsList.innerHTML = '';
        if (data.seo_quality.elements.h_tags && Object.keys(data.seo_quality.elements.h_tags).length > 0) {
            for (const tag in data.seo_quality.elements.h_tags) {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${tag}:</strong> ${data.seo_quality.elements.h_tags[tag].join(', ')}`;
                hTagsList.appendChild(li);
            }
        } else {
            const li = document.createElement('li');
            li.textContent = translations['noHeadingTags'];
            hTagsList.appendChild(li);
        }

        const keywordDensityList = document.getElementById('keyword-density-list');
        keywordDensityList.innerHTML = '';
        if (data.seo_quality.elements.keyword_density && Object.keys(data.seo_quality.elements.keyword_density).length > 0) {
            const sortedKeywords = Object.entries(data.seo_quality.elements.keyword_density)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10);
            sortedKeywords.forEach(([keyword, density]) => {
                const li = document.createElement('li');
                li.textContent = `${keyword}: ${density}%`;
                keywordDensityList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = translations['noKeywordsFound'];
            keywordDensityList.appendChild(li);
        }

        const seoImprovementTipsList = document.getElementById('seo-improvement-tips');
        seoImprovementTipsList.innerHTML = '';
        if (data.seo_quality.improvement_tips && data.seo_quality.improvement_tips.length > 0) {
            data.seo_quality.improvement_tips.forEach(tip => {
                const li = document.createElement('li');
                li.textContent = tip;
                seoImprovementTipsList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = translations['noSeoTips'];
            seoImprovementTipsList.appendChild(li);
        }

        // AI SEO Suggestions
        const aiSeoSuggestionsSection = document.getElementById('ai-seo-suggestions-section');
        const aiSeoSuggestionsText = document.getElementById('ai-seo-suggestions-text');
        if (data.ai_insights && data.ai_insights.seo_improvement_suggestions) {
            aiSeoSuggestionsText.textContent = data.ai_insights.seo_improvement_suggestions;
            aiSeoSuggestionsSection.classList.remove('hidden');
        } else {
            aiSeoSuggestionsText.textContent = translations['aiFeatureLimited'];
            aiSeoSuggestionsSection.classList.remove('hidden'); // Still show with message
        }

        // Broken Links Details
        const brokenLinksDetailsSection = document.getElementById('broken-links-details-section');
        const brokenLinksList = document.getElementById('broken-links-list');
        brokenLinksList.innerHTML = '';
        if (data.seo_quality.elements.broken_links && data.seo_quality.elements.broken_links.length > 0) {
            data.seo_quality.elements.broken_links.forEach(link => {
                const li = document.createElement('li');
                li.textContent = link;
                brokenLinksList.appendChild(li);
            });
            brokenLinksDetailsSection.classList.remove('hidden');
        } else {
            const li = document.createElement('li');
            li.textContent = 'No broken links found.';
            brokenLinksList.appendChild(li);
            brokenLinksDetailsSection.classList.remove('hidden'); // Still show with message
        }

        // Broken Links Fix Suggestions
        const brokenLinksFixSuggestionsSection = document.getElementById('broken-links-fix-suggestions-section');
        const brokenLinksFixSuggestionsText = document.getElementById('broken-links-fix-suggestions-text');
        if (data.broken_link_suggestions && data.broken_link_suggestions.suggestions) {
            brokenLinksFixSuggestionsText.textContent = data.broken_link_suggestions.suggestions;
            brokenLinksFixSuggestionsSection.classList.remove('hidden');
        } else {
            brokenLinksFixSuggestionsText.textContent = translations['aiFeatureLimited'];
            brokenLinksFixSuggestionsSection.classList.remove('hidden'); // Still show with message
        }


        // User Experience
        document.getElementById('viewport-meta-present').textContent = data.user_experience.viewport_meta_present ? translations['yesText'] : translations['noText'];

        const uxIssuesList = document.getElementById('ux-issues-list');
        uxIssuesList.innerHTML = '';
        if (data.user_experience.issues && data.user_experience.issues.length > 0) {
            data.user_experience.issues.forEach(issue => {
                const li = document.createElement('li');
                li.textContent = issue;
                uxIssuesList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = translations['noUxIssues'];
            uxIssuesList.appendChild(li);
        }

        const uxSuggestionsList = document.getElementById('ux-suggestions-list');
        uxSuggestionsList.innerHTML = '';
        if (data.user_experience.suggestions && data.user_experience.suggestions.length > 0) {
            data.user_experience.suggestions.forEach(suggestion => {
                const li = document.createElement('li');
                li.textContent = suggestion;
                uxSuggestionsList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = translations['noUxSuggestions'];
            uxSuggestionsList.appendChild(li);
        }

        // AI Content Insights
        const aiContentInsightsSection = document.getElementById('ai-content-insights-section');
        const aiContentInsightsText = document.getElementById('ai-content-insights-text');
        if (data.ai_insights && data.ai_insights.content_originality_tone) {
            aiContentInsightsText.textContent = data.ai_insights.content_originality_tone;
            aiContentInsightsSection.classList.remove('hidden');
        } else {
            aiContentInsightsText.textContent = translations['aiFeatureLimited'];
            aiContentInsightsSection.classList.remove('hidden'); // Still show with message
        }

        // AdSense Readiness
        const adsenseReadinessSection = document.getElementById('adsense-readiness-section');
        const adsenseAssessmentText = document.getElementById('adsense-assessment-text');
        const adsenseImprovementAreasList = document.getElementById('adsense-improvement-areas-list');
        adsenseImprovementAreasList.innerHTML = '';

        if (data.adsense_readiness && data.adsense_readiness.assessment) {
            adsenseAssessmentText.textContent = data.adsense_readiness.assessment;
            if (data.adsense_readiness.improvement_areas && data.adsense_readiness.improvement_areas.length > 0) {
                data.adsense_readiness.improvement_areas.forEach(area => {
                    const li = document.createElement('li');
                    li.textContent = area;
                    adsenseImprovementAreasList.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.textContent = translations['noAdsenseImprovements'];
                adsenseImprovementAreasList.appendChild(li);
            }
            adsenseReadinessSection.classList.remove('hidden');
        } else {
            adsenseAssessmentText.textContent = translations['aiFeatureLimited'];
            const li = document.createElement('li');
            li.textContent = translations['noAdsenseImprovements'];
            adsenseImprovementAreasList.appendChild(li);
            adsenseReadinessSection.classList.remove('hidden'); // Still show with message
        }

        // AI Overall Summary
        const aiSummarySection = document.getElementById('ai-summary-section');
        const aiSummaryText = document.getElementById('ai-summary-text');
        if (data.ai_insights && data.ai_insights.summary) {
            aiSummaryText.textContent = data.ai_insights.summary;
            aiSummarySection.classList.remove('hidden');
        } else {
            aiSummaryText.textContent = translations['aiFeatureLimited'];
            aiSummarySection.classList.remove('hidden'); // Still show with message
        }
    }

    function updateScoreDisplay(elementIdPrefix, score) {
        const scoreTextElement = document.getElementById(`${elementIdPrefix}-text`);
        const progressBar = document.getElementById(`${elementIdPrefix}-progress`);

        let text = '';
        let progressColorClass = '';
        let progressWidth = 0;

        const scoreInt = parseInt(score);

        if (score === 'N/A' || isNaN(scoreInt)) {
            text = translations['domainAuthorityApiLimit']; // Generic message for N/A scores
            progressColorClass = 'bg-gray-400';
            progressWidth = 100; // Full bar for N/A to indicate data not available
        } else {
            progressWidth = scoreInt;
            if (scoreInt >= 80) {
                text = translations['goodText'] || 'Good';
                progressColorClass = 'bg-green-500';
            } else if (scoreInt >= 50) {
                text = translations['fairText'] || 'Fair';
                progressColorClass = 'bg-yellow-500';
            } else {
                text = translations['poorText'] || 'Poor';
                progressColorClass = 'bg-red-500';
            }
        }

        scoreTextElement.textContent = text;
        progressBar.style.width = `${progressWidth}%`;
        progressBar.className = `h-2.5 rounded-full ${progressColorClass}`;
    }

    // Toggle section content visibility
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            const targetContent = document.getElementById(targetId);
            const icon = button.querySelector('.toggle-icon');

            if (targetContent.classList.contains('hidden')) {
                targetContent.classList.remove('hidden');
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            } else {
                targetContent.classList.add('hidden');
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            }
        });
    });

    expandAllButton.addEventListener('click', () => {
        document.querySelectorAll('.section-content').forEach(content => {
            content.classList.remove('hidden');
        });
        document.querySelectorAll('.toggle-icon').forEach(icon => {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        });
    });

    collapseAllButton.addEventListener('click', () => {
        document.querySelectorAll('.section-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.querySelectorAll('.toggle-icon').forEach(icon => {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        });
    });

    // AI Tools Functionality
    // Trigger auth modal if not logged in for AI tools
    rewriteSeoButton.addEventListener('click', () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            showAuthModal('login', () => aiRewriteSeo()); // Pass function to execute after login
        } else {
            aiRewriteSeo();
        }
    });

    refineContentButton.addEventListener('click', () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            showAuthModal('login', () => aiRefineContent()); // Pass function to execute after login
        } else {
            aiRefineContent();
        }
    });

    async function aiRewriteSeo() {
        const token = localStorage.getItem('authToken');
        if (!token) { // Should be logged in by now if modal was shown
            alert(translations['runAnalysisFirst']);
            return;
        }
        if (!currentAnalysisResults || !currentAnalysisResults.seo_quality || !currentAnalysisResults.seo_quality.elements) {
            alert(translations['runAnalysisFirst']);
            return;
        }

        rewriteSeoOutput.classList.remove('hidden');
        rewriteSeoOutput.innerHTML = `<p>${translations['loadingAiRewrites']}</p>`;

        const title = currentAnalysisResults.seo_quality.elements.title || '';
        const metaDescription = currentAnalysisResults.seo_quality.elements.meta_description || '';
        const keywords = Object.keys(currentAnalysisResults.seo_quality.elements.keyword_density || {}).join(', ');

        try {
            const response = await fetch(`${backendBaseUrl}/ai_rewrite_seo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept-Language': currentLang
                },
                body: JSON.stringify({ title, meta_description: metaDescription, keywords })
            });

            const data = await response.json();
            if (response.ok) {
                let outputHtml = `<h4 class="text-lg font-medium mb-2">${translations['aiRewritesTitle']}</h4>`;
                if (data.titles && data.titles.length > 0) {
                    outputHtml += `<p><strong>${translations['newTitles']}</strong></p><ul class="list-disc list-inside ml-4">`;
                    data.titles.forEach(t => outputHtml += `<li>${t}</li>`);
                    outputHtml += `</ul>`;
                }
                if (data.meta_descriptions && data.meta_descriptions.length > 0) {
                    outputHtml += `<p class="mt-2"><strong>${translations['newMetaDescriptions']}</strong></p><ul class="list-disc list-inside ml-4">`;
                    data.meta_descriptions.forEach(md => outputHtml += `<li>${md}</li>`);
                    outputHtml += `</ul>`;
                }
                if (!data.titles.length && !data.meta_descriptions.length) {
                    outputHtml += `<p>${translations['noAiRewritesAvailable']}</p>`;
                }
                rewriteSeoOutput.innerHTML = outputHtml;
            } else {
                rewriteSeoOutput.innerHTML = `<p class="text-red-600">${translations['aiRewriteFailed']}: ${data.error || translations['pleaseTryAgain']}</p>`;
            }
        } catch (error) {
            console.error('AI Rewrite SEO error:', error);
            rewriteSeoOutput.innerHTML = `<p class="text-red-600">${translations['aiRewriteFailed']}: ${translations['networkError']}</p>`;
        }
    }

    async function aiRefineContent() {
        const token = localStorage.getItem('authToken');
        if (!token) { // Should be logged in by now if modal was shown
            alert(translations['runAnalysisFirst']);
            return;
        }
        if (!currentAnalysisResults || !currentAnalysisResults.extracted_text_sample) {
            alert(translations['noContentForRefinement']);
            return;
        }

        refineContentOutput.classList.remove('hidden');
        refineContentOutput.innerHTML = `<p>${translations['loadingAiRefinement']}</p>`;

        const textSample = currentAnalysisResults.extracted_text_sample;

        try {
            const response = await fetch(`${backendBaseUrl}/ai_refine_content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept-Language': currentLang
                },
                body: JSON.stringify({ text_sample: textSample })
            });

            const data = await response.json();
            if (response.ok) {
                let outputHtml = `<h4 class="text-lg font-medium mb-2">${translations['aiRefinementTitle']}</h4>`;
                if (data.refined_text) {
                    outputHtml += `<p><strong>${translations['refinedText']}</strong></p><p>${data.refined_text}</p>`;
                }
                if (data.suggestions && data.suggestions.length > 0) {
                    outputHtml += `<p class="mt-2"><strong>${translations['refinementSuggestions']}</strong></p><ul class="list-disc list-inside ml-4">`;
                    data.suggestions.forEach(s => outputHtml += `<li>${s}</li>`);
                    outputHtml += `</ul>`;
                }
                if (!data.refined_text && (!data.suggestions || !data.suggestions.length)) {
                    outputHtml += `<p>${translations['noAiRefinementAvailable']}</p>`;
                }
                refineContentOutput.innerHTML = outputHtml;
            } else {
                refineContentOutput.innerHTML = `<p class="text-red-600">${translations['aiRefinementFailed']}: ${data.error || translations['pleaseTryAgain']}</p>`;
            }
        } catch (error) {
            console.error('AI Refine Content error:', error);
            refineContentOutput.innerHTML = `<p class="text-red-600">${translations['aiRefinementFailed']}: ${translations['networkError']}</p>`;
        }
    }
});
