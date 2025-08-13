// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    // Firebase configuration - IMPORTANT: Replace with your actual Firebase project config
    const firebaseConfig = {
        apiKey: "AIzaSyBn0rlzoqgvZhasHpnkfpEzV2X1kYKDBs", // Replace with your API key
        authDomain: "message-oxabite.firebaseapp.com", // Replace with your auth domain
        projectId: "message-oxabite", // Replace with your project ID
        storageBucket: "message-oxabite.firebasestorage.app", // Replace with your storage bucket
        messagingSenderId: "283151112955", // Replace with your messaging sender ID
        appId: "1:283151112955:web:4f715cd8fc188ebfb8ee5e" // Replace with your app ID
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const auth = firebase.auth();
    const provider = new firebase.auth.GoogleAuthProvider();

    // --- Variables and Elements ---
    const articleTextarea = document.getElementById('articleText');
    const analyzeArticleButton = document.getElementById('analyzeArticleButton');
    const articleRewriteButton = document.getElementById('articleRewriteButton');
    const analysisOutput = document.getElementById('analysis-output');
    const analyzeWebsiteButton = document.getElementById('analyzeWebsiteButton');
    const analyzeCompetitorButton = document.getElementById('analyzeCompetitorButton');
    const websiteUrlInput = document.getElementById('websiteUrl');
    const websiteAnalysisOutput = document.getElementById('website-analysis-output');
    const modal = document.getElementById('auth-modal');
    const loginButton = document.getElementById('loginButton');
    const googleLoginButton = document.getElementById('modal-google-login-button');
    const closeModalButton = document.querySelector('.close-modal');
    const loginForm = document.getElementById('auth-form');
    const switchAuthButton = document.getElementById('modal-switch-auth-button');
    const modalTitle = document.getElementById('modal-auth-title');
    const submitButton = document.getElementById('modal-auth-submit-button');
    const switchAuthText = document.getElementById('modal-switch-auth-text');
    let isLoginMode = true; // State variable for login/signup

    // --- Language and Theme Variables ---
    const languageSelector = document.getElementById('languageSelector');
    const themeToggle = document.getElementById('themeToggle');
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');
    let translations = {}; // Object to hold the translations
    
    // Function to fetch translations
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
            document.documentElement.lang = lang;
            document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        } catch (error) {
            console.error("Error loading translations:", error);
        }
    };

    // Load translations on initial page load (default to Arabic)
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

    // Modal control
    loginButton.addEventListener('click', () => modal.classList.remove('hidden'));
    closeModalButton.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });

    // Switch between login and signup
    switchAuthButton.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        modalTitle.textContent = isLoginMode ? translations['loginTitle'] : translations['signupTitle'];
        submitButton.textContent = isLoginMode ? translations['loginButton'] : translations['signupButton'];
        switchAuthText.textContent = isLoginMode ? translations['noAccountText'] : translations['haveAccountText'];
        switchAuthButton.textContent = isLoginMode ? translations['signupNow'] : translations['loginNow'];
    });

    // Google Sign-In
    googleLoginButton.addEventListener('click', async () => {
        try {
            const result = await auth.signInWithPopup(provider);
            const idToken = await result.user.getIdToken();
            await fetch('/api/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                }
            });
            // Handle successful login
            alert('Login with Google successful!');
            modal.classList.add('hidden');
            // Update UI to show user is logged in
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            alert('Failed to sign in with Google.');
        }
    });

    // Email/Password login/signup
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('modal-email-input').value;
        const password = document.getElementById('modal-password-input').value;
        const submitUrl = isLoginMode ? '/api/auth/login' : '/api/auth/signup';

        try {
            const response = await fetch(submitUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (response.ok) {
                alert(isLoginMode ? 'Login successful!' : 'Signup successful!');
                modal.classList.add('hidden');
                // Store token or user state
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error('Auth Error:', error);
            alert('An error occurred during authentication.');
        }
    });

    // --- Analysis Functions ---

    // Article Analysis
    analyzeArticleButton.addEventListener('click', async () => {
        const articleContent = articleTextarea.value;
        if (!articleContent) {
            analysisOutput.innerHTML = `<p class="text-red-500">${translations.enterArticleContent}</p>`;
            return;
        }

        analysisOutput.innerHTML = `<p class="text-blue-500">${translations.analyzingArticle}</p>`;

        try {
            const response = await fetch('/api/analyze-article', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: articleContent })
            });

            const data = await response.json();

            if (response.ok) {
                let outputHtml = `<h4 class="text-lg font-medium mb-2">${translations.articleAnalysisResults}</h4>`;
                outputHtml += `<p><strong>${translations.keywords}:</strong> ${data.keywords.join(', ')}</p>`;
                outputHtml += `<p class="mt-2"><strong>${translations.readabilityScore}:</strong> ${data.readability_score}</p>`;
                outputHtml += `<p><strong>${translations.readabilityRecommendations}:</strong> ${data.readability_recommendations}</p>`;
                outputHtml += `<p class="mt-2"><strong>${translations.userIntent}:</strong> ${data.user_intent}</p>`;
                outputHtml += `<p class="mt-2"><strong>${translations.contentGaps}:</strong> ${data.content_gaps.join(', ')}</p>`;
                analysisOutput.innerHTML = outputHtml;
            } else {
                analysisOutput.innerHTML = `<p class="text-red-500">Error: ${data.error}</p>`;
            }
        } catch (error) {
            console.error('Error:', error);
            analysisOutput.innerHTML = `<p class="text-red-500">${translations.fetchDataError}</p>`;
        }
    });

    // Article Rewriter
    articleRewriteButton.addEventListener('click', async () => {
        // ... (Rewriter logic here)
        analysisOutput.innerHTML = `<p class="text-orange-500">${translations.rewritingFeature}</p>`;
    });

    // Website Keywords Analysis
    analyzeWebsiteButton.addEventListener('click', async () => {
        const url = websiteUrlInput.value;
        if (!url) {
            websiteAnalysisOutput.innerHTML = `<p class="text-red-500">${translations.enterYourWebsiteURLFirst}</p>`;
            return;
        }

        websiteAnalysisOutput.innerHTML = `<p class="text-blue-500">${translations.analyzingWebsite}</p>`;

        try {
            const response = await fetch('/api/get_website_keywords', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url })
            });
            
            const data = await response.json();

            if (response.ok) {
                let outputHtml = `<h4 class="text-lg font-medium mb-2">${translations.websiteKeywordsAnalysis}</h4>`;
                outputHtml += `<p><strong>${translations.keywords}:</strong> ${data.keywords.join(', ')}</p>`;
                outputHtml += `<p><strong>${translations.longTailKeywords}:</strong> ${data.long_tail_keywords.join(', ')}</p>`;
                websiteAnalysisOutput.innerHTML = outputHtml;
            } else {
                websiteAnalysisOutput.innerHTML = `<p class="text-red-500">Error: ${data.error}</p>`;
            }
        } catch (error) {
            console.error('Error:', error);
            websiteAnalysisOutput.innerHTML = `<p class="text-red-500">${translations.fetchDataError}</p>`;
        }
    });

    // Competitor Analysis
    analyzeCompetitorButton.addEventListener('click', async () => {
        const my_url = websiteUrlInput.value;
        if (!my_url) {
            websiteAnalysisOutput.innerHTML = `<p class="text-red-500">${translations.enterYourWebsiteURLFirst}</p>`;
            return;
        }

        const competitor_url = prompt(translations.enterCompetitorURLPrompt);
        if (!competitor_url) return;

        websiteAnalysisOutput.innerHTML = `<p class="text-blue-500">${translations.analyzingCompetitors}</p>`;

        try {
            const response = await fetch('/api/analyze_competitors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ my_url: my_url, competitor_url: competitor_url })
            });

            const data = await response.json();

            if (response.ok) {
                let outputHtml = `<h4 class="text-lg font-medium mb-2">${translations.competitorAnalysisResults}</h4>`;
                outputHtml += `<p><strong>${translations.commonKeywords}:</strong> ${data.common_keywords.join(', ')}</p>`;
                outputHtml += `<p class="mt-2"><strong>${translations.competitorExclusiveKeywords}:</strong> ${data.competitor_exclusive_keywords.join(', ')}</p>`;
                websiteAnalysisOutput.innerHTML = outputHtml;
            } else {
                websiteAnalysisOutput.innerHTML = `<p class="text-red-500">Error: ${data.error}</p>`;
            }
        } catch (error) {
            console.error('Error:', error);
            websiteAnalysisOutput.innerHTML = `<p class="text-red-500">${translations.fetchDataError}</p>`;
        }
    });
});
