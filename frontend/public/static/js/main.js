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
    const facebookProvider = new firebase.auth.FacebookAuthProvider();

    const websiteUrlInput = document.getElementById('website-url');
    const analyzeButton = document.getElementById('analyze-button');
    const errorMessage = document.getElementById('error-message');
    const loadingSpinner = document.getElementById('loading-spinner');
    const resultsDashboard = document.getElementById('results-dashboard');
    const analyzedUrlSpan = document.getElementById('analyzed-url');
    const analyzeAnotherButton = document.getElementById('analyze-another-button');
    const exportPdfButton = document.getElementById('export-pdf-button');

    // Auth UI elements
    const authSection = document.getElementById('auth-section');
    const authEmailInput = document.getElementById('auth-email');
    const authPasswordInput = document.getElementById('auth-password');
    const authSubmitButton = document.getElementById('auth-submit-button');
    const authFormTitle = document.getElementById('auth-form-title');
    const authErrorMessage = document.getElementById('auth-error-message');
    const authLoadingSpinner = document.getElementById('auth-loading-spinner');
    const switchAuthButton = document.getElementById('switch-auth-button');
    const switchAuthText = document.getElementById('switch-auth-text');
    const userEmailDisplay = document.getElementById('user-email-display');
    const notLoggedInMessage = document.getElementById('not-logged-in-message');
    const logoutButton = document.getElementById('logout-button');
    const authButtonsContainer = document.getElementById('auth-buttons-container');
    const showLoginButton = document.getElementById('show-login-button');
    const showRegisterButton = document.getElementById('show-register-button');
    const googleLoginButton = document.getElementById('google-login-button');
    const facebookLoginButton = document.getElementById('facebook-login-button');


    let currentAuthMode = 'login'; // 'login' or 'register'
    let currentAnalysisResults = null; // To store results for PDF export

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
        // Update specific button texts that change based on auth mode
        if (currentAuthMode === 'login') {
            authSubmitButton.textContent = translations['loginButton'];
            switchAuthButton.textContent = translations['registerHereButton'];
            switchAuthText.textContent = translations['noAccountText'];
            authFormTitle.textContent = translations['loginTitle'];
        } else {
            authSubmitButton.textContent = translations['registerButton'];
            switchAuthButton.textContent = translations['loginHereButton'];
            switchAuthText.textContent = translations['haveAccountText'];
            authFormTitle.textContent = translations['registerTitle'];
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

    // Auth UI Logic
    function updateAuthUI() {
        const token = localStorage.getItem('authToken');
        const email = localStorage.getItem('userEmail');

        if (token && email) {
            userEmailDisplay.textContent = email;
            userEmailDisplay.classList.remove('hidden');
            notLoggedInMessage.classList.add('hidden');
            logoutButton.classList.remove('hidden');
            authButtonsContainer.classList.add('hidden');
            authSection.classList.add('hidden'); // Hide auth form
            inputSection.classList.remove('hidden'); // Show analysis form
        } else {
            userEmailDisplay.textContent = '';
            userEmailDisplay.classList.add('hidden');
            notLoggedInMessage.classList.remove('hidden');
            logoutButton.classList.add('hidden');
            authButtonsContainer.classList.remove('hidden');
            authSection.classList.remove('hidden'); // Show auth form by default if not logged in
            inputSection.classList.add('hidden'); // Hide analysis form
            resultsDashboard.classList.add('hidden'); // Hide results if not logged in
        }
    }

    showLoginButton.addEventListener('click', () => {
        currentAuthMode = 'login';
        authFormTitle.textContent = translations['loginTitle'];
        authSubmitButton.textContent = translations['loginButton'];
        switchAuthButton.textContent = translations['registerHereButton'];
        switchAuthText.textContent = translations['noAccountText'];
        authErrorMessage.classList.add('hidden');
    });

    showRegisterButton.addEventListener('click', () => {
        currentAuthMode = 'register';
        authFormTitle.textContent = translations['registerTitle'];
        authSubmitButton.textContent = translations['registerButton'];
        switchAuthButton.textContent = translations['loginHereButton'];
        switchAuthText.textContent = translations['haveAccountText'];
        authErrorMessage.classList.add('hidden');
    });

    switchAuthButton.addEventListener('click', () => {
        currentAuthMode = currentAuthMode === 'login' ? 'register' : 'login';
        applyTranslations(); // Re-apply translations to update button texts
        authErrorMessage.classList.add('hidden');
    });

    authSubmitButton.addEventListener('click', async () => {
        const email = authEmailInput.value;
        const password = authPasswordInput.value;

        if (!email || !password) {
            authErrorMessage.textContent = translations['emailPasswordRequired'];
            authErrorMessage.classList.remove('hidden');
            return;
        }

        authLoadingSpinner.classList.remove('hidden');
        authErrorMessage.classList.add('hidden');

        try {
            let response;
            if (currentAuthMode === 'register') {
                response = await fetch(`${authBaseUrl}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
            } else { // login (email/password)
                // This part is for direct backend login, which is less secure.
                // The recommended Firebase flow is for client-side SDK to handle login
                // and then send the ID token to the backend.
                // For now, we'll keep it as a simple backend call.
                response = await fetch(`${authBaseUrl}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
            }

            const data = await response.json();
            if (response.ok) {
                if (currentAuthMode === 'login') {
                    // For email/password login, the backend returns a custom token.
                    // We need to sign in with this custom token on the client-side
                    // to get an ID token for subsequent requests.
                    const userCredential = await auth.signInWithCustomToken(data.token);
                    const idToken = await userCredential.user.getIdToken();
                    localStorage.setItem('authToken', idToken);
                    localStorage.setItem('userEmail', data.email);
                    updateAuthUI();
                    authSection.classList.add('hidden');
                    inputSection.classList.remove('hidden');
                } else { // registered
                    authErrorMessage.textContent = translations['registrationSuccess'];
                    authErrorMessage.classList.remove('hidden');
                    currentAuthMode = 'login'; // Switch to login after successful registration
                    applyTranslations();
                }
            } else {
                authErrorMessage.textContent = data.error || translations['authFailed'];
                authErrorMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Auth error:', error);
            authErrorMessage.textContent = translations['networkErrorAuth'];
            authErrorMessage.classList.remove('hidden');
        } finally {
            authLoadingSpinner.classList.add('hidden');
        }
    });

    // Social Login Handlers
    async function handleSocialLogin(provider) {
        authLoadingSpinner.classList.remove('hidden');
        authErrorMessage.classList.add('hidden');
        try {
            const result = await auth.signInWithPopup(provider);
            const idToken = await result.user.getIdToken();

            // Send ID token to backend for verification and Firestore update
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
                authSection.classList.add('hidden');
                inputSection.classList.remove('hidden');
            } else {
                authErrorMessage.textContent = data.error || translations['authFailed'];
                authErrorMessage.classList.remove('hidden');
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
            authErrorMessage.textContent = displayError;
            authErrorMessage.classList.remove('hidden');
        } finally {
            authLoadingSpinner.classList.add('hidden');
        }
    }

    googleLoginButton.addEventListener('click', () => handleSocialLogin(googleProvider));
    facebookLoginButton.addEventListener('click', () => handleSocialLogin(facebookProvider));


    logoutButton.addEventListener('click', async () => {
        try {
            await auth.signOut(); // Sign out from Firebase client-side
            localStorage.removeItem('authToken');
            localStorage.removeItem('userEmail');
            currentAnalysisResults = null; // Clear previous analysis
            updateAuthUI();
            inputSection.classList.add('hidden'); // Ensure analysis section is hidden until logged in
            resultsDashboard.classList.add('hidden'); // Hide results
            websiteUrlInput.value = ''; // Clear URL input
        } catch (error) {
            console.error('Logout error:', error);
            alert(translations['logoutFailed']);
        }
    });

    // Initial auth UI update on page load
    // Listen for Firebase auth state changes to keep UI in sync
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // User is signed in. Get ID token and update UI.
            const idToken = await user.getIdToken();
            localStorage.setItem('authToken', idToken);
            localStorage.setItem('userEmail', user.email || user.displayName || translations['unknownUser']);
        } else {
            // User is signed out. Clear local storage.
            localStorage.removeItem('authToken');
            localStorage.removeItem('userEmail');
        }
        updateAuthUI();
    });


    // Analysis Logic
    analyzeButton.addEventListener('click', analyzeWebsite);
    analyzeAnotherButton.addEventListener('click', () => {
        resultsDashboard.classList.add('hidden');
        inputSection.classList.remove('hidden');
        websiteUrlInput.value = '';
        errorMessage.classList.add('hidden');
        currentAnalysisResults = null;
    });

    exportPdfButton.addEventListener('click', async () => {
        if (!currentAnalysisResults) {
            alert(translations['noAnalysisResults']);
            return;
        }

        exportPdfButton.textContent = translations['generatingPdf'];
        exportPdfButton.disabled = true;

        const token = localStorage.getItem('authToken');
        if (!token) {
            alert(translations['runAnalysisFirst']); // Should not happen if UI is correct
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
    });

    async function analyzeWebsite() {
        const url = websiteUrlInput.value;
        const token = localStorage.getItem('authToken');

        if (!token) {
            errorMessage.textContent = translations['runAnalysisFirst']; // Or "Please log in to analyze"
            errorMessage.classList.remove('hidden');
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
                inputSection.classList.add('hidden');
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
    rewriteSeoButton.addEventListener('click', async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
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
    });

    refineContentButton.addEventListener('click', async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
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
    });
});
