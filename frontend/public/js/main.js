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
                "error_analysis_failed": "An error occurred during analysis. Please try again.",
                "failed_to_fetch_url": "Failed to fetch content from the provided URL. Please check the URL or try again later."
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

    // وظيفة لعرض رسالة خطأ للمستخدم (بدلاً من alert)
    function showErrorMessage(message) {
        const errorMessageDiv = document.createElement('div');
        errorMessageDiv.className = 'alert alert-danger mt-3';
        errorMessageDiv.setAttribute('role', 'alert');
        errorMessageDiv.textContent = message;
        document.querySelector('.container').prepend(errorMessageDiv); // أضفها في بداية الحاوية

        setTimeout(() => {
            errorMessageDiv.remove(); // إزالة الرسالة بعد 5 ثوانٍ
        }, 5000);
    }

    // وظيفة لإنشاء ملخص بالذكاء الاصطناعي
    async function generateAISummary(analysisResults, targetLang) {
        aiSummaryContentElem.textContent = translations.loading_text; // عرض نص تحميل للملخص

        const prompt = `
        Based on the following website analysis results, provide a concise summary in ${targetLang === 'ar' ? 'Arabic' : 'English'}.
        Focus on the overall performance, key strengths, and areas for improvement.
        
        SEO Score: ${analysisResults.seo_score} - ${analysisResults.seo_description}
        Speed Score: ${analysisResults.speed_score} - ${analysisResults.speed_description}
        UX Score: ${analysisResults.ux_score} - ${analysisResults.ux_description}
        Security Score: ${analysisResults.security_score} - ${analysisResults.security_description}
        Domain Authority: ${analysisResults.domain_authority} - ${analysisResults.domain_authority_desc}
        `;

        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });
        const payload = { contents: chatHistory };
        const apiKey = ""; // Canvas will automatically provide this at runtime. DO NOT ADD your API key here.
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                aiSummaryContentElem.textContent = text;
            } else {
                aiSummaryContentElem.textContent = translations.error_analysis_failed; // أو رسالة خطأ محددة
                console.error("AI summary generation failed: Unexpected API response structure.");
            }
        } catch (error) {
            aiSummaryContentElem.textContent = translations.error_analysis_failed; // أو رسالة خطأ محددة
            console.error("Error calling Gemini API for summary:", error);
        }
    }


    // === معالجات الأحداث (Event Listeners) ===

    // زر التحليل
    analyzeBtn.addEventListener('click', async () => {
        const url = websiteUrlInput.value.trim();

        if (!url) {
            showErrorMessage(translations.error_url_required);
            return;
        }

        // إظهار مؤشر التحميل وإخفاء النتائج القديمة
        loadingIndicator.style.display = 'block';
        resultsSection.style.display = 'none';
        exportPdfBtn.style.display = 'none';
        analyzedUrlDisplay.textContent = ''; // مسح الرابط السابق
        aiSummaryContentElem.textContent = ''; // مسح الملخص السابق

        // مسح محتوى النتائج السابقة
        seoScoreElem.textContent = 'N/A';
        seoDescriptionElem.textContent = '';
        speedScoreElem.textContent = 'N/A';
        speedDescriptionElem.textContent = '';
        uxScoreElem.textContent = 'N/A';
        uxDescriptionElem.textContent = '';
        domainAuthorityElem.textContent = 'N/A';
        domainAuthorityDescElem.textContent = '';
        securityScoreElem.textContent = 'N/A';
        securityDescriptionElem.textContent = '';


        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: url })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || translations.error_analysis_failed);
            }

            const data = await response.json(); // استلام البيانات كـ JSON

            // تحديث الواجهة بالنتائج المستلمة
            analyzedUrlDisplay.textContent = url;
            seoScoreElem.textContent = data.seo_score || 'N/A';
            seoDescriptionElem.textContent = data.seo_description || '';
            speedScoreElem.textContent = data.speed_score || 'N/A';
            speedDescriptionElem.textContent = data.speed_description || '';
            uxScoreElem.textContent = data.ux_score || 'N/A';
            uxDescriptionElem.textContent = data.ux_description || '';
            domainAuthorityElem.textContent = data.domain_authority || 'N/A';
            domainAuthorityDescElem.textContent = data.domain_authority_desc || '';
            securityScoreElem.textContent = data.security_score || 'N/A';
            securityDescriptionElem.textContent = data.security_description || '';
            
            resultsSection.style.display = 'block'; // إظهار قسم النتائج
            exportPdfBtn.style.display = 'block'; // إظهار زر PDF

            // استدعاء وظيفة توليد الملخص بالذكاء الاصطناعي
            generateAISummary(data, currentLang);


        } catch (error) {
            console.error('Error during analysis:', error);
            showErrorMessage(error.message || translations.error_analysis_failed);
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
