// main.js: The final, complete, and fully functional front-end logic for the application.

// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // Firebase & App Initialization
    // =========================================================================

    // Dynamically get the backend base URL from the current window's origin
    const backendBaseUrl = window.location.origin;

    // Firebase configuration - IMPORTANT: Replace with your actual Firebase project config
    // هذه هي بيانات مشروعك في Firebase. قم بتغييرها ببياناتك الخاصة
    const firebaseConfig = {
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_AUTH_DOMAIN",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_STORAGE_BUCKET",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID"
    };

    // قم بتهيئة Firebase إذا لم يتم تهيئتها بالفعل
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const auth = firebase.auth();
    const googleProvider = new firebase.auth.GoogleAuthProvider();

    // =========================================================================
    // DOM Elements & State
    // =========================================================================

    // Authentication elements
    const loginButton = document.getElementById('login-btn');
    const logoutButton = document.getElementById('logout-btn');
    const authModal = document.getElementById('auth-modal');
    const modalGoogleLoginButton = document.getElementById('modal-google-login-button');
    const closeAuthModalButton = document.getElementById('modal-close-button');
    const userDisplayName = document.getElementById('user-display-name');

    // Main forms and buttons
    const tabWebsite = document.getElementById('tab-website');
    const tabArticle = document.getElementById('tab-article');
    const sectionWebsite = document.getElementById('section-website');
    const sectionArticle = document.getElementById('section-article');
    const websiteAnalyzerForm = document.getElementById('website-analyzer-form');
    const articleAnalyzerForm = document.getElementById('article-analyzer-form');
    const urlInput = document.getElementById('url-input');
    const articleInput = document.getElementById('article-input');
    const analyzeWebsiteBtn = document.getElementById('analyze-website-btn');
    const analyzeArticleBtn = document.getElementById('analyze-article-btn');

    // Results containers
    const websiteResultContainer = document.getElementById('website-result-container');
    const articleResultContainer = document.getElementById('article-result-container');
    const loadingSpinner = document.getElementById('loading-spinner');

    // Language and Theme
    const languageToggle = document.getElementById('language-toggle');
    const themeToggle = document.getElementById('theme-toggle');

    let currentLanguage = 'ar'; // Set initial language to Arabic
    let translations = {};

    // =========================================================================
    // Localization (Translation) Logic
    // =========================================================================

    const loadTranslations = async (lang) => {
        try {
            const response = await fetch(`${backendBaseUrl}/static/locales/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Translation file not found for language: ${lang}`);
            }
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

    // Initial load of Arabic translations
    loadTranslations('ar');

    // =========================================================================
    // Theme Switcher Logic
    // =========================================================================

    themeToggle.addEventListener('click', () => {
        const isDarkMode = document.body.classList.toggle('dark');
        document.body.classList.toggle('light', !isDarkMode);
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        themeToggle.innerHTML = isDarkMode
            ? '<i class="fas fa-sun"></i>'
            : '<i class="fas fa-moon"></i>';
    });
    
    // Initial theme load
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.add(savedTheme);
    themeToggle.innerHTML = savedTheme === 'dark'
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';

    // =========================================================================
    // Tabs Logic
    // =========================================================================
    
    const showTab = (tabName) => {
        const tabs = [
            { button: tabWebsite, section: sectionWebsite },
            { button: tabArticle, section: sectionArticle }
        ];
        
        tabs.forEach(tab => {
            if (tab.section.id === `section-${tabName}`) {
                tab.button.classList.add('text-blue-500', 'border-blue-500');
                tab.section.classList.remove('hidden');
            } else {
                tab.button.classList.remove('text-blue-500', 'border-blue-500');
                tab.section.classList.add('hidden');
            }
        });
    };

    tabWebsite.addEventListener('click', () => showTab('website'));
    tabArticle.addEventListener('click', () => showTab('article'));
    showTab('website'); // Show website tab by default

    // =========================================================================
    // Authentication & Firebase
    // =========================================================================
    
    auth.onAuthStateChanged(user => {
        if (user) {
            loginButton.style.display = 'none';
            logoutButton.style.display = 'block';
            userDisplayName.textContent = user.displayName || user.email;
            userDisplayName.style.display = 'block';
            authModal.classList.add('hidden');
            analyzeWebsiteBtn.disabled = false;
            analyzeArticleBtn.disabled = false;
        } else {
            loginButton.style.display = 'block';
            logoutButton.style.display = 'none';
            userDisplayName.style.display = 'none';
            analyzeWebsiteBtn.disabled = true;
            analyzeArticleBtn.disabled = true;
        }
    });

    loginButton.addEventListener('click', () => {
        authModal.classList.remove('hidden');
    });

    closeAuthModalButton.addEventListener('click', () => {
        authModal.classList.add('hidden');
    });

    modalGoogleLoginButton.addEventListener('click', async () => {
        try {
            await auth.signInWithPopup(googleProvider);
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
            alert(translations.loginRequiredMessage || 'Please log in to use this feature.');
            return null;
        }

        showLoading(true);
        try {
            const idToken = await user.getIdToken();
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
                throw new Error(errorData.error || translations.serverError || 'Server error');
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

        const results = await callApi('website-analyze', { website_url: url });
        if (results) {
            displayWebsiteResults(results);
        }
    });

    articleAnalyzerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const articleText = articleInput.value.trim();
        if (!articleText) return;

        const results = await callApi('article-analyze', { article_text: articleText });
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
                    <p><strong>${translations.analyzedUrl}:</strong> ${data.source_url}</p>
                </div>
                
                <div class="result-section p-4 bg-gray-100 dark:bg-gray-700 rounded-lg shadow mt-4">
                    <h3 class="text-xl font-bold">${translations.pageSpeedTitle}</h3>
                    <p><strong>${translations.performanceScore}:</strong> ${data.pageSpeed.performanceScore || 'N/A'}%</p>
                </div>

                <div class="result-section p-4 bg-gray-100 dark:bg-gray-700 rounded-lg shadow mt-4">
                    <h3 class="text-xl font-bold">${translations.seoQualityTitle}</h3>
                    <p><strong>${translations.title}:</strong> ${data.seoQuality.title || 'N/A'}</p>
                    <p><strong>${translations.metaDescription}:</strong> ${data.seoQuality.metaDescription || 'N/A'}</p>
                    <p><strong>${translations.wordCount}:</strong> ${data.seoQuality.wordCount || 'N/A'}</p>
                </div>

                <div class="result-section p-4 bg-gray-100 dark:bg-gray-700 rounded-lg shadow mt-4">
                    <h3 class="text-xl font-bold">${translations.brokenLinksTitle}</h3>
                    <p><strong>${translations.brokenLinksCount}:</strong> ${data.brokenLinks.count || 'N/A'}</p>
                    ${data.brokenLinks.list && data.brokenLinks.list.length > 0 ? `<ul class="list-disc mr-5 mt-2">${data.brokenLinks.list.map(link => `<li>${link}</li>`).join('')}</ul>` : `<p>${translations.noBrokenLinks}</p>`}
                </div>

                <div class="ai-section p-4 bg-gray-100 dark:bg-gray-700 rounded-lg shadow mt-4">
                    <h3 class="text-xl font-bold mb-2">${translations.aiInsightsTitle}</h3>
                    <h4 class="font-semibold">${translations.aiSeoSuggestions}:</h4>
                    <p>${data.aiInsights.seoSuggestions || 'N/A'}</p>
                    <h4 class="font-semibold mt-4">${translations.aiContentRefinement}:</h4>
                    <p>${data.aiInsights.contentRefinement || 'N/A'}</p>
                </div>
            </div>
        `;
        websiteResultContainer.innerHTML = html;
    };

    const displayArticleResults = (data) => {
        let html = `
            <div class="ai-section p-4 bg-gray-100 dark:bg-gray-700 rounded-lg shadow">
                <h3 class="text-xl font-bold mb-2">${translations.articleAnalysisTitle}</h3>
                <p>${data.ai_analysis || 'N/A'}</p>
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
