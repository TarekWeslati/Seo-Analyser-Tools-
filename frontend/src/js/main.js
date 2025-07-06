document.addEventListener('DOMContentLoaded', () => {
    // === عناصر DOM الرئيسية ===
    const appTitle = document.getElementById('app-title');
    const navAppTitle = document.getElementById('nav-app-title');
    const analyzeAnyWebsiteText = document.getElementById('analyze-any-website-text');
    const websiteUrlInput = document.getElementById('website-url');
    const analyzeBtn = document.getElementById('analyze-btn');
    const loadingIndicator = document.getElementById('loading-indicator');
    const analyzingText = document.getElementById('analyzing-text');
    const resultsSection = document.getElementById('results-section');
    const analysisResultsForText = document.getElementById('analysis-results-for-text');
    const analyzedUrlDisplay = document.getElementById('analyzed-url-display');
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    const exportPdfText = document.getElementById('export-pdf-text');

    // === عناصر عرض النتائج ===
    const seoScoreTitle = document.getElementById('seo-score-title');
    const seoScoreElem = document.getElementById('seo-score');
    const seoDescriptionElem = document.getElementById('seo-description');

    const speedScoreTitle = document.getElementById('speed-score-title');
    const speedScoreElem = document.getElementById('speed-score');
    const speedDescriptionElem = document.getElementById('speed-description');

    const uxScoreTitle = document.getElementById('ux-score-title');
    const uxScoreElem = document.getElementById('ux-score');
    const uxDescriptionElem = document.getElementById('ux-description');

    const domainAuthorityTitle = document.getElementById('domain-authority-title');
    const domainAuthorityElem = document.getElementById('domain-authority');
    const domainAuthorityDescElem = document.getElementById('domain-authority-desc');

    const securityScoreTitle = document.getElementById('security-score-title');
    const securityScoreElem = document.getElementById('security-score');
    const securityDescriptionElem = document.getElementById('security-description');

    const aiSummaryTitle = document.getElementById('ai-summary-title');
    const aiSummaryContentElem = document.getElementById('ai-summary-content');

    // === عناصر تبديل اللغة والثيم ===
    const langToggleBtn = document.getElementById('lang-toggle-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');

    // === متغيرات الحالة ===
    let currentLang = localStorage.getItem('appLang') || 'ar'; // اللغة الافتراضية أو من التخزين المحلي
    let currentTheme = localStorage.getItem('appTheme') || 'light'; // الثيم الافتراضي أو من التخزين المحلي
    let translations = {}; // سيتم تحميل الترجمات هنا

    // === وظائف مساعدة ===

    // تحميل الترجمات من الخادم
    async function loadTranslations(lang) {
        try {
            const response = await fetch(`/translations/${lang}`);
            if (!response.ok) {
                throw new Error('Failed to load translations');
            }
            translations = await response.json();
            applyTranslations();
        } catch (error) {
            console.error('Error loading translations:', error);
            // fallback to default language if loading fails
            translations = {
                "app_title": "Web Analyzer Pro",
                "analyze_any_website": "Analyze Any Website",
                "placeholder_url": "https://www.example.com",
                "analyze_button": "Analyze",
                "loading_text": "Analyzing...",
                "analysis_results_for": "Analysis Results for:",
                "seo_score_title": "SEO Score",
                "seo_description_placeholder": "...",
                "speed_score_title": "Speed Score",
                "speed_description_placeholder": "...",
                "ux_score_title": "User Experience (UX) Score",
                "ux_description_placeholder": "...",
                "domain_authority_title": "Domain Authority & Site Trust",
                "security_score_title": "Security Score",
                "ai_summary_title": "AI Summary",
                "export_pdf_button": "Export PDF",
                "error_url_required": "Please enter a website URL.",
                "error_analysis_failed": "An error occurred during analysis. Please try again."
            };
            applyTranslations(); // Apply default in case of error
        }
    }

    // تطبيق الترجمات على عناصر DOM
    function applyTranslations() {
        appTitle.textContent = translations.app_title;
        navAppTitle.textContent = translations.app_title;
        analyzeAnyWebsiteText.textContent = translations.analyze_any_website;
        websiteUrlInput.placeholder = translations.placeholder_url;
        analyzeBtn.textContent = translations.analyze_button;
        analyzingText.textContent = translations.loading_text;
        analysisResultsForText.innerHTML = `${translations.analysis_results_for} <span id="analyzed-url-display"></span>`; // Note the span ID
        exportPdfText.textContent = translations.export_pdf_button;

        seoScoreTitle.textContent = translations.seo_score_title;
        speedScoreTitle.textContent = translations.speed_score_title;
        uxScoreTitle.textContent = translations.ux_score_title;
        domainAuthorityTitle.textContent = translations.domain_authority_title;
        securityScoreTitle.textContent = translations.security_score_title;
        aiSummaryTitle.textContent = translations.ai_summary_title;

        // Update language button text
        langToggleBtn.innerHTML = `<i class="fas fa-globe"></i> ${currentLang.toUpperCase() === 'AR' ? 'EN' : 'AR'}`;
        document.documentElement.setAttribute('lang', currentLang);
        document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');

        // Apply theme for new elements/if changed
        applyTheme(currentTheme);
    }

    // تطبيق الثيم (Dark/Light Mode)
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            document.body.classList.remove('dark-mode');
            themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
        }
        localStorage.setItem('appTheme', theme);
    }

    // تهيئة التطبيق عند التحميل
    async function initializeApp() {
        await loadTranslations(currentLang); // حمل الترجمات أولاً
        applyTheme(currentTheme); // طبق الثيم
        // تأكد من إخفاء الأقسام في البداية
        loadingIndicator.style.display = 'none';
        resultsSection.style.display = 'none';
        exportPdfBtn.style.display = 'none';
    }

    // === معالجات الأحداث (Event Listeners) ===

    // زر التحليل
    analyzeBtn.addEventListener('click', async () => {
        const url = websiteUrlInput.value.trim();

        if (!url) {
            alert(translations.error_url_required);
            return;
        }

        // إظهار مؤشر التحميل وإخفاء النتائج القديمة
        loadingIndicator.style.display = 'block';
        resultsSection.style.display = 'none';
        exportPdfBtn.style.display = 'none';
        analyzedUrlDisplay.textContent = ''; // مسح الرابط السابق
        // مسح محتوى النتائج السابقة
        seoScoreElem.textContent = 'N/A';
        seoDescriptionElem.textContent = translations.seo_description_placeholder;
        speedScoreElem.textContent = 'N/A';
        speedDescriptionElem.textContent = translations.speed_description_placeholder;
        uxScoreElem.textContent = 'N/A';
        uxDescriptionElem.textContent = translations.ux_description_placeholder;
        domainAuthorityElem.textContent = 'N/A';
        domainAuthorityDescElem.textContent = translations.seo_description_placeholder; // Placeholder for now
        securityScoreElem.textContent = 'N/A';
        securityDescriptionElem.textContent = translations.seo_description_placeholder; // Placeholder for now
        aiSummaryContentElem.textContent = '';


        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: url })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json(); // استلام البيانات كـ JSON

            // تحديث الواجهة بالنتائج المستلمة
            analyzedUrlDisplay.textContent = url;
            seoScoreElem.textContent = data.seo_score || 'N/A';
            seoDescriptionElem.textContent = data.seo_description || translations.seo_description_placeholder;
            speedScoreElem.textContent = data.speed_score || 'N/A';
            speedDescriptionElem.textContent = data.speed_description || translations.speed_description_placeholder;
            uxScoreElem.textContent = data.ux_score || 'N/A';
            uxDescriptionElem.textContent = data.ux_description || translations.ux_description_placeholder;
            domainAuthorityElem.textContent = data.domain_authority || 'N/A';
            domainAuthorityDescElem.textContent = data.domain_authority_desc || translations.seo_description_placeholder;
            securityScoreElem.textContent = data.security_score || 'N/A';
            securityDescriptionElem.textContent = data.security_description || translations.seo_description_placeholder;
            aiSummaryContentElem.textContent = data.ai_summary || '';


            resultsSection.style.display = 'block'; // إظهار قسم النتائج
            exportPdfBtn.style.display = 'block'; // إظهار زر PDF

        } catch (error) {
            console.error('Error during analysis:', error);
            alert(translations.error_analysis_failed);
        } finally {
            loadingIndicator.style.display = 'none'; // إخفاء مؤشر التحميل
        }
    });

    // زر تبديل اللغة
    langToggleBtn.addEventListener('click', () => {
        currentLang = currentLang === 'ar' ? 'en' : 'ar';
        localStorage.setItem('appLang', currentLang); // حفظ اللغة في التخزين المحلي
        loadTranslations(currentLang); // إعادة تحميل وتطبيق الترجمات
    });

    // زر تبديل الثيم
    themeToggleBtn.addEventListener('click', () => {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(currentTheme);
    });

    // === تهيئة التطبيق عند بدء التشغيل ===
    initializeApp();
});
