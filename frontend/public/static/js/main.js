// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // IMPORTANT: Firebase Configuration
    // The following global variables are provided by the Canvas environment.
    // Use them to initialize Firebase and authenticate the user.
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

    // Initialize Firebase
    if (Object.keys(firebaseConfig).length > 0) {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        const auth = firebase.auth();
        const db = firebase.firestore();

        // Sign in with the provided custom token
        const signInUser = async () => {
            try {
                if (initialAuthToken) {
                    await auth.signInWithCustomToken(initialAuthToken);
                    console.log('Signed in with custom token.');
                } else {
                    await auth.signInAnonymously();
                    console.log('Signed in anonymously.');
                }
            } catch (error) {
                console.error('Firebase authentication error:', error);
            }
        };
        signInUser();
    } else {
        console.error('Firebase configuration is missing. Authentication features will be disabled.');
    }

    // =========================================================================
    // UI Elements and Event Listeners
    // =========================================================================

    // General UI Elements
    const themeToggle = document.getElementById('theme-toggle');
    const languageSelect = document.getElementById('language-select');
    const authModal = document.getElementById('auth-modal');
    const closeAuthModal = document.getElementById('close-auth-modal');
    const showAuthModalButton = document.getElementById('show-auth-modal-button');
    const logoutButton = document.getElementById('logout-button');
    const authStatus = document.getElementById('auth-status');
    const notLoggedInMessage = document.getElementById('not-logged-in-message');
    const userEmailDisplay = document.getElementById('user-email-display');
    const authButtonsContainer = document.getElementById('auth-buttons-container');
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorMessage = document.getElementById('error-message');
    const resultsDashboard = document.getElementById('results-dashboard');
    const analyzedSource = document.getElementById('analyzed-source');

    // Analysis Input Elements
    const websiteUrlInput = document.getElementById('website-url');
    const articleTextInput = document.getElementById('article-text');
    const analyzeWebsiteButton = document.getElementById('analyze-website-button');
    const analyzeArticleButton = document.getElementById('analyze-article-button');
    const analyzeAnotherButton = document.getElementById('analyze-another-button');
    const exportPdfButton = document.getElementById('export-pdf-button');

    // Translation data (in a real app, this would be loaded from a separate JSON file)
    const translations = {
        en: {
            // ... (Add your English translations here)
            websiteAnalyzerTitle: "Website & Article Analyzer",
            mainTitle: "Website & Article Analyzer Tool",
            websiteAnalysisTitle: "Website Analysis",
            enterUrlPrompt: "Enter website URL to analyze:",
            analyzeWebsiteButton: "Analyze Website",
            articleAnalysisTitle: "Article Analysis",
            enterArticlePrompt: "Enter article text to analyze:",
            analyzeArticleButton: "Analyze Article",
            loadingMessage: "Loading...",
            notLoggedInMessage: "Not logged in",
            loginButton: "Login",
            logoutButton: "Logout",
            expandAll: "Expand All",
            collapseAll: "Collapse All",
            domainAuthorityTitle: "Domain Authority",
            // etc...
        },
        ar: {
            websiteAnalyzerTitle: "أداة تحليل المواقع والمقالات",
            mainTitle: "أداة تحليل المواقع والمقالات",
            websiteAnalysisTitle: "تحليل الموقع",
            enterUrlPrompt: "أدخل رابط الموقع لتحليله:",
            analyzeWebsiteButton: "تحليل الموقع",
            articleAnalysisTitle: "تحليل المقال",
            enterArticlePrompt: "أدخل نص المقال لتحليله:",
            analyzeArticleButton: "تحليل المقال",
            loadingMessage: "جارٍ التحميل...",
            notLoggedInMessage: "غير مسجل الدخول",
            loginButton: "تسجيل الدخول",
            logoutButton: "تسجيل الخروج",
            expandAll: "توسيع الكل",
            collapseAll: "طي الكل",
            analysisReportTitle: "تقرير التحليل لـ:",
            domainAuthorityTitle: "صلاحية الموقع",
            domainName: "اسم الموقع:",
            domainAuthorityScore: "نتيجة صلاحية الموقع:",
            domainAge: "عمر الموقع:",
            sslStatus: "حالة SSL:",
            blacklistStatus: "حالة القائمة السوداء:",
            dnsHealth: "صحة DNS:",
            pageSpeedTitle: "سرعة الصفحة",
            performanceScore: "نتيجة الأداء:",
            coreWebVitals: "مقاييس الويب الأساسية:",
            performanceIssues: "مشاكل الأداء:",
            pagespeedReport: "تقرير PageSpeed:",
            seoQualityTitle: "جودة تحسين محركات البحث (SEO)",
            overallScore: "النتيجة الإجمالية:",
            seoTitle: "العنوان:",
            seoMetaDescription: "الوصف التعريفي:",
            headingTags: "عناوين الصفحة (H1-H6):",
            contentWordCount: "عدد كلمات المحتوى:",
            contentCharCount: "عدد أحرف المحتوى:",
            robotsTxtPresent: "ملف Robots.txt موجود:",
            sitemapXmlPresent: "ملف Sitemap.xml موجود:",
            keywordDensity: "كثافة الكلمات المفتاحية (أهم 10):",
            seoImprovementTips: "نصائح لتحسين SEO:",
            aiSeoSuggestionsTitle: "اقتراحات SEO بالذكاء الاصطناعي",
            rewriteSeoButton: "إعادة صياغة العنوان/الوصف",
            aiRewritesTitle: "إعادة صياغة من الذكاء الاصطناعي:",
            loadingAiRewrites: "جارٍ تحميل الاقتراحات...",
            brokenLinksDetailsTitle: "تفاصيل الروابط المعطلة",
            brokenLinksCount: "عدد الروابط المعطلة:",
            brokenLinksList: "قائمة الروابط المعطلة:",
            brokenLinksFixSuggestionsTitle: "اقتراحات إصلاح الروابط المعطلة بالذكاء الاصطناعي",
            userExperienceTitle: "تجربة المستخدم (UX)",
            viewportMetaPresent: "وصف Viewport Meta Tag موجود:",
            uxIssues: "مشاكل تجربة المستخدم:",
            uxSuggestions: "اقتراحات تجربة المستخدم:",
            aiContentInsightsTitle: "رؤى المحتوى بالذكاء الاصطناعي",
            refineContentButton: "تحسين المحتوى",
            refinedContentTitle: "المحتوى المحسن:",
            loadingAiRefinement: "جارٍ تحميل التحسينات...",
            adsenseReadinessTitle: "جاهزية AdSense",
            assessment: "التقييم:",
            improvementAreas: "مجالات التحسين:",
            aiOverallSummaryTitle: "ملخص شامل بالذكاء الاصطناعي",
            analyzeAnotherButton: "تحليل آخر",
            exportPdfButton: "تصدير التقرير كـ PDF",
            loginTitle: "تسجيل الدخول إلى حسابك",
            loginToContinue: "يرجى تسجيل الدخول أو التسجيل للمتابعة.",
            emailLabel: "البريد الإلكتروني:",
            passwordLabel: "كلمة المرور:",
            processingMessage: "...جارٍ المعالجة",
            orSignInWith: "أو سجل الدخول باستخدام:",
            signInWithGoogle: "تسجيل الدخول باستخدام جوجل",
            noAccountText: "لا يوجد لديك حساب؟",
            registerHereButton: "سجل هنا"
        }
    };
    
    let currentLanguage = 'ar';

    // =========================================================================
    // Functions
    // =========================================================================

    // Function to apply translations
    function applyTranslations(lang) {
        const elements = document.querySelectorAll('[data-translate]');
        elements.forEach(el => {
            const key = el.getAttribute('data-translate');
            if (translations[lang] && translations[lang][key]) {
                el.textContent = translations[lang][key];
            }
        });
        document.documentElement.lang = lang;
        currentLanguage = lang;
    }

    // Function to handle Dark/Light mode
    function toggleTheme() {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
    }

    // Function to handle the analysis process
    async function handleAnalysis(type, input) {
        // Clear previous results and errors
        resultsDashboard.classList.add('hidden');
        errorMessage.classList.add('hidden');
        loadingSpinner.classList.remove('hidden');

        // Set the analyzed source text
        analyzedSource.textContent = input;

        // Hide sections that are not relevant to the analysis type
        document.querySelectorAll('.result-section').forEach(section => {
            const sectionTypes = section.getAttribute('data-section-type');
            if (sectionTypes.includes(type)) {
                section.classList.remove('hidden');
            } else {
                section.classList.add('hidden');
            }
        });
        
        try {
            const response = await fetch(`/api/${type}-analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: input })
            });

            const data = await response.json();

            if (response.ok) {
                // Populate the results dashboard with data
                populateResults(data, type);
            } else {
                errorMessage.textContent = data.error || 'فشل التحليل. يرجى المحاولة مرة أخرى.';
                errorMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Analysis error:', error);
            errorMessage.textContent = 'حدث خطأ في الشبكة. يرجى التحقق من اتصالك والمحاولة مرة أخرى.';
            errorMessage.classList.remove('hidden');
        } finally {
            loadingSpinner.classList.add('hidden');
            resultsDashboard.classList.remove('hidden');
        }
    }

    // Function to populate the results dashboard (placeholder)
    function populateResults(data, type) {
        // This is a placeholder function. You'll need to implement the actual
        // logic to update the DOM elements based on the API response 'data'.
        // The structure should be similar to what you have in the old file,
        // but now it handles both 'website' and 'article' types.

        // Example: Update Domain Authority score
        if (type === 'website' && data.domainAuthority) {
            const daScore = data.domainAuthority.score;
            document.getElementById('domain-authority-score').textContent = daScore;
            document.getElementById('domain-authority-progress').style.width = `${daScore}%`;
            // Add more logic to update other fields
        }

        // Example: Update SEO Quality section
        if (data.seoQuality) {
            const seoScore = data.seoQuality.overallScore;
            document.getElementById('seo-overall-score').textContent = seoScore;
            document.getElementById('seo-overall-progress').style.width = `${seoScore}%`;
            // Add more logic for other SEO fields
        }

        // You'll need to create similar logic for all other sections
    }
    
    // Function to reset the UI for a new analysis
    function resetUI() {
        resultsDashboard.classList.add('hidden');
        errorMessage.classList.add('hidden');
        websiteUrlInput.value = '';
        articleTextInput.value = '';
        // Reset other UI elements to their initial state if needed
    }

    // =========================================================================
    // Event Listeners
    // =========================================================================

    // Language selector change event
    languageSelect.addEventListener('change', (e) => {
        applyTranslations(e.target.value);
        localStorage.setItem('lang', e.target.value);
    });

    // Theme toggle button click event
    themeToggle.addEventListener('click', toggleTheme);

    // Show auth modal button click event
    showAuthModalButton.addEventListener('click', () => {
        authModal.classList.remove('hidden');
    });

    // Close auth modal button click event
    closeAuthModal.addEventListener('click', () => {
        authModal.classList.add('hidden');
    });
    
    // Website analysis button click event
    analyzeWebsiteButton.addEventListener('click', () => {
        const url = websiteUrlInput.value;
        if (url) {
            handleAnalysis('website', url);
        } else {
            errorMessage.textContent = 'الرجاء إدخال رابط صالح.';
            errorMessage.classList.remove('hidden');
        }
    });

    // Article analysis button click event
    analyzeArticleButton.addEventListener('click', () => {
        const text = articleTextInput.value;
        if (text) {
            handleAnalysis('article', text);
        } else {
            errorMessage.textContent = 'الرجاء إدخال نص المقال.';
            errorMessage.classList.remove('hidden');
        }
    });

    // Analyze another button click event
    analyzeAnotherButton.addEventListener('click', resetUI);

    // Expand all sections button
    document.getElementById('expand-all-button').addEventListener('click', () => {
        document.querySelectorAll('.section-content').forEach(content => {
            content.classList.remove('hidden');
        });
        document.querySelectorAll('.toggle-icon').forEach(icon => {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        });
    });

    // Collapse all sections button
    document.getElementById('collapse-all-button').addEventListener('click', () => {
        document.querySelectorAll('.section-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.querySelectorAll('.toggle-icon').forEach(icon => {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        });
    });

    // Toggle section content on click
    document.querySelectorAll('.toggle-section').forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const icon = header.querySelector('.toggle-icon');
            content.classList.toggle('hidden');
            icon.classList.toggle('fa-chevron-down');
            icon.classList.toggle('fa-chevron-up');
        });
    });

    // =========================================================================
    // Initial Setup
    // =========================================================================

    // Set initial theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    }

    // Set initial language from localStorage
    const savedLang = localStorage.getItem('lang') || 'ar';
    languageSelect.value = savedLang;
    applyTranslations(savedLang);

    // Firebase Auth State Listener
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // User is signed in.
            notLoggedInMessage.classList.add('hidden');
            authButtonsContainer.classList.add('hidden');
            logoutButton.classList.remove('hidden');
            userEmailDisplay.textContent = user.email || 'مستخدم مجهول';
            userEmailDisplay.classList.remove('hidden');
        } else {
            // User is signed out.
            notLoggedInMessage.classList.remove('hidden');
            authButtonsContainer.classList.remove('hidden');
            logoutButton.classList.add('hidden');
            userEmailDisplay.classList.add('hidden');
        }
    });

    // Logout button event listener
    logoutButton.addEventListener('click', () => {
        firebase.auth().signOut().then(() => {
            console.log('User signed out successfully');
            authModal.classList.add('hidden');
        }).catch(error => {
            console.error('Error signing out:', error);
        });
    });

    // We need to handle the logic for the modal buttons here as well.
    // This is just a placeholder, you'll need to implement the actual logic
    // for email/password login and Google login, similar to the logic
    // you would have in your original `main.js`.
    document.getElementById('modal-auth-submit-button').addEventListener('click', () => {
        // Implement email/password login or registration logic here
        console.log('Login/Register button clicked on modal.');
    });

    document.getElementById('modal-google-login-button').addEventListener('click', () => {
        // Implement Google Sign-in logic here
        console.log('Google login button clicked on modal.');
    });
});
