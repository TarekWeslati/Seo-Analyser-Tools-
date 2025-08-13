// main.js: The core logic for the Website & Article Analyzer front-end.
// It handles authentication, UI state, API calls, and displaying results.

// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // Firebase & App Initialization
    // =========================================================================

    // Dynamically get the backend base URL from the current window's origin
    const backendBaseUrl = window.location.origin;

    // Firebase configuration - IMPORTANT: Replace with your actual Firebase project config
    // You can find this in your Firebase project settings -> Project settings -> General -> Your apps -> Web app -> Firebase SDK snippet -> Config
    // This is a placeholder configuration.
    const firebaseConfig = {
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_AUTH_DOMAIN",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_STORAGE_BUCKET",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID"
    };
    
    // Check if Firebase is already initialized
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const auth = firebase.auth();
    const db = firebase.firestore();

    // =========================================================================
    // DOM Elements & State
    // =========================================================================

    const websiteAnalyzerForm = document.getElementById('website-analyzer-form');
    const articleAnalyzerForm = document.getElementById('article-analyzer-form');
    const urlInput = document.getElementById('url-input');
    const articleInput = document.getElementById('article-input');
    const analyzeWebsiteBtn = document.getElementById('analyze-website-btn');
    const analyzeArticleBtn = document.getElementById('analyze-article-btn');
    const websiteResultContainer = document.getElementById('website-result-container');
    const articleResultContainer = document.getElementById('article-result-container');
    const loadingSpinner = document.getElementById('loading-spinner');
    const authModal = document.getElementById('auth-modal');
    const loginButton = document.getElementById('login-btn');
    const logoutButton = document.getElementById('logout-btn');
    const userDisplayName = document.getElementById('user-display-name');
    const authForm = document.getElementById('auth-form');
    const googleLoginButton = document.getElementById('modal-google-login-button');
    const themeToggle = document.getElementById('theme-toggle');
    const languageToggle = document.getElementById('language-toggle');
    const closeAuthModalButton = document.getElementById('modal-close-button');

    let currentLanguage = 'en';
    let translations = {};

    // =========================================================================
    // Localization (Translation) Logic
    // =========================================================================

    const loadTranslations = async (lang) => {
        try {
            const response = await fetch(`https://message-oxabite.web.app/static/translations/${lang}.json`);
            if (!response.ok) throw new Error('Translation file not found');
            translations = await response.json();
            document.querySelectorAll('[data-translate]').forEach(element => {
                const key = element.getAttribute('data-translate');
                if (translations[key]) {
                    element.innerHTML = translations[key];
                }
            });
            document.documentElement.lang = lang;
            currentLanguage = lang;
            document.body.classList.toggle('rtl', lang === 'ar');
        } catch (error) {
            console.error('Error loading translations:', error);
        }
    };

    languageToggle.addEventListener('click', () => {
        const newLang = currentLanguage === 'en' ? 'ar' : 'en';
        loadTranslations(newLang);
    });

    // Initial load of English translations
    loadTranslations('en');

    // =========================================================================
    // Theme Switcher Logic
    // =========================================================================

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        document.body.classList.toggle('light');
        const isDarkMode = document.body.classList.contains('dark');
        themeToggle.innerHTML = isDarkMode
            ? '<i class="fas fa-sun"></i>'
            : '<i class="fas fa-moon"></i>';
    });

    // =========================================================================
    // Authentication & Firebase
    // =========================================================================
    
    // Listen for authentication state changes
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in.
            loginButton.style.display = 'none';
            logoutButton.style.display = 'block';
            userDisplayName.textContent = user.displayName || user.email;
            userDisplayName.style.display = 'block';
            authModal.classList.add('hidden');
        } else {
            // User is signed out.
            loginButton.style.display = 'block';
            logoutButton.style.display = 'none';
            userDisplayName.style.display = 'none';
        }
    });

    loginButton.addEventListener('click', () => {
        authModal.classList.remove('hidden');
    });

    closeAuthModalButton.addEventListener('click', () => {
        authModal.classList.add('hidden');
    });

    googleLoginButton.addEventListener('click', async () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            await auth.signInWithPopup(provider);
        } catch (error) {
            console.error('Google Sign-in error:', error);
            alert(`Error during sign-in: ${error.message}`);
        }
    });

    logoutButton.addEventListener('click', async () => {
        try {
            await auth.signOut();
        } catch (error) {
            console.error('Sign-out error:', error);
            alert(`Error during sign-out: ${error.message}`);
        }
    });
    
    // =========================================================================
    // API Request Functions
    // =========================================================================

    const callApi = async (endpoint, payload) => {
        const user = auth.currentUser;
        if (!user) {
            alert('Please log in to use this feature.');
            return;
        }

        const idToken = await user.getIdToken();
        
        showLoading(true);
        try {
            const response = await fetch(`${backendBaseUrl}/api/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                    'Accept-Language': currentLanguage
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Server error');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            alert(error.message);
            console.error(`API call error for ${endpoint}:`, error);
            return null;
        } finally {
            showLoading(false);
        }
    };
    
    // =========================================================================
    // Form Submission Handlers
    // =========================================================================

    websiteAnalyzerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = urlInput.value.trim();
        if (!url) return;

        const results = await callApi('website-analyze', { input: url });
        if (results) {
            displayWebsiteResults(results);
        }
    });

    articleAnalyzerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const articleText = articleInput.value.trim();
        if (!articleText) return;

        const results = await callApi('article-analyze', { input: articleText });
        if (results) {
            displayArticleResults(results);
        }
    });

    // =========================================================================
    // UI Helper Functions
    // =========================================================================

    const showLoading = (isLoading) => {
        loadingSpinner.classList.toggle('hidden', !isLoading);
        analyzeWebsiteBtn.disabled = isLoading;
        analyzeArticleBtn.disabled = isLoading;
        if (isLoading) {
            websiteResultContainer.innerHTML = '';
            articleResultContainer.innerHTML = '';
        }
    };
    
    const displayWebsiteResults = (data) => {
        let html = `
            <div class="space-y-4">
                <div class="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg shadow">
                    <h3 class="text-xl font-bold mb-2">${translations.websiteAnalysisTitle}</h3>
                    <p><strong>URL:</strong> ${data.source_url}</p>
                </div>
                
                <div class="result-section">
                    <h3 class="text-xl font-bold">${translations.pageSpeedTitle}</h3>
                    <p><strong>${translations.performanceScore}:</strong> ${data.pageSpeed.performanceScore}%</p>
                </div>

                <div class="result-section">
                    <h3 class="text-xl font-bold">${translations.seoQualityTitle}</h3>
                    <p><strong>${translations.title}:</strong> ${data.seoQuality.title || 'N/A'}</p>
                    <p><strong>${translations.metaDescription}:</strong> ${data.seoQuality.metaDescription || 'N/A'}</p>
                    <p><strong>${translations.wordCount}:</strong> ${data.seoQuality.wordCount || 'N/A'}</p>
                </div>

                <div class="result-section">
                    <h3 class="text-xl font-bold">${translations.brokenLinksTitle}</h3>
                    <p><strong>${translations.brokenLinksCount}:</strong> ${data.brokenLinks.count}</p>
                    ${data.brokenLinks.list.length > 0 ? `<ul class="list-disc ml-5 mt-2">${data.brokenLinks.list.map(link => `<li>${link}</li>`).join('')}</ul>` : `<p>${translations.noBrokenLinks}</p>`}
                </div>

                <div class="ai-section p-4 rounded-lg">
                    <h3 class="text-xl font-bold mb-2">${translations.aiInsightsTitle}</h3>
                    <h4 class="font-semibold">${translations.aiSeoSuggestions}:</h4>
                    <p>${data.aiInsights.seoSuggestions}</p>
                    <h4 class="font-semibold mt-4">${translations.aiContentRefinement}:</h4>
                    <p>${data.aiInsights.contentRefinement}</p>
                </div>
            </div>
        `;
        websiteResultContainer.innerHTML = html;
    };

    const displayArticleResults = (data) => {
        let html = `
            <div class="ai-section p-4 rounded-lg">
                <h3 class="text-xl font-bold mb-2">${translations.articleAnalysisTitle}</h3>
                <p>${data.ai_analysis}</p>
            </div>
        `;
        articleResultContainer.innerHTML = html;
    };

    // Toggle logic for sections in the results container
    document.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('.toggle-section-btn');
        if (toggleBtn) {
            const content = toggleBtn.nextElementSibling;
            const icon = toggleBtn.querySelector('.toggle-icon');
            if (content.classList.contains('hidden')) {
                content.classList.remove('hidden');
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            } else {
                content.classList.add('hidden');
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            }
        }
    });

});
