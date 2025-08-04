document.addEventListener('DOMContentLoaded', () => {
    const backendBaseUrl = window.location.origin;
    const authBaseUrl = backendBaseUrl;

    // Firebase configuration - IMPORTANT: Use the exact same config from main.js
    const firebaseConfig = {
        apiKey: "AIzaSyBn0rlzoqgvZhasfHpnkfpEzV2X1kYKDBs",
        authDomain: "message-oxabite.firebaseapp.com",
        projectId: "message-oxabite",
        storageBucket: "message-oxabite.firebasestorage.app",
        messagingSenderId: "283151112955",
        appId: "1:283151112955:web:4f715cd8fc188ebfb8ee5e"
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const auth = firebase.auth();
    const googleProvider = new firebase.auth.GoogleAuthProvider();

    // Article Analyzer elements
    const articleTextInput = document.getElementById('article-text-input');
    const analyzeArticleButton = document.getElementById('analyze-article-button');
    const articleErrorMessage = document.getElementById('article-error-message');
    const articleLoadingSpinner = document.getElementById('article-loading-spinner');
    const articleResultsDashboard = document.getElementById('article-results-dashboard');
    const analyzeAnotherArticleButton = document.getElementById('analyze-another-article-button');

    // Article Analysis Results sections
    const articleStructureText = document.getElementById('article-structure-text');
    const keywordSuggestionsText = document.getElementById('keyword-suggestions-text');
    const contentHealthText = document.getElementById('content-health-text');
    const originalityAssessmentText = document.getElementById('originality-assessment-text');
    const rewriteArticleButton = document.getElementById('rewrite-article-button');
    const rewrittenArticleOutput = document.getElementById('rewritten-article-output');
    const rewrittenArticleText = document.getElementById('rewritten-article-text');

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

    let currentAuthMode = 'login';
    let actionAfterAuth = null;
    let currentArticleAnalysisResults = null; // To store results for rewriting

    // Language and Theme elements
    const languageSelect = document.getElementById('language-select');
    const themeToggle = document.getElementById('theme-toggle');
    let translations = {};
    let currentLang = 'en';

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
            modalAuthPrompt.textContent = translations['loginToContinue'];
        }
    }

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

    languageSelect.addEventListener('change', (event) => {
        currentLang = event.target.value;
        localStorage.setItem('language', currentLang);
        loadTranslations(currentLang);
    });

    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    currentLang = localStorage.getItem('language') || 'en';
    languageSelect.value = currentLang;
    loadTranslations(currentLang);

    function showAuthModal(mode = 'login', callback = null) {
        currentAuthMode = mode;
        actionAfterAuth = callback;
        modalAuthEmailInput.value = '';
        modalAuthPasswordInput.value = '';
        modalAuthErrorMessage.classList.add('hidden');
        modalAuthLoadingSpinner.classList.add('hidden');
        applyTranslations();
        authModal.classList.remove('hidden');
    }

    function hideAuthModal() {
        authModal.classList.add('hidden');
        actionAfterAuth = null;
    }

    showAuthModalButton.addEventListener('click', () => showAuthModal('login'));
    closeAuthModalButton.addEventListener('click', hideAuthModal);

    modalSwitchAuthButton.addEventListener('click', () => {
        currentAuthMode = currentAuthMode === 'login' ? 'register' : 'login';
        applyTranslations();
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
            } else {
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
                        actionAfterAuth();
                    }
                } else {
                    modalAuthErrorMessage.textContent = translations['registrationSuccess'];
                    modalAuthErrorMessage.classList.remove('hidden');
                    currentAuthMode = 'login';
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
                    actionAfterAuth();
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

    logoutButton.addEventListener('click', async () => {
        try {
            await auth.signOut();
            localStorage.removeItem('authToken');
            localStorage.removeItem('userEmail');
            currentArticleAnalysisResults = null;
            updateAuthUI();
            articleTextInput.value = '';
            articleResultsDashboard.classList.add('hidden');
        } catch (error) {
            console.error('Logout error:', error);
            alert(translations['logoutFailed']);
        }
    });

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

    // Article Analysis Logic
    analyzeArticleButton.addEventListener('click', analyzeArticle);
    analyzeAnotherArticleButton.addEventListener('click', () => {
        articleResultsDashboard.classList.add('hidden');
        articleTextInput.value = '';
        articleErrorMessage.classList.add('hidden');
        currentArticleAnalysisResults = null;
        // Collapse all sections
        document.querySelectorAll('.section-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.querySelectorAll('.toggle-icon').forEach(icon => {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        });
    });

    // Toggle sections for Article Analyzer
    document.querySelectorAll('#article-results-dashboard .toggle-section').forEach(button => {
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

    document.getElementById('article-expand-all-button').addEventListener('click', () => {
        document.querySelectorAll('#article-results-dashboard .section-content').forEach(content => {
            content.classList.remove('hidden');
        });
        document.querySelectorAll('#article-results-dashboard .toggle-icon').forEach(icon => {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        });
    });

    document.getElementById('article-collapse-all-button').addEventListener('click', () => {
        document.querySelectorAll('#article-results-dashboard .section-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.querySelectorAll('#article-results-dashboard .toggle-icon').forEach(icon => {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        });
    });


    async function analyzeArticle() {
        const articleText = articleTextInput.value;
        const token = localStorage.getItem('authToken');

        if (!token) {
            showAuthModal('login', () => analyzeArticle());
            return;
        }

        if (!articleText) {
            articleErrorMessage.textContent = translations['pleaseEnterArticle'];
            articleErrorMessage.classList.remove('hidden');
            return;
        }

        articleErrorMessage.classList.add('hidden');
        articleLoadingSpinner.classList.remove('hidden');
        articleResultsDashboard.classList.add('hidden');
        currentArticleAnalysisResults = null;

        try {
            const response = await fetch(`${backendBaseUrl}/analyze_article_content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept-Language': currentLang
                },
                body: JSON.stringify({ article_text: articleText })
            });

            if (response.ok) {
                const data = await response.json();
                currentArticleAnalysisResults = data;
                displayArticleResults(data);
                articleResultsDashboard.classList.remove('hidden');
            } else {
                const errorData = await response.json();
                articleErrorMessage.textContent = `${translations['articleAnalysisFailed']}: ${errorData.error || translations['pleaseTryAgain']}`;
                articleErrorMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Article analysis error:', error);
            articleErrorMessage.textContent = `${translations['networkError']}: ${translations['pleaseTryAgain']}`;
            articleErrorMessage.classList.remove('hidden');
        } finally {
            articleLoadingSpinner.classList.add('hidden');
        }
    }

    function displayArticleResults(data) {
        articleStructureText.textContent = data.suggested_structure || translations['noSuggestionsAvailable'];
        keywordSuggestionsText.textContent = data.keyword_suggestions || translations['noSuggestionsAvailable'];
        contentHealthText.textContent = data.content_health_assessment || translations['noAssessmentAvailable'];
        originalityAssessmentText.textContent = data.originality_assessment || translations['noAssessmentAvailable'];

        // Hide rewritten article output initially
        rewrittenArticleOutput.classList.add('hidden');
        rewrittenArticleText.textContent = translations['loadingArticleRewrites'];
    }

    // AI Article Rewriter
    rewriteArticleButton.addEventListener('click', () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            showAuthModal('login', () => rewriteArticle());
            return;
        }
        rewriteArticle();
    });

    async function rewriteArticle() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert(translations['runAnalysisFirst']);
            return;
        }
        if (!currentArticleAnalysisResults || !articleTextInput.value) {
            alert(translations['pleaseEnterArticle']);
            return;
        }

        rewrittenArticleOutput.classList.remove('hidden');
        rewrittenArticleText.textContent = translations['loadingArticleRewrites'];

        try {
            const response = await fetch(`${backendBaseUrl}/rewrite_article`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept-Language': currentLang
                },
                body: JSON.stringify({ article_text: articleTextInput.value })
            });

            const data = await response.json();
            if (response.ok) {
                rewrittenArticleText.textContent = data.rewritten_content || translations['noRewrittenArticleAvailable'];
            } else {
                rewrittenArticleText.textContent = `${translations['failedToRewriteArticle']}: ${data.error || translations['pleaseTryAgain']}`;
            }
        } catch (error) {
            console.error('Article rewrite error:', error);
            rewrittenArticleText.textContent = `${translations['failedToRewriteArticle']}: ${translations['networkError']}`;
        }
    }
});
