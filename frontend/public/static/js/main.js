// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    // Dynamically get the backend base URL from the current window's origin
    const backendBaseUrl = window.location.origin;
    const authBaseUrl = backendBaseUrl; // Authentication requests also go to the backend

    // Firebase configuration - IMPORTANT: Replace with your actual Firebase project config
    // You can find this in your Firebase project settings -> Project settings -> General -> Your apps -> Web app -> Firebase SDK snippet -> Config
    const firebaseConfig = {
        apiKey: "AIzaSyBn0rlzoqgvZhasfHpnkfpEzV2X1kYKDBs", // مفتاح API الخاص بك
        authDomain: "message-oxabite.firebaseapp.com", // نطاق المصادقة الخاص بك
        projectId: "message-oxabite", // معرف المشروع الخاص بك
        storageBucket: "message-oxabite.firebasestorage.app", // سلة التخزين الخاصة بك
        messagingSenderId: "283151112955", // معرف مرسل الرسائل الخاص بك
        appId: "1:283151112955:web:4f715cd8fc188ebfb8ee5e" // معرف التطبيق الخاص بك
        // measurementId: "G-K8BLEDEXFC" // هذا اختياري وغير ضروري لتهيئة SDK الأساسية
    };

    // Initialize Firebase if it hasn't been initialized already
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const auth = firebase.auth(); // Get the Firebase Auth service
    const googleProvider = new firebase.auth.GoogleAuthProvider(); // Google Auth Provider

    // Get references to various HTML elements by their IDs
    const websiteUrlInput = document.getElementById('website-url');
    const analyzeButton = document.getElementById('analyze-button');
    const errorMessage = document.getElementById('error-message');
    const loadingSpinner = document.getElementById('loading-spinner');
    const resultsDashboard = document.getElementById('results-dashboard');
    const analyzedUrlSpan = document.getElementById('analyzed-url');
    const analyzeAnotherButton = document.getElementById('analyze-another-button');
    const exportPdfButton = document.getElementById('export-pdf-button');

    // Main navigation buttons
    const analyzeWebsiteMainButton = document.getElementById('analyze-website-main-button');
    const articleAnalyzerLink = document.querySelector('a[href="/article_analyzer.html"]');

    // Authentication status display elements
    const userEmailDisplay = document.getElementById('user-email-display');
    const notLoggedInMessage = document.getElementById('not-logged-in-message');
    const logoutButton = document.getElementById('logout-button');
    const authButtonsContainer = document.getElementById('auth-buttons-container');
    const showAuthModalButton = document.getElementById('show-auth-modal-button');

    // Authentication modal elements
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

    let currentAuthMode = 'login'; // Tracks the current mode of the auth modal ('login' or 'register')
    let currentAnalysisResults = null; // Stores the last analysis results for PDF export and AI tools
    let actionAfterAuth = null; // Stores a function to be executed after successful authentication

    // Language and Theme elements
    const languageSelect = document.getElementById('language-select');
    const themeToggle = document.getElementById('theme-toggle');
    let translations = {}; // Object to hold loaded translations
    let currentLang = 'en'; // Default language

    // Toggle sections functionality
    const toggleButtons = document.querySelectorAll('.toggle-section');
    const expandAllButton = document.getElementById('expand-all-button');
    const collapseAllButton = document.getElementById('collapse-all-button');

    // AI Tools buttons and output areas
    const rewriteSeoButton = document.getElementById('rewrite-seo-button');
    const refineContentButton = document.getElementById('refine-content-button');
    const rewriteSeoOutput = document.getElementById('rewrite-seo-output');
    const refineContentOutput = document.getElementById('refine-content-output');

    /**
     * Loads translations for the specified language from a JSON file.
     * @param {string} lang - The language code (e.g., 'en', 'ar', 'fr').
     */
    async function loadTran slations(lang) {
        try {
            // Updated path for locales
            const response = await fetch(`/static/locales/${lang}.json`);
            translations = await response.json();
            applyTranslations(); // Apply translations after loading
        } catch (error) {
            console.error('Error loading translations:', error);
        }
    }

    /**
     * Applies the loaded translations to all elements with `data-translate` attribute.
     */
    function applyTranslations() {
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.dataset.translate;
            if (translations[key]) {
                element.textContent = translations[key];
            }
        });
        // Update specific modal texts that change based on the current authentication mode
        if (currentAuthMode === 'login') {
            modalAuthSubmitButton.textContent = translations['loginButton'];
            modalSwitchAuthButton.textContent = translations['registerHereButton'];
            modalSwitchAuthText.textContent = translations['noAccountText'];
            modalAuthFormTitle.textContent = translations['loginTitle'];
            modalAuthPrompt.textContent = translations['loginToContinue'];
        } else {
            modalAuthSubmitButton.textContent = translations['registerButton'];
            modalSwitchAuthButton.textContent = translations['loginHereButton'];
            modalSwitchAuthText.textContent = translations['haveAccountText'];
            modalAuthFormTitle.textContent = translations['registerTitle'];
            modalAuthPrompt.textContent = translations['loginToContinue']; // Same prompt for both
        }
    }

    /**
     * Applies the selected theme (light or dark) to the body and saves it to local storage.
     * @param {string} theme - 'light' or 'dark'.
     */
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }

    // Event listener for theme toggle button
    themeToggle.addEventListener('click', () => {
        const currentTheme = localStorage.getItem('theme') || 'light';
        applyTheme(currentTheme === 'light' ? 'dark' : 'light');
    });

    // Event listener for language selection dropdown
    languageSelect.addEventListener('change', (event) => {
        currentLang = event.target.value;
        localStorage.setItem('language', currentLang); // Save selected language
        loadTranslations(currentLang); // Load and apply new translations
    });

    // Initial setup: apply saved theme and load saved language translations
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    currentLang = localStorage.getItem('language') || 'en';
    languageSelect.value = currentLang; // Set dropdown to saved language
    loadTranslations(currentLang); // Load translations for the current language

    /**
     * Displays the authentication modal.
     * @param {string} mode - 'login' or 'register'.
     * @param {Function} [callback] - An optional function to execute after successful authentication.
     */
    function showAuthModal(mode = 'login', callback = null) {
        currentAuthMode = mode;
        actionAfterAuth = callback; // Store the action to perform after successful auth
        modalAuthEmailInput.value = ''; // Clear email input
        modalAuthPasswordInput.value = ''; // Clear password input
        modalAuthErrorMessage.classList.add('hidden'); // Hide any previous error messages
        modalAuthLoadingSpinner.classList.add('hidden'); // Hide loading spinner
        applyTranslations(); // Update modal texts based on the current mode
        authModal.classList.remove('hidden'); // Show the modal
    }

    /**
     * Hides the authentication modal.
     */
    function hideAuthModal() {
        authModal.classList.add('hidden'); // Hide the modal
        actionAfterAuth = null; // Clear the stored action
    }

    // Event listeners for showing/hiding the auth modal
    showAuthModalButton.addEventListener('click', () => showAuthModal('login'));
    closeAuthModalButton.addEventListener('click', hideAuthModal);

    // Event listener for switching between login and register modes in the modal
    modalSwitchAuthButton.addEventListener('click', () => {
        currentAuthMode = currentAuthMode === 'login' ? 'register' : 'login';
        applyTranslations(); // Re-apply translations to update modal texts
        modalAuthErrorMessage.classList.add('hidden'); // Hide error message when switching modes
    });

    // Event listener for the main submit button in the auth modal (Login/Register)
    modalAuthSubmitButton.addEventListener('click', async () => {
        const email = modalAuthEmailInput.value;
        const password = modalAuthPasswordInput.value;

        // Validate inputs
        if (!email || !password) {
            modalAuthErrorMessage.textContent = translations['emailPasswordRequired'];
            modalAuthErrorMessage.classList.remove('hidden');
            return;
        }

        modalAuthLoadingSpinner.classList.remove('hidden'); // Show loading spinner
        modalAuthErrorMessage.classList.add('hidden'); // Hide error message

        try {
            let response;
            if (currentAuthMode === 'register') {
                // Send registration request to backend
                response = await fetch(`${authBaseUrl}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
            } else { // currentAuthMode === 'login'
                // Send login request to backend
                response = await fetch(`${authBaseUrl}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
            }

            const data = await response.json(); // Parse JSON response
            if (response.ok) {
                if (currentAuthMode === 'login') {
                    // If login successful, sign in with custom token from backend
                    const userCredential = await auth.signInWithCustomToken(data.token);
                    const idToken = await userCredential.user.getIdToken(); // Get Firebase ID token
                    localStorage.setItem('authToken', idToken); // Store token
                    localStorage.setItem('userEmail', data.email); // Store user email
                    updateAuthUI(); // Update UI to reflect logged-in state
                    hideAuthModal(); // Hide modal
                    if (actionAfterAuth) {
                        actionAfterAuth(); // Execute any stored action (e.g., re-run analysis)
                    }
                } else { // Registration successful
                    modalAuthErrorMessage.textContent = translations['registrationSuccess'];
                    modalAuthErrorMessage.classList.remove('hidden');
                    currentAuthMode = 'login'; // Switch to login mode after successful registration
                    applyTranslations(); // Update modal texts
                }
            } else {
                // Display error message from backend
                modalAuthErrorMessage.textContent = data.error || translations['authFailed'];
                modalAuthErrorMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Auth error:', error);
            modalAuthErrorMessage.textContent = translations['networkErrorAuth']; // Generic network error
            modalAuthErrorMessage.classList.remove('hidden');
        } finally {
            modalAuthLoadingSpinner.classList.add('hidden'); // Hide loading spinner
        }
    });

    /**
     * Handles social login (e.g., Google).
     * @param {firebase.auth.AuthProvider} provider - The Firebase authentication provider.
     */
    async function handleSocialLogin(provider) {
        modalAuthLoadingSpinner.classList.remove('hidden'); // Show loading spinner
        modalAuthErrorMessage.classList.add('hidden'); // Hide error message
        try {
            const result = await auth.signInWithPopup(provider); // Sign in with popup
            const idToken = await result.user.getIdToken(); // Get Firebase ID token

            // Send ID token to backend for verification and user data storage
            const response = await fetch(`${authBaseUrl}/verify_id_token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken: idToken })
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('authToken', idToken); // Store token
                localStorage.setItem('userEmail', result.user.email); // Store user email
                updateAuthUI(); // Update UI
                hideAuthModal(); // Hide modal
                if (actionAfterAuth) {
                    actionAfterAuth(); // Execute stored action
                }
            } else {
                modalAuthErrorMessage.textContent = data.error || translations['authFailed'];
                modalAuthErrorMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Social login error:', error);
            let displayError = translations['authFailed'];
            // Provide more specific error messages for common Firebase auth errors
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
            modalAuthLoadingSpinner.classList.add('hidden'); // Hide loading spinner
        }
    }

    // Event listener for Google login button
    modalGoogleLoginButton.addEventListener('click', () => handleSocialLogin(googleProvider));

    // Event listener for logout button
    logoutButton.addEventListener('click', async () => {
        try {
            await auth.signOut(); // Sign out from Firebase client-side
            localStorage.removeItem('authToken'); // Remove token from local storage
            localStorage.removeItem('userEmail'); // Remove email from local storage
            currentAnalysisResults = null; // Clear any previous analysis results
            updateAuthUI(); // Update UI to reflect logged-out state
            websiteUrlInput.value = ''; // Clear URL input field
            resultsDashboard.classList.add('hidden'); // Hide the results dashboard
        } catch (error) {
            console.error('Logout error:', error);
            alert(translations['logoutFailed']); // Alert user about logout failure
        }
    });

    // Firebase authentication state observer: updates UI when user's login status changes
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // If user is logged in, get their ID token and store it
            const idToken = await user.getIdToken();
            localStorage.setItem('authToken', idToken);
            localStorage.setItem('userEmail', user.email || user.displayName || translations['unknownUser']);
        } else {
            // If user is logged out, remove token and email from local storage
            localStorage.removeItem('authToken');
            localStorage.removeItem('userEmail');
        }
        updateAuthUI(); // Update the UI based on the current auth state
    });

    /**
     * Updates the UI elements related to authentication status.
     */
    function updateAuthUI() {
        const token = localStorage.getItem('authToken');
        const email = localStorage.getItem('userEmail');

        if (token && email) {
            // If logged in, show user email and logout button, hide login/register buttons
            userEmailDisplay.textContent = email;
            userEmailDisplay.classList.remove('hidden');
            notLoggedInMessage.classList.add('hidden');
            logoutButton.classList.remove('hidden');
            authButtonsContainer.classList.add('hidden');
        } else {
            // If logged out, hide user email and logout button, show login/register buttons
            userEmailDisplay.textContent = '';
            userEmailDisplay.classList.add('hidden');
            notLoggedInMessage.classList.remove('hidden');
            logoutButton.classList.add('hidden');
            authButtonsContainer.classList.remove('hidden');
        }
    }

    // Event listener for the main "Analyze" button
    analyzeButton.addEventListener('click', analyzeWebsite);

    // Event listener for "Analyze Another" button
    analyzeAnotherButton.addEventListener('click', () => {
        resultsDashboard.classList.add('hidden'); // Hide results
        websiteUrlInput.value = ''; // Clear URL input
        errorMessage.classList.add('hidden'); // Hide error messages
        currentAnalysisResults = null; // Clear stored analysis results
        // Also collapse all sections for a clean slate
        document.querySelectorAll('.section-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.querySelectorAll('.toggle-icon').forEach(icon => {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        });
    });

    // Event listener for "Export PDF Report" button
    exportPdfButton.addEventListener('click', () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            // If not logged in, show auth modal and set callback to export PDF after login
            showAuthModal('login', () => exportPdfReport());
        } else {
            exportPdfReport(); // If logged in, proceed directly to export
        }
    });

    /**
     * Handles the PDF report generation and download.
     */
    async function exportPdfReport() {
        if (!currentAnalysisResults) {
            alert(translations['noAnalysisResults']); // Alert if no analysis has been performed
            return;
        }

        exportPdfButton.textContent = translations['generatingPdf']; // Update button text
        exportPdfButton.disabled = true; // Disable button during process

        const token = localStorage.getItem('authToken');
        if (!token) {
            // This case should ideally not be reached if showAuthModal works correctly
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
                    'Authorization': `Bearer ${token}`, // Send auth token
                    'Accept-Language': currentLang // Send current language
                },
                body: JSON.stringify({ url: analyzedUrlSpan.textContent }) // Send analyzed URL
            });

            if (response.ok) {
                const blob = await response.blob(); // Get response as a Blob
                const url = window.URL.createObjectURL(blob); // Create a URL for the Blob
                const a = document.createElement('a'); // Create a temporary anchor element
                a.href = url;
                // Set download filename based on the analyzed URL
                a.download = `${analyzedUrlSpan.textContent.replace(/[^a-z0-9]/gi, '_')}_analysis_report.pdf`;
                document.body.appendChild(a);
                a.click(); // Programmatically click the link to trigger download
                a.remove(); // Remove the temporary link
                window.URL.revokeObjectURL(url); // Release the Blob URL
            } else {
                const errorData = await response.json(); // Parse error response
                alert(`${translations['pdfExportFailed']}: ${errorData.error || translations['pleaseTryAgain']}`);
            }
        } catch (error) {
            console.error('PDF export error:', error);
            alert(`${translations['pdfExportFailed']}: ${translations['networkError']}`);
        } finally {
            exportPdfButton.textContent = translations['exportPdfButton']; // Restore button text
            exportPdfButton.disabled = false; // Re-enable button
        }
    }

    /**
     * Initiates the website analysis process.
     */
    async function analyzeWebsite() {
        const url = websiteUrlInput.value;
        const token = localStorage.getItem('authToken');

        if (!token) {
            // If user is not logged in, show auth modal and re-run analysis after login
            showAuthModal('login', () => analyzeWebsite());
            return;
        }

        if (!url) {
            errorMessage.textContent = translations['pleaseEnterUrl'];
            errorMessage.classList.remove('hidden');
            return;
        }

        errorMessage.classList.add('hidden'); // Hide error messages
        loadingSpinner.classList.remove('hidden'); // Show loading spinner
        resultsDashboard.classList.add('hidden'); // Hide previous results
        currentAnalysisResults = null; // Clear previous results

        try {
            const response = await fetch(`${backendBaseUrl}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Send auth token
                    'Accept-Language': currentLang // Send current language
                },
                body: JSON.stringify({ url: url }) // Send URL for analysis
            });

            if (response.ok) {
                const data = await response.json(); // Parse analysis results
                currentAnalysisResults = data; // Store results
                displayResults(data, url); // Display results on dashboard
                resultsDashboard.classList.remove('hidden'); // Show results dashboard
            } else {
                const errorData = await response.json(); // Parse error response
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
            loadingSpinner.classList.add('hidden'); // Hide loading spinner
        }
    }

    /**
     * Displays the analysis results on the dashboard.
     * @param {object} data - The analysis results data.
     * @param {string} url - The URL that was analyzed.
     */
    function displayResults(data, url) {
        analyzedUrlSpan.textContent = url; // Display analyzed URL

        // Domain Authority Section
        const daScore = data.domain_authority.domain_authority_score;
        document.getElementById('domain-name').textContent = data.domain_authority.domain;
        document.getElementById('domain-authority-score').textContent = daScore !== 'N/A' ? daScore : translations['notAvailable'];
        updateScoreDisplay('domain-authority', daScore); // Update score bar and text
        document.getElementById('domain-age').textContent = data.domain_authority.domain_age_years !== 'N/A' ? `${data.domain_authority.domain_age_years} ${translations['yearsText']}` : translations['notAvailable'];
        document.getElementById('ssl-status').textContent = data.domain_authority.ssl_status;
        document.getElementById('blacklist-status').textContent = data.domain_authority.blacklist_status;
        document.getElementById('dns-health').textContent = data.domain_authority.dns_health;

        // Page Speed Section
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

        // SEO Quality Section
        const seoOverallScore = data.seo_quality.score;
        document.getElementById('seo-overall-score').textContent = seoOverallScore !== 'N/A' ? seoOverallScore : translations['notAvailable'];
        updateScoreDisplay('seo-overall', seoOverallScore);
        document.getElementById('seo-title').textContent = data.seo_quality.elements.title || translations['notAvailable'];
        document.getElementById('seo-meta-description').textContent = data.seo_quality.elements.meta_description || translations['notAvailable'];
        document.getElementById('seo-broken-links').textContent = data.seo_quality.elements.broken_links ? data.seo_quality.elements.broken_links.length : translations['notAvailable'];
        document.getElementById('seo-missing-alt').textContent = data.seo_quality.elements.missing_alt_count !== undefined ? data.seo_quality.elements.missing_alt_count : translations['notAvailable'];
        document.getElementById('seo-internal-links').textContent = data.seo_quality.elements.internal_links_count || translations['notAvailable'];
        document.getElementById('seo-external-links').textContent = data.seo_quality.elements.external_links_count || translations['notAvailable'];

        // New SEO elements (Word Count, Char Count, Robots.txt, Sitemap.xml)
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
                .sort(([, a], [, b]) => b - a) // Sort by density descending
                .slice(0, 10); // Take top 10
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
            aiSeoSuggestionsSection.classList.remove('hidden'); // Still show with a message
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
            li.textContent = translations['noBrokenLinksFound'];
            brokenLinksList.appendChild(li);
            brokenLinksDetailsSection.classList.remove('hidden'); // Still show with a message
        }

        // Broken Links Fix Suggestions (AI)
        const brokenLinksFixSuggestionsSection = document.getElementById('broken-links-fix-suggestions-section');
        const brokenLinksFixSuggestionsText = document.getElementById('broken-links-fix-suggestions-text');
        if (data.broken_link_suggestions && data.broken_link_suggestions.suggestions) {
            brokenLinksFixSuggestionsText.textContent = data.broken_link_suggestions.suggestions;
            brokenLinksFixSuggestionsSection.classList.remove('hidden');
        } else {
            brokenLinksFixSuggestionsText.textContent = translations['aiFeatureLimited'];
            brokenLinksFixSuggestionsSection.classList.remove('hidden'); // Still show with a message
        }

        // User Experience Section
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
            aiContentInsightsSection.classList.remove('hidden'); // Still show with a message
        }

        // AdSense Readiness Section
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
            adsenseReadinessSection.classList.remove('hidden'); // Still show with a message
        }

        // AI Overall Summary Section
        const aiSummarySection = document.getElementById('ai-summary-section');
        const aiSummaryText = document.getElementById('ai-summary-text');
        if (data.ai_insights && data.ai_insights.summary) {
            aiSummaryText.textContent = data.ai_insights.summary;
            aiSummarySection.classList.remove('hidden');
        } else {
            aiSummaryText.textContent = translations['aiFeatureLimited'];
            aiSummarySection.classList.remove('hidden'); // Still show with a message
        }
    }

    /**
     * Updates the visual display of a score (progress bar and text).
     * @param {string} elementIdPrefix - The ID prefix for the score elements (e.g., 'domain-authority').
     * @param {number|string} score - The score value.
     */
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

    // Event listeners for expanding/collapsing sections
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

    // Event listener for "Expand All" button
    expandAllButton.addEventListener('click', () => {
        document.querySelectorAll('.section-content').forEach(content => {
            content.classList.remove('hidden');
        });
        document.querySelectorAll('.toggle-icon').forEach(icon => {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        });
    });

    // Event listener for "Collapse All" button
    collapseAllButton.addEventListener('click', () => {
        document.querySelectorAll('.section-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.querySelectorAll('.toggle-icon').forEach(icon => {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        });
    });

    // AI Tools Functionality (Rewrite SEO & Refine Content)

    // Event listener for "Rewrite Title/Meta Description" button
    rewriteSeoButton.addEventListener('click', () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            showAuthModal('login', () => aiRewriteSeo()); // Show modal if not logged in
        } else {
            aiRewriteSeo(); // Proceed if logged in
        }
    });

    // Event listener for "Refine Content" button
    refineContentButton.addEventListener('click', () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            showAuthModal('login', () => aiRefineContent()); // Show modal if not logged in
        } else {
            aiRefineContent(); // Proceed if logged in
        }
    });

    /**
     * Calls the backend AI service to rewrite SEO title/meta description.
     */
    async function aiRewriteSeo() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert(translations['runAnalysisFirst']); // Should be logged in by now
            return;
        }
        if (!currentAnalysisResults || !currentAnalysisResults.seo_quality || !currentAnalysisResults.seo_quality.elements) {
            alert(translations['runAnalysisFirst']);
            return;
        }

        rewriteSeoOutput.classList.remove('hidden');
        rewriteSeoOutput.innerHTML = `<p>${translations['loadingAiRewrites']}</p>`; // Show loading message

        const title = currentAnalysisResults.seo_quality.elements.title || '';
        const metaDescription = currentAnalysisResults.seo_quality.elements.meta_description || '';
        // Join top keywords for AI context
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
                rewriteSeoOutput.innerHTML = outputHtml; // Display AI rewrites
            } else {
                rewriteSeoOutput.innerHTML = `<p class="text-red-600">${translations['aiRewriteFailed']}: ${data.error || translations['pleaseTryAgain']}</p>`;
            }
        } catch (error) {
            console.error('AI Rewrite SEO error:', error);
            rewriteSeoOutput.innerHTML = `<p class="text-red-600">${translations['aiRewriteFailed']}: ${translations['networkError']}</p>`;
        }
    }

    /**
     * Calls the backend AI service to refine content.
     */
    async function aiRefineContent() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert(translations['runAnalysisFirst']); // Should be logged in by now
            return;
        }
        if (!currentAnalysisResults || !currentAnalysisResults.extracted_text_sample) {
            alert(translations['noContentForRefinement']);
            return;
        }

        refineContentOutput.classList.remove('hidden');
        refineContentOutput.innerHTML = `<p>${translations['loadingAiRefinement']}</p>`; // Show loading message

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
                refineContentOutput.innerHTML = outputHtml; // Display AI refinement
            } else {
                refineContentOutput.innerHTML = `<p class="text-red-600">${translations['aiRefinementFailed']}: ${data.error || translations['pleaseTryAgain']}</p>`;
            }
        } catch (error) {
            console.error('AI Refine Content error:', error);
            refineContentOutput.innerHTML = `<p class="text-red-600">${translations['aiRefinementFailed']}: ${translations['networkError']}</p>`;
        }
    }
});
